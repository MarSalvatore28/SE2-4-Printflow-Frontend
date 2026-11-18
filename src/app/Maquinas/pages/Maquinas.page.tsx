import { useEffect, useMemo, useState } from 'react';
import { BuscadorInteligente } from '@components/Shared/BuscadorInteligente';
import ModalConfirmacion from '@components/Shared/ModalConfirmacion';
import ModalAdvertencia from '@components/Shared/ModalAdvertencia';
import MaquinaList from '@app/Maquinas/components/MaquinaList';
import MaquinaForm from '@app/Maquinas/components/MaquinaForm';
import {
    fetchAllMaquinas,
    searchMaquinas,
    createMaquina,
    updateMaquina,
    setMaquinaActiva,
    fetchModelos,
    createModelo,
    fetchTiposImpresion,
    fetchFormatosImpresion
} from '@services/Maquinas/maquinas.service';
import type {
    Maquina,
    MaquinaFormData,
    Modelo,
    TipoImpresion,
    FormatoImpresion
} from '@models/Maquina/maquina.types';

type Tab = 'listar' | 'formulario';

const mensajeDe = (err: unknown, porDefecto: string) =>
    err instanceof Error && err.message ? err.message : porDefecto;

// Cada palabra del término debe aparecer en la serie, el modelo, la IP, el cliente o el área.
const coincide = (m: Maquina, termino: string) => {
    const texto = [m.serie, m.modelo, m.ip, m.cliente_nombre, m.area_nombre]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return termino.toLowerCase().split(/\s+/).filter(Boolean).every(p => texto.includes(p));
};

const MaquinasPage = () => {
    const [activeTab, setActiveTab] = useState<Tab>('listar');

    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [modelos, setModelos] = useState<Modelo[]>([]);
    const [tipos, setTipos] = useState<TipoImpresion[]>([]);
    const [formatos, setFormatos] = useState<FormatoImpresion[]>([]);

    const [loading, setLoading] = useState(true);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);

    const [filtroId, setFiltroId] = useState<number | null>(null);
    const [filtroTermino, setFiltroTermino] = useState('');
    const [mostrarInactivas, setMostrarInactivas] = useState(false);
    const [buscadorKey, setBuscadorKey] = useState(0);

    const [editando, setEditando] = useState<Maquina | null>(null);
    const [formKey, setFormKey] = useState(0);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState<string | null>(null);

    // Los modales guardan su contenido al cerrarse para que no cambie durante la animación.
    const [exito, setExito] = useState({ abierto: false, mensaje: '' });
    const [confirmar, setConfirmar] = useState<{ abierto: boolean; maquina: Maquina | null }>({ abierto: false, maquina: null });
    const [advertencia, setAdvertencia] = useState({ abierto: false, titulo: '', mensaje: '' });

    useEffect(() => {
        let cancelado = false;
        (async () => {
            try {
                const [listaMaquinas, listaModelos, listaTipos, listaFormatos] = await Promise.all([
                    fetchAllMaquinas(),
                    fetchModelos(),
                    fetchTiposImpresion(),
                    fetchFormatosImpresion()
                ]);
                if (cancelado) return;
                setMaquinas(listaMaquinas);
                setModelos(listaModelos);
                setTipos(listaTipos);
                setFormatos(listaFormatos);
            } catch (err) {
                if (!cancelado) setErrorCarga(mensajeDe(err, 'Error al cargar las máquinas. Intente de nuevo.'));
            } finally {
                if (!cancelado) setLoading(false);
            }
        })();
        return () => { cancelado = true; };
    }, []);

    const recargarMaquinas = async () => {
        setLoading(true);
        try {
            setMaquinas(await fetchAllMaquinas());
            setErrorCarga(null);
        } catch (err) {
            setErrorCarga(mensajeDe(err, 'Error al cargar las máquinas. Intente de nuevo.'));
        } finally {
            setLoading(false);
        }
    };

    const reemplazarEnLista = (actualizada: Maquina) => {
        setMaquinas(prev => prev.map(m => (m.id_maquina === actualizada.id_maquina ? actualizada : m)));
    };

    const maquinasVisibles = useMemo(() => maquinas.filter(m => {
        if (filtroId) return m.id_maquina === filtroId;
        if (!mostrarInactivas && !m.activo) return false;
        if (filtroTermino) return coincide(m, filtroTermino);
        return true;
    }), [maquinas, filtroId, filtroTermino, mostrarInactivas]);

    const totales = useMemo(() => ({
        activas: maquinas.filter(m => m.activo).length,
        asignadas: maquinas.filter(m => m.asignada).length,
        inactivas: maquinas.filter(m => !m.activo).length
    }), [maquinas]);

    const limpiarFiltros = () => {
        setFiltroId(null);
        setFiltroTermino('');
        setBuscadorKey(k => k + 1);
    };

    // --- Formulario ---

    const abrirNueva = () => {
        setEditando(null);
        setErrorForm(null);
        setFormKey(k => k + 1);
        setActiveTab('formulario');
    };

    const abrirEdicion = (maquina: Maquina) => {
        setEditando(maquina);
        setErrorForm(null);
        setFormKey(k => k + 1);
        setActiveTab('formulario');
    };

    const cancelarFormulario = () => {
        setEditando(null);
        setErrorForm(null);
        setActiveTab('listar');
    };

    const guardar = async (datos: MaquinaFormData) => {
        setGuardando(true);
        setErrorForm(null);
        try {
            if (editando) {
                const actualizada = await updateMaquina(editando.id_maquina, datos);
                reemplazarEnLista(actualizada);
                setExito({ abierto: true, mensaje: `Máquina ${actualizada.serie} actualizada correctamente` });
            } else {
                const nueva = await createMaquina(datos);
                setMaquinas(prev => [...prev, nueva].sort((a, b) => a.serie.localeCompare(b.serie)));
                setExito({ abierto: true, mensaje: `Máquina ${nueva.serie} creada correctamente` });
            }
        } catch (err) {
            setErrorForm(mensajeDe(err, 'No se pudo guardar la máquina'));
        } finally {
            setGuardando(false);
        }
    };

    const cerrarExito = () => {
        setExito(prev => ({ ...prev, abierto: false }));
        setEditando(null);
        setActiveTab('listar');
    };

    const crearNuevoModelo = async (nombre: string) => {
        const modelo = await createModelo(nombre);
        setModelos(prev => [...prev, modelo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        return modelo;
    };

    // --- Activar / desactivar ---

    const confirmarCambioEstado = async () => {
        const { maquina } = confirmar;
        if (!maquina) return;
        const activar = !maquina.activo;
        setAviso(null);
        try {
            const actualizada = await setMaquinaActiva(maquina.id_maquina, activar);
            reemplazarEnLista(actualizada);
            setAviso(`Máquina ${actualizada.serie} ${activar ? 'activada' : 'desactivada'} correctamente`);
        } catch (err) {
            setAdvertencia({
                abierto: true,
                titulo: activar ? 'No se pudo activar la máquina' : 'No se pudo desactivar la máquina',
                mensaje: mensajeDe(err, 'Error al cambiar el estado de la máquina')
            });
        }
    };

    const tabClass = (activa: boolean) =>
        `px-6 py-2 rounded-md transition-all ${activa
            ? 'bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium'
            : 'text-gray-500 hover:text-gray-800'}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Máquinas</h1>

            <div className="flex border-b border-gray-100 p-2 gap-4">
                <button onClick={() => setActiveTab('listar')} className={tabClass(activeTab === 'listar')}>
                    Listar
                </button>
                <button onClick={abrirNueva} className={tabClass(activeTab === 'formulario')}>
                    {activeTab === 'formulario' && editando ? 'Editar Máquina' : 'Agregar'}
                </button>
            </div>

            <div className="p-8 min-h-[400px]">
                {activeTab === 'formulario' ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editando ? `Editar máquina ${editando.serie}` : 'Nueva Máquina'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {editando
                                    ? 'Modifica la serie, el modelo o el tipo de impresión.'
                                    : 'La serie se guarda en mayúsculas y sin espacios. Si el modelo no existe, puedes crearlo aquí.'}
                            </p>
                        </div>

                        <hr className="border-gray-200 mb-8" />

                        <MaquinaForm
                            key={formKey}
                            maquina={editando}
                            modelos={modelos}
                            tipos={tipos}
                            formatos={formatos}
                            isSubmitting={guardando}
                            errorApi={errorForm}
                            onSave={guardar}
                            onCancel={cancelarFormulario}
                            onCrearModelo={crearNuevoModelo}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Buscar máquina (serie, modelo o IP)
                                </label>
                                <BuscadorInteligente<Maquina>
                                    key={buscadorKey}
                                    placeholder="Ej: SIMA0001, Ricoh, 10.20.1.11..."
                                    buscarFn={searchMaquinas}
                                    itemsCompletos={maquinas}
                                    getItemKey={(m) => m.id_maquina}
                                    getItemLabel={(m) => m.serie}
                                    onSeleccionar={(m) => {
                                        setFiltroId(m.id_maquina);
                                        setFiltroTermino('');
                                    }}
                                    onEnter={(t) => { setFiltroId(null); setFiltroTermino(t.trim()); }}
                                    onSearchClick={(t) => { setFiltroId(null); setFiltroTermino(t.trim()); }}
                                    onClear={() => { setFiltroId(null); setFiltroTermino(''); }}
                                    onInputChange={() => { if (filtroId) setFiltroId(null); }}
                                    renderItem={(m) => (
                                        <div className="flex flex-col py-1">
                                            <span className="font-semibold text-gray-900 text-sm font-mono">{m.serie}</span>
                                            <span className="text-xs text-gray-500">
                                                {m.modelo || 'Sin modelo'}
                                                {m.ip ? ` · ${m.ip}` : ''}
                                                {m.cliente_nombre ? ` · ${m.cliente_nombre}` : ''}
                                                {!m.activo ? ' · Inactiva' : ''}
                                            </span>
                                        </div>
                                    )}
                                />
                            </div>

                            <div className="flex items-center h-[42px] px-4 bg-white rounded-lg border border-gray-300">
                                <input
                                    id="mostrarInactivas"
                                    type="checkbox"
                                    checked={mostrarInactivas}
                                    onChange={(e) => setMostrarInactivas(e.target.checked)}
                                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                                />
                                <label htmlFor="mostrarInactivas" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
                                    Mostrar inactivas
                                </label>
                            </div>

                            <button
                                onClick={() => { limpiarFiltros(); recargarMaquinas(); }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium h-[42px]"
                            >
                                Ver todas
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <span><span className="font-semibold text-gray-900">{totales.activas}</span> activas</span>
                            <span>·</span>
                            <span><span className="font-semibold text-gray-900">{totales.asignadas}</span> con asignación vigente</span>
                            <span>·</span>
                            <span><span className="font-semibold text-gray-900">{totales.inactivas}</span> inactivas</span>
                            {(filtroId || filtroTermino) && (
                                <>
                                    <span>·</span>
                                    <button onClick={limpiarFiltros} className="text-edit hover:underline">Quitar filtro</button>
                                </>
                            )}
                        </div>

                        {aviso && (
                            <div role="status" className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-200 flex justify-between items-center">
                                <span>{aviso}</span>
                                <button onClick={() => setAviso(null)} className="text-green-700 hover:text-green-900 text-sm" aria-label="Cerrar aviso">✕</button>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        ) : errorCarga ? (
                            <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
                                {errorCarga}
                            </div>
                        ) : (
                            <MaquinaList
                                key={`${filtroId ?? ''}|${filtroTermino}|${mostrarInactivas}`}
                                maquinas={maquinasVisibles}
                                onEdit={abrirEdicion}
                                onToggleActive={(m) => setConfirmar({ abierto: true, maquina: m })}
                            />
                        )}
                    </div>
                )}
            </div>

            <ModalConfirmacion
                isOpen={confirmar.abierto}
                onClose={() => setConfirmar(prev => ({ ...prev, abierto: false }))}
                onConfirm={confirmarCambioEstado}
                type={confirmar.maquina?.activo ? 'delete' : 'activate'}
                title={confirmar.maquina?.activo ? '¿Desactivar máquina?' : '¿Activar máquina?'}
                message={confirmar.maquina?.activo
                    ? `¿Deseas desactivar la máquina ${confirmar.maquina?.serie}? Una máquina con asignación vigente no se puede desactivar.`
                    : `¿Deseas activar la máquina ${confirmar.maquina?.serie ?? ''}?`}
                confirmText={confirmar.maquina?.activo ? 'Desactivar' : 'Activar'}
                cancelText="Cancelar"
            />

            <ModalConfirmacion
                isOpen={exito.abierto}
                onClose={cerrarExito}
                onConfirm={cerrarExito}
                title="Éxito"
                message={exito.mensaje}
                type="activate"
                confirmText="Aceptar"
                showCancel={false}
            />

            <ModalAdvertencia
                isOpen={advertencia.abierto}
                onClose={() => setAdvertencia(prev => ({ ...prev, abierto: false }))}
                title={advertencia.titulo}
                message={advertencia.mensaje}
            />
        </div>
    );
};

export default MaquinasPage;

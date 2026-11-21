import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { Plus, RefreshCw, Info } from 'lucide-react';
import ModalConfirmacion from '@components/Shared/ModalConfirmacion';
import ReemplazoForm from '@app/Maquinas/components/ReemplazoForm';
import ReemplazoList from '@app/Maquinas/components/ReemplazoList';
import { fetchAllMaquinas } from '@services/Maquinas/maquinas.service';
import { fetchReemplazos, createReemplazo, fetchTiposCambio, anularReemplazo } from '@services/Maquinas/reemplazos.service';
import type { Maquina } from '@models/Maquina/maquina.types';
import type { Reemplazo, ReemplazoFormData } from '@models/Maquina/reemplazo.types';

interface ReemplazosSeccionProps {
    /** Solo un administrador registra y anula reemplazos; el resto solo los ve */
    puedeRegistrar: boolean;
    /** Avisa a la pantalla de Máquinas que cambiaron las asignaciones */
    onRegistrado: () => void;
}

const mensajeDe = (err: unknown, porDefecto: string) =>
    err instanceof Error && err.message ? err.message : porDefecto;

export const ReemplazosSeccion: FC<ReemplazosSeccionProps> = ({ puedeRegistrar, onRegistrado }) => {
    const [reemplazos, setReemplazos] = useState<Reemplazo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);

    const [filtroPeriodo, setFiltroPeriodo] = useState('');
    const [filtroCliente, setFiltroCliente] = useState('');
    const [filtroSerie, setFiltroSerie] = useState('');

    const [formAbierto, setFormAbierto] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [tipos, setTipos] = useState<string[]>([]);
    const [preparando, setPreparando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState<string | null>(null);
    const [exito, setExito] = useState({ abierto: false, mensaje: '' });

    // Anular un reemplazo registrado por error
    const [aAnular, setAAnular] = useState<Reemplazo | null>(null);
    const [anulandoId, setAnulandoId] = useState<number | null>(null);
    const [resultadoAnulacion, setResultadoAnulacion] = useState({ abierto: false, ok: false, mensaje: '' });

    const cargarReemplazos = useCallback(async () => {
        setCargando(true);
        try {
            setReemplazos(await fetchReemplazos());
            setErrorCarga(null);
        } catch (err) {
            setErrorCarga(mensajeDe(err, 'Error al cargar los reemplazos'));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        let cancelado = false;
        fetchReemplazos()
            .then(lista => { if (!cancelado) { setReemplazos(lista); setErrorCarga(null); } })
            .catch(err => { if (!cancelado) setErrorCarga(mensajeDe(err, 'Error al cargar los reemplazos')); })
            .finally(() => { if (!cancelado) setCargando(false); });
        return () => { cancelado = true; };
    }, []);

    // Al abrir el formulario se leen de nuevo las máquinas: la saliente debe estar asignada y la entrante libre AHORA
    const abrirFormulario = async () => {
        setPreparando(true);
        setErrorForm(null);
        try {
            const [lista, listaTipos] = await Promise.all([fetchAllMaquinas(), tipos.length ? Promise.resolve(tipos) : fetchTiposCambio()]);
            setMaquinas(lista);
            setTipos(listaTipos);
            setFormKey(k => k + 1);
            setFormAbierto(true);
        } catch (err) {
            setErrorCarga(mensajeDe(err, 'No se pudieron cargar las máquinas'));
        } finally {
            setPreparando(false);
        }
    };

    const guardar = async (datos: ReemplazoFormData) => {
        setGuardando(true);
        setErrorForm(null);
        try {
            const nuevo = await createReemplazo(datos);
            setReemplazos(prev => [nuevo, ...prev]);
            setExito({
                abierto: true,
                mensaje: `Reemplazo registrado: ${nuevo.saliente_serie} quedó retirada y ${nuevo.entrante_serie} asignada en ${nuevo.cliente_nombre} · ${nuevo.area_nombre}. El consumo de ${nuevo.periodo_afectado} sumará las dos máquinas al aprobar el lote.`
            });
            onRegistrado();
        } catch (err) {
            setErrorForm(mensajeDe(err, 'No se pudo registrar el reemplazo'));
        } finally {
            setGuardando(false);
        }
    };

    const anular = async (reemplazo: Reemplazo, motivo?: string) => {
        setAnulandoId(reemplazo.id_maquina_cambio);
        try {
            await anularReemplazo(reemplazo.id_maquina_cambio, motivo);
            // El listado no trae los anulados
            setReemplazos(prev => prev.filter(r => r.id_maquina_cambio !== reemplazo.id_maquina_cambio));
            setResultadoAnulacion({
                abierto: true,
                ok: true,
                mensaje: `Reemplazo anulado: ${reemplazo.saliente_serie} vuelve a estar asignada en ${reemplazo.cliente_nombre} · ${reemplazo.area_nombre} y ${reemplazo.entrante_serie} quedó libre.`
            });
            onRegistrado();
        } catch (err) {
            setResultadoAnulacion({ abierto: true, ok: false, mensaje: mensajeDe(err, 'No se pudo anular el reemplazo') });
        } finally {
            setAnulandoId(null);
        }
    };

    const cerrarResultadoAnulacion = () => setResultadoAnulacion(prev => ({ ...prev, abierto: false }));

    const cerrarExito = () => {
        setExito(prev => ({ ...prev, abierto: false }));
        setFormAbierto(false);
    };

    const clientes = useMemo(() => {
        const mapa = new Map<number, string>();
        reemplazos.forEach(r => mapa.set(r.cliente_id, r.cliente_nombre));
        return [...mapa].sort((a, b) => a[1].localeCompare(b[1]));
    }, [reemplazos]);

    const visibles = useMemo(() => {
        const serie = filtroSerie.trim().toUpperCase();
        return reemplazos.filter(r =>
            (!filtroPeriodo || r.periodo_afectado === filtroPeriodo) &&
            (!filtroCliente || String(r.cliente_id) === filtroCliente) &&
            (!serie || r.saliente_serie.includes(serie) || r.entrante_serie.includes(serie))
        );
    }, [reemplazos, filtroPeriodo, filtroCliente, filtroSerie]);

    const hayFiltros = Boolean(filtroPeriodo || filtroCliente || filtroSerie);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Reemplazos de máquinas</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Cuando una impresora se daña y se cambia por otra, el consolidado del período suma el consumo de las dos.
                    </p>
                </div>
                {puedeRegistrar && !formAbierto && (
                    <button type="button" onClick={abrirFormulario} disabled={preparando}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium disabled:opacity-50">
                        <Plus className="w-4 h-4" /> {preparando ? 'Cargando...' : 'Registrar reemplazo'}
                    </button>
                )}
            </div>

            {!puedeRegistrar && (
                <div role="note" className="flex items-start gap-2 p-3 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 text-sm">
                    <Info className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                    Solo un administrador puede registrar o anular reemplazos. Aquí puede consultar los registrados.
                </div>
            )}

            {formAbierto && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-8">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Nuevo reemplazo</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Se retira la asignación de la saliente (fecha de retiro = fecha del daño) y la entrante queda asignada en la misma área, contrato e IP.
                        </p>
                    </div>
                    <hr className="border-gray-200 mb-8" />
                    <ReemplazoForm
                        key={formKey}
                        maquinas={maquinas}
                        tipos={tipos}
                        isSubmitting={guardando}
                        errorApi={errorForm}
                        onSave={guardar}
                        onCancel={() => { setFormAbierto(false); setErrorForm(null); }}
                    />
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="w-full md:w-48">
                    <label htmlFor="filtro-reemplazo-periodo" className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                    <input id="filtro-reemplazo-periodo" type="month" value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 h-[42px] bg-white" />
                </div>
                <div className="w-full md:w-64">
                    <label htmlFor="filtro-reemplazo-cliente" className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                    <select id="filtro-reemplazo-cliente" value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 h-[42px] bg-white">
                        <option value="">Todos</option>
                        {clientes.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
                    </select>
                </div>
                <div className="flex-1 w-full">
                    <label htmlFor="filtro-reemplazo-serie" className="block text-sm font-medium text-gray-700 mb-2">Serie (saliente o entrante)</label>
                    <input id="filtro-reemplazo-serie" type="text" value={filtroSerie} onChange={(e) => setFiltroSerie(e.target.value)}
                        placeholder="Ej: SIMB0002" className="w-full rounded-md border border-gray-300 px-3 py-2 h-[42px] bg-white font-mono" />
                </div>
                {hayFiltros && (
                    <button type="button" onClick={() => { setFiltroPeriodo(''); setFiltroCliente(''); setFiltroSerie(''); }}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium h-[42px]">
                        Quitar filtros
                    </button>
                )}
                <button type="button" onClick={cargarReemplazos} title="Actualizar"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium h-[42px]">
                    <RefreshCw className="w-4 h-4" /> Actualizar
                </button>
            </div>

            {cargando ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : errorCarga ? (
                <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">{errorCarga}</div>
            ) : (
                <ReemplazoList
                    reemplazos={visibles}
                    onAnular={puedeRegistrar ? setAAnular : undefined}
                    anulandoId={anulandoId}
                />
            )}

            <ModalConfirmacion
                isOpen={exito.abierto}
                onClose={cerrarExito}
                onConfirm={cerrarExito}
                title="Reemplazo registrado"
                message={exito.mensaje}
                type="activate"
                confirmText="Aceptar"
                showCancel={false}
            />

            <ModalConfirmacion
                isOpen={aAnular !== null}
                onClose={() => setAAnular(null)}
                onConfirm={(motivo) => { if (aAnular) void anular(aAnular, motivo); }}
                title="Anular reemplazo"
                message={aAnular ? (
                    <>
                        <p>
                            ¿Anular el reemplazo de <strong className="font-mono">{aAnular.saliente_serie}</strong> por <strong className="font-mono">{aAnular.entrante_serie}</strong> en {aAnular.cliente_nombre} · {aAnular.area_nombre} ({aAnular.periodo_afectado})?
                        </p>
                        <p className="mt-2 text-sm">
                            {aAnular.saliente_serie} vuelve a su asignación, {aAnular.entrante_serie} queda libre y se borran los contadores del cambio. No se puede deshacer.
                        </p>
                    </>
                ) : ''}
                type="delete"
                confirmText="Anular"
                cancelText="Cancelar"
                showInput
                inputPlaceholder="Motivo de la anulación (opcional)"
            />

            <ModalConfirmacion
                isOpen={resultadoAnulacion.abierto}
                onClose={cerrarResultadoAnulacion}
                onConfirm={cerrarResultadoAnulacion}
                title={resultadoAnulacion.ok ? 'Reemplazo anulado' : 'No se pudo anular el reemplazo'}
                message={resultadoAnulacion.mensaje}
                type={resultadoAnulacion.ok ? 'activate' : 'warning'}
                confirmText="Aceptar"
                showCancel={false}
            />
        </div>
    );
};

export default ReemplazosSeccion;

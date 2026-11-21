import { useEffect, useMemo, useState } from 'react';
import { BuscadorInteligente } from '@components/Shared/BuscadorInteligente';
import ModalConfirmacion from '@components/Shared/ModalConfirmacion';
import ModalAdvertencia from '@components/Shared/ModalAdvertencia';
import UsuarioList from '@app/Usuarios/components/UsuarioList';
import UsuarioForm from '@app/Usuarios/components/UsuarioForm';
import { useAuth } from '@context/AuthContext';
import { etiquetaRol } from '@utils/permisos';
import {
    fetchUsuarios,
    fetchRoles,
    createUsuario,
    updateUsuario,
    setUsuarioActivo
} from '@services/Usuarios/usuarios.service';
import type { RolUsuario, Usuario, UsuarioFormData } from '@models/Usuario/usuario.types';

type Tab = 'listar' | 'formulario';

const mensajeDe = (err: unknown, porDefecto: string) =>
    err instanceof Error && err.message ? err.message : porDefecto;

const nombreCompleto = (u: Usuario) => [u.nombre, u.apellido].filter(Boolean).join(' ');

// Cada palabra del término debe aparecer en el nombre, el correo o el rol.
const coincide = (u: Usuario, termino: string) => {
    const texto = [u.nombre, u.apellido, u.email, u.rol, etiquetaRol(u.rol)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return termino.toLowerCase().split(/\s+/).filter(Boolean).every(p => texto.includes(p));
};

const ordenar = (lista: Usuario[]) =>
    [...lista].sort((a, b) => Number(b.activo) - Number(a.activo) || nombreCompleto(a).localeCompare(nombreCompleto(b)));

// Gestión de usuarios y roles (S4-03). Solo admin: el menú y PermisoRuta la ocultan a los demás roles.
const UsuariosPage = () => {
    const { user } = useAuth();
    const idSesion = user?.id ?? user?.id_usuario ?? null;

    const [activeTab, setActiveTab] = useState<Tab>('listar');
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<RolUsuario[]>([]);

    const [loading, setLoading] = useState(true);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);

    const [filtroId, setFiltroId] = useState<number | null>(null);
    const [filtroTermino, setFiltroTermino] = useState('');
    const [mostrarInactivos, setMostrarInactivos] = useState(true);
    const [buscadorKey, setBuscadorKey] = useState(0);

    const [editando, setEditando] = useState<Usuario | null>(null);
    const [formKey, setFormKey] = useState(0);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState<string | null>(null);

    // Los modales guardan su contenido al cerrarse para que no cambie durante la animación.
    const [exito, setExito] = useState({ abierto: false, mensaje: '' });
    const [confirmar, setConfirmar] = useState<{ abierto: boolean; usuario: Usuario | null }>({ abierto: false, usuario: null });
    const [advertencia, setAdvertencia] = useState({ abierto: false, titulo: '', mensaje: '' });

    useEffect(() => {
        let cancelado = false;
        void (async () => {
            try {
                const [listaUsuarios, listaRoles] = await Promise.all([fetchUsuarios(), fetchRoles()]);
                if (cancelado) return;
                setUsuarios(ordenar(listaUsuarios));
                setRoles(listaRoles);
            } catch (err) {
                if (!cancelado) setErrorCarga(mensajeDe(err, 'Error al cargar los usuarios. Intente de nuevo.'));
            } finally {
                if (!cancelado) setLoading(false);
            }
        })();
        return () => { cancelado = true; };
    }, []);

    const recargarUsuarios = async () => {
        setLoading(true);
        try {
            setUsuarios(ordenar(await fetchUsuarios()));
            setErrorCarga(null);
        } catch (err) {
            setErrorCarga(mensajeDe(err, 'Error al cargar los usuarios. Intente de nuevo.'));
        } finally {
            setLoading(false);
        }
    };

    const reemplazarEnLista = (actualizado: Usuario) => {
        setUsuarios(prev => ordenar(prev.map(u => (u.id_usuario === actualizado.id_usuario ? actualizado : u))));
    };

    const usuariosVisibles = useMemo(() => usuarios.filter(u => {
        if (filtroId) return u.id_usuario === filtroId;
        if (!mostrarInactivos && !u.activo) return false;
        if (filtroTermino) return coincide(u, filtroTermino);
        return true;
    }), [usuarios, filtroId, filtroTermino, mostrarInactivos]);

    const totales = useMemo(() => ({
        activos: usuarios.filter(u => u.activo).length,
        inactivos: usuarios.filter(u => !u.activo).length,
        porRol: roles.map(r => ({ rol: r.nombre, total: usuarios.filter(u => u.activo && u.rol === r.nombre).length }))
    }), [usuarios, roles]);

    const limpiarFiltros = () => {
        setFiltroId(null);
        setFiltroTermino('');
        setBuscadorKey(k => k + 1);
    };

    // --- Formulario ---

    const abrirNuevo = () => {
        setEditando(null);
        setErrorForm(null);
        setFormKey(k => k + 1);
        setActiveTab('formulario');
    };

    const abrirEdicion = (usuario: Usuario) => {
        setEditando(usuario);
        setErrorForm(null);
        setFormKey(k => k + 1);
        setActiveTab('formulario');
    };

    const cancelarFormulario = () => {
        setEditando(null);
        setErrorForm(null);
        setActiveTab('listar');
    };

    const guardar = async (datos: UsuarioFormData) => {
        setGuardando(true);
        setErrorForm(null);
        try {
            if (editando) {
                const actualizado = await updateUsuario(editando.id_usuario, datos);
                reemplazarEnLista(actualizado);
                setExito({
                    abierto: true,
                    mensaje: datos.password
                        ? `Usuario ${actualizado.email} actualizado. La nueva contraseña ya está vigente.`
                        : `Usuario ${actualizado.email} actualizado correctamente`
                });
            } else {
                const nuevo = await createUsuario(datos);
                setUsuarios(prev => ordenar([...prev, nuevo]));
                setExito({ abierto: true, mensaje: `Usuario ${nuevo.email} creado correctamente. Ya puede iniciar sesión.` });
            }
        } catch (err) {
            setErrorForm(mensajeDe(err, 'No se pudo guardar el usuario'));
        } finally {
            setGuardando(false);
        }
    };

    const cerrarExito = () => {
        setExito(prev => ({ ...prev, abierto: false }));
        setEditando(null);
        setActiveTab('listar');
    };

    // --- Activar / desactivar ---

    const confirmarCambioEstado = async () => {
        const { usuario } = confirmar;
        if (!usuario) return;
        const activar = !usuario.activo;
        setAviso(null);
        try {
            const actualizado = await setUsuarioActivo(usuario.id_usuario, activar);
            reemplazarEnLista(actualizado);
            setAviso(`Usuario ${actualizado.email} ${activar ? 'activado' : 'desactivado'} correctamente`);
        } catch (err) {
            setAdvertencia({
                abierto: true,
                titulo: activar ? 'No se pudo activar el usuario' : 'No se pudo desactivar el usuario',
                mensaje: mensajeDe(err, 'Error al cambiar el estado del usuario')
            });
        }
    };

    const tabClass = (activa: boolean) =>
        `px-3 md:px-6 py-2 rounded-md transition-all ${activa
            ? 'bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium'
            : 'text-gray-500 hover:text-gray-800'}`;

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 mt-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Usuarios</h1>

            <div className="flex flex-wrap border-b border-gray-100 p-2 gap-2 md:gap-4">
                <button onClick={() => setActiveTab('listar')} className={tabClass(activeTab === 'listar')}>
                    Listar
                </button>
                <button onClick={abrirNuevo} className={tabClass(activeTab === 'formulario')}>
                    {activeTab === 'formulario' && editando ? 'Editar Usuario' : 'Agregar'}
                </button>
            </div>

            <div className="py-4 md:p-8 min-h-[400px]">
                {activeTab === 'formulario' ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editando ? `Editar usuario ${editando.email}` : 'Nuevo Usuario'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {editando
                                    ? 'Modifica los datos o el rol. La contraseña solo cambia si escribes una nueva.'
                                    : 'El usuario queda activo y puede iniciar sesión con el correo y la contraseña que definas.'}
                            </p>
                        </div>

                        <hr className="border-gray-200 mb-8" />

                        <UsuarioForm
                            key={formKey}
                            usuario={editando}
                            roles={roles}
                            esUsted={!!editando && editando.id_usuario === idSesion}
                            isSubmitting={guardando}
                            errorApi={errorForm}
                            onSave={guardar}
                            onCancel={cancelarFormulario}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Buscar usuario (nombre, correo o rol)
                                </label>
                                <BuscadorInteligente<Usuario>
                                    key={buscadorKey}
                                    placeholder="Ej: María, operador@printflow.local, auditor..."
                                    buscarFn={async (t) => usuarios.filter(u => coincide(u, t))}
                                    itemsCompletos={usuarios}
                                    getItemKey={(u) => u.id_usuario}
                                    getItemLabel={(u) => u.email}
                                    onSeleccionar={(u) => {
                                        setFiltroId(u.id_usuario);
                                        setFiltroTermino('');
                                    }}
                                    onEnter={(t) => { setFiltroId(null); setFiltroTermino(t.trim()); }}
                                    onSearchClick={(t) => { setFiltroId(null); setFiltroTermino(t.trim()); }}
                                    onClear={() => { setFiltroId(null); setFiltroTermino(''); }}
                                    onInputChange={() => { if (filtroId) setFiltroId(null); }}
                                    renderItem={(u) => (
                                        <div className="flex flex-col py-1">
                                            <span className="font-semibold text-gray-900 text-sm">{nombreCompleto(u)}</span>
                                            <span className="text-xs text-gray-500">
                                                {u.email} · {etiquetaRol(u.rol)}{!u.activo ? ' · Inactivo' : ''}
                                            </span>
                                        </div>
                                    )}
                                />
                            </div>

                            <div className="flex items-center h-[42px] px-4 bg-white rounded-lg border border-gray-300">
                                <input
                                    id="mostrarInactivos"
                                    type="checkbox"
                                    checked={mostrarInactivos}
                                    onChange={(e) => setMostrarInactivos(e.target.checked)}
                                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                                />
                                <label htmlFor="mostrarInactivos" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
                                    Mostrar inactivos
                                </label>
                            </div>

                            <button
                                onClick={() => { limpiarFiltros(); void recargarUsuarios(); }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium h-[42px]"
                            >
                                Ver todos
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <span><span className="font-semibold text-gray-900">{totales.activos}</span> activos</span>
                            {totales.porRol.map(({ rol, total }) => (
                                <span key={rol}>· <span className="font-semibold text-gray-900">{total}</span> {etiquetaRol(rol).toLowerCase()}</span>
                            ))}
                            <span>·</span>
                            <span><span className="font-semibold text-gray-900">{totales.inactivos}</span> inactivos</span>
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
                            <UsuarioList
                                key={`${filtroId ?? ''}|${filtroTermino}|${mostrarInactivos}`}
                                usuarios={usuariosVisibles}
                                idSesion={idSesion}
                                onEdit={abrirEdicion}
                                onToggleActive={(u) => setConfirmar({ abierto: true, usuario: u })}
                            />
                        )}
                    </div>
                )}
            </div>

            <ModalConfirmacion
                isOpen={confirmar.abierto}
                onClose={() => setConfirmar(prev => ({ ...prev, abierto: false }))}
                onConfirm={confirmarCambioEstado}
                type={confirmar.usuario?.activo ? 'delete' : 'activate'}
                title={confirmar.usuario?.activo ? '¿Desactivar usuario?' : '¿Activar usuario?'}
                message={confirmar.usuario?.activo
                    ? `¿Deseas desactivar a ${confirmar.usuario ? nombreCompleto(confirmar.usuario) : ''} (${confirmar.usuario?.email})? No podrá iniciar sesión y su sesión abierta se cerrará en su próxima acción.`
                    : `¿Deseas activar a ${confirmar.usuario ? nombreCompleto(confirmar.usuario) : ''} (${confirmar.usuario?.email ?? ''})? Podrá volver a iniciar sesión.`}
                confirmText={confirmar.usuario?.activo ? 'Desactivar' : 'Activar'}
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

export default UsuariosPage;

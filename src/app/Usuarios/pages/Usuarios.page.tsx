import { useEffect, useMemo, useState } from 'react';
import { BuscadorInteligente } from '@components/Shared/BuscadorInteligente';
import ModalConfirmacion from '@components/Shared/ModalConfirmacion';
import ModalAdvertencia from '@components/Shared/ModalAdvertencia';
import UsuarioList from '@app/Usuarios/components/UsuarioList';
import UsuarioForm from '@app/Usuarios/components/UsuarioForm';
import { useAuth } from '@context/AuthContext';
import { etiquetaRol } from '@utils/permisos';
import { clasePestana } from '@utils/pestanas';
import { coincide, nombreCompleto, ordenar, textosCambioEstado } from '@app/Usuarios/utils/usuarios';
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

const EncabezadoFormulario = ({ editando }: { editando: Usuario | null }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">
            {editando ? `Editar usuario ${editando.email}` : 'Nuevo usuario'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
            {editando
                ? 'Modifica los datos o el rol. La contraseña solo cambia si escribes una nueva.'
                : 'El usuario queda activo y puede iniciar sesión con el correo y la contraseña que definas.'}
        </p>
    </div>
);

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

    const textosEstado = textosCambioEstado(confirmar.usuario);

    // Lista: cargando, el error o los usuarios
    const renderLista = () => {
        if (loading) {
            return (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            );
        }
        if (errorCarga) {
            return (
                <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
                    {errorCarga}
                </div>
            );
        }
        return (
            <UsuarioList
                key={`${filtroId ?? ''}|${filtroTermino}|${mostrarInactivos}`}
                usuarios={usuariosVisibles}
                idSesion={idSesion}
                onEdit={abrirEdicion}
                onToggleActive={(u) => setConfirmar({ abierto: true, usuario: u })}
            />
        );
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 mt-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de usuarios</h1>

            <div className="flex flex-wrap border-b border-gray-100 p-2 gap-2 md:gap-4">
                <button onClick={() => setActiveTab('listar')} className={clasePestana(activeTab === 'listar')}>
                    Listar
                </button>
                <button onClick={abrirNuevo} className={clasePestana(activeTab === 'formulario')}>
                    {activeTab === 'formulario' && editando ? 'Editar usuario' : 'Agregar'}
                </button>
            </div>

            <div className="py-4 md:p-8 min-h-[400px]">
                {activeTab === 'formulario' ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-8">
                        <EncabezadoFormulario editando={editando} />

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
                                <label htmlFor="buscar-usuario" className="block text-sm font-medium text-gray-700 mb-2">
                                    Buscar usuario (nombre, correo o rol)
                                </label>
                                <BuscadorInteligente<Usuario>
                                    inputId="buscar-usuario"
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
                            <output className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-200 flex justify-between items-center">
                                <span>{aviso}</span>
                                <button onClick={() => setAviso(null)} className="text-green-700 hover:text-green-900 text-sm" aria-label="Cerrar aviso">✕</button>
                            </output>
                        )}

                        {renderLista()}
                    </div>
                )}
            </div>

            <ModalConfirmacion
                isOpen={confirmar.abierto}
                onClose={() => setConfirmar(prev => ({ ...prev, abierto: false }))}
                onConfirm={confirmarCambioEstado}
                type={textosEstado.type}
                title={textosEstado.title}
                message={textosEstado.message}
                confirmText={textosEstado.confirmText}
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

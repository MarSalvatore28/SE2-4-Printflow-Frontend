import { useState, type FC } from 'react';
import { Power, CheckCircle } from 'lucide-react';
import DataTable from '@components/Shared/DataTable';
import { Paginacion } from '@components/Shared/Paginacion';
import { etiquetaRol } from '@utils/permisos';
import type { Usuario } from '@models/Usuario/usuario.types';

interface UsuarioListProps {
    usuarios: Usuario[];
    // id del usuario de la sesión: no puede desactivarse a sí mismo
    idSesion: number | null;
    onEdit: (usuario: Usuario) => void;
    onToggleActive: (usuario: Usuario) => void;
}

const POR_PAGINA = 10;

const COLOR_ROL: Record<string, string> = {
    admin: 'bg-primary text-white',
    operador: 'bg-edit text-white',
    auditor: 'bg-gray-500 text-white',
};

export const UsuarioList: FC<UsuarioListProps> = ({ usuarios, idSesion, onEdit, onToggleActive }) => {
    const [pagina, setPagina] = useState(1);

    const totalPaginas = Math.max(1, Math.ceil(usuarios.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const indiceInicio = (paginaActual - 1) * POR_PAGINA;
    const indiceFin = indiceInicio + POR_PAGINA;

    const columns = [
        {
            key: 'nombre',
            label: 'Nombre',
            render: (u: Usuario) => (
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{[u.nombre, u.apellido].filter(Boolean).join(' ')}</span>
                    {u.id_usuario === idSesion && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent/30 text-primary">Usted</span>
                    )}
                </div>
            )
        },
        {
            key: 'email',
            label: 'Correo',
            render: (u: Usuario) => <span className="text-gray-700">{u.email}</span>
        },
        {
            key: 'rol',
            label: 'Rol',
            align: 'center' as const,
            render: (u: Usuario) => (
                <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${COLOR_ROL[u.rol ?? ''] ?? 'bg-gray-200 text-gray-700'}`}
                    title={u.rol_descripcion ?? undefined}
                >
                    {etiquetaRol(u.rol)}
                </span>
            )
        },
        {
            key: 'activo',
            label: 'Estado',
            align: 'center' as const,
            render: (u: Usuario) => (
                u.activo ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Activo</span>
                ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">Inactivo</span>
                )
            )
        }
    ];

    return (
        <div>
            <DataTable<Usuario>
                title={`Usuarios (${usuarios.length})`}
                columns={columns}
                data={usuarios.slice(indiceInicio, indiceFin)}
                rowsPerPage={POR_PAGINA}
                getItemId={(u) => u.id_usuario}
                emptyMessage="No se encontraron usuarios"
                onEdit={onEdit}
                renderAdditionalActions={(u) => {
                    const esUsted = u.id_usuario === idSesion;
                    if (!u.activo) {
                        return (
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleActive(u); }}
                                className="cursor-pointer p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                title="Activar"
                                aria-label={`Activar ${u.email}`}
                            >
                                <CheckCircle size={18} />
                            </button>
                        );
                    }
                    return (
                        <button
                            onClick={(e) => { e.stopPropagation(); if (!esUsted) onToggleActive(u); }}
                            disabled={esUsted}
                            className="cursor-pointer p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-100"
                            title={esUsted ? 'No puede desactivar su propia cuenta' : 'Desactivar'}
                            aria-label={`Desactivar ${u.email}`}
                        >
                            <Power size={18} />
                        </button>
                    );
                }}
            />
            {usuarios.length > POR_PAGINA && (
                <Paginacion
                    paginaActual={paginaActual}
                    totalPaginas={totalPaginas}
                    indiceInicio={indiceInicio}
                    indiceFin={indiceFin}
                    totalItems={usuarios.length}
                    onCambiarPagina={setPagina}
                    nombreEntidad="usuarios"
                />
            )}
        </div>
    );
};

export default UsuarioList;

import { useAuth } from '@context/AuthContext';
import { PERMISOS, etiquetaRol, rolPermitido, type Permiso } from '@utils/permisos';

/**
 * Permisos del usuario de la sesión, para mostrar u ocultar acciones:
 *
 *   const { puedeEditarCatalogos } = usePermisos();
 *   <ClientList onEdit={puedeEditarCatalogos ? handleEdit : undefined} />
 */
export const usePermisos = () => {
    const { user } = useAuth();
    const rol = user?.rol?.nombre ?? null;
    const puede = (permiso: Permiso) => rolPermitido(rol, PERMISOS[permiso]);

    return {
        rol,
        etiquetaRol: etiquetaRol(rol),
        puede,
        // Para las entradas del menú y las rutas (roles?: string[])
        puedeVer: (roles?: readonly string[]) => rolPermitido(rol, roles),
        puedeEditarCatalogos: puede('editarCatalogos'),
        puedeAprobarLotes: puede('aprobarLotes'),
        puedeEliminarNotificaciones: puede('eliminarNotificaciones'),
        puedeGestionarUsuarios: puede('gestionarUsuarios'),
    };
};

export default usePermisos;

// Permisos por rol en la interfaz. Son los MISMOS que exige el backend con requireRole:
// aquí solo sirven para no mostrar botones que darían 403.

export const ROLES = {
    ADMIN: 'admin',
    OPERADOR: 'operador',
    AUDITOR: 'auditor',
} as const;

// Qué roles pueden hacer cada acción
export const PERMISOS = {
    // Crear, editar y desactivar clientes, contratos, áreas, máquinas y asignaciones
    editarCatalogos: [ROLES.ADMIN],
    // Aprobar o rechazar lotes
    aprobarLotes: [ROLES.ADMIN, ROLES.OPERADOR],
    // Eliminar una notificación leída
    eliminarNotificaciones: [ROLES.ADMIN, ROLES.OPERADOR],
    // Pantalla de Usuarios
    gestionarUsuarios: [ROLES.ADMIN],
} as const satisfies Record<string, readonly string[]>;

export type Permiso = keyof typeof PERMISOS;

// Sin lista de roles (o vacía) = lo puede usar cualquier usuario con sesión
export const rolPermitido = (rol: string | null | undefined, roles?: readonly string[]): boolean =>
    !roles || roles.length === 0 || (!!rol && roles.includes(rol));

const ETIQUETAS_ROL: Record<string, string> = {
    [ROLES.ADMIN]: 'Administrador',
    [ROLES.OPERADOR]: 'Operador',
    [ROLES.AUDITOR]: 'Auditor',
};

export const etiquetaRol = (rol: string | null | undefined): string =>
    (rol && ETIQUETAS_ROL[rol]) || rol || 'Sin rol';

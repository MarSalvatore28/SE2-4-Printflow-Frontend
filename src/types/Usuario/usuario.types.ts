// Gestión de usuarios (S4-03). La API nunca devuelve la contraseña.
export interface Usuario {
    id_usuario: number;
    nombre: string;
    apellido: string | null;
    email: string;
    activo: boolean;
    rol_id: number | null;
    rol: string | null;            // nombre del rol: admin, operador o auditor
    rol_descripcion: string | null;
}

export interface RolUsuario {
    id_rol: number;
    nombre: string;
    descripcion: string | null;
}

// password: obligatoria al crear; al editar, vacía = no se cambia
export interface UsuarioFormData {
    nombre: string;
    apellido: string;
    email: string;
    rol_id: number;
    password?: string;
}

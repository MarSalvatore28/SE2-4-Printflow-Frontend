export interface Role {
    id_rol: number;
    nombre: string;
    descripcion: string;
}

export interface User {
    id_usuario: number;
    nombre: string;
    apellido: string | null;
    email: string;
    rol_id: number | null;
    activo: boolean;
    rol: Role | null;
    loginAt?: string;

    nombre_completo?: string;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    usuario: User;
    message?: string;
}

export interface ValidateTokenResponse {
    success: boolean;
    usuario: User;
    message?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

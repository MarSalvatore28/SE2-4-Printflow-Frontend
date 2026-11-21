import type { AuthResponse, LoginCredentials, User, ValidateTokenResponse } from "@models/auth.types";
import { leerPayloadToken } from "@utils/jwtUtils";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const AUTH_URL = `${API_BASE}/api/auth`;

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        let data;
        try {
            data = await response.json();
        } catch {
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
            }
            throw new Error('Error de conexión con el servidor (Respuesta inválida)');
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Error en las credenciales');
        }

        return data;
    } catch (error) {
        console.error("Login error details:", error);
        throw error;
    }
};

export const validateToken = async (): Promise<ValidateTokenResponse> => {
    const token = getToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`${AUTH_URL}/validate-token`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    handleUnauthorized(response);

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Token inválido');
    }

    return data;
};

export const logoutBackend = async (): Promise<void> => {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(`${AUTH_URL}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        handleUnauthorized(response);

    } catch (error) {
        console.error('Error in backend logout:', error);
    }
};

export const saveToken = (token: string) => {
    localStorage.setItem('token', token);
};

export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

export const removeToken = () => {
    localStorage.removeItem('token');
};

export const saveUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

export const removeUser = () => {
    localStorage.removeItem('user');
};

export const logout = () => {
    removeToken();
    removeUser();
};

// Evento de window cuando cambian los datos del usuario guardado (AuthProvider lo escucha)
export const EVENTO_USUARIO = 'printflow:usuario';

/**
 * El backend renueva el token en cada respuesta con el rol y el correo actuales de la base.
 * Si no coinciden con el usuario guardado (el admin le cambió el rol), se actualiza y se avisa:
 * el menú y los botones cambian sin cerrar sesión ni recargar. Devuelve true si cambió algo.
 */
export const sincronizarUsuarioConToken = (token: string): boolean => {
    const payload = leerPayloadToken(token);
    const user = getUser();
    if (!payload || !user || !('rol' in payload)) return false;

    const rolToken = typeof payload.rol === 'string' ? payload.rol : null;
    const emailToken = typeof payload.email === 'string' ? payload.email : user.email;
    if ((user.rol?.nombre ?? null) === rolToken && user.email === emailToken) return false;

    let rol: User['rol'] = null;
    if (rolToken) rol = user.rol?.nombre === rolToken ? user.rol : { id_rol: 0, nombre: rolToken, descripcion: '' };
    saveUser({ ...user, email: emailToken, rol });
    window.dispatchEvent(new Event(EVENTO_USUARIO));
    return true;
};

// Aviso para la pantalla de login cuando la sesión terminó sola (venció o el usuario fue desactivado)
const CLAVE_AVISO_LOGIN = 'aviso-login';
export const AVISO_SESION_TERMINADA = 'Tu sesión terminó: venció por inactividad o fue cerrada. Inicia sesión de nuevo.';

export const avisarSesionTerminada = () => {
    try {
        sessionStorage.setItem(CLAVE_AVISO_LOGIN, AVISO_SESION_TERMINADA);
    } catch {
        // Sin sessionStorage (navegación privada estricta) no hay aviso, pero la sesión igual se cierra
    }
};

export const leerAvisoLogin = (): string | null => {
    try {
        return sessionStorage.getItem(CLAVE_AVISO_LOGIN);
    } catch {
        return null;
    }
};

export const borrarAvisoLogin = () => {
    try {
        sessionStorage.removeItem(CLAVE_AVISO_LOGIN);
    } catch {
        // nada que borrar
    }
};

export const handleUnauthorized = (response: Response) => {
    if (response.status === 401) {
        if (getToken()) avisarSesionTerminada();
        logout();
        window.location.replace('/login');
        throw new Error('Sesión vencida. Inicia sesión nuevamente.');
    }
};
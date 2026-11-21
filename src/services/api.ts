import { getToken, saveToken, handleUnauthorized, sincronizarUsuarioConToken } from './Auth/auth.service';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Usar en los servicios de cada módulo en lugar de fetch directo:
//   const response = await apiFetch('/api/clientes');
// - Agrega el token de la sesión.
// - Si la API responde 401, cierra la sesión y manda a /login.
// - Guarda el token renovado que manda el backend (cabecera X-Nuevo-Token) y, si el rol cambió,
//   actualiza el usuario de la sesión (el menú cambia al instante).
export const apiFetch = async (ruta: string, opciones: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(opciones.headers);
    const token = getToken();

    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (typeof opciones.body === 'string' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${ruta}`, { ...opciones, headers });

    handleUnauthorized(response);

    const nuevoToken = response.headers.get('X-Nuevo-Token');
    if (nuevoToken) {
        saveToken(nuevoToken);
        sincronizarUsuarioConToken(nuevoToken);
    }

    return response;
};

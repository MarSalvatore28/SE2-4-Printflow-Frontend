import type { RolUsuario, Usuario, UsuarioFormData } from '@models/Usuario/usuario.types';
import type { ApiResponse } from '@models/API/response.types';
import { apiFetch } from '@services/api';

const RESOURCE_URL = '/api/usuarios';

/**
 * Lee la respuesta de la API. Si no es correcta, lanza un Error con el
 * mensaje que manda el backend (p. ej. «Ya existe un usuario con ese correo»).
 */
async function leerRespuesta<T>(res: Response, mensajePorDefecto: string): Promise<ApiResponse<T>> {
    let body: ApiResponse<T> | null = null;
    try {
        body = await res.json();
    } catch {
        body = null;
    }
    if (!res.ok || !body?.success) {
        throw new Error(body?.message || `${mensajePorDefecto} (${res.status})`);
    }
    return body;
}

export async function fetchUsuarios(): Promise<Usuario[]> {
    const res = await apiFetch(RESOURCE_URL);
    const body = await leerRespuesta<Usuario[]>(res, 'Error al obtener los usuarios');
    return body.data ?? [];
}

export async function fetchRoles(): Promise<RolUsuario[]> {
    const res = await apiFetch(`${RESOURCE_URL}/roles`);
    const body = await leerRespuesta<RolUsuario[]>(res, 'Error al obtener los roles');
    return body.data ?? [];
}

export async function createUsuario(datos: UsuarioFormData): Promise<Usuario> {
    const res = await apiFetch(RESOURCE_URL, {
        method: 'POST',
        body: JSON.stringify(datos)
    });
    const body = await leerRespuesta<Usuario>(res, 'Error al crear el usuario');
    return body.data as Usuario;
}

export async function updateUsuario(id: number, datos: UsuarioFormData): Promise<Usuario> {
    const res = await apiFetch(`${RESOURCE_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
    });
    const body = await leerRespuesta<Usuario>(res, 'Error al actualizar el usuario');
    return body.data as Usuario;
}

export async function setUsuarioActivo(id: number, activo: boolean): Promise<Usuario> {
    const res = await apiFetch(`${RESOURCE_URL}/${id}/activo`, {
        method: 'PATCH',
        body: JSON.stringify({ activo })
    });
    const body = await leerRespuesta<Usuario>(res, 'Error al cambiar el estado del usuario');
    return body.data as Usuario;
}

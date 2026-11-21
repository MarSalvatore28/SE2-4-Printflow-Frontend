import type {
    Maquina,
    MaquinaFormData,
    Modelo,
    TipoImpresion,
    FormatoImpresion
} from '@models/Maquina/maquina.types';
import type { ApiResponse } from '@models/API/response.types';
import { apiFetch } from '@services/api';

const RESOURCE_URL = '/api/maquinas';

/**
 * Lee la respuesta de la API. Si no es correcta, lanza un Error con el
 * mensaje que manda el backend (p. ej. «Ya existe una máquina con esa serie»).
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

const conId = (m: Omit<Maquina, 'id'>): Maquina => ({ ...m, id: m.id_maquina });

export async function fetchAllMaquinas(): Promise<Maquina[]> {
    const res = await apiFetch(RESOURCE_URL);
    const body = await leerRespuesta<Maquina[]>(res, 'Error al obtener las máquinas');
    return (body.data ?? []).map(conId);
}

export async function searchMaquinas(q: string): Promise<Maquina[]> {
    const termino = q.trim();
    if (!termino) return fetchAllMaquinas();
    const res = await apiFetch(`${RESOURCE_URL}/search?q=${encodeURIComponent(termino)}`);
    const body = await leerRespuesta<Maquina[]>(res, 'Error al buscar máquinas');
    return (body.data ?? []).map(conId);
}

export async function getMaquinaById(id: number): Promise<Maquina> {
    const res = await apiFetch(`${RESOURCE_URL}/${id}`);
    const body = await leerRespuesta<Maquina>(res, 'Error al obtener la máquina');
    return conId(body.data as Maquina);
}

export async function createMaquina(datos: MaquinaFormData): Promise<Maquina> {
    const res = await apiFetch(RESOURCE_URL, {
        method: 'POST',
        body: JSON.stringify(datos)
    });
    const body = await leerRespuesta<Maquina>(res, 'Error al crear la máquina');
    return conId(body.data as Maquina);
}

export async function updateMaquina(id: number, datos: MaquinaFormData): Promise<Maquina> {
    const res = await apiFetch(`${RESOURCE_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
    });
    const body = await leerRespuesta<Maquina>(res, 'Error al actualizar la máquina');
    return conId(body.data as Maquina);
}

export async function setMaquinaActiva(id: number, activo: boolean): Promise<Maquina> {
    const res = await apiFetch(`${RESOURCE_URL}/${id}/activo`, {
        method: 'PATCH',
        body: JSON.stringify({ activo })
    });
    const body = await leerRespuesta<Maquina>(res, 'Error al cambiar el estado de la máquina');
    return conId(body.data as Maquina);
}

export async function fetchModelos(): Promise<Modelo[]> {
    const res = await apiFetch(`${RESOURCE_URL}/modelos`);
    const body = await leerRespuesta<Modelo[]>(res, 'Error al obtener los modelos');
    return body.data ?? [];
}

export async function createModelo(nombre: string): Promise<Modelo> {
    const res = await apiFetch(`${RESOURCE_URL}/modelos`, {
        method: 'POST',
        body: JSON.stringify({ nombre })
    });
    const body = await leerRespuesta<Modelo>(res, 'Error al crear el modelo');
    return body.data as Modelo;
}

export async function fetchTiposImpresion(): Promise<TipoImpresion[]> {
    const res = await apiFetch(`${RESOURCE_URL}/tipos-impresion`);
    const body = await leerRespuesta<TipoImpresion[]>(res, 'Error al obtener los tipos de impresión');
    return body.data ?? [];
}

export async function fetchFormatosImpresion(): Promise<FormatoImpresion[]> {
    const res = await apiFetch(`${RESOURCE_URL}/formatos`);
    const body = await leerRespuesta<FormatoImpresion[]>(res, 'Error al obtener los formatos de impresión');
    return body.data ?? [];
}

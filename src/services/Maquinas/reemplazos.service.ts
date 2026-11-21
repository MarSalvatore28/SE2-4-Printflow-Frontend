import type {
    Reemplazo,
    ReemplazoFormData,
    LecturaAprobada,
    FiltrosReemplazo
} from '@models/Maquina/reemplazo.types';
import type { ApiResponse } from '@models/API/response.types';
import { apiFetch } from '@services/api';

const RESOURCE_URL = '/api/maquinas-cambio';

/**
 * Lee la respuesta de la API. Si no es correcta, lanza un Error con el mensaje
 * que manda el backend (p. ej. «La máquina entrante ya está asignada…»).
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

export async function fetchReemplazos(filtros: FiltrosReemplazo = {}): Promise<Reemplazo[]> {
    const params = new URLSearchParams();
    if (filtros.cliente_id) params.set('cliente_id', String(filtros.cliente_id));
    if (filtros.periodo) params.set('periodo', filtros.periodo);
    if (filtros.maquina_id) params.set('maquina_id', String(filtros.maquina_id));
    const query = params.toString();
    const res = await apiFetch(query ? `${RESOURCE_URL}?${query}` : RESOURCE_URL);
    const body = await leerRespuesta<Reemplazo[]>(res, 'Error al obtener los reemplazos');
    return body.data ?? [];
}

export async function createReemplazo(datos: ReemplazoFormData): Promise<Reemplazo> {
    const res = await apiFetch(RESOURCE_URL, {
        method: 'POST',
        body: JSON.stringify(datos)
    });
    const body = await leerRespuesta<Reemplazo>(res, 'Error al registrar el reemplazo');
    return body.data as Reemplazo;
}

/**
 * Anula un reemplazo registrado por error (solo admin): la saliente vuelve a su asignación y la
 * entrante queda libre. Si el período ya tiene lecturas aprobadas, la API responde 409 y el
 * Error lleva su mensaje.
 */
export async function anularReemplazo(id: number, motivo?: string): Promise<Reemplazo> {
    const texto = motivo?.trim();
    const res = await apiFetch(`${RESOURCE_URL}/${id}/anular`, {
        method: 'POST',
        body: JSON.stringify(texto ? { motivo: texto } : {})
    });
    const body = await leerRespuesta<Reemplazo>(res, 'Error al anular el reemplazo');
    return body.data as Reemplazo;
}

export async function fetchTiposCambio(): Promise<string[]> {
    const res = await apiFetch(`${RESOURCE_URL}/tipos`);
    const body = await leerRespuesta<string[]>(res, 'Error al obtener los tipos de cambio');
    return body.data ?? [];
}

/** Última lectura aprobada de la máquina antes del período (null si no tiene) */
export async function fetchUltimaLectura(maquinaId: number, periodo: string): Promise<LecturaAprobada | null> {
    const res = await apiFetch(`${RESOURCE_URL}/ultima-lectura/${maquinaId}?periodo=${encodeURIComponent(periodo)}`);
    const body = await leerRespuesta<LecturaAprobada | null>(res, 'Error al obtener la última lectura');
    return body.data ?? null;
}

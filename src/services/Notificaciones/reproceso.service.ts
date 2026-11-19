// S3-05 · Reprocesar un reporte del lote que quedó en ERROR (POST /api/staging/:id/reprocesar)
import type { ReporteStaging } from '@app/Notificaciones/types/notificaciones';
import { apiFetch } from '@services/api';

export const MAX_INTENTOS_REPROCESO = 3;

export interface ResultadoReproceso {
    reporte: ReporteStaging;
    intentos: number;
    max_intentos: number;
    intentos_texto: string; // «2 de 3»
    corregido: boolean;
    motivo: string | null; // por qué sigue en error, tal cual lo dice la API
    codigo: string | null;
    aviso: string | null;
}

/** Si la API no reprocesa (409 máximo de intentos, 404…), lanza un Error con su mensaje. */
export async function reprocesarReporte(idStaging: number): Promise<{ message: string; data: ResultadoReproceso }> {
    const res = await apiFetch(`/api/staging/${idStaging}/reprocesar`, { method: 'POST' });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
        throw new Error(body?.message || `No se pudo reprocesar el reporte (${res.status})`);
    }
    return { message: body.message, data: body.data };
}

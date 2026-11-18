// Detalle de un lote: su estado, sus reportes en staging, alertas, validación y
// las acciones de aprobar y rechazar (caja 7, DetalleLoteModal)
import {
  ErrorAprobacion,
  type AlertaLote,
  type AprobarRechazarLoteData,
  type Lote,
  type LoteActionResponse,
  type ReporteStaging,
  type ValidacionLote,
} from '@app/Notificaciones/types/notificaciones';
import { apiFetch } from '@services/api';

const LOTES = '/api/notificaciones/lotes';
const STAGING = '/api/staging';

const mensajeDeError = async (res: Response, porDefecto: string) => {
  const data = await res.json().catch(() => ({}));
  return data.message || `${porDefecto} (${res.status})`;
};

export async function getLote(loteId: number | string): Promise<Lote | null> {
  try {
    const res = await apiFetch(`${LOTES}/${loteId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(await mensajeDeError(res, 'Error al cargar el lote'));
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error('Error getLote:', err);
    throw err;
  }
}

export async function getReportesStagingLote(loteId: number | string): Promise<ReporteStaging[]> {
  try {
    const res = await apiFetch(`${STAGING}/lote/${loteId}/completo`);
    if (!res.ok) throw new Error(await mensajeDeError(res, 'Error al cargar los reportes del lote'));
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error('Error getReportesStagingLote:', err);
    throw err;
  }
}

export async function getAlertasLote(loteId: number | string): Promise<AlertaLote[]> {
  try {
    const res = await apiFetch(`${STAGING}/lotes/${loteId}/alertas`);
    if (!res.ok) throw new Error(await mensajeDeError(res, 'Error al cargar las alertas del lote'));
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error('Error getAlertasLote:', err);
    throw err;
  }
}

export async function validarLote(loteId: number | string): Promise<ValidacionLote> {
  try {
    const res = await apiFetch(`${STAGING}/lote/${loteId}/validar`);
    if (!res.ok) throw new Error(await mensajeDeError(res, 'Error al validar el lote'));
    const data = await res.json();
    return data.success ? data.data : { esValido: false, errores: [] };
  } catch (err) {
    console.error('Error validarLote:', err);
    throw err;
  }
}

// Si la API responde 409, lanza ErrorAprobacion con la lista de errores
export async function aprobarLote(
  loteId: number | string,
  datos: AprobarRechazarLoteData = {}
): Promise<LoteActionResponse> {
  try {
    const res = await apiFetch(`${LOTES}/${loteId}/aprobar`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 409) {
      throw new ErrorAprobacion(data.message || 'No se puede aprobar el lote', data.errores || []);
    }
    if (!res.ok) throw new Error(data.message || `Error al aprobar el lote (${res.status})`);
    return { success: true, message: data.message || 'Lote aprobado correctamente', data: data.data };
  } catch (err) {
    // Un 409 es una respuesta esperada: la pantalla muestra los errores
    if (!(err instanceof ErrorAprobacion)) console.error('Error aprobarLote:', err);
    throw err;
  }
}

export async function rechazarLote(
  loteId: number | string,
  datos: AprobarRechazarLoteData = {}
): Promise<LoteActionResponse> {
  try {
    const res = await apiFetch(`${LOTES}/${loteId}/rechazar`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Error al rechazar el lote (${res.status})`);
    return { success: true, message: data.message || 'Lote rechazado correctamente', data: data.data };
  } catch (err) {
    console.error('Error rechazarLote:', err);
    throw err;
  }
}

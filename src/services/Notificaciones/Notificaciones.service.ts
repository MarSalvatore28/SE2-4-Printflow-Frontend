import {
  ErrorAprobacion,
  type CreateNotificacionData,
  type EstadisticasNotificaciones,
  type Notificacion,
} from '@app/Notificaciones/types/notificaciones';
import { apiFetch } from '@services/api';

// Las notificaciones son globales (la tabla no tiene usuario) y el usuario que
// aprueba o rechaza sale del token: no se manda usuario_id.
const RESOURCE = '/api/notificaciones';

const mensajeDeError = async (res: Response, porDefecto: string) => {
  const data = await res.json().catch(() => ({}));
  return data.message || `${porDefecto} (${res.status})`;
};

const getLista = async (ruta: string, nombre: string): Promise<Notificacion[]> => {
  try {
    const res = await apiFetch(ruta);
    if (!res.ok) throw new Error(await mensajeDeError(res, 'Error al cargar las notificaciones'));
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error(`Error ${nombre}:`, err);
    throw err;
  }
};

export const fetchAllNotificaciones = () => getLista(RESOURCE, 'fetchAllNotificaciones');
export const getNotificacionesNoLeidas = () => getLista(`${RESOURCE}/no-leidas`, 'getNotificacionesNoLeidas');
export const getNotificacionesLeidas = () => getLista(`${RESOURCE}/leidas`, 'getNotificacionesLeidas');
export const getNotificacionesByLote = (loteId: number) =>
  getLista(`${RESOURCE}/lote/${loteId}`, 'getNotificacionesByLote');

export async function getNotificacionById(id: number): Promise<Notificacion | null> {
  try {
    const res = await apiFetch(`${RESOURCE}/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(await mensajeDeError(res, 'Error al cargar la notificación'));
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error('Error getNotificacionById:', err);
    throw err;
  }
}

export async function contarNoLeidas(): Promise<number> {
  try {
    const res = await apiFetch(`${RESOURCE}/contar-no-leidas`);
    if (!res.ok) throw new Error(await mensajeDeError(res, 'Error al contar las notificaciones'));
    const data = await res.json();
    return data.success ? Number(data.data) || 0 : 0;
  } catch (err) {
    console.error('Error contarNoLeidas:', err);
    throw err;
  }
}

export async function getEstadisticasNotificaciones(): Promise<EstadisticasNotificaciones | null> {
  try {
    const res = await apiFetch(`${RESOURCE}/estadisticas`);
    if (!res.ok) throw new Error(await mensajeDeError(res, 'Error al cargar las estadísticas'));
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error('Error getEstadisticasNotificaciones:', err);
    throw err;
  }
}

export async function createNotificacion(notificacion: CreateNotificacionData): Promise<Notificacion | null> {
  try {
    const res = await apiFetch(RESOURCE, { method: 'POST', body: JSON.stringify(notificacion) });
    if (!res.ok) throw new Error(await mensajeDeError(res, 'Error al crear la notificación'));
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error('Error createNotificacion:', err);
    throw err;
  }
}

const enviar = async (ruta: string, metodo: string, nombre: string, body?: unknown): Promise<boolean> => {
  try {
    const res = await apiFetch(ruta, {
      method: metodo,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(await mensajeDeError(res, 'La operación no se pudo completar'));
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error(`Error ${nombre}:`, err);
    throw err;
  }
};

export const marcarComoLeida = (id: number) =>
  enviar(`${RESOURCE}/${id}/marcar-leida`, 'PATCH', 'marcarComoLeida');
export const marcarVariasComoLeidas = (ids: number[]) =>
  enviar(`${RESOURCE}/marcar-varias-leidas`, 'PATCH', 'marcarVariasComoLeidas', { ids });
export const marcarTodasComoLeidas = () =>
  enviar(`${RESOURCE}/marcar-todas-leidas`, 'PATCH', 'marcarTodasComoLeidas');
// Solo se pueden eliminar notificaciones ya leídas (la API responde 409 si no)
export const deleteNotificacion = (id: number) =>
  enviar(`${RESOURCE}/${id}`, 'DELETE', 'deleteNotificacion');
export const deleteOldNotificaciones = (dias: number = 30) =>
  enviar(`${RESOURCE}/limpiar-antiguas?dias=${dias}`, 'DELETE', 'deleteOldNotificaciones');

// Aprueba el lote de la notificación. Con 409 lanza ErrorAprobacion (isValidationError y errores)
export async function aprobarNotificacion(id: number, datos: { periodo?: string; fecha_corte?: string } = {}) {
  try {
    const res = await apiFetch(`${RESOURCE}/${id}/aprobar`, { method: 'POST', body: JSON.stringify(datos) });
    const data = await res.json().catch(() => ({}));
    if (res.status === 409) {
      throw new ErrorAprobacion(data.message || 'No se puede aprobar el lote', data.errores || []);
    }
    if (!res.ok) throw new Error(data.message || `Error al aprobar el lote (${res.status})`);
    return data;
  } catch (err) {
    if (!(err instanceof ErrorAprobacion)) console.error('Error aprobarNotificacion:', err);
    throw err;
  }
}

export async function rechazarNotificacion(id: number, motivo?: string) {
  try {
    const res = await apiFetch(`${RESOURCE}/${id}/rechazar`, {
      method: 'POST',
      body: JSON.stringify(motivo ? { motivo } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Error al rechazar el lote (${res.status})`);
    return data;
  } catch (err) {
    console.error('Error rechazarNotificacion:', err);
    throw err;
  }
}

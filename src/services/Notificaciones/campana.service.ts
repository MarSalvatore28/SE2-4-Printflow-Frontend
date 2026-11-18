// Notificaciones para la campana y el NotificationContext (caja 7)
import type { Notificacion } from '@app/Notificaciones/types/notificaciones';
import { apiFetch } from '@services/api';

const RESOURCE = '/api/notificaciones';

// Lee el mensaje de error que manda la API, si lo hay
const mensajeDeError = async (res: Response, porDefecto: string) => {
  const data = await res.json().catch(() => ({}));
  return data.message || `${porDefecto} (${res.status})`;
};

export async function fetchUltimasNotificaciones(limite = 20): Promise<Notificacion[]> {
  try {
    const res = await apiFetch(`${RESOURCE}?limite=${limite}`);
    if (!res.ok) throw new Error(await mensajeDeError(res, 'Error al cargar las notificaciones'));
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error('Error fetchUltimasNotificaciones:', err);
    throw err;
  }
}

export async function fetchContadorNoLeidas(): Promise<number> {
  try {
    const res = await apiFetch(`${RESOURCE}/contar-no-leidas`);
    if (!res.ok) throw new Error(await mensajeDeError(res, 'Error al contar las notificaciones'));
    const data = await res.json();
    return data.success ? Number(data.data) || 0 : 0;
  } catch (err) {
    console.error('Error fetchContadorNoLeidas:', err);
    throw err;
  }
}

export async function marcarNotificacionLeida(id: number): Promise<boolean> {
  try {
    const res = await apiFetch(`${RESOURCE}/${id}/marcar-leida`, { method: 'PATCH' });
    if (!res.ok) throw new Error(await mensajeDeError(res, 'No se pudo marcar la notificación como leída'));
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error('Error marcarNotificacionLeida:', err);
    throw err;
  }
}

export async function marcarTodasNotificacionesLeidas(): Promise<boolean> {
  try {
    const res = await apiFetch(`${RESOURCE}/marcar-todas-leidas`, { method: 'PATCH' });
    if (!res.ok) throw new Error(await mensajeDeError(res, 'No se pudieron marcar las notificaciones como leídas'));
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error('Error marcarTodasNotificacionesLeidas:', err);
    throw err;
  }
}

import type { FiltrosLotes, Lote } from '@app/Notificaciones/types/notificaciones';
import { apiFetch } from '@services/api';

// El antiguo /api/lotes (MySQL) ya no existe: los lotes con su estado los da
// /api/notificaciones/lotes. Aprobar y rechazar están en detalleLote.service.
export { aprobarLote, rechazarLote, getLote as getLoteById } from './detalleLote.service';

const RESOURCE = '/api/notificaciones/lotes';

// Lotes ordenados por fecha de recepción, de la más reciente a la más antigua
export async function fetchLotes(filtros: FiltrosLotes = {}): Promise<Lote[]> {
  try {
    const params = new URLSearchParams();
    if (filtros.estado) params.set('estado', filtros.estado);
    if (filtros.cliente_id) params.set('cliente_id', String(filtros.cliente_id));
    if (filtros.desde) params.set('desde', filtros.desde);
    if (filtros.hasta) params.set('hasta', filtros.hasta);
    const query = params.toString();

    const res = await apiFetch(query ? `${RESOURCE}?${query}` : RESOURCE);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Error al cargar los lotes (${res.status})`);
    }
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error('Error fetchLotes:', err);
    throw err;
  }
}

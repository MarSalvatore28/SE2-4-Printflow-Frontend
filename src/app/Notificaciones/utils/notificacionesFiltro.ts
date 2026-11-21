import type { Lote, Notificacion } from '@app/Notificaciones/types/notificaciones';

// Cada palabra del término debe aparecer en el título, el mensaje, el código del lote o el tipo
export const filtrarNotificaciones = (lista: Notificacion[], termino: string): Notificacion[] => {
  const palabras = termino
    .toLowerCase()
    .split(' ')
    .filter((w) => w.length > 0);
  return lista.filter((notif) =>
    palabras.every(
      (palabra) =>
        notif.titulo?.toLowerCase().includes(palabra) ||
        notif.mensaje?.toLowerCase().includes(palabra) ||
        notif.codigo_lote?.toLowerCase().includes(palabra) ||
        notif.tipo_nombre?.toLowerCase().includes(palabra),
    ),
  );
};

// Solo un lote que sigue en staging (Pendiente o Error) se puede aprobar o rechazar.
// Si no se conoce su estado, se usa la notificación sin leer como antes.
export const loteAccionable = (notif: Notificacion, lotesPorId: Map<number, Lote>): boolean => {
  if (!notif.lote_id) return false;
  const lote = lotesPorId.get(notif.lote_id);
  return lote ? lote.estado === 'PENDIENTE' || lote.estado === 'ERROR' : !notif.leida;
};

// Igual que el backend: la notificación de un lote pendiente o rechazado no se elimina (guarda su
// estado y el motivo del rechazo); sí la de un lote aprobado o la que no tiene lote
export const notificacionEliminable = (notif: Notificacion): boolean =>
  notif.leida && (!notif.lote_id || Boolean(notif.fecha_aprobacion));

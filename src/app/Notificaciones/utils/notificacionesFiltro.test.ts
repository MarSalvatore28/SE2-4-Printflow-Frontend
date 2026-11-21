import { describe, expect, it } from 'vitest';
import type { Lote, Notificacion } from '@app/Notificaciones/types/notificaciones';
import { filtrarNotificaciones, loteAccionable, notificacionEliminable } from './notificacionesFiltro';

const notificacion = (datos: Partial<Notificacion>): Notificacion => ({
  id_notificacion: 1,
  titulo: 'Nuevo lote cargado',
  mensaje: 'Se cargó un lote',
  datos_adicionales: null,
  lote_id: null,
  leida: false,
  fecha_creacion: '2026-11-20T10:00:00Z',
  fecha_lectura: null,
  tipo_notificacion_id: 1,
  ...datos,
});

const lote = (id_lote: number, estado: Lote['estado']) => ({ id_lote, estado }) as Lote;

describe('filtrarNotificaciones', () => {
  const lista = [
    notificacion({ id_notificacion: 1, titulo: 'Nuevo lote cargado', codigo_lote: 'SIM-2026-10-andina' }),
    notificacion({ id_notificacion: 2, titulo: 'Lote aprobado', mensaje: null, tipo_nombre: 'Aprobación' }),
    notificacion({ id_notificacion: 3, titulo: 'Error de lectura', mensaje: 'Contador menor al anterior' }),
  ];

  it('sin término devuelve toda la lista', () => {
    expect(filtrarNotificaciones(lista, '   ')).toHaveLength(3);
  });

  it('busca en título, mensaje, código del lote y tipo sin distinguir mayúsculas', () => {
    expect(filtrarNotificaciones(lista, 'ANDINA').map((n) => n.id_notificacion)).toEqual([1]);
    expect(filtrarNotificaciones(lista, 'aprobación').map((n) => n.id_notificacion)).toEqual([2]);
    expect(filtrarNotificaciones(lista, 'contador').map((n) => n.id_notificacion)).toEqual([3]);
  });

  it('cada palabra debe aparecer en algún campo', () => {
    expect(filtrarNotificaciones(lista, 'lote cargado').map((n) => n.id_notificacion)).toEqual([1]);
    expect(filtrarNotificaciones(lista, 'lote inexistente')).toEqual([]);
  });
});

describe('loteAccionable', () => {
  const lotes = new Map<number, Lote>([
    [10, lote(10, 'PENDIENTE')],
    [11, lote(11, 'ERROR')],
    [12, lote(12, 'PROCESADO')],
    [13, lote(13, 'DESCARTADO')],
  ]);

  it('sin lote no hay acciones', () => {
    expect(loteAccionable(notificacion({ lote_id: null }), lotes)).toBe(false);
  });

  it('solo los lotes en staging (pendiente o error) se pueden aprobar o rechazar', () => {
    expect(loteAccionable(notificacion({ lote_id: 10, leida: true }), lotes)).toBe(true);
    expect(loteAccionable(notificacion({ lote_id: 11, leida: true }), lotes)).toBe(true);
    expect(loteAccionable(notificacion({ lote_id: 12 }), lotes)).toBe(false);
    expect(loteAccionable(notificacion({ lote_id: 13 }), lotes)).toBe(false);
  });

  it('si no se conoce el estado del lote, decide si la notificación está sin leer', () => {
    expect(loteAccionable(notificacion({ lote_id: 99, leida: false }), lotes)).toBe(true);
    expect(loteAccionable(notificacion({ lote_id: 99, leida: true }), lotes)).toBe(false);
  });
});

describe('notificacionEliminable', () => {
  it('solo leídas, y de un lote solo si ya está aprobado', () => {
    expect(notificacionEliminable(notificacion({ leida: false }))).toBe(false);
    expect(notificacionEliminable(notificacion({ leida: true }))).toBe(true);
    expect(notificacionEliminable(notificacion({ leida: true, lote_id: 9, fecha_aprobacion: null }))).toBe(false);
    expect(notificacionEliminable(notificacion({ leida: true, lote_id: 7, fecha_aprobacion: '2026-11-21T16:00:00Z' }))).toBe(true);
  });
});

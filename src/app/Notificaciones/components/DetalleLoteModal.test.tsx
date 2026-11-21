import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorAprobacion, type Lote } from '@app/Notificaciones/types/notificaciones';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const servicio = vi.hoisted(() => ({
  getLote: vi.fn(),
  getReportesStagingLote: vi.fn(),
  getAlertasLote: vi.fn(),
  validarLote: vi.fn(),
  aprobarLote: vi.fn(),
  rechazarLote: vi.fn(),
}));

vi.mock('@services/Notificaciones/detalleLote.service', () => servicio);
vi.mock('@services/Notificaciones/reproceso.service', () => ({ MAX_INTENTOS_REPROCESO: 3, reprocesarReporte: vi.fn() }));
vi.mock('@context/NotificationContext', () => ({ useNotification: () => ({ refresh: async () => undefined }) }));
vi.mock('@hooks/usePermisos', () => ({ usePermisos: () => ({ puedeAprobarLotes: true, etiquetaRol: 'Operador' }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

const { DetalleLoteModal } = await import('./DetalleLoteModal');

const lote = (cambios: Partial<Lote> = {}): Lote => ({
  id_lote: 8,
  codigo_referencia: 'SIM-2026-11-andina',
  periodo: '2026-11',
  fecha_carga: '2026-11-21T16:14:13.779Z',
  fecha_aprobacion: null,
  fecha_corte: null,
  total_registros_cargados: 3,
  usuario_aprobacion_id: null,
  usuario_aprobacion_nombre: null,
  reportes_staging: 3,
  reportes_con_error: 0,
  reportes_oficiales: 0,
  notificaciones_no_leidas: 0,
  clientes: [{ id_cliente: 2, nombre: 'Constructora Andina (demo)' }],
  estado: 'PENDIENTE',
  fecha_procesamiento: null,
  motivo: null,
  ...cambios,
});

let contenedor: HTMLDivElement;
let raiz: Root;

const montar = async () => {
  contenedor = document.createElement('div');
  document.body.appendChild(contenedor);
  raiz = createRoot(contenedor);
  await act(async () => raiz.render(<DetalleLoteModal loteId={8} onClose={() => {}} />));
};

const boton = (texto: RegExp) =>
  Array.from(document.querySelectorAll('button')).find((b) => texto.test(b.textContent ?? '')) as HTMLButtonElement;
const clic = async (texto: RegExp) => act(async () => boton(texto).click());

beforeEach(() => {
  servicio.getReportesStagingLote.mockResolvedValue([]);
  servicio.getAlertasLote.mockResolvedValue([]);
  servicio.validarLote.mockResolvedValue({ esValido: true, errores: [] });
  servicio.aprobarLote.mockResolvedValue({ success: true, message: 'Lote aprobado correctamente' });
});

afterEach(() => {
  act(() => raiz.unmount());
  contenedor.remove();
  vi.clearAllMocks();
});

describe('DetalleLoteModal · aprobar', () => {
  it('un lote con período se aprueba con ese período: no deja elegir otro mes', async () => {
    servicio.getLote.mockResolvedValue(lote());
    await montar();
    await clic(/^\s*Aprobar$/);
    expect(document.querySelector('[data-testid="periodo-aprobacion"]')).toBeNull();
    expect(document.querySelector('[data-testid="periodo-lote"]')?.textContent).toContain('2026-11');
    await clic(/Confirmar aprobación/);
    expect(servicio.aprobarLote).toHaveBeenCalledWith(8, {});
  });

  it('un lote sin período deja elegir el mes y lo envía', async () => {
    servicio.getLote.mockResolvedValue(lote({ periodo: null }));
    await montar();
    await clic(/^\s*Aprobar$/);
    const input = document.querySelector<HTMLInputElement>('[data-testid="periodo-aprobacion"]');
    expect(input).not.toBeNull();
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input, '2026-10');
      input!.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await clic(/Confirmar aprobación/);
    expect(servicio.aprobarLote).toHaveBeenCalledWith(8, { periodo: '2026-10' });
  });

  it('si no se puede aprobar (409), lleva la vista a los motivos', async () => {
    const desplazar = vi.fn();
    Element.prototype.scrollIntoView = desplazar;
    servicio.getLote.mockResolvedValue(lote({ estado: 'ERROR' }));
    servicio.aprobarLote.mockRejectedValue(new ErrorAprobacion('No se puede aprobar el lote', ['Máquina SIMD0004: El equipo reportó: Error de comunicación']));
    await montar();
    await clic(/^\s*Aprobar$/);
    await clic(/Confirmar aprobación/);
    expect(document.querySelector('[data-testid="errores-aprobacion"]')?.textContent).toContain('SIMD0004');
    expect(desplazar).toHaveBeenCalled();
  });
});

describe('DetalleLoteModal · lote rechazado', () => {
  it('muestra el motivo y quién lo rechazó, guardados en el lote', async () => {
    servicio.getLote.mockResolvedValue(lote({
      estado: 'DESCARTADO',
      reportes_staging: 0,
      fecha_procesamiento: '2026-11-21T17:32:55.101Z',
      fecha_rechazo: '2026-11-21T17:32:55.101Z',
      motivo: 'Contadores «dudosos»',
      motivo_rechazo: 'Contadores «dudosos»',
      usuario_rechazo_id: 2,
      usuario_rechazo_nombre: 'Operador Prueba',
    }));
    await montar();
    expect(document.body.textContent).toContain('Rechazado por');
    expect(document.body.textContent).toContain('Operador Prueba');
    expect(document.body.textContent).toContain('Contadores «dudosos»');
    expect(boton(/^\s*Aprobar$/)).toBeUndefined();
  });
});

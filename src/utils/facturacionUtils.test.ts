import { describe, expect, it } from 'vitest';
import { nombreContrato } from './facturacionUtils';

describe('nombreContrato', () => {
  it('nombra el contrato vigente por su fecha de inicio', () => {
    expect(nombreContrato({ contrato_fecha_inicio: '2026-01-01', contrato_fecha_fin: null })).toBe('Contrato desde el 2026/01/01');
  });

  it('con fecha de fin muestra la vigencia completa', () => {
    expect(nombreContrato({ contrato_fecha_inicio: '2026-01-01', contrato_fecha_fin: '2026-12-31' }))
      .toBe('Contrato del 2026/01/01 al 2026/12/31');
  });

  it('sin fechas (backend anterior) no muestra el id de la base', () => {
    expect(nombreContrato({})).toBe('Contrato');
    expect(nombreContrato({ contrato_fecha_inicio: null, contrato_fecha_fin: '2026-12-31' })).toBe('Contrato');
  });
});

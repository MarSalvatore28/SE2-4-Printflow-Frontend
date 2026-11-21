import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import type { FacturacionContrato } from '@models/Reporte/reporte.types';
import { FacturacionPeriodoCard } from './FacturacionPeriodoCard';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const contrato = (cambios: Partial<FacturacionContrato> = {}): FacturacionContrato => ({
  contrato_id: 1,
  contrato_fecha_inicio: '2026-01-01',
  contrato_fecha_fin: null,
  modo: 'DIFERENCIAR',
  bn: { consumo: 13960, incluidas: 5000, excedente: 8960, cuota_fija: '100.00', monto_excedente: '224.00' },
  color: { consumo: 679, incluidas: 500, excedente: 179, cuota_fija: '50.00', monto_excedente: '21.48' },
  renta: '0.00',
  total: '395.48',
  filtrado: false,
  ...cambios,
});

let contenedor: HTMLDivElement;
let raiz: Root;
const montar = (facturacion: FacturacionContrato[]) => {
  contenedor = document.createElement('div');
  document.body.appendChild(contenedor);
  raiz = createRoot(contenedor);
  act(() => raiz.render(<FacturacionPeriodoCard facturacion={facturacion} montoTotalGeneral="395.48" />));
};

afterEach(() => {
  act(() => raiz.unmount());
  contenedor.remove();
});

describe('FacturacionPeriodoCard', () => {
  it('nombra el contrato por su vigencia, sin el id de la base', () => {
    montar([contrato()]);
    const texto = contenedor.textContent ?? '';
    expect(texto).toContain('Contrato desde el 2026/01/01');
    expect(texto).not.toMatch(/#\d/);
    expect(contenedor.querySelector('[data-testid="facturacion-filtrada"]')).toBeNull();
  });

  it('con filtro por área o máquina avisa que se factura el contrato completo', () => {
    montar([contrato({ filtrado: true })]);
    expect(contenedor.querySelector('[data-testid="facturacion-filtrada"]')?.textContent)
      .toBe('Con el filtro por área o máquina, la facturación es la del contrato completo.');
  });
});

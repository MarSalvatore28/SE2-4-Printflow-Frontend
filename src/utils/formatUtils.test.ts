import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatMoney,
  formatFechaISO,
} from './formatUtils';

describe('formatCurrency', () => {
  it('formatea valores normales', () => {
    const esperado = new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(1234.5);
    expect(formatCurrency(1234.5)).toBe(esperado);
  });

  it('maneja null', () => {
    expect(formatCurrency(null)).toBe('$0.00');
  });

  it('maneja NaN', () => {
    expect(formatCurrency(NaN)).toBe('$0.00');
  });
});

describe('formatNumber', () => {
  it('formatea números con separador de miles', () => {
    expect(formatNumber(1234)).toBe('1,234');
  });

  it('maneja null', () => {
    expect(formatNumber(null)).toBe('0');
  });

  it('maneja NaN', () => {
    expect(formatNumber(NaN)).toBe('0');
  });
});

describe('formatMoney', () => {
  it('formatea montos con dos decimales', () => {
    expect(formatMoney(1234.5)).toBe('1,234.50');
  });

  it('maneja null', () => {
    expect(formatMoney(null)).toBe('0,00');
  });

  it('maneja NaN', () => {
    expect(formatMoney(NaN)).toBe('0,00');
  });
});

describe('formatFechaISO', () => {
  it('formatea una fecha correctamente', () => {
    expect(formatFechaISO('2026-11-18')).toBe('2026/11/18');
  });

  it('maneja null', () => {
    expect(formatFechaISO(null)).toBe('N/A');
  });

  it('maneja cadenas vacías', () => {
    expect(formatFechaISO('')).toBe('N/A');
  });
});

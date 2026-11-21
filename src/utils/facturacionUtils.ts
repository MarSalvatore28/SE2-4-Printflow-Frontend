import type { FacturacionContrato, MaquinaConsolidada, ResumenConsolidado } from '@models/Reporte/reporte.types';
import { formatFechaISO } from '@utils/formatUtils';

/** Convierte un monto del backend (texto con 2 decimales o número) a número; lo que no se entienda vale 0. */
export const aMonto = (valor: string | number | null | undefined): number => {
    const n = typeof valor === 'number' ? valor : Number.parseFloat(valor ?? '');
    return Number.isFinite(n) ? n : 0;
};

/** true cuando el backend ya calculó el importe del período (al menos un contrato en `facturacion`). */
export const hayFacturacion = (resumen: ResumenConsolidado | null | undefined): boolean =>
    Array.isArray(resumen?.facturacion) && resumen.facturacion.length > 0;

/**
 * Importe referencial de una máquina (consumo × tarifa por página). Solo informativo:
 * el importe oficial es el del contrato. Mientras el backend no envíe `monto_referencial`
 * se usa `monto_total`, que es lo que devuelve hoy.
 */
export const importeReferencial = (maquina: MaquinaConsolidada): number =>
    aMonto(maquina.financiero?.monto_referencial ?? maquina.financiero?.monto_total);

/**
 * Nombre del contrato para una persona: por su vigencia, no por su id de la base
 * («Contrato del 2026/01/01 al 2026/12/31», «Contrato desde el 2026/01/01»).
 * La pantalla, el PDF y el Excel usan este mismo texto.
 */
export const nombreContrato = (c: Pick<FacturacionContrato, 'contrato_fecha_inicio' | 'contrato_fecha_fin'>): string => {
    if (!c.contrato_fecha_inicio) return 'Contrato';
    const inicio = formatFechaISO(c.contrato_fecha_inicio);
    return c.contrato_fecha_fin
        ? `Contrato del ${inicio} al ${formatFechaISO(c.contrato_fecha_fin)}`
        : `Contrato desde el ${inicio}`;
};

export const MENSAJE_IMPORTE_PENDIENTE = 'El importe se calcula al cerrar el período';

/** Con filtro por área o máquina, el backend factura el contrato completo (`filtrado: true`). */
export const NOTA_FACTURACION_FILTRADA = 'Con el filtro por área o máquina, la facturación es la del contrato completo';

export const NOTA_IMPORTE_REFERENCIAL =
    'El importe por máquina es referencial (consumo × tarifa por página). El total oficial es el del contrato, en «Facturación del período».';

import type { MaquinaConsolidada, ResumenConsolidado } from '@models/Reporte/reporte.types';

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

export const MENSAJE_IMPORTE_PENDIENTE = 'El importe se calcula al cerrar el período';

export const NOTA_IMPORTE_REFERENCIAL =
    'El importe por máquina es referencial (consumo × tarifa por página). El total oficial es el del contrato, en «Facturación del período».';

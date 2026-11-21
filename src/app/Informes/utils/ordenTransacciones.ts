import type { DetalleTransaccion } from '@models/Reporte/reporte.types';

export interface OrdenTabla {
    key: string;
    direction: 'asc' | 'desc';
}

// Valor de cada columna ordenable de la tabla de detalle por usuario
const VALORES = new Map<string, (t: DetalleTransaccion) => string | number>([
    ['usuario.id', (t) => t.usuario.id],
    ['usuario.nombre', (t) => t.usuario.nombre],
    ['totales.general', (t) => t.totales.general],
    ['total.impresiones', (t) => t.contadores.print_bn + t.contadores.print_color],
    ['total.copias', (t) => t.contadores.copia_bn + t.contadores.copia_color],
    ['contadores.copia_bn', (t) => t.contadores.copia_bn],
    ['contadores.copia_color', (t) => t.contadores.copia_color],
    ['contadores.print_bn', (t) => t.contadores.print_bn],
    ['contadores.print_color', (t) => t.contadores.print_color],
]);

const esOtro = (t: DetalleTransaccion) => t.usuario.nombre?.trim().toUpperCase() === 'OTRO';

// Compara dos valores en orden ascendente: textos con orden natural (2 antes que 10)
const compararValores = (a: string | number, b: string | number): number => {
    if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b, undefined, { numeric: true });
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
};

// La fila «OTRO» siempre va al final; el resto según la columna y la dirección elegidas.
// Sin columna conocida el orden no cambia.
export const compararTransacciones = (a: DetalleTransaccion, b: DetalleTransaccion, orden: OrdenTabla): number => {
    const otroA = esOtro(a);
    const otroB = esOtro(b);
    if (otroA || otroB) return Number(otroA) - Number(otroB);

    const valor = VALORES.get(orden.key);
    if (!valor) return 0;
    const cmp = compararValores(valor(a), valor(b));
    return orden.direction === 'asc' ? cmp : -cmp;
};

export const ordenarTransacciones = (transacciones: DetalleTransaccion[], orden: OrdenTabla): DetalleTransaccion[] =>
    [...transacciones].sort((a, b) => compararTransacciones(a, b, orden));

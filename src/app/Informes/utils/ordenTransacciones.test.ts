import { describe, expect, it } from 'vitest';
import type { DetalleTransaccion } from '@models/Reporte/reporte.types';
import { ordenarTransacciones } from './ordenTransacciones';

const fila = (id: string, nombre: string, print_bn: number, copia_bn = 0) => ({
    id: Number(id) || 0,
    transaccion: { fecha: '2026-10-31' },
    usuario: { id, nombre },
    maquina: { serie: 'SIMA0001', ip: '10.0.0.1', area: 'Contabilidad' },
    contadores: { copia_bn, copia_color: 0, print_bn, print_color: 0 },
    totales: { bn: print_bn + copia_bn, color: 0, general: print_bn + copia_bn },
}) as DetalleTransaccion;

const filas = [
    fila('10', 'Bruno', 50),
    fila('OTRO', 'Otro', 999),
    fila('2', 'ana', 70, 5),
    fila('3', 'Carla', 10),
];
const nombres = (r: DetalleTransaccion[]) => r.map(t => t.usuario.nombre);

describe('ordenarTransacciones', () => {
    it('la fila «OTRO» siempre queda al final', () => {
        expect(nombres(ordenarTransacciones(filas, { key: 'totales.general', direction: 'desc' })).at(-1)).toBe('Otro');
        expect(nombres(ordenarTransacciones(filas, { key: 'totales.general', direction: 'asc' })).at(-1)).toBe('Otro');
    });

    it('ordena números en ambas direcciones', () => {
        expect(nombres(ordenarTransacciones(filas, { key: 'contadores.print_bn', direction: 'asc' }))).toEqual(['Carla', 'Bruno', 'ana', 'Otro']);
        expect(nombres(ordenarTransacciones(filas, { key: 'totales.general', direction: 'desc' }))).toEqual(['ana', 'Bruno', 'Carla', 'Otro']);
    });

    it('ordena textos con orden natural (2 antes que 10)', () => {
        expect(nombres(ordenarTransacciones(filas, { key: 'usuario.id', direction: 'asc' }))).toEqual(['ana', 'Carla', 'Bruno', 'Otro']);
        expect(nombres(ordenarTransacciones(filas, { key: 'usuario.nombre', direction: 'desc' }))).toEqual(['Carla', 'Bruno', 'ana', 'Otro']);
    });

    it('con una columna desconocida no cambia el orden (salvo «OTRO») y no modifica la lista', () => {
        expect(nombres(ordenarTransacciones(filas, { key: 'desconocida', direction: 'asc' }))).toEqual(['Bruno', 'ana', 'Carla', 'Otro']);
        expect(nombres(filas)).toEqual(['Bruno', 'Otro', 'ana', 'Carla']);
    });
});

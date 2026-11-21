import { describe, expect, it } from 'vitest';
import type { Area } from '@models/Area/area.types';
import { filtrarAreas, type FiltrosAreas } from './filtrarAreas';

const area = (id_area: number, datos: Partial<Area>): Area => ({
    id_area,
    cliente_id: 1,
    nombre: `Área ${id_area}`,
    descripcion: null,
    activo: 1,
    ...datos,
});

const areas = [
    area(1, { nombre: 'Contabilidad', cliente_id: 1, cliente_nombre: 'Constructora Andina', descripcion: 'Piso 2' }),
    area(2, { nombre: 'Bodega', cliente_id: 2, cliente_nombre: 'Colegio Central' }),
    area(3, { nombre: 'Archivo', cliente_id: 1, cliente_nombre: 'Constructora Andina', activo: 0 }),
];

const sinFiltros: FiltrosAreas = { mostrarInactivas: false, areaId: null, clienteId: null, termino: '' };
const ids = (r: Area[]) => r.map(a => a.id_area);

describe('filtrarAreas', () => {
    it('oculta las inactivas salvo que se pidan', () => {
        expect(ids(filtrarAreas(areas, sinFiltros))).toEqual([1, 2]);
        expect(ids(filtrarAreas(areas, { ...sinFiltros, mostrarInactivas: true }))).toEqual([1, 2, 3]);
    });

    it('un área elegida gana al cliente y al término', () => {
        expect(ids(filtrarAreas(areas, { ...sinFiltros, areaId: 2, clienteId: 1, termino: 'contabilidad' }))).toEqual([2]);
    });

    it('filtra por cliente', () => {
        expect(ids(filtrarAreas(areas, { ...sinFiltros, mostrarInactivas: true, clienteId: 1 }))).toEqual([1, 3]);
    });

    it('cada palabra debe estar en el nombre, el cliente o la descripción', () => {
        expect(ids(filtrarAreas(areas, { ...sinFiltros, termino: 'andina piso' }))).toEqual([1]);
        expect(ids(filtrarAreas(areas, { ...sinFiltros, termino: 'COLEGIO' }))).toEqual([2]);
        expect(filtrarAreas(areas, { ...sinFiltros, termino: 'andina bodega' })).toEqual([]);
    });
});

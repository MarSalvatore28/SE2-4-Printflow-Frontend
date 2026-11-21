import { describe, expect, it } from 'vitest';
import type { Maquina } from '@models/Maquina/maquina.types';
import { detalleMaquina, filtrarMaquinas, textosCambioEstado } from './maquinas';

const maquina = (id_maquina: number, datos: Partial<Maquina>) => ({
    id_maquina,
    serie: `SIM${id_maquina}`,
    modelo: 'Ricoh MP 2014',
    ip: null,
    cliente_nombre: null,
    area_nombre: null,
    activo: true,
    ...datos,
}) as unknown as Maquina;

const lista = [
    maquina(1, { serie: 'SIMA0001', ip: '10.20.1.11', cliente_nombre: 'Constructora Andina' }),
    maquina(2, { serie: 'SIMB0002', modelo: 'Kyocera', activo: false }),
    maquina(3, { serie: 'SIMC0003', area_nombre: 'Bodega' }),
];
const ids = (r: Maquina[]) => r.map(m => m.id_maquina);

describe('filtrarMaquinas', () => {
    it('oculta las inactivas salvo que se pidan', () => {
        expect(ids(filtrarMaquinas(lista, { id: null, termino: '', mostrarInactivas: false }))).toEqual([1, 3]);
        expect(ids(filtrarMaquinas(lista, { id: null, termino: '', mostrarInactivas: true }))).toEqual([1, 2, 3]);
    });

    it('la máquina elegida gana aunque esté inactiva', () => {
        expect(ids(filtrarMaquinas(lista, { id: 2, termino: 'andina', mostrarInactivas: false }))).toEqual([2]);
    });

    it('busca cada palabra en serie, modelo, IP, cliente o área', () => {
        expect(ids(filtrarMaquinas(lista, { id: null, termino: 'andina 10.20', mostrarInactivas: false }))).toEqual([1]);
        expect(ids(filtrarMaquinas(lista, { id: null, termino: 'BODEGA', mostrarInactivas: false }))).toEqual([3]);
        expect(ids(filtrarMaquinas(lista, { id: null, termino: 'kyocera', mostrarInactivas: true }))).toEqual([2]);
    });
});

describe('detalleMaquina', () => {
    it('arma el detalle del buscador', () => {
        expect(detalleMaquina(lista[0])).toBe('Ricoh MP 2014 · 10.20.1.11 · Constructora Andina');
        expect(detalleMaquina(maquina(9, { modelo: null, activo: false }))).toBe('Sin modelo · Inactiva');
    });
});

describe('textosCambioEstado', () => {
    it('desactivar una activa y activar una inactiva', () => {
        expect(textosCambioEstado(lista[0])).toEqual({
            type: 'delete',
            title: '¿Desactivar máquina?',
            message: '¿Deseas desactivar la máquina SIMA0001? Una máquina con asignación vigente no se puede desactivar.',
            confirmText: 'Desactivar',
        });
        expect(textosCambioEstado(lista[1]).message).toBe('¿Deseas activar la máquina SIMB0002?');
        expect(textosCambioEstado(null).type).toBe('activate');
    });
});

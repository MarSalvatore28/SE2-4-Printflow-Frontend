import { describe, expect, it } from 'vitest';
import type { InstalacionActivaCliente } from '@models/Instalacion/Instalacion.types';
import { datosEdicionDe, datosEdicionVacios, filtrarInstalaciones } from './instalaciones';

const instalacion = (datos: Partial<InstalacionActivaCliente>) => ({
    id_instalacion: 1,
    serie: 'SIMA0001',
    modelo_nombre: 'Kyocera M3655',
    area_nombre: 'Contabilidad',
    ip_address: '192.168.1.10',
    ...datos,
}) as InstalacionActivaCliente;

describe('filtrarInstalaciones', () => {
    const lista = [
        instalacion({ id_instalacion: 1 }),
        instalacion({ id_instalacion: 2, serie: 'SIMB0002', modelo_nombre: 'Ricoh MP 2014', area_nombre: 'Bodega', ip_address: '10.0.0.5' }),
    ];
    const ids = (r: InstalacionActivaCliente[]) => r.map(i => i.id_instalacion);

    it('sin término (o solo espacios) devuelve todas', () => {
        expect(filtrarInstalaciones(lista, '')).toBe(lista);
        expect(ids(filtrarInstalaciones(lista, '   '))).toEqual([1, 2]);
    });

    it('busca por serie, modelo, área o IP sin distinguir mayúsculas', () => {
        expect(ids(filtrarInstalaciones(lista, 'simb'))).toEqual([2]);
        expect(ids(filtrarInstalaciones(lista, 'KYOCERA'))).toEqual([1]);
        expect(ids(filtrarInstalaciones(lista, 'bodega'))).toEqual([2]);
        expect(ids(filtrarInstalaciones(lista, '192.168'))).toEqual([1]);
    });

    it('todas las palabras deben coincidir', () => {
        expect(ids(filtrarInstalaciones(lista, 'ricoh bodega'))).toEqual([2]);
        expect(filtrarInstalaciones(lista, 'ricoh contabilidad')).toEqual([]);
    });
});

describe('datosEdicionDe', () => {
    it('toma los valores de la instalación', () => {
        const datos = datosEdicionDe(instalacion({
            renta_equipo: true,
            costo_renta_mensual: 25.5,
            contador_acumulativo: false,
            contabilidad_por_usuario: true,
            fecha_instalacion: '2026-03-15T05:00:00.000Z',
        }));
        expect(datos).toEqual({
            ip_address: '192.168.1.10',
            costo_renta_mensual: 25.5,
            contador_acumulativo: false,
            contabilidad_por_usuario: true,
            fecha_instalacion: '2026-03-15',
        });
    });

    it('sin renta de equipo el costo es 0 y los valores faltantes usan los de siempre', () => {
        const datos = datosEdicionDe(instalacion({
            ip_address: null as unknown as string,
            renta_equipo: false,
            costo_renta_mensual: 40,
            fecha_instalacion: '',
        }));
        expect(datos.ip_address).toBe('');
        expect(datos.costo_renta_mensual).toBe(0);
        expect(datos.contador_acumulativo).toBe(true);
        expect(datos.contabilidad_por_usuario).toBe(false);
        expect(datos.fecha_instalacion).toBe(datosEdicionVacios().fecha_instalacion);
    });
});

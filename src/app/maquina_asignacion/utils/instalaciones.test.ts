import { describe, expect, it } from 'vitest';
import type { InstalacionActivaCliente } from '@models/Instalacion/Instalacion.types';
import {
    datosEdicionDe,
    datosEdicionVacios,
    etiquetaContrato,
    etiquetaMaquina,
    fechaCorta,
    filtrarInstalaciones,
    hoyIso,
} from './instalaciones';

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

describe('etiquetas sin ids internos', () => {
    it('el contrato se nombra por su vigencia, con aviso si está vencido o no empieza', () => {
        const hoy = '2026-11-21';
        expect(etiquetaContrato({ fecha_inicio: '2026-01-01T00:00:00.000Z', fecha_fin: null }, hoy))
            .toBe('Contrato desde 01/01/2026 (sin fecha de fin)');
        expect(etiquetaContrato({ fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' }, hoy))
            .toBe('Contrato desde 01/01/2026 hasta 31/12/2026');
        expect(etiquetaContrato({ fecha_inicio: '2025-01-01', fecha_fin: '2025-12-31' }, hoy)).toMatch(/vencido$/);
        expect(etiquetaContrato({ fecha_inicio: '2027-01-01' }, hoy)).toMatch(/aún no empieza$/);
    });

    it('la máquina se nombra por serie y modelo', () => {
        expect(etiquetaMaquina({ serie: 'SIMA0001', modelo_nombre: 'Ricoh' })).toBe('SIMA0001 · Ricoh');
        expect(etiquetaMaquina({ serie: 'SIMA0001' })).toBe('SIMA0001 · Sin modelo');
        expect(etiquetaMaquina(null)).toBe('');
    });

    it('fechas: DD/MM/AAAA sin cambiar de día, y hoy en hora local', () => {
        expect(fechaCorta('2026-03-15T05:00:00.000Z')).toBe('15/03/2026');
        expect(fechaCorta(null)).toBe('');
        // A las 21:00 de Ecuador (02:00 UTC del día siguiente) sigue siendo el mismo día local
        expect(hoyIso(new Date(2026, 10, 21, 21, 0))).toBe('2026-11-21');
    });
});

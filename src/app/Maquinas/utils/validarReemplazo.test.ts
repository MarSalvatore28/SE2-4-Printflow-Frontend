import { describe, expect, it } from 'vitest';
import type { Maquina } from '@models/Maquina/maquina.types';
import { esEntero, periodoSiguiente, validarReemplazo, type ValoresReemplazo } from './validarReemplazo';

const HOY = '2026-11-21';
const saliente = { id_maquina: 1, serie: 'SIMA0001', fecha_instalacion: '2026-01-10' } as Maquina;
const entrante = { id_maquina: 2, serie: 'SIMZ0099' } as Maquina;

const valores = (cambios: Partial<ValoresReemplazo> = {}): ValoresReemplazo => ({
    fecha_danio: '2026-10-28',
    fecha_instalacion_entrante: '2026-10-30',
    periodo_afectado: '2026-10',
    tipo_cambio: 'DAÑO',
    razon_cambio: 'Fusor dañado',
    contador_final_saliente_bn: '1200',
    contador_final_saliente_color: '0',
    contador_inicial_entrante_bn: '10',
    contador_inicial_entrante_color: '0',
    ip_address: '',
    ...cambios,
});

describe('periodoSiguiente y esEntero', () => {
    it('pasa de diciembre a enero del año siguiente', () => {
        expect(periodoSiguiente('2026-10')).toBe('2026-11');
        expect(periodoSiguiente('2026-12')).toBe('2027-01');
    });

    it('solo enteros mayores o iguales a 0', () => {
        expect(esEntero(' 15 ')).toBe(true);
        expect(esEntero('-1')).toBe(false);
        expect(esEntero('1.5')).toBe(false);
        expect(esEntero('')).toBe(false);
    });
});

describe('validarReemplazo', () => {
    it('un reemplazo completo no tiene errores', () => {
        expect(validarReemplazo(valores(), saliente, entrante, HOY)).toEqual({});
    });

    it('formulario vacío: todos los obligatorios, en el orden de los campos', () => {
        const vacio = valores({
            fecha_danio: '', fecha_instalacion_entrante: '', periodo_afectado: '', tipo_cambio: '', razon_cambio: ' ',
            contador_final_saliente_bn: '', contador_final_saliente_color: '', contador_inicial_entrante_bn: '', contador_inicial_entrante_color: '',
        });
        expect(Object.keys(validarReemplazo(vacio, null, null, HOY))).toEqual([
            'saliente', 'entrante', 'fecha_danio', 'fecha_instalacion_entrante', 'periodo_afectado', 'tipo_cambio', 'razon_cambio',
            'contador_final_saliente_bn', 'contador_final_saliente_color', 'contador_inicial_entrante_bn', 'contador_inicial_entrante_color',
        ]);
    });

    it('fechas: no futuras, el daño no antes de la instalación y la entrante no antes del daño', () => {
        expect(validarReemplazo(valores({ fecha_danio: '2026-12-01', periodo_afectado: '2026-12', fecha_instalacion_entrante: '2026-12-02' }), saliente, entrante, HOY))
            .toMatchObject({ fecha_danio: 'La fecha del daño no puede ser futura', fecha_instalacion_entrante: 'La fecha de instalación no puede ser futura' });
        expect(validarReemplazo(valores({ fecha_danio: '2026-01-05', periodo_afectado: '2026-01', fecha_instalacion_entrante: '2026-01-06' }), saliente, entrante, HOY).fecha_danio)
            .toMatch(/^No puede ser anterior a la instalación de SIMA0001/);
        expect(validarReemplazo(valores({ fecha_instalacion_entrante: '2026-10-20' }), saliente, entrante, HOY))
            .toEqual({ fecha_instalacion_entrante: 'No puede ser anterior a la fecha del daño' });
    });

    it('el período es el mes del daño o el siguiente', () => {
        expect(validarReemplazo(valores({ periodo_afectado: '2026-11' }), saliente, entrante, HOY)).toEqual({});
        expect(validarReemplazo(valores({ periodo_afectado: '2026-09' }), saliente, entrante, HOY))
            .toEqual({ periodo_afectado: 'Debe ser el mes del daño (2026-10) o el siguiente (2026-11)' });
    });

    it('la IP es opcional pero, si se escribe, debe ser IPv4', () => {
        expect(validarReemplazo(valores({ ip_address: '10.20.1.12' }), saliente, entrante, HOY)).toEqual({});
        expect(validarReemplazo(valores({ ip_address: '10.20.1' }), saliente, entrante, HOY))
            .toEqual({ ip_address: 'IPv4 válida, p. ej. 10.20.1.12' });
    });
});

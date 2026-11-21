import { describe, expect, it } from 'vitest';
import type { InstalacionFormData, MaquinaSinInstalacion } from '@models/Instalacion/Instalacion.types';
import type { MaquinaConIP } from '@app/maquina_asignacion/components/AsignacionMaquinaDetailsFields';
import {
    datosDeFormulario,
    datosDeMaquina,
    detallesDeErrores,
    mensajeDeError,
    puedeEnviarInstalacion,
    validarFormularioInstalacion,
} from './formularioInstalacion';

const datos = (cambios: Partial<InstalacionFormData> = {}): InstalacionFormData => ({
    maquina_id: 7,
    area_id: 3,
    contrato_id: 2,
    ip_address: ' 192.168.1.20 ',
    observaciones: '  junto a la ventana ',
    fecha_instalacion: '2026-11-01',
    costo_renta_mensual: 0,
    contador_acumulativo: true,
    contabilidad_por_usuario: false,
    ...cambios,
});

const maquina = (id: number, cambios: Partial<MaquinaConIP> = {}): MaquinaConIP => ({
    maquina: { id_maquina: id, serie: `SER${id}` } as MaquinaSinInstalacion,
    ip_address: `10.0.0.${id}`,
    area_id: 4,
    ...cambios,
});

describe('validarFormularioInstalacion', () => {
    it('un formulario simple completo no tiene errores', () => {
        expect(validarFormularioInstalacion({ clienteId: 1, datos: datos(), multiple: false, maquinas: [] })).toEqual({});
    });

    it('simple: pide cliente, contrato, área, máquina e IP, en ese orden', () => {
        const errores = validarFormularioInstalacion({
            clienteId: undefined,
            datos: datos({ contrato_id: 0, area_id: 0, maquina_id: 0, ip_address: '  ' }),
            multiple: false,
            maquinas: [],
        });
        expect(Object.keys(errores)).toEqual(['cliente', 'contrato', 'area', 'maquina', 'ip_address']);
        expect(errores.ip_address).toBe('La dirección IP es obligatoria');
    });

    it('simple: rechaza una IP con formato inválido', () => {
        const errores = validarFormularioInstalacion({ clienteId: 1, datos: datos({ ip_address: '300.1.1.1' }), multiple: false, maquinas: [] });
        expect(errores).toEqual({ ip_address: 'Formato de IP inválido' });
    });

    it('múltiple: al menos una máquina, y cada una con área e IP válida', () => {
        expect(validarFormularioInstalacion({ clienteId: 1, datos: datos(), multiple: true, maquinas: [] }))
            .toEqual({ maquina: 'Debe agregar al menos una máquina' });

        const errores = validarFormularioInstalacion({
            clienteId: 1,
            datos: datos({ area_id: 0, maquina_id: 0, ip_address: '' }),
            multiple: true,
            maquinas: [maquina(1), maquina(2, { area_id: 0, ip_address: '' }), maquina(3, { ip_address: '10.0.0' })],
        });
        expect(errores).toEqual({
            area_1: 'Seleccione un área para la máquina SER2',
            ip_1: 'La máquina SER2 requiere una dirección IP',
            ip_2: 'IP inválida para SER3',
        });
    });
});

describe('detallesDeErrores', () => {
    it('las claves de una máquina salen como «Revisión» y las demás con mayúscula inicial', () => {
        expect(detallesDeErrores({ cliente: 'a', ip_0: 'b', ip_address: 'c' })).toEqual([
            { label: 'Cliente', text: 'a' },
            { label: 'Revisión', text: 'b' },
            { label: 'Revisión', text: 'c' },
        ]);
    });
});

describe('datos que se envían', () => {
    it('instalación simple: recorta IP y observaciones', () => {
        expect(datosDeFormulario(datos({ costo_renta_mensual: undefined }))).toEqual({
            maquina_id: 7,
            area_id: 3,
            contrato_id: 2,
            ip_address: '192.168.1.20',
            fecha_instalacion: '2026-11-01',
            observaciones: 'junto a la ventana',
            costo_renta_mensual: 0,
            contador_acumulativo: true,
            contabilidad_por_usuario: false,
        });
        expect(datosDeFormulario(datos({ observaciones: '   ' })).observaciones).toBeUndefined();
    });

    it('instalación múltiple: usa contrato y fecha del formulario y los datos de la máquina', () => {
        expect(datosDeMaquina(maquina(5, { costo_renta_mensual: 12, observaciones: ' x ', contador_acumulativo: false }), datos())).toEqual({
            maquina_id: 5,
            area_id: 4,
            contrato_id: 2,
            ip_address: '10.0.0.5',
            fecha_instalacion: '2026-11-01',
            observaciones: 'x',
            costo_renta_mensual: 12,
            contador_acumulativo: false,
            contabilidad_por_usuario: undefined,
        });
    });
});

describe('mensajeDeError', () => {
    it('prefiere el mensaje de la API, luego el del error y al final el texto por defecto', () => {
        expect(mensajeDeError({ response: { data: { message: 'IP repetida' } }, message: 'x' }, 'def')).toBe('IP repetida');
        expect(mensajeDeError(new Error('falló'), 'def')).toBe('falló');
        expect(mensajeDeError({}, 'def')).toBe('def');
        expect(mensajeDeError(null, 'def')).toBe('def');
    });
});

describe('puedeEnviarInstalacion', () => {
    it('necesita cliente y contrato', () => {
        expect(puedeEnviarInstalacion({ clienteId: undefined, datos: datos(), multiple: false, maquinas: [] })).toBe(false);
        expect(puedeEnviarInstalacion({ clienteId: 1, datos: datos({ contrato_id: 0 }), multiple: false, maquinas: [] })).toBe(false);
        expect(puedeEnviarInstalacion({ clienteId: 1, datos: datos(), multiple: false, maquinas: [] })).toBe(true);
    });

    it('simple: área, máquina e IP; múltiple: al menos una máquina', () => {
        expect(puedeEnviarInstalacion({ clienteId: 1, datos: datos({ ip_address: ' ' }), multiple: false, maquinas: [] })).toBe(false);
        expect(puedeEnviarInstalacion({ clienteId: 1, datos: datos(), multiple: true, maquinas: [] })).toBe(false);
        expect(puedeEnviarInstalacion({ clienteId: 1, datos: datos({ area_id: 0 }), multiple: true, maquinas: [maquina(1)] })).toBe(true);
    });
});

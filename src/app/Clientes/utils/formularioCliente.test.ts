import { describe, expect, it } from 'vitest';
import type { ClienteParaTabla } from '@models/Cliente/cliente.types';
import {
    datosClienteEditado,
    datosClienteNuevo,
    datosContrato,
    datosContratoDeCliente,
    esPestanaContrato,
    faltanteCliente,
    faltanteContrato,
    filtrarClientes,
    textosModalCliente,
    type FormularioCliente,
} from './formularioCliente';

const cliente = (id_cliente: number, datos: Partial<ClienteParaTabla>) =>
    ({ id_cliente, nombre: `Cliente ${id_cliente}`, ruc: '0990000000001', razon_social: null, activo: true, ...datos }) as ClienteParaTabla;

const formulario = (cambios: Partial<FormularioCliente> = {}): FormularioCliente => ({
    nombre: 'Constructora Andina',
    ruc: '0991234567001',
    razon_social: 'Andina S.A.',
    activo: true,
    id_cliente: 4,
    cliente_id: 4,
    id_contrato: 9,
    fecha_inicio: '2026-01-01',
    fecha_fin: '',
    impresiones_bn_incluidas: 5000,
    impresiones_color_incluidas: 500,
    costo_impresion_bn: 0.02,
    costo_impresion_color: 0.1,
    costo_excedente_impresion_bn: 0.03,
    costo_excedente_impresion_color: undefined,
    tiene_renta: undefined,
    tiene_software_control: true,
    printer_bill: 'Todo como Color',
    ...cambios,
});

describe('filtrarClientes', () => {
    const lista = [
        cliente(1, { nombre: 'Constructora Andina', razon_social: 'Andina S.A.' }),
        cliente(2, { nombre: 'Colegio Central', ruc: '1790000000001' }),
        cliente(3, { nombre: 'Archivo viejo', activo: false }),
    ];
    const ids = (r: ClienteParaTabla[]) => r.map(c => c.id_cliente);

    it('oculta los inactivos salvo que se pidan', () => {
        expect(ids(filtrarClientes(lista, { mostrarInactivos: false, clienteId: null, termino: '' }))).toEqual([1, 2]);
        expect(ids(filtrarClientes(lista, { mostrarInactivos: true, clienteId: null, termino: '' }))).toEqual([1, 2, 3]);
    });

    it('el cliente elegido gana al término', () => {
        expect(ids(filtrarClientes(lista, { mostrarInactivos: false, clienteId: 2, termino: 'andina' }))).toEqual([2]);
    });

    it('busca cada palabra en nombre, RUC o razón social', () => {
        expect(ids(filtrarClientes(lista, { mostrarInactivos: false, clienteId: null, termino: 's.a.' }))).toEqual([1]);
        expect(ids(filtrarClientes(lista, { mostrarInactivos: false, clienteId: null, termino: '17900 colegio' }))).toEqual([2]);
    });
});

describe('validaciones', () => {
    it('contrato: cliente y fecha de inicio', () => {
        expect(faltanteContrato(formulario())).toBeNull();
        expect(faltanteContrato(formulario({ cliente_id: undefined }))).toBe('Debe asignar un cliente para guardar el contrato.');
        expect(faltanteContrato(formulario({ fecha_inicio: '' }))).toBe('La fecha de inicio es obligatoria para el contrato.');
    });

    it('cliente: nombre y RUC', () => {
        expect(faltanteCliente(formulario())).toBeNull();
        expect(faltanteCliente(formulario({ nombre: '' }))).toBe('El nombre del cliente es un campo obligatorio.');
        expect(faltanteCliente(formulario({ ruc: '' }))).toBe('El RUC del cliente es un campo obligatorio.');
    });
});

describe('datos que se envían', () => {
    it('contrato: las copias usan las cantidades y tarifas de impresión, y lo vacío va como 0 o null', () => {
        const d = datosContrato(formulario());
        expect(d.fecha_fin).toBeNull();
        expect(d.copias_bn_incluidas).toBe(5000);
        expect(d.costo_copia_color).toBe(0.1);
        expect(d.costo_excedente_copia_color).toBe(0);
        expect(d.tiene_renta).toBe(false);
        expect(d.tiene_software_control).toBe(true);
    });

    it('contrato de un cliente editado: lleva el id del cliente y la fecha fin tal cual', () => {
        const d = datosContratoDeCliente(formulario());
        expect(d.cliente_id).toBe(4);
        expect(d.fecha_fin).toBe('');
        expect(d.costo_excedente_impresion_color).toBe(0);
    });

    it('cliente nuevo sin «activo» y cliente editado con «activo»', () => {
        expect(datosClienteNuevo(formulario())).not.toHaveProperty('activo');
        expect(datosClienteEditado(formulario({ activo: false })).activo).toBe(false);
    });
});

describe('textosModalCliente y pestañas', () => {
    it('usa los textos del aviso si los tiene', () => {
        expect(textosModalCliente({ type: 'activate', cliente: null, title: 'Cliente creado', message: 'Listo', confirmText: 'Aceptar', showCancel: false }))
            .toEqual({ title: 'Cliente creado', message: 'Listo', confirmText: 'Aceptar', showCancel: false });
    });

    it('si no, los de desactivar o activar el cliente', () => {
        const desactivar = textosModalCliente({ type: 'delete', cliente: cliente(1, { nombre: 'Andina' }) });
        expect(desactivar.title).toBe('¿Desactivar cliente?');
        expect(desactivar.message).toContain('desactivar al cliente "Andina"');
        expect(desactivar.showCancel).toBe(true);
        expect(textosModalCliente({ type: 'activate', cliente: cliente(1, { nombre: 'Andina' }) }).confirmText).toBe('Activar');
    });

    it('esPestanaContrato', () => {
        expect(esPestanaContrato('Crear Contrato')).toBe(true);
        expect(esPestanaContrato('Editar Contrato')).toBe(true);
        expect(esPestanaContrato('listar')).toBe(false);
    });
});

import { describe, expect, it } from 'vitest';
import type { ClienteParaTabla } from '@models/Cliente/cliente.types';
import {
    datosClienteEditado,
    datosClienteNuevo,
    datosContrato,
    errorRuc,
    esPestanaContrato,
    etiquetaFacturacion,
    normalizarFacturacion,
    faltanteCliente,
    faltanteContrato,
    filtrarClientes,
    hoyLocal,
    textoPermitido,
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
        expect(faltanteCliente(formulario({ nombre: '   ' }))).toBe('El nombre del cliente es un campo obligatorio.');
        expect(faltanteCliente(formulario({ ruc: '' }))).toBe('El RUC del cliente es un campo obligatorio.');
        // Antes el aviso en rojo no impedía guardar un RUC con otra provincia o terminación
        expect(faltanteCliente(formulario({ ruc: '9991234567001' }))).toMatch(/01 y 24/);
        expect(faltanteCliente(formulario({ ruc: '0991234567002' }))).toMatch(/terminar en 001/);
    });

    it('RUC: 13 dígitos, provincia 01 a 24 o 30 y 001', () => {
        expect(errorRuc('')).toBeNull();
        expect(errorRuc('0900000001001')).toBeNull();
        expect(errorRuc('3090000000001')).toBeNull();
        expect(errorRuc('09000000010')).toMatch(/13 dígitos/);
        expect(errorRuc('2500000000001')).toMatch(/01 y 24/);
        expect(errorRuc('0900000001002')).toMatch(/001/);
    });

    it('nombre: tildes, comillas, paréntesis y «&» se pueden escribir', () => {
        expect(textoPermitido('Colegio Horizonte (demo)')).toBe(true);
        expect(textoPermitido(`O'Brien & Hijos "Ñandú" #2`)).toBe(true);
        expect(textoPermitido('con\tcontrol')).toBe(false);
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

    it('cliente nuevo o editado: solo nombre, RUC y razón social, sin estado ni contrato', () => {
        expect(datosClienteNuevo(formulario({ nombre: '  Andina  ', razon_social: '  ' }))).toEqual({
            nombre: 'Andina', ruc: '0991234567001', razon_social: null,
        });
        const editado = datosClienteEditado(formulario({ activo: false }));
        expect(editado).not.toHaveProperty('activo');
        expect(editado).not.toHaveProperty('printer_bill');
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
        expect(desactivar.message).toContain('se retiran sus máquinas asignadas');
        expect(desactivar.showCancel).toBe(true);
        expect(textosModalCliente({ type: 'activate', cliente: cliente(1, { nombre: 'Andina' }) }).confirmText).toBe('Activar');
    });

    it('esPestanaContrato', () => {
        expect(esPestanaContrato('Crear Contrato')).toBe(true);
        expect(esPestanaContrato('Editar Contrato')).toBe(true);
        expect(esPestanaContrato('listar')).toBe(false);
    });
});

describe('hoyLocal', () => {
    it('usa la fecha del navegador, no la UTC (a las 20:00 en Ecuador sigue siendo hoy)', () => {
        expect(hoyLocal(new Date(2026, 10, 21, 20, 30))).toBe('2026-11-21');
        expect(hoyLocal(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05');
    });
});

describe('modo de facturación', () => {
    it('«Todo como Color» (como se guardaba antes) es «Todo como color», el valor que entiende el backend', () => {
        expect(normalizarFacturacion('Todo como Color')).toBe('Todo como color');
        expect(normalizarFacturacion('  TODO como  color ')).toBe('Todo como color');
        expect(normalizarFacturacion('Diferenciar B/N de Color')).toBe('Diferenciar B/N de Color');
        expect(normalizarFacturacion(undefined)).toBe('Diferenciar B/N de Color');
    });

    it('etiqueta para la pantalla', () => {
        expect(etiquetaFacturacion('Todo como Color')).toBe('Todo como color');
        expect(etiquetaFacturacion('Diferenciar B/N de Color')).toBe('Diferenciar B/N de color');
        expect(etiquetaFacturacion(null)).toBe('-');
    });
});

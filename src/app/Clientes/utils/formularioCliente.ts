import type { ClienteFormData, ClienteParaTabla } from '@models/Cliente/cliente.types';

// Datos del formulario de cliente y de contrato (al editar un cliente se guarda su id)
export type FormularioCliente = ClienteFormData & { id_cliente?: number };

export type PestanaClientes = 'agregar' | 'listar' | 'Crear Contrato' | 'Editar Contrato';

export const esPestanaContrato = (pestana: PestanaClientes) =>
    pestana === 'Crear Contrato' || pestana === 'Editar Contrato';

export interface FiltrosClientes {
    mostrarInactivos: boolean;
    clienteId: number | null;
    termino: string;
}

const coincideTermino = (cliente: ClienteParaTabla, termino: string) =>
    termino.toLowerCase().split(' ').filter(w => w.length > 0).every(palabra =>
        cliente.nombre.toLowerCase().includes(palabra) ||
        cliente.ruc?.toLowerCase().includes(palabra) ||
        cliente.razon_social?.toLowerCase().includes(palabra)
    );

// Oculta los inactivos (salvo que se pidan); un cliente elegido en el buscador gana al término
export const filtrarClientes = (clientes: ClienteParaTabla[], { mostrarInactivos, clienteId, termino }: FiltrosClientes) =>
    clientes.filter(cliente => {
        if (!mostrarInactivos && !cliente.activo) return false;
        if (clienteId) return cliente.id_cliente === clienteId;
        return !termino || coincideTermino(cliente, termino);
    });

// Mensaje de advertencia si falta un dato obligatorio, o null si se puede guardar
export const faltanteContrato = (datos: FormularioCliente): string | null => {
    if (!datos.cliente_id) return 'Debe asignar un cliente para guardar el contrato.';
    if (!datos.fecha_inicio) return 'La fecha de inicio es obligatoria para el contrato.';
    return null;
};

export const faltanteCliente = (datos: FormularioCliente): string | null => {
    if (!datos.nombre) return 'El nombre del cliente es un campo obligatorio.';
    if (!datos.ruc) return 'El RUC del cliente es un campo obligatorio.';
    return null;
};

// Contrato desde las pestañas «Crear contrato» y «Editar contrato».
// Copias e impresiones comparten tarifas: las de copia toman las de impresión.
export const datosContrato = (datos: FormularioCliente) => ({
    fecha_inicio: datos.fecha_inicio,
    fecha_fin: datos.fecha_fin || null,
    copias_bn_incluidas: Number(datos.impresiones_bn_incluidas || 0),
    copias_color_incluidas: Number(datos.impresiones_color_incluidas || 0),
    impresiones_bn_incluidas: Number(datos.impresiones_bn_incluidas || 0),
    impresiones_color_incluidas: Number(datos.impresiones_color_incluidas || 0),
    costo_copia_bn: Number(datos.costo_impresion_bn || 0),
    costo_copia_color: Number(datos.costo_impresion_color || 0),
    costo_impresion_bn: Number(datos.costo_impresion_bn || 0),
    costo_impresion_color: Number(datos.costo_impresion_color || 0),
    costo_excedente_copia_bn: Number(datos.costo_excedente_impresion_bn || 0),
    costo_excedente_copia_color: Number(datos.costo_excedente_impresion_color || 0),
    costo_excedente_impresion_bn: Number(datos.costo_excedente_impresion_bn || 0),
    costo_excedente_impresion_color: Number(datos.costo_excedente_impresion_color || 0),
    tiene_renta: Boolean(datos.tiene_renta),
    tiene_software_control: Boolean(datos.tiene_software_control),
    printer_bill: datos.printer_bill,
});

// Contrato vigente al editar un cliente (mismos campos que se mandaban antes)
export const datosContratoDeCliente = (datos: FormularioCliente) => ({
    cliente_id: datos.id_cliente,
    fecha_inicio: datos.fecha_inicio,
    fecha_fin: datos.fecha_fin,
    copias_bn_incluidas: Number(datos.impresiones_bn_incluidas),
    copias_color_incluidas: Number(datos.impresiones_color_incluidas),
    impresiones_bn_incluidas: Number(datos.impresiones_bn_incluidas),
    impresiones_color_incluidas: Number(datos.impresiones_color_incluidas),
    costo_copia_bn: Number(datos.costo_impresion_bn),
    costo_copia_color: Number(datos.costo_impresion_color),
    costo_impresion_bn: Number(datos.costo_impresion_bn),
    costo_impresion_color: Number(datos.costo_impresion_color),
    costo_excedente_copia_bn: Number(datos.costo_excedente_impresion_bn || 0),
    costo_excedente_copia_color: Number(datos.costo_excedente_impresion_color || 0),
    costo_excedente_impresion_bn: Number(datos.costo_excedente_impresion_bn || 0),
    costo_excedente_impresion_color: Number(datos.costo_excedente_impresion_color || 0),
    tiene_renta: Boolean(datos.tiene_renta),
    tiene_software_control: Boolean(datos.tiene_software_control),
    printer_bill: datos.printer_bill,
});

export const datosClienteNuevo = (datos: FormularioCliente) => ({
    nombre: datos.nombre,
    ruc: datos.ruc,
    razon_social: datos.razon_social,
    tiene_renta: Boolean(datos.tiene_renta),
    tiene_software_control: Boolean(datos.tiene_software_control),
    printer_bill: datos.printer_bill,
});

export const datosClienteEditado = (datos: FormularioCliente) => ({
    nombre: datos.nombre,
    ruc: datos.ruc,
    razon_social: datos.razon_social,
    activo: datos.activo,
    tiene_renta: Boolean(datos.tiene_renta),
    tiene_software_control: Boolean(datos.tiene_software_control),
    printer_bill: datos.printer_bill,
});

// Textos del modal de confirmación: los propios del aviso, o los de activar o desactivar el cliente
export const textosModalCliente = (modal: {
    type: 'delete' | 'activate' | 'info' | 'warning';
    cliente: ClienteParaTabla | null;
    title?: string;
    message?: string;
    confirmText?: string;
    showCancel?: boolean;
}) => {
    const desactivar = modal.type === 'delete';
    const nombre = modal.cliente?.nombre;
    return {
        title: modal.title || (desactivar ? '¿Desactivar cliente?' : '¿Activar cliente?'),
        message: modal.message || (desactivar
            ? `¿Estás seguro de que deseas desactivar al cliente "${nombre}"? Podrás reactivarlo después si lo necesitas.`
            : `¿Deseas activar al cliente "${nombre}"?`),
        confirmText: modal.confirmText || (desactivar ? 'Desactivar' : 'Activar'),
        showCancel: modal.showCancel ?? true,
    };
};

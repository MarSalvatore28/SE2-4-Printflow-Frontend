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

// Modos de facturación del contrato, escritos como los compara el backend (src/utils/facturacion.js)
export const FACTURACION = {
    DIFERENCIAR: 'Diferenciar B/N de Color',
    TODO_COLOR: 'Todo como color',
} as const;

export const OPCIONES_FACTURACION = [
    { valor: FACTURACION.DIFERENCIAR, etiqueta: 'Diferenciar B/N de color' },
    { valor: FACTURACION.TODO_COLOR, etiqueta: 'Todo como color' },
] as const;

// «Todo como Color» (como se guardaba antes) o «todo como color» son el mismo modo.
// Lo que no se reconoce se trata como «Diferenciar», igual que el cálculo del backend.
export const normalizarFacturacion = (valor?: string | null): string =>
    valor?.trim().replace(/\s+/g, ' ').toLowerCase() === FACTURACION.TODO_COLOR.toLowerCase()
        ? FACTURACION.TODO_COLOR
        : FACTURACION.DIFERENCIAR;

// Texto que ve el usuario para el modo de facturación ('-' si el cliente no tiene contrato)
export const etiquetaFacturacion = (valor?: string | null): string =>
    (valor && OPCIONES_FACTURACION.find((o) => o.valor === normalizarFacturacion(valor))?.etiqueta) || '-';

// Mensaje de advertencia si falta un dato obligatorio, o null si se puede guardar
export const faltanteContrato = (datos: FormularioCliente): string | null => {
    if (!datos.cliente_id) return 'Debe asignar un cliente para guardar el contrato.';
    if (!datos.fecha_inicio) return 'La fecha de inicio es obligatoria para el contrato.';
    return null;
};

// RUC de Ecuador, la misma regla del backend: 13 dígitos, provincia 01 a 24 (o 30, extranjeros)
// y establecimiento 001. Devuelve el motivo o null si es válido (vacío también es «válido» aquí:
// lo marca faltanteCliente).
export const errorRuc = (ruc: string): string | null => {
    if (!ruc) return null;
    if (!/^\d{13}$/.test(ruc)) return 'El RUC debe tener exactamente 13 dígitos';
    const provincia = Number(ruc.slice(0, 2));
    if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) {
        return 'Los primeros 2 dígitos deben estar entre 01 y 24 (o ser 30)';
    }
    if (!ruc.endsWith('001')) return 'El RUC debe terminar en 001';
    return null;
};

// Nombre y razón social: cualquier letra, número, espacio o signo (tildes, comillas, paréntesis,
// «&»...); solo se rechazan los caracteres de control. Antes no se podían escribir ni editar
// nombres como «Colegio Horizonte (demo)» o «O'Brien & Hijos».
export const textoPermitido = (valor: string) =>
    !Array.from(valor).some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127);

export const faltanteCliente = (datos: FormularioCliente): string | null => {
    if (!datos.nombre?.trim()) return 'El nombre del cliente es un campo obligatorio.';
    if (!datos.ruc) return 'El RUC del cliente es un campo obligatorio.';
    const rucInvalido = errorRuc(datos.ruc);
    if (rucInvalido) return `${rucInvalido}.`;
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

// Datos del cliente que se guardan (nuevo o editado). El contrato se edita en su pestaña y el
// estado con Activar/Desactivar, que hacen la cascada: aquí no van.
const datosCliente = (datos: FormularioCliente) => ({
    nombre: datos.nombre.trim(),
    ruc: datos.ruc,
    razon_social: datos.razon_social?.trim() || null,
});

export const datosClienteNuevo = datosCliente;
export const datosClienteEditado = datosCliente;

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

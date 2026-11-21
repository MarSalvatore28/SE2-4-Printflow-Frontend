import type { InstalacionFormData } from '@models/Instalacion/Instalacion.types';
import type { MaquinaConIP } from '@app/maquina_asignacion/components/AsignacionMaquinaDetailsFields';

// IPv4: cuatro números de 1 a 3 cifras, cada uno hasta 255 (se aceptan ceros a la izquierda, como antes)
const OCTETO = /^\d{1,3}$/;
const esIPv4 = (ip: string) => {
    const partes = ip.split('.');
    return partes.length === 4 && partes.every((p) => OCTETO.test(p) && Number(p) <= 255);
};

const vacio = (texto?: string) => !texto || texto.trim() === '';

// La IP en su forma normal (010.020.001.011 = 10.20.1.11), como la guarda el backend
const ipNormal = (ip: string) => ip.trim().split('.').map(Number).join('.');

export type ErroresFormulario = Record<string, string>;

// Errores de la instalación múltiple: cada máquina necesita área e IP válida
const erroresMultiple = (maquinas: MaquinaConIP[]): ErroresFormulario => {
    const errores: ErroresFormulario = {};
    if (maquinas.length === 0) errores.maquina = 'Debe agregar al menos una máquina';
    // Dos máquinas de la misma tanda no pueden llevar la misma IP (la API rechazaría la segunda)
    const ipsUsadas = new Map<string, string>();
    maquinas.forEach((item, index) => {
        if (!item.area_id) errores[`area_${index}`] = `Seleccione un área para la máquina ${item.maquina.serie}`;
        if (vacio(item.ip_address)) {
            errores[`ip_${index}`] = `La máquina ${item.maquina.serie} requiere una dirección IP`;
        } else if (!esIPv4(item.ip_address.trim())) {
            errores[`ip_${index}`] = `IP inválida para ${item.maquina.serie}`;
        } else {
            const ip = ipNormal(item.ip_address);
            const otra = ipsUsadas.get(ip);
            if (otra) errores[`ip_${index}`] = `La IP ${ip} de ${item.maquina.serie} ya la lleva ${otra} en esta lista`;
            else ipsUsadas.set(ip, item.maquina.serie);
        }
    });
    return errores;
};

// Errores de la instalación de una sola máquina
const erroresSimple = (datos: InstalacionFormData): ErroresFormulario => {
    const errores: ErroresFormulario = {};
    if (!datos.area_id) errores.area = 'Debe seleccionar un área';
    if (!datos.maquina_id) errores.maquina = 'Debe seleccionar una máquina';
    if (vacio(datos.ip_address)) {
        errores.ip_address = 'La dirección IP es obligatoria';
    } else if (!esIPv4(datos.ip_address.trim())) {
        errores.ip_address = 'Formato de IP inválido';
    }
    return errores;
};

export const validarFormularioInstalacion = ({
    clienteId,
    datos,
    multiple,
    maquinas,
    hoy,
}: {
    clienteId?: number;
    datos: InstalacionFormData;
    multiple: boolean;
    maquinas: MaquinaConIP[];
    /** 'YYYY-MM-DD' de hoy: la fecha de instalación no puede ser posterior */
    hoy?: string;
}): ErroresFormulario => {
    const errores: ErroresFormulario = {};
    if (!clienteId) errores.cliente = 'Debe seleccionar un cliente';
    if (!datos.contrato_id) errores.contrato = 'Debe seleccionar un contrato';
    if (!datos.fecha_instalacion) errores.fecha = 'Indique la fecha de instalación';
    else if (hoy && datos.fecha_instalacion > hoy) errores.fecha = 'La fecha de instalación no puede ser futura';
    return { ...errores, ...(multiple ? erroresMultiple(maquinas) : erroresSimple(datos)) };
};

// Filas del modal «Formulario incompleto»: las claves con guion bajo son de una máquina
export const detallesDeErrores = (errores: ErroresFormulario) =>
    Object.entries(errores).map(([clave, text]) => ({
        label: clave.includes('_') ? 'Revisión' : clave.charAt(0).toUpperCase() + clave.slice(1),
        text,
    }));

// Lo que se manda a la API por cada máquina de la instalación múltiple
export const datosDeMaquina = (item: MaquinaConIP, datos: InstalacionFormData): InstalacionFormData => ({
    maquina_id: item.maquina.id_maquina,
    area_id: item.area_id || 0,
    contrato_id: datos.contrato_id,
    ip_address: item.ip_address.trim(),
    fecha_instalacion: datos.fecha_instalacion,
    observaciones: item.observaciones?.trim() || undefined,
    costo_renta_mensual: item.costo_renta_mensual || 0,
    contador_acumulativo: item.contador_acumulativo,
    contabilidad_por_usuario: item.contabilidad_por_usuario,
});

// Lo que se manda a la API en la instalación de una sola máquina
export const datosDeFormulario = (datos: InstalacionFormData): InstalacionFormData => ({
    maquina_id: datos.maquina_id,
    area_id: datos.area_id,
    contrato_id: datos.contrato_id,
    ip_address: datos.ip_address.trim(),
    fecha_instalacion: datos.fecha_instalacion,
    observaciones: datos.observaciones?.trim() || undefined,
    costo_renta_mensual: datos.costo_renta_mensual || 0,
    contador_acumulativo: datos.contador_acumulativo,
    contabilidad_por_usuario: datos.contabilidad_por_usuario,
});

// Mensaje de un error de la API (axios o fetch) o el texto por defecto
export const mensajeDeError = (err: unknown, porDefecto: string): string => {
    const error = err as { message?: string; response?: { data?: { message?: string } } } | null;
    return error?.response?.data?.message || error?.message || porDefecto;
};

// ¿Se puede enviar? Cliente y contrato, y las máquinas (múltiple) o área, máquina e IP (simple)
export const puedeEnviarInstalacion = ({
    clienteId,
    datos,
    multiple,
    maquinas,
}: {
    clienteId?: number;
    datos: InstalacionFormData;
    multiple: boolean;
    maquinas: MaquinaConIP[];
}): boolean => {
    if (!clienteId || datos.contrato_id <= 0) return false;
    if (multiple) return maquinas.length > 0;
    return datos.area_id > 0 && datos.maquina_id > 0 && datos.ip_address.trim() !== '';
};

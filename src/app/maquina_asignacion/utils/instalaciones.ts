import type { InstalacionActivaCliente } from '@models/Instalacion/Instalacion.types';

// Datos que se editan de una instalación activa
export interface DatosEdicionInstalacion {
    ip_address: string;
    costo_renta_mensual: number;
    contador_acumulativo: boolean;
    contabilidad_por_usuario: boolean;
    fecha_instalacion: string;
}

const hoyIso = () => new Date().toISOString().split('T')[0];

export const datosEdicionVacios = (): DatosEdicionInstalacion => ({
    ip_address: '',
    costo_renta_mensual: 0,
    contador_acumulativo: true,
    contabilidad_por_usuario: false,
    fecha_instalacion: hoyIso(),
});

// Valores iniciales del formulario de edición. Sin renta de equipo el costo es 0.
export const datosEdicionDe = (instalacion: InstalacionActivaCliente): DatosEdicionInstalacion => ({
    ip_address: instalacion.ip_address || '',
    costo_renta_mensual: instalacion.renta_equipo ? (Number(instalacion.costo_renta_mensual) || 0) : 0,
    contador_acumulativo: instalacion.contador_acumulativo !== false,
    contabilidad_por_usuario: instalacion.contabilidad_por_usuario === true,
    fecha_instalacion: instalacion.fecha_instalacion
        ? instalacion.fecha_instalacion.split('T')[0]
        : hoyIso(),
});

// Cada palabra del término debe aparecer en la serie, el modelo, el área o la IP
export const filtrarInstalaciones = (
    instalaciones: InstalacionActivaCliente[],
    termino: string,
): InstalacionActivaCliente[] => {
    const palabras = termino.toLowerCase().split(' ').filter(palabra => palabra.length > 0);
    if (palabras.length === 0) return instalaciones;
    return instalaciones.filter(instalacion =>
        palabras.every(palabra =>
            instalacion.serie?.toLowerCase().includes(palabra) ||
            instalacion.modelo_nombre?.toLowerCase().includes(palabra) ||
            instalacion.area_nombre?.toLowerCase().includes(palabra) ||
            instalacion.ip_address?.toLowerCase().includes(palabra)
        )
    );
};

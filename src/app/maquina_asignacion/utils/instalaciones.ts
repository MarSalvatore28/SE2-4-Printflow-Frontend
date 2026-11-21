import type { InstalacionActivaCliente } from '@models/Instalacion/Instalacion.types';

// Datos que se editan de una instalación activa
export interface DatosEdicionInstalacion {
    ip_address: string;
    costo_renta_mensual: number;
    contador_acumulativo: boolean;
    contabilidad_por_usuario: boolean;
    fecha_instalacion: string;
}

// Hoy en la hora local del navegador (toISOString daría mañana después de las 19:00 en Ecuador)
export const hoyIso = (ahora: Date = new Date()) =>
    `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;

// 'YYYY-MM-DD...' → 'DD/MM/YYYY', sin pasar por Date (no cambia de día con la zona horaria)
export const fechaCorta = (fecha?: string | null): string => {
    const [anio, mes, dia] = (fecha || '').slice(0, 10).split('-');
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : '';
};

// Un contrato se reconoce por su vigencia, no por su id interno:
// «Contrato desde 01/01/2026 hasta 31/12/2026», con un aviso si hoy no está vigente
export const etiquetaContrato = (
    contrato: { fecha_inicio: string; fecha_fin?: string | null },
    hoy: string = hoyIso(),
): string => {
    const inicio = contrato.fecha_inicio.slice(0, 10);
    const fin = contrato.fecha_fin ? contrato.fecha_fin.slice(0, 10) : null;
    let texto = `Contrato desde ${fechaCorta(inicio)}${fin ? ` hasta ${fechaCorta(fin)}` : ' (sin fecha de fin)'}`;
    if (fin && fin < hoy) texto += ' · vencido';
    else if (inicio > hoy) texto += ' · aún no empieza';
    return texto;
};

// Máquina para mostrar: serie y modelo
export const etiquetaMaquina = (maquina?: { serie?: string; modelo_nombre?: string | null } | null): string =>
    maquina?.serie ? `${maquina.serie} · ${maquina.modelo_nombre || 'Sin modelo'}` : '';

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

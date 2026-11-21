import type { Maquina } from '@models/Maquina/maquina.types';
import { formatFechaISO } from '@utils/formatUtils';

// Valores del formulario de reemplazo, tal como se escriben (texto)
export interface ValoresReemplazo {
    fecha_danio: string;
    fecha_instalacion_entrante: string;
    periodo_afectado: string;
    tipo_cambio: string;
    razon_cambio: string;
    contador_final_saliente_bn: string;
    contador_final_saliente_color: string;
    contador_inicial_entrante_bn: string;
    contador_inicial_entrante_color: string;
    ip_address: string;
}

export type CampoReemplazo = keyof ValoresReemplazo | 'saliente' | 'entrante';
export type ErroresReemplazo = Partial<Record<CampoReemplazo, string>>;

const PERIODO = /^\d{4}-\d{2}$/;
const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const CONTADORES = [
    'contador_final_saliente_bn',
    'contador_final_saliente_color',
    'contador_inicial_entrante_bn',
    'contador_inicial_entrante_color',
] as const;

export const periodoSiguiente = (periodo: string) => {
    const [anio, mes] = periodo.split('-').map(Number);
    return mes === 12 ? `${anio + 1}-01` : `${anio}-${String(mes + 1).padStart(2, '0')}`;
};

export const esEntero = (v: string) => /^\d+$/.test(v.trim());

const errorFechaDanio = (valores: ValoresReemplazo, saliente: Maquina | null, hoy: string) => {
    if (!valores.fecha_danio) return 'Indique la fecha del daño';
    if (valores.fecha_danio > hoy) return 'La fecha del daño no puede ser futura';
    if (saliente?.fecha_instalacion && valores.fecha_danio < saliente.fecha_instalacion) {
        return `No puede ser anterior a la instalación de ${saliente.serie} (${formatFechaISO(saliente.fecha_instalacion)})`;
    }
    return undefined;
};

const errorFechaEntrante = (valores: ValoresReemplazo, hoy: string) => {
    if (!valores.fecha_instalacion_entrante) return 'Indique la fecha de instalación de la entrante';
    if (valores.fecha_instalacion_entrante > hoy) return 'La fecha de instalación no puede ser futura';
    if (valores.fecha_danio && valores.fecha_instalacion_entrante < valores.fecha_danio) {
        return 'No puede ser anterior a la fecha del daño';
    }
    return undefined;
};

// El período afectado es el mes del daño o el siguiente
const errorPeriodo = (valores: ValoresReemplazo) => {
    if (!PERIODO.test(valores.periodo_afectado)) return 'Indique el período afectado';
    if (!valores.fecha_danio) return undefined;
    const mes = valores.fecha_danio.slice(0, 7);
    const siguiente = periodoSiguiente(mes);
    if (valores.periodo_afectado !== mes && valores.periodo_afectado !== siguiente) {
        return `Debe ser el mes del daño (${mes}) o el siguiente (${siguiente})`;
    }
    return undefined;
};

const errorIp = (ip: string) =>
    ip.trim() && !IPV4.test(ip.trim()) ? 'IPv4 válida, p. ej. 10.20.1.12' : undefined;

// Mismas reglas y mensajes que antes; solo quedan los campos con error
export const validarReemplazo = (
    valores: ValoresReemplazo,
    saliente: Maquina | null,
    entrante: Maquina | null,
    hoy: string,
): ErroresReemplazo => {
    const errores: ErroresReemplazo = {
        saliente: saliente ? undefined : 'Seleccione la máquina que sale (debe estar asignada)',
        entrante: entrante ? undefined : 'Seleccione la máquina que entra (debe estar libre)',
        fecha_danio: errorFechaDanio(valores, saliente, hoy),
        fecha_instalacion_entrante: errorFechaEntrante(valores, hoy),
        periodo_afectado: errorPeriodo(valores),
        tipo_cambio: valores.tipo_cambio ? undefined : 'Seleccione el tipo de cambio',
        razon_cambio: valores.razon_cambio.trim().length < 5 ? 'Describa la razón del cambio (mínimo 5 caracteres)' : undefined,
    };
    CONTADORES.forEach(c => {
        if (!esEntero(valores[c])) errores[c] = 'Número entero mayor o igual a 0';
    });
    errores.ip_address = errorIp(valores.ip_address);
    return Object.fromEntries(Object.entries(errores).filter(([, v]) => v)) as ErroresReemplazo;
};

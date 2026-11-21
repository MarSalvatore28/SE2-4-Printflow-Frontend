/**
 * Reemplazo de máquina tal como lo devuelve GET /api/maquinas-cambio.
 * Los contadores son el total B/N y el total color del equipo (impresiones + copias).
 */
export interface Reemplazo {
    id_maquina_cambio: number;
    /** YYYY-MM */
    periodo_afectado: string;
    /** YYYY-MM-DD */
    fecha_danio: string;
    /** YYYY-MM-DD */
    fecha_instalacion_entrante: string;
    tipo_cambio: string;
    razon_cambio: string;
    /** false si el reemplazo se anuló (el listado no los trae) */
    activo: boolean;
    fecha_registro: string;
    fecha_anulacion?: string | null;
    motivo_anulacion?: string | null;
    usuario_anulacion_nombre?: string | null;
    area_id: number;
    area_nombre: string;
    cliente_id: number;
    cliente_nombre: string;
    maquina_saliente_id: number;
    saliente_serie: string;
    saliente_modelo: string | null;
    instalacion_saliente_id: number | null;
    maquina_entrante_id: number;
    entrante_serie: string;
    entrante_modelo: string | null;
    instalacion_entrante_id: number | null;
    entrante_ip: string | null;
    /** null en un reemplazo anulado: sus contadores se borran */
    saliente_contador_final_bn: number | null;
    saliente_contador_final_color: number | null;
    entrante_contador_inicial_bn: number | null;
    entrante_contador_inicial_color: number | null;
    /** true cuando el lote del período ya se aprobó con el cambio enlazado */
    periodo_aprobado: boolean;
}

/** Cuerpo de POST /api/maquinas-cambio */
export interface ReemplazoFormData {
    maquina_saliente_id: number;
    maquina_entrante_id: number;
    fecha_danio: string;
    fecha_instalacion_entrante: string;
    periodo_afectado: string;
    tipo_cambio: string;
    razon_cambio: string;
    contador_final_saliente_bn: number;
    contador_final_saliente_color: number;
    contador_inicial_entrante_bn: number;
    contador_inicial_entrante_color: number;
    ip_address?: string | null;
}

/** Última lectura aprobada de una máquina antes de un período */
export interface LecturaAprobada {
    periodo: string;
    bn: number;
    color: number;
}

export interface FiltrosReemplazo {
    cliente_id?: number;
    periodo?: string;
    maquina_id?: number;
}

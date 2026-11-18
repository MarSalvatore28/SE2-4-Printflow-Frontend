/**
 * Máquina tal como la devuelve GET /api/maquinas: datos propios, catálogo
 * (modelo, tipo, formato) y, si la tiene, su asignación vigente.
 */
export interface Maquina {
    id_maquina: number;
    /** Igual a id_maquina (lo agrega el servicio para el código que usa `id`). */
    id: number;
    serie: string;
    activo: boolean;

    modelo_id: number | null;
    modelo: string | null;
    tipo_impresion_id: number | null;
    tipo_impresion: string | null;
    formato_impresion_id: number | null;
    formato_impresion: string | null;

    /** true si tiene una asignación vigente (instalación activa sin retiro). */
    asignada: boolean;
    id_instalacion: number | null;
    ip: string | null;
    /** YYYY-MM-DD */
    fecha_instalacion: string | null;
    contrato_id: number | null;
    area_id: number | null;
    area_nombre: string | null;
    cliente_id: number | null;
    cliente_nombre: string | null;

    // Nombres alternativos que lee el filtro de la pantalla de Informes.
    // La API no los envía; se dejan opcionales para que ese código compile.
    idMaquina?: number;
    clienteId?: number;
    clienteIdcliente?: number;
    id_cliente?: number;
    idCliente?: number;
}

export interface MaquinaFormData {
    serie: string;
    modelo_id: number;
    tipo_impresion_id: number;
    formato_impresion_id?: number | null;
}

export interface Modelo {
    id_modelo: number;
    nombre: string;
    activo: boolean;
}

export interface TipoImpresion {
    id_tipo_impresion: number;
    nombre: string;
    activo: boolean;
}

export interface FormatoImpresion {
    id_formato: number;
    nombre: string;
    activo: boolean;
}

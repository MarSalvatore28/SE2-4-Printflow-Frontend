// S3-04 · Lectura manual (POST /api/lecturas/manual)

export interface LecturaManualFormData {
    instalacion_id: number;
    fecha_lectura: string; // AAAA-MM-DD
    contador_bn: number; // total B/N acumulado (impresiones + copias)
    contador_color: number; // total color acumulado (impresiones + copias)
    observacion: string;
}

// La lectura que guarda la API en los reportes oficiales del mes
export interface LecturaManual {
    id_reporte: number;
    periodo: string;
    maquina_id: number;
    cliente_id: number;
    contador_bn: number;
    contador_color: number;
    snap_maquina_serie: string;
    snap_maquina_ip: string | null;
    snap_area_nombre: string;
    fecha_corte: string;
    fecha_procesamiento: string;
    origen: 'MANUAL';
    observacion: string;
    usuario_registro_id: number;
    instalacion_id: number;
    area_id: number;
    cliente_nombre: string | null;
}

// La API rechazó la lectura: el motivo se muestra tal cual («Retroceso de contador: …»)
export class ErrorLecturaManual extends Error {
    readonly codigo: string | null;

    constructor(message: string, codigo: string | null = null) {
        super(message);
        this.name = 'ErrorLecturaManual';
        this.codigo = codigo;
    }
}

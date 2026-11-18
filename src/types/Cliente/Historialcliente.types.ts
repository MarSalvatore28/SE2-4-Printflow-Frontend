export interface HistorialData {
    id_historial: number;
    nombre_anterior: string;
    razon_social_anterior: string | null;
    ruc_anterior: string;
    fecha_cambio: string;
    nombre_actual: string;
    razon_social_actual: string | null;
    ruc_actual: string;
    cambio_nombre: boolean;
    cambio_razon_social: boolean;
    cambio_ruc: boolean;
}

export interface CambioDetalle {
    campo: string;
    anterior: string;
    actual: string;
}


export interface AlertaHistorialClienteProps {
    clienteId: number;
    periodo?: string | null;
    clienteNombre?: string;
}

export interface ModalHistorialClienteProps {
    clienteId: number;
    isOpen: boolean;
    onClose: () => void;
    clienteNombre?: string;
}

export interface TieneHistorialResponse {
    success: boolean;
    tiene_historial: boolean;
}

export interface UltimoCambioResponse {
    success: boolean;
    data: HistorialData | null;
    message?: string;
}

export interface HistorialCompletoResponse {
    success: boolean;
    data: HistorialData[];
    count: number;
}

export interface MaquinaConArea {
    idMaquina: number;
    serie: string;
    modelo: string;
    formato_impresion: string;
    tipo_impresion: string;
    ip: string;
    precioAlquiler: number;
    acumulativo: string;
    activo: number;
    area_id: number | null;
    area_nombre: string | null;
    area_descripcion: string | null;
    id_cliente: number;
    cliente_nombre: string;
    cliente_razon_social: string;
    fechaConteo: string;
}

export interface MaquinaDisponible {
    idMaquina: number;
    serie: string;
    modelo: string;
    formato_impresion: string;
    tipo_impresion: string;
    ip: string;
    precioAlquiler: number;
    acumulativo: string;
}

export interface MaquinaSinArea {
    idMaquina: number;
    serie: string;
    modelo: string;
    formato_impresion: string;
    tipo_impresion: string;
    ip: string;
    precioAlquiler: number;
    acumulativo: string;
}

export interface ResumenMaquinasPorArea {
    area_id: number;
    area_nombre: string;
    total_maquinas: number;
    total_alquiler: number;
    modelos: string;
    fechaConteo: string;
}

export interface AreaConCliente {
    id_area: number;
    area_nombre: string;
    area_descripcion: string | null;
    area_activa: number;
    id_cliente: number;
    cliente_nombre: string;
    razon_social: string;
    fechaConteo: string;
    total_maquinas: number;
}

export interface MaquinaParaAsignar {
    idMaquina: number;
    serie?: string;
    modelo?: string;
    ip: string;
}

export interface AsignacionFormData {
    cliente_id?: number;
    cliente_nombre?: string;
    area_id?: number;
    area_nombre?: string;
    maquinas: MaquinaParaAsignar[];
}

export interface AsignarMaquinaRequest {
    area_id: number;
    ip: string;
}

export interface AsignarMultiplesMaquinasRequest {
    area_id: number;
    maquinas: {
        idMaquina: number;
        ip: string;
    }[];
}

export interface MoverMaquinaRequest {
    nueva_area_id: number;
    nueva_ip: string;
}

export interface RemoverAreaMultiplesRequest {
    maquinas: number[];
}

export interface AsignarMaquinaResponse {
    maquina: {
        idMaquina: number;
        serie: string;
        modelo: string;
    };
    area: string;
    clienteId: number;
    fechaConteo: string;
    ip: string;
    ip_anterior: string;
}

export interface AsignarMultiplesResponse {
    affectedRows: number;
    area: string;
    clienteId: number;
    fechaConteo: string;
    maquinasActualizadas: {
        idMaquina: number;
        ip: string;
    }[];
}

export interface MoverMaquinaResponse {
    nuevoClienteId: number;
    clienteAnterior: number;
    nuevaArea: string;
    fechaConteo: string;
    ip_nueva: string;
    ip_anterior: string;
}

export interface RemoverAreaMultiplesResponse {
    affectedRows: number;
}

export interface AsignacionState {
    loading: boolean;
    error: string | null;
    success: boolean;
    message?: string;
}

export interface AsignacionListState {
    maquinasConAreas: MaquinaConArea[];
    maquinasDisponibles: MaquinaDisponible[];
    resumen: ResumenMaquinasPorArea[];
    loading: boolean;
    error: string | null;
}





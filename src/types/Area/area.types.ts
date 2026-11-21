export interface Area {
    id_area: number;
    cliente_id: number;
    id_cliente?: number;
    nombre: string;
    descripcion: string | null;
    activo: number; 
    cliente_nombre?: string;
    cliente_ruc?: string;
    cliente_razon_social?: string;

    total_instalaciones_activas?: number;
    total_instalaciones_historicas?: number;

    instalaciones_activas?: Record<string, unknown>[];
}

export interface AreaFormData {
    cliente_id: number | string;
    nombre: string;
    descripcion?: string | null;
}

export type AreaCreate = Omit<Area, 'id_area' | 'cliente_nombre' | 'total_instalaciones_activas'>;
export type AreaUpdate = Partial<AreaCreate>;


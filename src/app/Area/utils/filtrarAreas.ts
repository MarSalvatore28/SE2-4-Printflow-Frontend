import type { Area } from '@models/Area/area.types';

export interface FiltrosAreas {
    mostrarInactivas: boolean;
    areaId: number | null;
    clienteId: number | null;
    termino: string;
}

const coincideTermino = (area: Area, termino: string) =>
    termino.toLowerCase().split(' ').filter(palabra => palabra.length > 0).every(palabra =>
        area.nombre.toLowerCase().includes(palabra) ||
        area.cliente_nombre?.toLowerCase().includes(palabra) ||
        area.descripcion?.toLowerCase().includes(palabra)
    );

// Áreas visibles: oculta las inactivas (salvo que se pidan); un área elegida gana a los demás filtros
const areaVisible = (area: Area, { mostrarInactivas, areaId, clienteId, termino }: FiltrosAreas) => {
    if (!mostrarInactivas && area.activo !== 1) return false;
    if (areaId) return area.id_area === areaId;
    if (clienteId && area.cliente_id !== clienteId) return false;
    return !termino || coincideTermino(area, termino);
};

export const filtrarAreas = (areas: Area[], filtros: FiltrosAreas): Area[] =>
    areas.filter(area => areaVisible(area, filtros));

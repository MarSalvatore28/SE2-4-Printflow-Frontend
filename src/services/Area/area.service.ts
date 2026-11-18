import { getToken } from "@services/Auth/auth.service";
import type { Area, AreaFormData } from "@models/Area/area.types";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const RESOURCE_URL = `${API_BASE}/api/areas`;

const getAuthHeaders = (isPost = false) => {
    const token = getToken();
    const headers: any = {
        'Authorization': `Bearer ${token}`
    };
    if (isPost) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

/**
 * Normalizes area data from backend to ensure frontend consistency
 */
const mapArea = (a: any): Area => ({
    ...a,
    cliente_id: a.cliente_id || a.id_cliente,
    activo: (a.activo === true || a.activo === 1 || a.activo === '1') ? 1 : 0
});

export async function fetchAllAreas(): Promise<Area[]> {
    try {
        const res = await fetch(`${RESOURCE_URL}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        const areas = data.success ? data.data : [];
        return areas.map(mapArea);
    } catch (err) {
        console.error("Error fetchAllAreas:", err);
        throw err;
    }
}

export async function getAreaById(id: number): Promise<Area | null> {
    try {
        const res = await fetch(`${RESOURCE_URL}/${id}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        if (data.success && data.data) {
            return mapArea(data.data);
        }
        return null;
    } catch (err) {
        console.error("Error getAreaById:", err);
        throw err;
    }
}

export async function searchAreas(termino: string): Promise<Area[]> {
    try {
        const res = await fetch(`${RESOURCE_URL}/search?q=${encodeURIComponent(termino)}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        const areas = data.success ? data.data : [];
        return areas.map(mapArea);
    } catch (err) {
        console.error("Error searchAreas:", err);
        throw err;
    }
}

export async function getAreasByCliente(cliente_id: number): Promise<Area[]> {
    try {
        const res = await fetch(`${RESOURCE_URL}/cliente/${cliente_id}`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        const areas = data.success ? data.data : [];
        return areas.map(mapArea);
    } catch (err) {
        console.error("Error getAreasByCliente:", err);
        throw err;
    }
}

export async function getAreasActivas(): Promise<Area[]> {
    try {
        const res = await fetch(`${RESOURCE_URL}/activas`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        const areas = data.success ? data.data : [];
        return areas.map(mapArea);
    } catch (err) {
        console.error("Error getAreasActivas:", err);
        throw err;
    }
}

export async function getAreasInactivas(): Promise<Area[]> {
    try {
        const res = await fetch(`${RESOURCE_URL}/inactivas`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        const areas = data.success ? data.data : [];
        return areas.map(mapArea);
    } catch (err) {
        console.error("Error getAreasInactivas:", err);
        throw err;
    }
}

export async function createArea(area: AreaFormData): Promise<number | null> {
    try {
        const res = await fetch(`${RESOURCE_URL}`, {
            method: "POST",
            headers: getAuthHeaders(true),
            body: JSON.stringify(area),
        });
        if (!res.ok) throw new Error(`Error create: ${res.status}`);
        const data = await res.json();
        return data.success ? data.data.id_area : null;
    } catch (err) {
        console.error("Error createArea:", err);
        throw err;
    }
}

export async function updateArea(id: number, area: AreaFormData): Promise<boolean> {
    try {
        const res = await fetch(`${RESOURCE_URL}/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(true),
            body: JSON.stringify(area),
        });
        if (!res.ok) throw new Error(`Error update: ${res.status}`);
        const data = await res.json();
        return data.success;
    } catch (err) {
        console.error("Error updateArea:", err);
        throw err;
    }
}

export async function deleteArea(id: number): Promise<boolean> {
    try {
        const res = await fetch(`${RESOURCE_URL}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`Error delete: ${res.status}`);
        const data = await res.json();
        return data.success;
    } catch (err) {
        console.error("Error deleteArea:", err);
        throw err;
    }
}

export async function activarArea(id: number): Promise<boolean> {
    try {
        const res = await fetch(`${RESOURCE_URL}/${id}/activar`, {
            method: "PATCH",
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`Error activar: ${res.status}`);
        const data = await res.json();
        return data.success;
    } catch (err) {
        console.error("Error activarArea:", err);
        throw err;
    }
}

export async function getEstadisticasArea(id: number): Promise<any> {
    try {
        const res = await fetch(`${RESOURCE_URL}/${id}/estadisticas`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        return data.success ? data.data : null;
    } catch (err) {
        console.error("Error getEstadisticasArea:", err);
        throw err;
    }
}

export async function getHistorialCambiosArea(id: number): Promise<any[]> {
    try {
        const res = await fetch(`${RESOURCE_URL}/${id}/historial-cambios`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        return data.success ? data.data : [];
    } catch (err) {
        console.error("Error getHistorialCambiosArea:", err);
        throw err;
    }
}

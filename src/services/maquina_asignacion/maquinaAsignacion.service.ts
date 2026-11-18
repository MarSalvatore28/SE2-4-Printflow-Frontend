import type {
    AsignarMaquinaRequest,
    AsignarMultiplesMaquinasRequest,
    MoverMaquinaRequest,
    RemoverAreaMultiplesRequest,
} from '@models/maquina_asignacion/maquinaAsignacion.types';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const RESOURCE_URL = `${API_BASE}/api/asignaciones`;

import { getToken } from '@services/Auth/auth.service';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export async function getMaquinasDisponibles() {
    try {
        const res = await fetch(`${RESOURCE_URL}/maquinas/disponibles`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        return data.success ? data.data : [];
    } catch (err) {
        console.error("Error getMaquinasDisponibles:", err);
        throw err;
    }
}

export async function getMaquinasConAreasByCliente(clienteId: number) {
    try {
        const res = await fetch(`${RESOURCE_URL}/cliente/${clienteId}/maquinas`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        return data.success ? data.data : [];
    } catch (err) {
        console.error("Error getMaquinasConAreasByCliente:", err);
        throw err;
    }
}

export async function getMaquinasSinAreaByCliente(clienteId: number) {
    try {
        const res = await fetch(`${RESOURCE_URL}/cliente/${clienteId}/maquinas/sin-area`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        return data.success ? data.data : [];
    } catch (err) {
        console.error("Error getMaquinasSinAreaByCliente:", err);
        throw err;
    }
}

export async function getResumenMaquinasPorCliente(clienteId: number) {
    try {
        const res = await fetch(`${RESOURCE_URL}/cliente/${clienteId}/resumen`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        return data.success ? data.data : [];
    } catch (err) {
        console.error("Error getResumenMaquinasPorCliente:", err);
        throw err;
    }
}

export async function getAreaConCliente(areaId: number) {
    try {
        const res = await fetch(`${RESOURCE_URL}/area/${areaId}/info`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        return data.success ? data.data : null;
    } catch (err) {
        console.error("Error getAreaConCliente:", err);
        throw err;
    }
}

export async function getMaquinasByArea(areaId: number) {
    try {
        const res = await fetch(`${RESOURCE_URL}/area/${areaId}/maquinas`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const data = await res.json();
        return data.success ? data.data : [];
    } catch (err) {
        console.error("Error getMaquinasByArea:", err);
        throw err;
    }
}

export async function asignarMaquinaAArea(
    idMaquina: number,
    request: AsignarMaquinaRequest
) {
    try {
        const res = await fetch(`${RESOURCE_URL}/maquina/${idMaquina}/asignar`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('API Error Response [PATCH asignar]:', errorText);
            throw new Error(`Error asignar: ${res.status} - ${errorText}`);
        }
        const data = await res.json();
        return data.success ? data.data : null;
    } catch (err) {
        console.error("Error asignarMaquinaAArea:", err);
        throw err;
    }
}

export async function asignarMultiplesMaquinasAArea(
    request: AsignarMultiplesMaquinasRequest
) {
    try {
        const res = await fetch(`${RESOURCE_URL}/asignar-multiples`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('API Error Response [POST asignar-multiples]:', errorText);
            throw new Error(`Error asignar múltiples: ${res.status} - ${errorText}`);
        }
        const data = await res.json();
        return data.success ? data.data : null;
    } catch (err) {
        console.error("Error asignarMultiplesMaquinasAArea:", err);
        throw err;
    }
}

export async function moverMaquinaEntreAreas(
    idMaquina: number,
    request: MoverMaquinaRequest
) {
    try {
        const res = await fetch(`${RESOURCE_URL}/maquina/${idMaquina}/mover`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('API Error Response [PATCH mover]:', errorText);
            throw new Error(`Error mover: ${res.status} - ${errorText}`);
        }
        const data = await res.json();
        return data.success ? data.data : null;
    } catch (err) {
        console.error("Error moverMaquinaEntreAreas:", err);
        throw err;
    }
}

export async function removerAreaDeMaquina(idMaquina: number) {
    try {
        const res = await fetch(`${RESOURCE_URL}/maquina/${idMaquina}/remover-area`, {
            method: "PATCH",
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`Error remover área: ${res.status}`);
        const data = await res.json();
        return data.success;
    } catch (err) {
        console.error("Error removerAreaDeMaquina:", err);
        throw err;
    }
}

export async function removerAreaDeMultiplesMaquinas(
    request: RemoverAreaMultiplesRequest
) {
    try {
        const res = await fetch(`${RESOURCE_URL}/remover-area-multiples`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('API Error Response [POST remover-multiples]:', errorText);
            throw new Error(`Error remover múltiples: ${res.status} - ${errorText}`);
        }
        const data = await res.json();
        return data.success ? data.data : null;
    } catch (err) {
        console.error("Error removerAreaDeMultiplesMaquinas:", err);
        throw err;
    }
}
import type {
    InstalacionCompleta,
    InstalacionActivaCliente,
    MaquinaSinInstalacion,
    HistorialInstalacion,
    ResumenInstalacionesCliente,
    InstalacionDetallada,
    InstalacionFormData,
    CrearInstalacionResponse,
    RetirarInstalacionResponse,
    RetirarInstalacionFormData,
    Area,
    Contrato,
    ApiResponse
} from '@models/Instalacion/Instalacion.types';
import { getToken } from '@services/Auth/auth.service';
import { apiFetch } from '@services/api';


const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

/**
 * Obtiene información completa de una máquina por su ID
 */
export async function getInstalacionByMaquina(maquinaId: number): Promise<InstalacionCompleta | null> {
    const res = await apiFetch(`/api/instalacion/maquina/${maquinaId}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error fetching instalacion by maquina: ${res.status}`);
    const data: ApiResponse<InstalacionCompleta> = await res.json();
    return data.success ? data.data ?? null : null;
}

/**
 * Busca una instalación activa por dirección IP
 */
export async function getInstalacionByIP(ip: string): Promise<InstalacionCompleta | null> {
    const res = await apiFetch(`/api/instalacion/ip/${ip}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error fetching instalacion by IP: ${res.status}`);
    const data: ApiResponse<InstalacionCompleta> = await res.json();
    return data.success ? data.data ?? null : null;
}

/**
 * Obtiene información completa de una máquina por su número de serie
 */
export async function getInstalacionBySerie(serie: string): Promise<InstalacionCompleta | null> {
    const res = await apiFetch(`/api/instalacion/serie/${serie}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error fetching instalacion by serie: ${res.status}`);
    const data: ApiResponse<InstalacionCompleta> = await res.json();
    return data.success ? data.data ?? null : null;
}

/**
 * Obtiene todas las instalaciones activas de un cliente específico
 */
export async function getInstalacionesActivasByCliente(clienteId: number): Promise<InstalacionActivaCliente[]> {
    const res = await apiFetch(`/api/instalacion/cliente/${clienteId}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error fetching instalaciones by cliente: ${res.status}`);
    const data: ApiResponse<InstalacionActivaCliente[]> = await res.json();
    return data.success ? data.data ?? [] : [];
}

/**
 * Obtiene TODAS las instalaciones activas de TODOS los clientes
 */
export async function getTodasInstalacionesActivas(): Promise<InstalacionActivaCliente[]> {
    const res = await apiFetch(`/api/instalacion/instalaciones/activas`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error fetching todas las instalaciones activas: ${res.status}`);
    const data: ApiResponse<InstalacionActivaCliente[]> = await res.json();
    return data.success ? data.data ?? [] : [];
}

/**
 * Obtiene máquinas disponibles (sin instalación activa)
 */
export async function getMaquinasDisponibles(): Promise<MaquinaSinInstalacion[]> {
    const res = await apiFetch(`/api/instalacion/disponibles`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error fetching maquinas disponibles: ${res.status}`);
    const data: ApiResponse<MaquinaSinInstalacion[]> = await res.json();
    return data.success ? data.data ?? [] : [];
}

/**
 * Obtiene el historial completo de instalaciones de una máquina
 */
export async function getHistorialInstalacionesByMaquina(maquinaId: number): Promise<HistorialInstalacion[]> {
    const res = await apiFetch(`/api/instalacion/historial/maquina/${maquinaId}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error fetching historial instalaciones: ${res.status}`);
    const data: ApiResponse<HistorialInstalacion[]> = await res.json();
    return data.success ? data.data ?? [] : [];
}

/**
 * Obtiene resumen de instalaciones agrupadas por área de un cliente
 */
export async function getResumenInstalacionesByCliente(clienteId: number): Promise<ResumenInstalacionesCliente[]> {
    const res = await apiFetch(`/api/instalacion/resumen/cliente/${clienteId}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error fetching resumen instalaciones: ${res.status}`);
    const data: ApiResponse<ResumenInstalacionesCliente[]> = await res.json();
    return data.success ? data.data ?? [] : [];
}

/**
 * Obtiene una instalación específica por ID
 */
export async function getInstalacionById(idInstalacion: number): Promise<InstalacionDetallada | null> {
    const res = await apiFetch(`/api/instalacion/${idInstalacion}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error fetching instalacion by ID: ${res.status}`);
    const data: ApiResponse<InstalacionDetallada> = await res.json();
    return data.success ? data.data ?? null : null;
}


/**
 * Crea una nueva instalación
 */
export async function createInstalacion(instalacion: InstalacionFormData): Promise<CrearInstalacionResponse> {
    const res = await apiFetch(`/api/instalacion`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(instalacion),
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error creating instalacion: ${res.status}`);
    }
    const data: ApiResponse<CrearInstalacionResponse> = await res.json();
    if (!data.success || !data.data) {
        throw new Error('Error al crear instalación');
    }
    return data.data;
}

/**
 * Retira una instalación (marca como inactiva)
 */
export async function retirarInstalacion(
    idInstalacion: number,
    formData: RetirarInstalacionFormData
): Promise<RetirarInstalacionResponse> {
    const res = await apiFetch(`/api/instalacion/${idInstalacion}/retirar`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error retiring instalacion: ${res.status}`);
    }
    const data: ApiResponse<RetirarInstalacionResponse> = await res.json();
    if (!data.success || !data.data) {
        throw new Error('Error al retirar instalación');
    }
    return data.data;
}

/**
 * Actualiza la dirección IP de una instalación activa
 */

export async function updateInstalacion(
    idInstalacion: number,
    formData: {
        ip_address: string;
        costo_renta_mensual: number;
        contador_acumulativo: boolean;
        contabilidad_por_usuario: boolean;
        fecha_instalacion?: string;
    }
): Promise<any> {
    const res = await apiFetch(`/api/instalacion/${idInstalacion}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error updating instalación: ${res.status}`);
    }
    const data = await res.json();
    if (!data.success || !data.data) {
        throw new Error('Error al actualizar instalación');
    }
    return data.data;
}
/**
 * Obtiene todas las áreas activas (para select general)
 */
export async function getAllAreas(): Promise<Area[]> {
    const res = await apiFetch(`/api/instalacion/areas`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error fetching areas: ${res.status}`);
    const data: ApiResponse<Area[]> = await res.json();
    return data.success ? data.data ?? [] : [];
}

/**
 * Obtiene áreas de un cliente específico (para select filtrado)
 */
export async function getAreasByCliente(clienteId: number): Promise<Area[]> {
    const res = await apiFetch(`/api/instalacion/areas/cliente/${clienteId}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error fetching areas by cliente: ${res.status}`);
    const data: ApiResponse<Area[]> = await res.json();
    return data.success ? data.data ?? [] : [];
}

/**
 * Obtiene contratos activos de un cliente (para select)
 */
export async function getContratosByCliente(clienteId: number): Promise<Contrato[]> {
    const res = await apiFetch(`/api/instalacion/contratos/cliente/${clienteId}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error fetching contratos by cliente: ${res.status}`);
    const data: ApiResponse<Contrato[]> = await res.json();
    return data.success ? data.data ?? [] : [];
}
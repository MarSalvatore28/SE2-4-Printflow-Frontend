import type {
  ClienteParaTabla,
  ClienteCompleto,
  Contrato,
  InstalacionActiva
} from '@models/Cliente/cliente.types';
import { getToken } from '@services/Auth/auth.service';
import { apiFetch } from '@services/api';

const RESOURCE_URL = '/api/clientes'; // apiFetch agrega la URL base

const getAuthHeaders = (isPost = false) => {
  const token = getToken();
  return {
    ...(isPost ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export async function fetchAllClientes(): Promise<ClienteParaTabla[]> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error("Error fetchAllClientes:", err);
    throw err;
  }
}

export async function fetchClientesInactivos(): Promise<ClienteParaTabla[]> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/inactivos`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error("Error fetchClientesInactivos:", err);
    throw err;
  }
}

export async function getClienteById(id: number): Promise<ClienteParaTabla | null> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error("Error getClienteById:", err);
    throw err;
  }
}

export async function getClienteCompleto(id: number): Promise<ClienteCompleto | null> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/${id}/completo`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error("Error getClienteCompleto:", err);
    throw err;
  }
}

export async function searchClientes(termino: string): Promise<ClienteParaTabla[]> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/search?q=${encodeURIComponent(termino)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const result = await res.json();
    return result.success ? result.data : [];
  } catch (err) {
    console.error("Error searchClientes:", err);
    throw err;
  }
}

export async function getClienteByRuc(ruc: string): Promise<ClienteParaTabla | null> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/ruc/${ruc}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error("Error getClienteByRuc:", err);
    throw err;
  }
}

export async function createCliente(cliente: any): Promise<number> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(cliente),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Error create: ${res.status}`);
    }

    const data = await res.json();
    return data.success ? data.data.id_cliente : 0;
  } catch (err) {
    console.error("Error createCliente:", err);
    throw err;
  }
}

export async function updateCliente(id: number, cliente: any): Promise<boolean> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify(cliente),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Error update: ${res.status}`);
    }

    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error("Error updateCliente:", err);
    throw err;
  }
}

export async function deleteCliente(id: number): Promise<boolean> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(true)
    });

    if (!res.ok) throw new Error(`Error delete: ${res.status}`);

    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error("Error deleteCliente:", err);
    throw err;
  }
}

export async function activarCliente(id: number): Promise<boolean> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/${id}/activar`, {
      method: "PATCH",
      headers: getAuthHeaders(true)
    });
    if (!res.ok) throw new Error(`Error activating: ${res.status}`);
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error("Error activarCliente:", err);
    throw err;
  }
}

export async function getContratosByCliente(clienteId: number): Promise<Contrato[]> {
  try {
    const res = await apiFetch(`/api/contratos/cliente/${clienteId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error("Error getContratosByCliente:", err);
    throw err;
  }
}

export async function getContratoById(id: number): Promise<Contrato | null> {
  try {
    const res = await apiFetch(`/api/contratos/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Error fetching contrato: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error("Error getContratoById:", err);
    throw err;
  }
}

export async function createContrato(clienteId: number, contratoData: any) {
  try {
    const res = await apiFetch(`/api/contratos`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        ...contratoData,
        cliente_id: clienteId
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Error al crear el contrato (${res.status})`);
    }

    // advertencia: el backend avisa si se superpone con otro contrato activo del cliente
    return data.success ? { ...data.data, advertencia: data.advertencia as string | undefined } : null;
  } catch (err) {
    console.error("Error createContrato:", err);
    throw err;
  }
}

export async function updateContrato(id: number, contrato: any): Promise<{ success: boolean; advertencia?: string }> {
  try {
    const res = await apiFetch(`/api/contratos/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify(contrato),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Error al actualizar el contrato (${res.status})`);
    return { success: Boolean(data.success), advertencia: data.advertencia };
  } catch (err) {
    console.error("Error updateContrato:", err);
    throw err;
  }
}

export async function deactivateContrato(id: number): Promise<boolean> {
  try {
    const res = await apiFetch(`/api/contratos/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(true)
    });
    if (!res.ok) throw new Error(`Error deactivating contrato: ${res.status}`);
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error("Error deactivateContrato:", err);
    throw err;
  }
}

export async function getInstalacionesByCliente(clienteId: number): Promise<InstalacionActiva[]> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/${clienteId}/instalaciones`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error("Error getInstalacionesByCliente:", err);
    throw err;
  }
}

export async function createInstalacion(instalacion: any) {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/instalaciones`, {
      method: "POST",
      headers: getAuthHeaders(true),
      body: JSON.stringify(instalacion),
    });
    if (!res.ok) throw new Error(`Error creating instalacion: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error("Error createInstalacion:", err);
    throw err;
  }
}

export async function retirarInstalacion(id: number, fechaRetiro: string): Promise<boolean> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/instalaciones/${id}/retirar`, {
      method: "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify({ fecha_retiro: fechaRetiro }),
    });
    if (!res.ok) throw new Error(`Error retiring instalacion: ${res.status}`);
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error("Error retirarInstalacion:", err);
    throw err;
  }
}

export async function tieneHistorial(clienteId: number): Promise<boolean> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/${clienteId}/tiene-historial`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.tiene_historial : false;
  } catch (err) {
    console.error("Error tieneHistorial:", err);
    throw err;
  }
}

export async function getUltimoCambio(clienteId: number): Promise<any | null> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/${clienteId}/ultimo-cambio`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (err) {
    console.error("Error getUltimoCambio:", err);
    throw err;
  }
}

export async function getHistorialCliente(clienteId: number): Promise<any[]> {
  try {
    const res = await apiFetch(`${RESOURCE_URL}/${clienteId}/historial`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error("Error getHistorialCliente:", err);
    throw err;
  }
}

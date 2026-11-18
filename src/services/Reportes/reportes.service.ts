import type {  
  ResumenConsolidado, 
  MaquinaConsolidada,
  DetalleTransaccion,
  ResumenDetallado
} from '@models/Reporte/reporte.types';

const API_URL = import.meta.env.VITE_API_BASE_URL;
const REPORTES_URL = `${API_URL}/api/reportes`;

export async function fetchReporteConsolidado(
  clienteId: number,
  periodo: string,
  areaId?: number,
  maquinaId?: number
): Promise<{ detalles: MaquinaConsolidada[]; resumen: ResumenConsolidado }> {
  if (!clienteId || !periodo) {
    throw new Error("clienteId y periodo son requeridos");
  }

  try {
    const params = new URLSearchParams();
    if (areaId) params.append('area_id', areaId.toString());
    if (maquinaId) params.append('maquina_id', maquinaId.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const url = `${REPORTES_URL}/consolidado/${clienteId}/${periodo}${queryString}`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Error ${res.status}: ${errorBody || res.statusText}`);
    }

    const response = await res.json();

    if (response.success && response.data) {
      return {
        detalles: response.data.detalles || [],
        resumen: response.data.resumen || {
          total_bn: 0,
          total_color: 0,
          total_impresiones: 0,
          monto_total_general: 0,
          total_maquinas: 0,
          total_cambios: 0,
          periodo: periodo,
          cliente_id: clienteId
        }
      };
    }

    throw new Error("Formato de respuesta inválido del servidor");
  } catch (err) {
    console.error("❌ Error fetchReporteConsolidado:", err);
    throw err;
  }
}

export async function fetchReporteDetallado(
  clienteId: number,
  periodo: string,
  areaId?: number,
  maquinaId?: number
): Promise<{ detalles: DetalleTransaccion[]; resumen: ResumenDetallado }> {
  
  if (!clienteId || !periodo) {
    throw new Error("clienteId y periodo son requeridos");
  }

  try {
    const params = new URLSearchParams();
    if (areaId) params.append('area_id', areaId.toString());
    if (maquinaId) params.append('maquina_id', maquinaId.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const url = `${REPORTES_URL}/detallado/${clienteId}/${periodo}${queryString}`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Error ${res.status}: ${errorBody || res.statusText}`);
    }

    const response = await res.json();

    if (response.success && response.data) {
      return {
        detalles: response.data.detalles || [],
        resumen: response.data.resumen || {
          total_registros: 0,
          suma_impresiones: 0,
          suma_monto: 0,
          periodo: periodo,
          cliente_id: clienteId
        }
      };
    }

    throw new Error("Formato de respuesta inválido del servidor");
  } catch (err) {
    console.error("❌ Error fetchReporteDetallado:", err);
    throw err;
  }
}
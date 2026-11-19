import type {
  ResumenConsolidado,
  MaquinaConsolidada,
  DetalleTransaccion,
  ResumenDetallado
} from '@models/Reporte/reporte.types';
import { apiFetch } from '@services/api';

const REPORTES_URL = '/api/reportes';

const armarQuery = (areaId?: number, maquinaId?: number) => {
  const params = new URLSearchParams();
  if (areaId) params.append('area_id', areaId.toString());
  if (maquinaId) params.append('maquina_id', maquinaId.toString());
  return params.toString() ? `?${params.toString()}` : '';
};

// Toda /api exige token: apiFetch lo agrega y maneja el 401.
// Si la API responde con error, se lanza su mensaje (en español).
async function leerData<T>(res: Response): Promise<T> {
  let body: { success?: boolean; data?: T; message?: string } | null = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok || !body?.success || !body.data) {
    throw new Error(body?.message || `No se pudo obtener el informe (error ${res.status})`);
  }
  return body.data;
}

export async function fetchReporteConsolidado(
  clienteId: number,
  periodo: string,
  areaId?: number,
  maquinaId?: number
): Promise<{ detalles: MaquinaConsolidada[]; resumen: ResumenConsolidado }> {
  if (!clienteId || !periodo) {
    throw new Error("clienteId y periodo son requeridos");
  }

  const res = await apiFetch(`${REPORTES_URL}/consolidado/${clienteId}/${periodo}${armarQuery(areaId, maquinaId)}`, {
    cache: "no-store"
  });
  const data = await leerData<{ detalles?: MaquinaConsolidada[]; resumen?: ResumenConsolidado }>(res);

  return {
    detalles: data.detalles || [],
    resumen: data.resumen || {
      total_bn: 0,
      total_color: 0,
      total_impresiones: 0,
      monto_total_general: 0,
      total_maquinas: 0,
      total_cambios: 0,
      periodo: periodo,
      cliente_id: clienteId,
      renta_equipos: [],
      total_renta: 0,
      total_general: 0,
      facturacion: []
    }
  };
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

  const res = await apiFetch(`${REPORTES_URL}/detallado/${clienteId}/${periodo}${armarQuery(areaId, maquinaId)}`, {
    cache: "no-store"
  });
  const data = await leerData<{ detalles?: DetalleTransaccion[]; resumen?: ResumenDetallado }>(res);

  return {
    detalles: data.detalles || [],
    resumen: data.resumen || {
      total_registros: 0,
      suma_impresiones: 0,
      suma_monto: 0,
      suma_monto_copias: 0,
      suma_monto_impresiones: 0,
      periodo: periodo,
      cliente_id: clienteId
    }
  };
}

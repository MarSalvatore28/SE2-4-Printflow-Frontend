// Tipos de notificaciones y lotes. Los usan la campana (caja 7) y el listado de lotes (caja 8).

// ------------------------------ Notificaciones ------------------------------

// Una notificación como la devuelve GET /api/notificaciones
export interface Notificacion {
  id_notificacion: number;
  titulo: string;
  mensaje: string | null;
  datos_adicionales: Record<string, unknown> | null;
  lote_id: number | null;
  leida: boolean;
  fecha_creacion: string;
  fecha_lectura: string | null;
  tipo_notificacion_id: number;
  tipo_codigo?: string;
  tipo_nombre?: string;
  // El catálogo de tipos no trae icono; se deja por si se agrega
  tipo_icono?: string;
  // Datos del lote asociado (si tiene)
  codigo_lote?: string | null;
  periodo?: string | null;
  total_registros?: number | null;
  fecha_aprobacion?: string | null;
  usuario_nombre?: string | null; // quién aprobó el lote
}

// Lo que llega por el socket en 'nueva_notificacion': la fila insertada tal cual
export interface NotificacionSocket {
  id_notificacion: number;
  titulo: string;
  mensaje: string | null;
  lote_id: number | null;
  leida: boolean;
  fecha_creacion: string;
  tipo_notificacion_id: number;
}

export interface CreateNotificacionData {
  titulo: string;
  mensaje?: string;
  lote_id?: number;
  tipo_codigo?: string;
  datos_adicionales?: Record<string, unknown>;
}

export interface EstadisticasNotificaciones {
  total: number;
  no_leidas: number;
  leidas: number;
  ultima: string | null;
  por_tipo: { codigo: string; nombre: string; total: number; no_leidas: number }[];
}

// ----------------------------------- Lotes -----------------------------------

// Estados del plan (PLAN.md, sección 7)
export type EstadoLote = 'PENDIENTE' | 'PROCESADO' | 'DESCARTADO' | 'ERROR';

export const ETIQUETA_ESTADO_LOTE: Record<EstadoLote, string> = {
  PENDIENTE: 'Pendiente',
  PROCESADO: 'Procesado',
  DESCARTADO: 'Descartado',
  ERROR: 'Error',
};

export interface ClienteLote {
  id_cliente: number;
  nombre: string;
}

// Un lote como lo devuelve GET /api/notificaciones/lotes
export interface Lote {
  id_lote: number;
  codigo_referencia: string;
  periodo: string | null;
  estado: EstadoLote;
  motivo: string | null;
  fecha_carga: string; // fecha de recepción
  fecha_procesamiento: string | null; // aprobación o rechazo
  fecha_aprobacion: string | null;
  fecha_corte: string | null;
  total_registros_cargados: number;
  reportes_staging: number;
  reportes_con_error: number;
  reportes_oficiales: number;
  notificaciones_no_leidas: number;
  usuario_aprobacion_id: number | null;
  usuario_aprobacion_nombre: string | null;
  clientes: ClienteLote[];
}

export interface FiltrosLotes {
  estado?: EstadoLote | '';
  cliente_id?: number | null;
  desde?: string; // AAAA-MM-DD, fecha de recepción
  hasta?: string;
}

// Un reporte del lote en staging (GET /api/staging/lote/:lote/completo)
export interface ReporteStaging {
  id_staging_consolidado: number;
  lote_id: number;
  ip_detectada: string | null;
  serie_maquina: string | null;
  maquina_serie_oficial: string | null;
  maquina_modelo_nombre: string | null;
  cliente_id_tentativo: number | null;
  cliente_nombre: string | null;
  consolidado_print_total: number;
  consolidado_copy_total: number;
  consolidado_impresion_bn: number;
  consolidado_impresion_color: number;
  consolidado_copia_bn: number;
  consolidado_copia_color: number;
  totalservicio: number;
  consolidado_fecha_lectura: string | null;
  consolidado_fecha_corte: string | null;
  estado_maquina: string | null;
  procesar_lectura: boolean;
  mensaje_aviso: string | null;
  intentos_reproceso?: number; // S3-05: veces que se reprocesó (máximo 3)
  lote_codigo: string;
  lote_periodo: string | null;
  lote_fecha_corte: string | null;
  detalles: unknown[];
}

// Máquina del lote con la lectura bloqueada (GET /api/staging/lotes/:loteId/alertas)
export interface AlertaLote {
  serie_maquina: string | null;
  ip_detectada: string | null;
  estado_maquina: string | null;
  mensaje_aviso: string | null;
}

// GET /api/staging/lote/:lote/validar
export interface ValidacionLote {
  esValido: boolean;
  errores: string[];
}

export interface AprobarRechazarLoteData {
  periodo?: string; // AAAA-MM
  fecha_corte?: string;
  motivo?: string;
}

export interface LoteActionResponse {
  success: boolean;
  message: string;
  data?: Lote;
}

// Error de aprobación: la API responde 409 con la lista de inconsistencias
export class ErrorAprobacion extends Error {
  readonly isValidationError = true;
  readonly errores: string[];

  constructor(message: string, errores: string[] = []) {
    super(message);
    this.name = 'ErrorAprobacion';
    this.errores = errores;
  }
}

// Datos para crear un lote a mano: los lotes los crea la ingesta, no hay endpoint para esto
export interface CreateLoteData {
  codigo_referencia: string;
  periodo?: string;
}

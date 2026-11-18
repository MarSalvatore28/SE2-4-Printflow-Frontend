export interface Instalacion {
  id_instalacion: number;
  maquina_id: number;
  area_id: number;
  contrato_id: number;
  ip_address: string;
  fecha_instalacion: string;
  fecha_retiro?: string | null;
  activo: boolean;
  observaciones?: string | null;
  contador_acumulativo?: boolean;
  contabilidad_por_usuario?: boolean;
}

export interface InstalacionCompleta {
  id_maquina: number;
  serie: string;
  maquina_activa: boolean;
  contador_acumulativo: boolean;
  contabilidad_por_usuario?: boolean;
  id_modelo?: number;
  modelo_nombre?: string;
  id_formato?: number;
  formato_impresion?: string;
  id_tipo_impresion?: number;
  tipo_impresion?: string;

  id_instalacion?: number | null;
  ip_address?: string | null;
  fecha_instalacion?: string | null;
  fecha_retiro?: string | null;
  instalacion_observaciones?: string | null;

  id_area?: number | null;
  area_nombre?: string | null;
  area_descripcion?: string | null;

  id_cliente?: number | null;
  cliente_nombre?: string | null;
  cliente_ruc?: string | null;
  cliente_razon_social?: string | null;

  id_contrato?: number | null;
  contrato_fecha_inicio?: string | null;
  contrato_fecha_fin?: string | null;
  costo_copia_bn?: string | null;
  costo_copia_color?: string | null;
  costo_impresion_bn?: string | null;
  costo_impresion_color?: string | null;
}

export interface InstalacionActivaCliente {
  id_maquina: number;
  serie: string;
  maquina_activa: boolean;
  contador_acumulativo: boolean;
  contabilidad_por_usuario?: boolean;
  modelo_nombre?: string;
  formato_impresion?: string;
  tipo_impresion?: string;

  id_instalacion: number;
  ip_address: string;
  fecha_instalacion: string;
  observaciones?: string | null;
  costo_renta_mensual?: string | number;

  id_area: number;
  area_nombre: string;
  area_descripcion?: string;

  id_cliente: number;
  cliente_nombre: string;
  cliente_ruc?: string;
  cliente_razon_social?: string;

  id_contrato: number;
  costo_copia_bn?: string;
  costo_copia_color?: string;
  costo_impresion_bn?: string;
  costo_impresion_color?: string;
  renta_equipo?: boolean;
}

export interface MaquinaSinInstalacion {
  id_maquina: number;
  serie: string;
  activo: boolean;
  modelo_nombre?: string;
  formato_impresion?: string;
  tipo_impresion?: string;
}

export interface HistorialInstalacion {
  id_instalacion: number;
  ip_address: string;
  fecha_instalacion: string;
  fecha_retiro?: string | null;
  activo: boolean;
  observaciones?: string | null;

  id_area: number;
  area_nombre: string;

  id_cliente: number;
  cliente_nombre: string;
  cliente_ruc: string;

  id_contrato: number;

  dias_instalado: number;
}

export interface ResumenInstalacionesCliente {
  id_area: number;
  area_nombre: string;
  total_instalaciones_activas: number;
  maquinas_detalle?: string | null;
}

export interface InstalacionDetallada {
  id_instalacion: number;
  maquina_id: number;
  area_id: number;
  contrato_id: number;
  ip_address: string;
  fecha_instalacion: string;
  fecha_retiro?: string | null;
  activo: boolean;
  observaciones?: string | null;
  contador_acumulativo?: boolean;
  contabilidad_por_usuario?: boolean;

  maquina_serie: string;
  modelo_nombre?: string;

  area_nombre: string;

  id_cliente: number;
  cliente_nombre: string;
  cliente_ruc: string;
}

export interface InstalacionFormData {
  maquina_id: number;
  area_id: number;
  contrato_id: number;
  ip_address: string;
  observaciones?: string;
  fecha_instalacion?: string;
  costo_renta_mensual?: number;
  contador_acumulativo?: boolean;
  contabilidad_por_usuario?: boolean;
}

export interface CrearInstalacionResponse {
  success: boolean;
  id_instalacion: number;
  maquina_serie: string;
  area_nombre: string;
  cliente_nombre: string;
  ip_address: string;
}

export interface RetirarInstalacionResponse {
  success: boolean;
  maquina_serie: string;
  area_nombre: string;
  cliente_nombre: string;
}

export interface RetirarInstalacionFormData {
  observaciones_retiro?: string;
  fecha_retiro?: string; // YYYY-MM-DD; no puede ser anterior a la fecha de instalación
}

export interface UpdateInstalacionFormData {
  ip_address?: string;
  observaciones?: string;
  fecha_instalacion?: string;
}

export interface ActualizarIPFormData {
  ip_address: string;
}

export interface ActualizarIPResponse {
  success: boolean;
  id_instalacion: number;
  nueva_ip?: string;
  mensaje?: string;
}

export interface Area {
  id_area: number;
  area_nombre: string;
  descripcion?: string;
  cliente_id?: number;
  cliente_nombre?: string;
  cliente_ruc?: string;
}

export interface Contrato {
  id_contrato: number;
  cliente_id: number;
  fecha_inicio: string;
  fecha_fin?: string | null;
  copias_bn_incluidas: number;
  copias_color_incluidas: number;
  impresiones_bn_incluidas?: number;
  impresiones_color_incluidas?: number;
  costo_copia_bn: string;
  costo_copia_color: string;
  costo_impresion_bn: string;
  costo_impresion_color: string;
  renta_equipo?: boolean;
  tiene_renta?: boolean;
  software_control?: boolean;
  tiene_software_control?: boolean;
  facturacion_de_impresora?: string;
  printer_bill?: string;
  activo?: boolean;
  fecha_creacion?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  total?: number;
  message?: string;
  error?: string;
}
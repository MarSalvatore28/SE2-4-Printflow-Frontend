export interface Cliente {
  id_cliente: number;
  nombre: string;
  ruc: string;
  razon_social: string | null;
  activo: boolean;
}

export interface Contrato {
  id_contrato: number;
  cliente_id: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  copias_bn_incluidas: number;
  copias_color_incluidas: number;
  impresiones_bn_incluidas: number;
  impresiones_color_incluidas: number;
  costo_copia_bn: number;
  costo_copia_color: number;
  costo_impresion_bn: number;
  costo_impresion_color: number;
  costo_excedente_copia_bn: number;
  costo_excedente_copia_color: number;
  costo_excedente_impresion_bn: number;
  costo_excedente_impresion_color: number;
  activo: boolean;
  observaciones?: string | null;
  fecha_creacion?: string;
  renta_equipo?: boolean;
  tiene_renta?: boolean;
  software_control?: boolean;
  tiene_software_control?: boolean;
  facturacion_de_impresora?: string;
  printer_bill?: string;
}

export interface InstalacionActiva {
  id_instalacion: number;
  maquina_serie: string;
  maquina_modelo: string;
  area_nombre: string;
  ip_address: string | null;
  ubicacion_fisica: string | null;
  fecha_instalacion: string;
}

export interface Area {
  id_area: number;
  nombre: string;
  activo: boolean;
}

export interface ClienteCompleto extends Cliente {
  contratos?: Contrato[];
  areas?: Area[];
  instalaciones_activas?: InstalacionActiva[];
  total_instalaciones?: number;
}

export interface ClienteParaTabla extends Cliente {
  contrato_bn_incluidas?: number;
  contrato_color_incluidas?: number;
  impresiones_bn_incluidas?: number;
  impresiones_color_incluidas?: number;
  costo_copia_bn?: number;
  costo_copia_color?: number;
  costo_impresion_bn?: number | string;
  costo_impresion_color?: number | string;
  costo_x_excedente_impresion_bn?: number | string;
  costo_x_excedente_impresion_color?: number | string;
  id_contrato?: number;
  total_instalaciones?: number;
  tiene_renta: boolean;
  tiene_software_control: boolean;
  printer_bill?: string;
}

export interface ClienteFormData {
  nombre: string;
  ruc: string;
  razon_social: string;
  id_contrato?: number;
  cliente_id?: number;

  fecha_inicio?: string;
  fecha_fin?: string | null;
  copias_bn_incluidas?: number;
  copias_color_incluidas?: number;
  impresiones_bn_incluidas?: number;
  impresiones_color_incluidas?: number;
  costo_copia_bn?: number;
  costo_copia_color?: number;
  costo_impresion_bn?: number;
  costo_impresion_color?: number;

  costo_excedente_copia_bn?: number;
  costo_excedente_copia_color?: number;
  costo_excedente_impresion_bn?: number;
  costo_excedente_impresion_color?: number;

  tiene_renta?: boolean;
  tiene_software_control?: boolean;
  printer_bill?: string;
  activo?: boolean;
}

export type Client = ClienteParaTabla;

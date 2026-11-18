export interface Contrato {
  id_contrato: number;
  cliente_id: number;
  numero_contrato?: string;
  fecha_inicio: string; 
  fecha_fin?: string | null;
  copias_bn_incluidas: number;
  copias_color_incluidas: number;
  impresiones_bn_incluidas: number;
  impresiones_color_incluidas: number;
  costo_copia_bn: number;
  costo_copia_color: number;
  costo_impresion_bn: number;
  costo_impresion_color: number;
  activo: boolean;
  observaciones?: string | null;
  fecha_creacion: string;
}
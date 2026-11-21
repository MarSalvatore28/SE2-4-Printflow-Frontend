export interface ContadoresMaquina {
  global: number;
  copia_bn: number;
  copia_color: number;
  impresion_bn: number;
  impresion_color: number;
}

export interface ContadoresCambio {
  anterior: ContadoresMaquina;
  actual: ContadoresMaquina;
  consumo: ContadoresMaquina & {
    total_bn: number;
    total_color: number;
  };
}

export interface MaquinaSaliente {
  id: number;
  serie: string;
  modelo?: string;
  fecha_instalacion: string;
  fecha_inicio_operacion?: string;
  fecha_retiro: string;
  contadores: ContadoresCambio;
}

export interface MaquinaEntrante {
  fecha_fin_operacion: string | undefined;
  id: number;
  serie: string;
  modelo: string;
  fecha_instalacion: string;
  contadores: ContadoresCambio;
}

export interface CambioMaquina {
  id: number;
  fecha: string;
  periodo: string;
  tipo: string;
  razon: string;
  area: string;
  maquina_saliente: MaquinaSaliente;
  maquina_entrante: MaquinaEntrante;
  totales: {
    consumo_total: number;
    dias_saliente: number;
    dias_entrante: number;
  };
}

export interface InfoMaquina {
  id_reporte: number;
  maquina_id: number;
  fecha_corte?: string;
  fecha_corte_actual?: string;
  fecha_corte_anterior?: string;
  modelo?: string;
  serie: string;
  ip: string;
  area: string;
  es_acumulativo: boolean;
  es_reemplazo: boolean;
  tipo_impresion: string;
  es_color: boolean;
  tiene_cambio: boolean;
  es_parte_cambio: boolean;
}

export interface ContadoresAnteriores {
  imp_bn: number;
  imp_color: number;
  cop_bn: number;
  cop_color: number;
  total_contador_bn: number;
  total_contador_color: number;
  total_servicio: number;
}

export interface ContadoresActuales {
  imp_bn: number;
  imp_color: number;
  cop_bn: number;
  cop_color: number;
  total_contador_bn: number;
  total_contador_color: number;
  print_total: number;
  copy_total: number;
  total_servicio: number;
}

export interface ConsumoMaquina {
  total_bn: number;
  total_color: number;
  gran_total: number;
}

export interface Financiero {
  monto_total: string;
  /** Consumo × tarifa por página: solo informativo. El importe oficial es el del contrato (`resumen.facturacion`). */
  monto_referencial?: string;
}

export interface MaquinaConsolidada {
  info: InfoMaquina;
  cambio?: CambioMaquina;
  anterior: ContadoresAnteriores;
  actual: ContadoresActuales;
  consumo: ConsumoMaquina;
  financiero: Financiero;
  contador?: ContadoresCambio;
}

export interface RentaEquipo {
  id_instalacion: number;
  serie: string;
  modelo: string;
  area: string;
  costo_mensual: number;
}

/** Páginas y montos de un tipo de página (B/N o color) en un contrato. Los montos vienen como texto con 2 decimales. */
export interface FacturacionTramo {
  consumo: number;
  incluidas: number;
  excedente: number;
  cuota_fija: string;
  monto_excedente: string;
}

/** Modo de facturación del contrato: B/N y color por separado, o todas las páginas cuentan como color. */
export type ModoFacturacion = 'DIFERENCIAR' | 'TODO_COLOR';

/** Importe de un contrato en el período, tal como lo calcula el backend (S3-06). */
export interface FacturacionContrato {
  contrato_id: number;
  modo: ModoFacturacion;
  bn: FacturacionTramo;
  color: FacturacionTramo;
  renta: string;
  total: string;
  /** true cuando el consolidado se pidió filtrado por área o máquina: se factura el contrato completo. */
  filtrado?: boolean;
}

export interface ResumenConsolidado {
  total_bn: number;
  total_color: number;
  total_impresiones: number;
  /** Suma de los totales de `facturacion`: número hoy, texto con 2 decimales cuando el backend calcule el importe. */
  monto_total_general: number | string;
  /** Un elemento por contrato. Vacío o ausente mientras el importe no se haya calculado. */
  facturacion?: FacturacionContrato[];
  total_maquinas: number;
  total_cambios: number;
  periodo: string;
  cliente_id: number;
  renta_equipos: RentaEquipo[];
  total_renta: number;
  total_general: number;
}

export interface CostosTransaccion {
  monto: number;

  copia_bn: number;
  copia_color: number;
  impresion_bn: number;
  impresion_color: number;

  total_copias: number;
  total_impresiones: number;

  costo_unit_cop_bn?: number;
  costo_unit_cop_col?: number;
  costo_unit_imp_bn?: number;
  costo_unit_imp_col?: number;
}

export interface DetalleTransaccion {
  id: number;
  transaccion: {
    fecha: string;
  };
  usuario: {
    id: string;
    nombre: string;
  };
  maquina: {
    serie: string;
    modelo?: string;
    ip: string;
    area: string;
  };
  contadores: {
    copia_bn: number;
    copia_color: number;
    print_bn: number;
    print_color: number;
  };
  totales: {
    bn: number;
    color: number;
    general: number;
  };
  costos: CostosTransaccion;
}

export interface ResumenDetallado {
  total_registros: number;
  suma_impresiones: number;
  suma_monto: number;
  suma_monto_copias: number;
  suma_monto_impresiones: number;
  periodo: string;
  cliente_id: number;
}
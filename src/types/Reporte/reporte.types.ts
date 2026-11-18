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

export interface ResumenConsolidado {
  total_bn: number;
  total_color: number;
  total_impresiones: number;
  monto_total_general: number;
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
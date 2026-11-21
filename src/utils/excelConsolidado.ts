// Contenido del Excel del consolidado (S4-02): hojas y filas, sin estilos ni archivo.
// `exportToExcel` (exportUtils.ts) las convierte en el .xlsx. Aquí todo es puro para poder probarlo.
import type { ClienteParaTabla } from '@models/Cliente/cliente.types';
import type {
  DetalleTransaccion,
  FacturacionContrato,
  FacturacionTramo,
  MaquinaConsolidada,
  ResumenConsolidado,
} from '@models/Reporte/reporte.types';
import { aMonto, hayFacturacion, importeReferencial, MENSAJE_IMPORTE_PENDIENTE, nombreContrato, NOTA_FACTURACION_FILTRADA, NOTA_IMPORTE_REFERENCIAL } from '@utils/facturacionUtils';
import { formatFechaISO } from '@utils/formatUtils';

/** Formato de Excel de contadores y páginas. */
export const FORMATO_ENTERO = '#,##0';
/** Formato de Excel de los importes: 2 decimales. */
export const FORMATO_DINERO = '$ #,##0.00';

export const IMPORTE_PENDIENTE = 'Importe pendiente de cálculo';

/** Importe: número redondeado a 2 decimales que se escribe con FORMATO_DINERO. */
export interface CeldaDinero {
  dinero: number;
}

/** Texto, entero (FORMATO_ENTERO), importe o vacía. */
export type Celda = string | number | CeldaDinero | null;

export type EstiloFila = 'titulo' | 'etiqueta' | 'seccion' | 'subseccion' | 'cabecera' | 'dato' | 'total' | 'nota' | 'vacia';

export interface FilaExcel {
  estilo: EstiloFila;
  celdas: Celda[];
}

export interface HojaExcel {
  nombre: string;
  /** Columnas de la tabla más ancha: los títulos y secciones ocupan todo ese ancho. */
  columnas: number;
  anchos: number[];
  filas: FilaExcel[];
}

export interface DatosExcel {
  /** `resumen` del consolidado: totales y `facturacion` del backend. */
  resumen: ResumenConsolidado | null;
  /** Detalle por usuario: va en otra hoja. */
  transacciones?: DetalleTransaccion[];
  /** Fechas de corte del período, ya formateadas (AAAA/MM/DD), como en la pantalla. */
  fechaInicio?: string;
  fechaFin?: string;
  /** Cuándo se generó el consolidado (el «Generado el» de la pantalla). */
  generadoEn?: Date | null;
}

export const dinero = (valor: string | number | null | undefined): CeldaDinero => ({
  dinero: Math.round(aMonto(valor) * 100) / 100,
});

/** Valor que queda en la celda (número o texto), para comparar y para las pruebas. */
export const valorCelda = (c: Celda): string | number | null => (c !== null && typeof c === 'object' ? c.dinero : c);

const fila = (estilo: EstiloFila, ...celdas: Celda[]): FilaExcel => ({ estilo, celdas });
const vacia = (): FilaExcel => fila('vacia');

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** "2026-10" → "Octubre de 2026". */
export const periodoEnLetras = (periodo: string): string => {
  const [anio, mes] = periodo.split('-');
  const nombre = MESES[Number(mes) - 1];
  return nombre && anio ? `${nombre} de ${anio}` : periodo;
};

// Mismo formato que «Generado el» de la tarjeta de totales
const formatoGeneracion = new Intl.DateTimeFormat('es-EC', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

export const fechaGeneracion = (fecha: Date): string => formatoGeneracion.format(fecha);

/** Cabecera de cada hoja: cliente, RUC, período y fecha de generación. */
export const filasCabecera = (titulo: string, cliente: ClienteParaTabla | undefined, periodo: string, datos: DatosExcel): FilaExcel[] => [
  fila('titulo', titulo),
  fila('etiqueta', 'Cliente', cliente?.nombre || ''),
  fila('etiqueta', 'Razón social', cliente?.razon_social || cliente?.nombre || ''),
  fila('etiqueta', 'RUC', cliente?.ruc || ''),
  fila('etiqueta', 'Período', periodoEnLetras(periodo)),
  fila('etiqueta', 'Inicio del período', datos.fechaInicio || 'N/A'),
  fila('etiqueta', 'Fin del período', datos.fechaFin || 'N/A'),
  fila('etiqueta', 'Generado el', fechaGeneracion(datos.generadoEn ?? new Date())),
  vacia(),
];

/** Contadores de la fila, igual que la tabla de la pantalla: en un reemplazo, el inicial es el de la entrante. */
export const contadoresFila = (m: MaquinaConsolidada): { inicial: number; final: number } => {
  if (m.cambio) {
    return {
      inicial: m.cambio.maquina_entrante.contadores.anterior.global || 0,
      final: (m.actual.total_contador_bn || 0) + (m.actual.total_contador_color || 0),
    };
  }
  return {
    inicial: ((m.anterior.total_contador_bn || 0) + (m.anterior.total_contador_color || 0)) || m.anterior.total_servicio || 0,
    final: ((m.actual.total_contador_bn || 0) + (m.actual.total_contador_color || 0)) || m.actual.total_servicio || 0,
  };
};

export const CABECERA_MAQUINAS = [
  'Impresora', 'IP', 'Área', 'Serie', 'Contador inicial', 'Contador final',
  'Páginas B/N', 'Páginas color', 'Consumo del mes', 'Importe referencial*', 'Estado',
];

/** Listado de impresoras: una fila por puesto (un reemplazo suma la saliente y la entrante) y la de totales. */
export const filasMaquinas = (data: MaquinaConsolidada[]): FilaExcel[] => {
  const totales = { inicial: 0, final: 0, bn: 0, color: 0, consumo: 0, importe: 0 };
  const filas = data.map((m) => {
    const { inicial, final } = contadoresFila(m);
    const bn = m.consumo.total_bn || 0;
    const color = m.consumo.total_color || 0;
    const importe = importeReferencial(m);
    totales.inicial += inicial;
    totales.final += final;
    totales.bn += bn;
    totales.color += color;
    totales.consumo += bn + color;
    totales.importe += importe;
    return fila(
      'dato',
      m.info.modelo || m.info.serie || 'N/A', m.info.ip || '', m.info.area || '', m.info.serie || '',
      inicial, final, bn, color, bn + color, dinero(importe), m.cambio ? 'Cambio' : 'Sin cambios',
    );
  });
  return [
    fila('seccion', 'Listado de impresoras'),
    fila('cabecera', ...CABECERA_MAQUINAS),
    ...filas,
    fila('total', 'Totales generales', null, null, null, totales.inicial, totales.final, totales.bn, totales.color, totales.consumo, dinero(totales.importe), null),
    fila('nota', `* ${NOTA_IMPORTE_REFERENCIAL}`),
  ];
};

export const CABECERA_FACTURACION = ['Páginas', 'Consumo', 'Incluidas', 'Excedente', 'Cuota fija', 'Monto del excedente'];

const filaTramo = (tipo: string, t: FacturacionTramo): FilaExcel =>
  fila('dato', tipo, t.consumo, t.incluidas, t.excedente, dinero(t.cuota_fija), dinero(t.monto_excedente));

const modoEnLetras = (c: FacturacionContrato) =>
  c.modo === 'TODO_COLOR' ? 'Todo como color: las páginas B/N cuentan como color' : 'B/N y color por separado';

/** Facturación del período tal como la calcula el backend (`resumen.facturacion`), o la fila de importe pendiente. */
export const filasFacturacion = (resumen: ResumenConsolidado | null): FilaExcel[] => {
  const contratos = resumen?.facturacion ?? [];
  const filas: FilaExcel[] = [fila('seccion', 'Facturación del período')];
  if (contratos.length === 0) {
    filas.push(fila('dato', IMPORTE_PENDIENTE, `${MENSAJE_IMPORTE_PENDIENTE}.`));
    return filas;
  }
  contratos.forEach((c, i) => {
    if (i > 0) filas.push(vacia());
    filas.push(
      fila('subseccion', `${nombreContrato(c)} · ${modoEnLetras(c)}`),
      fila('cabecera', ...CABECERA_FACTURACION),
      filaTramo('B/N', c.bn),
      filaTramo('Color', c.color),
      fila('dato', 'Renta de equipos', null, null, null, null, dinero(c.renta)),
      fila('total', 'Total del contrato', null, null, null, null, dinero(c.total)),
    );
  });
  if (contratos.length > 1) filas.push(fila('total', 'Total del período', null, null, null, null, dinero(resumen?.monto_total_general)));
  if (contratos.some((c) => c.filtrado)) {
    filas.push(fila('nota', `${NOTA_FACTURACION_FILTRADA}.`));
  }
  return filas;
};

/** Totales del período, como la tarjeta de la pantalla. */
export const filasTotales = (resumen: ResumenConsolidado | null, data: MaquinaConsolidada[]): FilaExcel[] => {
  const bn = data.reduce((acc, m) => acc + (m.consumo.total_bn || 0), 0);
  const color = data.reduce((acc, m) => acc + (m.consumo.total_color || 0), 0);
  return [
    fila('seccion', 'Totales del período'),
    fila('dato', 'Páginas B/N', resumen?.total_bn ?? bn),
    fila('dato', 'Páginas color', resumen?.total_color ?? color),
    fila('dato', 'Total de páginas', resumen?.total_impresiones ?? bn + color),
    fila('dato', 'Máquinas', resumen ? resumen.total_maquinas || 0 : data.length),
    fila('total', 'Importe del período', hayFacturacion(resumen) ? dinero(resumen?.monto_total_general) : 'Pendiente'),
  ];
};

export const CABECERA_REEMPLAZOS = [
  'Tramo', 'Serie', 'Modelo', 'Fecha', 'Contador inicial', 'Contador final', 'Páginas B/N', 'Páginas color', 'Consumo parcial',
];

/** Reemplazos del período: los dos tramos de cada uno y el total consolidado (lo del botón «Cambio»). */
export const filasReemplazos = (data: MaquinaConsolidada[]): FilaExcel[] => {
  const cambios = data.filter((m) => m.cambio).map((m) => m.cambio!);
  if (cambios.length === 0) return [];
  const filas: FilaExcel[] = [fila('seccion', 'Reemplazos de máquina')];
  cambios.forEach((c, i) => {
    if (i > 0) filas.push(vacia());
    const { maquina_saliente: sale, maquina_entrante: entra } = c;
    const razon = c.razon ? ` · ${c.razon}` : '';
    filas.push(
      fila('subseccion', `Área: ${c.area} · ${c.tipo}${razon}`),
      fila('cabecera', ...CABECERA_REEMPLAZOS),
      fila('dato', 'Saliente', sale.serie, sale.modelo || '', `Retiro: ${formatFechaISO(sale.fecha_retiro)}`,
        sale.contadores.anterior.global, sale.contadores.actual.global,
        sale.contadores.consumo.total_bn, sale.contadores.consumo.total_color, sale.contadores.consumo.global),
      fila('dato', 'Entrante', entra.serie, entra.modelo || '', `Instalación: ${formatFechaISO(entra.fecha_instalacion)}`,
        entra.contadores.anterior.global, entra.contadores.actual.global,
        entra.contadores.consumo.total_bn, entra.contadores.consumo.total_color, entra.contadores.consumo.global),
      fila('total', 'Total consolidado', null, null, null, null, null, null, null, c.totales.consumo_total),
    );
  });
  return filas;
};

export const ANCHOS_CONSOLIDADO = [34, 18, 22, 16, 14, 14, 13, 13, 14, 16, 12];

/** Hoja del consolidado: cabecera, impresoras, facturación, totales y reemplazos. */
export const hojaConsolidado = (
  data: MaquinaConsolidada[],
  cliente: ClienteParaTabla | undefined,
  periodo: string,
  datos: DatosExcel,
): HojaExcel => {
  const reemplazos = filasReemplazos(data);
  return {
    nombre: 'Consolidado',
    columnas: CABECERA_MAQUINAS.length,
    anchos: ANCHOS_CONSOLIDADO,
    filas: [
      ...filasCabecera('Consolidado de impresión', cliente, periodo, datos),
      ...filasMaquinas(data),
      vacia(),
      ...filasFacturacion(datos.resumen),
      vacia(),
      ...filasTotales(datos.resumen, data),
      ...(reemplazos.length > 0 ? [vacia(), ...reemplazos] : []),
    ],
  };
};

export const CABECERA_USUARIOS = ['Cuenta ID', 'Nombre', 'Total', 'Imprimir', 'Copia', 'Copia B/N', 'Copia color', 'Imprimir B/N', 'Imprimir color'];

const esOtro = (t: DetalleTransaccion) => t.usuario.nombre?.trim().toUpperCase() === 'OTRO';

/** Orden inicial de la tabla de la pantalla: por cuenta, con «OTRO» al final. */
export const ordenarComoPantalla = (transacciones: DetalleTransaccion[]): DetalleTransaccion[] =>
  [...transacciones].sort((a, b) => {
    if (esOtro(a) !== esOtro(b)) return esOtro(a) ? 1 : -1;
    if (esOtro(a)) return 0;
    return String(a.usuario.id).localeCompare(String(b.usuario.id), undefined, { numeric: true });
  });

/** Fecha «Tomado el» de una máquina, como en la pantalla: el corte del consolidado o la de la transacción. */
const fechaToma = (ip: string, trans: DetalleTransaccion[], consolidado: MaquinaConsolidada[]): string => {
  const m = consolidado.find((c) => c.info.ip === ip);
  const fecha = m?.info.fecha_corte_actual ?? m?.info.fecha_corte ?? trans[0]?.transaccion.fecha;
  return fecha ? String(fecha).substring(0, 16).replace('T', ' ').replaceAll('-', '/') : 'N/A';
};

/**
 * Detalle por dispositivo y usuario: una tabla por máquina, una fila por registro (como la pantalla)
 * y el subtotal. El backend ya manda el consumo del período de cada cuenta.
 */
export const filasUsuarios = (transacciones: DetalleTransaccion[], consolidado: MaquinaConsolidada[]): FilaExcel[] => {
  const porMaquina = new Map<string, DetalleTransaccion[]>();
  transacciones.forEach((t) => {
    const lista = porMaquina.get(t.maquina.ip) ?? [];
    lista.push(t);
    porMaquina.set(t.maquina.ip, lista);
  });

  const filas: FilaExcel[] = [];
  porMaquina.forEach((trans, ip) => {
    if (filas.length > 0) filas.push(vacia());
    const maquina = trans[0].maquina;
    filas.push(
      fila('subseccion', `${maquina.area || 'Sin área'} · ${maquina.modelo || 'Sin modelo'} · Serie: ${maquina.serie || 'N/A'} · IP: ${ip} · Tomado el: ${fechaToma(ip, trans, consolidado)}`),
      fila('cabecera', ...CABECERA_USUARIOS),
    );
    const sub = { total: 0, imprimir: 0, copia: 0, copiaBn: 0, copiaColor: 0, printBn: 0, printColor: 0 };
    ordenarComoPantalla(trans).forEach((t) => {
      const { copia_bn: copiaBn, copia_color: copiaColor, print_bn: printBn, print_color: printColor } = t.contadores;
      const imprimir = printBn + printColor;
      const copia = copiaBn + copiaColor;
      const total = t.totales.general;
      sub.total += total;
      sub.imprimir += imprimir;
      sub.copia += copia;
      sub.copiaBn += copiaBn;
      sub.copiaColor += copiaColor;
      sub.printBn += printBn;
      sub.printColor += printColor;
      filas.push(fila('dato', t.usuario.id, t.usuario.nombre || '', total, imprimir, copia, copiaBn, copiaColor, printBn, printColor));
    });
    filas.push(fila('total', 'Subtotal', null, sub.total, sub.imprimir, sub.copia, sub.copiaBn, sub.copiaColor, sub.printBn, sub.printColor));
  });
  return filas;
};

export const ANCHOS_USUARIOS = [16, 36, 12, 12, 12, 12, 12, 14, 14];

/** Hoja del detalle por usuario, o null si el período no tiene detalle. */
export const hojaUsuarios = (
  data: MaquinaConsolidada[],
  cliente: ClienteParaTabla | undefined,
  periodo: string,
  datos: DatosExcel,
): HojaExcel | null => {
  if (!datos.transacciones || datos.transacciones.length === 0) return null;
  return {
    nombre: 'Detalle por usuario',
    columnas: CABECERA_USUARIOS.length,
    anchos: ANCHOS_USUARIOS,
    filas: [
      ...filasCabecera('Detalle por dispositivo y usuario', cliente, periodo, datos),
      ...filasUsuarios(datos.transacciones, data),
    ],
  };
};

/** Nombre del archivo sin caracteres que Windows no admite. */
export const nombreArchivoExcel = (cliente: ClienteParaTabla | undefined, periodo: string): string =>
  `Consolidado_${(cliente?.nombre || 'Cliente').replace(/[\\/:*?"<>|]/g, '').trim()}_${periodo}.xlsx`;

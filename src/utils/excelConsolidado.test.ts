import { describe, expect, it } from 'vitest';
import type { ClienteParaTabla } from '@models/Cliente/cliente.types';
import type { DetalleTransaccion, FacturacionContrato, MaquinaConsolidada, ResumenConsolidado } from '@models/Reporte/reporte.types';
import { MENSAJE_IMPORTE_PENDIENTE } from './facturacionUtils';
import {
  CABECERA_USUARIOS,
  contadoresFila,
  dinero,
  fechaGeneracion,
  filasCabecera,
  filasFacturacion,
  filasMaquinas,
  filasReemplazos,
  filasTotales,
  filasUsuarios,
  hojaConsolidado,
  hojaUsuarios,
  IMPORTE_PENDIENTE,
  nombreArchivoExcel,
  ordenarComoPantalla,
  periodoEnLetras,
  valorCelda,
  type FilaExcel,
} from './excelConsolidado';

const valores = (f: FilaExcel) => f.celdas.map(valorCelda);
const buscar = (filas: FilaExcel[], primera: string) => filas.find((f) => f.celdas[0] === primera);

const cliente = { nombre: 'Colegio Horizonte (demo)', razon_social: 'Unidad Educativa Horizonte S.A.', ruc: '1790000000001' } as ClienteParaTabla;

const maquina = (over: Partial<MaquinaConsolidada> & { serie: string; bn: number; color: number }): MaquinaConsolidada => ({
  info: { serie: over.serie, modelo: `Modelo ${over.serie}`, ip: `10.0.0.${over.serie.length}`, area: 'Secretaría' } as MaquinaConsolidada['info'],
  anterior: { total_contador_bn: 1000, total_contador_color: 100, total_servicio: 0 } as MaquinaConsolidada['anterior'],
  actual: { total_contador_bn: 1000 + over.bn, total_contador_color: 100 + over.color, total_servicio: 0 } as MaquinaConsolidada['actual'],
  consumo: { total_bn: over.bn, total_color: over.color, gran_total: over.bn + over.color },
  financiero: { monto_total: '0.00', monto_referencial: '10.10' },
  ...over,
});

const contrato = (over: Partial<FacturacionContrato> = {}): FacturacionContrato => ({
  contrato_id: 1,
  modo: 'DIFERENCIAR',
  bn: { consumo: 13960, incluidas: 5000, excedente: 8960, cuota_fija: '100.00', monto_excedente: '224.00' },
  color: { consumo: 679, incluidas: 500, excedente: 179, cuota_fija: '50.00', monto_excedente: '21.48' },
  renta: '0.00',
  total: '395.48',
  ...over,
});

const resumen = (over: Partial<ResumenConsolidado> = {}): ResumenConsolidado => ({
  total_bn: 13960, total_color: 679, total_impresiones: 14639, monto_total_general: '395.48',
  facturacion: [contrato()], total_maquinas: 2, total_cambios: 0, periodo: '2026-10', cliente_id: 1,
  renta_equipos: [], total_renta: 0, total_general: 0,
  ...over,
});

const transaccion = (id: string, nombre: string, ip: string, c: DetalleTransaccion['contadores']): DetalleTransaccion => ({
  id: Number(id) || 0,
  transaccion: { fecha: '2026-10-31T08:00:00' },
  usuario: { id, nombre },
  maquina: { serie: 'SIMA0001', modelo: 'Modelo A', ip, area: 'Secretaría' },
  contadores: c,
  totales: { bn: c.copia_bn + c.print_bn, color: c.copia_color + c.print_color, general: c.copia_bn + c.copia_color + c.print_bn + c.print_color },
  costos: {} as DetalleTransaccion['costos'],
});

describe('periodoEnLetras', () => {
  it('pone el mes en letras', () => {
    expect(periodoEnLetras('2026-10')).toBe('Octubre de 2026');
    expect(periodoEnLetras('2026-11')).toBe('Noviembre de 2026');
  });
  it('deja tal cual lo que no entiende', () => {
    expect(periodoEnLetras('octubre')).toBe('octubre');
  });
});

describe('dinero', () => {
  it('convierte el texto del backend en número con 2 decimales', () => {
    expect(dinero('395.48')).toEqual({ dinero: 395.48 });
    expect(dinero(148.5 + 198.6)).toEqual({ dinero: 347.1 });
    expect(dinero(undefined)).toEqual({ dinero: 0 });
  });
});

describe('filasCabecera', () => {
  it('trae cliente, RUC, período y fecha de generación', () => {
    const generadoEn = new Date(2026, 10, 20, 10, 15, 30);
    const filas = filasCabecera('Consolidado de impresión', cliente, '2026-10', { resumen: null, fechaInicio: '2026/09/30', fechaFin: '2026/10/31', generadoEn });
    expect(valores(filas[0])).toEqual(['Consolidado de impresión']);
    expect(valores(buscar(filas, 'Cliente')!)).toEqual(['Cliente', 'Colegio Horizonte (demo)']);
    expect(valores(buscar(filas, 'Razón social')!)).toEqual(['Razón social', 'Unidad Educativa Horizonte S.A.']);
    expect(valores(buscar(filas, 'RUC')!)).toEqual(['RUC', '1790000000001']);
    expect(valores(buscar(filas, 'Período')!)).toEqual(['Período', 'Octubre de 2026']);
    expect(valores(buscar(filas, 'Inicio del período')!)).toEqual(['Inicio del período', '2026/09/30']);
    expect(valores(buscar(filas, 'Fin del período')!)).toEqual(['Fin del período', '2026/10/31']);
    expect(valores(buscar(filas, 'Generado el')!)).toEqual(['Generado el', fechaGeneracion(generadoEn)]);
  });
});

describe('contadoresFila', () => {
  it('suma B/N y color del contador', () => {
    expect(contadoresFila(maquina({ serie: 'A', bn: 50, color: 5 }))).toEqual({ inicial: 1100, final: 1155 });
  });
  it('en un reemplazo toma el contador inicial de la entrante', () => {
    const m = maquina({ serie: 'F', bn: 100, color: 0 });
    m.cambio = { maquina_entrante: { contadores: { anterior: { global: 18000 } } } } as MaquinaConsolidada['cambio'];
    m.actual = { ...m.actual, total_contador_bn: 22800, total_contador_color: 0 };
    expect(contadoresFila(m)).toEqual({ inicial: 18000, final: 22800 });
  });
});

describe('filasMaquinas', () => {
  const data = [maquina({ serie: 'SIMA0001', bn: 4030, color: 679 }), maquina({ serie: 'SIMB0002', bn: 9930, color: 0 })];
  const filas = filasMaquinas(data);

  it('escribe contadores y páginas como números y el importe con 2 decimales', () => {
    const datos = filas.filter((f) => f.estilo === 'dato');
    expect(datos).toHaveLength(2);
    expect(valores(datos[0])).toEqual(['Modelo SIMA0001', '10.0.0.8', 'Secretaría', 'SIMA0001', 1100, 5809, 4030, 679, 4709, 10.1, 'Sin cambios']);
    expect(datos[0].celdas[9]).toEqual({ dinero: 10.1 });
    datos[0].celdas.slice(4, 9).forEach((c) => expect(typeof c).toBe('number'));
  });

  it('cierra con la fila de totales', () => {
    expect(valores(buscar(filas, 'Totales generales')!)).toEqual(['Totales generales', null, null, null, 2200, 16839, 13960, 679, 14639, 20.2, null]);
  });
});

describe('filasFacturacion', () => {
  it('muestra la tabla del contrato desde resumen.facturacion', () => {
    const filas = filasFacturacion(resumen());
    expect(valores(filas[1])).toEqual(['Contrato #1 · B/N y color por separado']);
    expect(valores(buscar(filas, 'B/N')!)).toEqual(['B/N', 13960, 5000, 8960, 100, 224]);
    expect(valores(buscar(filas, 'Color')!)).toEqual(['Color', 679, 500, 179, 50, 21.48]);
    expect(valores(buscar(filas, 'Renta de equipos')!)).toEqual(['Renta de equipos', null, null, null, null, 0]);
    expect(valores(buscar(filas, 'Total del contrato')!)).toEqual(['Total del contrato', null, null, null, null, 395.48]);
    expect(buscar(filas, 'Total del período')).toBeUndefined();
  });

  it('con varios contratos agrega el total del período', () => {
    const filas = filasFacturacion(resumen({
      facturacion: [contrato(), contrato({ contrato_id: 2, modo: 'TODO_COLOR', total: '100.00' })],
      monto_total_general: '495.48',
    }));
    expect(filas.some((f) => f.celdas[0] === 'Contrato #2 · Todo como color: las páginas B/N cuentan como color')).toBe(true);
    expect(valores(buscar(filas, 'Total del período')!)).toEqual(['Total del período', null, null, null, null, 495.48]);
  });

  it('avisa cuando la facturación es la del contrato completo por un filtro', () => {
    const filas = filasFacturacion(resumen({ facturacion: [contrato({ filtrado: true })] }));
    expect(filas.at(-1)?.estilo).toBe('nota');
  });

  it('sin facturación deja la fila «Importe pendiente de cálculo»', () => {
    for (const r of [resumen({ facturacion: [] }), resumen({ facturacion: undefined }), null]) {
      const filas = filasFacturacion(r);
      expect(filas).toHaveLength(2);
      expect(valores(filas[1])).toEqual([IMPORTE_PENDIENTE, `${MENSAJE_IMPORTE_PENDIENTE}.`]);
    }
  });
});

describe('filasTotales', () => {
  it('usa los totales del resumen', () => {
    const filas = filasTotales(resumen(), []);
    expect(valores(buscar(filas, 'Total de páginas')!)).toEqual(['Total de páginas', 14639]);
    expect(valores(buscar(filas, 'Máquinas')!)).toEqual(['Máquinas', 2]);
    expect(valores(buscar(filas, 'Importe del período')!)).toEqual(['Importe del período', 395.48]);
  });
  it('sin facturación el importe queda pendiente', () => {
    expect(valores(buscar(filasTotales(resumen({ facturacion: [] }), []), 'Importe del período')!)).toEqual(['Importe del período', 'Pendiente']);
  });
});

describe('filasReemplazos', () => {
  it('no agrega nada si no hubo reemplazos', () => {
    expect(filasReemplazos([maquina({ serie: 'A', bn: 1, color: 0 })])).toEqual([]);
  });
  it('muestra los dos tramos y el total consolidado', () => {
    const m = maquina({ serie: 'SIMF0006', bn: 10350, color: 0 });
    const tramo = (anterior: number, actual: number) => ({
      anterior: { global: anterior }, actual: { global: actual }, consumo: { global: actual - anterior, total_bn: actual - anterior, total_color: 0 },
    });
    m.cambio = {
      area: 'Biblioteca', tipo: 'Daño', razon: 'Falla del fusor',
      maquina_saliente: { serie: 'SIMB0002', modelo: 'B', fecha_retiro: '2026-11-12', contadores: tramo(371300, 376850) },
      maquina_entrante: { serie: 'SIMF0006', modelo: 'F', fecha_instalacion: '2026-11-13', contadores: tramo(18000, 22800) },
      totales: { consumo_total: 10350 },
    } as unknown as MaquinaConsolidada['cambio'];
    const filas = filasReemplazos([m]);
    expect(valores(filas[1])).toEqual(['Área: Biblioteca · Daño · Falla del fusor']);
    expect(valores(buscar(filas, 'Saliente')!)).toEqual(['Saliente', 'SIMB0002', 'B', 'Retiro: 2026/11/12', 371300, 376850, 5550, 0, 5550]);
    expect(valores(buscar(filas, 'Entrante')!)).toEqual(['Entrante', 'SIMF0006', 'F', 'Instalación: 2026/11/13', 18000, 22800, 4800, 0, 4800]);
    expect(valores(buscar(filas, 'Total consolidado')!).at(-1)).toBe(10350);
  });
});

describe('filasUsuarios', () => {
  const ip = '10.0.0.8';
  const trans = [
    transaccion('OTRO', 'OTRO', ip, { copia_bn: 1, copia_color: 0, print_bn: 2, print_color: 0 }),
    transaccion('10', 'Ana', ip, { copia_bn: 5, copia_color: 6, print_bn: 70, print_color: 80 }),
    transaccion('2', 'Luis', ip, { copia_bn: 1, copia_color: 2, print_bn: 30, print_color: 40 }),
  ];

  it('cada encabezado recibe su valor: copias en «Copia», impresiones en «Imprimir»', () => {
    const filas = filasUsuarios(trans, []);
    expect(valores(filas[1])).toEqual(CABECERA_USUARIOS);
    const ana = filas.find((f) => f.celdas[1] === 'Ana')!;
    const col = (nombre: string) => valorCelda(ana.celdas[CABECERA_USUARIOS.indexOf(nombre)]);
    expect(col('Copia B/N')).toBe(5);
    expect(col('Copia color')).toBe(6);
    expect(col('Imprimir B/N')).toBe(70);
    expect(col('Imprimir color')).toBe(80);
    expect(col('Copia')).toBe(11);
    expect(col('Imprimir')).toBe(150);
    expect(col('Total')).toBe(161);
  });

  it('ordena como la pantalla y suma el subtotal', () => {
    const filas = filasUsuarios(trans, []);
    expect(filas.filter((f) => f.estilo === 'dato').map((f) => f.celdas[0])).toEqual(['2', '10', 'OTRO']);
    expect(valores(buscar(filas, 'Subtotal')!)).toEqual(['Subtotal', null, 237, 222, 15, 7, 8, 102, 120]);
  });

  it('toma la fecha de corte del consolidado como «Tomado el»', () => {
    const m = maquina({ serie: 'SIMA0001', bn: 1, color: 0 });
    m.info.fecha_corte_actual = '2026-10-30T17:45:00';
    expect(filasUsuarios(trans, [m])[0].celdas[0]).toContain('Tomado el: 2026/10/30 17:45');
  });

  it('una tabla por máquina', () => {
    const otra = transaccion('3', 'Eva', '10.0.0.9', { copia_bn: 0, copia_color: 0, print_bn: 1, print_color: 0 });
    const filas = filasUsuarios([...trans, otra], []);
    expect(filas.filter((f) => f.estilo === 'subseccion')).toHaveLength(2);
    expect(filas.filter((f) => f.celdas[0] === 'Subtotal')).toHaveLength(2);
  });
});

describe('ordenarComoPantalla', () => {
  it('no cambia el arreglo original', () => {
    const lista = [transaccion('2', 'B', 'x', { copia_bn: 0, copia_color: 0, print_bn: 0, print_color: 0 }), transaccion('1', 'A', 'x', { copia_bn: 0, copia_color: 0, print_bn: 0, print_color: 0 })];
    expect(ordenarComoPantalla(lista).map((t) => t.usuario.id)).toEqual(['1', '2']);
    expect(lista.map((t) => t.usuario.id)).toEqual(['2', '1']);
  });
});

describe('hojas', () => {
  const data = [maquina({ serie: 'SIMA0001', bn: 4030, color: 679 })];

  it('el consolidado lleva cabecera, impresoras, facturación y totales', () => {
    const hoja = hojaConsolidado(data, cliente, '2026-10', { resumen: resumen() });
    const secciones = hoja.filas.filter((f) => f.estilo === 'seccion').map((f) => f.celdas[0]);
    expect(hoja.nombre).toBe('Consolidado');
    expect(secciones).toEqual(['Listado de impresoras', 'Facturación del período', 'Totales del período']);
    expect(hoja.anchos).toHaveLength(hoja.columnas);
  });

  it('la hoja por usuario solo existe si hay detalle', () => {
    expect(hojaUsuarios(data, cliente, '2026-10', { resumen: resumen(), transacciones: [] })).toBeNull();
    const hoja = hojaUsuarios(data, cliente, '2026-10', {
      resumen: resumen(),
      transacciones: [transaccion('1', 'Ana', '10.0.0.8', { copia_bn: 1, copia_color: 0, print_bn: 0, print_color: 0 })],
    });
    expect(hoja?.nombre).toBe('Detalle por usuario');
    expect(buscar(hoja!.filas, 'RUC')).toBeDefined();
  });
});

describe('nombreArchivoExcel', () => {
  it('quita los caracteres que Windows no admite', () => {
    expect(nombreArchivoExcel({ nombre: 'A/B: "C"' } as ClienteParaTabla, '2026-10')).toBe('Consolidado_AB C_2026-10.xlsx');
  });
});

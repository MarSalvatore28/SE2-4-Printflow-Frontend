import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ClienteParaTabla } from "@models/Cliente/cliente.types";
import type { MaquinaConsolidada, DetalleTransaccion } from "@models/Reporte/reporte.types";
import {
  FORMATO_DINERO, FORMATO_ENTERO, hojaConsolidado, hojaUsuarios, nombreArchivoExcel,
  type Celda, type DatosExcel, type EstiloFila, type HojaExcel,
} from "@utils/excelConsolidado";

// ---------------------------------------------------------------------------
// Excel del consolidado (S4-02)
// Las filas se arman en excelConsolidado.ts; aquí solo se les da estilo y se escribe el archivo.
// ---------------------------------------------------------------------------

export type ExportExcelData = DatosExcel;

type EstiloCelda = Record<string, unknown>;

const LINEA = { style: "thin", color: { rgb: "000000" } };
const BORDE = { top: LINEA, bottom: LINEA, left: LINEA, right: LINEA };

const ESTILOS_EXCEL: Record<EstiloFila, EstiloCelda> = {
  titulo: { font: { bold: true, sz: 16, color: { rgb: "1F4E78" } }, alignment: { horizontal: "left", vertical: "center" } },
  etiqueta: { font: { sz: 11 }, alignment: { horizontal: "left", vertical: "center" } },
  seccion: { font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, fill: { patternType: "solid", fgColor: { rgb: "1F4E78" } }, alignment: { horizontal: "left", vertical: "center" }, border: BORDE },
  subseccion: { font: { bold: true, sz: 10, color: { rgb: "1F4E78" } }, fill: { patternType: "solid", fgColor: { rgb: "BDD7EE" } }, alignment: { horizontal: "left", vertical: "center" }, border: BORDE },
  cabecera: { font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } }, fill: { patternType: "solid", fgColor: { rgb: "2F75B5" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: BORDE },
  dato: { font: { sz: 10 }, alignment: { horizontal: "left", vertical: "center" }, border: BORDE },
  total: { font: { bold: true, sz: 10 }, fill: { patternType: "solid", fgColor: { rgb: "E7E6E6" } }, alignment: { horizontal: "left", vertical: "center" }, border: BORDE },
  nota: { font: { italic: true, sz: 9, color: { rgb: "595959" } }, alignment: { horizontal: "left", vertical: "top", wrapText: true } },
  vacia: {},
};

/** Filas que ocupan todo el ancho de la hoja. */
const FILAS_ANCHAS: EstiloFila[] = ["titulo", "seccion", "subseccion", "nota"];

/** Celda de xlsx: los contadores y las páginas como número entero, los importes como número con 2 decimales. */
const celdaXlsx = (c: Celda, estilo: EstiloFila): XLSX.CellObject => {
  const base = ESTILOS_EXCEL[estilo];
  if (typeof c === "number") {
    return { t: "n", v: c, z: FORMATO_ENTERO, s: { ...base, numFmt: FORMATO_ENTERO, alignment: { horizontal: "right", vertical: "center" } } } as XLSX.CellObject;
  }
  if (c !== null && typeof c === "object") {
    return { t: "n", v: c.dinero, z: FORMATO_DINERO, s: { ...base, numFmt: FORMATO_DINERO, alignment: { horizontal: "right", vertical: "center" } } } as XLSX.CellObject;
  }
  const texto = c ?? "";
  const negrita = estilo === "etiqueta" ? { font: { bold: true, sz: 11 } } : {};
  return { t: "s", v: texto, s: { ...base, ...negrita } } as XLSX.CellObject;
};

const hojaXlsx = (hoja: HojaExcel): XLSX.WorkSheet => {
  const ws: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];
  const alturas: XLSX.RowInfo[] = [];
  let ultimaColumna = hoja.columnas - 1;

  hoja.filas.forEach((f, r) => {
    const ancha = FILAS_ANCHAS.includes(f.estilo);
    const columnas = ancha ? hoja.columnas : f.celdas.length;
    for (let c = 0; c < columnas; c++) {
      const valor = f.celdas[c] ?? null;
      // En la cabecera del informe la etiqueta va en negrita y la segunda columna sin estilo de borde
      if (valor === null && f.estilo === "etiqueta") continue;
      if (c === 0 && f.estilo === "etiqueta") {
        ws[XLSX.utils.encode_cell({ r, c })] = celdaXlsx(valor, "etiqueta");
        continue;
      }
      ws[XLSX.utils.encode_cell({ r, c })] = celdaXlsx(valor, f.estilo === "etiqueta" ? "vacia" : f.estilo);
    }
    ultimaColumna = Math.max(ultimaColumna, columnas - 1);
    if (ancha && hoja.columnas > 1) merges.push({ s: { r, c: 0 }, e: { r, c: hoja.columnas - 1 } });
    alturas[r] = f.estilo === "nota" ? { hpt: 28 } : f.estilo === "cabecera" ? { hpt: 30 } : f.estilo === "titulo" ? { hpt: 24 } : {};
  });

  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(hoja.filas.length - 1, 0), c: Math.max(ultimaColumna, 0) } });
  ws["!merges"] = merges;
  ws["!cols"] = hoja.anchos.map((wch) => ({ wch }));
  ws["!rows"] = alturas;
  return ws;
};

/** Libro del consolidado: la hoja del consolidado y, si hay detalle por usuario, otra hoja. */
export const libroExcel = (
  data: MaquinaConsolidada[],
  cliente: ClienteParaTabla | undefined,
  periodo: string,
  datos: ExportExcelData
): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, hojaXlsx(hojaConsolidado(data, cliente, periodo, datos)), "Consolidado");
  const usuarios = hojaUsuarios(data, cliente, periodo, datos);
  if (usuarios) XLSX.utils.book_append_sheet(wb, hojaXlsx(usuarios), usuarios.nombre);
  return wb;
};

export const exportToExcel = (
  data: MaquinaConsolidada[],
  cliente: ClienteParaTabla | undefined,
  periodo: string,
  datos: ExportExcelData
) => {
  if (!data || data.length === 0) return;
  XLSX.writeFile(libroExcel(data, cliente, periodo, datos), nombreArchivoExcel(cliente, periodo));
};

// ---------------------------------------------------------------------------
// PDF del consolidado (S4-01)
// Lo que usa solo el PDF se importa aquí, junto a sus funciones, para que el PDF
// y el Excel de este archivo se puedan cambiar por separado.
// ---------------------------------------------------------------------------
import type { CellDef, CellHookData, RowInput } from "jspdf-autotable";
import type { FacturacionContrato, FacturacionTramo, ResumenConsolidado } from "@models/Reporte/reporte.types";
import { formatMoney as dineroSinSigno, formatNumber as enteroPDF, formatFechaISO } from "@utils/formatUtils";
import { aMonto, hayFacturacion, importeReferencial, MENSAJE_IMPORTE_PENDIENTE, NOTA_IMPORTE_REFERENCIAL } from "@utils/facturacionUtils";

export interface ExportPDFData {
  /** `resumen` del consolidado: totales y `facturacion` del backend. */
  resumen: ResumenConsolidado | null;
  /** Detalle por usuario: va como anexo al final, en otra página. */
  transacciones?: DetalleTransaccion[];
  /** Fechas de corte del período, ya formateadas (AAAA/MM/DD). */
  fechaInicio?: string;
  fechaFin?: string;
}

const MESES_PDF = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/** "2026-10" → "Octubre de 2026". */
const periodoEnLetras = (periodo: string): string => {
  const [anio, mes] = periodo.split("-");
  const nombre = MESES_PDF[Number(mes) - 1];
  return nombre && anio ? `${nombre} de ${anio}` : periodo;
};

const fechaHoraPDF = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
});

const dineroPDF = (valor: string | number | null | undefined): string => `$ ${dineroSinSigno(aMonto(valor))}`;

const COLOR_CABECERA: [number, number, number] = [50, 50, 50];
const COLOR_TOTAL: [number, number, number] = [235, 235, 235];
const COLOR_REEMPLAZO: [number, number, number] = [255, 243, 205];
const MARGEN = 14;

/** Dónde terminó la última tabla dibujada. */
const finDeTabla = (doc: jsPDF): number => (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

/** Salta de página si lo que sigue (alto aproximado en mm) no entra. */
const asegurarEspacio = (doc: jsPDF, y: number, alto: number): number => {
  if (y + alto > doc.internal.pageSize.getHeight() - 15) {
    doc.addPage();
    return 20;
  }
  return y;
};

const tituloSeccion = (doc: jsPDF, texto: string, y: number): number => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(texto, MARGEN, y);
  doc.setFont("helvetica", "normal");
  return y + 4;
};

/** Contadores de la fila, igual que la tabla de la pantalla. */
const contadoresFilaPDF = (m: MaquinaConsolidada) => {
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

const celdaTramo = (contenido: string): CellDef => ({ content: contenido, styles: { fontStyle: "italic", textColor: [90, 90, 90] } });

/** Filas del detalle por máquina. Un reemplazo lleva una fila con el total del puesto y una por tramo. */
const filasDetallePDF = (data: MaquinaConsolidada[]): RowInput[] => {
  const filas: RowInput[] = [];
  data.forEach((m) => {
    const bn = m.consumo.total_bn || 0;
    const color = m.consumo.total_color || 0;
    const importe = dineroPDF(importeReferencial(m));

    if (!m.cambio) {
      const { inicial, final } = contadoresFilaPDF(m);
      filas.push([m.info.serie || "", m.info.modelo || "", m.info.area || "", enteroPDF(inicial), enteroPDF(final), enteroPDF(bn), enteroPDF(color), importe]);
      return;
    }

    const { maquina_saliente: sale, maquina_entrante: entra } = m.cambio;
    const reemplazo = { styles: { fillColor: COLOR_REEMPLAZO } };
    filas.push([
      { content: m.info.serie || "", ...reemplazo },
      { content: m.info.modelo || "", ...reemplazo },
      { content: m.info.area || "", ...reemplazo },
      { content: `Reemplazo: ${sale.serie} por ${entra.serie}`, colSpan: 2, styles: { ...reemplazo.styles, fontStyle: "bold", halign: "center" } },
      { content: enteroPDF(bn), ...reemplazo },
      { content: enteroPDF(color), ...reemplazo },
      { content: importe, ...reemplazo },
    ]);
    filas.push([
      celdaTramo(sale.serie),
      celdaTramo(sale.modelo || ""),
      celdaTramo(`Sale el ${formatFechaISO(sale.fecha_retiro)}`),
      celdaTramo(enteroPDF(sale.contadores.anterior.global)),
      celdaTramo(enteroPDF(sale.contadores.actual.global)),
      celdaTramo(enteroPDF(sale.contadores.consumo.total_bn)),
      celdaTramo(enteroPDF(sale.contadores.consumo.total_color)),
      celdaTramo(""),
    ]);
    filas.push([
      celdaTramo(entra.serie),
      celdaTramo(entra.modelo || ""),
      celdaTramo(`Entra el ${formatFechaISO(entra.fecha_instalacion)}`),
      celdaTramo(enteroPDF(entra.contadores.anterior.global)),
      celdaTramo(enteroPDF(entra.contadores.actual.global)),
      celdaTramo(enteroPDF(entra.contadores.consumo.total_bn)),
      celdaTramo(enteroPDF(entra.contadores.consumo.total_color)),
      celdaTramo(""),
    ]);
  });
  return filas;
};

const filaTramoFacturacion = (tipo: string, t: FacturacionTramo): RowInput => [
  tipo, enteroPDF(t.consumo), enteroPDF(t.incluidas), enteroPDF(t.excedente), dineroPDF(t.cuota_fija), dineroPDF(t.monto_excedente),
];

/** Facturación de un contrato: B/N, color, renta y total, como la tarjeta de la pantalla. */
const tablaContratoPDF = (doc: jsPDF, c: FacturacionContrato, y: number): number => {
  const modo = c.modo === "TODO_COLOR" ? "Todo como color: las páginas B/N cuentan como color" : "B/N y color por separado";
  doc.setFontSize(9);
  doc.text(`Contrato #${c.contrato_id} · ${modo}`, MARGEN, y + 3);
  const totalFila = (concepto: string, valor: string, negrita: boolean): RowInput => [
    { content: concepto, colSpan: 5, styles: { halign: "right", fontStyle: negrita ? "bold" : "normal", fillColor: negrita ? COLOR_TOTAL : undefined } },
    { content: valor, styles: { halign: "right", fontStyle: negrita ? "bold" : "normal", fillColor: negrita ? COLOR_TOTAL : undefined } },
  ];
  autoTable(doc, {
    startY: y + 5,
    head: [["Páginas", "Consumo", "Incluidas", "Excedente", "Cuota fija", "Monto del excedente"]],
    body: [
      filaTramoFacturacion("B/N", c.bn),
      filaTramoFacturacion("Color", c.color),
      totalFila("Renta de equipos", dineroPDF(c.renta), false),
      totalFila("Total del contrato", dineroPDF(c.total), true),
    ],
    theme: "grid",
    headStyles: { fillColor: COLOR_CABECERA, textColor: 255, halign: "right" },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
    didParseCell: (d: CellHookData) => { if (d.section === "head" && d.column.index === 0) d.cell.styles.halign = "left"; },
    margin: { left: MARGEN, right: MARGEN },
  });
  return finDeTabla(doc) + 6;
};

interface TotalesUsuarioPDF {
  id: string;
  nombre: string;
  copiaBn: number;
  copiaColor: number;
  printBn: number;
  printColor: number;
}

/** Anexo con el detalle por usuario de cada máquina (lo mismo que «Detalles por dispositivo y usuario»). */
const anexoUsuariosPDF = (doc: jsPDF, transacciones: DetalleTransaccion[]) => {
  doc.addPage();
  let y = tituloSeccion(doc, "Anexo: detalle por dispositivo y usuario", 20) + 4;

  const porMaquina = new Map<string, DetalleTransaccion[]>();
  transacciones.forEach((t) => {
    const lista = porMaquina.get(t.maquina.ip) ?? [];
    lista.push(t);
    porMaquina.set(t.maquina.ip, lista);
  });

  porMaquina.forEach((trans) => {
    const maquina = trans[0].maquina;
    y = asegurarEspacio(doc, y, 30);
    const fecha = trans[0].transaccion.fecha ? String(trans[0].transaccion.fecha).substring(0, 16).replace("T", " ").replace(/-/g, "/") : "N/A";
    doc.setFontSize(9);
    doc.text(`${maquina.area || "Sin área"} · ${maquina.modelo || "Sin modelo"} · Serie ${maquina.serie || "N/A"} · IP ${maquina.ip} · Tomado el ${fecha}`, MARGEN, y);

    const usuarios = new Map<string, TotalesUsuarioPDF>();
    trans.forEach((t) => {
      const id = t.usuario.id || "N/A";
      const u = usuarios.get(id) ?? { id, nombre: t.usuario.nombre || "", copiaBn: 0, copiaColor: 0, printBn: 0, printColor: 0 };
      u.copiaBn += t.contadores.copia_bn;
      u.copiaColor += t.contadores.copia_color;
      u.printBn += t.contadores.print_bn;
      u.printColor += t.contadores.print_color;
      usuarios.set(id, u);
    });
    const fila = (u: Omit<TotalesUsuarioPDF, "id" | "nombre">) => {
      const copias = u.copiaBn + u.copiaColor;
      const impresiones = u.printBn + u.printColor;
      return [copias + impresiones, impresiones, copias, u.copiaBn, u.copiaColor, u.printBn, u.printColor].map(enteroPDF);
    };
    const lista = [...usuarios.values()];
    const total = lista.reduce((acc, u) => ({
      copiaBn: acc.copiaBn + u.copiaBn, copiaColor: acc.copiaColor + u.copiaColor, printBn: acc.printBn + u.printBn, printColor: acc.printColor + u.printColor,
    }), { copiaBn: 0, copiaColor: 0, printBn: 0, printColor: 0 });

    autoTable(doc, {
      startY: y + 2,
      head: [["Cuenta ID", "Nombre", "Total", "Imprimir", "Copia", "Copia B/N", "Copia color", "Imprimir B/N", "Imprimir color"]],
      body: [
        ...lista.map((u): RowInput => [u.id, u.nombre, ...fila(u)]),
        [{ content: "Subtotal", colSpan: 2, styles: { fontStyle: "bold", fillColor: COLOR_TOTAL } }, ...fila(total).map((v): CellDef => ({ content: v, styles: { fontStyle: "bold", fillColor: COLOR_TOTAL } }))],
      ],
      theme: "grid",
      headStyles: { fillColor: COLOR_CABECERA, textColor: 255 },
      styles: { fontSize: 7, cellPadding: 1 },
      columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "right" }, 8: { halign: "right" } },
      margin: { left: MARGEN, right: MARGEN },
    });
    y = finDeTabla(doc) + 8;
  });
};

export const exportToPDF = (
  data: MaquinaConsolidada[],
  cliente: ClienteParaTabla | undefined,
  periodo: string,
  datos: ExportPDFData
) => {
  if (!data || data.length === 0) return;
  const { resumen, transacciones, fechaInicio, fechaFin } = datos;
  const doc = new jsPDF();
  const ancho = doc.internal.pageSize.getWidth();
  const periodoTexto = periodoEnLetras(periodo);

  // Cabecera: cliente, período y fecha de generación
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Consolidado de impresión", MARGEN, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generado el ${fechaHoraPDF.format(new Date())}`, ancho - MARGEN, 16, { align: "right" });

  autoTable(doc, {
    startY: 20,
    body: [
      ["Razón social", cliente?.razon_social || cliente?.nombre || ""],
      ["Cliente", cliente?.nombre || ""],
      ["RUC", cliente?.ruc || ""],
      ["Período", `${periodoTexto} (del ${fechaInicio || "N/A"} al ${fechaFin || "N/A"})`],
    ],
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 0.8 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 30 } },
    margin: { left: MARGEN, right: MARGEN },
  });
  let y = finDeTabla(doc) + 8;

  // Detalle por máquina
  y = tituloSeccion(doc, "Detalle por máquina", y);
  const totales = data.reduce((acc, m) => ({
    bn: acc.bn + (m.consumo.total_bn || 0),
    color: acc.color + (m.consumo.total_color || 0),
    importe: acc.importe + importeReferencial(m),
  }), { bn: 0, color: 0, importe: 0 });
  const filaTotal: CellDef[] = [
    { content: "Totales", colSpan: 5, styles: { halign: "right" } },
    { content: enteroPDF(totales.bn) },
    { content: enteroPDF(totales.color) },
    { content: dineroPDF(totales.importe) },
  ];
  autoTable(doc, {
    startY: y,
    head: [["Serie", "Modelo", "Área", "Contador inicial", "Contador final", "Páginas B/N", "Páginas color", "Importe referencial*"]],
    body: [...filasDetallePDF(data), filaTotal.map((c) => ({ ...c, styles: { ...c.styles, fontStyle: "bold", fillColor: COLOR_TOTAL } }))],
    theme: "grid",
    headStyles: { fillColor: COLOR_CABECERA, textColor: 255, fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 1.2 },
    columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "right" } },
    margin: { left: MARGEN, right: MARGEN },
  });
  y = finDeTabla(doc) + 4;
  doc.setFontSize(8);
  doc.setTextColor(100);
  const nota = doc.splitTextToSize(`* ${NOTA_IMPORTE_REFERENCIAL}`, ancho - 2 * MARGEN);
  doc.text(nota, MARGEN, y + 2);
  doc.setTextColor(0);
  y += 4 + nota.length * 3.5 + 6;

  // Facturación del período (la del backend) o la nota si aún no hay importe
  y = asegurarEspacio(doc, y, 40);
  y = tituloSeccion(doc, "Facturación del período", y);
  const contratos = resumen?.facturacion ?? [];
  if (contratos.length === 0) {
    doc.setFontSize(10);
    doc.text(`${MENSAJE_IMPORTE_PENDIENTE}.`, MARGEN, y + 4);
    y += 12;
  } else {
    contratos.forEach((c) => {
      y = asegurarEspacio(doc, y, 40);
      y = tablaContratoPDF(doc, c, y);
    });
  }

  // Totales del período, al final del consolidado
  y = asegurarEspacio(doc, y, 45);
  y = tituloSeccion(doc, "Totales del período", y);
  autoTable(doc, {
    startY: y,
    body: [
      ["Páginas B/N", enteroPDF(resumen?.total_bn ?? totales.bn)],
      ["Páginas color", enteroPDF(resumen?.total_color ?? totales.color)],
      ["Total de páginas", enteroPDF(resumen?.total_impresiones ?? totales.bn + totales.color)],
      ["Máquinas", String(resumen?.total_maquinas ?? data.length)],
      [
        { content: "Importe del período", styles: { fontStyle: "bold", fillColor: COLOR_TOTAL } },
        { content: hayFacturacion(resumen) ? dineroPDF(resumen?.monto_total_general) : "Pendiente", styles: { fontStyle: "bold", fillColor: COLOR_TOTAL } },
      ],
    ],
    theme: "grid",
    styles: { fontSize: 10 },
    tableWidth: 100,
    columnStyles: { 0: { cellWidth: 60 }, 1: { halign: "right" } },
    margin: { left: MARGEN, right: MARGEN },
  });

  if (transacciones && transacciones.length > 0) anexoUsuariosPDF(doc, transacciones);

  // Pie de cada página
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    const alto = doc.internal.pageSize.getHeight();
    doc.text(`${cliente?.nombre || ""} · ${periodoTexto}`, MARGEN, alto - 8);
    doc.text(`Página ${i} de ${paginas}`, ancho - MARGEN, alto - 8, { align: "right" });
  }
  doc.setTextColor(0);

  const nombreArchivo = (cliente?.nombre || "Cliente").replace(/[\\/:*?"<>|]/g, "").trim();
  doc.save(`Consolidado_${nombreArchivo}_${periodo}.pdf`);
};

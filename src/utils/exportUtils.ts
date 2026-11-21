import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ClienteParaTabla } from "@models/Cliente/cliente.types";
import type { MaquinaConsolidada, DetalleTransaccion } from "@models/Reporte/reporte.types";

export interface ExportExtraData {
  printerBill: string;
  rentaEquipos: any[];
  totalRenta: number;
  fechaInicio?: string;
  fechaFin?: string;
}

const STYLES = {
  headerTitle: { font: { bold: true, sz: 16, color: { rgb: "1F4E78" } }, alignment: { horizontal: "left", vertical: "center" } },
  headerInfo: { font: { bold: true, sz: 12, color: { rgb: "444444" } }, alignment: { horizontal: "left", vertical: "center" } },
  sectionHeader: {
    font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
    fill: { patternType: "solid", fgColor: { rgb: "1F4E78" } },
    alignment: { horizontal: "left", vertical: "center" },
    border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } },
  },
  tableHeader: {
    font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
    fill: { patternType: "solid", fgColor: { rgb: "2F75B5" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } },
  },
  deviceHeader: {
    font: { bold: true, sz: 10, color: { rgb: "1F4E78" } },
    fill: { patternType: "solid", fgColor: { rgb: "BDD7EE" } },
    alignment: { horizontal: "left", vertical: "center" },
    border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } },
  },
  cellData: {
    font: { sz: 10 }, alignment: { horizontal: "left", vertical: "center" },
    border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } },
  },
  cellNumber: {
    font: { sz: 10 }, alignment: { horizontal: "right", vertical: "center" },
    border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } },
  },
  subtotalRow: {
    font: { bold: true, sz: 10 },
    fill: { patternType: "solid", fgColor: { rgb: "E7E6E6" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "double", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } },
  },
  totalFinal: {
    font: { bold: true, sz: 11, color: { rgb: "000000" } },
    fill: { patternType: "solid", fgColor: { rgb: "E7E6E6" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "double", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } },
  }
};

export const exportToExcel = (
  data: MaquinaConsolidada[],
  cliente: ClienteParaTabla | undefined,
  periodo: string,
  transacciones?: DetalleTransaccion[],
  extraData?: ExportExtraData
) => {
  if (!data || data.length === 0) return;

  const encabezado = [
    ["REPORTE DE IMPRESORAS"],
    [`CLIENTE: ${cliente?.nombre || ""}`],
    [`INICIO DEL PERIODO: ${extraData?.fechaInicio || "N/A"}`],
    [`FIN DEL PERIODO: ${extraData?.fechaFin || "N/A"}`],
    [""],
  ];

  const headersListado = ["Impresora", "IP", "Área", "Serie", "Contador Anterior", "Contador Actual", "Consumo Mes"];
  let totalConsumoReal = 0;

  const filasListado = data.map((m) => {
    let ant, act, consRow, consReal;
    if (m.cambio) {
      const inicioNueva = m.cambio.maquina_entrante?.contadores?.anterior?.global || 0;
      const finNueva = (m.actual.total_contador_bn || 0) + (m.actual.total_contador_color || 0);
      ant = inicioNueva;
      act = finNueva;
      // Reemplazo: el backend ya suma el tramo de la saliente y el de la entrante
      consRow = (m.consumo.total_bn || 0) + (m.consumo.total_color || 0);
      consReal = consRow;
    } else {
      ant = (m.anterior.total_contador_bn || 0) + (m.anterior.total_contador_color || 0);
      act = (m.actual.total_contador_bn || 0) + (m.actual.total_contador_color || 0);
      consRow = (m.consumo.total_bn || 0) + (m.consumo.total_color || 0);
      consReal = consRow;
    }
    totalConsumoReal += consReal;
    return [m.info.modelo, m.info.ip, m.info.area, m.info.serie, ant, act, consRow];
  });

  const filaTotalListado = ["", "", "", "", "", "TOTAL", totalConsumoReal];

  const factDatos = buildFacturacionData(data, cliente, extraData);
  let filasFacturacion: any[] = [];

  filasFacturacion.push(["", "", ""]);
  filasFacturacion.push(["1. DETALLE DE IMPRESIONES Y EXCEDENTES", "", ""]);
  filasFacturacion.push(["CONCEPTO", "DETALLE", "MONTO"]);
  filasFacturacion.push(...factDatos.impresiones);

  if (factDatos.tieneRentas) {
    filasFacturacion.push(["", "", ""]);
    filasFacturacion.push(["2. DETALLE DE RENTA DE EQUIPOS", "", ""]);
    filasFacturacion.push(["EQUIPO", "", "MONTO"]);
    filasFacturacion.push(...factDatos.rentas);
  }

  filasFacturacion.push(["", "", ""]);
  filasFacturacion.push(["3. RESUMEN FINAL A FACTURAR", "", ""]);
  filasFacturacion.push(["CONCEPTO", "", "MONTO"]);
  filasFacturacion.push(...factDatos.resumen);

  const maquinasConCambio = data.filter(m => m.cambio);
  let filasCambios: any[] = [];
  if (maquinasConCambio.length > 0) {
    filasCambios.push([""], ["DETALLES DE CAMBIOS DE MÁQUINA"]);
    maquinasConCambio.forEach((m, idx) => {
      const cambio = m.cambio!;
      const fechaInstalacion = new Date(cambio.maquina_entrante.fecha_instalacion).toLocaleDateString();
      const fechaRetiro = new Date(cambio.maquina_saliente.fecha_retiro).toLocaleDateString();
      const consolidado = formatNumber(cambio.maquina_saliente.contadores.consumo.global + cambio.maquina_entrante.contadores.consumo.global);

      filasCambios.push(
        [`Cambio en Área: ${cambio.area} (${cambio.tipo}) - Fecha: ${fechaInstalacion}`],
        ["DETALLE", "MÁQUINA SALIENTE (RETIRADA)", "MÁQUINA ENTRANTE (NUEVA)"],
        ["Modelo", cambio.maquina_saliente.modelo, cambio.maquina_entrante.modelo],
        ["Serie", cambio.maquina_saliente.serie, cambio.maquina_entrante.serie],
        ["Fecha Evento", `Retiro: ${fechaRetiro}`, `Instalación: ${fechaInstalacion}`],
        ["Consumo Parcial", formatNumber(cambio.maquina_saliente.contadores.consumo.global), formatNumber(cambio.maquina_entrante.contadores.consumo.global)],
        ["TOTAL CONSOLIDADO", consolidado, ""],
      );
      if (idx < maquinasConCambio.length - 1) filasCambios.push([""]);
    });
  }

  let filasTransacciones: any[] = [];
  if (transacciones && transacciones.length > 0) {
    filasTransacciones = [
      [""],
      ["DETALLES POR DISPOSITIVO Y USUARIO"],
    ];

    const transaccionesPorMaquina = transacciones.reduce((acc, t) => {
      const key = t.maquina.ip;
      if (!acc[key]) acc[key] = { maquina: t.maquina, transacciones: [] };
      acc[key].transacciones.push(t);
      return acc;
    }, {} as Record<string, any>);

    Object.entries(transaccionesPorMaquina).forEach(([_ip, { maquina, transacciones: trans }], idx) => {
      if (idx > 0) filasTransacciones.push([""]);

      const fechaTomaRow = trans.length > 0 ? trans[0].transaccion.fecha : null;
      let fechaTomaFormat = "N/A";
      if (fechaTomaRow) {
        const dStr = typeof fechaTomaRow === 'string' ? fechaTomaRow : (fechaTomaRow as Date).toISOString();
        fechaTomaFormat = dStr.substring(0, 16).replace('T', ' ').replace(/-/g, '/');
      }

      filasTransacciones.push([`${maquina.area || "Desconocido"} - ${maquina.modelo || "Desconocido"} - Serie: ${maquina.serie || "N/A"} - IP ${maquina.ip} - Tomado el: ${fechaTomaFormat}`]);
      filasTransacciones.push(["CUENTA ID", "NOMBRE", "TOTAL", "IMPRIMIR", "COPIA", "COPIA B/N", "COPIA COLOR", "IMPRIMIR B/N", "IMPRIMIR COLOR"]);

      const totalesByUser = trans.reduce((acc: any, t: DetalleTransaccion) => {
        const userId = t.usuario.id || "N/A";
        if (!acc[userId]) {
          acc[userId] = { id: t.usuario.id, nombre: t.usuario.nombre || "Desconocido", lastDate: t.transaccion.fecha, total_copias: 0, total_impresiones: 0, copia_bn: 0, copia_color: 0, print_bn: 0, print_color: 0 };
        }
        acc[userId].total_copias += t.contadores.copia_bn + t.contadores.copia_color;
        acc[userId].total_impresiones += t.contadores.print_bn + t.contadores.print_color;
        acc[userId].copia_bn += t.contadores.copia_bn;
        acc[userId].copia_color += t.contadores.copia_color;
        acc[userId].print_bn += t.contadores.print_bn;
        acc[userId].print_color += t.contadores.print_color;
        if (new Date(t.transaccion.fecha) > new Date(acc[userId].lastDate)) acc[userId].lastDate = t.transaccion.fecha;
        return acc;
      }, {});

      Object.values(totalesByUser).forEach((u: any) => {
        filasTransacciones.push([u.id, u.nombre, u.total_copias + u.total_impresiones, u.total_impresiones, u.total_copias, u.copia_bn, u.copia_color, u.print_bn, u.print_color]);
      });

      const totalM = Object.values(totalesByUser).reduce((acc: any, t: any) => ({
        tc: acc.tc + t.total_copias, ti: acc.ti + t.total_impresiones, cbn: acc.cbn + t.copia_bn, cc: acc.cc + t.copia_color, pbn: acc.pbn + t.print_bn, pc: acc.pc + t.print_color
      }), { tc: 0, ti: 0, cbn: 0, cc: 0, pbn: 0, pc: 0 }) as any;

      filasTransacciones.push(["Subtotal:", "", totalM.tc + totalM.ti, totalM.ti, totalM.tc, totalM.cbn, totalM.cc, totalM.pbn, totalM.pc]);
    });
  }

  const allRows = [...encabezado, ["LISTADO DE IMPRESORAS"], headersListado, ...filasListado, filaTotalListado, ...filasFacturacion, ...filasCambios];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws["!cols"] = [{ wch: 45 }, { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

  const applyStylesToWs = (sheet: XLSX.WorkSheet, isSecundaria: boolean = false) => {
    const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!sheet[cellAddress]) continue;
        const cell = sheet[cellAddress];
        const val = cell.v;
        const firstCellVal = sheet[XLSX.utils.encode_cell({ r: R, c: 0 })]?.v;

        if (!isSecundaria && R < encabezado.length && C === 0) { cell.s = R === 0 ? STYLES.headerTitle : STYLES.headerInfo; continue; }

        if (typeof val === "string" && (
          val === "LISTADO DE IMPRESORAS" ||
          val === "DETALLES DE CAMBIOS DE MÁQUINA" ||
          val === "DETALLES POR DISPOSITIVO Y USUARIO" ||
          val.startsWith("1. DETALLE DE IMPRESIONES") ||
          val.startsWith("2. DETALLE DE RENTA") ||
          val.startsWith("3. RESUMEN FINAL")
        )) {
          cell.s = STYLES.sectionHeader;
          const mergeEndCol = val === "LISTADO DE IMPRESORAS" ? 6 : val === "DETALLES POR DISPOSITIVO Y USUARIO" ? 8 : 2;
          for (let mergeC = range.s.c; mergeC <= mergeEndCol; ++mergeC) {
            const mergeCellAddr = XLSX.utils.encode_cell({ r: R, c: mergeC });
            if (!sheet[mergeCellAddr]) sheet[mergeCellAddr] = { v: "", t: "s" };
            sheet[mergeCellAddr].s = STYLES.sectionHeader;
          }
          if (!sheet["!merges"]) sheet["!merges"] = [];
          sheet["!merges"].push({ s: { r: R, c: range.s.c }, e: { r: R, c: mergeEndCol } });
          continue;
        }

        if (typeof firstCellVal === "string" && (firstCellVal === "Impresora" || firstCellVal === "CONCEPTO" || firstCellVal === "EQUIPO" || firstCellVal === "DETALLE" || firstCellVal === "CUENTA ID")) {
          cell.s = STYLES.tableHeader; continue;
        }

        if (typeof val === "string" && (val.includes(" - Serie: ") || val.startsWith("Cambio en Área:"))) {
          cell.s = STYLES.deviceHeader;
          const endMerge = val.startsWith("Cambio") ? 2 : 8;
          for (let mergeC = range.s.c; mergeC <= endMerge; ++mergeC) {
            const mergeCellAddr = XLSX.utils.encode_cell({ r: R, c: mergeC });
            if (!sheet[mergeCellAddr]) sheet[mergeCellAddr] = { v: "", t: "s" };
            sheet[mergeCellAddr].s = STYLES.deviceHeader;
          }
          if (!sheet["!merges"]) sheet["!merges"] = [];
          sheet["!merges"].push({ s: { r: R, c: range.s.c }, e: { r: R, c: endMerge } });
          continue;
        }

        if ((typeof val === "string" && val.includes("Subtotal:")) || firstCellVal === "Subtotal:" || String(firstCellVal).includes("TOTAL GENERAL") || firstCellVal === "SUBTOTAL IMPRESIONES" || firstCellVal === "SUBTOTAL RENTA" || firstCellVal === "TOTAL" || String(firstCellVal).includes("Subtotal Renta") || String(firstCellVal).includes("Subtotal Impresiones")) {
          cell.s = String(firstCellVal).includes("TOTAL GENERAL") ? STYLES.totalFinal : STYLES.subtotalRow;
          if (typeof val === "number") {
            cell.z = (C === 2 && firstCellVal !== "SUBTOTAL") ? "$ #,##0.00" : "#,##0";
          }
          continue;
        }

        if (typeof val === "number") {
          cell.s = STYLES.cellNumber;
          cell.z = (C === 2 && firstCellVal && typeof firstCellVal === "string" && !firstCellVal.includes("Consumo Total Mes") && !firstCellVal.includes("CUENTA ID")) ? "$ #,##0.00" : "#,##0";
        } else {
          cell.s = STYLES.cellData;
          if (val === "CAMBIO") cell.s = { ...STYLES.cellData, font: { bold: true, color: { rgb: "C80000" } }, alignment: { horizontal: "center", vertical: "center" } };
          if (C === 1 && typeof firstCellVal === "string" && firstCellVal.includes("Consumo Total Mes")) cell.s = { ...STYLES.cellData, alignment: { horizontal: "center", vertical: "center" } };
        }
      }
    }
  };

  applyStylesToWs(ws, false);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte");

  if (filasTransacciones.length > 0) {
    while (filasTransacciones[0] && filasTransacciones[0][0] === "") filasTransacciones.shift();

    const ws2 = XLSX.utils.aoa_to_sheet(filasTransacciones);
    ws2["!cols"] = [{ wch: 15 }, { wch: 45 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    applyStylesToWs(ws2, true);
    XLSX.utils.book_append_sheet(wb, ws2, "Detalles por Dispositivo");
  }

  XLSX.writeFile(wb, `Reporte_${cliente?.nombre || "Cliente"}_${periodo}.xlsx`);
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

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}
function calcularConsumosReales(data: MaquinaConsolidada[], todoComoColor: boolean) {
  let consumoBN = 0;
  let consumoColor = 0;
  let consumoTotal = 0;

  data.forEach(maquina => {
    let mConsumoBN = 0;
    let mConsumoColor = 0;
    let mConsumoTotal = 0;

    if (maquina.cambio) {
      // Reemplazo: el backend ya suma el tramo de la saliente y el de la entrante
      mConsumoBN = maquina.consumo.total_bn || 0;
      mConsumoColor = maquina.consumo.total_color || 0;
      mConsumoTotal = mConsumoBN + mConsumoColor;

      if (todoComoColor && maquina.info.es_color) {
        mConsumoColor = mConsumoBN + mConsumoColor;
        mConsumoBN = 0;
      }
    } else {
      mConsumoTotal = (maquina.consumo.total_bn || 0) + (maquina.consumo.total_color || 0);
      mConsumoBN = maquina.consumo.total_bn || 0;
      mConsumoColor = maquina.consumo.total_color || 0;

      if (todoComoColor && maquina.info.es_color) {
        mConsumoColor = mConsumoBN + mConsumoColor;
        mConsumoBN = 0;
      }
    }

    consumoBN += mConsumoBN;
    consumoColor += mConsumoColor;
    consumoTotal += mConsumoTotal;
  });

  return { consumoBN, consumoColor, consumoTotal };
}

function buildFacturacionData(data: MaquinaConsolidada[], cliente: ClienteParaTabla | undefined, extraData?: ExportExtraData) {
  const printerBill = extraData?.printerBill || 'Diferenciar B/N de Color';
  const todoComoColor = printerBill === 'Todo como Color';

  const { consumoBN: consumoTotalBN, consumoColor: consumoTotalColor, consumoTotal } = calcularConsumosReales(data, todoComoColor);

  const contratoCopiaBN = cliente?.impresiones_bn_incluidas || 0;
  const contratoCopiaColor = cliente?.impresiones_color_incluidas || 0;
  const costoExcedenteCopiaBN = parseFloat(String(cliente?.costo_x_excedente_impresion_bn || 0));
  const costoExcedenteCopiaColor = parseFloat(String(cliente?.costo_x_excedente_impresion_color || 0));
  const costoNormalBN = parseFloat(String(cliente?.costo_impresion_bn || 0));
  const costoNormalColor = parseFloat(String(cliente?.costo_impresion_color || 0));

  const esModeloB = contratoCopiaBN === 0 && contratoCopiaColor === 0;

  let impresionesRows: any[] = [];
  let subtotalImpresiones = 0;
  let montoTotalBN = 0;
  let montoTotalColor = 0;

  impresionesRows.push(["Consumo Total Mes", "", consumoTotal]);

  if (esModeloB) {
    montoTotalBN = consumoTotalBN * costoNormalBN;
    montoTotalColor = consumoTotalColor * costoNormalColor;
    if (consumoTotalBN > 0) impresionesRows.push([`Facturación B/N (Por consumo)`, `(${formatNumber(consumoTotalBN)} × $${costoNormalBN.toFixed(4)})`, montoTotalBN]);
    if (consumoTotalColor > 0) impresionesRows.push([`Facturación Color (Por consumo)`, `(${formatNumber(consumoTotalColor)} × $${costoNormalColor.toFixed(4)})`, montoTotalColor]);
    subtotalImpresiones = montoTotalBN + montoTotalColor;
  } else {
    if (contratoCopiaBN > 0) {
      const excedenteBN = Math.max(0, consumoTotalBN - contratoCopiaBN);
      const montoBaseBN = contratoCopiaBN * costoNormalBN;
      const montoExcedenteBN = excedenteBN * costoExcedenteCopiaBN;
      montoTotalBN = montoBaseBN + montoExcedenteBN;

      impresionesRows.push([`Mínimo Garantizado B/N`, `(${formatNumber(contratoCopiaBN)} × $${costoNormalBN.toFixed(4)})`, montoBaseBN]);
      if (excedenteBN > 0) impresionesRows.push([`Excedente B/N`, `(${formatNumber(excedenteBN)} × $${costoExcedenteCopiaBN.toFixed(4)})`, montoExcedenteBN]);
    }

    if (contratoCopiaColor > 0) {
      const excedenteColor = Math.max(0, consumoTotalColor - contratoCopiaColor);
      const montoBaseColor = contratoCopiaColor * costoNormalColor;
      const montoExcedenteColor = excedenteColor * costoExcedenteCopiaColor;
      montoTotalColor = montoBaseColor + montoExcedenteColor;

      impresionesRows.push([`Mínimo Garantizado Color`, `(${formatNumber(contratoCopiaColor)} × $${costoNormalColor.toFixed(4)})`, montoBaseColor]);
      if (excedenteColor > 0) impresionesRows.push([`Excedente Color`, `(${formatNumber(excedenteColor)} × $${costoExcedenteCopiaColor.toFixed(4)})`, montoExcedenteColor]);
    }
    subtotalImpresiones = montoTotalBN + montoTotalColor;
  }

  impresionesRows.push(["SUBTOTAL IMPRESIONES", "", subtotalImpresiones]);

  let rentasRows: any[] = [];
  let subtotalRentas = extraData?.totalRenta || 0;

  if (extraData && extraData.rentaEquipos && extraData.rentaEquipos.length > 0) {
    extraData.rentaEquipos.forEach(r => {
      rentasRows.push([`${r.modelo} (Serie: ${r.serie})`, "", r.costo_mensual]);
    });
    rentasRows.push(["SUBTOTAL RENTA", "", subtotalRentas]);
  }

  let resumenRows: any[] = [];
  resumenRows.push(["Subtotal Impresiones y Excedentes", "", subtotalImpresiones]);
  if (subtotalRentas > 0) {
    resumenRows.push(["Subtotal Renta de Equipos", "", subtotalRentas]);
  }
  resumenRows.push(["TOTAL GENERAL A FACTURAR", "", subtotalImpresiones + subtotalRentas]);

  return {
    impresiones: impresionesRows,
    rentas: rentasRows,
    resumen: resumenRows,
    tieneRentas: rentasRows.length > 0
  };
}
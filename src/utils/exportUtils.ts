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
      consRow = finNueva - inicioNueva;
      const consumoSaliente = m.cambio.maquina_saliente?.contadores?.consumo?.global || 0;
      consReal = consumoSaliente + consRow;
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
        filasTransacciones.push([u.id, u.nombre, u.total_copias + u.total_impresiones, u.total_impresiones, u.total_copias, u.print_bn, u.print_color, u.copia_bn, u.copia_color]);
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

export const exportToPDF = (
  data: MaquinaConsolidada[],
  cliente: ClienteParaTabla | undefined,
  periodo: string,
  transacciones?: DetalleTransaccion[],
  extraData?: ExportExtraData
) => {
  if (!data || data.length === 0) return;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("REPORTE DE IMPRESORAS", 14, 15);
  doc.setFontSize(10);
  doc.text(`Cliente: ${cliente?.nombre || ""}`, 14, 25);
  doc.text(`Inicio del Periodo: ${extraData?.fechaInicio || "N/A"}`, 14, 30);
  doc.text(`Fin del Periodo: ${extraData?.fechaFin || "N/A"}`, 14, 35);

  doc.setFontSize(11);
  doc.text("LISTADO DE IMPRESORAS", 14, 45);
  let totalConsumoReal = 0;
  const body = data.map((m) => {
    let ant = 0, act = 0, consRow = 0;
    if (m.cambio) {
      ant = m.cambio.maquina_entrante?.contadores?.anterior?.global || 0;
      act = (m.actual.total_contador_bn || 0) + (m.actual.total_contador_color || 0);
      consRow = act - ant;
      totalConsumoReal += (m.cambio.maquina_saliente?.contadores?.consumo?.global || 0) + consRow;
    } else {
      ant = (m.anterior.total_contador_bn || 0) + (m.anterior.total_contador_color || 0);
      act = (m.actual.total_contador_bn || 0) + (m.actual.total_contador_color || 0);
      consRow = (m.consumo.total_bn || 0) + (m.consumo.total_color || 0);
      totalConsumoReal += consRow;
    }
    return [m.info.modelo || "", m.info.ip || "", m.info.area || "", m.info.serie || "", formatNumber(ant), formatNumber(act), formatNumber(consRow)];
  });
  body.push(["", "", "", "", "", "TOTAL", formatNumber(totalConsumoReal)]);

  autoTable(doc, {
    startY: 50,
    head: [["Impresora", "IP", "Área", "Serie", "Contador Anterior", "Contador Actual", "Consumo Mes"]],
    body: body,
    theme: "grid",
    headStyles: { fillColor: [50, 50, 50], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: { 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 15;

  const factDatos = buildFacturacionData(data, cliente, extraData);

  const applyFacturacionStyles = (d: any) => {
    if (d.section === "body") {
      const text = String(d.row.raw[0]);
      if (text.includes("SUBTOTAL") || text.includes("Subtotal:") || text.includes("Subtotal ") || text.includes("TOTAL GENERAL") || text.includes("TOTAL")) {
        d.cell.styles.fontStyle = "bold";
        d.cell.styles.fillColor = [235, 235, 235];
      }
    }
  };

  const formatearMontoPDF = (fila: any[]) => {
    let val = fila[2];
    if (typeof val === 'number') {
      if (String(fila[0]).includes("Consumo Total Mes")) {
        val = formatNumber(val);
      } else {
        val = `$ ${val.toFixed(2)}`;
      }
    }
    return [fila[0], fila[1], val];
  };

  if (currentY + 40 > doc.internal.pageSize.height) { doc.addPage(); currentY = 20; }
  doc.setFontSize(11);
  doc.text("1. DETALLE DE IMPRESIONES Y EXCEDENTES", 14, currentY);
  currentY += 5;
  const bodyImp = factDatos.impresiones.map(formatearMontoPDF);
  autoTable(doc, {
    startY: currentY,
    head: [["CONCEPTO", "DETALLE", "MONTO"]],
    body: bodyImp,
    theme: "grid",
    headStyles: { fillColor: [50, 50, 50], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 40, halign: 'center' }, 2: { halign: 'right' } },
    didParseCell: applyFacturacionStyles
  });
  currentY = (doc as any).lastAutoTable.finalY + 15;

  if (factDatos.tieneRentas) {
    if (currentY + 40 > doc.internal.pageSize.height) { doc.addPage(); currentY = 20; }
    doc.setFontSize(11);
    doc.text("2. DETALLE DE RENTA DE EQUIPOS", 14, currentY);
    currentY += 5;
    const bodyRentas = factDatos.rentas.map(formatearMontoPDF);
    autoTable(doc, {
      startY: currentY,
      head: [["EQUIPO", "", "MONTO"]],
      body: bodyRentas,
      theme: "grid",
      headStyles: { fillColor: [50, 50, 50], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 40 }, 2: { halign: 'right' } },
      didParseCell: applyFacturacionStyles
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  if (currentY + 40 > doc.internal.pageSize.height) { doc.addPage(); currentY = 20; }
  doc.setFontSize(11);
  doc.text("3. RESUMEN FINAL A FACTURAR", 14, currentY);
  currentY += 5;
  const bodyResumen = factDatos.resumen.map(formatearMontoPDF);
  autoTable(doc, {
    startY: currentY,
    head: [["CONCEPTO", "", "MONTO"]],
    body: bodyResumen,
    theme: "grid",
    headStyles: { fillColor: [50, 50, 50], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 40 }, 2: { halign: 'right', fontStyle: 'bold' } },
    didParseCell: applyFacturacionStyles
  });
  currentY = (doc as any).lastAutoTable.finalY + 15;

  if (transacciones && transacciones.length > 0) {
    if (currentY + 20 > doc.internal.pageSize.height) { doc.addPage(); currentY = 20; }
    doc.setFontSize(12);
    doc.text("DETALLES POR DISPOSITIVO Y USUARIO", 14, currentY);
    currentY += 10;

    const tXMaquina = transacciones.reduce((acc, t) => {
      const key = t.maquina.ip;
      if (!acc[key]) acc[key] = { maquina: t.maquina, transacciones: [] };
      acc[key].transacciones.push(t);
      return acc;
    }, {} as Record<string, any>);

    Object.entries(tXMaquina).forEach(([_ip, { maquina, transacciones: trans }]) => {
      if (currentY + 35 > doc.internal.pageSize.height) { doc.addPage(); currentY = 20; }
      doc.setFontSize(10);

      const fechaTomaRow = trans.length > 0 ? trans[0].transaccion.fecha : null;
      let fechaTomaFormat = "N/A";
      if (fechaTomaRow) {
        const dStr = typeof fechaTomaRow === 'string' ? fechaTomaRow : (fechaTomaRow as Date).toISOString();
        fechaTomaFormat = dStr.substring(0, 16).replace('T', ' ').replace(/-/g, '/');
      }

      doc.text(`${maquina.area || "Desconocido"} - ${maquina.modelo || "Desconocido"} - Serie: ${maquina.serie || "N/A"} - IP ${maquina.ip} - Tomado el: ${fechaTomaFormat}`, 14, currentY);
      currentY += 5;

      const totalesU = trans.reduce((acc: any, t: DetalleTransaccion) => {
        const uid = t.usuario.id || "N/A";
        if (!acc[uid]) acc[uid] = { id: t.usuario.id, nombre: t.usuario.nombre || "", lastDate: t.transaccion.fecha, tc: 0, ti: 0, cbn: 0, cc: 0, pbn: 0, pc: 0 };
        acc[uid].tc += t.contadores.copia_bn + t.contadores.copia_color;
        acc[uid].ti += t.contadores.print_bn + t.contadores.print_color;
        acc[uid].cbn += t.contadores.copia_bn; acc[uid].cc += t.contadores.copia_color;
        acc[uid].pbn += t.contadores.print_bn; acc[uid].pc += t.contadores.print_color;
        if (new Date(t.transaccion.fecha) > new Date(acc[uid].lastDate)) acc[uid].lastDate = t.transaccion.fecha;
        return acc;
      }, {});

      const bodyD = Object.values(totalesU).map((u: any) => [
        u.id, u.nombre, u.tc + u.ti, u.ti, u.tc, u.cbn, u.cc, u.pbn, u.pc
      ]);
      const tm = Object.values(totalesU).reduce((acc: any, t: any) => ({ tc: acc.tc + t.tc, ti: acc.ti + t.ti, cbn: acc.cbn + t.cbn, cc: acc.cc + t.cc, pbn: acc.pbn + t.pbn, pc: acc.pc + t.pc }), { tc: 0, ti: 0, cbn: 0, cc: 0, pbn: 0, pc: 0 }) as any;
      bodyD.push(["Subtotal:", "", tm.tc + tm.ti, tm.ti, tm.tc, tm.cbn, tm.cc, tm.pbn, tm.pc]);

      autoTable(doc, {
        startY: currentY,
        head: [["CUENTA ID", "NOMBRE", "TOTAL", "IMPRIMIR", "COPIA", "COPIA B/N", "COPIA COLOR", "IMPRIMIR B/N", "IMPRIMIR COLOR"]],
        body: bodyD,
        theme: "grid",
        headStyles: { fillColor: [50, 50, 50], textColor: 255 },
        styles: { fontSize: 7, cellPadding: 1 },
        columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "right" }, 8: { halign: "right" } },
        didParseCell: (d) => { if (d.section === "body" && d.row.raw && (d.row.raw as any)[0] === "Subtotal:") { d.cell.styles.fillColor = [220, 220, 220]; d.cell.styles.fontStyle = "bold"; } },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    });
  }

  doc.save(`Reporte_${cliente?.nombre || "Cliente"}_${periodo}.pdf`);
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
      const consumoSalienteBN = maquina.cambio.maquina_saliente?.contadores?.consumo?.total_bn || 0;
      const consumoSalienteColor = maquina.cambio.maquina_saliente?.contadores?.consumo?.total_color || 0;

      const restBN = maquina.info.es_acumulativo !== false ? (maquina.cambio.maquina_entrante?.contadores?.anterior?.impresion_bn || 0) : 0;
      const restColor = maquina.info.es_acumulativo !== false ? (maquina.cambio.maquina_entrante?.contadores?.anterior?.impresion_color || 0) : 0;

      const consumoEntranteBN = Math.max(0, (maquina.actual.imp_bn || 0) - restBN);
      const consumoEntranteColor = Math.max(0, (maquina.actual.imp_color || 0) - restColor);

      mConsumoBN = consumoSalienteBN + consumoEntranteBN;
      mConsumoColor = consumoSalienteColor + consumoEntranteColor;
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
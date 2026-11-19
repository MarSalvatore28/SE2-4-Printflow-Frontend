import { FiltrosBusqueda } from '@app/Informes/components/FiltrosBusqueda';
import { useInformes } from '@hooks/useInformes';
import { TablaDetalleConsolidado } from '@app/Clientes/components/TablaDetalleConsolidado';
import { TablaDetalleUsuario } from '@app/Informes/components/TablaDetalleUsuario';
import { AlertaHistorialCliente } from '@app/Informes/components/Alertahistorialcliente';
import { ResumenConsolidadoCard } from '@app/Informes/components/ResumenConsolidadoCard';
import { FacturacionPeriodoCard } from '@app/Informes/components/FacturacionPeriodoCard';
import { exportToExcel, exportToPDF } from '@utils/exportUtils';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const InformesPage = () => {
    const {
        clientes,
        maquinas,
        selectedCliente,
        setSelectedCliente,
        selectedMaquina,
        setSelectedMaquina,
        selectedArea,
        setSelectedArea,
        selectedMes,
        setSelectedMes,
        selectedAño,
        setSelectedAño,
        reportes,
        resumen,
        loading,
        error,
        vistaActual,
        meses,
        años,
        handleLimpiarFiltros,
        filtrosCompletos,
        transacciones,
        generadoEn,
    } = useInformes();

    const clienteActual = clientes.find(c => c.id_cliente === selectedCliente);

    // Configuración de facturación del contrato (la usa el Excel)
    const printerBill = clienteActual?.printer_bill || 'Diferenciar B/N de Color';

    // --- Cálculo de fechas del periodo ---
    // Fecha de inicio del periodo: la fecha más grande entre los contadores del periodo ANTERIOR
    // (fecha_corte_anterior en la data del consolidado)
    const fechaInicioRaw = reportes.length > 0
        ? reportes.reduce((maxFecha, m) => {
            const f = m.info.fecha_corte_anterior;
            if (!f) return maxFecha;
            return (!maxFecha || f > maxFecha) ? f : maxFecha;
        }, null as string | null)
        : null;

    // Fecha de fin del periodo: la fecha más grande entre los conteos del periodo ACTUAL
    // (fecha_corte_actual en la data del consolidado)
    const fechaFinRaw = reportes.length > 0
        ? reportes.reduce((maxFecha, m) => {
            const f = m.info.fecha_corte_actual;
            if (!f) return maxFecha;
            return (!maxFecha || f > maxFecha) ? f : maxFecha;
        }, null as string | null)
        : null;

    const formatFechaCabecera = (fechaStr: string | null): string => {
        if (!fechaStr) return 'N/A';
        const parte = fechaStr.substring(0, 10);
        const [anio, mes, dia] = parte.split('-');
        if (!anio || !mes || !dia) return parte;
        return `${anio}/${mes}/${dia}`;
    };

    const exportParams = {
        printerBill,
        rentaEquipos: resumen?.renta_equipos || [],
        totalRenta: resumen?.total_renta || 0,
        fechaInicio: formatFechaCabecera(fechaInicioRaw),
        fechaFin: formatFechaCabecera(fechaFinRaw)
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de informes</h1>

            <FiltrosBusqueda
                clientes={clientes}
                selectedCliente={selectedCliente}
                onClienteChange={setSelectedCliente}
                meses={meses}
                selectedMes={selectedMes}
                onMesChange={setSelectedMes}
                años={años}
                selectedAño={selectedAño}
                onAñoChange={setSelectedAño}
                maquinas={maquinas}
                selectedMaquina={selectedMaquina}
                onMaquinaChange={setSelectedMaquina}
                selectedArea={selectedArea}
                onAreaChange={setSelectedArea}
                onLimpiarFiltros={handleLimpiarFiltros}
                autoLoad
            />

            {selectedCliente && (
                <AlertaHistorialCliente
                    clienteId={selectedCliente}
                    periodo={selectedMes && selectedAño ? `${selectedAño}-${selectedMes}` : null}
                />
            )}

            {loading && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-3"></div>
                    <span className="font-medium">Cargando consolidado...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}

            {vistaActual === 'consolidado' && !loading && resumen && reportes.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                    <p className="font-semibold">No hay lecturas aprobadas para este cliente en {meses.find(m => m.value === selectedMes)?.label} de {selectedAño}.</p>
                    <p className="text-sm text-gray-500 mt-1">Pruebe con otro período o revise que los lotes del mes estén aprobados.</p>
                </div>
            )}

            {vistaActual === 'consolidado' && !loading && resumen && reportes.length > 0 && (
                <>
                    {/* ===== CABECERA DEL PERIODO ===== */}
                    <div className="mt-6 mb-6 bg-gradient-to-r from-secondary/90 to-secondary rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            {/* Fechas del periodo */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 rounded-lg p-2">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Inicio del periodo</p>
                                        <p className="text-lg font-bold text-white">{formatFechaCabecera(fechaInicioRaw)}</p>
                                    </div>
                                </div>
                                <div className="hidden sm:block text-white/40 text-2xl font-light">→</div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 rounded-lg p-2">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Fin del periodo</p>
                                        <p className="text-lg font-bold text-white">{formatFechaCabecera(fechaFinRaw)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Botones de exportar en cabecera */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => exportToExcel(reportes, clienteActual, `${selectedAño}-${selectedMes}`, transacciones, exportParams)}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
                                    title="Exportar en Excel"
                                >
                                    <FileDownloadIcon fontSize="small" />
                                    Exportar en XLSX
                                </button>
                                <button
                                    onClick={() => exportToPDF(reportes, clienteActual, `${selectedAño}-${selectedMes}`, transacciones, exportParams)}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm"
                                    title="Exportar en PDF"
                                >
                                    <PictureAsPdfIcon fontSize="small" />
                                    Exportar en PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    {generadoEn && (
                        <ResumenConsolidadoCard
                            periodoLabel={`${meses.find(m => m.value === selectedMes)?.label ?? selectedMes} ${selectedAño}`}
                            resumen={resumen}
                            generadoEn={generadoEn}
                        />
                    )}

                    <FacturacionPeriodoCard
                        facturacion={resumen.facturacion}
                        montoTotalGeneral={resumen.monto_total_general}
                    />

                    <div className='mb-4 text-lg font-semibold text-gray-900'>
                        <span className="block h-6">Resumen del consolidado:</span>
                    </div>
                    <TablaDetalleConsolidado data={reportes} />
                    <div className='mt-8 mb-4 text-lg font-semibold text-gray-900'>
                        <span className="block h-6">Detalles por dispositivo y usuario:</span>
                    </div>

                    {transacciones.length > 0 && (
                        <TablaDetalleUsuario
                            data={transacciones}
                            periodo={`${selectedAño}-${selectedMes}`}
                            clienteNombre={clienteActual?.nombre}
                            consolidado={reportes}
                        />
                    )}

                    </>
            )}

            {!filtrosCompletos && (
                <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Selecciona filtros para ver el consolidado</h3>
                    <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                        Para generar un reporte consolidado, selecciona un <strong>Cliente</strong>, <strong>Mes</strong> y <strong>Año</strong>.
                        El consolidado se generará automáticamente.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>La carga es automática, no necesitas presionar ningún botón</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InformesPage;
import React, { useState } from 'react';
import { formatNumber, formatMoney, formatFechaISO } from '@utils/formatUtils';
import type { MaquinaConsolidada, CambioMaquina } from '@models/Reporte/reporte.types';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';

interface TablaDetalleConsolidadoProps {
    data: MaquinaConsolidada[];
}

export const TablaDetalleConsolidado: React.FC<TablaDetalleConsolidadoProps> = ({ data }) => {
    const [modalCambio, setModalCambio] = useState<CambioMaquina | null>(null);

    const maquinas = data;

    // Contadores y consumo de la fila: en un reemplazo, el contador inicial es el de la entrante
    // y el consumo ya suma el tramo de la saliente (hasta el daño) y el de la entrante.
    const contadoresDe = (maquina: MaquinaConsolidada) => {
        if (maquina.cambio) {
            return {
                anterior: maquina.cambio.maquina_entrante.contadores.anterior.global || 0,
                actual: (maquina.actual.total_contador_bn || 0) + (maquina.actual.total_contador_color || 0),
            };
        }
        // Se suman los contadores para evitar el 0 que manda el backend en total_servicio de no acumulativos
        return {
            anterior: ((maquina.anterior.total_contador_bn || 0) + (maquina.anterior.total_contador_color || 0)) || maquina.anterior.total_servicio || 0,
            actual: ((maquina.actual.total_contador_bn || 0) + (maquina.actual.total_contador_color || 0)) || maquina.actual.total_servicio || 0,
        };
    };

    // Páginas B/N, color e importe de cada máquina, tal como los calcula el consolidado del backend.
    const importeDe = (maquina: MaquinaConsolidada) => parseFloat(maquina.financiero?.monto_total ?? '0') || 0;
    const totalesGenerales = maquinas.reduce((acc, maquina) => {
        const { anterior, actual } = contadoresDe(maquina);
        return {
            anterior: acc.anterior + anterior,
            actual: acc.actual + actual,
            consumo: acc.consumo + (maquina.consumo.total_bn || 0) + (maquina.consumo.total_color || 0),
        };
    }, { anterior: 0, actual: 0, consumo: 0 });
    const totalesPorMaquina = maquinas.reduce((acc, maquina) => ({
        bn: acc.bn + (maquina.consumo.total_bn || 0),
        color: acc.color + (maquina.consumo.total_color || 0),
        importe: acc.importe + importeDe(maquina),
    }), { bn: 0, color: 0, importe: 0 });

    const abrirModalCambio = (cambio: CambioMaquina) => { setModalCambio(cambio); };
    const cerrarModal = () => setModalCambio(null);

    return (
        <div className="space-y-6 mt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 bg-secondary/90 flex justify-between items-center border-b border-gray-200">
                    <h3 className="text-base font-bold text-white uppercase">Listado de impresoras</h3>
                    <span className="text-xs text-white bg-edit border border-edit px-2 py-1 rounded">
                        <LocalPrintshopIcon className="inline-block mr-1 mb-0.5" fontSize="small" />
                        {maquinas.length} dispositivos
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table data-testid="tabla-consolidado" className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr className="text-gray-700 uppercase text-xs font-semibold">
                                <th className="px-4 py-2.5 text-left">Impresora</th>
                                <th className="px-4 py-2.5 text-left">IP</th>
                                <th className="px-4 py-2.5 text-left">Área</th>
                                <th className="px-4 py-2.5 text-left">Serie</th>
                                <th className="px-4 py-2.5 text-right">Contador inicial</th>
                                <th className="px-4 py-2.5 text-right">Contador final</th>
                                <th className="px-4 py-2.5 text-right">Páginas B/N</th>
                                <th className="px-4 py-2.5 text-right">Páginas color</th>
                                <th className="px-4 py-2.5 text-right">Consumo Mes</th>
                                <th className="px-4 py-2.5 text-right">Importe</th>
                                <th className="px-4 py-2.5 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {maquinas.map((maquina, idx) => {
                                const { anterior: filaAnt, actual: filaAct } = contadoresDe(maquina);
                                // En un reemplazo: saliente hasta el daño + entrante desde su instalación
                                const filaConsumo = (maquina.consumo.total_bn || 0) + (maquina.consumo.total_color || 0);
                                return (
                                    <tr key={maquina.info.maquina_id || idx} className={`hover:bg-gray-50 ${maquina.cambio ? 'bg-amber-50/30' : ''}`}>
                                        <td className="px-4 py-2.5 font-medium text-gray-900">
                                            {maquina.info.modelo || maquina.info.serie || 'N/A'}
                                            {maquina.info.es_acumulativo === true && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-white">Acumulativo</span>
                                            )}
                                            {maquina.info.es_acumulativo === false && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-600 text-white">No acumulativo</span>
                                            )}
                                            {maquina.info.es_color ? (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-white">BN/C</span>
                                            ) : (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-500 text-white">BN</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{maquina.info.ip}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{maquina.info.area}</td>
                                        <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{maquina.info.serie}</td>
                                        <td className="px-4 py-2.5 text-right text-gray-700 font-mono">{formatNumber(filaAnt)}</td>
                                        <td className="px-4 py-2.5 text-right text-gray-900 font-mono">{formatNumber(filaAct)}</td>
                                        <td className="px-4 py-2.5 text-right text-gray-800 font-mono">{formatNumber(maquina.consumo.total_bn)}</td>
                                        <td className="px-4 py-2.5 text-right text-gray-800 font-mono">{formatNumber(maquina.consumo.total_color)}</td>
                                        <td className="px-4 py-2.5 text-right font-bold text-text font-mono">{formatNumber(filaConsumo)}</td>
                                        <td className="px-4 py-2.5 text-right text-gray-900 font-mono">$ {formatMoney(importeDe(maquina))}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            {maquina.cambio ? (
                                                <button onClick={() => abrirModalCambio(maquina.cambio!)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full text-amber-800 text-xs font-semibold transition-colors cursor-pointer">
                                                    <SwapHorizIcon fontSize="small" className="text-amber-600" />Cambio<InfoOutlinedIcon fontSize="small" className="text-amber-600" />
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 bg-green-100 border border-green-300 rounded-full text-green-700 text-xs font-medium">Sin cambios</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t-2 border-b-2 border-gray-300">
                            <tr className="font-bold text-gray-800">
                                <td colSpan={4} className="px-4 py-3 text-right uppercase text-sm">Totales generales:</td>
                                <td className="px-4 py-3 text-right font-mono">{formatNumber(totalesGenerales.anterior)}</td>
                                <td className="px-4 py-3 text-right font-mono">{formatNumber(totalesGenerales.actual)}</td>
                                <td className="px-4 py-3 text-right font-mono">{formatNumber(totalesPorMaquina.bn)}</td>
                                <td className="px-4 py-3 text-right font-mono">{formatNumber(totalesPorMaquina.color)}</td>
                                <td className="px-4 py-3 text-right text-text font-mono">{formatNumber(totalesGenerales.consumo)}</td>
                                <td className="px-4 py-3 text-right font-mono">$ {formatMoney(totalesPorMaquina.importe)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {modalCambio && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-primary px-6 py-4 flex justify-between items-center border-b border-amber-700">
                            <div className="flex items-center gap-3">
                                <SwapHorizIcon className="text-white" fontSize="large" />
                                <h2 className="text-xl font-bold text-white">Detalle del cambio de máquina</h2>
                            </div>
                            <button onClick={cerrarModal} className="text-white hover:bg-amber-700 rounded-full p-2 transition-colors"><CloseIcon /></button>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-b">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div><p className="text-xs text-gray-500 uppercase font-semibold">Tipo</p><p className="text-sm font-medium text-gray-900">{modalCambio.tipo}</p></div>
                                <div><p className="text-xs text-gray-500 uppercase font-semibold">Área</p><p className="text-sm font-medium text-gray-900">{modalCambio.area}</p></div>
                                <div><p className="text-xs text-gray-500 uppercase font-semibold">Periodo</p><p className="text-sm font-medium text-gray-900">{modalCambio.periodo}</p></div>
                                <div><p className="text-xs text-gray-500 uppercase font-semibold">Total consolidado</p><p className="text-lg font-bold text-primary">{formatNumber(modalCambio.totales.consumo_total)}</p></div>
                            </div>
                            {modalCambio.razon && (
                                <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded">
                                    <p className="text-xs text-amber-700 uppercase font-semibold mb-1">Razón del cambio</p>
                                    <p className="text-sm text-amber-900">{modalCambio.razon}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="border-2 rounded-lg overflow-hidden">
                                    <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                                        <h3 className="font-bold text-red-800 flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-full"></span>Máquina saliente (retirada)</h3>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div><p className="text-xs text-gray-500 uppercase">Serie</p><p className="font-mono font-bold text-gray-900">{modalCambio.maquina_saliente.serie}</p></div>
                                        <div><p className="text-xs text-gray-500 uppercase">Modelo</p><p className="font-medium text-gray-700">{modalCambio.maquina_saliente.modelo}</p></div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div><p className="text-xs text-gray-500">Desde (último corte)</p><p className="font-medium">{formatFechaISO(modalCambio.maquina_saliente.fecha_inicio_operacion)}</p></div>
                                            <div><p className="text-xs text-gray-500">Retirada</p><p className="font-medium text-red-600">{formatFechaISO(modalCambio.maquina_saliente.fecha_retiro)}</p></div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded"><p className="text-xs text-gray-500 uppercase mb-2">Días operativos</p><p className="text-2xl font-bold text-gray-900">{modalCambio.totales.dias_saliente} días</p></div>
                                        <div className="border-t pt-3 space-y-2">
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Contadores</p>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between"><span className="text-gray-600">Anterior:</span><span className="font-mono">{formatNumber(modalCambio.maquina_saliente.contadores.anterior.global)}</span></div>
                                                <div className="flex justify-between"><span className="text-gray-600">Final:</span><span className="font-mono font-medium">{formatNumber(modalCambio.maquina_saliente.contadores.actual.global)}</span></div>
                                                <div className="flex justify-between pt-2 border-t-2 border-red-200"><span className="font-bold text-gray-900">Consumo parcial:</span><span className="font-mono font-bold text-red-600 text-lg">{formatNumber(modalCambio.maquina_saliente.contadores.consumo.global)}</span></div>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded text-xs">
                                            <p className="font-semibold text-gray-700 mb-2">Desglose:</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><p className="text-gray-600">BN:</p><p className="font-mono font-bold">{formatNumber(modalCambio.maquina_saliente.contadores.consumo.total_bn)}</p></div>
                                                <div><p className="text-gray-600">Color:</p><p className="font-mono font-bold">{formatNumber(modalCambio.maquina_saliente.contadores.consumo.total_color)}</p></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-2 rounded-lg overflow-hidden">
                                    <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                                        <h3 className="font-bold text-green-800 flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full"></span>Máquina entrante (reemplazo)</h3>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div><p className="text-xs text-gray-500 uppercase">Serie</p><p className="font-mono font-bold text-gray-900">{modalCambio.maquina_entrante.serie}</p></div>
                                        <div><p className="text-xs text-gray-500 uppercase">Modelo</p><p className="font-medium text-gray-700">{modalCambio.maquina_entrante.modelo}</p></div>
                                        <div className="flex justify-between gap-4 border-y border-gray-100 py-2 my-2">
                                            <div className="text-sm"><p className="text-xs text-gray-500">Instalada</p><p className="font-medium text-green-600">{formatFechaISO(modalCambio.maquina_entrante.fecha_instalacion)}</p></div>
                                            <div className="text-sm text-right"><p className="text-xs text-gray-500">Fecha de corte</p><p className="font-medium text-green-600">{formatFechaISO(modalCambio.maquina_entrante.fecha_fin_operacion)}</p></div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded"><p className="text-xs text-gray-500 uppercase mb-2">Días operativos</p><p className="text-2xl font-bold text-gray-900">{modalCambio.totales.dias_entrante} días</p></div>
                                        <div className="border-t pt-3 space-y-2">
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Contadores</p>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between"><span className="text-gray-600">Inicial:</span><span className="font-mono">{formatNumber(modalCambio.maquina_entrante.contadores.anterior.global)}</span></div>
                                                <div className="flex justify-between"><span className="text-gray-600">Final:</span><span className="font-mono font-medium">{formatNumber(modalCambio.maquina_entrante.contadores.actual.global)}</span></div>
                                                <div className="flex justify-between pt-2 border-t-2 border-green-200"><span className="font-bold text-gray-900">Consumo parcial:</span><span className="font-mono font-bold text-green-600 text-lg">{formatNumber(modalCambio.maquina_entrante.contadores.consumo.global)}</span></div>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded text-xs">
                                            <p className="font-semibold text-gray-700 mb-2">Desglose:</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div><p className="text-gray-600">BN:</p><p className="font-mono font-bold">{formatNumber(modalCambio.maquina_entrante.contadores.consumo.total_bn)}</p></div>
                                                <div><p className="text-gray-600">Color:</p><p className="font-mono font-bold">{formatNumber(modalCambio.maquina_entrante.contadores.consumo.total_color)}</p></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                            <button onClick={cerrarModal} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {data.length === 0 && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 font-medium">No hay datos disponibles para este periodo</p>
                </div>
            )}
        </div>
    );
};
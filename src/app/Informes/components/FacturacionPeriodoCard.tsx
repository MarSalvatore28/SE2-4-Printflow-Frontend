import React from 'react';
import { formatNumber, formatMoney } from '@utils/formatUtils';
import { aMonto, MENSAJE_IMPORTE_PENDIENTE } from '@utils/facturacionUtils';
import type { FacturacionContrato, FacturacionTramo } from '@models/Reporte/reporte.types';

interface FacturacionPeriodoCardProps {
    /** `resumen.facturacion` del consolidado: un elemento por contrato. */
    facturacion?: FacturacionContrato[];
    /** `resumen.monto_total_general`: suma de los totales de los contratos. */
    montoTotalGeneral: number | string;
}

const dinero = (valor: string | number | undefined) => `$ ${formatMoney(aMonto(valor))}`;

const FilaTramo: React.FC<{ tipo: string; tramo: FacturacionTramo }> = ({ tipo, tramo }) => (
    <tr>
        <td className="px-4 py-2 font-medium text-gray-800">{tipo}</td>
        <td className="px-4 py-2 text-right font-mono">{formatNumber(tramo.consumo)}</td>
        <td className="px-4 py-2 text-right font-mono">{formatNumber(tramo.incluidas)}</td>
        <td className="px-4 py-2 text-right font-mono">{formatNumber(tramo.excedente)}</td>
        <td className="px-4 py-2 text-right font-mono">{dinero(tramo.cuota_fija)}</td>
        <td className="px-4 py-2 text-right font-mono">{dinero(tramo.monto_excedente)}</td>
    </tr>
);

// Importe del período tal como lo calcula el backend: cuota fija + excedente por contrato, más la renta.
export const FacturacionPeriodoCard: React.FC<FacturacionPeriodoCardProps> = ({ facturacion, montoTotalGeneral }) => {
    const contratos = facturacion ?? [];

    if (contratos.length === 0) {
        return (
            <div data-testid="facturacion-pendiente" className="mb-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-4">
                <h3 className="text-base font-semibold text-gray-800">Facturación del período</h3>
                <p className="mt-1 text-sm text-gray-600">{MENSAJE_IMPORTE_PENDIENTE}.</p>
            </div>
        );
    }

    return (
        <div data-testid="facturacion-periodo" className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                <h3 className="text-base font-semibold text-gray-800">Facturación del período</h3>
                <p className="text-xs text-gray-500">Cuota fija de las páginas incluidas más el excedente, por contrato.</p>
            </div>

            {contratos.map((c) => (
                <div key={c.contrato_id} data-testid={`facturacion-contrato-${c.contrato_id}`} className="border-b border-gray-200 last:border-b-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-3">
                        <p className="text-sm font-semibold text-gray-700">Contrato #{c.contrato_id}</p>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {c.modo === 'TODO_COLOR' ? 'Todo como color: las páginas B/N cuentan como color' : 'B/N y color por separado'}
                        </span>
                    </div>
                    <div className="overflow-x-auto px-2 pb-3">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-xs font-semibold uppercase text-gray-500">
                                    <th className="px-4 py-2 text-left">Páginas</th>
                                    <th className="px-4 py-2 text-right">Consumo</th>
                                    <th className="px-4 py-2 text-right">Incluidas</th>
                                    <th className="px-4 py-2 text-right">Excedente</th>
                                    <th className="px-4 py-2 text-right">Cuota fija</th>
                                    <th className="px-4 py-2 text-right">Monto del excedente</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                <FilaTramo tipo="B/N" tramo={c.bn} />
                                <FilaTramo tipo="Color" tramo={c.color} />
                            </tbody>
                            <tfoot className="border-t border-gray-200">
                                <tr>
                                    <td colSpan={5} className="px-4 py-2 text-right text-gray-600">Renta de equipos</td>
                                    <td className="px-4 py-2 text-right font-mono">{dinero(c.renta)}</td>
                                </tr>
                                <tr className="font-bold text-gray-900">
                                    <td colSpan={5} className="px-4 py-2 text-right uppercase">Total del contrato</td>
                                    <td data-testid="facturacion-total-contrato" className="px-4 py-2 text-right font-mono text-base">{dinero(c.total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            ))}

            {contratos.length > 1 && (
                <div className="flex justify-end gap-6 bg-gray-50 px-6 py-3 font-bold text-gray-900">
                    <span className="uppercase">Total del período</span>
                    <span data-testid="facturacion-total-periodo" className="font-mono text-lg">{dinero(montoTotalGeneral)}</span>
                </div>
            )}
        </div>
    );
};

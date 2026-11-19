import React from 'react';
import { formatNumber, formatMoney } from '@utils/formatUtils';
import { aMonto, hayFacturacion } from '@utils/facturacionUtils';
import type { ResumenConsolidado } from '@models/Reporte/reporte.types';

interface ResumenConsolidadoProps {
    periodoLabel: string;
    resumen: ResumenConsolidado;
    generadoEn: Date;
}

const formatoGeneracion = new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
});

// Totales del período tal como los devuelve el consolidado del backend.
export const ResumenConsolidadoCard: React.FC<ResumenConsolidadoProps> = ({
    periodoLabel,
    resumen,
    generadoEn
}) => {
    const tarjetas = [
        { titulo: 'Páginas B/N', valor: formatNumber(resumen.total_bn), color: 'text-gray-800' },
        { titulo: 'Páginas color', valor: formatNumber(resumen.total_color), color: 'text-secondary' },
        { titulo: 'Total de páginas', valor: formatNumber(resumen.total_impresiones), color: 'text-primary' },
        { titulo: 'Importe del período', valor: hayFacturacion(resumen) ? `$ ${formatMoney(aMonto(resumen.monto_total_general))}` : 'Pendiente', color: 'text-green-700' },
        { titulo: 'Máquinas', valor: String(resumen.total_maquinas || 0), color: 'text-edit' }
    ];

    return (
        <div data-testid="resumen-periodo" className="bg-gradient-to-r from-accent/20 to-accent/10 p-6 rounded-lg mb-6 border border-accent">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    Totales del período · {periodoLabel}
                </h3>
                <p className="text-sm text-gray-600">
                    Generado el <span className="font-semibold text-gray-800">{formatoGeneracion.format(generadoEn)}</span>
                </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {tarjetas.map(t => (
                    <div key={t.titulo} className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600">{t.titulo}</p>
                        <p className={`text-2xl font-bold font-mono ${t.color}`}>{t.valor}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

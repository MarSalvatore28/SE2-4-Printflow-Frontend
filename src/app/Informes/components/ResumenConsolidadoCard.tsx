import React from 'react';

interface ResumenConsolidadoProps {
    periodo: string;
    totalImpresiones: number;
    totalFacturado: number;
    cantidadMaquinas: number;
    formatNumber: (value: number | undefined | null) => string;
    formatCurrency: (value: number | undefined | null) => string;
}

export const ResumenConsolidadoCard: React.FC<ResumenConsolidadoProps> = ({
    periodo,
    totalImpresiones,
    totalFacturado,
    cantidadMaquinas,
    formatNumber,
    formatCurrency
}) => {
    return (
        <div className="bg-gradient-to-r from-accent/20 to-accent/10 p-6 rounded-lg mb-6 border border-accent">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Resumen Consolidado - {periodo}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Total Impresiones</p>
                    <p className="text-2xl font-bold text-primary">
                        {formatNumber(totalImpresiones)}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Total Facturado</p>
                    <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalFacturado)}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Cantidad de Máquinas</p>
                    <p className="text-2xl font-bold text-purple-600">
                        {cantidadMaquinas || 0}
                    </p>
                </div>
            </div>
        </div>
    );
};
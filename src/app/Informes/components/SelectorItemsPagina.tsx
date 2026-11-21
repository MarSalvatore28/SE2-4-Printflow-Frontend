import React, { useId } from 'react';

interface SelectorItemsPaginaProps {
    itemsPorPagina: number;
    onItemsPorPaginaChange: (value: number) => void;
    opciones?: number[];
}

export const SelectorItemsPagina: React.FC<SelectorItemsPaginaProps> = ({
    itemsPorPagina,
    onItemsPorPaginaChange,
    opciones = [10, 25, 50, 100]
}) => {
    const idSelector = useId();
    return (
        <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <label htmlFor={idSelector} className="text-sm font-medium text-gray-700">
                    Mostrar:
                </label>
                <select
                    id={idSelector}
                    value={itemsPorPagina}
                    onChange={(e) => onItemsPorPaginaChange(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                    {opciones.map((opcion) => (
                        <option key={opcion} value={opcion}>
                            {opcion}
                        </option>
                    ))}
                </select>
                <span className="text-sm text-gray-600">registros por página</span>
            </div>
        </div>
    );
};
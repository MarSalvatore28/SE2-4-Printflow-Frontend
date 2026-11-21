import React from 'react';
import { BuscadorInteligente } from '@components/Shared/BuscadorInteligente';
import { type Area } from '../types';

interface BusquedaInteligenteAreasProps {
    onSeleccionar: (area: Area) => void;
    placeholder?: string;
    className?: string;
    itemsCompletos?: Area[];
    onEnter?: (termino: string) => void;
    onClear?: () => void;
    onInputChange?: (value: string) => void;
    onSearchClick?: (termino: string) => void;
}

export const BusquedaInteligenteAreas: React.FC<BusquedaInteligenteAreasProps> = ({
    onSeleccionar,
    placeholder = "Buscar área por nombre, descripción o cliente...",
    className = "",
    itemsCompletos = [],
    onEnter,
    onClear,
    onInputChange,
    onSearchClick
}) => {
    const buscarLocalmente = (termino: string): Promise<Area[]> => {
        if (!termino) return Promise.resolve(itemsCompletos);
        const term = termino.toLowerCase();
        return Promise.resolve(itemsCompletos.filter(area =>
            area.nombre.toLowerCase().includes(term) ||
            area.cliente_nombre?.toLowerCase().includes(term) ||
            area.descripcion?.toLowerCase().includes(term)
        ));
    };

    return (
        <BuscadorInteligente<Area>
            placeholder={placeholder}
            buscarFn={buscarLocalmente}
            onSeleccionar={onSeleccionar}
            onEnter={onEnter}
            onClear={onClear}
            onInputChange={onInputChange}
            onSearchClick={onSearchClick}
            getItemKey={(a) => a.id_area}
            getItemLabel={(a) => a.nombre}
            itemsCompletos={itemsCompletos}
            className={className}
            renderItem={(area) => (
                <div className="flex flex-col py-1">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 text-sm">
                            {area.nombre}
                        </span>
                        {area.cliente_nombre && (
                            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded font-medium border border-primary">
                                {area.cliente_nombre}
                            </span>
                        )}
                    </div>
                    {area.descripcion && (
                        <span className="text-xs text-gray-500 mt-0.5 truncate italic">
                            {area.descripcion}
                        </span>
                    )}
                </div>
            )}
            minCaracteres={1}
            debounceTime={300}
        />
    );
};

export default BusquedaInteligenteAreas;
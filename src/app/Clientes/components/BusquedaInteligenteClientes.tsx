import React, { useMemo, useCallback } from 'react';
import { BuscadorInteligente } from '@components/Shared/BuscadorInteligente';
import { type ClienteParaTabla } from '../types';
interface BusquedaInteligenteClientesProps {
    onSeleccionar: (cliente: ClienteParaTabla) => void;
    placeholder?: string;
    className?: string;
    itemsCompletos?: ClienteParaTabla[];
    onEnter?: (termino: string) => void;
    onClear?: () => void;
    onInputChange?: (value: string) => void;
    onSearchClick?: (termino: string) => void;
    defaultValue?: string;
    disabled?: boolean;
}

export const BusquedaInteligenteClientes: React.FC<BusquedaInteligenteClientesProps> = ({
    onSeleccionar,
    placeholder = "Buscar cliente por nombre o RUC...",
    className = "",
    itemsCompletos = [],
    onEnter,
    onClear,
    onInputChange,
    onSearchClick,
    defaultValue,
    disabled = false
}) => {
    const itemsUnicos = useMemo(() => {
        const mapa = new Map();
        if (Array.isArray(itemsCompletos)) {
            itemsCompletos.forEach(item => {
                if (item && item.id_cliente && !mapa.has(item.id_cliente)) {
                    mapa.set(item.id_cliente, item);
                }
            });
        }
        return Array.from(mapa.values());
    }, [itemsCompletos]);

    const buscarLocalmente = useCallback(async (term: string): Promise<ClienteParaTabla[]> => {
        if (!term) return itemsUnicos;
        const termLower = term.toLowerCase();
        return itemsUnicos.filter(c =>
            c.nombre.toLowerCase().includes(termLower) ||
            c.ruc?.toLowerCase().includes(termLower) ||
            c.razon_social?.toLowerCase().includes(termLower)
        );
    }, [itemsUnicos]);

    return (
        <BuscadorInteligente<ClienteParaTabla>
            placeholder={placeholder}
            buscarFn={buscarLocalmente}
            onSeleccionar={onSeleccionar}
            onEnter={onEnter}
            onClear={onClear}
            onInputChange={onInputChange}
            onSearchClick={onSearchClick}
            initialValue={defaultValue}

            getItemKey={(c) => c.id_cliente}
            getItemLabel={(c) => c.nombre}

            itemsCompletos={itemsUnicos}

            className={className}
            disabled={disabled}
            renderItem={(cliente) => (
                <div className="flex flex-col py-1">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 text-sm">
                            {cliente.nombre}
                        </span>
                        {cliente.ruc && (
                            <span className="text-xs bg-secondary/90 text-white px-2 py-0.5 rounded font-medium">
                                RUC: {cliente.ruc}
                            </span>
                        )}
                    </div>
                    {(cliente.razon_social && cliente.razon_social !== cliente.nombre) && (
                        <span className="text-xs text-gray-500 mt-0.5 truncate italic">
                            {cliente.razon_social}
                        </span>
                    )}
                </div>
            )}
            minCaracteres={1}
            debounceTime={300}
        />
    );
};

export default BusquedaInteligenteClientes;
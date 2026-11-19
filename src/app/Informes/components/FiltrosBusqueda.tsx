import React, { useState, useEffect, useMemo } from 'react';
import { BuscadorInteligente } from '@components/Shared/BuscadorInteligente';
import type { Maquina } from '@models/Maquina/maquina.types';
import type { Cliente } from '@models/Cliente/cliente.types';
import type { Area } from '@models/Area/area.types';
import { getAreasByCliente } from '@services/Area/area.service';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';

interface FiltrosBusquedaProps {
    clientes: Cliente[];
    selectedCliente: number | null;
    onClienteChange: (value: number | null) => void;
    meses: Array<{ value: string; label: string }>;
    selectedMes: string;
    onMesChange: (value: string) => void;
    años: Array<{ value: string; label: string }>;
    selectedAño: string;
    onAñoChange: (value: string) => void;
    maquinas: Maquina[];
    selectedMaquina: number | null;
    onMaquinaChange: (value: number | null) => void;
    selectedArea?: number | null;
    onAreaChange?: (value: number | null) => void;
    onAplicarFiltros?: () => void;
    onGenerarConsolidado?: () => void;
    onLimpiarFiltros: () => void;

    autoLoad?: boolean;
}

export const FiltrosBusqueda: React.FC<FiltrosBusquedaProps> = ({
    clientes,
    selectedCliente,
    onClienteChange,
    meses,
    selectedMes,
    onMesChange,
    años,
    selectedAño,
    onAñoChange,
    maquinas,
    selectedMaquina,
    onMaquinaChange,
    selectedArea = null,
    onAreaChange,
    onAplicarFiltros,
    onGenerarConsolidado,
    onLimpiarFiltros,

    autoLoad = false
}) => {
    const [areasDisponibles, setAreasDisponibles] = useState<Area[]>([]);
    const [loadingAreas, setLoadingAreas] = useState(false);
    const [selectedMaquinaObj, setSelectedMaquinaObj] = useState<Maquina | null>(null);

    useEffect(() => {
        if (!selectedMaquina) {
            setSelectedMaquinaObj(null);
        }
    }, [selectedMaquina]);

    const clientesUnicos = useMemo(() => {
        const mapa = new Map();
        if (Array.isArray(clientes)) {
            clientes.forEach(c => {
                if (c && c.id_cliente && !mapa.has(c.id_cliente)) {
                    mapa.set(c.id_cliente, c);
                }
            });
        }
        return Array.from(mapa.values());
    }, [clientes]);

    const maquinasUnicas = useMemo(() => {
        const mapa = new Map();
        if (Array.isArray(maquinas)) {
            maquinas.forEach(m => {
                const id = m.id_maquina ?? m.idMaquina;
                if (m && id && !mapa.has(id)) {
                    mapa.set(id, m);
                }
            });
        }
        return Array.from(mapa.values());
    }, [maquinas]);

    useEffect(() => {
        const loadAreas = async () => {
            if (selectedCliente) {
                setLoadingAreas(true);
                try {
                    const areas = await getAreasByCliente(Number(selectedCliente));
                    setAreasDisponibles(areas);
                } catch (error) {
                    console.error('Error loading areas:', error);
                    setAreasDisponibles([]);
                    if (onAreaChange) onAreaChange(null);
                } finally {
                    setLoadingAreas(false);
                }
            } else {
                setAreasDisponibles([]);
                if (onAreaChange) onAreaChange(null);
            }
        };

        loadAreas();
    }, [selectedCliente]);

    const handleSeleccionarMaquina = (maquina: Maquina) => {
        setSelectedMaquinaObj(maquina);
        const id = maquina.id_maquina ?? maquina.idMaquina;
        if (id) onMaquinaChange(id);
    };

    const handleLimpiarMaquina = () => {
        setSelectedMaquinaObj(null);
        onMaquinaChange(null);
    };

    const handleSeleccionarCliente = (cliente: Cliente) => {
        onClienteChange(cliente.id_cliente);
        if (onAreaChange) onAreaChange(null);
        onMaquinaChange(null);
        setSelectedMaquinaObj(null);
    };

    const handleLimpiarCliente = () => {
        onClienteChange(null);
        if (onAreaChange) onAreaChange(null);
        onMaquinaChange(null);
        setSelectedMaquinaObj(null);
    };

    const hayFiltrosActivos = selectedCliente || selectedMes || selectedAño || selectedMaquina || selectedArea;
    const consolidadoListo = selectedCliente && selectedMes && selectedAño;

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl mb-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <FilterAltIcon className="mr-2 text-primary" />
                    Filtros de búsqueda
                </h2>
                <div className="flex items-center gap-3">
                    {hayFiltrosActivos && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-edit text-white">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Filtros activos
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Cliente <span className="text-red-600">*</span></label>
                    <BuscadorInteligente<Cliente>
                        placeholder="Buscar cliente..."
                        buscarFn={async (term) => {
                            if (!term) return clientesUnicos;
                            const lower = term.toLowerCase();
                            return clientesUnicos.filter(c =>
                                c.nombre.toLowerCase().includes(lower) ||
                                c.ruc?.toLowerCase().includes(lower) ||
                                (c.razon_social && c.razon_social.toLowerCase().includes(lower))
                            );
                        }}
                        onSeleccionar={handleSeleccionarCliente}
                        onClear={handleLimpiarCliente}
                        getItemKey={(c) => c.id_cliente}
                        getItemLabel={(c) => c.nombre}
                        itemsCompletos={clientesUnicos}
                        initialValue={clientesUnicos.find(c => c.id_cliente === selectedCliente)?.nombre || ''}
                        renderItem={(cliente) => (
                            <div className="flex flex-col py-1">
                                <span className="font-semibold text-gray-900 text-sm">{cliente.nombre}</span>
                                {cliente.ruc && <span className="text-xs text-gray-500">{cliente.ruc}</span>}
                            </div>
                        )}
                    />
                    {!selectedCliente && <p className="text-sm text-red-600">Seleccione un cliente</p>}
                </div>

                <div className="space-y-2">
                    <label htmlFor="informe-mes" className="block text-sm font-semibold text-gray-700">Mes <span className="text-red-600">*</span></label>
                    <select
                        id="informe-mes"
                        value={selectedMes}
                        onChange={(e) => onMesChange(e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg ${selectedMes ? 'border-gray-300' : 'border-red-500'}`}
                    >
                        <option value="">Seleccione el mes</option>
                        {meses.map((mes) => (
                            <option key={mes.value} value={mes.value}>
                                {mes.label}
                            </option>
                        ))}
                    </select>
                    {!selectedMes && <p className="text-sm text-red-600">Seleccione el mes</p>}
                </div>

                <div className="space-y-2">
                    <label htmlFor="informe-anio" className="block text-sm font-semibold text-gray-700">Año <span className="text-red-600">*</span></label>
                    <select
                        id="informe-anio"
                        value={selectedAño}
                        onChange={(e) => onAñoChange(e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg ${selectedAño ? 'border-gray-300' : 'border-red-500'}`}
                    >
                        <option value="">Seleccione el año</option>
                        {años.map((año) => (
                            <option key={año.value} value={año.value}>{año.label}</option>
                        ))}
                    </select>
                    {!selectedAño && <p className="text-sm text-red-600">Seleccione el año</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="space-y-2">
                    <label htmlFor="informe-area" className="block text-sm font-semibold text-gray-700">Área <span className="font-normal text-gray-500">(opcional)</span></label>
                    <select
                        id="informe-area"
                        value={selectedArea || ''}
                        onChange={(e) => onAreaChange?.(e.target.value === '' ? null : Number(e.target.value))}
                        disabled={!selectedCliente || loadingAreas}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    >
                        <option value="">Todas las áreas</option>
                        {areasDisponibles.map((area) => (
                            <option key={area.id_area} value={area.id_area}>{area.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Máquina <span className="font-normal text-gray-500">(opcional)</span></label>
                    <BuscadorInteligente<Maquina>
                        disabled={!selectedCliente}
                        placeholder={selectedCliente ? "Todas las máquinas (buscar por serie, modelo o IP)" : "Seleccione primero un cliente"}
                        buscarFn={async (term) => {
                            if (!selectedCliente) return [];
                            const maquinasCliente = maquinasUnicas.filter(m =>
                                m.cliente_id === selectedCliente || m.clienteId === selectedCliente ||
                                m.clienteIdcliente === selectedCliente || m.id_cliente === selectedCliente ||
                                m.idCliente === selectedCliente
                            );
                            if (!term) return maquinasCliente;
                            const lower = term.toLowerCase();
                            return maquinasCliente.filter(m =>
                                m.modelo?.toLowerCase().includes(lower) ||
                                m.serie?.toLowerCase().includes(lower) ||
                                m.ip?.toLowerCase().includes(lower)
                            );
                        }}
                        onSeleccionar={handleSeleccionarMaquina}
                        onClear={handleLimpiarMaquina}
                        getItemKey={(m) => m.id_maquina ?? m.idMaquina ?? 0}
                        getItemLabel={(m) => `${m.modelo} - ${m.serie}`}
                        itemsCompletos={selectedCliente
                            ? maquinasUnicas.filter(m =>
                                m.cliente_id === selectedCliente || m.clienteId === selectedCliente ||
                                m.clienteIdcliente === selectedCliente || m.id_cliente === selectedCliente ||
                                m.idCliente === selectedCliente
                              )
                            : []
                        }
                        initialValue={selectedMaquinaObj
                            ? `${selectedMaquinaObj.modelo} - ${selectedMaquinaObj.serie}`
                            : selectedMaquina
                                ? (maquinasUnicas.find(m => (m.id_maquina ?? m.idMaquina) === selectedMaquina)
                                    ? `${maquinasUnicas.find(m => (m.id_maquina ?? m.idMaquina) === selectedMaquina)!.modelo} - ${maquinasUnicas.find(m => (m.id_maquina ?? m.idMaquina) === selectedMaquina)!.serie}`
                                    : '')
                                : ''}
                        renderItem={(maquina) => (
                            <div className="flex flex-col py-1">
                                <span className="font-semibold text-gray-900 text-sm">{maquina.modelo}</span>
                                <span className="text-xs text-gray-500">{maquina.serie} - {maquina.ip}</span>
                            </div>
                        )}
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-300">
                <button
                    onClick={onLimpiarFiltros}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white font-medium rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpiar filtros
                </button>

                {!autoLoad && onAplicarFiltros && (
                    <button
                        onClick={onAplicarFiltros}
                        disabled={!hayFiltrosActivos}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover disabled:bg-gray-400"
                    >
                        <SearchIcon className="w-5 h-5"/>
                        Buscar
                    </button>
                )}
                {!autoLoad && onGenerarConsolidado && (
                    <button
                        onClick={onGenerarConsolidado}
                        disabled={!consolidadoListo}
                        className="inline-flex items-center px-5 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
                    >
                        Generar consolidado
                    </button>
                )}

            </div>
        </div>
    );
};
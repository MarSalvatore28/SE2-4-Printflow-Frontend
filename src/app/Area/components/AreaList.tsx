import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Paginacion } from '@components/Shared/Paginacion';
import { type Area } from '../types';

interface AreaListProps {
    areas: Area[];
    onEdit?: (area: Area) => void;
    onDelete?: (area: Area) => void;
    onToggleActive?: (area: Area) => void;
}

export const AreaList: React.FC<AreaListProps> = ({
    areas,
    onEdit,
    onDelete,
    onToggleActive
}) => {
    const [expandedClientes, setExpandedClientes] = useState<Set<number>>(new Set());
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;
    // Sin acciones (rol de solo consulta) no se muestra la columna
    const conAcciones = Boolean(onEdit || onDelete || onToggleActive);

    const areasPorCliente = areas.reduce((acc, area) => {
        const clienteId = area.cliente_id;
        if (!acc[clienteId]) {
            acc[clienteId] = {
                cliente_id: clienteId,
                cliente_nombre: area.cliente_nombre || `Cliente ${clienteId}`,
                areas: []
            };
        }
        acc[clienteId].areas.push(area);
        return acc;
    }, {} as Record<number, { cliente_id: number; cliente_nombre: string; areas: Area[] }>);

    const clientesConAreas = Object.values(areasPorCliente).sort((a, b) =>
        a.cliente_nombre.localeCompare(b.cliente_nombre)
    );

    const totalClientes = clientesConAreas.length;
    const totalPaginas = Math.ceil(totalClientes / itemsPorPagina);
    const indiceInicio = (paginaActual - 1) * itemsPorPagina;
    const indiceFin = indiceInicio + itemsPorPagina;
    const clientesPaginados = clientesConAreas.slice(indiceInicio, indiceFin);

    const toggleCliente = (clienteId: number) => {
        setExpandedClientes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(clienteId)) {
                newSet.delete(clienteId);
            } else {
                newSet.add(clienteId);
            }
            return newSet;
        });
    };

    const expandirTodos = () => {
        setExpandedClientes(new Set(clientesPaginados.map(c => c.cliente_id)));
    };

    const contraerTodos = () => {
        setExpandedClientes(new Set());
    };

    const handleCambiarPagina = (nuevaPagina: number) => {
        setPaginaActual(nuevaPagina);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (areas.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-lg font-medium">No se encontraron áreas</p>
                <p className="text-sm mt-2">Prueba ajustando los filtros o agrega una nueva área</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{totalClientes}</span> cliente{totalClientes !== 1 ? 's' : ''} •
                    <span className="font-semibold text-gray-900 ml-2">{areas.length}</span> área{areas.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={expandirTodos}
                        className="text-xs px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors font-medium flex items-center gap-1"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                        Expandir todos
                    </button>
                    <button
                        onClick={contraerTodos}
                        className="text-xs px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium flex items-center gap-1"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                        Contraer todos
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {clientesPaginados.map((cliente) => {
                    const isExpanded = expandedClientes.has(cliente.cliente_id);
                    const areasActivas = cliente.areas.filter(a => a.activo === 1).length;
                    const areasInactivas = cliente.areas.length - areasActivas;

                    return (
                        <div key={cliente.cliente_id} className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                            <button
                                type="button"
                                onClick={() => toggleCliente(cliente.cliente_id)}
                                aria-expanded={isExpanded}
                                className="w-full text-left flex flex-wrap items-center justify-between gap-3 p-4 bg-white hover:bg-gray-50 cursor-pointer transition-all border-b border-transparent data-[expanded=true]:border-gray-100"
                                data-expanded={isExpanded}
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                        <ChevronDown className="w-6 h-6 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-6 h-6 text-gray-400" />
                                    )}

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                            </svg>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">
                                                {cliente.cliente_nombre}
                                            </h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                            {cliente.areas.length} área{cliente.areas.length !== 1 ? 's' : ''}
                                        </span>

                                        {areasActivas > 0 && (
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
                                                ✓ {areasActivas} activa{areasActivas !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {areasInactivas > 0 && (
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                                                ✗ {areasInactivas} inactiva{areasInactivas !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="bg-white border-t border-gray-200">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Nombre del área
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Descripción
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Estado
                                                </th>
                                                {conAcciones && (
                                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Acciones
                                                </th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {cliente.areas.map((area) => (
                                                <tr
                                                    key={area.id_area}
                                                    className={`transition-colors ${area.activo === 0 ? 'bg-red-50/50' : 'hover:bg-accent/10'
                                                        }`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-accent/30 flex items-center justify-center">
                                                                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold text-gray-900 block">
                                                                    {area.nombre}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600 block max-w-xs truncate" title={area.descripcion || undefined}>
                                                            {area.descripcion || <span className="italic text-gray-400">Sin descripción</span>}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${area.activo === 1
                                                            ? 'bg-green-100 text-green-800 border border-green-300'
                                                            : 'bg-red-100 text-red-800 border border-red-300'
                                                            }`}>
                                                            {area.activo === 1 ? '✓ Activo' : '✗ Inactivo'}
                                                        </span>
                                                    </td>
                                                    {conAcciones && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {onEdit && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onEdit(area);
                                                                    }}
                                                                    className="cursor-pointer p-2 bg-edit/20 text-edit border-edit rounded-lg hover:bg-edit/50 transition-colors hover:text-white"
                                                                    title="Editar"
                                                                >
                                                                    <Edit size={18} />
                                                                </button>
                                                            )}

                                                            {area.activo === 1 && onDelete && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onDelete(area);
                                                                    }}
                                                                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                                    title="Desactivar"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}

                                                            {area.activo === 0 && onToggleActive && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onToggleActive(area);
                                                                    }}
                                                                    className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                                    title="Activar"
                                                                >
                                                                    <CheckCircle size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">
                                                Total de áreas en este cliente: <span className="font-bold text-gray-900">{cliente.areas.length}</span>
                                            </span>
                                            <div className="flex gap-4">
                                                {areasActivas > 0 && (
                                                    <span className="text-green-700">
                                                        ✓ <span className="font-bold">{areasActivas}</span> activa{areasActivas !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {areasInactivas > 0 && (
                                                    <span className="text-red-700">
                                                        ✗ <span className="font-bold">{areasInactivas}</span> inactiva{areasInactivas !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {totalPaginas > 1 && (
                <Paginacion
                    paginaActual={paginaActual}
                    totalPaginas={totalPaginas}
                    indiceInicio={indiceInicio}
                    indiceFin={indiceFin}
                    totalItems={totalClientes}
                    onCambiarPagina={handleCambiarPagina}
                    nombreEntidad="clientes"
                />
            )}
        </div>
    );
};

export default AreaList;
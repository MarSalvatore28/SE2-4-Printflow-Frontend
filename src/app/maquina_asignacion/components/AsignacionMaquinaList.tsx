import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { Paginacion } from '@components/Shared/Paginacion';
import { type InstalacionActivaCliente } from '@models/Instalacion/Instalacion.types';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PrintIcon from '@mui/icons-material/Print';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import CheckIcon from '@mui/icons-material/Check';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LanIcon from '@mui/icons-material/Lan';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import RoomIcon from '@mui/icons-material/Room';
interface InstalacionesListProps {
    instalaciones: InstalacionActivaCliente[];
    onEdit?: (instalacion: InstalacionActivaCliente) => void;
    onRetirar?: (instalacion: InstalacionActivaCliente) => void;
    loading?: boolean;
}

interface AreaAgrupada {
    area_id: number;
    area_nombre: string;
    area_descripcion?: string | null;
    instalaciones: InstalacionActivaCliente[];
}

interface ClienteAgrupado {
    cliente_id: number;
    cliente_nombre: string;
    areas: Record<number, AreaAgrupada>;
}

export const InstalacionesList: React.FC<InstalacionesListProps> = ({
    instalaciones,
    onEdit,
    onRetirar,
    loading = false
}) => {
    const [expandedClientes, setExpandedClientes] = useState<Set<number>>(new Set());
    const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;
    // Sin acciones (rol de solo consulta) no se muestra la columna
    const conAcciones = Boolean(onEdit || onRetirar);

    const instalacionesPorCliente = instalaciones.reduce((acc, instalacion) => {
        const clienteId = instalacion.id_cliente;
        const clienteNombre = instalacion.cliente_nombre;

        if (!acc[clienteId]) {
            acc[clienteId] = {
                cliente_id: clienteId,
                cliente_nombre: clienteNombre,
                areas: {}
            };
        }

        const areaId = instalacion.id_area;
        const areaNombre = instalacion.area_nombre;

        if (!acc[clienteId].areas[areaId]) {
            acc[clienteId].areas[areaId] = {
                area_id: areaId,
                area_nombre: areaNombre,
                area_descripcion: instalacion.area_descripcion,
                instalaciones: []
            };
        }

        acc[clienteId].areas[areaId].instalaciones.push(instalacion);
        return acc;
    }, {} as Record<number, ClienteAgrupado>);

    const clientesConInstalaciones = Object.values(instalacionesPorCliente).sort((a, b) =>
        a.cliente_nombre.localeCompare(b.cliente_nombre)
    );

    const totalClientes = clientesConInstalaciones.length;
    const totalPaginas = Math.ceil(totalClientes / itemsPorPagina);
    const indiceInicio = (paginaActual - 1) * itemsPorPagina;
    const indiceFin = indiceInicio + itemsPorPagina;
    const clientesPaginados = clientesConInstalaciones.slice(indiceInicio, indiceFin);

    const toggleCliente = (clienteId: number) => {
        setExpandedClientes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(clienteId)) {
                newSet.delete(clienteId);
                setExpandedAreas(prevAreas => {
                    const newAreas = new Set(prevAreas);
                    const cliente = instalacionesPorCliente[clienteId];
                    if (cliente) {
                        Object.keys(cliente.areas).forEach(areaId => {
                            newAreas.delete(`${clienteId}-${areaId}`);
                        });
                    }
                    return newAreas;
                });
            } else {
                newSet.add(clienteId);
            }
            return newSet;
        });
    };

    const toggleArea = (clienteId: number, areaId: number) => {
        const key = `${clienteId}-${areaId}`;
        setExpandedAreas(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const expandirTodos = () => {
        const todosClientes = new Set(clientesPaginados.map(c => c.cliente_id));
        const todasAreas = new Set<string>();

        clientesPaginados.forEach(cliente => {
            Object.keys(cliente.areas).forEach(areaId => {
                todasAreas.add(`${cliente.cliente_id}-${areaId}`);
            });
        });

        setExpandedClientes(todosClientes);
        setExpandedAreas(todasAreas);
    };

    const contraerTodos = () => {
        setExpandedClientes(new Set());
        setExpandedAreas(new Set());
    };

    const handleCambiarPagina = (nuevaPagina: number) => {
        setPaginaActual(nuevaPagina);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-lg font-medium">Cargando instalaciones...</p>
            </div>
        );
    }

    if (instalaciones.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <p className="text-lg font-medium">No hay instalaciones activas</p>
                <p className="text-sm mt-2">Comienza instalando máquinas en las áreas de tus clientes</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header con controles */}
            <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{totalClientes}</span> cliente{totalClientes !== 1 ? 's' : ''} •
                    <span className="font-semibold text-gray-900 ml-2">{instalaciones.length}</span> {instalaciones.length === 1 ? 'instalación' : 'instalaciones'}
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

            {/* Lista de clientes */}
            <div className="space-y-3">
                {clientesPaginados.map((cliente) => {
                    const isClienteExpanded = expandedClientes.has(cliente.cliente_id);
                    const areas = Object.values(cliente.areas);
                    const totalInstalaciones = areas.reduce((sum, area) => sum + area.instalaciones.length, 0);

                    return (
                        <div
                            key={cliente.cliente_id}
                            className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Header del cliente */}
                            <div
                                onClick={() => toggleCliente(cliente.cliente_id)}
                                className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white hover:bg-gray-50 cursor-pointer transition-all border-b border-transparent data-[expanded=true]:border-gray-100"
                                data-expanded={isClienteExpanded}
                            >
                                <div className="flex items-center gap-3">
                                    {isClienteExpanded ? (
                                        <ChevronDown className="w-6 h-6 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-6 h-6 text-gray-400" />
                                    )}

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
                                            <LocationCityIcon className="w-6 h-6 text-white" />
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
                                        <span className="inline-flex items-center px-2 py-1.5 rounded-full text-xs font-bold bg-edit text-white">
                                            {areas.length} área{areas.length !== 1 ? 's' : ''}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-complement/20 text-complement ">
                                            <CheckIcon className="w-2 h-2 mr-1 font-xs" /> {totalInstalaciones} {totalInstalaciones !== 1 ? 'instalaciones' : 'instalación'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contenido expandido del cliente: áreas */}
                            {isClienteExpanded && (
                                <div className="bg-white border-t border-gray-200">
                                    {areas.map((area) => {
                                        const isAreaExpanded = expandedAreas.has(`${cliente.cliente_id}-${area.area_id}`);

                                        return (
                                            <div
                                                key={area.area_id}
                                                className="border-b border-gray-100 last:border-b-0"
                                            >
                                                {/* Header del área */}
                                                <div
                                                    onClick={() => toggleArea(cliente.cliente_id, area.area_id)}
                                                    className="flex items-center justify-between p-3 px-6 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {isAreaExpanded ? (
                                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                                        ) : (
                                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                                        )}

                                                        <div className="w-8 h-8 rounded-lg bg-accent/30 flex items-center justify-center">
                                                            <RoomIcon className="w-4 h-4 text-primary" />
                                                        </div>

                                                        <div>
                                                            <span className="font-semibold text-gray-900 block">
                                                                {area.area_nombre}
                                                            </span>
                                                            {area.area_descripcion && (
                                                                <span className="text-xs text-gray-500 block max-w-xs truncate" title={area.area_descripcion}>
                                                                    {area.area_descripcion}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-complement/20 text-complement">
                                                        <CheckIcon className="w-2 h-2 mr-1 font-xs" /> {area.instalaciones.length} máquina{area.instalaciones.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>

                                                {/* Contenido expandido del área: tabla de instalaciones */}
                                                {isAreaExpanded && (
                                                    <div className="border-t border-gray-100">
                                                        <table className="w-full">
                                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                                <tr>
                                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                                        Serie / Modelo
                                                                    </th>
                                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                                        Dirección IP
                                                                    </th>
                                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                                        Fecha de instalación
                                                                    </th>
                                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                                        Costos de contrato
                                                                    </th>
                                                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                                        Contador
                                                                    </th>
                                                                    {conAcciones && (
                                                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                                        Acciones
                                                                    </th>
                                                                    )}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                                {area.instalaciones.map((instalacion, index) => (
                                                                    <tr
                                                                        key={instalacion.id_instalacion}
                                                                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-80'} hover:bg-blue-50/30 transition-colors`}
                                                                    >
                                                                        {/* Serie / Modelo */}
                                                                        <td className="px-6 py-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-8 h-8 rounded-lg bg-edit flex items-center justify-center shadow-sm">
                                                                                    <PrintIcon className="w-5 h-5 text-white" />
                                                                                </div>
                                                                                <div>
                                                                                    <span className="font-semibold text-gray-900 block font-mono text-sm">
                                                                                        Serie: {instalacion.serie}
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-500 block">
                                                                                        Modelo: {instalacion.modelo_nombre || 'Sin modelo'}
                                                                                    </span>
                                                                                    {instalacion.formato_impresion && (
                                                                                        <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                                                            <InsertDriveFileIcon style={{ fontSize: 12 }} />
                                                                                            {instalacion.formato_impresion}
                                                                                            <span className="text-gray-300">|</span>
                                                                                            <WaterDropIcon style={{ fontSize: 12 }} />
                                                                                            {instalacion.tipo_impresion}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </td>



                                                                        {/* IP */}
                                                                        <td className="px-6 py-4">
                                                                            <span className="font-mono text-xs text-text px-2.5 py-1.5 rounded items-center gap-1.5">

                                                                                <LanIcon className="w-4 h-4 text-text inline-block mr-1" /> {instalacion.ip_address}
                                                                            </span>
                                                                        </td>

                                                                        {/* Fecha Instalación */}
                                                                        <td className="px-6 py-4">
                                                                            <div className="flex items-center gap-2 text-sm text-text">
                                                                                <CalendarTodayIcon className="w-4 h-4 text-text" />
                                                                                <span>
                                                                                    {instalacion.fecha_instalacion ? new Date(
                                                                                        new Date(instalacion.fecha_instalacion).getTime() +
                                                                                        new Date(instalacion.fecha_instalacion).getTimezoneOffset() * 60000
                                                                                    ).toLocaleDateString('es-ES', {
                                                                                        year: 'numeric',
                                                                                        month: 'short',
                                                                                        day: 'numeric'
                                                                                    }) : 'N/A'}
                                                                                </span>
                                                                            </div>
                                                                        </td>

                                                                        {/* Costos Contrato */}
                                                                        <td className="px-6 py-4">
                                                                            <div className="flex flex-col gap-1 text-xs">
                                                                                <div className="flex items-center gap-1">
                                                                                    <AttachMoneyIcon className="w-3 h-3 text-text" />
                                                                                    <span className="text-text">B/N:</span>
                                                                                    <span className="font-bold text-text">
                                                                                        ${instalacion.costo_copia_bn || '0'} / ${instalacion.costo_impresion_bn || '0'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <AttachMoneyIcon className="w-3 h-3 text-text" />
                                                                                    <span className="text-text">Color:</span>
                                                                                    <span className="font-bold text-text">
                                                                                        ${instalacion.costo_copia_color || '0'} / ${instalacion.costo_impresion_color || '0'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <AttachMoneyIcon className="w-3 h-3 text-text" />
                                                                                    <span className="text-text">Renta:</span>
                                                                                    {instalacion.costo_renta_mensual && Number(instalacion.costo_renta_mensual) > 0 ? (
                                                                                        <span className="font-bold text-text">
                                                                                            ${Number(instalacion.costo_renta_mensual).toFixed(2)}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="text-gray-400 italic">Sin renta</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </td>

                                                                        {/* Contador */}
                                                                        <td className="px-6 py-4 text-center">
                                                                            <div className="flex flex-col items-center gap-1.5">
                                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${instalacion.contador_acumulativo
                                                                                        ? 'bg-green-100 text-green-700'
                                                                                        : 'bg-orange-100 text-orange-700'
                                                                                    }`}>
                                                                                    {instalacion.contador_acumulativo ? 'Acumulativo' : 'No acumulativo'}
                                                                                </span>
                                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${instalacion.contabilidad_por_usuario
                                                                                        ? 'bg-blue-100 text-blue-700'
                                                                                        : 'bg-gray-100 text-gray-500'
                                                                                    }`}>
                                                                                    {instalacion.contabilidad_por_usuario ? 'Por usuario' : 'Global'}
                                                                                </span>
                                                                            </div>
                                                                        </td>

                                                                        {/* Acciones */}
                                                                        {conAcciones && (
                                                                        <td className="px-6 py-4">
                                                                            <div className="flex items-center justify-center gap-2">
                                                                                {onEdit && (
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            onEdit(instalacion);
                                                                                        }}
                                                                                        className="cursor-pointer p-2 bg-edit/20 text-edit border-edit rounded-lg hover:bg-edit/50 transition-colors hover:text-white"
                                                                                        title="Editar IP"
                                                                                    >
                                                                                        <Edit size={18} />
                                                                                    </button>
                                                                                )}

                                                                                {onRetirar && (
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            onRetirar(instalacion);
                                                                                        }}
                                                                                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                                                        title="Retirar instalación"
                                                                                    >
                                                                                        <Trash2 size={18} />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        )}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>

                                                        {/* Observaciones (si existen) */}
                                                        {area.instalaciones.some(i => i.observaciones) && (
                                                            <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
                                                                <p className="text-xs font-semibold text-blue-800 mb-2">Observaciones:</p>
                                                                {area.instalaciones
                                                                    .filter(i => i.observaciones)
                                                                    .map(i => (
                                                                        <div key={i.id_instalacion} className="text-xs text-blue-700 mb-1">
                                                                            <span className="font-mono font-semibold">{i.serie}:</span> {i.observaciones}
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        )}

                                                        {/* Footer del área */}
                                                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-600">
                                                                    Total de máquinas en esta área: <span className="font-bold text-gray-900">{area.instalaciones.length}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Paginación */}
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

export default InstalacionesList;
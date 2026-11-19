import React, { useState, useMemo } from 'react';
import { formatNumber } from '@utils/formatUtils';
import type { DetalleTransaccion, MaquinaConsolidada } from '@models/Reporte/reporte.types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PersonIcon from '@mui/icons-material/Person';



// Formatea fecha con hora: YYYY/MM/DD HH:MM
const formatFechaHora = (fechaStr: string | null | undefined): string => {
    if (!fechaStr) return 'N/A';
    const dStr = typeof fechaStr === 'string' ? fechaStr : (fechaStr as Date).toISOString();
    return dStr.substring(0, 16).replace('T', ' ').replace(/-/g, '/');
};

interface TablaDetalleUsuarioProps {
    data: DetalleTransaccion[];
    periodo: string;
    clienteNombre?: string;
    consolidado?: MaquinaConsolidada[];
}

interface MaquinaTablaProps {
    ip: string;
    maquina: DetalleTransaccion['maquina'];
    transacciones: DetalleTransaccion[];
    fechaToma: string | null | undefined;
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    onSort: (key: string) => void;
}

const MaquinaTabla: React.FC<MaquinaTablaProps> = ({ maquina, transacciones, fechaToma, sortConfig, onSort }) => {
    const totalesMaquina = transacciones.reduce((acc, t) => ({
        copia_bn: acc.copia_bn + t.contadores.copia_bn,
        copia_color: acc.copia_color + t.contadores.copia_color,
        print_bn: acc.print_bn + t.contadores.print_bn,
        print_color: acc.print_color + t.contadores.print_color,
        total_impresiones: acc.total_impresiones + t.contadores.print_bn + t.contadores.print_color,
        total_copias: acc.total_copias + t.contadores.copia_bn + t.contadores.copia_color,
        total_general: acc.total_general + t.totales.general
    }), {
        copia_bn: 0,
        copia_color: 0,
        print_bn: 0,
        print_color: 0,
        total_impresiones: 0,
        total_copias: 0,
        total_general: 0
    });

    const sortedTransacciones = [...transacciones].sort((a, b) => {
        const isA_Otro = a.usuario.nombre?.trim().toUpperCase() === 'OTRO';
        const isB_Otro = b.usuario.nombre?.trim().toUpperCase() === 'OTRO';
        
        if (isA_Otro && !isB_Otro) return 1;
        if (!isA_Otro && isB_Otro) return -1;
        if (isA_Otro && isB_Otro) return 0;

        // Sin columna conocida, los dos quedan en '' y el orden no cambia
        let valA: string | number = '';
        let valB: string | number = '';

        switch (sortConfig.key) {
            case 'usuario.id':
                valA = a.usuario.id; valB = b.usuario.id; break;
            case 'usuario.nombre':
                valA = a.usuario.nombre; valB = b.usuario.nombre; break;
            case 'totales.general':
                valA = a.totales.general; valB = b.totales.general; break;
            case 'total.impresiones':
                valA = a.contadores.print_bn + a.contadores.print_color;
                valB = b.contadores.print_bn + b.contadores.print_color;
                break;
            case 'total.copias':
                valA = a.contadores.copia_bn + a.contadores.copia_color;
                valB = b.contadores.copia_bn + b.contadores.copia_color;
                break;
            case 'contadores.copia_bn':
                valA = a.contadores.copia_bn; valB = b.contadores.copia_bn; break;
            case 'contadores.copia_color':
                valA = a.contadores.copia_color; valB = b.contadores.copia_color; break;
            case 'contadores.print_bn':
                valA = a.contadores.print_bn; valB = b.contadores.print_bn; break;
            case 'contadores.print_color':
                valA = a.contadores.print_color; valB = b.contadores.print_color; break;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
            const cmp = valA.localeCompare(valB, undefined, { numeric: true });
            if (cmp !== 0) return sortConfig.direction === 'asc' ? cmp : -cmp;
        } else {
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="bg-secondary/90 px-6 py-4">
                <div className="flex items-center justify-between text-white">
                    <div>
                        <h3 className="text-xl font-bold leading-tight">{maquina.area}</h3>
                        <p className="text-sm mt-0.5 opacity-85 font-medium">
                            {maquina.modelo} &nbsp;·&nbsp; Serie: <span className="font-mono">{maquina.serie}</span> &nbsp;·&nbsp; IP: <span className="font-mono">{maquina.ip}</span>
                        </p>
                        <p className="text-xs mt-1 opacity-70">
                            Tomado el: {formatFechaHora(fechaToma)}
                        </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                        <div className="text-xs opacity-80 uppercase tracking-wider">Registros</div>
                        <div className="text-3xl font-bold">{transacciones.length}</div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="border-l-2 border-gray-300 bg-gray-100 border-b-2 border-gray-300">
                        <tr className="text-gray-700 uppercase text-xs font-semibold">
                            <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-200" onClick={() => onSort('usuario.id')}>
                                <div className="flex items-center gap-1">
                                    Cuenta ID
                                    <span className={`transition-opacity ${sortConfig.key === 'usuario.id' ? 'opacity-100' : 'opacity-0'}`}>
                                        {sortConfig.key === 'usuario.id' && sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                    </span>
                                </div>
                            </th>
                            <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-200" onClick={() => onSort('usuario.nombre')}>
                                <div className="flex items-center gap-1">
                                    Nombre
                                    <span className={`transition-opacity ${sortConfig.key === 'usuario.nombre' ? 'opacity-100' : 'opacity-0'}`}>
                                        {sortConfig.key === 'usuario.nombre' && sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                    </span>
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200 font-bold text-blue-600" onClick={() => onSort('totales.general')}>
                                <div className="flex items-center justify-end gap-1">
                                    Total
                                    <span className={`transition-opacity ${sortConfig.key === 'totales.general' ? 'opacity-100' : 'opacity-0'}`}>
                                        {sortConfig.key === 'totales.general' && sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                    </span>
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200" onClick={() => onSort('total.impresiones')}>
                                <div className="flex items-center justify-end gap-1">
                                    Imprimir
                                    <span className={`transition-opacity ${sortConfig.key === 'total.impresiones' ? 'opacity-100' : 'opacity-0'}`}>
                                        {sortConfig.key === 'total.impresiones' && sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                    </span>
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200" onClick={() => onSort('total.copias')}>
                                <div className="flex items-center justify-end gap-1">
                                    Copia
                                    <span className={`transition-opacity ${sortConfig.key === 'total.copias' ? 'opacity-100' : 'opacity-0'}`}>
                                        {sortConfig.key === 'total.copias' && sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                    </span>
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200" onClick={() => onSort('contadores.copia_bn')}>
                                <div className="flex items-center justify-end gap-1">
                                    Copia B/N
                                    <span className={`transition-opacity ${sortConfig.key === 'contadores.copia_bn' ? 'opacity-100' : 'opacity-0'}`}>
                                        {sortConfig.key === 'contadores.copia_bn' && sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                    </span>
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200" onClick={() => onSort('contadores.copia_color')}>
                                <div className="flex items-center justify-end gap-1">
                                    Copia Color
                                    <span className={`transition-opacity ${sortConfig.key === 'contadores.copia_color' ? 'opacity-100' : 'opacity-0'}`}>
                                        {sortConfig.key === 'contadores.copia_color' && sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                    </span>
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200" onClick={() => onSort('contadores.print_bn')}>
                                <div className="flex items-center justify-end gap-1">
                                    IMPRIMIR B/N
                                    <span className={`transition-opacity ${sortConfig.key === 'contadores.print_bn' ? 'opacity-100' : 'opacity-0'}`}>
                                        {sortConfig.key === 'contadores.print_bn' && sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                    </span>
                                </div>
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-gray-200" onClick={() => onSort('contadores.print_color')}>
                                <div className="flex items-center justify-end gap-1">
                                    IMPRIMIR COLOR
                                    <span className={`transition-opacity ${sortConfig.key === 'contadores.print_color' ? 'opacity-100' : 'opacity-0'}`}>
                                        {sortConfig.key === 'contadores.print_color' && sortConfig.direction === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                    </span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedTransacciones.map((transaccion, index) => {
                            const totalCopias = transaccion.contadores.copia_bn + transaccion.contadores.copia_color;
                            const totalImpresiones = transaccion.contadores.print_bn + transaccion.contadores.print_color;

                            return (
                                <tr key={transaccion.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-gray-900">{transaccion.usuario.id}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center shrink-0">
                                                <PersonIcon className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="font-semibold text-gray-900">{transaccion.usuario.nombre}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-blue-600 font-mono bg-gray-50 border-l-2 border-gray-300">
                                        {formatNumber(transaccion.totales.general)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-text font-mono border-l-2 border-gray-300">
                                        {formatNumber(totalImpresiones)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-text font-mono border-l-2 border-gray-300">
                                        {formatNumber(totalCopias)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-text font-mono border-l-2 border-gray-300">
                                        {formatNumber(transaccion.contadores.copia_bn)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-purple-600 font-mono">
                                        {formatNumber(transaccion.contadores.copia_color)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-text font-mono border-l-2 border-gray-300">
                                        {formatNumber(transaccion.contadores.print_bn)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-purple-600 font-mono">
                                        {formatNumber(transaccion.contadores.print_color)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-gray-100 border-2 border-gray-300">
                        <tr className="font-bold text-gray-800">
                            <td colSpan={2} className="px-4 py-3 text-right uppercase text-sm">
                                Subtotal:
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-blue-600 font-bold bg-gray-200 border-l-2 border-gray-300">
                                {formatNumber(totalesMaquina.total_general)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-text font-semibold border-l-2 border-gray-300">
                                {formatNumber(totalesMaquina.total_impresiones)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-text font-semibold border-l-2 border-gray-300">
                                {formatNumber(totalesMaquina.total_copias)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-text font-semibold border-l-2 border-gray-300">
                                {formatNumber(totalesMaquina.copia_bn)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-purple-600 font-semibold">
                                {formatNumber(totalesMaquina.copia_color)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-text font-semibold border-l-2 border-gray-300">
                                {formatNumber(totalesMaquina.print_bn)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-purple-600 font-semibold">
                                {formatNumber(totalesMaquina.print_color)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export const TablaDetalleUsuario: React.FC<TablaDetalleUsuarioProps> = ({
    data,
    consolidado
}) => {
    const [globalSortConfig, setGlobalSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    }>({ key: 'usuario.id', direction: 'asc' });

    const transaccionesPorMaquina = useMemo(() => {
        return data.reduce((acc, transaccion) => {
            const key = transaccion.maquina.ip;
            if (!acc[key]) {
                acc[key] = {
                    maquina: transaccion.maquina,
                    transacciones: []
                };
            }
            acc[key].transacciones.push(transaccion);
            return acc;
        }, {} as Record<string, { maquina: DetalleTransaccion['maquina']; transacciones: DetalleTransaccion[] }>);
    }, [data]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (globalSortConfig.key === key && globalSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setGlobalSortConfig({ key, direction });
    };

    return (
        <div className="space-y-6 mt-6" style={{ overflowAnchor: 'none' }}>
            {Object.entries(transaccionesPorMaquina).map(([ip, { maquina, transacciones }]) => {
                const maquinaConsolidada = consolidado?.find(m => m.info.ip === ip);
                const fechaCorteData = maquinaConsolidada?.info.fecha_corte_actual ?? maquinaConsolidada?.info.fecha_corte;
                const fechaToma = fechaCorteData ?? transacciones[0]?.transaccion.fecha;

                return (
                    <MaquinaTabla 
                        key={ip}
                        ip={ip}
                        maquina={maquina}
                        transacciones={transacciones}
                        fechaToma={fechaToma}
                        sortConfig={globalSortConfig}
                        onSort={handleSort}
                    />
                );
            })}
        </div>
    );
};
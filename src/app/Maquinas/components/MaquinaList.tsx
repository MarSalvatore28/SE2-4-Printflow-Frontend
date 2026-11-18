import { useState, type FC } from 'react';
import { Power, CheckCircle } from 'lucide-react';
import DataTable from '@components/Shared/DataTable';
import { Paginacion } from '@components/Shared/Paginacion';
import type { Maquina } from '@models/Maquina/maquina.types';

interface MaquinaListProps {
    maquinas: Maquina[];
    // Sin onEdit ni onToggleActive (rol de solo consulta) no hay columna de acciones
    onEdit?: (maquina: Maquina) => void;
    onToggleActive?: (maquina: Maquina) => void;
}

const POR_PAGINA = 10;

const columns = [
    {
        key: 'serie',
        label: 'Serie',
        render: (m: Maquina) => (
            <span className="font-mono text-sm font-semibold bg-gray-100 px-2 py-1 rounded text-gray-800">{m.serie}</span>
        )
    },
    {
        key: 'modelo',
        label: 'Modelo',
        render: (m: Maquina) => <span className="text-gray-900">{m.modelo || 'Sin modelo'}</span>
    },
    {
        key: 'tipo_impresion',
        label: 'Tipo',
        align: 'center' as const,
        render: (m: Maquina) => (
            m.tipo_impresion === 'Color' ? (
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-secondary text-white">Color</span>
            ) : m.tipo_impresion ? (
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-500 text-white">B/N</span>
            ) : (
                <span className="text-gray-400">—</span>
            )
        )
    },
    {
        key: 'asignacion',
        label: 'Asignación vigente',
        render: (m: Maquina) => (
            m.asignada ? (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900 text-sm">{m.cliente_nombre}</span>
                    <span className="text-xs text-gray-500">{m.area_nombre}</span>
                </div>
            ) : (
                <span className="text-xs text-gray-500 italic">Sin asignar</span>
            )
        )
    },
    {
        key: 'ip',
        label: 'IP',
        render: (m: Maquina) => <span className="font-mono text-xs text-gray-600">{m.ip || '—'}</span>
    },
    {
        key: 'activo',
        label: 'Estado',
        align: 'center' as const,
        render: (m: Maquina) => (
            m.activo ? (
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Activa</span>
            ) : (
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">Inactiva</span>
            )
        )
    }
];

export const MaquinaList: FC<MaquinaListProps> = ({ maquinas, onEdit, onToggleActive }) => {
    const [pagina, setPagina] = useState(1);

    const totalPaginas = Math.max(1, Math.ceil(maquinas.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const indiceInicio = (paginaActual - 1) * POR_PAGINA;
    const indiceFin = indiceInicio + POR_PAGINA;

    return (
        <div>
            <DataTable<Maquina>
                title={`Máquinas (${maquinas.length})`}
                columns={columns}
                data={maquinas.slice(indiceInicio, indiceFin)}
                rowsPerPage={POR_PAGINA}
                getItemId={(m) => m.id_maquina}
                emptyMessage="No se encontraron máquinas"
                onEdit={onEdit}
                showActions={Boolean(onEdit || onToggleActive)}
                additionalActions={onToggleActive && ((m) => (
                    m.activo ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleActive(m); }}
                            className="cursor-pointer p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            title="Desactivar"
                            aria-label={`Desactivar ${m.serie}`}
                        >
                            <Power size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleActive(m); }}
                            className="cursor-pointer p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            title="Activar"
                            aria-label={`Activar ${m.serie}`}
                        >
                            <CheckCircle size={18} />
                        </button>
                    )
                ))}
            />
            {maquinas.length > POR_PAGINA && (
                <Paginacion
                    paginaActual={paginaActual}
                    totalPaginas={totalPaginas}
                    indiceInicio={indiceInicio}
                    indiceFin={indiceFin}
                    totalItems={maquinas.length}
                    onCambiarPagina={setPagina}
                    nombreEntidad="máquinas"
                />
            )}
        </div>
    );
};

export default MaquinaList;

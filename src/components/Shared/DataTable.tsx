import React from 'react';
import { Edit, Trash2, CheckCircle } from 'lucide-react';
import { Paginacion } from './Paginacion';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onToggleActive?: (item: T) => void;
  getItemId: (item: T) => number | string;
  getItemStatus?: (item: T) => boolean;
  emptyMessage?: string;
  showActions?: boolean;
  onRowClick?: (item: T) => void;
  additionalActions?: (item: T) => React.ReactNode;
  rowsPerPage?: number;
}

function DataTable<T>({
  title,
  columns,
  data,
  onEdit,
  onDelete,
  onToggleActive,
  getItemId,
  getItemStatus,
  emptyMessage = 'No se encontraron registros',
  showActions = true,
  onRowClick,
  additionalActions,
  rowsPerPage = 10,
}: Readonly<DataTableProps<T>>) {
  const [paginaActual, setPaginaActual] = React.useState(1);
  const totalColumns = columns.length + (showActions ? 1 : 0);

  const totalPaginas = Math.ceil(data.length / rowsPerPage);
  const indiceInicio = (paginaActual - 1) * rowsPerPage;
  const indiceFin = indiceInicio + rowsPerPage;
  const dataPaginada = data.slice(indiceInicio, indiceFin);

  React.useEffect(() => {
    setPaginaActual(1);
  }, [data.length]);

  return (
    <div className="max-w-full min-w-0 border-2 border-gray-200 border-outline rounded-lg overflow-hidden">
      <div className="bg-secondary/90 text-white p-4">
        <h2 className="font-bold">{title}</h2>
      </div>

      {/* En pantallas angostas la tabla se desplaza a lo ancho dentro de esta caja */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-3 md:px-6 py-3 text-sm font-semibold text-gray-700 ${column.align === 'center'
                    ? 'text-center'
                    : column.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                    }`}
                >
                  {column.label}
                </th>
              ))}
              {showActions && (
                <th className="px-3 md:px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dataPaginada.length === 0 ? (
              <tr>
                <td
                  colSpan={totalColumns}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              dataPaginada.map((item, index) => {
                const isActive = getItemStatus ? getItemStatus(item) : true;

                return (
                  <tr
                    key={getItemId(item)}
                    onClick={() => onRowClick?.(item)}
                    className={`transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-200'}`} 
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-3 md:px-6 py-4 text-sm ${column.align === 'center'
                          ? 'text-center'
                          : column.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                          }`}
                      >
                        {column.render
                          ? column.render(item)
                          : (item as Record<string, React.ReactNode>)[column.key]}
                      </td>
                    ))}
                    {showActions && (
                      <td className="px-3 md:px-6 py-4 text-sm text-center">
                        <div className="flex justify-center gap-2">
                          {additionalActions?.(item)}

                          {onEdit && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                              className="cursor-pointer p-2 bg-edit/20 text-edit border-edit rounded-lg hover:bg-edit/50 transition-colors hover:text-white"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                          )}

                          {isActive && onDelete && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                              className="cursor-pointer p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}

                          {!isActive && onToggleActive && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onToggleActive(item); }}
                              className="cursor-pointer p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              title="Activar"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data.length > rowsPerPage && (
        <div className="px-4 pb-4">
          <Paginacion
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            indiceInicio={indiceInicio}
            indiceFin={indiceFin}
            totalItems={data.length}
            onCambiarPagina={setPaginaActual}
            nombreEntidad={title.toLowerCase()}
          />
        </div>
      )}
    </div>
  );
}

export default DataTable;
import React from 'react';

interface PaginacionProps {
  paginaActual: number;
  totalPaginas: number;
  indiceInicio: number;
  indiceFin: number;
  totalItems: number;
  onCambiarPagina: (pagina: number) => void;
  nombreEntidad?: string;
}

export const Paginacion: React.FC<PaginacionProps> = ({
  paginaActual,
  totalPaginas,
  indiceInicio,
  indiceFin,
  totalItems,
  onCambiarPagina,
  nombreEntidad = 'registros'
}) => {
  return (
    <div className="mt-4 flex items-center justify-between border-t-2 border-gray-200 pt-4">
      <div className="text-sm text-gray-600">
        Mostrando <span className="font-semibold">{indiceInicio + 1}</span> a{' '}
        <span className="font-semibold">{Math.min(indiceFin, totalItems)}</span> de{' '}
        <span className="font-semibold">{totalItems}</span> {nombreEntidad}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onCambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          className="cursor-pointer px-3 py-1 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        <div className="flex gap-1">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => {
            if (
              pagina === 1 ||
              pagina === totalPaginas ||
              (pagina >= paginaActual - 1 && pagina <= paginaActual + 1)
            ) {
              return (
                <button
                  key={pagina}
                  onClick={() => onCambiarPagina(pagina)}
                  className={`cursor-pointer px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    pagina === paginaActual
                      ? 'bg-primary text-white cursor-pointer'
                      : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  {pagina}
                </button>
              );
            } else if (
              pagina === paginaActual - 2 ||
              pagina === paginaActual + 2
            ) {
              return (
                <span key={pagina} className="px-2 py-1 text-gray-500">
                  ...
                </span>
              );
            }
            return null;
          })}
        </div>

        <button
          onClick={() => onCambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className="px-3 py-1 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};
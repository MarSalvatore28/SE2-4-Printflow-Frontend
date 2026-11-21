// Clases de las pestañas «Listar / Agregar» de las pantallas de catálogos
export const clasePestana = (activa: boolean): string =>
    `px-3 md:px-6 py-2 rounded-md transition-all ${activa
        ? 'bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium'
        : 'text-gray-500 hover:text-gray-800'}`;

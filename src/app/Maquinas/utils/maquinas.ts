import type { Maquina } from '@models/Maquina/maquina.types';

// Cada palabra del término debe aparecer en la serie, el modelo, la IP, el cliente o el área.
export const coincide = (m: Maquina, termino: string) => {
    const texto = [m.serie, m.modelo, m.ip, m.cliente_nombre, m.area_nombre]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return termino.toLowerCase().split(/\s+/).filter(Boolean).every(p => texto.includes(p));
};

export interface FiltrosMaquinas {
    id: number | null;
    termino: string;
    mostrarInactivas: boolean;
}

// Una máquina elegida en el buscador gana a los demás filtros
export const filtrarMaquinas = (maquinas: Maquina[], { id, termino, mostrarInactivas }: FiltrosMaquinas): Maquina[] =>
    maquinas.filter(m => {
        if (id) return m.id_maquina === id;
        if (!mostrarInactivas && !m.activo) return false;
        if (termino) return coincide(m, termino);
        return true;
    });

// Segunda línea de cada resultado del buscador: modelo, IP, cliente y si está inactiva
export const detalleMaquina = (m: Maquina): string =>
    [
        m.modelo || 'Sin modelo',
        m.ip ? ` · ${m.ip}` : '',
        m.cliente_nombre ? ` · ${m.cliente_nombre}` : '',
        m.activo ? '' : ' · Inactiva',
    ].join('');

// Textos del modal de activar o desactivar según el estado actual de la máquina
export const textosCambioEstado = (maquina: Maquina | null) => {
    if (maquina?.activo) {
        return {
            type: 'delete' as const,
            title: '¿Desactivar máquina?',
            message: `¿Deseas desactivar la máquina ${maquina.serie}? Una máquina con asignación vigente no se puede desactivar.`,
            confirmText: 'Desactivar',
        };
    }
    return {
        type: 'activate' as const,
        title: '¿Activar máquina?',
        message: `¿Deseas activar la máquina ${maquina?.serie ?? ''}?`,
        confirmText: 'Activar',
    };
};

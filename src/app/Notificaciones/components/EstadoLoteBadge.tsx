import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { ETIQUETA_ESTADO_LOTE, type EstadoLote } from '@app/Notificaciones/types/notificaciones';

const ESTILOS: Record<EstadoLote, { clase: string; Icono: typeof Clock }> = {
  PENDIENTE: { clase: 'bg-yellow-100 text-yellow-800 border-yellow-300', Icono: Clock },
  PROCESADO: { clase: 'bg-green-100 text-green-800 border-green-300', Icono: CheckCircle },
  DESCARTADO: { clase: 'bg-gray-100 text-gray-700 border-gray-300', Icono: XCircle },
  ERROR: { clase: 'bg-red-100 text-red-800 border-red-300', Icono: AlertTriangle },
};

// Estado de un lote con las palabras del plan: Pendiente, Procesado, Descartado, Error
export const EstadoLoteBadge = ({ estado, title }: { estado: EstadoLote; title?: string }) => {
  const { clase, Icono } = ESTILOS[estado] ?? ESTILOS.PENDIENTE;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${clase}`}
      title={title}
      data-estado={estado}
    >
      <Icono size={12} />
      {ETIQUETA_ESTADO_LOTE[estado] ?? estado}
    </span>
  );
};

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DataTable from '@components/Shared/DataTable';
import type { Lote } from '@app/Notificaciones/types/notificaciones';
import { EstadoLoteBadge } from '@app/Notificaciones/components/EstadoLoteBadge';
import { fetchLotes } from '@services/Notificaciones/Lotes.service';

interface ListadoLotesProps {
  // Cambia cuando hay que recargar (aviso del socket, lote aprobado o rechazado)
  recarga: number;
  onVerDetalle: (loteId: number) => void;
}

const Fecha = ({ valor }: { valor: string | null }) =>
  valor ? (
    <div className="flex flex-col items-center">
      <span className="text-xs font-medium text-gray-900 whitespace-nowrap">
        {new Date(valor).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })}
      </span>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {new Date(valor).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  ) : (
    <span className="text-xs text-gray-400">—</span>
  );

// Lotes recibidos por la ingesta con su estado (S2-05)
export const ListadoLotes = ({ recarga, onVerDetalle }: ListadoLotesProps) => {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setLotes(await fetchLotes());
      setError(null);
    } catch {
      setError('No se pudieron cargar los lotes. Intente de nuevo.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar, recarga]);

  const columnas = [
    {
      key: 'lote',
      label: 'Lote',
      render: (l: Lote) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm text-primary">{l.codigo_referencia}</span>
          {l.periodo && <span className="text-xs text-gray-500">Período {l.periodo}</span>}
        </div>
      ),
    },
    {
      key: 'cliente',
      label: 'Cliente',
      render: (l: Lote) =>
        l.clientes.length ? (
          <span className="text-sm text-gray-900">{l.clientes.map((c) => c.nombre).join(', ')}</span>
        ) : (
          <span className="text-xs text-gray-400">Sin cliente identificado</span>
        ),
    },
    {
      key: 'estado',
      label: 'Estado',
      align: 'center' as const,
      render: (l: Lote) => (
        <div className="flex flex-col items-center gap-1 max-w-[16rem] mx-auto">
          <EstadoLoteBadge estado={l.estado} title={l.motivo ?? undefined} />
          {l.motivo && l.estado !== 'PENDIENTE' && (
            <span className="text-xs text-gray-500 line-clamp-2" title={l.motivo}>{l.motivo}</span>
          )}
        </div>
      ),
    },
    {
      key: 'fecha_recepcion',
      label: 'Fecha de recepción',
      align: 'center' as const,
      render: (l: Lote) => <Fecha valor={l.fecha_carga} />,
    },
    {
      key: 'fecha_procesamiento',
      label: 'Fecha de procesamiento',
      align: 'center' as const,
      render: (l: Lote) => <Fecha valor={l.fecha_procesamiento} />,
    },
    {
      key: 'reportes',
      label: 'Reportes',
      align: 'center' as const,
      render: (l: Lote) => (
        <div className="flex flex-col items-center text-xs">
          <span className="font-medium text-gray-900">{l.total_registros_cargados}</span>
          {l.reportes_con_error > 0 && <span className="text-red-600">{l.reportes_con_error} con error</span>}
        </div>
      ),
    },
    {
      key: 'detalle',
      label: 'Detalle',
      align: 'center' as const,
      render: (l: Lote) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVerDetalle(l.id_lote);
          }}
          className="inline-flex items-center px-2 py-1.5 rounded-md border-2 border-secondary/50 shadow-sm text-xs font-medium text-gray-700 bg-background/20 hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          title="Ver detalle del lote"
        >
          <VisibilityIcon className="mr-1.5 text-primary" fontSize="small" />
          Ver detalle
        </button>
      ),
    },
  ];

  if (cargando) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center gap-2">
        <AlertCircle size={20} />
        {error}
      </div>
    );
  }

  return (
    <DataTable<Lote>
      title="Lotes recibidos"
      columns={columnas}
      data={lotes}
      getItemId={(l) => l.id_lote}
      emptyMessage="No hay lotes recibidos."
      rowsPerPage={10}
      showActions={false}
    />
  );
};

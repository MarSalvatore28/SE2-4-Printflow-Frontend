import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DataTable from '@components/Shared/DataTable';
import { ETIQUETA_ESTADO_LOTE, type EstadoLote, type Lote } from '@app/Notificaciones/types/notificaciones';
import { EstadoLoteBadge } from '@app/Notificaciones/components/EstadoLoteBadge';
import { fetchLotes } from '@services/Notificaciones/Lotes.service';
import BusquedaInteligenteClientes from '@app/Clientes/components/BusquedaInteligenteClientes';
import type { ClienteParaTabla } from '@models/Cliente/cliente.types';
import { fetchAllClientes } from '@services/Clientes/clientes.service';

const ESTADOS = Object.keys(ETIQUETA_ESTADO_LOTE) as EstadoLote[];

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

  // Filtros: estado, cliente y rango de la fecha de recepción
  const [estado, setEstado] = useState<EstadoLote | ''>('');
  const [cliente, setCliente] = useState<ClienteParaTabla | null>(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [clientes, setClientes] = useState<ClienteParaTabla[]>([]);
  // Cambiarla vuelve a montar el buscador de clientes vacío
  const [claveBuscador, setClaveBuscador] = useState(0);

  const rangoInvalido = Boolean(desde && hasta && desde > hasta);
  const hayFiltros = Boolean(estado || cliente || desde || hasta);

  useEffect(() => {
    fetchAllClientes()
      .then(setClientes)
      .catch(() => setClientes([]));
  }, []);

  const cargar = useCallback(async () => {
    if (rangoInvalido) return;
    try {
      setLotes(await fetchLotes({ estado, cliente_id: cliente?.id_cliente ?? null, desde, hasta }));
      setError(null);
    } catch {
      setError('No se pudieron cargar los lotes. Intente de nuevo.');
    } finally {
      setCargando(false);
    }
  }, [estado, cliente, desde, hasta, rangoInvalido]);

  useEffect(() => {
    void cargar();
  }, [cargar, recarga]);

  const limpiarFiltros = () => {
    setEstado('');
    setCliente(null);
    setDesde('');
    setHasta('');
    setClaveBuscador((n) => n + 1);
  };

  const columnas = [
    {
      key: 'lote',
      label: 'Lote',
      render: (l: Lote) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm text-primary whitespace-nowrap">{l.codigo_referencia}</span>
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
          className="inline-flex items-center whitespace-nowrap px-2 py-1.5 rounded-md border-2 border-secondary/50 shadow-sm text-xs font-medium text-gray-700 bg-background/20 hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          title="Ver detalle del lote"
        >
          <VisibilityIcon className="mr-1.5 text-primary" fontSize="small" />
          Ver detalle
        </button>
      ),
    },
  ];

  const etiquetaCampo = 'block text-sm font-medium text-gray-700 mb-2';
  const campo = 'w-full h-[42px] px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <div>
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200" data-testid="filtros-lotes">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="filtro-estado" className={etiquetaCampo}>Estado</label>
            <select
              id="filtro-estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoLote | '')}
              className={campo}
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{ETIQUETA_ESTADO_LOTE[e]}</option>
              ))}
            </select>
          </div>
          <div>
            <span className={etiquetaCampo}>Cliente</span>
            <BusquedaInteligenteClientes
              key={claveBuscador}
              itemsCompletos={clientes}
              onSeleccionar={setCliente}
              onClear={() => setCliente(null)}
              placeholder="Todos los clientes"
            />
          </div>
          <div>
            <label htmlFor="filtro-desde" className={etiquetaCampo}>Recibido desde</label>
            <input
              id="filtro-desde"
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => setDesde(e.target.value)}
              className={campo}
            />
          </div>
          <div>
            <label htmlFor="filtro-hasta" className={etiquetaCampo}>Recibido hasta</label>
            <input
              id="filtro-hasta"
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(e) => setHasta(e.target.value)}
              className={campo}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs">
          <span className={rangoInvalido ? 'text-red-600 font-medium' : 'text-gray-500'}>
            {rangoInvalido
              ? 'La fecha «desde» no puede ser posterior a la fecha «hasta».'
              : `${lotes.length} lote(s)${hayFiltros ? ' con los filtros aplicados' : ''}`}
          </span>
          {hayFiltros && (
            <button onClick={limpiarFiltros} className="text-gray-500 hover:text-red-600 flex items-center gap-1">
              Limpiar filtros <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      ) : (
        <DataTable<Lote>
          title="Lotes recibidos"
          columns={columnas}
          data={lotes}
          getItemId={(l) => l.id_lote}
          emptyMessage={hayFiltros ? 'Ningún lote cumple los filtros.' : 'No hay lotes recibidos.'}
          rowsPerPage={10}
          showActions={false}
        />
      )}
    </div>
  );
};

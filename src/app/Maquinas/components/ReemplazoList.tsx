import type { FC } from 'react';
import { ArrowRight } from 'lucide-react';
import DataTable from '@components/Shared/DataTable';
import type { Reemplazo } from '@models/Maquina/reemplazo.types';
import { formatNumber, formatFechaISO } from '@utils/formatUtils';

interface ReemplazoListProps {
    reemplazos: Reemplazo[];
}

const contadores = (bn: number, color: number) => (
    <span className="text-xs text-gray-500">
        B/N <span className="font-mono text-gray-700">{formatNumber(bn)}</span> · color <span className="font-mono text-gray-700">{formatNumber(color)}</span>
    </span>
);

const columns = [
    {
        key: 'periodo',
        label: 'Período',
        render: (r: Reemplazo) => <span className="font-mono text-sm font-semibold text-gray-900 whitespace-nowrap">{r.periodo_afectado}</span>
    },
    {
        key: 'ubicacion',
        label: 'Cliente · Área',
        render: (r: Reemplazo) => (
            <div className="flex flex-col">
                <span className="font-medium text-gray-900 text-sm">{r.cliente_nombre}</span>
                <span className="text-xs text-gray-500">{r.area_nombre}</span>
            </div>
        )
    },
    {
        key: 'maquinas',
        label: 'Sale → Entra',
        render: (r: Reemplazo) => (
            <div className="flex items-start gap-3">
                <div className="flex flex-col">
                    <span className="font-mono text-sm font-semibold bg-red-50 text-red-800 px-2 py-0.5 rounded">{r.saliente_serie}</span>
                    <span className="mt-1">{contadores(r.saliente_contador_final_bn, r.saliente_contador_final_color)}</span>
                </div>
                <ArrowRight className="w-4 h-4 mt-1 text-gray-400 shrink-0" />
                <div className="flex flex-col">
                    <span className="font-mono text-sm font-semibold bg-green-50 text-green-800 px-2 py-0.5 rounded">{r.entrante_serie}</span>
                    <span className="mt-1">{contadores(r.entrante_contador_inicial_bn, r.entrante_contador_inicial_color)}</span>
                    {r.entrante_ip && <span className="text-xs text-gray-500">IP <span className="font-mono text-gray-700">{r.entrante_ip}</span></span>}
                </div>
            </div>
        )
    },
    {
        key: 'fechas',
        label: 'Daño / Instalación',
        render: (r: Reemplazo) => (
            <div className="flex flex-col text-sm whitespace-nowrap">
                <span className="text-red-700">{formatFechaISO(r.fecha_danio)}</span>
                <span className="text-green-700">{formatFechaISO(r.fecha_instalacion_entrante)}</span>
            </div>
        )
    },
    {
        key: 'motivo',
        label: 'Tipo y razón',
        render: (r: Reemplazo) => (
            <div className="flex flex-col max-w-[14rem]">
                <span className="text-sm font-medium text-gray-900">{r.tipo_cambio}</span>
                <span className="text-xs text-gray-500 truncate" title={r.razon_cambio}>{r.razon_cambio}</span>
            </div>
        )
    },
    {
        key: 'estado',
        label: 'Consolidado',
        align: 'center' as const,
        render: (r: Reemplazo) => (
            r.periodo_aprobado ? (
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Aprobado</span>
            ) : (
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200" title="Se enlaza al aprobar el lote del período">
                    Pendiente
                </span>
            )
        )
    }
];

export const ReemplazoList: FC<ReemplazoListProps> = ({ reemplazos }) => (
    <DataTable<Reemplazo>
        title={`Reemplazos registrados (${reemplazos.length})`}
        columns={columns}
        data={reemplazos}
        getItemId={(r) => r.id_maquina_cambio}
        emptyMessage="No hay reemplazos registrados"
        showActions={false}
    />
);

export default ReemplazoList;

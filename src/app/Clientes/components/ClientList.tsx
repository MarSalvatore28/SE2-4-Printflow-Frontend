import React from 'react';
import DataTable from '@components/Shared/DataTable';
import type { Client, ClienteParaTabla } from '@models/Cliente/cliente.types';

import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

interface ClientListProps {
  clients: ClienteParaTabla[];
  onEdit?: (client: ClienteParaTabla) => void;
  onDelete?: (client: ClienteParaTabla) => void;
  onToggleActive?: (client: ClienteParaTabla) => void;
  onRowClick?: (client: ClienteParaTabla) => void;
  onVerDetalles?: (client: ClienteParaTabla) => void;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  onEdit,
  onDelete,
  onToggleActive,
  onRowClick,
  onVerDetalles
}) => {
  const columns = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (client: Client) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 text-sm">{client.nombre}</span>
          {client.razon_social && client.razon_social !== client.nombre && (
            <span className="text-xs text-gray-500">{client.razon_social}</span>
          )}
        </div>
      )
    },
    {
      key: 'ruc',
      label: 'RUC',
      render: (client: Client) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
          {client.ruc || 'N/A'}
        </span>
      )
    },
    {
      key: 'servicios',
      label: 'Servicios',
      align: 'center' as const,
      render: (client: Client) => (
        <div className="flex flex-col gap-1 items-center justify-center">
          <div className="flex flex-wrap gap-1 justify-center max-w-[150px]">
            {client.tiene_renta && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                Renta
              </span>
            )}
            {client.tiene_software_control && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                Software
              </span>
            )}
            {!client.tiene_renta && !client.tiene_software_control && (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'printer_bill',
      label: 'Contabilización',
      align: 'center' as const,
      render: (client: Client) => (
        <div className="flex justify-center items-center">
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
            {client.printer_bill || 'No definido'}
          </span>
        </div>
      )
    },
    {
      key: 'acciones',
      label: 'Detalle',
      align: 'center' as const,
      render: (client: Client) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVerDetalles?.(client);
          }}
          className="inline-flex items-center px-3 py-1.5 rounded-md border-2 border-secondary/50 shadow-sm text-xs font-medium text-gray-700 bg-background/20 hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          <VisibilityOutlinedIcon className='w-4 h-4 mr-1.5 text-primary' />
          Ver detalles
        </button>
      )
    }
  ];

  return (
    <DataTable<ClienteParaTabla>
      title="Clientes registrados"
      columns={columns}
      data={clients}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleActive={onToggleActive}
      onRowClick={onRowClick}
      showActions={Boolean(onEdit || onDelete || onToggleActive)}
      getItemId={(client) => client.id_cliente}
      getItemStatus={(client) => client.activo ?? true}
      emptyMessage="No hay clientes registrados en el sistema."
    />
  );
};

export default ClientList;
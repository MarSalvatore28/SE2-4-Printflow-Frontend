import React from 'react';
import { type Area } from '../types';
import BusquedaInteligenteClientes from '@app/Clientes/components/BusquedaInteligenteClientes';
import { type Client } from '@app/Clientes/types';

interface AreaDetailsFieldsProps {
    formData: Partial<Area>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onSelectCliente: (cliente: Client) => void;
    allClients?: Client[];
}

export const AreaDetailsFields: React.FC<AreaDetailsFieldsProps> = ({
    formData = {},
    onChange,
    onSelectCliente,
    allClients = []
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div className="md:col-span-2 bg-accent/10 p-4 rounded-lg border border-accent/30 mb-2">
                <label className="input-label !text-primary flex items-center gap-2 mb-2">
                    Vincular a cliente
                </label>
                <div className="flex flex-col gap-2">
                    <BusquedaInteligenteClientes
                        onSeleccionar={onSelectCliente}
                        placeholder="Escribe para buscar y vincular un cliente..."
                        itemsCompletos={allClients}
                        onInputChange={() => {
                        }}
                    />
                 
                </div>
            </div>

            <div className="input-container md:col-span-1">
                <label className="input-label">Nombre del área *</label>
                <div className="input-wrapper">
                    <input
                        type="text"
                        name="nombre"
                        className="input-field w-[65%] rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Ej: Gerencia, Producción, etc."
                        value={formData?.nombre || ''}
                        onChange={onChange}
                        required
                    />
                </div>
            </div>

            <div className="input-container">
                <label className="input-label">Estado</label>
                <div className="input-wrapper">
                    <select
                        name="activo"
                        className="input-field rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        value={formData?.activo?.toString() || '1'}
                        onChange={(e) => onChange({
                            ...e,
                            target: {
                                ...e.target,
                                name: 'activo',
                                value: parseInt(e.target.value)
                            } as unknown as EventTarget & HTMLSelectElement
                        })}
                    >
                        <option value="1">Activa</option>
                        <option value="0">Inactiva</option>
                    </select>
                </div>
            </div>

            <div className="input-container">
                <label className="input-label">Descripción</label>
                <div className="input-wrapper">
                    <textarea
                        name="descripcion"
                        rows={2}
                        className="input-field w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Descripción opcional del área..."
                        value={formData?.descripcion || ''}
                        onChange={onChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default AreaDetailsFields;
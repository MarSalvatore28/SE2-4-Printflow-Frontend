import React from 'react';
import AreaDetailsFields from '@app/Area/components/AreaDetailsFields';
import AreasFormAction from '@app/Area/components/AreasFormAction';
import { type Area } from '../types';
import { type Client } from '../../Clientes/types';

interface AreasFormPageProps {
    formData: Partial<Area>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSelectCliente: (cliente: Client) => void;
    onSave: () => void;
    onCancel: () => void;
    clientesDisponibles: Client[];
    isSubmitting?: boolean;
    isEditing?: boolean;
}

export const AreasFormPage: React.FC<AreasFormPageProps> = ({
    formData,
    onChange,
    onSelectCliente,
    onSave,
    onCancel,
    clientesDisponibles,
    isSubmitting = false,
    isEditing = false
}) => {
    return (
        <div className="flex flex-col gap-8">
            <AreaDetailsFields
                formData={formData}
                onChange={onChange}
                onSelectCliente={onSelectCliente}
                allClients={clientesDisponibles}
            />
            <AreasFormAction
                onSave={onSave}
                onCancel={onCancel}
                isSubmitting={isSubmitting}
                isEditing={isEditing}
            />
        </div>
    );
};

export default AreasFormPage;
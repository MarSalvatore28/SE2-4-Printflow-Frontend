import React from 'react';
import ClientDetailsFields from '@app/Clientes/components/ClientDetailsFields';
import ClientesFormAction from '@app/Clientes/components/ClientesFormAction';
import { type ClienteFormData } from '@models/Cliente/cliente.types';

interface ClientesFormPageProps {
    formData: ClienteFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSave: () => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    isEditing?: boolean;
}

export const ClientesFormPage: React.FC<ClientesFormPageProps> = ({
    formData,
    onChange,
    onSave,
    onCancel,
    isSubmitting = false,
    isEditing = false
}) => {
    return (
        <div className="flex flex-col gap-8">
            <ClientDetailsFields
                formData={formData}
                onChange={onChange}
            />
            <ClientesFormAction
                onSave={onSave}
                onCancel={onCancel}
                isSubmitting={isSubmitting}
                isEditing={isEditing}
            />
        </div>
    );
};

export default ClientesFormPage;
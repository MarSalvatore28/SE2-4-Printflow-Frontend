import React from 'react';
import ContractDetailsFields from '@app/Clientes/components/ContractDetailsFields';
import ClientesFormAction from '@app/Clientes/components/ClientesFormAction';
import { type ClienteFormData, type ClienteParaTabla } from '@models/Cliente/cliente.types';

interface ContractFormPageProps {
    formData: ClienteFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSave: () => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    isEditing?: boolean;
    clients?: ClienteParaTabla[];
}

export const ContractFormPage: React.FC<ContractFormPageProps> = ({
    formData,
    onChange,
    onSave,
    onCancel,
    isSubmitting = false,
    isEditing = false,
    clients = []
}) => {

    return (
        <div className="flex flex-col gap-8">
            <ContractDetailsFields
                formData={formData}
                onChange={onChange}
                clients={clients}
            />
            <ClientesFormAction
                onSave={onSave}
                onCancel={onCancel}
                isSubmitting={isSubmitting}
                isEditing={isEditing}
                saveLabel={isEditing ? 'Actualizar contrato' : 'Asignar contrato'}
            />
        </div>
    );
};

export default ContractFormPage;
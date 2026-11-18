import React from 'react';

interface ClientesFormActionProps {
    onSave: () => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    isEditing?: boolean;
    saveLabel?: string;
}

export const ClientesFormAction: React.FC<ClientesFormActionProps> = ({
    onSave,
    onCancel,
    isSubmitting = false,
    isEditing = false,
    saveLabel
}) => {
    return (
        <div className="mt-12 flex justify-end gap-4">
            <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={onSave}
                disabled={isSubmitting}
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Guardando...
                    </>
                ) : (
                    saveLabel || (isEditing ? 'Actualizar Cliente' : 'Guardar Cliente')
                )}
            </button>
        </div>
    );
};

export default ClientesFormAction;

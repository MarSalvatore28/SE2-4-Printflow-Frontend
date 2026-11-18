import React from 'react';

interface AsignacionMaquinaFormActionProps {
    onSave: () => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    isEditing?: boolean;
    isDisabled?: boolean;
    submitLabel?: string;
    loadingLabel?: string;
}

export const AsignacionMaquinaFormAction: React.FC<AsignacionMaquinaFormActionProps> = ({
    onSave,
    onCancel,
    isSubmitting = false,
    isEditing = false,
    isDisabled = false,
    submitLabel,
    loadingLabel
}) => {
    const buttonText = submitLabel || (isEditing ? 'Actualizar' : 'Asignar');
    const loadingText = loadingLabel || (isEditing ? 'Actualizando...' : 'Asignando...');

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
                disabled={isDisabled || isSubmitting}
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {loadingText}
                    </>
                ) : (
                    buttonText
                )}
            </button>
        </div>
    );
};

export default AsignacionMaquinaFormAction;

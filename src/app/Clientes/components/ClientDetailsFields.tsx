import React from 'react';
import { type ClienteFormData } from '@models/Cliente/cliente.types';
import { errorRuc, textoPermitido } from '@app/Clientes/utils/formularioCliente';

interface ClientDetailsFieldsProps {
    formData: ClienteFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const ClientDetailsFields: React.FC<ClientDetailsFieldsProps> = ({ formData, onChange }) => {

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>, maxLength: number = 80) => {
        const { name, value } = e.target;

        if (!textoPermitido(value)) {
            return;
        }

        let newValue = value;
        if (newValue.length > maxLength) {
            newValue = newValue.slice(0, maxLength);
        }

        onChange({
            ...e,
            target: {
                ...e.target,
                name: name,
                value: newValue
            }
        } as React.ChangeEvent<HTMLInputElement>);
    };

    const handleRucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 13) {
            value = value.slice(0, 13);
        }

        const syntheticEvent = {
            ...e,
            target: {
                ...e.target,
                value: value,
                name: 'ruc'
            }
        };

        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
    };

    const mensajeRuc = errorRuc(formData.ruc || '');
    const rucValidation = { isValid: !mensajeRuc, error: mensajeRuc };
    // Borde del RUC: rojo si es inválido, verde si es válido, gris si está vacío
    let claseBordeRuc = 'border-gray-300 focus:ring-primary focus:border-primary';
    if (formData.ruc) {
        claseBordeRuc = rucValidation.isValid
            ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
            : 'border-red-500 focus:border-red-500 focus:ring-red-200';
    }

    return (
        // Quitamos los paddings extra y el título. Dejamos solo el Grid principal.
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="input-container">
                <label htmlFor="cliente-nombre" className="input-label block text-sm font-medium text-gray-700 mb-1">
                    Nombre comercial *<span className="text-xs text-gray-400 ml-2 font-normal">
                        ({(formData.nombre || '').length}/80)
                    </span>
                </label>
                <div className="input-wrapper">
                    <input
                        id="cliente-nombre"
                        type="text"
                        name="nombre"
                        className="input-field w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Ej: Mi Empresa S.A.C."
                        value={formData.nombre || ''}
                        onChange={(e) => handleTextChange(e, 80)}
                        maxLength={80}
                        required
                    />
                </div>
                {(formData.nombre || '').length >= 80 && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <svg aria-hidden="true" className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Límite de caracteres alcanzado
                    </p>
                )}
            </div>

            <div className="input-container">
                <label htmlFor="cliente-ruc" className="input-label block text-sm font-medium text-gray-700 mb-1">RUC *</label>
                <div className="input-wrapper">
                    <input
                        id="cliente-ruc"
                        type="text"
                        name="ruc"
                        className={`input-field font-mono w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 transition-all ${claseBordeRuc}`}
                        placeholder="01XXXXXXXXX001"
                        value={formData.ruc || ''}
                        onChange={handleRucChange}
                        maxLength={13}
                        required
                    />
                </div>
                {formData.ruc && !rucValidation.isValid && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <svg aria-hidden="true" className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {rucValidation.error}
                    </p>
                )}
                {formData.ruc && rucValidation.isValid && formData.ruc.length === 13 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <svg aria-hidden="true" className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        RUC válido
                    </p>
                )}
            </div>

            <div className="input-container md:col-span-2">
                <label htmlFor="cliente-razon-social" className="input-label block text-sm font-medium text-gray-700 mb-1">
                    Razón social<span className="text-xs text-gray-400 ml-2 font-normal">
                        ({(formData.razon_social || '').length}/80)
                    </span>
                </label>
                <div className="input-wrapper">
                    <input
                        id="cliente-razon-social"
                        type="text"
                        name="razon_social"
                        className="input-field w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Nombre legal completo"
                        value={formData.razon_social || ''}
                        onChange={(e) => handleTextChange(e, 80)}
                        maxLength={80}
                    />
                </div>
                {(formData.razon_social || '').length >= 80 && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <svg aria-hidden="true" className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Límite de caracteres alcanzado
                    </p>
                )}
            </div>
        </div>
    );
};

export default ClientDetailsFields;
import React, { useState, useEffect } from 'react';
import { type ClienteFormData, type ClienteParaTabla } from '@models/Cliente/cliente.types';
import { BuscadorInteligente } from '@components/Shared/BuscadorInteligente';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import WarningIcon from '@mui/icons-material/Warning';

interface ContractDetailsFieldsProps {
    formData: ClienteFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    clients?: ClienteParaTabla[];
}

export const ContractDetailsFields: React.FC<ContractDetailsFieldsProps> = ({ formData, onChange, clients = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const standardInputClass = "w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed";

    useEffect(() => {
        if (formData.cliente_id && clients.length > 0) {
            const selected = clients.find(c => c.id_cliente === Number(formData.cliente_id));
            if (selected) {
                setSearchTerm(selected.nombre);
            }
        } else {
            setSearchTerm('');
        }
    }, [formData.cliente_id, clients]);

    const handleClientSelect = (client: ClienteParaTabla) => {
        onChange({
            target: {
                name: 'cliente_id',
                value: client.id_cliente
            }
        } as any);
        setSearchTerm(client.nombre);
    };

    const buscarClientes = async (term: string) => {
        return new Promise<ClienteParaTabla[]>((resolve) => {
            if (!term) {
                resolve([]);
                return;
            }
            const results = clients.filter(client =>
                client.nombre.toLowerCase().includes(term.toLowerCase()) ||
                client.ruc.includes(term)
            );
            resolve(results);
        });
    };

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const regex = /^\d*\.?\d*$/;

        if (value === '') {
            onChange(e);
            return;
        }

        if (regex.test(value)) {
            onChange(e);
        }
    };

    const preventNegativeKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['-', '+', 'e', 'E'].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
        <div className="space-y-8">

            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <SupervisorAccountIcon className="text-primary" fontSize="small" />
                    Asignar Cliente
                </h3>
                <div>
                    <label className="input-label mb-1 block text-sm font-medium text-gray-700">Buscar Cliente existencias (Nombre o RUC)</label>
                    <BuscadorInteligente<ClienteParaTabla>
                        key={formData.cliente_id ? `cliente-${formData.cliente_id}` : 'sin-cliente'}
                        placeholder="Escriba para buscar..."
                        buscarFn={buscarClientes}
                        onSeleccionar={handleClientSelect}
                        renderItem={(client) => (
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-800">{client.nombre}</span>
                                <span className="text-gray-500 text-xs">RUC: {client.ruc}</span>
                            </div>
                        )}
                        getItemKey={(client) => client.id_cliente}
                        getItemLabel={(client) => client.nombre}
                        initialValue={searchTerm}
                        itemsCompletos={clients}
                        minCaracteres={1}
                    />
                </div>
            </div>

            <hr className="border-gray-200" />

            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Vigencia del Contrato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="input-container">
                        <label className="input-label block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                        <input
                            type="date"
                            name="fecha_inicio"
                            className={standardInputClass}
                            value={formData.fecha_inicio || ''}
                            onChange={onChange}
                        />
                    </div>
                    <div className="input-container">
                        <label className="input-label block text-sm font-medium text-gray-700 mb-1">Fecha Fin (Opcional)</label>
                        <input
                            type="date"
                            name="fecha_fin"
                            className={standardInputClass}
                            value={formData.fecha_fin || ''}
                            onChange={onChange}
                        />
                    </div>
                </div>
            </div>

            <hr className="border-gray-200" />

            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <HomeRepairServiceIcon className="text-primary" fontSize="small" />
                    Servicios y Configuración
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="input-container">
                        <label className="input-label font-bold text-xs mb-1 block text-gray-600">¿Tiene Renta de Equipos?</label>
                        <select
                            name="tiene_renta"
                            className={standardInputClass}
                            value={formData.tiene_renta ? 'true' : 'false'}
                            onChange={(e) => onChange({ ...e, target: { ...e.target, name: 'tiene_renta', value: e.target.value === 'true' } as any })}
                        >
                            <option value="false">No (Propia)</option>
                            <option value="true">Sí (En Renta)</option>
                        </select>
                    </div>
                    <div className="input-container">
                        <label className="input-label font-bold text-xs mb-1 block text-gray-600">¿Software de Control?</label>
                        <select
                            name="tiene_software_control"
                            className={standardInputClass}
                            value={formData.tiene_software_control ? 'true' : 'false'}
                            onChange={(e) => onChange({ ...e, target: { ...e.target, name: 'tiene_software_control', value: e.target.value === 'true' } as any })}
                        >
                            <option value="false">No</option>
                            <option value="true">Sí (Instalado)</option>
                        </select>
                    </div>
                    <div className="input-container">
                        <label className="input-label font-bold text-xs mb-1 block text-gray-600">Facturación de Impresora</label>
                        <select
                            name="printer_bill"
                            className={standardInputClass}
                            value={formData.printer_bill}
                            onChange={onChange}
                        >
                            <option value="Todo como Color">Todo como Color</option>
                            <option value="Diferenciar B/N de Color">Diferenciar B/N de Color</option>
                        </select>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2 tracking-wide">
                        <CandlestickChartIcon className="text-primary" fontSize="small" />
                        Cantidades Incluidas
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="group">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Impresión B/N</label>
                            <input
                                type="text"
                                name="impresiones_bn_incluidas"
                                className={standardInputClass}
                                placeholder="0"
                                value={formData.impresiones_bn_incluidas ?? ''}
                                onChange={handleNumericChange}
                                onKeyDown={preventNegativeKey}
                            />
                        </div>
                        <div className="group">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Impresión Color</label>
                            <input
                                type="text"
                                name="impresiones_color_incluidas"
                                className={standardInputClass}
                                placeholder="0"
                                value={formData.impresiones_color_incluidas ?? ''}
                                onChange={handleNumericChange}
                                onKeyDown={preventNegativeKey}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2 tracking-wide">
                        <CurrencyExchangeIcon className="text-primary" fontSize="small" />
                        Costos por copia
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="group">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Impresión B/N</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                <input
                                    type="text"
                                    name="costo_impresion_bn"
                                    className={`${standardInputClass} pl-6`}
                                    placeholder="0.0000"
                                    value={formData.costo_impresion_bn ?? ''}
                                    onChange={handleNumericChange}
                                    onKeyDown={preventNegativeKey}
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Impresión Color</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                <input
                                    type="text"
                                    name="costo_impresion_color"
                                    className={`${standardInputClass} pl-6`}
                                    placeholder="0.0000"
                                    value={formData.costo_impresion_color ?? ''}
                                    onChange={handleNumericChange}
                                    onKeyDown={preventNegativeKey}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2 tracking-wide">
                        <WarningIcon className="text-primary" fontSize="small" />
                        Costo por Excedente
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="group">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Impresión B/N</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                <input
                                    type="text"
                                    name="costo_excedente_impresion_bn"
                                    className={`${standardInputClass} pl-6`}
                                    placeholder="0.0000"
                                    value={formData.costo_excedente_impresion_bn ?? ''}
                                    onChange={handleNumericChange}
                                    onKeyDown={preventNegativeKey}
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Impresión Color</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                <input
                                    type="text"
                                    name="costo_excedente_impresion_color"
                                    className={`${standardInputClass} pl-6`}
                                    placeholder="0.0000"
                                    value={formData.costo_excedente_impresion_color ?? ''}
                                    onChange={handleNumericChange}
                                    onKeyDown={preventNegativeKey}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractDetailsFields;
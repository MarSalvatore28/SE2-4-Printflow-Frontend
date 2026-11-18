import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ClienteParaTabla, ClienteCompleto } from '@models/Cliente/cliente.types';
import { getClienteCompleto, getContratosByCliente, getInstalacionesByCliente, getClienteById } from '@services/Clientes/clientes.service';

interface DetalleClienteModalProps {
    cliente: ClienteParaTabla;
    onClose: () => void;
}

export const DetalleClienteModal: React.FC<DetalleClienteModalProps> = ({ cliente, onClose }) => {
    const [fullData, setFullData] = useState<ClienteCompleto | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            if (!cliente.id_cliente) return;
            try {
                setLoading(true);
                setError(null);

                try {
                    const data = await getClienteCompleto(cliente.id_cliente);
                    if (isMounted) {
                        setFullData(data);
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.warn("getClienteCompleto falló, intentando fallback por partes...", err);
                }

                if (isMounted) {
                    const [basic, contracts, installations] = await Promise.all([
                        getClienteById(cliente.id_cliente),
                        getContratosByCliente(cliente.id_cliente).catch(() => []),
                        getInstalacionesByCliente(cliente.id_cliente).catch(() => [])
                    ]);

                    if (isMounted && basic) {
                        setFullData({
                            ...basic,
                            contratos: contracts,
                            instalaciones_activas: installations
                        });
                    } else if (isMounted) {
                        setError("No se pudieron cargar los detalles del cliente.");
                    }
                }
            } catch (err) {
                console.error("Error critico cargando detalles:", err);
                if (isMounted) setError("Error al conectar con el servidor.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [cliente.id_cliente]);

    const contrato = fullData?.contratos?.find(c => c.activo)
        || (fullData?.contratos && fullData.contratos.length > 0 ? fullData.contratos[0] : null);

    const formatFecha = (fechaStr?: string) => {
        if (!fechaStr) return '-';
        const partes = fechaStr.split('T')[0].split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return fechaStr;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full animate-scale-in">

                    <div className="bg-primary px-6 py-4 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl leading-6 font-bold text-white" id="modal-title">
                                {cliente.nombre}
                            </h3>
                            <p className="text-white text-sm mt-1">
                                {cliente.razon_social || 'Sin razón social'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            type="button"
                            className="text-white hover:text-gray-200 focus:outline-none"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="px-6 py-6">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 p-4 rounded-lg text-red-700 text-center">
                                {error}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-text uppercase tracking-wider border-b pb-1">
                                            Información General
                                        </h4>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">RUC:</span>
                                            <span className="font-mono text-sm px-2 rounded text-gray-800">
                                                {cliente.ruc || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Estado:</span>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${cliente.activo
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'

                                                }`}>
                                                {cliente.activo ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </div>
                                        {cliente.printer_bill && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Contabilización:</span>
                                                <span className="font-medium text-gray-900 text-sm">
                                                    {cliente.printer_bill}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-text uppercase tracking-wider border-b pb-1">
                                            Resumen de Actividad
                                        </h4>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-600">Máquinas Activas:</span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold text-edit">
                                                {fullData?.total_instalaciones || cliente.total_instalaciones || 0}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className={`p-2 rounded text-center bg-edit-hover/10 border border-edit`}>
                                                <div className="text-xs text-text truncate">Inicio Contrato</div>
                                                <div className="text-sm font-bold text-edit">
                                                    {contrato ? formatFecha(contrato.fecha_inicio) : '-'}
                                                </div>
                                            </div>
                                            <div className={`p-2 rounded text-center ${cliente.tiene_software_control ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50 border border-gray-200'}`}>
                                                <div className="text-xs text-text truncate">Software</div>
                                                <div className={`text-sm font-bold ${cliente.tiene_software_control ? 'text-indigo-600' : 'text-gray-400'}`}>
                                                    {cliente.tiene_software_control ? 'Sí' : 'No'}
                                                </div>
                                            </div>
                                            <div className={`p-2 rounded text-center ${cliente.tiene_renta ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                                                <div className="text-xs text-text truncate">Renta</div>
                                                <div className={`text-sm font-bold ${cliente.tiene_renta ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {cliente.tiene_renta ? 'Sí' : 'No'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <h4 className="text-sm font-semibold text-text uppercase tracking-wider mb-3">
                                    Límites y Costos del Contrato
                                </h4>
                                {contrato ? (
                                    <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm mb-6">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-secondary">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium border-r border-gray-400 text-white uppercase">
                                                        Concepto
                                                    </th>
                                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium border-r border-gray-400 text-white uppercase">
                                                        B/N
                                                    </th>
                                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium  text-white uppercase">
                                                        Color
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                                <tr>
                                                    <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200 bg-gray-50/50">
                                                        Impresiones Incluidas
                                                    </td>
                                                    <td className="px-4 py-3 text-right border-r border-gray-200 font-mono text-gray-900">
                                                        {contrato.impresiones_bn_incluidas?.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono text-edit">
                                                        {contrato.impresiones_color_incluidas?.toLocaleString()}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200 bg-gray-50/50">
                                                        Costo por Impresión
                                                    </td>
                                                    <td className="px-4 py-3 text-right border-r border-gray-200 font-mono text-gray-900">
                                                        ${Number(contrato.costo_impresion_bn || 0).toFixed(4)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono text-edit">
                                                        ${Number(contrato.costo_impresion_color || 0).toFixed(4)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="px-4 py-3 font-medium text-gray-900 border-r border-gray-200 bg-gray-50/50">
                                                        Costo Excedente
                                                    </td>
                                                    <td className="px-4 py-3 text-right border-r border-gray-200 font-mono text-gray-500">
                                                        ${Number(contrato.costo_excedente_impresion_bn || 0).toFixed(4)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono text-gray-500">
                                                        ${Number(contrato.costo_excedente_impresion_color || 0).toFixed(4)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                        <p className="text-sm text-yellow-700">Este cliente no tiene un contrato activo registrado.</p>
                                    </div>
                                )}

                                <h4 className="text-sm font-semibold text-text uppercase tracking-wider mb-3">
                                    Instalaciones Activas
                                </h4>
                                <div className="grid grid-cols-1 gap-3 mb-6">
                                    {fullData?.instalaciones_activas && fullData.instalaciones_activas.length > 0 ? (
                                        fullData.instalaciones_activas.map((inst, idx) => (
                                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                                                <div>
                                                    <span className="font-bold text-gray-700 block">{inst.maquina_modelo} (SN: {inst.maquina_serie})</span>
                                                    <span className="text-xs text-gray-500">Área: {inst.area_nombre || 'General'} | IP: {inst.ip_address || 'N/A'}</span>
                                                </div>
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Activa</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No hay máquinas instaladas actualmente.</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:text-sm"
                            onClick={onClose}
                        >
                            Cerrar
                        </button>
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-hover sm:text-sm"
                            onClick={() => window.print()}
                        >
                            Imprimir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
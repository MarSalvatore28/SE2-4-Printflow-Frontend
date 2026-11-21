import { X, History, Calendar, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getHistorialCliente } from '@services/Clientes/clientes.service';
import type {
    HistorialData,
    CambioDetalle,
    ModalHistorialClienteProps
} from '@models/Cliente/Historialcliente.types';

export const ModalHistorialCliente: React.FC<ModalHistorialClienteProps> = ({
    clienteId,
    isOpen,
    onClose,
    clienteNombre
}) => {
    const [historial, setHistorial] = useState<HistorialData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen && clienteId) {
            void cargarHistorialCompleto();
        }
    }, [isOpen, clienteId]);

    const cargarHistorialCompleto = async () => {
        setLoading(true);
        try {
            const data = await getHistorialCliente(clienteId);
            setHistorial(data);
        } catch (error) {
            console.error('Error al cargar historial completo:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatearFecha = (fecha: string): string => {
        return new Date(fecha).toLocaleString('es-EC', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderCambio = (cambio: HistorialData, index: number) => {
        const cambios: CambioDetalle[] = [];

        if (cambio.cambio_nombre) {
            cambios.push({
                campo: 'Nombre',
                anterior: cambio.nombre_anterior,
                actual: cambio.nombre_actual
            });
        }

        if (cambio.cambio_razon_social) {
            cambios.push({
                campo: 'Razón social',
                anterior: cambio.razon_social_anterior || 'Sin especificar',
                actual: cambio.razon_social_actual || 'Sin especificar'
            });
        }

        if (cambio.cambio_ruc) {
            cambios.push({
                campo: 'RUC',
                anterior: cambio.ruc_anterior,
                actual: cambio.ruc_actual
            });
        }

        return (
            <div key={index} className="border-l-4 border-amber-400 bg-gray-50 p-4 rounded-r-lg">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                        {formatearFecha(cambio.fecha_cambio)}
                    </span>
                </div>

                <div className="space-y-3">
                    {cambios.map((c, idx) => (
                        <div key={idx} className="bg-white rounded-md p-3 shadow-sm">
                            <div className="text-xs font-semibold text-gray-700 mb-2">
                                {c.campo}
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="flex-1 text-gray-600 line-through">
                                    {c.anterior}
                                </span>
                                <ArrowRight className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                <span className="flex-1 text-gray-900 font-medium">
                                    {c.actual}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-lg">
                            <History className="h-6 w-6 text-amber-700" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Historial de cambios
                            </h2>
                            <p className="text-sm text-gray-600 mt-0.5">
                                Cliente: <strong>{clienteNombre}</strong>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"></div>
                        </div>
                    ) : historial.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <History className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600">No hay cambios registrados</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {historial.map((cambio, index) => renderCambio(cambio, index))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg">
                    <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>
                            Total de cambios: <strong>{historial.length}</strong>
                        </span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
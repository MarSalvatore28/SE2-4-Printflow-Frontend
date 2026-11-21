import { useEffect, useState } from 'react';
import { AlertCircle, X, History } from 'lucide-react';
import { ModalHistorialCliente } from '@app/Informes/components/Modalhistorialcliente';
import { tieneHistorial, getUltimoCambio } from '@services/Clientes/clientes.service';
import type { 
    HistorialData, 
    CambioDetalle, 
    AlertaHistorialClienteProps
} from '@models/Cliente/Historialcliente.types';

export const AlertaHistorialCliente: React.FC<AlertaHistorialClienteProps> = ({ 
    clienteId, 
    periodo = null, 
    clienteNombre 
}) => {
    const [historial, setHistorial] = useState<HistorialData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [mostrar, setMostrar] = useState<boolean>(true);
    const [modalAbierto, setModalAbierto] = useState<boolean>(false);

    useEffect(() => {
        if (clienteId && mostrar) {
            void cargarHistorial();
        }
    }, [clienteId]);

    const cargarHistorial = async () => {
        setLoading(true);
        try {
            const tiene = await tieneHistorial(clienteId);

            if (tiene) {
                const ultimoCambio = await getUltimoCambio(clienteId);
                
                if (ultimoCambio) {
                    setHistorial(ultimoCambio);
                }
            } else {
                setHistorial(null);
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
        } finally {
            setLoading(false);
        }
    };

    const abrirModal = () => {
        setModalAbierto(true);
    };

    const formatearFecha = (fecha: string): string => {
        return new Date(fecha).toLocaleDateString('es-EC', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const obtenerCambios = (): CambioDetalle[] => {
        if (!historial) return [];
        
        const cambios: CambioDetalle[] = [];
        
        if (historial.cambio_nombre) {
            cambios.push({
                campo: 'Nombre',
                anterior: historial.nombre_anterior,
                actual: historial.nombre_actual
            });
        }
        
        if (historial.cambio_razon_social) {
            cambios.push({
                campo: 'Razón social',
                anterior: historial.razon_social_anterior || 'Sin especificar',
                actual: historial.razon_social_actual || 'Sin especificar'
            });
        }
        
        if (historial.cambio_ruc) {
            cambios.push({
                campo: 'RUC',
                anterior: historial.ruc_anterior,
                actual: historial.ruc_actual
            });
        }
        
        return cambios;
    };

    if (loading) {
        return null;
    }

    if (!historial || !mostrar) return null;

    const cambios = obtenerCambios();

    return (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg p-4 shadow-sm animate-fadeIn">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <History className="h-5 w-5 text-amber-600 mt-0.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Este cliente tiene cambios registrados
                        </h4>
                        <button
                            onClick={() => setMostrar(false)}
                            className="flex-shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
                            aria-label="Cerrar alerta"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <p className="text-xs text-amber-800 mb-3">
                        Última actualización: <strong>{formatearFecha(historial.fecha_cambio)}</strong>
                        {periodo && (
                            <span className="block mt-1">
                                ⚠️ Al momento de generar este reporte, el cliente podría haber tenido otro nombre.
                            </span>
                        )}
                    </p>

                    <div className="space-y-2">
                        {cambios.map((cambio, index) => (
                            <div 
                                key={index} 
                                className="bg-white rounded-md p-2 border border-amber-200"
                            >
                                <div className="text-xs font-medium text-amber-900 mb-1">
                                    {cambio.campo}:
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-600 line-through">
                                        {cambio.anterior}
                                    </span>
                                    <svg className="h-3 w-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    <span className="text-amber-900 font-medium">
                                        {cambio.actual}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={abrirModal}
                        className="mt-3 text-xs text-amber-700 hover:text-amber-900 font-medium underline"
                    >
                        Ver historial completo →
                    </button>
                </div>
            </div>

            {/* Modal de historial completo */}
            <ModalHistorialCliente
                clienteId={clienteId}
                isOpen={modalAbierto}
                onClose={() => setModalAbierto(false)}
                clienteNombre={clienteNombre || historial?.nombre_actual}
            />
        </div>
    );
};
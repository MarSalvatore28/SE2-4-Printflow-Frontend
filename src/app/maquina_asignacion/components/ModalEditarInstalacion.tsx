import { useId, useRef } from 'react';
import { X } from 'lucide-react';
import { type InstalacionActivaCliente } from '@models/Instalacion/Instalacion.types';
import { useDialogoAccesible } from '@hooks/useDialogoAccesible';
import type { DatosEdicionInstalacion } from '@app/maquina_asignacion/utils/instalaciones';

interface ModalEditarInstalacionProps {
    instalacion: InstalacionActivaCliente;
    datos: DatosEdicionInstalacion;
    onCambiar: (datos: DatosEdicionInstalacion) => void;
    onCerrar: () => void;
    onGuardar: () => void;
    guardando: boolean;
}

// Editar IP, fecha, renta y forma de contar de una instalación activa
export const ModalEditarInstalacion = ({
    instalacion,
    datos,
    onCambiar,
    onCerrar,
    onGuardar,
    guardando,
}: ModalEditarInstalacionProps) => {
    const dialogoRef = useRef<HTMLDivElement>(null);
    const idTitulo = useId();
    useDialogoAccesible(true, onCerrar, dialogoRef);

    const cambiar = (cambios: Partial<DatosEdicionInstalacion>) => onCambiar({ ...datos, ...cambios });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
                ref={dialogoRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={idTitulo}
                tabIndex={-1}
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md focus:outline-none"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 id={idTitulo} className="text-xl font-bold text-gray-900">Editar instalación</h3>
                    <button
                        onClick={onCerrar}
                        aria-label="Cerrar"
                        className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-6 space-y-5">
                    {/* Información estática de la máquina */}
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm text-gray-700">
                        <p>
                            <span className="font-semibold text-gray-900">Máquina:</span>{' '}
                            {instalacion.serie}
                        </p>
                        <p className="my-1">
                            <span className="font-semibold text-gray-900">Modelo:</span>{' '}
                            {instalacion.modelo_nombre || 'Sin modelo'}
                        </p>
                        <p>
                            <span className="font-semibold text-gray-900">Área:</span>{' '}
                            {instalacion.area_nombre}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Dirección IP *
                        </label>
                        <input
                            type="text"
                            value={datos.ip_address}
                            onChange={(e) => cambiar({ ip_address: e.target.value })}
                            placeholder="Ej: 192.168.1.100"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-all"
                            pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Fecha de Instalación
                        </label>
                        <input
                            type="date"
                            value={datos.fecha_instalacion}
                            onChange={(e) => cambiar({ fecha_instalacion: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                        />
                    </div>

                    {instalacion.renta_equipo ? (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Costo de renta mensual ($)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={datos.costo_renta_mensual}
                                onChange={(e) => cambiar({ costo_renta_mensual: Number(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                            />
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                           <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Costo de renta mensual
                            </label>
                            <p className="text-sm font-medium text-gray-500">
                                El contrato asociado no incluye cobro por renta de equipo.
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={datos.contador_acumulativo}
                                onChange={(e) => cambiar({ contador_acumulativo: e.target.checked })}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">Contador acumulativo</span>
                        </label>

                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={datos.contabilidad_por_usuario}
                                onChange={(e) => cambiar({ contabilidad_por_usuario: e.target.checked })}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">Requiere detalle por usuario</span>
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <button
                        onClick={onCerrar}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onGuardar}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        disabled={guardando || !datos.ip_address.trim()}
                    >
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

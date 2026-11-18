import React, { useState, useEffect } from 'react';
import { InstalacionFormFields, type MaquinaConIP } from '@app/maquina_asignacion/components/AsignacionMaquinaDetailsFields';
import InstalacionFormAction from '@app/maquina_asignacion/components/AsignacionMaquinaFormAction';
import { type InstalacionFormData, type MaquinaSinInstalacion } from '@models/Instalacion/Instalacion.types';
import { type Client } from '@models/Cliente/cliente.types';
import { createInstalacion } from '@services/Instalaciones/instalaciones.service';
import SummarizeIcon from '@mui/icons-material/Summarize';
import ModalConfirmacion from '@components/Shared/ModalConfirmacion';

interface InstalacionFormProps {
    onSuccess: (showSuccessModal?: boolean) => void;
    onCancel: () => void;
    clientesDisponibles: Client[];
    multipleSelection?: boolean;
}

export const InstalacionForm: React.FC<InstalacionFormProps> = ({
    onSuccess,
    onCancel,
    clientesDisponibles,
    multipleSelection = false
}) => {
    const [formData, setFormData] = useState<InstalacionFormData>({
        maquina_id: 0,
        area_id: 0,
        contrato_id: 0,
        ip_address: '',
        observaciones: '',
        contador_acumulativo: true,
        contabilidad_por_usuario: false,
        costo_renta_mensual: 0,
        fecha_instalacion: new Date().toISOString().split('T')[0]
    });

    const [selectedClienteId, setSelectedClienteId] = useState<number | undefined>(undefined);
    const [maquinasConIP, setMaquinasConIP] = useState<MaquinaConIP[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode | string;
        type: 'warning' | 'activate' | 'delete' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning'
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [creationProgress, setCreationProgress] = useState({ current: 0, total: 0 });

    const [selectedNames, setSelectedNames] = useState({
        cliente: '',
        area: '',
        contrato: ''
    });

    const resetForm = () => {
        setFormData({
            maquina_id: 0,
            area_id: 0,
            contrato_id: 0,
            ip_address: '',
            observaciones: '',
            contador_acumulativo: true,
            contabilidad_por_usuario: false,
            costo_renta_mensual: 0,
            fecha_instalacion: new Date().toISOString().split('T')[0]
        });
        setSelectedClienteId(undefined);
        setMaquinasConIP([]);
        setSelectedNames({ cliente: '', area: '', contrato: '' });
        setValidationErrors({});
    };

    useEffect(() => {
        if (selectedClienteId) {
            setFormData(prev => ({
                ...prev,
                area_id: 0,
                contrato_id: 0,
                maquina_id: 0,
                ip_address: '',
                observaciones: '',
                contador_acumulativo: true,
                contabilidad_por_usuario: false,
                costo_renta_mensual: 0,
                fecha_instalacion: new Date().toISOString().split('T')[0]
            }));
            setMaquinasConIP([]);
            setSelectedNames(prev => ({ ...prev, area: '', contrato: '' }));
        }
    }, [selectedClienteId]);

    const mostrarModal = (
        title: string,
        message: string,
        type: 'warning' | 'activate' | 'delete' | 'info' = 'warning',
        details?: Array<{ label: string, text: string }>
    ) => {
        let modalContent: React.ReactNode = message;

        if (details && details.length > 0) {
            modalContent = (
                <div className="text-left">
                    <p className="mb-4 text-center">{message}</p>
                    <div className="bg-white rounded-lg p-4 border border-gray-200 mt-2 shadow-sm">
                        <h4 className="text-xs uppercase font-bold text-gray-500 mb-3 tracking-wider">Detalles a corregir:</h4>
                        <ul className="space-y-3">
                            {details.map((item, idx) => (
                                <li key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                    <span className="font-bold text-gray-800 shrink-0">{item.label}:</span>
                                    <span className="text-gray-600">{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            );
        }

        setModalConfig({ isOpen: true, title, message: modalContent, type });
    };

    const handleCloseModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const handleSelectCliente = (cliente: Client) => {
        setSelectedClienteId(cliente.id_cliente);
        setSelectedNames(prev => ({ ...prev, cliente: cliente.nombre }));
        setValidationErrors({});
    };

    const handleSelectArea = (areaId: number, areaName?: string) => {
        setFormData(prev => ({ ...prev, area_id: areaId }));
        if (areaName) setSelectedNames(prev => ({ ...prev, area: areaName }));
        setValidationErrors({});
    };

    const handleSelectContrato = (contratoId: number, contratoDesc?: string) => {
        setFormData(prev => ({ ...prev, contrato_id: contratoId }));
        if (contratoDesc) setSelectedNames(prev => ({ ...prev, contrato: contratoDesc }));
        setValidationErrors({});
    };

    const handleSelectMaquina = (maquina: { id_maquina: number }) => {
        setFormData(prev => ({ ...prev, maquina_id: maquina.id_maquina }));
        setValidationErrors({});
    };

    const handleAddMaquina = (maquina: MaquinaSinInstalacion) => {
        setMaquinasConIP(prev => [...prev, {
            maquina,
            ip_address: '',
            observaciones: '',
            fecha_instalacion: new Date().toISOString().split('T')[0],
            costo_renta_mensual: 0,
            contador_acumulativo: true,
            contabilidad_por_usuario: false,
            area_id: 0
        }]);
        setValidationErrors({});
    };

    const handleRemoveMaquina = (maquinaId: number) => {
        setMaquinasConIP(prev => prev.filter(item => item.maquina.id_maquina !== maquinaId));
    };

    const handleUpdateMaquinaIP = (maquinaId: number, ip: string) => {
        setMaquinasConIP(prev => prev.map(item => item.maquina.id_maquina === maquinaId ? { ...item, ip_address: ip } : item));
    };

    const handleUpdateMaquinaFecha = (maquinaId: number, fecha: string) => {
        setMaquinasConIP(prev => prev.map(item => item.maquina.id_maquina === maquinaId ? { ...item, fecha_instalacion: fecha } : item));
    };

    const handleUpdateMaquinaObservaciones = (maquinaId: number, obs: string) => {
        setMaquinasConIP(prev => prev.map(item => item.maquina.id_maquina === maquinaId ? { ...item, observaciones: obs } : item));
    };

    const handleUpdateMaquinaRenta = (maquinaId: number, costo: number) => {
        setMaquinasConIP(prev => prev.map(item => item.maquina.id_maquina === maquinaId ? { ...item, costo_renta_mensual: costo } : item));
    };

    const handleUpdateMaquinaContador = (maquinaId: number, val: boolean) => {
        setMaquinasConIP(prev => prev.map(item => item.maquina.id_maquina === maquinaId ? { ...item, contador_acumulativo: val } : item));
    };

    const handleUpdateMaquinaContabilidad = (maquinaId: number, val: boolean) => {
        setMaquinasConIP(prev => prev.map(item => item.maquina.id_maquina === maquinaId ? { ...item, contabilidad_por_usuario: val } : item));
    };

    const handleUpdateMaquinaArea = (maquinaId: number, areaId: number) => {
        setMaquinasConIP(prev => prev.map(item => item.maquina.id_maquina === maquinaId ? { ...item, area_id: areaId } : item));
    };

    const handleChangeCostoRenta = (costo: number) => setFormData(prev => ({ ...prev, costo_renta_mensual: costo }));
    const handleChangeContadorAcumulativo = (val: boolean) => setFormData(prev => ({ ...prev, contador_acumulativo: val }));
    const handleChangeContabilidadUsuario = (val: boolean) => setFormData(prev => ({ ...prev, contabilidad_por_usuario: val }));
    const handleChangeObservaciones = (obs: string) => setFormData(prev => ({ ...prev, observaciones: obs }));

    const handleChangeIP = (ip: string) => {
        setFormData(prev => ({ ...prev, ip_address: ip }));
        if (validationErrors.ip_address) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.ip_address;
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!selectedClienteId) errors.cliente = 'Debe seleccionar un cliente';
        if (!formData.contrato_id || formData.contrato_id === 0) errors.contrato = 'Debe seleccionar un contrato';

        if (multipleSelection) {
            if (maquinasConIP.length === 0) errors.maquina = 'Debe agregar al menos una máquina';

            const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            maquinasConIP.forEach((item, index) => {
                if (!item.area_id || item.area_id === 0) errors[`area_${index}`] = `Seleccione un área para la máquina ${item.maquina.serie}`;
                if (!item.ip_address || item.ip_address.trim() === '') {
                    errors[`ip_${index}`] = `La máquina ${item.maquina.serie} requiere una dirección IP`;
                } else if (!ipRegex.test(item.ip_address.trim())) {
                    errors[`ip_${index}`] = `IP inválida para ${item.maquina.serie}`;
                }
            });
        } else {
            if (!formData.area_id || formData.area_id === 0) errors.area = 'Debe seleccionar un área';
            if (!formData.maquina_id || formData.maquina_id === 0) errors.maquina = 'Debe seleccionar una máquina';
            if (!formData.ip_address || formData.ip_address.trim() === '') {
                errors.ip_address = 'La dirección IP es obligatoria';
            } else {
                const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                if (!ipRegex.test(formData.ip_address.trim())) errors.ip_address = 'Formato de IP inválido';
            }
        }

        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            const errorDetails = Object.entries(errors).map(([key, text]) => ({
                label: key.includes('_') ? 'Revisión' : key.charAt(0).toUpperCase() + key.slice(1),
                text
            }));
            mostrarModal('Formulario Incompleto', 'Por favor, revise los siguientes campos antes de guardar:', 'warning', errorDetails);
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setSubmitting(true);

            if (multipleSelection && maquinasConIP.length > 0) {
                setCreationProgress({ current: 0, total: maquinasConIP.length });
                const actionErrors: Array<{ maquina: string; error: string }> = [];
                let successCount = 0;

                for (let i = 0; i < maquinasConIP.length; i++) {
                    const item = maquinasConIP[i];
                    try {
                        const dataToSend: InstalacionFormData = {
                            maquina_id: item.maquina.id_maquina,
                            area_id: item.area_id || 0,
                            contrato_id: formData.contrato_id,
                            ip_address: item.ip_address.trim(),
                            fecha_instalacion: formData.fecha_instalacion,
                            observaciones: item.observaciones?.trim() || undefined,
                            costo_renta_mensual: item.costo_renta_mensual || 0,
                            contador_acumulativo: item.contador_acumulativo,
                            contabilidad_por_usuario: item.contabilidad_por_usuario
                        };
                        await createInstalacion(dataToSend);
                        successCount++;
                        setCreationProgress({ current: i + 1, total: maquinasConIP.length });
                    } catch (err: any) {
                        actionErrors.push({
                            maquina: item.maquina.serie,
                            error: err.response?.data?.message || err.message || 'Error desconocido'
                        });
                    }
                }

                if (actionErrors.length > 0) {
                    const details = actionErrors.map(e => ({ label: `Serie ${e.maquina}`, text: e.error }));
                    if (successCount > 0) {
                        mostrarModal('Instalación Parcial', `Se instalaron ${successCount} máquinas, pero hubo problemas con algunas:`, 'warning', details);
                        resetForm();
                        onSuccess(false);
                    } else {
                        mostrarModal('Error de Instalación', 'No se pudo completar la instalación. Revise los errores:', 'warning', details);
                    }
                } else {
                    resetForm();
                    onSuccess(true);
                }

            } else {
                const dataToSend: InstalacionFormData = {
                    maquina_id: formData.maquina_id,
                    area_id: formData.area_id,
                    contrato_id: formData.contrato_id,
                    ip_address: formData.ip_address.trim(),
                    fecha_instalacion: formData.fecha_instalacion,
                    observaciones: formData.observaciones?.trim() || undefined,
                    costo_renta_mensual: formData.costo_renta_mensual || 0,
                    contador_acumulativo: formData.contador_acumulativo,
                    contabilidad_por_usuario: formData.contabilidad_por_usuario
                };
                await createInstalacion(dataToSend);
                resetForm();
                onSuccess(true);
            }

        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Ocurrió un error al procesar la solicitud.';
            mostrarModal('Error Inesperado', errorMessage, 'warning');
        } finally {
            setSubmitting(false);
            setCreationProgress({ current: 0, total: 0 });
        }
    };

    const canSubmit = selectedClienteId && formData.contrato_id > 0 &&
        (multipleSelection ? maquinasConIP.length > 0 : formData.area_id > 0 && formData.maquina_id > 0 && formData.ip_address.trim() !== '') && !submitting;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
            <ModalConfirmacion
                isOpen={modalConfig.isOpen}
                onClose={handleCloseModal}
                onConfirm={handleCloseModal}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText="Entendido"
                showCancel={false}
            />

            <div className="mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">Nueva Instalación{multipleSelection ? ' (Múltiple)' : ''}</h2>
                <p className="text-sm text-gray-600 mt-1">
                    {multipleSelection ? 'Agrega múltiples máquinas con sus respectivas direcciones IP y Áreas' : 'Instala una máquina en el área de un cliente con un contrato específico'}
                </p>
            </div>

            {submitting && creationProgress.total > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-blue-800">Creando instalaciones...</p>
                        <span className="text-sm text-blue-700 font-bold">{creationProgress.current} / {creationProgress.total}</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${(creationProgress.current / creationProgress.total) * 100}%` }} />
                    </div>
                </div>
            )}

            <div className="mb-6">
                <InstalacionFormFields
                    formData={formData}
                    onSelectCliente={handleSelectCliente}
                    onSelectArea={handleSelectArea}
                    onSelectContrato={handleSelectContrato}
                    onSelectMaquina={handleSelectMaquina}
                    onChangeIP={handleChangeIP}
                    onChangeFecha={(val) => setFormData(prev => ({ ...prev, fecha_instalacion: val }))}
                    onChangeObservaciones={handleChangeObservaciones}
                    onChangeCostoRenta={handleChangeCostoRenta}
                    onChangeContadorAcumulativo={handleChangeContadorAcumulativo}
                    onChangeContabilidadUsuario={handleChangeContabilidadUsuario}
                    allClients={clientesDisponibles}
                    multipleSelection={multipleSelection}
                    maquinasConIP={maquinasConIP}
                    onAddMaquina={handleAddMaquina}
                    onRemoveMaquina={handleRemoveMaquina}
                    onUpdateMaquinaIP={handleUpdateMaquinaIP}
                    onUpdateMaquinaFecha={handleUpdateMaquinaFecha}
                    onUpdateMaquinaObservaciones={handleUpdateMaquinaObservaciones}
                    onUpdateMaquinaRenta={handleUpdateMaquinaRenta}
                    onUpdateMaquinaContador={handleUpdateMaquinaContador}
                    onUpdateMaquinaContabilidad={handleUpdateMaquinaContabilidad}
                    onUpdateMaquinaArea={handleUpdateMaquinaArea}
                />
            </div>

            {formData.contrato_id > 0 && (multipleSelection ? maquinasConIP.length > 0 : formData.maquina_id > 0 && formData.area_id > 0) && (
                <div className="mb-6 p-4 bg-gradient-to-r from-edit/10 to-edit-hover/5 border border-edit-hover rounded-lg">
                    <p className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                        <SummarizeIcon fontSize="small" /> {multipleSelection && maquinasConIP.length > 1 ? 'Resumen de las instalaciones' : 'Resumen de la instalación'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {multipleSelection ? (
                            <div className="rounded px-3 py-2 md:col-span-2">
                                <span className="text-gray-600 block text-xs mb-1">Máquinas a instalar:</span>
                                <span className="font-semibold text-gray-900">{maquinasConIP.length} (Áreas independientes)</span>
                            </div>
                        ) : (
                            <>
                                <div className="rounded px-3 py-2"><span className="text-gray-600 block text-xs mb-1">Máquina ID:</span><span className="font-semibold text-gray-900">{formData.maquina_id}</span></div>
                                <div className="rounded px-3 py-2"><span className="text-gray-600 block text-xs mb-1">Área Global:</span><span className="font-semibold uppercase text-gray-900">{selectedNames.area || formData.area_id}</span></div>
                            </>
                        )}
                        <div className="rounded px-3 py-2 md:col-span-2"><span className="text-gray-600 block text-xs mb-1">Cliente:</span><span className="font-semibold uppercase text-gray-900">{selectedNames.cliente}</span></div>
                        <div className="rounded px-3 py-2 md:col-span-2"><span className="text-gray-600 block text-xs mb-1">Contrato:</span><span className="font-semibold uppercase text-gray-900">{selectedNames.contrato || formData.contrato_id}</span></div>
                    </div>
                </div>
            )}

            <InstalacionFormAction
                onSave={handleSubmit}
                onCancel={onCancel}
                isSubmitting={submitting}
                isDisabled={!canSubmit}
                submitLabel={multipleSelection && maquinasConIP.length > 0 ? `Crear ${maquinasConIP.length} ${maquinasConIP.length === 1 ? 'instalación' : 'instalaciones'}` : 'Crear instalación'}
                loadingLabel={creationProgress.total > 0 ? `Creando ${creationProgress.current}/${creationProgress.total}...` : 'Creando instalación...'}
            />
        </div>
    );
};

export default InstalacionForm;
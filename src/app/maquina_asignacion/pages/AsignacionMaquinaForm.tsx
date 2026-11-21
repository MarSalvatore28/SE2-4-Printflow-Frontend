import React, { useState, useEffect } from 'react';
import { InstalacionFormFields, type MaquinaConIP } from '@app/maquina_asignacion/components/AsignacionMaquinaDetailsFields';
import InstalacionFormAction from '@app/maquina_asignacion/components/AsignacionMaquinaFormAction';
import { type InstalacionFormData, type MaquinaSinInstalacion } from '@models/Instalacion/Instalacion.types';
import { type Client } from '@models/Cliente/cliente.types';
import { createInstalacion } from '@services/Instalaciones/instalaciones.service';
import SummarizeIcon from '@mui/icons-material/Summarize';
import ModalConfirmacion from '@components/Shared/ModalConfirmacion';
import {
    datosDeFormulario,
    datosDeMaquina,
    detallesDeErrores,
    mensajeDeError,
    puedeEnviarInstalacion,
    validarFormularioInstalacion,
} from '@app/maquina_asignacion/utils/formularioInstalacion';
import { etiquetaMaquina, fechaCorta, hoyIso } from '@app/maquina_asignacion/utils/instalaciones';

type DetalleModal = Array<{ label: string, text: string }>;

// Crea una instalación por máquina, sin detenerse si alguna falla
const crearInstalaciones = async (
    maquinas: MaquinaConIP[],
    datos: InstalacionFormData,
    onProgreso: (actual: number) => void,
) => {
    const errores: Array<{ maquina: string; error: string }> = [];
    const instaladas: number[] = [];
    for (let i = 0; i < maquinas.length; i++) {
        const item = maquinas[i];
        try {
            await createInstalacion(datosDeMaquina(item, datos)); // NOSONAR: de a una, en orden, para mostrar el avance (n de total) sin cargar la API
            instaladas.push(item.maquina.id_maquina);
            onProgreso(i + 1);
        } catch (err: unknown) {
            errores.push({ maquina: item.maquina.serie, error: mensajeDeError(err, 'Error desconocido') });
        }
    }
    return { instaladas, errores };
};

const ResumenInstalacion = ({
    multipleSelection,
    maquinasConIP,
    formData,
    selectedNames,
}: {
    multipleSelection: boolean;
    maquinasConIP: MaquinaConIP[];
    formData: InstalacionFormData;
    selectedNames: { cliente: string; area: string; contrato: string; maquina: string };
}) => (
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
                    <div className="rounded px-3 py-2"><span className="text-gray-600 block text-xs mb-1">Máquina:</span><span className="font-semibold text-gray-900">{selectedNames.maquina}</span></div>
                    <div className="rounded px-3 py-2"><span className="text-gray-600 block text-xs mb-1">Área global:</span><span className="font-semibold uppercase text-gray-900">{selectedNames.area}</span></div>
                </>
            )}
            <div className="rounded px-3 py-2 md:col-span-2"><span className="text-gray-600 block text-xs mb-1">Cliente:</span><span className="font-semibold uppercase text-gray-900">{selectedNames.cliente}</span></div>
            <div className="rounded px-3 py-2 md:col-span-2"><span className="text-gray-600 block text-xs mb-1">Contrato:</span><span className="font-semibold text-gray-900">{selectedNames.contrato}</span></div>
            <div className="rounded px-3 py-2 md:col-span-2"><span className="text-gray-600 block text-xs mb-1">Fecha de instalación:</span><span className="font-semibold text-gray-900">{fechaCorta(formData.fecha_instalacion)}</span></div>
        </div>
    </div>
);

const etiquetaEnviar = (multiple: boolean, cantidad: number) => {
    if (!multiple || cantidad === 0) return 'Crear instalación';
    return `Crear ${cantidad} ${cantidad === 1 ? 'instalación' : 'instalaciones'}`;
};

interface InstalacionFormProps {
    onSuccess: (showSuccessModal?: boolean, count?: number) => void;
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
        fecha_instalacion: hoyIso()
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
    // Máquinas que ya se instalaron en un envío parcial: dejan de ofrecerse
    const [yaInstaladas, setYaInstaladas] = useState<number[]>([]);
    const [creationProgress, setCreationProgress] = useState({ current: 0, total: 0 });

    const [selectedNames, setSelectedNames] = useState({
        cliente: '',
        area: '',
        contrato: '',
        maquina: ''
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
            fecha_instalacion: hoyIso()
        });
        setSelectedClienteId(undefined);
        setMaquinasConIP([]);
        setSelectedNames({ cliente: '', area: '', contrato: '', maquina: '' });
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
                fecha_instalacion: hoyIso()
            }));
            setMaquinasConIP([]);
            setSelectedNames(prev => ({ ...prev, area: '', contrato: '', maquina: '' }));
        }
    }, [selectedClienteId]);

    const mostrarModal = (
        title: string,
        message: string,
        type: 'warning' | 'activate' | 'delete' | 'info' = 'warning',
        details?: DetalleModal
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

    const handleSelectMaquina = (maquina: MaquinaSinInstalacion) => {
        setFormData(prev => ({ ...prev, maquina_id: maquina.id_maquina }));
        setSelectedNames(prev => ({ ...prev, maquina: etiquetaMaquina(maquina) }));
        setValidationErrors({});
    };

    const handleAddMaquina = (maquina: MaquinaSinInstalacion) => {
        setMaquinasConIP(prev => [...prev, {
            maquina,
            ip_address: '',
            observaciones: '',
            fecha_instalacion: hoyIso(),
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
        const errors = validarFormularioInstalacion({
            clienteId: selectedClienteId,
            datos: formData,
            multiple: multipleSelection,
            maquinas: maquinasConIP,
            hoy: hoyIso(),
        });

        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            mostrarModal('Formulario incompleto', 'Por favor, revise los siguientes campos antes de guardar:', 'warning', detallesDeErrores(errors));
            return false;
        }
        return true;
    };

    const crearVarias = async () => {
        const total = maquinasConIP.length;
        setCreationProgress({ current: 0, total });
        const { instaladas, errores } = await crearInstalaciones(maquinasConIP, formData, (actual) =>
            setCreationProgress({ current: actual, total })
        );

        if (errores.length === 0) {
            resetForm();
            onSuccess(true, instaladas.length);
            return;
        }
        const details = errores.map(e => ({ label: `Serie ${e.maquina}`, text: e.error }));
        if (instaladas.length > 0) {
            // Antes se reiniciaba el formulario y el aviso se perdía. Ahora quedan solo las que
            // fallaron, con sus datos, para corregirlas y volver a enviar.
            setMaquinasConIP(prev => prev.filter(item => !instaladas.includes(item.maquina.id_maquina)));
            setYaInstaladas(prev => [...prev, ...instaladas]);
            const cuantas = instaladas.length === 1 ? 'Se instaló 1 máquina' : `Se instalaron ${instaladas.length} máquinas`;
            mostrarModal('Instalación parcial', `${cuantas}. Las que fallaron siguen en la lista para corregirlas:`, 'warning', details);
        } else {
            mostrarModal('Error de instalación', 'No se pudo completar la instalación. Revise los errores:', 'warning', details);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setSubmitting(true);

            if (multipleSelection && maquinasConIP.length > 0) {
                await crearVarias();
            } else {
                await createInstalacion(datosDeFormulario(formData));
                resetForm();
                onSuccess(true);
            }

        } catch (err: unknown) {
            mostrarModal('Error inesperado', mensajeDeError(err, 'Ocurrió un error al procesar la solicitud.'), 'warning');
        } finally {
            setSubmitting(false);
            setCreationProgress({ current: 0, total: 0 });
        }
    };

    const canSubmit = !submitting && puedeEnviarInstalacion({
        clienteId: selectedClienteId,
        datos: formData,
        multiple: multipleSelection,
        maquinas: maquinasConIP,
    });
    const hayResumen = formData.contrato_id > 0 &&
        (multipleSelection ? maquinasConIP.length > 0 : formData.maquina_id > 0 && formData.area_id > 0);

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 relative">
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
                <h2 className="text-xl font-bold text-gray-800">Nueva instalación{multipleSelection ? ' (múltiple)' : ''}</h2>
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
                    onUpdateMaquinaObservaciones={handleUpdateMaquinaObservaciones}
                    onUpdateMaquinaRenta={handleUpdateMaquinaRenta}
                    onUpdateMaquinaContador={handleUpdateMaquinaContador}
                    onUpdateMaquinaContabilidad={handleUpdateMaquinaContabilidad}
                    onUpdateMaquinaArea={handleUpdateMaquinaArea}
                    excluirMaquinas={yaInstaladas}
                />
            </div>

            {hayResumen && (
                <ResumenInstalacion
                    multipleSelection={multipleSelection}
                    maquinasConIP={maquinasConIP}
                    formData={formData}
                    selectedNames={selectedNames}
                />
            )}

            <InstalacionFormAction
                onSave={handleSubmit}
                onCancel={onCancel}
                isSubmitting={submitting}
                isDisabled={!canSubmit}
                submitLabel={etiquetaEnviar(multipleSelection, maquinasConIP.length)}
                loadingLabel={creationProgress.total > 0 ? `Creando ${creationProgress.current}/${creationProgress.total}...` : 'Creando instalación...'}
            />
        </div>
    );
};

export default InstalacionForm;
import { useState, useEffect, useCallback, useRef } from 'react';
import { InstalacionesList } from '../components/AsignacionMaquinaList';
import { InstalacionForm } from '../pages/AsignacionMaquinaForm';
import ModalConfirmacion from '@components/Shared/ModalConfirmacion';
import BusquedaInteligenteClientes from '@app/Clientes/components/BusquedaInteligenteClientes';
import { type InstalacionActivaCliente, type RetirarInstalacionFormData } from '@models/Instalacion/Instalacion.types';
import { type ClienteParaTabla as Client } from '@models/Cliente/cliente.types';
import { fetchAllClientes } from '@services/Clientes/clientes.service';
import {
    getInstalacionesActivasByCliente,
    retirarInstalacion,
    updateInstalacion
} from '@services/Instalaciones/instalaciones.service';
import { X } from 'lucide-react';
import { AvisoSoloLectura } from '@components/auth/AvisoSoloLectura';
import { usePermisos } from '@hooks/usePermisos';
import { ModalEditarInstalacion } from '@app/maquina_asignacion/components/ModalEditarInstalacion';
import {
    datosEdicionDe,
    datosEdicionVacios,
    filtrarInstalaciones,
    type DatosEdicionInstalacion,
} from '@app/maquina_asignacion/utils/instalaciones';
import { clasePestana } from '@utils/pestanas';

// Instalaciones activas de un cliente, o de todos los clientes si no se indica
const cargarInstalaciones = async (clienteId?: number): Promise<InstalacionActivaCliente[]> => {
    if (clienteId) return getInstalacionesActivasByCliente(clienteId);
    const clientes = await fetchAllClientes();
    const porCliente = await Promise.all(
        clientes.map((cliente: Client) => getInstalacionesActivasByCliente(cliente.id_cliente))
    );
    return porCliente.flat();
};

const InstalacionesPage = () => {
    // Nueva instalación, editar IP y retirar: solo admin (el operador y el auditor consultan)
    const { puedeEditarCatalogos } = usePermisos();
    const [activeTab, setActiveTab] = useState<'agregar' | 'listar'>('listar');

    const [instalaciones, setInstalaciones] = useState<InstalacionActivaCliente[]>([]);
    const [clientsList, setClientsList] = useState<Client[]>([]);
    const [formKey, setFormKey] = useState(0);

    const [filterClientId, setFilterClientId] = useState<number | null>(null);
    const [filterTerm, setFilterTerm] = useState<string>('');

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successModal, setSuccessModal] = useState<{ isOpen: boolean; message: string }>({
        isOpen: false,
        message: ''
    });

    const [lastActionWasEdit, setLastActionWasEdit] = useState(false);

    const [modalRetirar, setModalRetirar] = useState<{
        isOpen: boolean;
        instalacion: InstalacionActivaCliente | null;
        observaciones: string;
    }>({
        isOpen: false,
        instalacion: null,
        observaciones: ''
    });

    // Fecha de retiro (por defecto hoy, en hora local)
    const hoy = () => new Date().toLocaleDateString('en-CA');
    const [fechaRetiro, setFechaRetiro] = useState<string>(hoy());

    const [modalEdit, setModalEdit] = useState<{
        isOpen: boolean;
        instalacion: InstalacionActivaCliente | null;
        editData: DatosEdicionInstalacion;
    }>({
        isOpen: false,
        instalacion: null,
        editData: datosEdicionVacios()
    });

    const fetchInstalaciones = useCallback(async (clienteId?: number) => {
        setLoading(true);
        setError(null);
        try {
            setInstalaciones(await cargarInstalaciones(clienteId));
        } catch (err) {
            console.error('Error fetching instalaciones:', err);
            setError('Error al cargar las instalaciones. Por favor, intente de nuevo.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const clientsData = await fetchAllClientes();
            setClientsList(clientsData);
            await fetchInstalaciones();
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Error al cargar los datos. Por favor, intente de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [fetchInstalaciones]);

    useEffect(() => {
        void fetchAllData();
    }, [fetchAllData]);

    // Cliente filtrado al volver a la lista, sin recargar cada vez que cambia el filtro
    const filtroClienteRef = useRef(filterClientId);
    useEffect(() => {
        filtroClienteRef.current = filterClientId;
    }, [filterClientId]);

    useEffect(() => {
        if (activeTab === 'listar') {
            void fetchInstalaciones(filtroClienteRef.current ?? undefined);
        }
    }, [activeTab, fetchInstalaciones]);

    const handleInstalacionSuccess = async (showSuccessModal: boolean = true, count: number = 1) => {
        setFormKey(prev => prev + 1); // Fuerza remontaje del form para limpiar estado visual
        if (showSuccessModal) {
            setSuccessModal({
                isOpen: true,
                message: count > 1
                    ? `Se crearon ${count} instalaciones exitosamente.`
                    : 'Instalación creada exitosamente.'
            });
        }
        await fetchAllData();
    };

    const handleCloseSuccessModal = async () => {
        setSuccessModal(prev => ({ ...prev, isOpen: false }));
        // Solo recargar si fue una creación, no una edición (para no colapsar los paneles)
        if (!lastActionWasEdit) {
            await fetchAllData();
        }
        setLastActionWasEdit(false);
    };

    const handleCancel = () => {
        setActiveTab('listar');
    };

    const handleEditInstalacion = (instalacion: InstalacionActivaCliente) => {
        setModalEdit({
            isOpen: true,
            instalacion: instalacion,
            editData: datosEdicionDe(instalacion)
        });
    };

    const handleConfirmEdit = async () => {
        const { instalacion, editData } = modalEdit;

        if (!instalacion || !editData.ip_address.trim()) {
            setError('Debe ingresar una dirección IP válida');
            return;
        }

        try {
            setLoading(true);

            await updateInstalacion(instalacion.id_instalacion, editData);

            // Actualizar solo ese registro en el estado local para no colapsar los paneles
            setInstalaciones(prev => prev.map(inst =>
                inst.id_instalacion === instalacion.id_instalacion
                    ? {
                        ...inst,
                        ip_address: editData.ip_address,
                        costo_renta_mensual: editData.costo_renta_mensual,
                        contador_acumulativo: editData.contador_acumulativo,
                        contabilidad_por_usuario: editData.contabilidad_por_usuario,
                        fecha_instalacion: editData.fecha_instalacion
                    }
                    : inst
            ));

            setLastActionWasEdit(true);
            setSuccessModal({
                isOpen: true,
                message: `Instalación actualizada exitosamente`
            });

            handleCloseModalEdit();

        } catch (err: unknown) {
            const error = err as { message?: string };
            console.error('Error actualizando instalación:', err);
            setError(error.message || 'No se pudo actualizar la instalación.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModalEdit = () => {
        setModalEdit(prev => ({ ...prev, isOpen: false, instalacion: null }));
    };

    const handleRetirarInstalacion = (instalacion: InstalacionActivaCliente) => {
        setFechaRetiro(hoy());
        setModalRetirar({
            isOpen: true,
            instalacion: instalacion,
            observaciones: ''
        });
    };

    const handleConfirmRetirar = async () => {
        const { instalacion, observaciones } = modalRetirar;

        if (!instalacion) return;

        try {
            setLoading(true);
            const formData: RetirarInstalacionFormData = {
                observaciones_retiro: observaciones || undefined,
                fecha_retiro: fechaRetiro
            };

            await retirarInstalacion(instalacion.id_instalacion, formData);

            // Eliminar el registro del estado local para no colapsar los paneles
            setInstalaciones(prev =>
                prev.filter(inst => inst.id_instalacion !== instalacion.id_instalacion)
            );

            setLastActionWasEdit(true);
            setSuccessModal({
                isOpen: true,
                message: `Instalación de la máquina ${instalacion.serie} retirada exitosamente`
            });

            setModalRetirar({
                isOpen: false,
                instalacion: null,
                observaciones: ''
            });

        } catch (err: unknown) {
            const error = err as { message?: string };
            console.error('Error retirando instalación:', err);
            setError(error.message || 'No se pudo retirar la instalación.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModalRetirar = () => {
        setModalRetirar({
            isOpen: false,
            instalacion: null,
            observaciones: ''
        });
    };

    const handleSelectCliente = (cliente: Client) => {
        setFilterClientId(cliente.id_cliente);
        setFilterTerm('');
        void fetchInstalaciones(cliente.id_cliente);
    };

    const handleRefresh = () => {
        setFilterClientId(null);
        setFilterTerm('');
        void fetchInstalaciones();
    };

    const displayedInstalaciones = filtrarInstalaciones(instalaciones, filterTerm);

    // Lista: cargando, el error o las instalaciones
    const renderLista = () => {
        if (loading) {
            return (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            );
        }
        if (error) {
            return (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 italic">
                    {error}
                </div>
            );
        }
        return (
            <InstalacionesList
                instalaciones={displayedInstalaciones}
                onEdit={puedeEditarCatalogos ? handleEditInstalacion : undefined}
                onRetirar={puedeEditarCatalogos ? handleRetirarInstalacion : undefined}
                loading={loading}
            />
        );
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 mt-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Instalaciones</h1>
            {!puedeEditarCatalogos && <AvisoSoloLectura acciones="crear, editar o retirar instalaciones" />}

            {/* Tabs */}
            <div className="flex flex-wrap border-b border-gray-100 p-2 gap-2 md:gap-4">
                <button
                    onClick={() => setActiveTab('listar')}
                    className={clasePestana(activeTab === 'listar')}
                >
                    Listar instalaciones
                </button>
                {puedeEditarCatalogos && (
                <button
                    onClick={() => setActiveTab('agregar')}
                    className={clasePestana(activeTab === 'agregar')}
                >
                    Nueva instalación
                </button>
                )}
            </div>

            {/* Content */}
            <div className="py-4 md:p-8">
                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-800">Error</p>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'agregar' ? (
                    <InstalacionForm
                        key={formKey}
                        onSuccess={handleInstalacionSuccess}
                        onCancel={handleCancel}
                        clientesDisponibles={clientsList}
                        multipleSelection={true}
                    />
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* Filtros */}
                        <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filtrar por Cliente
                                </label>
                                <BusquedaInteligenteClientes
                                    onSeleccionar={handleSelectCliente}
                                    placeholder="Buscar por cliente..."
                                    itemsCompletos={clientsList}
                                    onClear={() => {
                                        setFilterClientId(null);
                                        void fetchInstalaciones();
                                    }}
                                />
                            </div>

                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Búsqueda general
                                </label>
                                <input
                                    type="text"
                                    placeholder="Buscar por serie, modelo, área o IP..."
                                    value={filterTerm}
                                    onChange={(e) => setFilterTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium h-[42px]"
                            >
                                Ver todos
                            </button>
                        </div>

                        {/* Lista */}
                        {renderLista()}
                    </div>
                )}
            </div>

            {/* Modal Retirar Instalación */}
            <ModalConfirmacion
                isOpen={modalRetirar.isOpen}
                onClose={handleCloseModalRetirar}
                onConfirm={handleConfirmRetirar}
                type="delete"
                title="¿Retirar instalación?"
                message={
                    <>
                        <p className="mb-4">
                            ¿Estás seguro de que deseas retirar la instalación de la máquina{' '}
                            <strong>{modalRetirar.instalacion?.serie}</strong>?
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                            Área: <strong>{modalRetirar.instalacion?.area_nombre}</strong>
                        </p>
                        <div className="mt-4">
                            <label htmlFor="fecha_retiro" className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha de retiro
                            </label>
                            <input
                                id="fecha_retiro"
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                value={fechaRetiro}
                                onChange={(e) => setFechaRetiro(e.target.value)}
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Observaciones del retiro (opcional)
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                rows={3}
                                placeholder="Motivo del retiro, estado de la máquina, etc..."
                                value={modalRetirar.observaciones}
                                onChange={(e) =>
                                    setModalRetirar({ ...modalRetirar, observaciones: e.target.value })
                                }
                            />
                        </div>
                    </>
                }
                confirmText="Retirar instalación"
                cancelText="Cancelar"
            />

            {modalEdit.isOpen && modalEdit.instalacion && (
                <ModalEditarInstalacion
                    instalacion={modalEdit.instalacion}
                    datos={modalEdit.editData}
                    onCambiar={(editData) => setModalEdit(prev => ({ ...prev, editData }))}
                    onCerrar={handleCloseModalEdit}
                    onGuardar={handleConfirmEdit}
                    guardando={loading}
                />
            )}

            <ModalConfirmacion
                isOpen={successModal.isOpen}
                onClose={handleCloseSuccessModal}
                onConfirm={handleCloseSuccessModal}
                title="Éxito"
                message={successModal.message}
                type="activate"
                confirmText="Aceptar"
                showCancel={false}
            />
        </div>
    );
};

export default InstalacionesPage;
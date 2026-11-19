import { useState, useEffect } from 'react';
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

    const [, setInstalacionEnEdicion] = useState<InstalacionActivaCliente | null>(null);
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
        editData: {
            ip_address: string;
            costo_renta_mensual: number;
            contador_acumulativo: boolean;
            contabilidad_por_usuario: boolean;
            fecha_instalacion: string;
        };
    }>({
        isOpen: false,
        instalacion: null,
        editData: { ip_address: '', costo_renta_mensual: 0, contador_acumulativo: true, contabilidad_por_usuario: false, fecha_instalacion: new Date().toISOString().split('T')[0] }
    });

    const fetchInstalaciones = async (clienteId?: number) => {
        setLoading(true);
        setError(null);
        try {
            let data: InstalacionActivaCliente[];

            if (clienteId) {
                data = await getInstalacionesActivasByCliente(clienteId);
            } else {
                const clientes = await fetchAllClientes();
                const allInstalacionesPromises = clientes.map((cliente: Client) =>
                    getInstalacionesActivasByCliente(cliente.id_cliente)
                );
                const allInstalacionesArrays = await Promise.all(allInstalacionesPromises);
                data = allInstalacionesArrays.flat();
            }

            setInstalaciones(data);
        } catch (err) {
            console.error('Error fetching instalaciones:', err);
            setError('Error al cargar las instalaciones. Por favor, intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllData = async () => {
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
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        if (activeTab === 'listar') {
            setInstalacionEnEdicion(null);

            if (filterClientId) {
                fetchInstalaciones(filterClientId);
            } else {
                fetchInstalaciones();
            }
        }
    }, [activeTab]);

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
        setInstalacionEnEdicion(null);
        // Solo recargar si fue una creación, no una edición (para no colapsar los paneles)
        if (!lastActionWasEdit) {
            await fetchAllData();
        }
        setLastActionWasEdit(false);
    };

    const handleCancel = () => {
        setInstalacionEnEdicion(null);
        setActiveTab('listar');
    };

    const handleEditInstalacion = (instalacion: InstalacionActivaCliente) => {
        setModalEdit({
            isOpen: true,
            instalacion: instalacion,
            editData: {
                ip_address: instalacion.ip_address || '',
                costo_renta_mensual: instalacion.renta_equipo ? (Number(instalacion.costo_renta_mensual) || 0) : 0,
                contador_acumulativo: instalacion.contador_acumulativo !== false,
                contabilidad_por_usuario: instalacion.contabilidad_por_usuario === true,
                fecha_instalacion: instalacion.fecha_instalacion
                    ? instalacion.fecha_instalacion.split('T')[0]
                    : new Date().toISOString().split('T')[0]
            }
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
        fetchInstalaciones(cliente.id_cliente);
    };

    const handleRefresh = () => {
        setFilterClientId(null);
        setFilterTerm('');
        fetchInstalaciones();
    };

    const displayedInstalaciones = instalaciones.filter(instalacion => {
        if (filterTerm) {
            const searchWords = filterTerm.toLowerCase().split(' ').filter(word => word.length > 0);
            return searchWords.every(word =>
                instalacion.serie?.toLowerCase().includes(word) ||
                instalacion.modelo_nombre?.toLowerCase().includes(word) ||
                instalacion.area_nombre?.toLowerCase().includes(word) ||
                instalacion.ip_address?.toLowerCase().includes(word)
            );
        }

        return true;
    });

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Instalaciones</h1>
            {!puedeEditarCatalogos && <AvisoSoloLectura acciones="crear, editar o retirar instalaciones" />}

            {/* Tabs */}
            <div className="flex border-b border-gray-100 p-2 gap-4">
                <button
                    onClick={() => setActiveTab('listar')}
                    className={`px-6 py-2 rounded-md transition-all ${activeTab === 'listar'
                        ? 'bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium'
                        : 'text-gray-500 hover:text-gray-800'
                        }`}
                >
                    Listar instalaciones
                </button>
                {puedeEditarCatalogos && (
                <button
                    onClick={() => {
                        setInstalacionEnEdicion(null);
                        setActiveTab('agregar');
                    }}
                    className={`px-6 py-2 rounded-md transition-all ${activeTab === 'agregar'
                        ? 'bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium'
                        : 'text-gray-500 hover:text-gray-800'
                        }`}
                >
                    Nueva instalación
                </button>
                )}
            </div>

            {/* Content */}
            <div className="p-8">
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
                                        fetchInstalaciones();
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
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        ) : error ? (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 italic">
                                {error}
                            </div>
                        ) : (
                            <InstalacionesList
                                instalaciones={displayedInstalaciones}
                                onEdit={puedeEditarCatalogos ? handleEditInstalacion : undefined}
                                onRetirar={puedeEditarCatalogos ? handleRetirarInstalacion : undefined}
                                loading={loading}
                            />
                        )}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Editar instalación</h3>
                            <button
                                onClick={handleCloseModalEdit}
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
                                    {modalEdit.instalacion.serie}
                                </p>
                                <p className="my-1">
                                    <span className="font-semibold text-gray-900">Modelo:</span>{' '}
                                    {modalEdit.instalacion.modelo_nombre || 'Sin modelo'}
                                </p>
                                <p>
                                    <span className="font-semibold text-gray-900">Área:</span>{' '}
                                    {modalEdit.instalacion.area_nombre}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Dirección IP *
                                </label>
                                <input
                                    type="text"
                                    value={modalEdit.editData.ip_address}
                                    onChange={(e) =>
                                        setModalEdit({ ...modalEdit, editData: { ...modalEdit.editData, ip_address: e.target.value } })
                                    }
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
                                    value={modalEdit.editData.fecha_instalacion}
                                    onChange={(e) =>
                                        setModalEdit({ ...modalEdit, editData: { ...modalEdit.editData, fecha_instalacion: e.target.value } })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                                />
                            </div>

                            {modalEdit.instalacion?.renta_equipo ? (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Costo de renta mensual ($)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={modalEdit.editData.costo_renta_mensual}
                                        onChange={(e) =>
                                            setModalEdit({ ...modalEdit, editData: { ...modalEdit.editData, costo_renta_mensual: Number(e.target.value) } })
                                        }
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
                                        checked={modalEdit.editData.contador_acumulativo}
                                        onChange={(e) =>
                                            setModalEdit({ ...modalEdit, editData: { ...modalEdit.editData, contador_acumulativo: e.target.checked } })
                                        }
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700">Contador acumulativo</span>
                                </label>

                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={modalEdit.editData.contabilidad_por_usuario}
                                        onChange={(e) =>
                                            setModalEdit({ ...modalEdit, editData: { ...modalEdit.editData, contabilidad_por_usuario: e.target.checked } })
                                        }
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700">Requiere detalle por usuario</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2 border-t border-gray-100">
                            <button
                                onClick={handleCloseModalEdit}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmEdit}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                disabled={loading || !modalEdit.editData.ip_address.trim()}
                            >
                                {loading ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
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
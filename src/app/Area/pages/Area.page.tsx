import { useState, useEffect, useCallback } from 'react';
import AreaList from '@app/Area/components/AreaList';
import BusquedaInteligenteAreas from '@app/Area/components/BusquedaInteligenteAreas';
import ModalConfirmacion from '@components/Shared/ModalConfirmacion';
import ModalAdvertencia from '@components/Shared/ModalAdvertencia';
import { AvisoSoloLectura } from '@components/auth/AvisoSoloLectura';
import { usePermisos } from '@hooks/usePermisos';
import AreasFormPage from './AreasForm.page';
import { fetchAllClientes } from '@services/Clientes/clientes.service';
import { type Client } from '../../Clientes/types';
import { filtrarAreas } from '@app/Area/utils/filtrarAreas';
import { clasePestana } from '@utils/pestanas';

import {
    type Area,
    type AreaFormData,
    fetchAllAreas,
    updateArea,
    deleteArea,
    createArea,
    activarArea
} from '../types';

const INITIAL_FORM_STATE: Partial<Area> = {
    nombre: '',
    descripcion: '',
    cliente_id: undefined,
    activo: 1
};

type AccionModal = 'delete' | 'activate';

// Título, mensaje y botón del modal de desactivar o activar un área
const TEXTOS_MODAL: Record<AccionModal, { titulo: string; mensaje: (nombre?: string) => string; boton: string }> = {
    delete: {
        titulo: '¿Desactivar área?',
        mensaje: (nombre) => `¿Estás seguro de que deseas desactivar el área "${nombre}"? Podrás reactivarla después si lo necesitas.`,
        boton: 'Desactivar',
    },
    activate: {
        titulo: '¿Activar área?',
        mensaje: (nombre) => `¿Deseas activar el área "${nombre}"?`,
        boton: 'Activar',
    },
};

const EncabezadoFormulario = ({ editando }: { editando: boolean }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">
            {editando ? 'Editar área' : 'Nueva área'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
            {editando
                ? 'Modifica la información del área seleccionada.'
                : 'Ingresa los datos para registrar una nueva área y vincúlala a un cliente.'}
        </p>
    </div>
);

const AreaPage = () => {
    // Crear, editar y desactivar áreas: solo admin (el operador y el auditor consultan)
    const { puedeEditarCatalogos } = usePermisos();
    const [activeTab, setActiveTab] = useState<'agregar' | 'listar'>('listar');
    const [allAreas, setAllAreas] = useState<Area[]>([]);
    const [clientsList, setClientsList] = useState<Client[]>([]);

    const [filterClientId, setFilterClientId] = useState<number | null>(null);
    const [filterAreaId, setFilterAreaId] = useState<number | null>(null);
    const [filterTerm, setFilterTerm] = useState<string>('');
    const [showInactive, setShowInactive] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [editingArea, setEditingArea] = useState<Area | null>(null);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [formKey, setFormKey] = useState(0);

    const [successModal, setSuccessModal] = useState<{ isOpen: boolean; message: string }>({
        isOpen: false,
        message: ''
    });

    const [warningModal, setWarningModal] = useState<{ isOpen: boolean; message: string }>({
        isOpen: false,
        message: ''
    });

    const fetchAreas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAllAreas();
            setAllAreas(data);
        } catch (err) {
            console.error('Error fetching areas:', err);
            setError('Error al cargar la lista de áreas. Por favor, intente de nuevo.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAreasAndClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [areasData, clientsData] = await Promise.all([
                fetchAllAreas(),
                fetchAllClientes()
            ]);

            setAllAreas(areasData);
            setClientsList(clientsData);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Error al cargar los datos. Por favor, intente de nuevo.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchAreasAndClients();
    }, [fetchAreasAndClients]);

    useEffect(() => {
        if (activeTab === 'listar') {
            void fetchAreas();
        }
    }, [activeTab, fetchAreas]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'activo' || name === 'cliente_id') ? (value !== '' ? Number(value) : undefined) : value
        }));
    };

    const handleSelectCliente = (client: Client) => {
        setFormData(prev => ({
            ...prev,
            cliente_id: client.id_cliente,
            cliente_nombre: client.nombre
        }));
    };

    const handleCloseSuccessModal = () => {
        setSuccessModal(prev => ({ ...prev, isOpen: false }));

        if (editingArea) {
            setFormData(INITIAL_FORM_STATE);
            setFormKey(prev => prev + 1);
            setActiveTab('listar');
        } else {
            setFormData(prev => ({
                ...INITIAL_FORM_STATE,
                cliente_id: prev.cliente_id,
                cliente_nombre: prev.cliente_nombre
            }));
        }
        setEditingArea(null);
    };

    const handleSave = async () => {
        if (!formData.nombre || !formData.cliente_id) {
            setWarningModal({
                isOpen: true,
                message: 'El nombre y el cliente son campos obligatorios para poder guardar el área.'
            });
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const payload: AreaFormData = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion?.trim() || null,
                cliente_id: Number(formData.cliente_id),
                activo: Number(formData.activo)
            };

            if (editingArea?.id_area) {
                await updateArea(editingArea.id_area, payload);
            } else {
                await createArea(payload);
            }

            setSuccessModal({
                isOpen: true,
                message: editingArea ? 'Área actualizada correctamente' : 'Área agregada correctamente'
            });

        } catch (err) {
            console.error('Error saving area:', err);
            setError((err instanceof Error && err.message) || 'No se pudo guardar el área');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        setFormData(INITIAL_FORM_STATE);
        setFormKey(prev => prev + 1); // Limpia también el estado visual al cancelar
        setEditingArea(null);
        setActiveTab('listar');
    };

    const handleEdit = (area: Area) => {
        setEditingArea(area);
        setFormData({
            nombre: area.nombre,
            descripcion: area.descripcion || '',
            cliente_id: area.cliente_id,
            activo: area.activo
        });
        setActiveTab('agregar');
    };

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: AccionModal;
        area: Area | null;
    }>({
        isOpen: false,
        type: 'delete',
        area: null
    });

    const handleToggleActive = (area: Area) => {
        const actionType = area.activo === 1 ? 'delete' : 'activate';
        setModalConfig({
            isOpen: true,
            type: actionType,
            area: area
        });
    };

    const handleDelete = (area: Area) => {
        setModalConfig({
            isOpen: true,
            type: 'delete',
            area: area
        });
    };

    const handleConfirmModal = async () => {
        const { type, area } = modalConfig;

        if (!area) return;

        try {
            if (type === 'delete') {
                await deleteArea(area.id_area);
            } else {
                await activarArea(area.id_area);
            }
            void fetchAreas();
        } catch (err) {
            console.error('Error toggling area status:', err);
            setError('No se pudo cambiar el estado del área.');
        } finally {
            handleCloseModal();
        }
    };

    const handleCloseModal = () => {
        setModalConfig({
            isOpen: false,
            type: 'delete',
            area: null
        });
    };

    const handleRefresh = () => {
        setFilterClientId(null);
        setFilterAreaId(null);
        setFilterTerm('');
        void fetchAreas();
    };

    const handleEnterSearch = (termino: string) => {
        setFilterClientId(null);
        setFilterAreaId(null);
        setFilterTerm(termino.toLowerCase().trim());
    };

    const displayedAreas = filtrarAreas(allAreas, {
        mostrarInactivas: showInactive,
        areaId: filterAreaId,
        clienteId: filterClientId,
        termino: filterTerm,
    });
    const textosModal = TEXTOS_MODAL[modalConfig.type];
    // Sin permiso de edición la lista no muestra acciones
    const accionesLista = puedeEditarCatalogos
        ? { onEdit: handleEdit, onDelete: handleDelete, onToggleActive: handleToggleActive }
        : {};

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 mt-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de áreas</h1>
            {!puedeEditarCatalogos && <AvisoSoloLectura acciones="crear, editar o desactivar áreas" />}

            {/* Tabs - Iguales a Asignaciones */}
            <div className="flex flex-wrap border-b border-gray-100 p-2 gap-2 md:gap-4">
                <button
                    onClick={() => setActiveTab('listar')}
                    className={clasePestana(activeTab === 'listar')}
                >
                    Listar
                </button>
                {puedeEditarCatalogos && (
                <button
                    onClick={() => {
                        setEditingArea(null);
                        setFormData(INITIAL_FORM_STATE);
                        setActiveTab('agregar');
                    }}
                    className={clasePestana(activeTab === 'agregar')}
                >
                    {editingArea ? 'Editar área' : 'Agregar'}
                </button>
                )}
            </div>

            {/* Content con p-8 idéntico a asignaciones */}
            <div className="py-4 md:p-8 min-h-[400px]">
                {activeTab === 'agregar' ? (
                    // ✨ CONTENEDOR TIPO TARJETA IDÉNTICO AL DE INSTALACIONES ✨
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-8">
                        <EncabezadoFormulario editando={!!editingArea} />

                        <hr className="border-gray-200 mb-8" />

                        <AreasFormPage
                            key={formKey}
                            formData={formData}
                            onChange={handleFormChange}
                            onSelectCliente={handleSelectCliente}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            clientesDisponibles={clientsList}
                            isSubmitting={submitting}
                            isEditing={!!editingArea}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* Filtros */}
                        <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Buscar área
                                </label>
                                <BusquedaInteligenteAreas
                                    onSeleccionar={(a) => {
                                        setFilterAreaId(a.id_area);
                                        setFilterClientId(null);
                                        setFilterTerm('');
                                    }}
                                    onEnter={handleEnterSearch}
                                    onSearchClick={handleEnterSearch}
                                    onClear={() => {
                                        setFilterAreaId(null);
                                        setFilterClientId(null);
                                        setFilterTerm('');
                                    }}
                                    onInputChange={() => {
                                        if (filterAreaId || filterClientId) {
                                            setFilterAreaId(null);
                                            setFilterClientId(null);
                                        }
                                    }}
                                    itemsCompletos={allAreas}
                                />
                            </div>

                            <div className="flex items-center h-[42px] px-4 bg-white rounded-lg border border-gray-300">
                                <input
                                    id="showInactive"
                                    type="checkbox"
                                    checked={showInactive}
                                    onChange={(e) => setShowInactive(e.target.checked)}
                                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                                />
                                <label htmlFor="showInactive" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
                                    Mostrar inactivas
                                </label>
                            </div>

                            <button
                                onClick={handleRefresh}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium h-[42px]"
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
                            <AreaList
                                areas={displayedAreas}
                                {...accionesLista}
                            />
                        )}
                    </div>
                )}
            </div>

            <ModalConfirmacion
                isOpen={modalConfig.isOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmModal}
                type={modalConfig.type}
                title={textosModal.titulo}
                message={textosModal.mensaje(modalConfig.area?.nombre)}
                confirmText={textosModal.boton}
                cancelText="Cancelar"
            />

            <ModalConfirmacion
                isOpen={successModal.isOpen}
                onClose={handleCloseSuccessModal}
                onConfirm={() => { handleCloseSuccessModal() }}
                title="Éxito"
                message={successModal.message}
                type="activate"
                confirmText="Aceptar"
                showCancel={false}
            />

            <ModalAdvertencia
                isOpen={warningModal.isOpen}
                onClose={() => setWarningModal({ isOpen: false, message: '' })}
                message={warningModal.message}
            />
        </div>
    );
};

export default AreaPage;
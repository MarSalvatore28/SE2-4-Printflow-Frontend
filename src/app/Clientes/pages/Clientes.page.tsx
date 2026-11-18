import { useState, useEffect } from 'react';
import ClientesFormPage from '@app/Clientes/pages/ClientesForm.page';
import ContractFormPage from '@app/Clientes/pages/ContractForm.page';
import ClientList from '@app/Clientes/components/ClientList';
import BusquedaInteligenteClientes from '@app/Clientes/components/BusquedaInteligenteClientes';
import { DetalleClienteModal } from '@app/Clientes/components/Detalleclientemodal';
import ModalConfirmacion from '@components/Shared/ModalConfirmacion';
import ModalAdvertencia from '@components/Shared/ModalAdvertencia';
import {
    type ClienteParaTabla,
    fetchAllClientes,
    fetchClientesInactivos,
    updateCliente,
    createCliente,
    createContrato,
    getClienteCompleto,
    updateContrato,
    deleteCliente,
    activarCliente
} from '@app/Clientes/types';

const INITIAL_FORM_STATE: any = {
    nombre: '',
    ruc: '',
    razon_social: '',
    activo: true,

    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: null,

    copias_bn_incluidas: 0,
    copias_color_incluidas: 0,
    impresiones_bn_incluidas: 0,
    impresiones_color_incluidas: 0,

    costo_copia_bn: 0,
    costo_copia_color: 0,
    costo_impresion_bn: 0,
    costo_impresion_color: 0,

    costo_excedente_copia_bn: 0,
    costo_excedente_copia_color: 0,
    costo_excedente_impresion_bn: 0,
    costo_excedente_impresion_color: 0,

    tiene_renta: false,
    tiene_software_control: false,
    printer_bill: 'Todo como Color'
};

const ClientesPage = () => {
    const [activeTab, setActiveTab] = useState<'agregar' | 'listar' | 'Crear Contrato' | 'Editar Contrato'>('listar');
    const [allClients, setAllClients] = useState<ClienteParaTabla[]>([]);
    const [showInactive, setShowInactive] = useState<boolean>(false);
    const [filterTerm, setFilterTerm] = useState<string>('');
    const [filterClientId, setFilterClientId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<any>(INITIAL_FORM_STATE);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteParaTabla | null>(null);
    const [isModalDetallesOpen, setIsModalDetallesOpen] = useState(false);

    const [warningModal, setWarningModal] = useState<{ isOpen: boolean; message: string; title?: string }>({
        isOpen: false,
        message: ''
    });

    // El backend guarda el contrato pero avisa si se cruza con otro contrato activo del cliente
    const avisarSuperposicion = (advertencia?: string) => {
        if (advertencia) {
            setWarningModal({ isOpen: true, title: 'Contrato superpuesto', message: `El contrato se guardó. ${advertencia}.` });
        }
    };

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'delete' | 'activate' | 'info' | 'warning';
        cliente: ClienteParaTabla | null;
        title?: string;
        message?: string;
        confirmText?: string;
        showCancel?: boolean;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        type: 'delete',
        cliente: null
    });

    const fetchClients = async () => {
        setLoading(true);
        setError(null);
        try {
            const [active, inactive] = await Promise.all([
                fetchAllClientes(),
                fetchClientesInactivos()
            ]);
            //const activeArray = Array.isArray(active) ? active : [];
            //const inactiveArray = Array.isArray(inactive) ? inactive : [];
            const combinedClients = [...active, ...inactive];
            const uniqueClients = Array.from(new Map(combinedClients.map(item => [item.id_cliente, item])).values());

            setAllClients(uniqueClients);
        } catch (err) {
            console.error('Error fetching clients:', err);
            setError('Error al cargar la lista de clientes. Por favor, intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        let finalValue: any = value;
        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            finalValue = Number(value);
        }

        setFormData((prev: any) => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const handleSave = async () => {
        if (activeTab === 'Crear Contrato' || activeTab === 'Editar Contrato') {
            if (!formData.cliente_id) {
                setWarningModal({ isOpen: true, message: 'Debe asignar un cliente para guardar el contrato.' });
                return;
            }
            if (!formData.fecha_inicio) {
                setWarningModal({ isOpen: true, message: 'La fecha de inicio es obligatoria para el contrato.' });
                return;
            }

            setSubmitting(true);
            setError(null);
            try {
                const contractData = {
                    fecha_inicio: formData.fecha_inicio,
                    fecha_fin: formData.fecha_fin || null,
                    copias_bn_incluidas: Number(formData.impresiones_bn_incluidas || 0),
                    copias_color_incluidas: Number(formData.impresiones_color_incluidas || 0),
                    impresiones_bn_incluidas: Number(formData.impresiones_bn_incluidas || 0),
                    impresiones_color_incluidas: Number(formData.impresiones_color_incluidas || 0),
                    costo_copia_bn: Number(formData.costo_impresion_bn || 0),
                    costo_copia_color: Number(formData.costo_impresion_color || 0),
                    costo_impresion_bn: Number(formData.costo_impresion_bn || 0),
                    costo_impresion_color: Number(formData.costo_impresion_color || 0),
                    costo_excedente_copia_bn: Number(formData.costo_excedente_impresion_bn || 0),
                    costo_excedente_copia_color: Number(formData.costo_excedente_impresion_color || 0),
                    costo_excedente_impresion_bn: Number(formData.costo_excedente_impresion_bn || 0),
                    costo_excedente_impresion_color: Number(formData.costo_excedente_impresion_color || 0),
                    tiene_renta: Boolean(formData.tiene_renta),
                    tiene_software_control: Boolean(formData.tiene_software_control),
                    printer_bill: formData.printer_bill
                };

                if (activeTab === 'Editar Contrato' && formData.id_contrato) {
                    const resultado = await updateContrato(formData.id_contrato, {
                        ...contractData,
                        cliente_id: Number(formData.cliente_id)
                    });
                    avisarSuperposicion(resultado.advertencia);
                    setModalConfig({
                        isOpen: true,
                        type: 'activate',
                        title: 'Contrato Actualizado',
                        message: 'El contrato se ha actualizado correctamente.',
                        cliente: null,
                        showCancel: false,
                        confirmText: 'Aceptar',
                        onConfirm: () => {
                            setModalConfig(prev => ({ ...prev, isOpen: false }));
                            setActiveTab('listar');
                            setFormData(INITIAL_FORM_STATE);
                            fetchClients();
                        }
                    });
                } else {
                    const creado = await createContrato(Number(formData.cliente_id), contractData);
                    avisarSuperposicion(creado?.advertencia);

                    setModalConfig({
                        isOpen: true,
                        type: 'activate',
                        title: 'Contrato Asignado',
                        message: 'El contrato se ha creado y asignado correctamente.',
                        cliente: null,
                        showCancel: false,
                        confirmText: 'Aceptar',
                        onConfirm: () => {
                            setModalConfig(prev => ({ ...prev, isOpen: false }));
                            // NO redirigimos, limpiamos para poder crear otro si lo desea
                            setFormData(INITIAL_FORM_STATE);
                            fetchClients();
                        }
                    });
                }

            } catch (err: any) {
                console.error('Error saving contract:', err);
                setModalConfig({
                    isOpen: true,
                    type: 'warning',
                    title: 'Error al Guardar',
                    message: err.message || 'No se pudo guardar el contrato.',
                    cliente: null,
                    showCancel: false,
                    confirmText: 'Entendido',
                    onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                });
            } finally {
                setSubmitting(false);
            }
            return;
        }

        if (!formData.nombre) {
            setWarningModal({ isOpen: true, message: 'El nombre del cliente es un campo obligatorio.' });
            return;
        }
        if (!formData.ruc) {
            setWarningModal({ isOpen: true, message: 'El RUC del cliente es un campo obligatorio.' });
            return;
        }

        const wasEditing = isEditing;

        setSubmitting(true);
        setError(null);

        try {
            if (wasEditing && formData.id_cliente) {
                const payload = {
                    nombre: formData.nombre,
                    ruc: formData.ruc,
                    razon_social: formData.razon_social,
                    activo: formData.activo,
                    tiene_renta: Boolean(formData.tiene_renta),
                    tiene_software_control: Boolean(formData.tiene_software_control),
                    printer_bill: formData.printer_bill
                };
                await updateCliente(formData.id_cliente, payload);

                if (formData.id_contrato) {
                    const resultado = await updateContrato(formData.id_contrato, {
                        cliente_id: formData.id_cliente,
                        fecha_inicio: formData.fecha_inicio,
                        fecha_fin: formData.fecha_fin,
                        copias_bn_incluidas: Number(formData.impresiones_bn_incluidas),
                        copias_color_incluidas: Number(formData.impresiones_color_incluidas),
                        impresiones_bn_incluidas: Number(formData.impresiones_bn_incluidas),
                        impresiones_color_incluidas: Number(formData.impresiones_color_incluidas),
                        costo_copia_bn: Number(formData.costo_impresion_bn),
                        costo_copia_color: Number(formData.costo_impresion_color),
                        costo_impresion_bn: Number(formData.costo_impresion_bn),
                        costo_impresion_color: Number(formData.costo_impresion_color),
                        costo_excedente_copia_bn: Number(formData.costo_excedente_impresion_bn || 0),
                        costo_excedente_copia_color: Number(formData.costo_excedente_impresion_color || 0),
                        costo_excedente_impresion_bn: Number(formData.costo_excedente_impresion_bn || 0),
                        costo_excedente_impresion_color: Number(formData.costo_excedente_impresion_color || 0),
                        tiene_renta: Boolean(formData.tiene_renta),
                        tiene_software_control: Boolean(formData.tiene_software_control),
                        printer_bill: formData.printer_bill,
                    });
                    avisarSuperposicion(resultado.advertencia);
                }
            } else {
                await createCliente({
                    nombre: formData.nombre,
                    ruc: formData.ruc,
                    razon_social: formData.razon_social,
                    tiene_renta: Boolean(formData.tiene_renta),
                    tiene_software_control: Boolean(formData.tiene_software_control),
                    printer_bill: formData.printer_bill
                });
            }

            setFilterClientId(null);
            setFilterTerm('');
            fetchClients();

            setModalConfig({
                isOpen: true,
                type: 'activate',
                title: wasEditing ? 'Cliente Actualizado' : 'Cliente Creado',
                message: wasEditing
                    ? 'La información del cliente se ha actualizado correctamente.'
                    : 'El cliente se ha registrado exitosamente en el sistema.',
                cliente: null,
                showCancel: false,
                confirmText: 'Aceptar',
                onConfirm: () => {
                    setModalConfig(prev => ({ ...prev, isOpen: false }));
                    setFormData(INITIAL_FORM_STATE);
                    setIsEditing(false);
                    if (wasEditing) {
                        setActiveTab('listar');
                    }
                }
            });
        } catch (err: any) {
            console.error('Error saving client:', err);
            setModalConfig({
                isOpen: true,
                type: 'warning',
                title: 'Error al Guardar',
                message: err.message || 'No se pudo guardar el cliente.',
                cliente: null,
                showCancel: false,
                confirmText: 'Entendido',
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        setFormData(INITIAL_FORM_STATE);
        setIsEditing(false);
        setActiveTab('listar');
    };

    const handleSelectClientForContractEdit = async (client: ClienteParaTabla) => {
        setLoading(true);
        try {
            const fullData = await getClienteCompleto(client.id_cliente);
            if (fullData && fullData.contratos && fullData.contratos.length > 0) {
                const activeContract = fullData.contratos.find((c: any) => c.activo) || fullData.contratos[0];
                setFormData({
                    ...INITIAL_FORM_STATE,
                    cliente_id: client.id_cliente,
                    id_contrato: activeContract.id_contrato,
                    fecha_inicio: activeContract.fecha_inicio?.split('T')[0],
                    fecha_fin: activeContract.fecha_fin?.split('T')[0] || null,
                    copias_bn_incluidas: activeContract.copias_bn_incluidas,
                    copias_color_incluidas: activeContract.copias_color_incluidas,
                    impresiones_bn_incluidas: activeContract.impresiones_bn_incluidas,
                    impresiones_color_incluidas: activeContract.impresiones_color_incluidas,
                    costo_copia_bn: activeContract.costo_copia_bn,
                    costo_copia_color: activeContract.costo_copia_color,
                    costo_impresion_bn: activeContract.costo_impresion_bn,
                    costo_impresion_color: activeContract.costo_impresion_color,
                    costo_excedente_copia_bn: activeContract.costo_excedente_copia_bn || 0,
                    costo_excedente_copia_color: activeContract.costo_excedente_copia_color || 0,
                    costo_excedente_impresion_bn: activeContract.costo_excedente_impresion_bn || 0,
                    costo_excedente_impresion_color: activeContract.costo_excedente_impresion_color || 0,
                    printer_bill: activeContract.printer_bill || INITIAL_FORM_STATE.printer_bill,
                    tiene_renta: Boolean(activeContract.tiene_renta),
                    tiene_software_control: Boolean(activeContract.tiene_software_control)
                });
                setClienteSeleccionado(client);
                setIsEditing(true);
            } else {
                setError("El cliente seleccionado no tiene contratos activos. Puede crear uno nuevo en la pestaña 'Crear Contrato'.");
            }
        } catch (e) {
            console.error(e);
            setError("Error al cargar contrato del cliente.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (client: ClienteParaTabla) => {
        const actionType = client.activo ? 'delete' : 'activate';
        setModalConfig({
            isOpen: true,
            type: actionType,
            cliente: client
        });
    };

    const handleDelete = async (client: ClienteParaTabla) => {
        setModalConfig({
            isOpen: true,
            type: 'delete',
            cliente: client
        });
    };

    const handleConfirmModal = async () => {
        const { type, cliente, onConfirm } = modalConfig;

        if (onConfirm) {
            onConfirm();
            return;
        }

        if (!cliente) return;

        try {
            if (type === 'delete') {
                await deleteCliente(cliente.id_cliente);
                setAllClients(prev => prev.map((c: ClienteParaTabla) =>
                    c.id_cliente === cliente.id_cliente ? { ...c, activo: false } : c
                ));
            } else {
                await activarCliente(cliente.id_cliente);
                setAllClients(prev => prev.map((c: ClienteParaTabla) =>
                    c.id_cliente === cliente.id_cliente ? { ...c, activo: true } : c
                ));
            }
            handleCloseModalConfirm();
        } catch (err) {
            console.error('Error toggling client status:', err);
            fetchClients();
        }
    };

    const handleCloseModalConfirm = () => {
        setModalConfig({
            isOpen: false,
            type: 'delete',
            cliente: null
        });
    };

    const handleVerDetalles = (client: ClienteParaTabla) => {
        setClienteSeleccionado(client);
        setIsModalDetallesOpen(true);
    };

    const handleEdit = async (client: ClienteParaTabla) => {
        setLoading(true);
        try {
            const fullData = await getClienteCompleto(client.id_cliente);
            if (fullData) {
                const activeContract = fullData.contratos?.find(c => c.activo) || fullData.contratos?.[0];

                setFormData({
                    ...INITIAL_FORM_STATE,
                    ...client,
                    id_contrato: activeContract?.id_contrato,
                    fecha_inicio: activeContract?.fecha_inicio?.split('T')[0],
                    fecha_fin: activeContract?.fecha_fin?.split('T')[0] || null,
                    copias_bn_incluidas: activeContract?.copias_bn_incluidas || 0,
                    copias_color_incluidas: activeContract?.copias_color_incluidas || 0,
                    impresiones_bn_incluidas: activeContract?.impresiones_bn_incluidas || 0,
                    impresiones_color_incluidas: activeContract?.impresiones_color_incluidas || 0,
                    costo_copia_bn: activeContract?.costo_copia_bn || 0,
                    costo_copia_color: activeContract?.costo_copia_color || 0,
                    costo_impresion_bn: activeContract?.costo_impresion_bn || 0,
                    costo_impresion_color: activeContract?.costo_impresion_color || 0,
                    costo_excedente_copia_bn: activeContract?.costo_excedente_copia_bn || 0,
                    costo_excedente_copia_color: activeContract?.costo_excedente_copia_color || 0,
                    costo_excedente_impresion_bn: activeContract?.costo_excedente_impresion_bn || 0,
                    costo_excedente_impresion_color: activeContract?.costo_excedente_impresion_color || 0,
                    tiene_renta: Boolean(activeContract?.tiene_renta || false),
                    tiene_software_control: Boolean(activeContract?.tiene_software_control || false),
                    printer_bill: activeContract?.printer_bill || 'Todo como Color',
                });
            } else {
                setFormData({ ...INITIAL_FORM_STATE, ...client });
            }
            setIsEditing(true);
            setActiveTab('agregar');
        } catch (err) {
            console.error('Error fetching full client details for edit:', err);
            setError('No se pudieron cargar todos los detalles del cliente para editar.');
            setFormData({ ...INITIAL_FORM_STATE, ...client });
            setIsEditing(true);
            setActiveTab('agregar');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setFilterClientId(null);
        setFilterTerm('');
        fetchClients();
    };

    useEffect(() => {
        if (activeTab === 'listar' || activeTab === 'Crear Contrato' || activeTab === 'Editar Contrato') {
            fetchClients();
        }
    }, [activeTab]);

    const displayedClients = allClients.filter(client => {
        if (!showInactive && !client.activo) return false;

        if (filterClientId) {
            return client.id_cliente === filterClientId;
        }
        if (filterTerm) {
            const searchWords = filterTerm.toLowerCase().split(' ').filter(w => w.length > 0);
            return searchWords.every(word =>
                client.nombre.toLowerCase().includes(word) ||
                client.ruc?.toLowerCase().includes(word) ||
                (client.razon_social && client.razon_social.toLowerCase().includes(word))
            );
        }
        return true;
    });
    const clientesSinContrato = displayedClients.filter(c => !c.id_contrato);
    const clientesConContrato = displayedClients.filter(c => !!c.id_contrato);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Clientes</h1>

            <div className="flex border-b border-gray-100 p-2 gap-4">
                <button
                    onClick={() => setActiveTab('listar')}
                    className={`px-6 py-2 rounded-md transition-all ${activeTab === 'listar'
                        ? 'bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium'
                        : 'text-gray-500 hover:text-gray-800'
                        }`}
                >
                    Listar
                </button>
                <button
                    onClick={() => {
                        setFormData(INITIAL_FORM_STATE);
                        setIsEditing(false);
                        setActiveTab('agregar');
                    }}
                    className={`px-6 py-2 rounded-md transition-all ${activeTab === 'agregar'
                        ? 'bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium'
                        : 'text-gray-500 hover:text-gray-800'
                        }`}
                >
                    {isEditing && activeTab === 'agregar' ? 'Editar Cliente' : 'Agregar'}
                </button>
                <button
                    onClick={() => {
                        setFormData(INITIAL_FORM_STATE);
                        setIsEditing(false);
                        setActiveTab('Crear Contrato');
                    }}
                    className={`px-6 py-2 rounded-md transition-all ${activeTab === 'Crear Contrato'
                        ? 'bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium'
                        : 'text-gray-500 hover:text-gray-800'
                        }`}
                >
                    Crear Contrato
                </button>
                <button
                    onClick={() => {
                        setFormData(INITIAL_FORM_STATE);
                        setIsEditing(false);
                        setActiveTab('Editar Contrato');
                    }}
                    className={`px-6 py-2 rounded-md transition-all ${activeTab === 'Editar Contrato'
                        ? 'bg-gray-50 text-gray-900 border border-gray-200 shadow-sm font-medium'
                        : 'text-gray-500 hover:text-gray-800'
                        }`}
                >
                    Editar Contrato
                </button>
            </div>

            <div className="p-8">
                {activeTab === 'agregar' ? (
                    < div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {isEditing
                                    ? 'Modifica la información general de este cliente.'
                                    : 'Ingresa los datos para registrar un nuevo cliente en el sistema.'}
                            </p>
                        </div>
                        <hr className="border-gray-200 mb-8" />
                        <ClientesFormPage
                            formData={formData}
                            onChange={handleInputChange}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            isSubmitting={submitting}
                            isEditing={isEditing}
                        />
                    </div>
                ) : activeTab === 'Crear Contrato' || activeTab === 'Editar Contrato' ? (
                    activeTab === 'Editar Contrato' && !isEditing ? (
                        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Editar Contrato</h2>
                                <p className="text-sm text-gray-500 mt-1">Busca y selecciona el cliente al que deseas modificarle su contrato actual.</p>
                            </div>
                            <hr className="border-gray-200 mb-8" />
                            <div className="bg-accent/10 border border-accent/50 rounded-lg p-6">
                                <BusquedaInteligenteClientes
                                    key={`buscador-editar-${activeTab}`}
                                    onSeleccionar={handleSelectClientForContractEdit}
                                    placeholder="Buscar por Nombre o RUC..."
                                    itemsCompletos={clientesConContrato}
                                />
                                {loading && (<div className="mt-4 text-center text-gray-500">Cargando contrato...</div>)}
                                {error && (<div className="mt-4 text-center text-red-600">{error}</div>)}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {activeTab === 'Editar Contrato' ? 'Modificar Contrato' : 'Nuevo Contrato'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {activeTab === 'Editar Contrato'
                                        ? 'Modifica las condiciones y tarifas del contrato seleccionado.'
                                        : 'Ingresa los datos para registrar y asignar un nuevo contrato al cliente.'}
                                </p>
                            </div>
                            <hr className="border-gray-200 mb-8" />
                            <ContractFormPage
                                formData={formData}
                                onChange={handleInputChange}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                isSubmitting={submitting}
                                isEditing={activeTab === 'Editar Contrato' ? true : isEditing}
                                clients={clientesSinContrato}
                            />
                        </div>
                    )
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex-1 w-full">
                                <BusquedaInteligenteClientes
                                    onSeleccionar={(c) => {
                                        setFilterClientId(c.id_cliente);
                                        setFilterTerm('');
                                    }}
                                    onEnter={(term) => {
                                        setFilterClientId(null);
                                        setFilterTerm(term.toLowerCase().trim());
                                    }}
                                    onSearchClick={(term) => {
                                        setFilterClientId(null);
                                        setFilterTerm(term.toLowerCase().trim());
                                    }}
                                    onClear={() => {
                                        setFilterClientId(null);
                                        setFilterTerm('');
                                    }}
                                    onInputChange={() => {
                                        if (filterClientId) setFilterClientId(null);
                                    }}
                                    itemsCompletos={allClients}
                                />
                            </div>

                            <div className="flex items-center h-[42px] px-2 bg-white rounded-lg border border-gray-200">
                                <input
                                    id="showInactive"
                                    type="checkbox"
                                    checked={showInactive}
                                    onChange={(e) => setShowInactive(e.target.checked)}
                                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                                />
                                <label htmlFor="showInactive" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
                                    Mostrar inactivos
                                </label>
                            </div>

                            <button
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium h-[42px]"
                            >
                                Ver Todos
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        ) : error ? (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 italic">
                                {error}
                            </div>
                        ) : (
                            <ClientList
                                clients={displayedClients}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleActive={handleToggleActive}
                                onVerDetalles={handleVerDetalles}
                            />
                        )}
                    </div>
                )}
            </div>

            {
                isModalDetallesOpen && clienteSeleccionado && (
                    <DetalleClienteModal
                        cliente={clienteSeleccionado}
                        onClose={() => setIsModalDetallesOpen(false)}
                    />
                )
            }

            <ModalConfirmacion
                isOpen={modalConfig.isOpen}
                onClose={handleCloseModalConfirm}
                onConfirm={handleConfirmModal}
                type={modalConfig.type as any}
                title={
                    modalConfig.title || (
                        modalConfig.type === 'delete'
                            ? '¿Desactivar Cliente?'
                            : '¿Activar Cliente?'
                    )
                }
                message={
                    modalConfig.message || (
                        modalConfig.type === 'delete'
                            ? `¿Estás seguro de que deseas desactivar al cliente "${modalConfig.cliente?.nombre}"? Podrás reactivarlo después si lo necesitas.`
                            : `¿Deseas activar al cliente "${modalConfig.cliente?.nombre}"?`
                    )
                }
                confirmText={
                    modalConfig.confirmText || (
                        modalConfig.type === 'delete' ? 'Desactivar' : 'Activar'
                    )
                }
                cancelText="Cancelar"
                showCancel={modalConfig.showCancel !== undefined ? modalConfig.showCancel : true}
            />

            <ModalAdvertencia
                isOpen={warningModal.isOpen}
                onClose={() => setWarningModal({ isOpen: false, message: '' })}
                title={warningModal.title}
                message={warningModal.message}
            />
        </div >
    );
};

export default ClientesPage;
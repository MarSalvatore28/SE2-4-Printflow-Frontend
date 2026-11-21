import { useState, useEffect, useCallback, type ReactNode } from 'react';
import ClientesFormPage from '@app/Clientes/pages/ClientesForm.page';
import ContractFormPage from '@app/Clientes/pages/ContractForm.page';
import ClientList from '@app/Clientes/components/ClientList';
import BusquedaInteligenteClientes from '@app/Clientes/components/BusquedaInteligenteClientes';
import { DetalleClienteModal } from '@app/Clientes/components/Detalleclientemodal';
import ModalConfirmacion from '@components/Shared/ModalConfirmacion';
import ModalAdvertencia from '@components/Shared/ModalAdvertencia';
import { AvisoSoloLectura } from '@components/auth/AvisoSoloLectura';
import { usePermisos } from '@hooks/usePermisos';
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
    activarCliente,
    type Contrato
} from '@app/Clientes/types';
import {
    datosClienteEditado,
    datosClienteNuevo,
    datosContrato,
    datosContratoDeCliente,
    esPestanaContrato,
    faltanteCliente,
    faltanteContrato,
    filtrarClientes,
    textosModalCliente,
    type FormularioCliente,
    type PestanaClientes,
} from '@app/Clientes/utils/formularioCliente';
import { clasePestana } from '@utils/pestanas';

const INITIAL_FORM_STATE: FormularioCliente = {
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

// Si no se pudo leer el cliente completo, el formulario se llena con su fila de la tabla
// (ahí las tarifas pueden venir como texto, igual que antes).
const formularioDesdeFila = (client: ClienteParaTabla) => ({ ...INITIAL_FORM_STATE, ...client }) as FormularioCliente;

// La API devuelve las tarifas como texto («0.0200»); el formulario trabaja con números
const aNumero = (valor: unknown) => Number(valor ?? 0) || 0;

// Campos del contrato vigente en el formulario (editar cliente y editar contrato)
const contratoEnFormulario = (contrato: Contrato) => ({
    id_contrato: contrato.id_contrato,
    fecha_inicio: contrato.fecha_inicio?.split('T')[0],
    fecha_fin: contrato.fecha_fin?.split('T')[0] || null,
    copias_bn_incluidas: aNumero(contrato.copias_bn_incluidas),
    copias_color_incluidas: aNumero(contrato.copias_color_incluidas),
    impresiones_bn_incluidas: aNumero(contrato.impresiones_bn_incluidas),
    impresiones_color_incluidas: aNumero(contrato.impresiones_color_incluidas),
    costo_copia_bn: aNumero(contrato.costo_copia_bn),
    costo_copia_color: aNumero(contrato.costo_copia_color),
    costo_impresion_bn: aNumero(contrato.costo_impresion_bn),
    costo_impresion_color: aNumero(contrato.costo_impresion_color),
    costo_excedente_copia_bn: aNumero(contrato.costo_excedente_copia_bn),
    costo_excedente_copia_color: aNumero(contrato.costo_excedente_copia_color),
    costo_excedente_impresion_bn: aNumero(contrato.costo_excedente_impresion_bn),
    costo_excedente_impresion_color: aNumero(contrato.costo_excedente_impresion_color),
    tiene_renta: Boolean(contrato.tiene_renta),
    tiene_software_control: Boolean(contrato.tiene_software_control),
    printer_bill: contrato.printer_bill || INITIAL_FORM_STATE.printer_bill,
});

// Tarjeta de un formulario con su título y descripción
const PanelFormulario = ({ titulo, descripcion, children }: { titulo: string; descripcion: string; children: ReactNode }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-8">
        <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">{titulo}</h2>
            <p className="text-sm text-gray-500 mt-1">{descripcion}</p>
        </div>
        <hr className="border-gray-200 mb-8" />
        {children}
    </div>
);

// Mientras carga, un indicador; si falló, el error; si no, la lista
const EstadoLista = ({ cargando, error, children }: { cargando: boolean; error: string | null; children: ReactNode }) => {
    if (cargando) {
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
    return <>{children}</>;
};

const TEXTOS_CLIENTE = {
    nuevo: { titulo: 'Nuevo cliente', descripcion: 'Ingresa los datos para registrar un nuevo cliente en el sistema.' },
    editar: { titulo: 'Editar cliente', descripcion: 'Modifica la información general de este cliente.' },
};

const TEXTOS_CONTRATO = {
    crear: { titulo: 'Nuevo contrato', descripcion: 'Ingresa los datos para registrar y asignar un nuevo contrato al cliente.' },
    editar: { titulo: 'Modificar contrato', descripcion: 'Modifica las condiciones y tarifas del contrato seleccionado.' },
};

const ClientesPage = () => {
    // Crear, editar y desactivar clientes y contratos: solo admin (el operador y el auditor consultan)
    const { puedeEditarCatalogos } = usePermisos();
    const [activeTab, setActiveTab] = useState<PestanaClientes>('listar');
    const [allClients, setAllClients] = useState<ClienteParaTabla[]>([]);
    const [showInactive, setShowInactive] = useState<boolean>(false);
    const [filterTerm, setFilterTerm] = useState<string>('');
    const [filterClientId, setFilterClientId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormularioCliente>(INITIAL_FORM_STATE);
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

    const fetchClients = useCallback(async () => {
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
    }, []);

    const cerrarModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const mostrarErrorAlGuardar = (err: unknown, porDefecto: string) => {
        setModalConfig({
            isOpen: true,
            type: 'warning',
            title: 'Error al guardar',
            message: (err instanceof Error && err.message) || porDefecto,
            cliente: null,
            showCancel: false,
            confirmText: 'Entendido',
            onConfirm: cerrarModal
        });
    };

    const mostrarExito = (title: string, message: string, onConfirm: () => void) => {
        setModalConfig({
            isOpen: true,
            type: 'activate',
            title,
            message,
            cliente: null,
            showCancel: false,
            confirmText: 'Aceptar',
            onConfirm
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        let finalValue: string | number | boolean = value;
        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            finalValue = Number(value);
        }

        setFormData((prev) => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const guardarContrato = async () => {
        const faltante = faltanteContrato(formData);
        if (faltante) {
            setWarningModal({ isOpen: true, message: faltante });
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const contractData = datosContrato(formData);

            if (activeTab === 'Editar Contrato' && formData.id_contrato) {
                const resultado = await updateContrato(formData.id_contrato, {
                    ...contractData,
                    cliente_id: Number(formData.cliente_id)
                });
                avisarSuperposicion(resultado.advertencia);
                mostrarExito('Contrato actualizado', 'El contrato se ha actualizado correctamente.', () => {
                    cerrarModal();
                    setActiveTab('listar');
                    setFormData(INITIAL_FORM_STATE);
                    void fetchClients();
                });
            } else {
                const creado = await createContrato(Number(formData.cliente_id), contractData);
                avisarSuperposicion(creado?.advertencia);
                mostrarExito('Contrato asignado', 'El contrato se ha creado y asignado correctamente.', () => {
                    cerrarModal();
                    // NO redirigimos, limpiamos para poder crear otro si lo desea
                    setFormData(INITIAL_FORM_STATE);
                    void fetchClients();
                });
            }
        } catch (err) {
            console.error('Error saving contract:', err);
            mostrarErrorAlGuardar(err, 'No se pudo guardar el contrato.');
        } finally {
            setSubmitting(false);
        }
    };

    // Al editar un cliente se guarda también su contrato vigente
    const actualizarClienteYContrato = async (idCliente: number) => {
        await updateCliente(idCliente, datosClienteEditado(formData));
        if (formData.id_contrato) {
            const resultado = await updateContrato(formData.id_contrato, datosContratoDeCliente(formData));
            avisarSuperposicion(resultado.advertencia);
        }
    };

    const guardarCliente = async () => {
        const faltante = faltanteCliente(formData);
        if (faltante) {
            setWarningModal({ isOpen: true, message: faltante });
            return;
        }

        const wasEditing = isEditing;

        setSubmitting(true);
        setError(null);

        try {
            if (wasEditing && formData.id_cliente) {
                await actualizarClienteYContrato(formData.id_cliente);
            } else {
                await createCliente(datosClienteNuevo(formData));
            }

            setFilterClientId(null);
            setFilterTerm('');
            void fetchClients();

            mostrarExito(
                wasEditing ? 'Cliente actualizado' : 'Cliente creado',
                wasEditing
                    ? 'La información del cliente se ha actualizado correctamente.'
                    : 'El cliente se ha registrado exitosamente en el sistema.',
                () => {
                    cerrarModal();
                    setFormData(INITIAL_FORM_STATE);
                    setIsEditing(false);
                    if (wasEditing) {
                        setActiveTab('listar');
                    }
                }
            );
        } catch (err) {
            console.error('Error saving client:', err);
            mostrarErrorAlGuardar(err, 'No se pudo guardar el cliente.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSave = () => (esPestanaContrato(activeTab) ? guardarContrato() : guardarCliente());

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
                const activeContract = fullData.contratos.find((c) => c.activo) || fullData.contratos[0];
                setFormData({
                    ...INITIAL_FORM_STATE,
                    cliente_id: client.id_cliente,
                    ...contratoEnFormulario(activeContract),
                });
                setClienteSeleccionado(client);
                setIsEditing(true);
            } else {
                setError("El cliente seleccionado no tiene contratos activos. Puede crear uno nuevo en la pestaña «Crear contrato».");
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
            void fetchClients();
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

                setFormData(activeContract
                    ? { ...INITIAL_FORM_STATE, ...client, ...contratoEnFormulario(activeContract) }
                    : formularioDesdeFila(client));
            } else {
                setFormData(formularioDesdeFila(client));
            }
            setIsEditing(true);
            setActiveTab('agregar');
        } catch (err) {
            console.error('Error fetching full client details for edit:', err);
            setError('No se pudieron cargar todos los detalles del cliente para editar.');
            setFormData(formularioDesdeFila(client));
            setIsEditing(true);
            setActiveTab('agregar');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setFilterClientId(null);
        setFilterTerm('');
        void fetchClients();
    };

    useEffect(() => {
        if (activeTab === 'listar' || esPestanaContrato(activeTab)) {
            void fetchClients();
        }
    }, [activeTab, fetchClients]);

    const displayedClients = filtrarClientes(allClients, {
        mostrarInactivos: showInactive,
        clienteId: filterClientId,
        termino: filterTerm,
    });
    const clientesSinContrato = displayedClients.filter(c => !c.id_contrato);
    const clientesConContrato = displayedClients.filter(c => !!c.id_contrato);
    const editandoContrato = activeTab === 'Editar Contrato';
    const textosCliente = isEditing ? TEXTOS_CLIENTE.editar : TEXTOS_CLIENTE.nuevo;
    const textosContrato = editandoContrato ? TEXTOS_CONTRATO.editar : TEXTOS_CONTRATO.crear;
    // Crear contrato: clientes sin contrato; editar: clientes con contrato
    const clientesContrato = editandoContrato ? clientesConContrato : clientesSinContrato;
    const textosModal = textosModalCliente(modalConfig);
    // Sin permiso de edición la lista no muestra acciones
    const accionesLista = puedeEditarCatalogos
        ? { onEdit: handleEdit, onDelete: handleDelete, onToggleActive: handleToggleActive }
        : {};
    const abrirPestana = (pestana: PestanaClientes) => {
        setFormData(INITIAL_FORM_STATE);
        setIsEditing(false);
        setActiveTab(pestana);
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 mt-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de clientes</h1>
            {!puedeEditarCatalogos && <AvisoSoloLectura acciones="crear, editar o desactivar clientes y contratos" />}

            <div className="flex flex-wrap border-b border-gray-100 p-2 gap-2 md:gap-4">
                <button
                    onClick={() => setActiveTab('listar')}
                    className={clasePestana(activeTab === 'listar')}
                >
                    Listar
                </button>
                {puedeEditarCatalogos && (<>
                <button
                    onClick={() => abrirPestana('agregar')}
                    className={clasePestana(activeTab === 'agregar')}
                >
                    {isEditing && activeTab === 'agregar' ? 'Editar cliente' : 'Agregar'}
                </button>
                <button
                    onClick={() => abrirPestana('Crear Contrato')}
                    className={clasePestana(activeTab === 'Crear Contrato')}
                >
                    Crear contrato
                </button>
                <button
                    onClick={() => abrirPestana('Editar Contrato')}
                    className={clasePestana(activeTab === 'Editar Contrato')}
                >
                    Editar contrato
                </button>
                </>)}
            </div>

            <div className="py-4 md:p-8">
                {activeTab === 'agregar' ? (
                    <PanelFormulario titulo={textosCliente.titulo} descripcion={textosCliente.descripcion}>
                        <ClientesFormPage
                            formData={formData}
                            onChange={handleInputChange}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            isSubmitting={submitting}
                            isEditing={isEditing}
                        />
                    </PanelFormulario>
                ) : esPestanaContrato(activeTab) ? (
                    editandoContrato && !isEditing ? (
                        <PanelFormulario titulo="Editar contrato" descripcion="Busca y selecciona el cliente al que deseas modificarle su contrato actual.">
                            <div className="bg-accent/10 border border-accent/50 rounded-lg p-6">
                                <BusquedaInteligenteClientes
                                    key={`buscador-editar-${activeTab}`}
                                    onSeleccionar={handleSelectClientForContractEdit}
                                    placeholder="Buscar por nombre o RUC..."
                                    itemsCompletos={clientesConContrato}
                                />
                                {loading && (<div className="mt-4 text-center text-gray-500">Cargando contrato...</div>)}
                                {error && (<div className="mt-4 text-center text-red-600">{error}</div>)}
                            </div>
                        </PanelFormulario>
                    ) : (
                        <PanelFormulario titulo={textosContrato.titulo} descripcion={textosContrato.descripcion}>
                            <ContractFormPage
                                formData={formData}
                                onChange={handleInputChange}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                isSubmitting={submitting}
                                isEditing={editandoContrato || isEditing}
                                clients={clientesContrato}
                            />
                        </PanelFormulario>
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
                                Ver todos
                            </button>
                        </div>

                        <EstadoLista cargando={loading} error={error}>
                            <ClientList
                                clients={displayedClients}
                                {...accionesLista}
                                onVerDetalles={handleVerDetalles}
                            />
                        </EstadoLista>
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
                type={modalConfig.type}
                title={textosModal.title}
                message={textosModal.message}
                confirmText={textosModal.confirmText}
                cancelText="Cancelar"
                showCancel={textosModal.showCancel}
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
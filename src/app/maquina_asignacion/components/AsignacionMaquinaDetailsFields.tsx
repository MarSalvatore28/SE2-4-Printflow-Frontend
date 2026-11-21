import React, { useState, useEffect } from 'react';
import BusquedaInteligenteClientes from '../../Clientes/components/BusquedaInteligenteClientes';
import { BuscadorInteligente } from '@components/Shared/BuscadorInteligente';
import {
    getAreasByCliente,
    getContratosByCliente,
    getMaquinasDisponibles
} from '@services/Instalaciones/instalaciones.service';
import {
    type InstalacionFormData,
    type Area,
    type Contrato,
    type MaquinaSinInstalacion
} from '@models/Instalacion/Instalacion.types';
import { type Client } from '@models/Cliente/cliente.types';
import { Plus } from 'lucide-react';

// Formatea fecha sin ajuste de zona horaria (evita restar un día en UTC-5)
const formatFechaLocal = (fechaStr: string | null | undefined): string => {
    if (!fechaStr) return '';
    // Tomar los primeros 10 caracteres (YYYY-MM-DD) y parsear sin conversión UTC
    const parte = fechaStr.substring(0, 10);
    const [anio, mes, dia] = parte.split('-');
    if (!anio || !mes || !dia) return parte;
    return `${Number.parseInt(dia)}/${Number.parseInt(mes)}/${anio}`;
};
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

export interface MaquinaConIP {
    maquina: MaquinaSinInstalacion;
    ip_address: string;
    observaciones?: string;
    fecha_instalacion?: string;
    costo_renta_mensual?: number;
    contador_acumulativo?: boolean;
    contabilidad_por_usuario?: boolean;
    area_id?: number;
}

interface InstalacionFormFieldsProps {
    formData: InstalacionFormData;
    onSelectCliente: (cliente: Client) => void;
    onSelectArea: (areaId: number, areaName?: string) => void;
    onSelectContrato: (contratoId: number, contratoDesc?: string) => void;
    onSelectMaquina: (maquina: MaquinaSinInstalacion) => void;
    onChangeIP: (ip: string) => void;
    onChangeFecha?: (fecha: string) => void;
    onChangeObservaciones: (obs: string) => void;
    onChangeCostoRenta?: (costo: number) => void;

    onChangeContadorAcumulativo?: (val: boolean) => void;
    onChangeContabilidadUsuario?: (val: boolean) => void;

    allClients?: Client[];
    modoEdicion?: boolean;
    multipleSelection?: boolean;
    maquinasConIP?: MaquinaConIP[];

    onAddMaquina?: (maquina: MaquinaSinInstalacion) => void;
    onRemoveMaquina?: (maquinaId: number) => void;
    onUpdateMaquinaIP?: (maquinaId: number, ip: string) => void;
    onUpdateMaquinaFecha?: (maquinaId: number, fecha: string) => void;
    onUpdateMaquinaObservaciones?: (maquinaId: number, obs: string) => void;
    onUpdateMaquinaRenta?: (maquinaId: number, costo: number) => void;
    onUpdateMaquinaContador?: (maquinaId: number, val: boolean) => void;
    onUpdateMaquinaContabilidad?: (maquinaId: number, val: boolean) => void;
    onUpdateMaquinaArea?: (maquinaId: number, areaId: number) => void;
}

const IpAddressInput = ({ value, onChange, required = false }: { value: string, onChange: (val: string) => void, required?: boolean }) => {
    const parts = React.useMemo(() => {
        const p = value ? value.split('.') : [];
        return [
            p[0] || '',
            p[1] || '',
            p[2] || '',
            p[3] || ''
        ];
    }, [value]);

    const handlePartChange = (index: number, val: string) => {
        if (val === '') {
            const newParts = [...parts];
            newParts[index] = val;
            onChange(newParts.join('.'));
            return;
        }
        if (!/^\d+$/.test(val)) return;
        const num = Number.parseInt(val, 10);
        if (num < 0 || num > 255) return;
        const cleanVal = num.toString();
        const newParts = [...parts];
        newParts[index] = cleanVal;
        onChange(newParts.join('.'));
    };

    return (
        <div className="flex items-center gap-1 w-full">
            {[0, 1, 2, 3].map((index) => (
                <React.Fragment key={index}>
                    <input
                        type="text"
                        className="w-full min-w-0 px-1 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-center transition-all"
                        placeholder={["192", "168", "1", "100"][index]}
                        value={parts[index]}
                        onChange={(e) => handlePartChange(index, e.target.value)}
                        required={required}
                        maxLength={3}
                    />
                    {index < 3 && <span className="font-bold text-gray-400 shrink-0">.</span>}
                </React.Fragment>
            ))}
        </div>
    );
};

interface SeccionContratoProps {
    loadingContratos: boolean;
    contratos: Contrato[];
    formData: InstalacionFormData;
    handleSelectContrato: (contratoId: number) => void;
    selectedContrato: Contrato | null;
    tieneRenta: boolean;
}

const SeccionContrato = ({ loadingContratos, contratos, formData, handleSelectContrato, selectedContrato, tieneRenta }: SeccionContratoProps) => (
    <div className="p-6 border-b border-gray-100 last:border-0 rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <AssignmentIcon className="text-secondary" />
            Contrato
        </h3>
        <div className="input-container">
            <label className="input-label">Seleccionar contrato *</label>
            <div className="input-wrapper">
                {loadingContratos ? (
                    <div className="p-3 bg-gray-50 text-gray-600 border border-gray-200 rounded-md text-sm">
                        Cargando contratos...
                    </div>
                ) : contratos.length > 0 ? (
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                        value={formData.contrato_id || ''}
                        onChange={(e) => handleSelectContrato(Number(e.target.value))}
                        required
                    >
                        <option value="">-- Seleccione un contrato --</option>
                        {contratos.map((contrato) => (
                            <option key={contrato.id_contrato} value={contrato.id_contrato}>
                                Contrato {contrato.id_contrato} - Desde {formatFechaLocal(contrato.fecha_inicio)}
                                {contrato.fecha_fin ? ` hasta ${formatFechaLocal(contrato.fecha_fin)}` : ' (Vigente)'}
                            </option>
                        ))}
                    </select>
                ) : (
                    <div className="p-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Este cliente no tiene contratos activos.
                    </div>
                )}
            </div>
            {selectedContrato && (
                <div className="mt-3 p-3 bg-edit/10 border border-edit-hover rounded-md space-y-1">
                    <p className="text-sm font-semibold text-text">
                        Contrato #{selectedContrato.id_contrato}
                        {tieneRenta && (
                            <span className="ml-2 px-2 py-0.5 bg-secondary text-white text-xs rounded-full font-normal">
                                Incluye renta
                            </span>
                        )}
                    </p>
                </div>
            )}
        </div>
    </div>
);

interface SeccionAreaProps {
    loadingAreas: boolean;
    areas: Area[];
    formData: InstalacionFormData;
    handleSelectArea: (areaId: number) => void;
}

const SeccionArea = ({ loadingAreas, areas, formData, handleSelectArea }: SeccionAreaProps) => (
    <div className="p-6 border-b border-gray-100 last:border-0 rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <LocationOnIcon className="text-secondary" />
            Ubicación
        </h3>
        <div className="input-container">
            <label className="input-label">Seleccionar área *</label>
            <div className="input-wrapper">
                {loadingAreas ? (
                    <div className="p-3 bg-gray-50 text-gray-600 border border-gray-200 rounded-md text-sm">
                        Cargando áreas...
                    </div>
                ) : areas.length > 0 ? (
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                        value={formData.area_id || ''}
                        onChange={(e) => handleSelectArea(Number(e.target.value))}
                        required
                    >
                        <option value="">-- Seleccione un área --</option>
                        {areas.map((area) => (
                            <option key={area.id_area} value={area.id_area}>
                                {area.area_nombre} {area.descripcion ? `- ${area.descripcion}` : ''}
                            </option>
                        ))}
                    </select>
                ) : (
                    <div className="p-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md text-sm font-medium">
                        Este cliente no tiene áreas creadas.
                    </div>
                )}
            </div>
        </div>
    </div>
);

interface CamposMaquinaUnicaProps {
    formData: InstalacionFormData;
    tieneRenta: boolean;
    onChangeIP: (ip: string) => void;
    onChangeObservaciones: (obs: string) => void;
    onChangeCostoRenta?: (costo: number) => void;
    onChangeContadorAcumulativo?: (val: boolean) => void;
    onChangeContabilidadUsuario?: (val: boolean) => void;
}

// IP, renta, forma de contar y observaciones de la instalación de una sola máquina
const CamposMaquinaUnica = ({
    formData,
    tieneRenta,
    onChangeIP,
    onChangeObservaciones,
    onChangeCostoRenta,
    onChangeContadorAcumulativo,
    onChangeContabilidadUsuario,
}: CamposMaquinaUnicaProps) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="input-container">
            <label className="input-label">Dirección IP *</label>
            <div className="input-wrapper">
                <IpAddressInput value={formData.ip_address} onChange={(val) => onChangeIP(val)} required />
            </div>
        </div>

        {tieneRenta && (
            <div className="input-container">
                <label className="input-label">Costo de renta mensual *</label>
                <div className="input-wrapper relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">$</span>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="0.00"
                        value={formData.costo_renta_mensual || ''}
                        onChange={(e) => onChangeCostoRenta?.(Number.parseFloat(e.target.value) || 0)}
                    />
                </div>
            </div>
        )}

        <div className="input-container">
            <label className="input-label">Contabilidad por Usuario</label>
            <div className="input-wrapper">
                <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={formData.contabilidad_por_usuario ? 'true' : 'false'}
                    onChange={(e) => {
                        const val = e.target.value === 'true';
                        onChangeContabilidadUsuario?.(val);
                        // Si desactivan contabilidad por usuario, forzar acumulativo a true
                        if (!val) {
                            onChangeContadorAcumulativo?.(true);
                        }
                    }}
                >
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                </select>
            </div>
        </div>

        <div className="input-container">
            <label className="input-label">
                Contador acumulativo
                {!formData.contabilidad_por_usuario && (
                    <span className="ml-1 text-xs text-gray-400 font-normal normal-case">(obligatorio)</span>
                )}
            </label>
            <div className="input-wrapper">
                <select
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${!formData.contabilidad_por_usuario ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-300'}`}
                    value={formData.contador_acumulativo === false ? 'false' : 'true'}
                    onChange={(e) => onChangeContadorAcumulativo?.(e.target.value === 'true')}
                    disabled={!formData.contabilidad_por_usuario}
                >
                    <option value="true">Habilitado</option>
                    <option value="false">Deshabilitado</option>
                </select>
            </div>
        </div>

        <div className="input-container md:col-span-2">
            <label className="input-label">Observaciones (Opcional)</label>
            <div className="input-wrapper">
                <textarea
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Notas adicionales sobre esta instalación..."
                    value={formData.observaciones || ''}
                    onChange={(e) => onChangeObservaciones(e.target.value)}
                />
            </div>
        </div>
    </div>
);

export const InstalacionFormFields: React.FC<InstalacionFormFieldsProps> = ({
    formData,
    onSelectCliente,
    onSelectArea,
    onSelectContrato,
    onSelectMaquina,
    onChangeIP,
    onChangeFecha,
    onChangeObservaciones,
    onChangeCostoRenta,
    onChangeContadorAcumulativo,
    onChangeContabilidadUsuario,
    allClients = [],
    modoEdicion = false,
    multipleSelection = false,
    maquinasConIP = [],
    onAddMaquina,
    onRemoveMaquina,
    onUpdateMaquinaIP,
    onUpdateMaquinaObservaciones,
    onUpdateMaquinaRenta,
    onUpdateMaquinaContador,
    onUpdateMaquinaContabilidad,
    onUpdateMaquinaArea
}) => {
    const [areas, setAreas] = useState<Area[]>([]);
    const [contratos, setContratos] = useState<Contrato[]>([]);
    const [maquinasDisponibles, setMaquinasDisponibles] = useState<MaquinaSinInstalacion[]>([]);
    const [selectedCliente, setSelectedCliente] = useState<Client | null>(null);
    const [, setSelectedArea] = useState<Area | null>(null);
    const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
    const [selectedMaquinaId, setSelectedMaquinaId] = useState<number>(0);
    const [loadingAreas, setLoadingAreas] = useState(false);
    const [loadingContratos, setLoadingContratos] = useState(false);
    const [, setLoadingMaquinas] = useState(false);

    useEffect(() => {
        const loadClienteData = async () => {
            if (!selectedCliente) {
                setAreas([]);
                setContratos([]);
                setSelectedArea(null);
                setSelectedContrato(null);
                return;
            }
            try {
                setLoadingAreas(true);
                setLoadingContratos(true);
                const [areasData, contratosData] = await Promise.all([
                    getAreasByCliente(selectedCliente.id_cliente),
                    getContratosByCliente(selectedCliente.id_cliente)
                ]);
                setAreas(areasData);
                setContratos(contratosData);
            } catch (error) {
                console.error('Error cargando datos del cliente:', error);
            } finally {
                setLoadingAreas(false);
                setLoadingContratos(false);
            }
        };
        void loadClienteData();
    }, [selectedCliente]);

    useEffect(() => {
        const loadMaquinas = async () => {
            try {
                setLoadingMaquinas(true);
                const maquinas = await getMaquinasDisponibles();
                setMaquinasDisponibles(maquinas);
            } catch (error) {
                console.error('Error cargando máquinas disponibles:', error);
            } finally {
                setLoadingMaquinas(false);
            }
        };
        void loadMaquinas();
    }, []);

    const handleSelectCliente = (cliente: Client) => {
        setSelectedCliente(cliente);
        setSelectedArea(null);
        setSelectedContrato(null);
        onSelectCliente(cliente);
    };

    const handleSelectArea = (areaId: number) => {
        const area = areas.find(a => a.id_area === areaId);
        setSelectedArea(area || null);
        onSelectArea(areaId, area?.area_nombre);
    };

    const handleSelectContrato = (contratoId: number) => {
        const contrato = contratos.find(c => c.id_contrato === contratoId);
        setSelectedContrato(contrato || null);
        onSelectContrato(contratoId, contrato ? `Contrato ${contrato.id_contrato}` : undefined);
    };

    const handleSelectSingleMaquina = (maquina: MaquinaSinInstalacion) => {
        onSelectMaquina(maquina);
    };

    const handleAddMaquina = () => {
        if (selectedMaquinaId === 0) return;
        const maquina = maquinasDisponibles.find(m => m.id_maquina === selectedMaquinaId);
        if (maquina && onAddMaquina) {
            onAddMaquina(maquina);
            setSelectedMaquinaId(0);
        }
    };

    const maquinasNoAgregadas = maquinasDisponibles.filter(
        m => !maquinasConIP.some(mc => mc.maquina.id_maquina === m.id_maquina)
    );

    const tieneRenta = selectedContrato?.renta_equipo === true;
    const colSpanRow2 = tieneRenta ? "md:col-span-4" : "md:col-span-6";

    return (
        <div className="space-y-6">
            {/* ===== CLIENTE ===== */}
            <div className="p-6 border-b border-gray-100 last:border-0 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <InfoIcon className="text-secondary" />
                    Información del Cliente
                </h3>
                <div className="input-container">
                    <label className="input-label">Seleccionar cliente *</label>
                    <div className="input-wrapper">
                        <BusquedaInteligenteClientes
                            onSeleccionar={handleSelectCliente}
                            placeholder="Escribe para buscar un cliente..."
                            itemsCompletos={allClients}
                            disabled={modoEdicion}
                        />
                    </div>
                    {selectedCliente && (
                        <div className="mt-3 p-3 bg-edit/10 border border-edit-hover rounded-md">
                            <p className="text-sm font-semibold text-text">{selectedCliente.nombre}</p>
                            <p className="text-xs text-gray-700">RUC: {selectedCliente.ruc}</p>
                        </div>
                    )}
                </div>
            </div>

            {selectedCliente && (
                <SeccionContrato
                    loadingContratos={loadingContratos}
                    contratos={contratos}
                    formData={formData}
                    handleSelectContrato={handleSelectContrato}
                    selectedContrato={selectedContrato}
                    tieneRenta={tieneRenta}
                />
            )}

            {selectedCliente && formData.contrato_id > 0 && (
                <div className="p-6 border-b border-gray-100 last:border-0 rounded-lg bg-white shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <CalendarTodayIcon className="text-secondary" />
                        Fecha de Instalación
                    </h3>
                    <div className="input-container">
                        <label className="input-label">Seleccionar fecha de instalación *</label>
                        <div className="input-wrapper">
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                value={formData.fecha_instalacion || ''}
                                onChange={(e) => onChangeFecha?.(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>
            )}

            {selectedCliente && !multipleSelection && formData.contrato_id > 0 && (
                <SeccionArea
                    loadingAreas={loadingAreas}
                    areas={areas}
                    formData={formData}
                    handleSelectArea={handleSelectArea}
                />
            )}

            {formData.contrato_id > 0 && (!multipleSelection ? formData.area_id > 0 : true) && (
                <div className="p-6 rounded-lg bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <PrintIcon className="text-secondary" />
                            Selección de Máquina{multipleSelection ? 's' : ''}
                            {multipleSelection && maquinasConIP.length > 0 && (
                                <span className="ml-2 px-2 py-1 bg-edit text-white text-xs rounded-full font-normal">
                                    {maquinasConIP.length} agregada{maquinasConIP.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </h3>
                    </div>

                    {multipleSelection ? (
                        <div className="space-y-6">
                            <div className="input-container">
                                <label className="input-label">Agregar máquina</label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <BuscadorInteligente<MaquinaSinInstalacion>
                                            placeholder="Buscar máquina por serie o modelo..."
                                            buscarFn={async (term) => {
                                                if (!term) return maquinasNoAgregadas;
                                                const lower = term.toLowerCase();
                                                return maquinasNoAgregadas.filter(m =>
                                                    m.serie?.toLowerCase().includes(lower) ||
                                                    m.modelo_nombre?.toLowerCase().includes(lower)
                                                );
                                            }}
                                            onSeleccionar={(maquina) => setSelectedMaquinaId(maquina.id_maquina)}
                                            onClear={() => setSelectedMaquinaId(0)}
                                            getItemKey={(m) => m.id_maquina}
                                            getItemLabel={(m) => `${m.serie} - ${m.modelo_nombre || 'Sin modelo'}`}
                                            itemsCompletos={maquinasNoAgregadas}
                                            initialValue={selectedMaquinaId ? maquinasNoAgregadas.find(m => m.id_maquina === selectedMaquinaId)?.serie || '' : ''}
                                            renderItem={(maquina) => (
                                                <div className="flex flex-col py-1">
                                                    <span className="font-semibold text-gray-900 text-sm">{maquina.serie}</span>
                                                    <span className="text-xs text-gray-500">{maquina.modelo_nombre || 'Sin modelo'} {maquina.tipo_impresion ? ` | ${maquina.tipo_impresion}` : ''}</span>
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddMaquina}
                                        disabled={selectedMaquinaId === 0}
                                        className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 disabled:bg-gray-300 transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={18} /> Agregar
                                    </button>
                                </div>
                            </div>

                            {maquinasConIP.length > 0 && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                        <h4 className="text-sm font-bold text-gray-700">Máquinas a instalar</h4>
                                    </div>
                                    <div className="divide-y divide-gray-200">
                                        {maquinasConIP.map((item) => (
                                            <div key={item.maquina.id_maquina} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-edit to-edit-hover rounded-lg flex items-center justify-center shadow-sm shrink-0">
                                                            <PrintIcon className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-mono font-bold text-gray-900">{item.maquina.serie}</p>
                                                            <p className="text-xs text-gray-600">
                                                                {item.maquina.modelo_nombre || 'Sin modelo'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => onRemoveMaquina?.(item.maquina.id_maquina)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <DeleteIcon className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                    <div className="md:col-span-4">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Área de Instalación *</label>
                                                        <select
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                            value={item.area_id || ''}
                                                            onChange={(e) => onUpdateMaquinaArea?.(item.maquina.id_maquina, Number(e.target.value))}
                                                            required
                                                        >
                                                            <option value="">-- Seleccione un área --</option>
                                                            {areas.map(a => (
                                                                <option key={a.id_area} value={a.id_area}>{a.area_nombre}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-4">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Dirección IP *</label>
                                                        <IpAddressInput
                                                            value={item.ip_address}
                                                            onChange={(val) => onUpdateMaquinaIP?.(item.maquina.id_maquina, val)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="md:col-span-4">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones</label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                            placeholder="Notas opcionales..."
                                                            value={item.observaciones || ''}
                                                            onChange={(e) => onUpdateMaquinaObservaciones?.(item.maquina.id_maquina, e.target.value)}
                                                        />
                                                    </div>

                                                    <div className={colSpanRow2}>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Contabilidad por Usuario</label>
                                                        <select
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                            value={item.contabilidad_por_usuario ? 'true' : 'false'}
                                                            onChange={(e) => {
                                                                const val = e.target.value === 'true';
                                                                onUpdateMaquinaContabilidad?.(item.maquina.id_maquina, val);
                                                                // Si desactivan contabilidad por usuario, forzar acumulativo a true
                                                                if (!val) {
                                                                    onUpdateMaquinaContador?.(item.maquina.id_maquina, true);
                                                                }
                                                            }}
                                                        >
                                                            <option value="false">No</option>
                                                            <option value="true">Sí</option>
                                                        </select>
                                                    </div>
                                                    <div className={colSpanRow2}>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                            Contador acumulativo
                                                            {!item.contabilidad_por_usuario && (
                                                                <span className="ml-1 text-xs text-gray-400 font-normal normal-case">(obligatorio sin contabilidad por usuario)</span>
                                                            )}
                                                        </label>
                                                        <select
                                                            className={`w-full px-3 py-2 border rounded-lg text-sm ${!item.contabilidad_por_usuario ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-300'}`}
                                                            value={item.contador_acumulativo === false ? 'false' : 'true'}
                                                            onChange={(e) => onUpdateMaquinaContador?.(item.maquina.id_maquina, e.target.value === 'true')}
                                                            disabled={!item.contabilidad_por_usuario}
                                                        >
                                                            <option value="true">Habilitado</option>
                                                            <option value="false">Deshabilitado</option>
                                                        </select>
                                                    </div>
                                                    {tieneRenta && (
                                                        <div className={colSpanRow2}>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Costo de renta *</label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">$</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg text-sm"
                                                                    placeholder="0.00"
                                                                    value={item.costo_renta_mensual || ''}
                                                                    onChange={(e) => onUpdateMaquinaRenta?.(item.maquina.id_maquina, Number.parseFloat(e.target.value) || 0)}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="input-container">
                                <label className="input-label">Seleccionar máquina *</label>
                                <div className="input-wrapper">
                                    <BuscadorInteligente<MaquinaSinInstalacion>
                                        placeholder="Buscar máquina por serie o modelo..."
                                        buscarFn={async (term) => {
                                            if (!term) return maquinasDisponibles;
                                            const lower = term.toLowerCase();
                                            return maquinasDisponibles.filter(m =>
                                                m.serie?.toLowerCase().includes(lower) ||
                                                m.modelo_nombre?.toLowerCase().includes(lower)
                                            );
                                        }}
                                        onSeleccionar={(maquina) => handleSelectSingleMaquina(maquina)}
                                        onClear={() => {
                                            // Creamos un dummy object con id 0 para limpiar el form
                                            const emptyMaquina = { id_maquina: 0 } as MaquinaSinInstalacion;
                                            handleSelectSingleMaquina(emptyMaquina);
                                        }}
                                        getItemKey={(m) => m.id_maquina}
                                        getItemLabel={(m) => `${m.serie} - ${m.modelo_nombre || 'Sin modelo'}`}
                                        itemsCompletos={maquinasDisponibles}
                                        initialValue={formData.maquina_id ? maquinasDisponibles.find(m => m.id_maquina === formData.maquina_id)?.serie || '' : ''}
                                        renderItem={(maquina) => (
                                            <div className="flex flex-col py-1">
                                                <span className="font-semibold text-gray-900 text-sm">{maquina.serie}</span>
                                                <span className="text-xs text-gray-500">{maquina.modelo_nombre || 'Sin modelo'}</span>
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>

                            {formData.maquina_id > 0 && (
                                <CamposMaquinaUnica
                                    formData={formData}
                                    tieneRenta={tieneRenta}
                                    onChangeIP={onChangeIP}
                                    onChangeObservaciones={onChangeObservaciones}
                                    onChangeCostoRenta={onChangeCostoRenta}
                                    onChangeContadorAcumulativo={onChangeContadorAcumulativo}
                                    onChangeContabilidadUsuario={onChangeContabilidadUsuario}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InstalacionFormFields;
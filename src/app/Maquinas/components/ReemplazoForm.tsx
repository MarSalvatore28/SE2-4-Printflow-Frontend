import { useEffect, useRef, useState, type FC, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { BuscadorInteligente } from '@components/Shared/BuscadorInteligente';
import { fetchUltimaLectura } from '@services/Maquinas/reemplazos.service';
import type { Maquina } from '@models/Maquina/maquina.types';
import type { LecturaAprobada, ReemplazoFormData } from '@models/Maquina/reemplazo.types';
import { formatNumber, formatFechaISO } from '@utils/formatUtils';

interface ReemplazoFormProps {
    /** Máquinas recién leídas de la API: las asignadas pueden salir, las libres pueden entrar. */
    maquinas: Maquina[];
    tipos: string[];
    isSubmitting: boolean;
    errorApi: string | null;
    onSave: (datos: ReemplazoFormData) => void;
    onCancel: () => void;
}

interface Valores {
    fecha_danio: string;
    fecha_instalacion_entrante: string;
    periodo_afectado: string;
    tipo_cambio: string;
    razon_cambio: string;
    contador_final_saliente_bn: string;
    contador_final_saliente_color: string;
    contador_inicial_entrante_bn: string;
    contador_inicial_entrante_color: string;
    ip_address: string;
}

type CampoForm = keyof Valores | 'saliente' | 'entrante';
type Errores = Partial<Record<CampoForm, string>>;

const VACIO: Valores = {
    fecha_danio: '',
    fecha_instalacion_entrante: '',
    periodo_afectado: '',
    tipo_cambio: '',
    razon_cambio: '',
    contador_final_saliente_bn: '',
    contador_final_saliente_color: '',
    contador_inicial_entrante_bn: '',
    contador_inicial_entrante_color: '',
    ip_address: ''
};

const hoyLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const periodoSiguiente = (periodo: string) => {
    const [anio, mes] = periodo.split('-').map(Number);
    return mes === 12 ? `${anio + 1}-01` : `${anio}-${String(mes + 1).padStart(2, '0')}`;
};

const esEntero = (v: string) => /^\d+$/.test(v.trim());

const inputClass = (conError: boolean) =>
    `w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${conError ? 'border-red-500' : 'border-gray-300'}`;

// Cada palabra debe aparecer en la serie, el modelo, la IP, el cliente o el área
const filtrar = (lista: Maquina[], termino: string) => {
    const palabras = termino.toLowerCase().split(/\s+/).filter(Boolean);
    return lista.filter(m => {
        const texto = [m.serie, m.modelo, m.ip, m.cliente_nombre, m.area_nombre].filter(Boolean).join(' ').toLowerCase();
        return palabras.every(p => texto.includes(p));
    });
};

const Campo: FC<{ id: string; label: string; error?: string; ayuda?: ReactNode; children: ReactNode }> = ({ id, label, error, ayuda, children }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        {children}
        {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : ayuda ? <p className="mt-1 text-xs text-gray-500">{ayuda}</p> : null}
    </div>
);

const TextoLectura: FC<{ lectura: LecturaAprobada | null | undefined; sinLectura: string }> = ({ lectura, sinLectura }) => {
    if (lectura === undefined) return null;
    if (lectura === null) return <>{sinLectura}</>;
    return (
        <>Última lectura aprobada ({lectura.periodo}): B/N <span className="font-mono">{formatNumber(lectura.bn)}</span> · color <span className="font-mono">{formatNumber(lectura.color)}</span>. El contador no puede ser menor.</>
    );
};

export const ReemplazoForm: FC<ReemplazoFormProps> = ({ maquinas, tipos, isSubmitting, errorApi, onSave, onCancel }) => {
    const [saliente, setSaliente] = useState<Maquina | null>(null);
    const [entrante, setEntrante] = useState<Maquina | null>(null);
    const [valores, setValores] = useState<Valores>(VACIO);
    const [periodoEditado, setPeriodoEditado] = useState(false);
    const [errores, setErrores] = useState<Errores>({});
    // undefined = aún no se consulta; null = la máquina no tiene lecturas aprobadas
    const [lecturaSaliente, setLecturaSaliente] = useState<LecturaAprobada | null | undefined>(undefined);
    const [lecturaEntrante, setLecturaEntrante] = useState<LecturaAprobada | null | undefined>(undefined);

    // El error de la API aparece arriba del formulario: se lleva a la vista al llegar
    const alertaRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (errorApi) alertaRef.current?.scrollIntoView({ block: 'center' });
    }, [errorApi]);

    const hoy = hoyLocal();
    const asignadas = maquinas.filter(m => m.activo && m.asignada);
    const libres = maquinas.filter(m => m.activo && !m.asignada);

    const cambiar = (campo: keyof Valores, valor: string) => {
        setValores(prev => {
            const nuevo = { ...prev, [campo]: valor };
            // El período sigue al mes del daño mientras el usuario no lo cambie a mano
            if (campo === 'fecha_danio' && !periodoEditado && valor) nuevo.periodo_afectado = valor.slice(0, 7);
            return nuevo;
        });
        if (campo === 'periodo_afectado') setPeriodoEditado(true);
        setErrores(prev => ({ ...prev, [campo]: undefined }));
    };

    // Lecturas aprobadas antes del período: guían los contadores (la API rechaza uno menor)
    useEffect(() => {
        const periodo = valores.periodo_afectado;
        if (!saliente || !/^\d{4}-\d{2}$/.test(periodo)) return;
        let cancelado = false;
        fetchUltimaLectura(saliente.id_maquina, periodo)
            .then(l => { if (!cancelado) setLecturaSaliente(l); })
            .catch(() => { if (!cancelado) setLecturaSaliente(undefined); });
        return () => { cancelado = true; };
    }, [saliente, valores.periodo_afectado]);

    useEffect(() => {
        const periodo = valores.periodo_afectado;
        if (!entrante || !/^\d{4}-\d{2}$/.test(periodo)) return;
        let cancelado = false;
        fetchUltimaLectura(entrante.id_maquina, periodo)
            .then(l => { if (!cancelado) setLecturaEntrante(l); })
            .catch(() => { if (!cancelado) setLecturaEntrante(undefined); });
        return () => { cancelado = true; };
    }, [entrante, valores.periodo_afectado]);

    const validar = (): Errores => {
        const e: Errores = {};
        if (!saliente) e.saliente = 'Seleccione la máquina que sale (debe estar asignada)';
        if (!entrante) e.entrante = 'Seleccione la máquina que entra (debe estar libre)';
        if (!valores.fecha_danio) e.fecha_danio = 'Indique la fecha del daño';
        else if (valores.fecha_danio > hoy) e.fecha_danio = 'La fecha del daño no puede ser futura';
        else if (saliente?.fecha_instalacion && valores.fecha_danio < saliente.fecha_instalacion) {
            e.fecha_danio = `No puede ser anterior a la instalación de ${saliente.serie} (${formatFechaISO(saliente.fecha_instalacion)})`;
        }
        if (!valores.fecha_instalacion_entrante) e.fecha_instalacion_entrante = 'Indique la fecha de instalación de la entrante';
        else if (valores.fecha_instalacion_entrante > hoy) e.fecha_instalacion_entrante = 'La fecha de instalación no puede ser futura';
        else if (valores.fecha_danio && valores.fecha_instalacion_entrante < valores.fecha_danio) {
            e.fecha_instalacion_entrante = 'No puede ser anterior a la fecha del daño';
        }
        if (!/^\d{4}-\d{2}$/.test(valores.periodo_afectado)) e.periodo_afectado = 'Indique el período afectado';
        else if (valores.fecha_danio) {
            const mes = valores.fecha_danio.slice(0, 7);
            if (valores.periodo_afectado !== mes && valores.periodo_afectado !== periodoSiguiente(mes)) {
                e.periodo_afectado = `Debe ser el mes del daño (${mes}) o el siguiente (${periodoSiguiente(mes)})`;
            }
        }
        if (!valores.tipo_cambio) e.tipo_cambio = 'Seleccione el tipo de cambio';
        if (valores.razon_cambio.trim().length < 5) e.razon_cambio = 'Describa la razón del cambio (mínimo 5 caracteres)';
        (['contador_final_saliente_bn', 'contador_final_saliente_color', 'contador_inicial_entrante_bn', 'contador_inicial_entrante_color'] as const)
            .forEach(c => { if (!esEntero(valores[c])) e[c] = 'Número entero mayor o igual a 0'; });
        if (valores.ip_address.trim() && !/^(\d{1,3}\.){3}\d{1,3}$/.test(valores.ip_address.trim())) {
            e.ip_address = 'IPv4 válida, p. ej. 10.20.1.12';
        }
        return e;
    };

    const handleGuardar = () => {
        const e = validar();
        setErrores(e);
        if (Object.keys(e).length > 0 || !saliente || !entrante) return;
        onSave({
            maquina_saliente_id: saliente.id_maquina,
            maquina_entrante_id: entrante.id_maquina,
            fecha_danio: valores.fecha_danio,
            fecha_instalacion_entrante: valores.fecha_instalacion_entrante,
            periodo_afectado: valores.periodo_afectado,
            tipo_cambio: valores.tipo_cambio,
            razon_cambio: valores.razon_cambio.trim(),
            contador_final_saliente_bn: Number(valores.contador_final_saliente_bn),
            contador_final_saliente_color: Number(valores.contador_final_saliente_color),
            contador_inicial_entrante_bn: Number(valores.contador_inicial_entrante_bn),
            contador_inicial_entrante_color: Number(valores.contador_inicial_entrante_color),
            ip_address: valores.ip_address.trim() || null
        });
    };

    const renderMaquina = (m: Maquina) => (
        <div className="flex flex-col py-1">
            <span className="font-semibold text-gray-900 text-sm font-mono">{m.serie}</span>
            <span className="text-xs text-gray-500">
                {m.modelo || 'Sin modelo'}
                {m.tipo_impresion ? ` · ${m.tipo_impresion === 'BN' ? 'B/N' : m.tipo_impresion}` : ''}
                {m.cliente_nombre ? ` · ${m.cliente_nombre}` : ''}
                {m.area_nombre ? ` · ${m.area_nombre}` : ''}
                {m.ip ? ` · ${m.ip}` : ''}
            </span>
        </div>
    );

    const tarjeta = (m: Maquina, color: 'red' | 'green', detalle: ReactNode) => (
        <div className={`mt-3 p-3 rounded-lg border text-sm ${color === 'red' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <p className="font-mono font-semibold text-gray-900">{m.serie}</p>
            <p className="text-gray-600">{m.modelo || 'Sin modelo'}</p>
            <p className="text-gray-600 mt-1">{detalle}</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-8">
            {errorApi && (
                <div ref={alertaRef} role="alert" data-testid="error-reemplazo" className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    {errorApi}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">
                <div>
                    <p className="block text-sm font-medium text-gray-700 mb-2">Máquina saliente (dañada) *</p>
                    <BuscadorInteligente<Maquina>
                        placeholder="Buscar asignada: serie, modelo, IP o cliente"
                        buscarFn={async (t) => filtrar(asignadas, t)}
                        itemsCompletos={asignadas}
                        getItemKey={(m) => m.id_maquina}
                        getItemLabel={(m) => m.serie}
                        onSeleccionar={(m) => {
                            setSaliente(m);
                            setLecturaSaliente(undefined);
                            setErrores(prev => ({ ...prev, saliente: undefined, entrante: undefined }));
                        }}
                        onClear={() => { setSaliente(null); setLecturaSaliente(undefined); }}
                        renderItem={renderMaquina}
                    />
                    {errores.saliente && <p className="mt-1 text-sm text-red-600">{errores.saliente}</p>}
                    {saliente && tarjeta(saliente, 'red', (
                        <>
                            {saliente.cliente_nombre} · {saliente.area_nombre}
                            {saliente.ip ? ` · IP ${saliente.ip}` : ''}
                            {saliente.fecha_instalacion ? ` · instalada el ${formatFechaISO(saliente.fecha_instalacion)}` : ''}
                        </>
                    ))}
                </div>

                <div className="hidden lg:flex items-center justify-center pt-9 text-gray-400">
                    <ArrowRight className="w-6 h-6" />
                </div>

                <div>
                    <p className="block text-sm font-medium text-gray-700 mb-2">Máquina entrante (reemplazo) *</p>
                    <BuscadorInteligente<Maquina>
                        placeholder="Buscar libre: serie o modelo"
                        buscarFn={async (t) => filtrar(libres, t)}
                        itemsCompletos={libres}
                        getItemKey={(m) => m.id_maquina}
                        getItemLabel={(m) => m.serie}
                        onSeleccionar={(m) => {
                            setEntrante(m);
                            setLecturaEntrante(undefined);
                            setErrores(prev => ({ ...prev, entrante: undefined }));
                        }}
                        onClear={() => { setEntrante(null); setLecturaEntrante(undefined); }}
                        renderItem={renderMaquina}
                    />
                    {errores.entrante && <p className="mt-1 text-sm text-red-600">{errores.entrante}</p>}
                    {libres.length === 0 && (
                        <p className="mt-1 text-xs text-gray-500">No hay máquinas activas sin asignación. Créela primero en la pestaña Agregar.</p>
                    )}
                    {entrante && tarjeta(entrante, 'green', (
                        saliente
                            ? <>Quedará asignada en {saliente.cliente_nombre} · {saliente.area_nombre}, con el mismo contrato{saliente.ip ? ` e IP ${valores.ip_address.trim() || saliente.ip}` : ''}</>
                            : <>Libre · se asigna en el área de la saliente</>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                <Campo id="reemplazo-fecha-danio" label="Fecha del daño *" error={errores.fecha_danio} ayuda="Ese día se retira la asignación de la saliente">
                    <input id="reemplazo-fecha-danio" type="date" max={hoy} className={inputClass(!!errores.fecha_danio)}
                        value={valores.fecha_danio} onChange={(e) => cambiar('fecha_danio', e.target.value)} />
                </Campo>
                <Campo id="reemplazo-fecha-instalacion" label="Instalación de la entrante *" error={errores.fecha_instalacion_entrante} ayuda="Igual o posterior a la fecha del daño">
                    <input id="reemplazo-fecha-instalacion" type="date" min={valores.fecha_danio || undefined} max={hoy}
                        className={inputClass(!!errores.fecha_instalacion_entrante)}
                        value={valores.fecha_instalacion_entrante} onChange={(e) => cambiar('fecha_instalacion_entrante', e.target.value)} />
                </Campo>
                <Campo id="reemplazo-periodo" label="Período afectado *" error={errores.periodo_afectado} ayuda="Mes del daño, o el siguiente si ocurrió después del corte">
                    <input id="reemplazo-periodo" type="month" className={inputClass(!!errores.periodo_afectado)}
                        value={valores.periodo_afectado} onChange={(e) => cambiar('periodo_afectado', e.target.value)} />
                </Campo>
                <Campo id="reemplazo-tipo" label="Tipo de cambio *" error={errores.tipo_cambio}>
                    <select id="reemplazo-tipo" className={inputClass(!!errores.tipo_cambio)}
                        value={valores.tipo_cambio} onChange={(e) => cambiar('tipo_cambio', e.target.value)}>
                        <option value="">Seleccione...</option>
                        {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </Campo>
                <div className="md:col-span-2">
                    <Campo id="reemplazo-razon" label="Razón del cambio *" error={errores.razon_cambio}>
                        <textarea id="reemplazo-razon" rows={2} maxLength={500} className={inputClass(!!errores.razon_cambio)}
                            placeholder="Ej: Falla del fusor, la impresora dejó de imprimir"
                            value={valores.razon_cambio} onChange={(e) => cambiar('razon_cambio', e.target.value)} />
                    </Campo>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <fieldset className="border border-red-200 rounded-lg p-4">
                    <legend className="px-2 text-sm font-semibold text-red-800">Contador final de la saliente (al salir)</legend>
                    <div className="grid grid-cols-2 gap-4">
                        <Campo id="reemplazo-sal-bn" label="B/N *" error={errores.contador_final_saliente_bn}>
                            <input id="reemplazo-sal-bn" inputMode="numeric" className={`${inputClass(!!errores.contador_final_saliente_bn)} font-mono`}
                                value={valores.contador_final_saliente_bn} onChange={(e) => cambiar('contador_final_saliente_bn', e.target.value)} />
                        </Campo>
                        <Campo id="reemplazo-sal-color" label="Color *" error={errores.contador_final_saliente_color}>
                            <input id="reemplazo-sal-color" inputMode="numeric" className={`${inputClass(!!errores.contador_final_saliente_color)} font-mono`}
                                value={valores.contador_final_saliente_color} onChange={(e) => cambiar('contador_final_saliente_color', e.target.value)} />
                        </Campo>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                        {saliente
                            ? <TextoLectura lectura={lecturaSaliente} sinLectura="Sin lecturas aprobadas antes de este período." />
                            : 'Total B/N y total color del equipo (impresiones + copias).'}
                    </p>
                </fieldset>

                <fieldset className="border border-green-200 rounded-lg p-4">
                    <legend className="px-2 text-sm font-semibold text-green-800">Contador inicial de la entrante (al entrar)</legend>
                    <div className="grid grid-cols-2 gap-4">
                        <Campo id="reemplazo-ent-bn" label="B/N *" error={errores.contador_inicial_entrante_bn}>
                            <input id="reemplazo-ent-bn" inputMode="numeric" className={`${inputClass(!!errores.contador_inicial_entrante_bn)} font-mono`}
                                value={valores.contador_inicial_entrante_bn} onChange={(e) => cambiar('contador_inicial_entrante_bn', e.target.value)} />
                        </Campo>
                        <Campo id="reemplazo-ent-color" label="Color *" error={errores.contador_inicial_entrante_color}>
                            <input id="reemplazo-ent-color" inputMode="numeric" className={`${inputClass(!!errores.contador_inicial_entrante_color)} font-mono`}
                                value={valores.contador_inicial_entrante_color} onChange={(e) => cambiar('contador_inicial_entrante_color', e.target.value)} />
                        </Campo>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                        {entrante
                            ? <TextoLectura lectura={lecturaEntrante} sinLectura="Máquina sin lecturas anteriores: anote lo que marca al instalarse." />
                            : 'Lo que marca la entrante al instalarse; su consumo del mes parte de aquí.'}
                    </p>
                </fieldset>
            </div>

            <div className="md:w-1/3">
                <Campo id="reemplazo-ip" label="IP de la entrante" error={errores.ip_address}
                    ayuda={saliente?.ip ? `Vacío = la misma IP de la saliente (${saliente.ip})` : 'Vacío = la misma IP de la saliente'}>
                    <input id="reemplazo-ip" className={`${inputClass(!!errores.ip_address)} font-mono`} placeholder={saliente?.ip || '10.20.1.12'}
                        value={valores.ip_address} onChange={(e) => cambiar('ip_address', e.target.value)} maxLength={15} />
                </Campo>
            </div>

            <div className="flex justify-end gap-4">
                <button type="button" onClick={onCancel} disabled={isSubmitting}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                    Cancelar
                </button>
                <button type="button" onClick={handleGuardar} disabled={isSubmitting}
                    className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Registrando...
                        </>
                    ) : 'Registrar reemplazo'}
                </button>
            </div>
        </div>
    );
};

export default ReemplazoForm;

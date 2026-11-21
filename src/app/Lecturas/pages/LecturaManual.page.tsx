import { useEffect, useRef, useState, type FC, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ClipboardPen, Loader2, XCircle } from 'lucide-react';
import { BuscadorInteligente } from '@components/Shared/BuscadorInteligente';
import { getTodasInstalacionesActivas } from '@services/Instalaciones/instalaciones.service';
import { fetchUltimaLectura } from '@services/Maquinas/reemplazos.service';
import { registrarLecturaManual } from '@services/Lecturas/lecturas.service';
import type { InstalacionActivaCliente } from '@models/Instalacion/Instalacion.types';
import type { LecturaAprobada } from '@models/Maquina/reemplazo.types';
import type { LecturaManual } from '@models/Lectura/lectura.types';
import { formatFechaISO, formatNumber } from '@utils/formatUtils';

// S3-04 · Lectura manual: si una impresora no envió su correo, el operador registra los
// contadores que leyó en la máquina. La lectura pasa a los reportes oficiales del mes.

const OBSERVACION_MAX = 500;

interface Valores {
    fecha_lectura: string;
    contador_bn: string;
    contador_color: string;
    observacion: string;
}

type Campo = keyof Valores | 'asignacion';
type Errores = Partial<Record<Campo, string>>;

interface Registro {
    lectura: LecturaManual;
    anterior: LecturaAprobada | null;
    segundos: number;
}

const hoyLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const esEntero = (v: string) => /^\d+$/.test(v.trim());

const inputClass = (conError: boolean) =>
    `w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${conError ? 'border-red-500' : 'border-gray-300'}`;

const esBn = (a: InstalacionActivaCliente) => a.tipo_impresion === 'BN';

// Cada palabra debe aparecer en la serie, el cliente, el área, la IP o el modelo
const filtrar = (lista: InstalacionActivaCliente[], termino: string) => {
    const palabras = termino.toLowerCase().split(/\s+/).filter(Boolean);
    return lista.filter((a) => {
        const texto = [a.serie, a.cliente_nombre, a.area_nombre, a.ip_address, a.modelo_nombre]
            .filter(Boolean).join(' ').toLowerCase();
        return palabras.every((p) => texto.includes(p));
    });
};

const CampoForm: FC<{ id: string; label: string; error?: string; ayuda?: ReactNode; children: ReactNode }> = ({ id, label, error, ayuda, children }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        {children}
        {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : ayuda ? <p className="mt-1 text-xs text-gray-500">{ayuda}</p> : null}
    </div>
);

const LecturaManualPage = () => {
    const [params] = useSearchParams();
    const seriePedida = (params.get('serie') || '').trim().toUpperCase();

    const [asignaciones, setAsignaciones] = useState<InstalacionActivaCliente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);

    const [asignacion, setAsignacion] = useState<InstalacionActivaCliente | null>(null);
    const [buscadorKey, setBuscadorKey] = useState(0);
    // undefined = aún no se consulta; null = la máquina no tiene lecturas aprobadas
    const [ultima, setUltima] = useState<LecturaAprobada | null | undefined>(undefined);
    const [valores, setValores] = useState<Valores>(() => ({ fecha_lectura: hoyLocal(), contador_bn: '', contador_color: '', observacion: '' }));
    const [errores, setErrores] = useState<Errores>({});

    const [guardando, setGuardando] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState<string | null>(null);
    const [registro, setRegistro] = useState<Registro | null>(null);
    const [avisoSerie, setAvisoSerie] = useState<string | null>(null);

    // Cronómetro del registro: desde que se abre la pantalla (o desde la lectura anterior) hasta guardar
    const inicio = useRef(performance.now());
    const motivoRef = useRef<HTMLDivElement>(null);

    const hoy = hoyLocal();
    const periodo = /^\d{4}-\d{2}-\d{2}$/.test(valores.fecha_lectura) ? valores.fecha_lectura.slice(0, 7) : '';

    useEffect(() => {
        let cancelado = false;
        getTodasInstalacionesActivas()
            .then((lista) => {
                if (cancelado) return;
                setAsignaciones(lista);
                setErrorCarga(null);
                // Desde «Lectura manual» de un reporte con error: llega la serie de la máquina
                if (seriePedida) {
                    const encontrada = lista.find((a) => a.serie.toUpperCase() === seriePedida);
                    if (encontrada) {
                        setAsignacion(encontrada);
                        setBuscadorKey((k) => k + 1);
                    } else {
                        setAvisoSerie(`La máquina ${seriePedida} no tiene una asignación vigente. Asígnela primero en Asignaciones (o regístrela en Máquinas) y vuelva a esta pantalla.`);
                    }
                }
            })
            .catch(() => { if (!cancelado) setErrorCarga('No se pudieron cargar las asignaciones vigentes. Intente de nuevo.'); })
            .finally(() => { if (!cancelado) setCargando(false); });
        return () => { cancelado = true; };
    }, [seriePedida]);

    // Última lectura aprobada antes del mes de la lectura: la referencia para los contadores
    useEffect(() => {
        if (!asignacion || !periodo) return;
        let cancelado = false;
        fetchUltimaLectura(asignacion.id_maquina, periodo)
            .then((l) => { if (!cancelado) setUltima(l); })
            .catch(() => { if (!cancelado) setUltima(undefined); });
        return () => { cancelado = true; };
    }, [asignacion, periodo]);

    useEffect(() => {
        if (motivoRechazo) motivoRef.current?.scrollIntoView({ block: 'center' });
    }, [motivoRechazo]);

    const cambiar = (campo: keyof Valores, valor: string) => {
        setValores((prev) => ({ ...prev, [campo]: valor }));
        setErrores((prev) => ({ ...prev, [campo]: undefined }));
        setMotivoRechazo(null);
    };

    const elegir = (a: InstalacionActivaCliente | null) => {
        setAsignacion(a);
        setUltima(undefined);
        setMotivoRechazo(null);
        setAvisoSerie(null);
        setErrores((prev) => ({ ...prev, asignacion: undefined }));
        // Una impresora B/N no tiene contador de color
        if (a && esBn(a)) setValores((prev) => ({ ...prev, contador_color: prev.contador_color || '0' }));
    };

    const validar = (): Errores => {
        const e: Errores = {};
        if (!asignacion) e.asignacion = 'Seleccione la máquina (asignación vigente)';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(valores.fecha_lectura)) e.fecha_lectura = 'Indique la fecha de la lectura';
        else if (valores.fecha_lectura > hoy) e.fecha_lectura = 'La fecha no puede ser futura';
        else if (asignacion?.fecha_instalacion && valores.fecha_lectura < asignacion.fecha_instalacion.slice(0, 10)) {
            e.fecha_lectura = `No puede ser anterior a la instalación (${formatFechaISO(asignacion.fecha_instalacion)})`;
        }
        if (!esEntero(valores.contador_bn)) e.contador_bn = 'Número entero mayor o igual a 0';
        if (!esEntero(valores.contador_color)) e.contador_color = 'Número entero mayor o igual a 0';
        if (!valores.observacion.trim()) e.observacion = 'Indique por qué se registra a mano (obligatoria)';
        return e;
    };

    const guardar = async () => {
        const e = validar();
        setErrores(e);
        setMotivoRechazo(null);
        if (Object.keys(e).length > 0 || !asignacion) return;

        setGuardando(true);
        try {
            const lectura = await registrarLecturaManual({
                instalacion_id: asignacion.id_instalacion,
                fecha_lectura: valores.fecha_lectura,
                contador_bn: Number(valores.contador_bn),
                contador_color: Number(valores.contador_color),
                observacion: valores.observacion.trim(),
            });
            const segundos = Math.max(1, Math.round((performance.now() - inicio.current) / 1000));
            setRegistro({ lectura, anterior: ultima ?? null, segundos });
            // Listo para la siguiente máquina
            setAsignacion(null);
            setUltima(undefined);
            setBuscadorKey((k) => k + 1);
            setValores({ fecha_lectura: valores.fecha_lectura, contador_bn: '', contador_color: '', observacion: '' });
            inicio.current = performance.now();
        } catch (err) {
            setMotivoRechazo(err instanceof Error ? err.message : 'No se pudo registrar la lectura.');
        } finally {
            setGuardando(false);
        }
    };

    // Aviso (no bloquea: la API decide) si un contador es menor que la última lectura aprobada
    const menorQueUltima = (campo: 'contador_bn' | 'contador_color', referencia: number | undefined) =>
        ultima && referencia !== undefined && esEntero(valores[campo]) && Number(valores[campo]) < referencia;

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 mt-4" data-testid="pantalla-lectura-manual">
            <div className="flex items-center gap-3 mb-2">
                <ClipboardPen className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-gray-900">Lectura manual</h1>
            </div>
            <p className="text-sm text-gray-600 mb-6">
                Si una impresora no envió su correo, registre aquí los contadores que leyó en la máquina.
                La lectura entra a los reportes oficiales del mes de la fecha de lectura.
            </p>

            {errorCarga && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{errorCarga}</div>}
            {avisoSerie && (
                <div role="note" data-testid="aviso-serie" className="mb-4 flex items-start gap-2 p-3 rounded-lg border border-yellow-300 bg-yellow-50 text-sm text-yellow-900">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {avisoSerie}
                </div>
            )}

            {registro && (
                <div role="status" data-testid="lectura-registrada" className="mb-6 flex items-start gap-2 p-4 rounded-lg border border-green-200 bg-green-50 text-sm text-green-900">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">
                            Lectura de <span className="font-mono">{registro.lectura.snap_maquina_serie}</span> registrada para {registro.lectura.periodo}
                            {registro.lectura.cliente_nombre ? ` (${registro.lectura.cliente_nombre} · ${registro.lectura.snap_area_nombre})` : ''}.
                        </p>
                        <p className="mt-1">
                            B/N <span className="font-mono">{formatNumber(registro.lectura.contador_bn)}</span> · color <span className="font-mono">{formatNumber(registro.lectura.contador_color)}</span>
                            {registro.anterior && (
                                <> · consumo respecto a {registro.anterior.periodo}: B/N <span className="font-mono">{formatNumber(registro.lectura.contador_bn - registro.anterior.bn)}</span>, color <span className="font-mono">{formatNumber(registro.lectura.contador_color - registro.anterior.color)}</span></>
                            )}
                        </p>
                        <p className="mt-1 text-xs text-green-800" data-testid="tiempo-registro">Tiempo de registro: {registro.segundos} s.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 items-start">
                <div className="flex flex-col gap-6">
                    <div>
                        <p className="block text-sm font-medium text-gray-700 mb-2">Máquina (asignación vigente) *</p>
                        <BuscadorInteligente<InstalacionActivaCliente>
                            key={buscadorKey}
                            placeholder={cargando ? 'Cargando asignaciones…' : 'Buscar por serie, cliente, área o IP'}
                            disabled={cargando}
                            buscarFn={async (t) => filtrar(asignaciones, t)}
                            itemsCompletos={asignaciones}
                            getItemKey={(a) => a.id_instalacion}
                            getItemLabel={(a) => a.serie}
                            initialValue={asignacion?.serie ?? ''}
                            onSeleccionar={elegir}
                            onClear={() => elegir(null)}
                            renderItem={(a) => (
                                <div className="flex flex-col py-1">
                                    <span className="font-semibold text-gray-900 text-sm font-mono">{a.serie}</span>
                                    <span className="text-xs text-gray-500">
                                        {a.cliente_nombre} · {a.area_nombre}{a.ip_address ? ` · ${a.ip_address}` : ''}{a.modelo_nombre ? ` · ${a.modelo_nombre}` : ''}
                                    </span>
                                </div>
                            )}
                        />
                        {errores.asignacion && <p className="mt-1 text-sm text-red-600">{errores.asignacion}</p>}
                        {!cargando && asignaciones.length === 0 && !errorCarga && (
                            <p className="mt-1 text-xs text-gray-500">No hay máquinas con una asignación vigente.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <CampoForm id="lectura-fecha" label="Fecha de lectura *" error={errores.fecha_lectura} ayuda={periodo ? `Período ${periodo}` : undefined}>
                            <input id="lectura-fecha" type="date" max={hoy} className={inputClass(!!errores.fecha_lectura)}
                                value={valores.fecha_lectura} onChange={(e) => cambiar('fecha_lectura', e.target.value)} />
                        </CampoForm>
                        <CampoForm id="lectura-bn" label="Contador B/N *" error={errores.contador_bn}
                            ayuda={menorQueUltima('contador_bn', ultima?.bn) ? <span className="text-yellow-700">Es menor que la última lectura aprobada</span> : 'Total B/N (impresiones + copias)'}>
                            <input id="lectura-bn" inputMode="numeric" autoComplete="off" className={`${inputClass(!!errores.contador_bn)} font-mono`}
                                value={valores.contador_bn} onChange={(e) => cambiar('contador_bn', e.target.value)} />
                        </CampoForm>
                        <CampoForm id="lectura-color" label="Contador color *" error={errores.contador_color}
                            ayuda={menorQueUltima('contador_color', ultima?.color) ? <span className="text-yellow-700">Es menor que la última lectura aprobada</span> : asignacion && esBn(asignacion) ? 'Impresora B/N: 0' : 'Total color (impresiones + copias)'}>
                            <input id="lectura-color" inputMode="numeric" autoComplete="off" className={`${inputClass(!!errores.contador_color)} font-mono`}
                                value={valores.contador_color} onChange={(e) => cambiar('contador_color', e.target.value)} />
                        </CampoForm>
                    </div>

                    <CampoForm id="lectura-observacion" label="Observación *" error={errores.observacion}
                        ayuda={`Por qué se registra a mano (${valores.observacion.length}/${OBSERVACION_MAX})`}>
                        <textarea id="lectura-observacion" rows={2} maxLength={OBSERVACION_MAX} className={inputClass(!!errores.observacion)}
                            placeholder="Ej: la impresora no envió el correo; lectura tomada en sitio por el técnico"
                            value={valores.observacion} onChange={(e) => cambiar('observacion', e.target.value)} />
                    </CampoForm>

                    {motivoRechazo && (
                        <div ref={motivoRef} role="alert" data-testid="motivo-rechazo" className="flex items-start gap-2 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm">
                            <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">No se registró la lectura</p>
                                <p>{motivoRechazo}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button type="button" onClick={guardar} disabled={guardando || cargando}
                            className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2">
                            {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</> : 'Registrar lectura'}
                        </button>
                    </div>
                </div>

                <aside className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm" data-testid="referencia-lectura">
                    <h2 className="font-semibold text-gray-900 mb-3">Referencia</h2>
                    {!asignacion ? (
                        <p className="text-gray-500">Elija la máquina para ver su asignación y su última lectura aprobada.</p>
                    ) : (
                        <dl className="space-y-2">
                            <div>
                                <dt className="text-xs uppercase tracking-wide text-gray-500">Máquina</dt>
                                <dd className="font-mono font-semibold text-gray-900">{asignacion.serie}</dd>
                                <dd className="text-gray-600">{asignacion.modelo_nombre || 'Sin modelo'}{asignacion.tipo_impresion ? ` · ${esBn(asignacion) ? 'B/N' : asignacion.tipo_impresion}` : ''}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wide text-gray-500">Asignación</dt>
                                <dd className="text-gray-900">{asignacion.cliente_nombre} · {asignacion.area_nombre}</dd>
                                <dd className="text-gray-600">IP {asignacion.ip_address || '—'} · instalada el {formatFechaISO(asignacion.fecha_instalacion)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wide text-gray-500">Última lectura aprobada{periodo ? ` antes de ${periodo}` : ''}</dt>
                                {ultima === undefined ? (
                                    <dd className="text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Consultando…</dd>
                                ) : ultima === null ? (
                                    <dd className="text-gray-600">Sin lecturas aprobadas.</dd>
                                ) : (
                                    <dd className="text-gray-900" data-testid="ultima-lectura">
                                        {ultima.periodo}: B/N <span className="font-mono">{formatNumber(ultima.bn)}</span> · color <span className="font-mono">{formatNumber(ultima.color)}</span>
                                    </dd>
                                )}
                            </div>
                        </dl>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default LecturaManualPage;

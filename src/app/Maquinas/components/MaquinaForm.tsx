import { useEffect, useRef, useState, type FC, type ReactNode } from 'react';
import { Plus, X } from 'lucide-react';
import type {
    Maquina,
    MaquinaFormData,
    Modelo,
    TipoImpresion,
    FormatoImpresion
} from '@models/Maquina/maquina.types';

interface MaquinaFormValues {
    serie: string;
    modelo_id: string;
    tipo_impresion_id: string;
    formato_impresion_id: string;
}

type ErroresCampo = Partial<Record<keyof MaquinaFormValues, string>>;

interface MaquinaFormProps {
    maquina: Maquina | null;
    modelos: Modelo[];
    tipos: TipoImpresion[];
    formatos: FormatoImpresion[];
    isSubmitting: boolean;
    errorApi: string | null;
    onSave: (datos: MaquinaFormData) => void;
    onCancel: () => void;
    onCrearModelo: (nombre: string) => Promise<Modelo>;
}

// Misma regla que el backend: mayúsculas y sin espacios.
const normalizarSerie = (serie: string) => serie.replace(/\s+/g, '').toUpperCase();

const valoresIniciales = (maquina: Maquina | null): MaquinaFormValues => ({
    serie: maquina?.serie ?? '',
    modelo_id: maquina?.modelo_id ? String(maquina.modelo_id) : '',
    tipo_impresion_id: maquina?.tipo_impresion_id ? String(maquina.tipo_impresion_id) : '',
    formato_impresion_id: maquina?.formato_impresion_id ? String(maquina.formato_impresion_id) : ''
});

const inputClass = (conError: boolean) =>
    `w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${conError ? 'border-red-500' : 'border-gray-300'}`;

export const MaquinaForm: FC<MaquinaFormProps> = ({
    maquina,
    modelos,
    tipos,
    formatos,
    isSubmitting,
    errorApi,
    onSave,
    onCancel,
    onCrearModelo
}) => {
    const [valores, setValores] = useState<MaquinaFormValues>(() => valoresIniciales(maquina));
    const [errores, setErrores] = useState<ErroresCampo>({});

    const [creandoModelo, setCreandoModelo] = useState(false);
    const nuevoModeloRef = useRef<HTMLInputElement>(null);
    // Al pulsar «nuevo modelo» el foco pasa a su campo (lo pidió el usuario con el botón)
    useEffect(() => {
        if (creandoModelo) nuevoModeloRef.current?.focus();
    }, [creandoModelo]);
    const [nombreModelo, setNombreModelo] = useState('');
    const [errorModelo, setErrorModelo] = useState<string | null>(null);
    const [guardandoModelo, setGuardandoModelo] = useState(false);

    const cambiar = (campo: keyof MaquinaFormValues, valor: string) => {
        setValores(prev => ({ ...prev, [campo]: valor }));
        setErrores(prev => ({ ...prev, [campo]: undefined }));
    };

    const validar = (): ErroresCampo => {
        const e: ErroresCampo = {};
        if (!normalizarSerie(valores.serie)) e.serie = 'La serie es obligatoria';
        else if (normalizarSerie(valores.serie).length > 50) e.serie = 'La serie no puede tener más de 50 caracteres';
        if (!valores.modelo_id) e.modelo_id = 'Seleccione un modelo';
        if (!valores.tipo_impresion_id) e.tipo_impresion_id = 'Seleccione el tipo de impresión';
        return e;
    };

    const handleGuardar = () => {
        const e = validar();
        setErrores(e);
        if (Object.keys(e).length > 0) return;
        onSave({
            serie: normalizarSerie(valores.serie),
            modelo_id: Number(valores.modelo_id),
            tipo_impresion_id: Number(valores.tipo_impresion_id),
            formato_impresion_id: valores.formato_impresion_id ? Number(valores.formato_impresion_id) : null
        });
    };

    const handleCrearModelo = async () => {
        const nombre = nombreModelo.trim();
        if (!nombre) {
            setErrorModelo('Escriba el nombre del modelo');
            return;
        }
        setGuardandoModelo(true);
        setErrorModelo(null);
        try {
            const nuevo = await onCrearModelo(nombre);
            cambiar('modelo_id', String(nuevo.id_modelo));
            setNombreModelo('');
            setCreandoModelo(false);
        } catch (err) {
            setErrorModelo(err instanceof Error ? err.message : 'No se pudo crear el modelo');
        } finally {
            setGuardandoModelo(false);
        }
    };

    const serieNormalizada = normalizarSerie(valores.serie);
    const modelosVisibles = modelos.filter(m => m.activo || String(m.id_modelo) === valores.modelo_id);
    const textoGuardar = maquina ? 'Actualizar máquina' : 'Guardar máquina';
    // Bajo la serie: el error, o cómo se guardará si se normaliza
    let avisoSerie: ReactNode = null;
    if (errores.serie) {
        avisoSerie = <p className="mt-1 text-sm text-red-600">{errores.serie}</p>;
    } else if (serieNormalizada && serieNormalizada !== valores.serie) {
        avisoSerie = <p className="mt-1 text-xs text-gray-500">Se guardará como <span className="font-mono font-semibold">{serieNormalizada}</span></p>;
    }

    return (
        <div className="flex flex-col gap-8">
            {maquina?.asignada && (
                <div className="bg-accent/10 p-4 rounded-lg border border-accent/30 text-sm text-gray-700">
                    <p className="font-semibold text-primary mb-1">Asignación vigente</p>
                    <p>
                        {maquina.cliente_nombre}
                        {maquina.area_nombre ? ` · ${maquina.area_nombre}` : ''}
                        {maquina.ip ? ` · IP ${maquina.ip}` : ''}
                    </p>
                </div>
            )}

            {errorApi && (
                <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    {errorApi}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                    <label htmlFor="maquina-serie" className="block text-sm font-medium text-gray-700 mb-2">Serie *</label>
                    <input
                        id="maquina-serie"
                        name="serie"
                        type="text"
                        className={`${inputClass(!!errores.serie)} font-mono`}
                        placeholder="Ej: SIMA0001"
                        value={valores.serie}
                        onChange={(e) => cambiar('serie', e.target.value)}
                        maxLength={60}
                    />
                    {avisoSerie}
                </div>

                <div>
                    <label htmlFor="maquina-tipo" className="block text-sm font-medium text-gray-700 mb-2">Tipo de impresión *</label>
                    <select
                        id="maquina-tipo"
                        name="tipo_impresion_id"
                        className={inputClass(!!errores.tipo_impresion_id)}
                        value={valores.tipo_impresion_id}
                        onChange={(e) => cambiar('tipo_impresion_id', e.target.value)}
                    >
                        <option value="">Seleccione...</option>
                        {tipos.map(t => (
                            <option key={t.id_tipo_impresion} value={t.id_tipo_impresion}>
                                {t.nombre === 'BN' ? 'B/N' : t.nombre}
                            </option>
                        ))}
                    </select>
                    {errores.tipo_impresion_id && <p className="mt-1 text-sm text-red-600">{errores.tipo_impresion_id}</p>}
                </div>

                <div>
                    <label htmlFor="maquina-modelo" className="block text-sm font-medium text-gray-700 mb-2">Modelo *</label>
                    <div className="flex gap-2">
                        <select
                            id="maquina-modelo"
                            name="modelo_id"
                            className={inputClass(!!errores.modelo_id)}
                            value={valores.modelo_id}
                            onChange={(e) => cambiar('modelo_id', e.target.value)}
                        >
                            <option value="">Seleccione...</option>
                            {modelosVisibles.map(m => (
                                <option key={m.id_modelo} value={m.id_modelo}>{m.nombre}</option>
                            ))}
                        </select>
                        {!creandoModelo && (
                            <button
                                type="button"
                                onClick={() => { setCreandoModelo(true); setErrorModelo(null); }}
                                className="shrink-0 inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Plus className="w-4 h-4" /> Nuevo modelo
                            </button>
                        )}
                    </div>
                    {errores.modelo_id && <p className="mt-1 text-sm text-red-600">{errores.modelo_id}</p>}

                    {creandoModelo && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                            <label htmlFor="nuevo-modelo" className="block text-xs font-semibold text-gray-600 mb-1">Nombre del nuevo modelo</label>
                            <div className="flex gap-2">
                                <input
                                    ref={nuevoModeloRef}
                                    id="nuevo-modelo"
                                    type="text"
                                    className={inputClass(!!errorModelo)}
                                    placeholder="Ej: Ricoh IM C3000"
                                    value={nombreModelo}
                                    onChange={(e) => { setNombreModelo(e.target.value); setErrorModelo(null); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCrearModelo(); } }}
                                    maxLength={100}
                                />
                                <button
                                    type="button"
                                    onClick={handleCrearModelo}
                                    disabled={guardandoModelo}
                                    className="shrink-0 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50"
                                >
                                    {guardandoModelo ? 'Creando...' : 'Crear modelo'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setCreandoModelo(false); setNombreModelo(''); setErrorModelo(null); }}
                                    className="shrink-0 p-2 text-gray-500 hover:text-gray-800"
                                    aria-label="Cancelar nuevo modelo"
                                    title="Cancelar"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {errorModelo && <p className="mt-1 text-sm text-red-600">{errorModelo}</p>}
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="maquina-formato" className="block text-sm font-medium text-gray-700 mb-2">Formato de impresión</label>
                    <select
                        id="maquina-formato"
                        name="formato_impresion_id"
                        className={inputClass(false)}
                        value={valores.formato_impresion_id}
                        onChange={(e) => cambiar('formato_impresion_id', e.target.value)}
                    >
                        <option value="">Sin especificar</option>
                        {formatos.map(f => (
                            <option key={f.id_formato} value={f.id_formato}>{f.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mt-4 flex justify-end gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={handleGuardar}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Guardando...
                        </>
                    ) : (
                        textoGuardar
                    )}
                </button>
            </div>
        </div>
    );
};

export default MaquinaForm;

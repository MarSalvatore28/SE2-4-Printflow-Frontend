import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle, ClipboardPen, Loader2, RotateCcw, X, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MAX_INTENTOS_REPROCESO, reprocesarReporte } from '@services/Notificaciones/reproceso.service';
import {
  ErrorAprobacion,
  type AlertaLote,
  type Lote,
  type ReporteStaging,
  type ValidacionLote,
} from '@app/Notificaciones/types/notificaciones';
import { EstadoLoteBadge } from '@app/Notificaciones/components/EstadoLoteBadge';
import {
  aprobarLote,
  getAlertasLote,
  getLote,
  getReportesStagingLote,
  rechazarLote,
  validarLote,
} from '@services/Notificaciones/detalleLote.service';
import { useNotification } from '@context/NotificationContext';
import { usePermisos } from '@hooks/usePermisos';
import { useDialogoAccesible } from '@hooks/useDialogoAccesible';
import { formatNumber } from '@utils/formatUtils';

interface DetalleLoteModalProps {
  loteId: number | string;
  onClose: () => void;
  // Avisa la fecha de corte del lote (AAAA-MM-DD) cuando se carga
  onFechaCorteChange?: (fecha: string) => void;
  // Se llama después de aprobar o rechazar, para que la pantalla recargue
  onLoteActualizado?: (lote: Lote | null) => void;
}

const PERIODO_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const fechaHora = (fecha: string | null | undefined) =>
  fecha ? new Date(fecha).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const soloFecha = (fecha: string | null | undefined) =>
  fecha ? new Date(fecha).toLocaleDateString('es-EC', { dateStyle: 'medium' }) : '—';

// La fecha de corte más reciente de los reportes del lote
const fechaCorteDe = (reportes: ReporteStaging[], lote: Lote): string | null => {
  const fechas = reportes
    .map((r) => r.consolidado_fecha_corte)
    .filter((f): f is string => Boolean(f))
    .sort((a, b) => a.localeCompare(b));
  return fechas.at(-1) ?? lote.fecha_corte;
};

const Dato = ({ etiqueta, children }: { etiqueta: string; children: ReactNode }) => (
  <div>
    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{etiqueta}</dt>
    <dd className="text-sm text-gray-900 mt-0.5">{children}</dd>
  </div>
);

// Detalle de un lote: reportes en staging, alertas, validación, y aprobar o rechazar
export const DetalleLoteModal = ({ loteId, onClose, onFechaCorteChange, onLoteActualizado }: DetalleLoteModalProps) => {
  const { refresh } = useNotification();
  // Aprobar o rechazar: admin y operador. El auditor ve el detalle sin esas acciones.
  const { puedeAprobarLotes, etiquetaRol } = usePermisos();
  const [lote, setLote] = useState<Lote | null>(null);
  const [reportes, setReportes] = useState<ReporteStaging[]>([]);
  const [alertas, setAlertas] = useState<AlertaLote[]>([]);
  const [validacion, setValidacion] = useState<ValidacionLote | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [periodo, setPeriodo] = useState('');
  const [accion, setAccion] = useState<'aprobar' | 'rechazar' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [erroresAprobacion, setErroresAprobacion] = useState<string[]>([]);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  // S3-05: reporte en ERROR que se está reprocesando
  const [reprocesandoId, setReprocesandoId] = useState<number | null>(null);
  const navigate = useNavigate();
  // El resultado de aprobar, rechazar o reprocesar sale arriba del detalle: se muestra aunque
  // el usuario esté abajo, en los botones (antes el 409 quedaba fuera de la vista)
  const resultadoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (aviso || erroresAprobacion.length > 0) {
      resultadoRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }
  }, [aviso, erroresAprobacion]);

  // Última versión de los callbacks sin volver a cargar el lote cuando cambian
  const callbacks = useRef({ onFechaCorteChange, onLoteActualizado });
  useEffect(() => {
    callbacks.current = { onFechaCorteChange, onLoteActualizado };
  }, [onFechaCorteChange, onLoteActualizado]);

  const cargar = useCallback(async () => {
    try {
      const datos = await getLote(loteId);
      if (!datos) {
        setErrorCarga('El lote no existe.');
        return;
      }
      const enStaging = datos.estado === 'PENDIENTE' || datos.estado === 'ERROR';
      const [rep, ale, val]: [ReporteStaging[], AlertaLote[], ValidacionLote | null] = enStaging
        ? await Promise.all([getReportesStagingLote(loteId), getAlertasLote(loteId), validarLote(loteId)])
        : [[], [], null];

      setLote(datos);
      setReportes(rep);
      setAlertas(ale);
      setValidacion(val);
      setErrorCarga(null);

      const fechaCorte = fechaCorteDe(rep, datos);
      setPeriodo((actual) => actual || datos.periodo || (fechaCorte ? fechaCorte.slice(0, 7) : ''));
      if (fechaCorte) callbacks.current.onFechaCorteChange?.(fechaCorte.slice(0, 10));
      return datos;
    } catch (err) {
      setErrorCarga(err instanceof Error ? err.message : 'No se pudo cargar el lote.');
    } finally {
      setCargando(false);
    }
  }, [loteId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Escape cierra (salvo mientras se aprueba o rechaza), el foco queda dentro y vuelve al cerrar
  const dialogoRef = useRef<HTMLDivElement>(null);
  const cerrarSiSePuede = useCallback(() => {
    if (!procesando) onClose();
  }, [onClose, procesando]);
  useDialogoAccesible(true, cerrarSiSePuede, dialogoRef);

  const despuesDeLaAccion = async () => {
    const actualizado = await cargar();
    refresh().catch(() => undefined);
    callbacks.current.onLoteActualizado?.(actualizado ?? null);
  };

  const confirmarAprobacion = async () => {
    if (periodo && !PERIODO_REGEX.test(periodo)) {
      setAviso({ tipo: 'error', texto: 'El período debe tener el formato AAAA-MM.' });
      return;
    }
    setProcesando(true);
    setAviso(null);
    setErroresAprobacion([]);
    try {
      // Con período en el lote, el backend usa ese; el usuario solo elige cuando el lote no lo trae
      const r = await aprobarLote(loteId, !lote?.periodo && periodo ? { periodo } : {});
      setAccion(null);
      setAviso({ tipo: 'ok', texto: `${r.message}. El lote pasó a «Procesado».` });
      await despuesDeLaAccion();
    } catch (err) {
      setAccion(null);
      if (err instanceof ErrorAprobacion) {
        setErroresAprobacion(err.errores.length ? err.errores : [err.message]);
        setAviso({ tipo: 'error', texto: err.message });
      } else {
        setAviso({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo aprobar el lote.' });
      }
    } finally {
      setProcesando(false);
    }
  };

  const confirmarRechazo = async () => {
    setProcesando(true);
    setAviso(null);
    setErroresAprobacion([]);
    try {
      const r = await rechazarLote(loteId, motivo.trim() ? { motivo: motivo.trim() } : {});
      setAccion(null);
      setMotivo('');
      setAviso({ tipo: 'ok', texto: `${r.message}. El lote pasó a «Descartado».` });
      await despuesDeLaAccion();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo rechazar el lote.' });
    } finally {
      setProcesando(false);
    }
  };

  // S3-05: vuelve a validar un reporte en ERROR y refresca la validación del lote
  const reprocesar = async (reporte: ReporteStaging) => {
    setReprocesandoId(reporte.id_staging_consolidado);
    setProcesando(true);
    setAviso(null);
    setErroresAprobacion([]);
    try {
      const { message, data } = await reprocesarReporte(reporte.id_staging_consolidado);
      const texto = data.aviso ? `${message}. ${data.aviso}` : message;
      setAviso({ tipo: data.corregido && !data.aviso ? 'ok' : 'error', texto });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err instanceof Error ? err.message : 'No se pudo reprocesar el reporte.' });
    } finally {
      setProcesando(false);
      setReprocesandoId(null);
      await despuesDeLaAccion();
    }
  };

  const enStaging = lote?.estado === 'PENDIENTE' || lote?.estado === 'ERROR';

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrarSiSePuede();
      }}
    >
      <div
        ref={dialogoRef}
        tabIndex={-1}
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalle-lote"
        data-testid="detalle-lote"
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 id="titulo-detalle-lote" className="text-xl font-bold text-gray-900">Detalle del lote</h2>
            {lote && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="font-mono text-sm text-primary">{lote.codigo_referencia}</span>
                <EstadoLoteBadge estado={lote.estado} title={lote.motivo ?? undefined} />
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={procesando}
            className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {cargando && (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" /> Cargando el lote…
            </div>
          )}

          {!cargando && errorCarga && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{errorCarga}</div>
          )}

          {!cargando && lote && (
            <>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <Dato etiqueta="Período">{lote.periodo || '—'}</Dato>
                <Dato etiqueta="Fecha de recepción">{fechaHora(lote.fecha_carga)}</Dato>
                <Dato etiqueta="Fecha de procesamiento">{fechaHora(lote.fecha_procesamiento)}</Dato>
                <Dato etiqueta="Cliente">
                  {lote.clientes.length ? lote.clientes.map((c) => c.nombre).join(', ') : 'Sin cliente identificado'}
                </Dato>
                <Dato etiqueta="Reportes recibidos">{lote.total_registros_cargados}</Dato>
                {lote.usuario_aprobacion_nombre && (
                  <Dato etiqueta="Aprobado por">{lote.usuario_aprobacion_nombre}</Dato>
                )}
              </dl>

              {lote.motivo && lote.estado !== 'PENDIENTE' && (
                <div className="flex gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700">
                  <span className="font-medium">Motivo:</span> {lote.motivo}
                </div>
              )}

              <div ref={resultadoRef} className="scroll-mt-4" aria-hidden="true" />
              {aviso && (
                <output
                  className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${aviso.tipo === 'ok'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'}`}
                  data-testid="aviso-lote"
                >
                  {aviso.tipo === 'ok' ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <XCircle className="w-4 h-4 mt-0.5" />}
                  <span>{aviso.texto}</span>
                </output>
              )}

              {erroresAprobacion.length > 0 && (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50" data-testid="errores-aprobacion">
                  <p className="text-sm font-semibold text-red-700 mb-2">
                    No se puede aprobar el lote por las siguientes inconsistencias:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-red-800 space-y-1">
                    {erroresAprobacion.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {lote.estado === 'PROCESADO' && (
                <p className="text-sm text-gray-600">
                  El lote se aprobó el {fechaHora(lote.fecha_aprobacion)}. Sus {lote.reportes_oficiales} reporte(s)
                  ya están en los reportes oficiales.
                </p>
              )}
              {lote.estado === 'DESCARTADO' && (
                <p className="text-sm text-gray-600">El lote se rechazó: sus reportes se eliminaron de staging.</p>
              )}

              {enStaging && (
                <section>
                  <h3 className="font-semibold text-gray-900 mb-2">Reportes en staging ({reportes.length})</h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full text-sm" data-testid="tabla-reportes-lote">
                      <thead className="bg-secondary/90 text-white">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Serie</th>
                          <th className="px-3 py-2 text-left font-medium">IP</th>
                          <th className="px-3 py-2 text-left font-medium">Cliente</th>
                          <th className="px-3 py-2 text-right font-medium">Impr. B/N</th>
                          <th className="px-3 py-2 text-right font-medium">Impr. color</th>
                          <th className="px-3 py-2 text-right font-medium">Impresiones</th>
                          <th className="px-3 py-2 text-right font-medium">Copias</th>
                          <th className="px-3 py-2 text-right font-medium">Total servicio</th>
                          <th className="px-3 py-2 text-left font-medium">Fecha de corte</th>
                          <th className="px-3 py-2 text-left font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportes.length === 0 && (
                          <tr><td colSpan={10} className="px-3 py-6 text-center text-gray-500">El lote no tiene reportes en staging.</td></tr>
                        )}
                        {reportes.map((r) => (
                          <tr key={r.id_staging_consolidado} className={r.procesar_lectura === false ? 'bg-red-50/60' : ''}>
                            <td className="px-3 py-2 font-mono whitespace-nowrap">
                              {r.serie_maquina || '—'}
                              {r.maquina_modelo_nombre && (
                                <span className="block text-xs text-gray-500 font-sans">{r.maquina_modelo_nombre}</span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-mono whitespace-nowrap">{r.ip_detectada || '—'}</td>
                            <td className="px-3 py-2">{r.cliente_nombre || <span className="text-gray-400">Sin asignar</span>}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{formatNumber(r.consolidado_impresion_bn)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{formatNumber(r.consolidado_impresion_color)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{formatNumber(r.consolidado_print_total)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{formatNumber(r.consolidado_copy_total)}</td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium">{formatNumber(r.totalservicio)}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{soloFecha(r.consolidado_fecha_corte)}</td>
                            <td className="px-3 py-2">
                              {r.procesar_lectura === false ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300" title={r.mensaje_aviso ?? undefined}>
                                  <AlertTriangle size={12} /> {r.estado_maquina || 'ERROR'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                  <CheckCircle size={12} /> {r.estado_maquina || 'Lista'}
                                </span>
                              )}
                              {/* S3-05: reprocesar (admin y operador); al tercer fallo, descartar o lectura manual */}
                              {r.procesar_lectura === false && puedeAprobarLotes && (
                                (r.intentos_reproceso ?? 0) < MAX_INTENTOS_REPROCESO ? (
                                  <button
                                    onClick={() => reprocesar(r)}
                                    disabled={procesando}
                                    className="mt-1 flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-md border border-primary/40 text-xs font-medium text-primary bg-white hover:bg-primary/5 disabled:opacity-60"
                                    data-testid="boton-reprocesar"
                                  >
                                    {reprocesandoId === r.id_staging_consolidado
                                      ? <Loader2 size={12} className="animate-spin" />
                                      : <RotateCcw size={12} />}
                                    Reprocesar ({(r.intentos_reproceso ?? 0) + 1} de {MAX_INTENTOS_REPROCESO})
                                  </button>
                                ) : (
                                  <div className="mt-1 flex flex-wrap gap-1" data-testid="acciones-sin-intentos">
                                    <button
                                      onClick={() => { setAviso(null); setAccion('rechazar'); }}
                                      disabled={procesando}
                                      title="Rechaza el lote: sus reportes se eliminan de staging"
                                      className="flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-md border border-red-300 text-xs font-medium text-red-700 bg-white hover:bg-red-50"
                                    >
                                      <XCircle size={12} /> Descartar
                                    </button>
                                    <button
                                      onClick={() => navigate(`/lecturas?serie=${encodeURIComponent(r.serie_maquina || '')}`)}
                                      disabled={procesando}
                                      className="flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-md border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                      <ClipboardPen size={12} /> Lectura manual
                                    </button>
                                  </div>
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {enStaging && alertas.length > 0 && (
                <section data-testid="alertas-lote">
                  <h3 className="font-semibold text-gray-900 mb-2">Alertas ({alertas.length})</h3>
                  <ul className="space-y-2">
                    {alertas.map((a, i) => (
                      <li key={`${a.serie_maquina}-${i}`} className="flex gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          <span className="font-mono font-semibold">{a.serie_maquina || 'Sin serie'}</span>
                          {a.ip_detectada && <span className="font-mono"> ({a.ip_detectada})</span>}
                          {' · '}{a.estado_maquina || 'ERROR'}
                          {a.mensaje_aviso && <span className="block text-red-700">{a.mensaje_aviso}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {enStaging && validacion && (
                <section data-testid="validacion-lote">
                  <h3 className="font-semibold text-gray-900 mb-2">Validación</h3>
                  {validacion.esValido ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 text-sm text-green-800">
                      <CheckCircle className="w-4 h-4" /> El lote está completo y se puede aprobar.
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg border border-yellow-300 bg-yellow-50 text-sm text-yellow-900">
                      <p className="font-medium mb-1">La validación encontró {validacion.errores.length} problema(s):</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {validacion.errores.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {accion === 'aprobar' && (
                <section className="p-4 rounded-lg border border-green-300 bg-green-50 space-y-3">
                  <p className="text-sm text-green-900">
                    Se pasarán los {reportes.length} reporte(s) del lote a los reportes oficiales y se borrarán de staging.
                  </p>
                  {/* El lote se validó con su período: no se puede aprobar en otro mes (el backend responde 409) */}
                  {lote.periodo ? (
                    <p className="text-sm text-gray-700" data-testid="periodo-lote">
                      Período del informe: <span className="font-semibold">{lote.periodo}</span>
                    </p>
                  ) : (
                    <label className="block text-sm font-medium text-gray-700">
                      Período del informe<input
                        type="month"
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        data-testid="periodo-aprobacion"
                      />
                    </label>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={confirmarAprobacion}
                      disabled={procesando}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60"
                    >
                      {procesando && <Loader2 className="w-4 h-4 animate-spin" />} Confirmar aprobación
                    </button>
                    <button
                      onClick={() => setAccion(null)}
                      disabled={procesando}
                      className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                  </div>
                </section>
              )}

              {accion === 'rechazar' && (
                <section className="p-4 rounded-lg border border-red-300 bg-red-50 space-y-3">
                  <p className="text-sm text-red-900">
                    Al rechazar el lote se eliminan sus reportes de staging. Esta acción no se puede deshacer.
                  </p>
                  <label className="block text-sm font-medium text-gray-700">
                    Motivo del rechazo (opcional)<textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      maxLength={500}
                      rows={2}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Por ejemplo: correo de prueba, máquina equivocada…"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={confirmarRechazo}
                      disabled={procesando}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60"
                    >
                      {procesando && <Loader2 className="w-4 h-4 animate-spin" />} Confirmar rechazo
                    </button>
                    <button
                      onClick={() => setAccion(null)}
                      disabled={procesando}
                      className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Pie con acciones */}
        <div className="flex flex-wrap justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {enStaging && !puedeAprobarLotes && (
            <p className="mr-auto self-center text-xs text-gray-500">Su rol ({etiquetaRol}) solo puede consultar el lote; aprobar o rechazar lo hace un operador o un administrador.</p>
          )}
          {enStaging && accion === null && puedeAprobarLotes && (
            <>
              <button
                onClick={() => { setAviso(null); setAccion('rechazar'); }}
                disabled={procesando}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-red-300 text-red-700 bg-white text-sm font-medium hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" /> Rechazar
              </button>
              <button
                onClick={() => { setAviso(null); setErroresAprobacion([]); setAccion('aprobar'); }}
                disabled={procesando}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" /> Aprobar
              </button>
            </>
          )}
          <button
            onClick={onClose}
            disabled={procesando}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleLoteModal;

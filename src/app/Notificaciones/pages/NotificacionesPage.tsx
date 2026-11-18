import { useState, useEffect } from "react";
import { X, Bell, CheckCircle, Clock, AlertCircle } from "lucide-react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ClearIcon from "@mui/icons-material/Clear";
import DataTable from "@components/Shared/DataTable";
import { BuscadorInteligente } from "@components/Shared/BuscadorInteligente";
import ModalConfirmacion from "@components/Shared/ModalConfirmacion";
import { ErrorAprobacion, type Notificacion } from "@app/Notificaciones/types/notificaciones";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  fetchAllNotificaciones,
  getNotificacionesNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  deleteNotificacion,
  contarNoLeidas,
  aprobarNotificacion,
  rechazarNotificacion,
} from "@services/Notificaciones/Notificaciones.service";
import { DetalleLoteModal } from "@app/Notificaciones/components/DetalleLoteModal";
import { ListadoLotes } from "@app/Notificaciones/components/ListadoLotes";
import { useNotification } from "@context/NotificationContext";
import React from "react";

const NotificacionesPage = () => {
  // version sube cada vez que llega un aviso por el socket
  const { refresh: refrescarCampana, version } = useNotification();
  const [allNotificaciones, setAllNotificaciones] = useState<Notificacion[]>(
    [],
  );
  const [filteredNotificaciones, setFilteredNotificaciones] = useState<
    Notificacion[]
  >([]);
  const [filterTerm, setFilterTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"todas" | "no-leidas" | "lotes">(
    "no-leidas",
  );
  // Sube al aprobar o rechazar un lote desde el detalle: recarga el listado de lotes
  const [recargaLotes, setRecargaLotes] = useState(0);
  const [totalNoLeidas, setTotalNoLeidas] = useState<number>(0);
  const [selectedLote, setSelectedLote] = useState<number | string | null>(
    null,
  );
  // Fecha de corte del último lote abierto en el detalle (solo vale para ese lote)
  const [fechaCorte, setFechaCorte] = useState<{ loteId: number | string; fecha: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string | React.ReactNode;
    type: "delete" | "activate" | "warning" | "info";
    action: (inputValue?: string) => void;
    confirmText?: string;
    showInput?: boolean;
    inputPlaceholder?: string;
    showCancel?: boolean;
  }>({
    title: "",
    message: "",
    type: "info",
    action: () => { },
  });

  const fetchNotificaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: Notificacion[];

      if (activeTab === "no-leidas") {
        data = await getNotificacionesNoLeidas();
      } else {
        data = await fetchAllNotificaciones();
      }

      setAllNotificaciones(data);
      setFilteredNotificaciones(data);

      const count = await contarNoLeidas();
      setTotalNoLeidas(count);
    } catch (err) {
      console.error("Error fetching notificaciones:", err);
      setError(
        "Error al cargar las notificaciones. Por favor, intente de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarLeida = async (notificacion: Notificacion) => {
    try {
      await marcarComoLeida(notificacion.id_notificacion);

      setAllNotificaciones((prev) =>
        prev.map((n) =>
          n.id_notificacion === notificacion.id_notificacion
            ? { ...n, leida: true, fecha_lectura: new Date().toISOString() }
            : n,
        ),
      );

      if (activeTab === "no-leidas") {
        setAllNotificaciones((prev) =>
          prev.filter(
            (n) => n.id_notificacion !== notificacion.id_notificacion,
          ),
        );
        setFilteredNotificaciones((prev) =>
          prev.filter(
            (n) => n.id_notificacion !== notificacion.id_notificacion,
          ),
        );
      }

      setTotalNoLeidas((prev) => Math.max(0, prev - 1));
      refrescarCampana();
    } catch (err) {
      console.error("Error marcando notificación como leída:", err);
      setError("No se pudo marcar la notificación como leída.");
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await marcarTodasComoLeidas();
      await fetchNotificaciones();
      refrescarCampana();
    } catch (err) {
      console.error("Error marcando todas como leídas:", err);
      setError("No se pudieron marcar todas las notificaciones como leídas.");
    }
  };

  const handleAprobarLote = async (notif: Notificacion) => {
    if (!notif.id_notificacion) {
      setError("Error: La notificación no tiene un ID válido.");
      return;
    }

    setModalConfig({
      title: 'Aprobar Lote',
      message: (
        <div>
          <p>¿Estás seguro de <strong>APROBAR</strong> este lote?</p>
          <p className="mt-2 text-sm text-gray-500">Se moverán los registros a reportes oficiales y se eliminarán de staging.</p>
        </div>
      ),
      type: 'activate',
      confirmText: 'Aprobar',
      action: async () => {
        try {
          // Sin período, la API usa el del lote; la fecha de corte solo si es de este lote
          await aprobarNotificacion(notif.id_notificacion, {
            fecha_corte: fechaCorte && fechaCorte.loteId === notif.lote_id ? fechaCorte.fecha : undefined,
          });
          await fetchNotificaciones();
          refrescarCampana();

          setModalConfig({
            title: 'Lote Aprobado',
            message: 'El lote ha sido aprobado exitosamente.',
            type: 'activate',
            confirmText: 'Aceptar',
            showCancel: false,
            action: () => setModalOpen(false)
          });
          setModalOpen(true);

        } catch (err: unknown) {
          // Errores de validación (409): se listan
          if (err instanceof ErrorAprobacion) {
            const listaErrores = err.errores;

            setModalConfig({
              title: 'Validación Fallida',
              type: 'warning',
              confirmText: 'Entendido',
              showCancel: false,
              action: () => setModalOpen(false),
              message: (
                <div className="text-left mt-2">
                  <p className="text-red-600 font-semibold mb-3">No se puede aprobar el lote por las siguientes inconsistencias:</p>
                  <div className="bg-red-50 p-3 rounded border border-red-200 max-h-48 overflow-y-auto">
                    <ul className="list-disc pl-5 text-sm text-red-800 space-y-1">
                      {listaErrores.map((msg: string, idx: number) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            });
          } else {
            // Error genérico
            setModalConfig({
              title: 'Error',
              message: (err instanceof Error && err.message) || 'Ocurrió un error inesperado al aprobar el lote.',
              type: 'warning',
              confirmText: 'Cerrar',
              showCancel: false,
              action: () => setModalOpen(false)
            });
          }
          setModalOpen(true);
        }
      }
    });
    setModalOpen(true);
  };

  const handleRechazarLote = async (notif: Notificacion) => {
    if (!notif.id_notificacion) {
      setError("Error: La notificación no tiene un ID válido.");
      return;
    }

    setModalConfig({
      title: "Rechazar Lote",
      message: (
        <div>
          <p>
            ¿Estás seguro de <strong>RECHAZAR</strong> este lote?
          </p>
          <p className="mt-2 text-sm text-red-500">
            Esta acción es irreversible. Se eliminarán los datos de staging.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Por favor, indique el motivo del rechazo:
          </p>
        </div>
      ),
      type: "delete",
      confirmText: "Rechazar",
      showInput: true,
      inputPlaceholder: "Escriba el motivo del rechazo aquí...",
      action: async (motivoInput) => {
        try {
          await rechazarNotificacion(notif.id_notificacion, motivoInput || undefined);
          await fetchNotificaciones();
          refrescarCampana();

          setModalConfig({
            title: "Lote Rechazado",
            message:
              "El lote ha sido rechazado correctamente. Los registros de carga se han eliminado.",
            type: "activate",
            confirmText: "Aceptar",
            showCancel: false,
            action: () => setModalOpen(false),
          });
          setModalOpen(true);
        } catch (err: unknown) {
          console.error("Error rechazando lote:", err);
          setError((err instanceof Error && err.message) || "No se pudo rechazar el lote.");
        }
      },
    });
    setModalOpen(true);
  };

  const handleEliminarNotificacion = async (notificacion: Notificacion) => {
    setModalConfig({
      title: "Eliminar Notificación",
      message:
        "¿Estás seguro de que deseas eliminar esta notificación? Esta acción no se puede deshacer.",
      type: "delete",
      confirmText: "Eliminar",
      action: async () => {
        try {
          await deleteNotificacion(notificacion.id_notificacion);

          setAllNotificaciones((prev) =>
            prev.filter(
              (n) => n.id_notificacion !== notificacion.id_notificacion,
            ),
          );
          setFilteredNotificaciones((prev) =>
            prev.filter(
              (n) => n.id_notificacion !== notificacion.id_notificacion,
            ),
          );

          if (!notificacion.leida) {
            setTotalNoLeidas((prev) => Math.max(0, prev - 1));
          }
        } catch (err) {
          console.error("Error eliminando notificación:", err);
          setError("No se pudo eliminar la notificación.");
        }
      },
    });
    setModalOpen(true);
  };

  const handleSearch = (term: string) => {
    setFilterTerm(term);

    if (!term.trim()) {
      setFilteredNotificaciones(allNotificaciones);
      return;
    }

    const searchWords = term
      .toLowerCase()
      .split(" ")
      .filter((w) => w.length > 0);
    const filtered = allNotificaciones.filter((notif) => {
      return searchWords.every(
        (word) =>
          notif.titulo?.toLowerCase().includes(word) ||
          notif.mensaje?.toLowerCase().includes(word) ||
          notif.codigo_lote?.toLowerCase().includes(word) ||
          notif.tipo_nombre?.toLowerCase().includes(word),
      );
    });

    setFilteredNotificaciones(filtered);
  };

  const handleRefresh = () => {
    setFilterTerm("");
    fetchNotificaciones();
  };

  useEffect(() => {
    fetchNotificaciones();
  }, [activeTab]);

  // Llegó una notificación o cambió un lote (socket): recargar la lista
  const versionAnterior = React.useRef(version);
  useEffect(() => {
    if (version !== versionAnterior.current) {
      versionAnterior.current = version;
      fetchNotificaciones();
    }
  }, [version]);

  const columns = [
    {
      key: "tipo",
      label: "Tipo",
      align: "center" as const,
      render: (notif: Notificacion) => (
        <div className="flex flex-col items-center gap-1">
          {notif.tipo_icono && (
            <span className="text-2xl">{notif.tipo_icono}</span>
          )}
          <span className="text-xs font-medium text-gray-600">
            {notif.tipo_nombre || "Sin tipo"}
          </span>
        </div>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      align: "center" as const,
      render: (notif: Notificacion) => (
        <div className="flex justify-center">
          {!notif.leida ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
              <Clock size={12} className="mr-1" />
              No leída
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
              <CheckCircle size={12} className="mr-1" />
              Leída
            </span>
          )}
        </div>
      ),
    },
    {
      key: "contenido",
      label: "Notificación",
      render: (notif: Notificacion) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-gray-900 text-sm">
            {notif.titulo}
          </span>
          <span className="text-xs text-gray-600">{notif.mensaje}</span>
          {notif.codigo_lote && (
            <span className="text-xs text-primary font-mono">
              Lote: {notif.codigo_lote}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "detalles",
      label: "Detalles",
      align: "center" as const,
      render: (notif: Notificacion) => (
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
          {notif.total_registros !== undefined && (
            <div className="whitespace-nowrap">
              <span className="font-medium">Registros:</span>{" "}
              {notif.total_registros}
            </div>
          )}
          {notif.periodo && (
            <div className="whitespace-nowrap">
              <span className="font-medium">Período:</span> {notif.periodo}
            </div>
          )}
          {notif.usuario_nombre && (
            <div className="whitespace-nowrap">
              <span className="font-medium">Usuario:</span>{" "}
              {notif.usuario_nombre}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "fecha",
      label: "Fecha",
      align: "center" as const,
      render: (notif: Notificacion) => (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-medium text-gray-900 whitespace-nowrap">
            {new Date(notif.fecha_creacion).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {new Date(notif.fecha_creacion).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {notif.fecha_lectura && (
            <span className="text-xs text-green-600 whitespace-nowrap">
              Leída:{" "}
              {new Date(notif.fecha_lectura).toLocaleDateString("es-ES", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "ver_detalle",
      label: "Detalle",
      align: "center" as const,
      render: (notif: Notificacion) => (
        <div className="flex justify-center">
          {notif.lote_id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedLote(notif.lote_id!);
              }}
              className="inline-flex items-center px-2 py-1.5 rounded-md border-2 border-secondary/50 shadow-sm text-xs font-medium text-gray-700 bg-background/20 hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              title="Ver Detalle del Lote"
            >
              <VisibilityIcon className="w-1 h-1 mr-1.5 text-primary text-xs" />
              Ver Detalle
            </button>
          )}
        </div>
      ),
    },
    {
      key: "acciones",
      label: "Acciones",
      align: "center" as const,
      render: (notif: Notificacion) => (
        <div className="flex items-center justify-center gap-2">
          {notif.lote_id && !notif.leida ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAprobarLote(notif);
                }}
                className="inline-flex items-center p-1.5 border border-green-300 shadow-sm rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                title="Aprobar Lote"
              >
                <CheckCircleIcon />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRechazarLote(notif);
                }}
                className="inline-flex items-center p-1.5 border border-red-300 shadow-sm rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                title="Rechazar Lote"
              >
                <ClearIcon />
              </button>
            </>
          ) : (
            !notif.leida &&
            !notif.lote_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarcarLeida(notif);
                }}
                className="inline-flex items-center px-2 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                title="Marcar como leída"
              >
                <CheckCircle size={14} />
                Marcar leída
              </button>
            )
          )}

          {notif.leida && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEliminarNotificacion(notif);
              }}
              className="inline-flex items-center p-1.5 border border-red-300 shadow-sm rounded text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              title="Eliminar notificación"
            >
              <DeleteIcon />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
            {totalNoLeidas > 0 && (
              <p className="text-sm text-gray-600">
                Tienes{" "}
                <span className="font-bold text-yellow-600">
                  {totalNoLeidas}
                </span>{" "}
                notificación{totalNoLeidas !== 1 ? "es" : ""} sin leer
              </p>
            )}
          </div>
        </div>

        {totalNoLeidas > 0 && activeTab === "no-leidas" && (
          <button
            onClick={handleMarcarTodasLeidas}
            className="inline-flex items-center px-4 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <CheckCircle size={16} className="mr-2" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("no-leidas")}
          className={`px-6 py-3 font-medium text-sm transition-all relative ${activeTab === "no-leidas"
            ? "text-primary border-b-2 border-primary"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          No Leídas
          {totalNoLeidas > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
              {totalNoLeidas}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("todas")}
          className={`px-6 py-3 font-medium text-sm transition-all relative ${activeTab === "todas"
            ? "text-primary border-b-2 border-primary"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Todas
        </button>
        <button
          onClick={() => setActiveTab("lotes")}
          className={`px-6 py-3 font-medium text-sm transition-all relative ${activeTab === "lotes"
            ? "text-primary border-b-2 border-primary"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Lotes
        </button>
      </div>

      {activeTab === "lotes" ? (
        <ListadoLotes
          recarga={version + recargaLotes}
          onVerDetalle={(loteId) => setSelectedLote(loteId)}
        />
      ) : (
      <>

      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Notificación
            </label>
            <BuscadorInteligente<Notificacion>
              placeholder="Buscar por título, mensaje, lote..."
              buscarFn={async (termino: string) => {
                const palabrasBusqueda = termino
                  .toLowerCase()
                  .split(" ")
                  .filter((w) => w.length > 0);
                return allNotificaciones.filter((notificacion) => {
                  return palabrasBusqueda.every(
                    (palabra) =>
                      notificacion.titulo?.toLowerCase().includes(palabra) ||
                      notificacion.mensaje?.toLowerCase().includes(palabra) ||
                      notificacion.codigo_lote?.toLowerCase().includes(palabra) ||
                      notificacion.tipo_nombre?.toLowerCase().includes(palabra),
                  );
                });
              }}
              onSeleccionar={(notif: Notificacion) => {
                setFilteredNotificaciones([notif]);
              }}
              renderItem={(notif: Notificacion) => (
                <div>
                  <div className="font-medium text-gray-900">
                    {notif.titulo}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {notif.mensaje}
                  </div>
                  {notif.codigo_lote && (
                    <div className="text-xs text-primary mt-1 font-mono">
                      Lote: {notif.codigo_lote}
                    </div>
                  )}
                </div>
              )}
              getItemKey={(notif: Notificacion) => notif.id_notificacion}
              getItemLabel={(notif: Notificacion) => notif.titulo}
              minCaracteres={1}
              itemsCompletos={allNotificaciones}
              onEnter={(term: string) => handleSearch(term)}
              onClear={() => {
                setFilterTerm("");
                setFilteredNotificaciones(allNotificaciones);
              }}
              onSearchClick={(term: string) => handleSearch(term)}
            />
            {filterTerm && (
              <div className="mt-2 text-xs text-primary font-medium flex items-center justify-between">
                <span>Filtrado activo: {filterTerm}</span>
                <button
                  onClick={() => {
                    setFilterTerm("");
                    setFilteredNotificaciones(allNotificaciones);
                  }}
                  className="text-gray-400 hover:text-red-500 flex items-center gap-1"
                >
                  Limpiar <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium h-[42px]"
          >
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      ) : (
        <DataTable<Notificacion>
          title={
            activeTab === "no-leidas"
              ? "Notificaciones No Leídas"
              : "Todas las Notificaciones"
          }
          columns={columns}
          data={filteredNotificaciones}
          getItemId={(notif) => notif.id_notificacion}
          emptyMessage={
            activeTab === "no-leidas"
              ? "¡Genial! No tienes notificaciones sin leer."
              : "No hay notificaciones en el sistema."
          }
          rowsPerPage={10}
          showActions={false}
        />
      )}
      </>
      )}

      {selectedLote && (
        <DetalleLoteModal
          loteId={selectedLote}
          onClose={() => setSelectedLote(null)}
          onFechaCorteChange={(fecha) => setFechaCorte({ loteId: selectedLote, fecha })}
          onLoteActualizado={() => {
            fetchNotificaciones();
            setRecargaLotes((n) => n + 1);
          }}
        />
      )}

      <ModalConfirmacion
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={modalConfig.action}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        showInput={modalConfig.showInput}
        inputPlaceholder={modalConfig.inputPlaceholder}
        showCancel={modalConfig.showCancel}
      />
    </div>
  );
};

export default NotificacionesPage;
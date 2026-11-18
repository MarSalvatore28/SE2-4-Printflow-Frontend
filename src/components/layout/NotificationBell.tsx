import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotification } from '@context/NotificationContext';
import type { Notificacion } from '@app/Notificaciones/types/notificaciones';

const EN_DESPLEGABLE = 8;

// "hace 5 min", "hace 2 h", o la fecha si es más antigua
const haceCuanto = (fecha: string) => {
    const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    if (minutos < 1) return 'ahora';
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;
    return new Date(fecha).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
};

// Campana del menú lateral: contador de no leídas y las últimas notificaciones
export const NotificationBell = () => {
    const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead } = useNotification();
    const [abierta, setAbierta] = useState(false);
    const contenedor = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Se cierra al hacer clic afuera o con Escape
    useEffect(() => {
        if (!abierta) return;
        const alClicFuera = (e: MouseEvent) => {
            if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierta(false);
        };
        const alEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setAbierta(false);
        };
        document.addEventListener('mousedown', alClicFuera);
        document.addEventListener('keydown', alEscape);
        return () => {
            document.removeEventListener('mousedown', alClicFuera);
            document.removeEventListener('keydown', alEscape);
        };
    }, [abierta]);

    const irANotificaciones = () => {
        setAbierta(false);
        navigate('/notificaciones');
    };

    const abrirNotificacion = (n: Notificacion) => {
        if (!n.leida) markAsRead(n.id_notificacion).catch(() => undefined);
        irANotificaciones();
    };

    const textoContador = unreadCount > 99 ? '99+' : String(unreadCount);
    const ultimas = notifications.slice(0, EN_DESPLEGABLE);

    return (
        <div className="relative" ref={contenedor}>
            <button
                type="button"
                onClick={() => setAbierta((v) => !v)}
                className="relative p-2 rounded-full hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-white/60 transition-colors"
                aria-label={unreadCount > 0 ? `Notificaciones: ${unreadCount} sin leer` : 'Notificaciones'}
                aria-haspopup="true"
                aria-expanded={abierta}
                title="Notificaciones"
                data-testid="campana"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-white text-primary text-xs font-bold flex items-center justify-center shadow"
                        data-testid="contador-notificaciones"
                    >
                        {textoContador}
                    </span>
                )}
            </button>

            {abierta && (
                <div
                    className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white text-text rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden"
                    role="menu"
                    data-testid="desplegable-notificaciones"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <span className="font-semibold text-sm">
                            Notificaciones{unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}
                        </span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => markAllAsRead().catch(() => undefined)}
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                                title="Marcar todas como leídas"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Marcar todas
                            </button>
                        )}
                    </div>

                    <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                        {loading && ultimas.length === 0 && (
                            <li className="px-4 py-6 text-sm text-gray-500 text-center">Cargando…</li>
                        )}
                        {!loading && error && ultimas.length === 0 && (
                            <li className="px-4 py-6 text-sm text-red-600 text-center">{error}</li>
                        )}
                        {!loading && !error && ultimas.length === 0 && (
                            <li className="px-4 py-6 text-sm text-gray-500 text-center">No hay notificaciones.</li>
                        )}
                        {ultimas.map((n) => (
                            <li key={n.id_notificacion}>
                                <button
                                    type="button"
                                    onClick={() => abrirNotificacion(n)}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex gap-3 ${n.leida ? '' : 'bg-red-50/60'}`}
                                    role="menuitem"
                                >
                                    <span
                                        className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.leida ? 'bg-transparent' : 'bg-primary'}`}
                                        aria-hidden="true"
                                    />
                                    <span className="flex-1 min-w-0">
                                        <span className={`block text-sm truncate ${n.leida ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                                            {n.titulo}
                                        </span>
                                        {n.mensaje && (
                                            <span className="block text-xs text-gray-500 line-clamp-2">{n.mensaje}</span>
                                        )}
                                        <span className="block text-[11px] text-gray-400 mt-0.5">{haceCuanto(n.fecha_creacion)}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    <button
                        type="button"
                        onClick={irANotificaciones}
                        className="w-full px-4 py-2.5 text-sm font-medium text-primary border-t border-gray-200 hover:bg-gray-50"
                    >
                        Ver todas las notificaciones
                    </button>
                </div>
            )}
        </div>
    );
};

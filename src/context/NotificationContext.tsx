import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Notificacion } from '@app/Notificaciones/types/notificaciones';
import { useAuth } from '@context/AuthContext';
import { useSocket } from '@context/SocketContext';
import {
    fetchContadorNoLeidas,
    fetchUltimasNotificaciones,
    marcarNotificacionLeida,
    marcarTodasNotificacionesLeidas,
} from '@services/Notificaciones/campana.service';

interface NotificationContextType {
    // Últimas notificaciones (las más recientes primero)
    notifications: Notificacion[];
    // Total de no leídas en el sistema (no solo de las últimas)
    unreadCount: number;
    loading: boolean;
    error: string | null;
    // Sube cada vez que llega algo por el socket: las pantallas lo usan para recargar
    version: number;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const ULTIMAS = 20;
// Varias notificaciones seguidas (un buzón con muchos correos) se recargan una sola vez
const ESPERA_RECARGA_MS = 300;

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState<Notificacion[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [cargado, setCargado] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [version, setVersion] = useState(0);
    const recargaPendiente = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const refresh = useCallback(async () => {
        try {
            const [ultimas, total] = await Promise.all([
                fetchUltimasNotificaciones(ULTIMAS),
                fetchContadorNoLeidas(),
            ]);
            setNotifications(ultimas);
            setUnreadCount(total);
            setError(null);
        } catch {
            setError('No se pudieron cargar las notificaciones.');
        } finally {
            setCargado(true);
        }
    }, []);

    // Carga inicial al iniciar sesión
    useEffect(() => {
        if (isAuthenticated) void refresh();
    }, [isAuthenticated, refresh]);

    // Tiempo real: nueva notificación (trigger de la BD) o cambio de estado de un lote
    useEffect(() => {
        if (!socket) return;
        const programarRecarga = () => {
            setVersion((v) => v + 1);
            clearTimeout(recargaPendiente.current);
            recargaPendiente.current = setTimeout(refresh, ESPERA_RECARGA_MS);
        };
        socket.on('nueva_notificacion', programarRecarga);
        socket.on('notificaciones_actualizadas', programarRecarga);
        // Al reconectar se pudo perder algún aviso
        socket.on('connect', programarRecarga);
        return () => {
            socket.off('nueva_notificacion', programarRecarga);
            socket.off('notificaciones_actualizadas', programarRecarga);
            socket.off('connect', programarRecarga);
            clearTimeout(recargaPendiente.current);
        };
    }, [socket, refresh]);

    const markAsRead = useCallback(async (id: number) => {
        const notificacion = notifications.find((n) => n.id_notificacion === id);
        if (notificacion?.leida) return;
        setNotifications((prev) =>
            prev.map((n) => (n.id_notificacion === id ? { ...n, leida: true, fecha_lectura: new Date().toISOString() } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        try {
            await marcarNotificacionLeida(id);
        } finally {
            await refresh();
        }
    }, [notifications, refresh]);

    const markAllAsRead = useCallback(async () => {
        setNotifications((prev) => prev.map((n) => (n.leida ? n : { ...n, leida: true })));
        setUnreadCount(0);
        try {
            await marcarTodasNotificacionesLeidas();
        } finally {
            await refresh();
        }
    }, [refresh]);

    // Sin sesión no se muestra nada de la sesión anterior
    const value = useMemo<NotificationContextType>(() => (isAuthenticated
        ? { notifications, unreadCount, loading: !cargado, error, version, markAsRead, markAllAsRead, refresh }
        : { notifications: [], unreadCount: 0, loading: false, error: null, version, markAsRead, markAllAsRead, refresh }
    ), [isAuthenticated, notifications, unreadCount, cargado, error, version, markAsRead, markAllAsRead, refresh]);

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

// El hook vive junto al Provider: así lo importan @context/NotificationContext (caja 8)
// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification debe usarse dentro de NotificationProvider');
    }
    return context;
};

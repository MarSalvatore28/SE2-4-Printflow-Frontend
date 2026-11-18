import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '@context/AuthContext';
import { getToken } from '@services/Auth/auth.service';

interface SocketContextType {
    socket: Socket | null;
    conectado: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, conectado: false });

// En desarrollo la API está en VITE_API_BASE_URL. Vacío (Docker) = la misma URL de la
// página: nginx reenvía /socket.io a la API.
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || undefined;
const REINTENTO_MS = 5000;

// Conexión de tiempo real con la API. Solo se abre con sesión iniciada y manda el
// token en el handshake (el backend lo exige).
export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [conectado, setConectado] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;

        const nuevo = io(SOCKET_URL, {
            path: '/socket.io',
            // Función: en cada reconexión lee el token vigente (se renueva con X-Nuevo-Token)
            auth: (cb) => cb({ token: getToken() ?? '' }),
        });
        let reintento: ReturnType<typeof setTimeout> | undefined;

        nuevo.on('connect', () => {
            setSocket(nuevo);
            setConectado(true);
        });
        nuevo.on('disconnect', () => setConectado(false));
        nuevo.on('connect_error', (err) => {
            setConectado(false);
            // Si el backend rechazó el token, Socket.IO no reintenta solo
            if (!nuevo.active) {
                console.warn('Notificaciones en tiempo real sin conexión:', err.message);
                clearTimeout(reintento);
                reintento = setTimeout(() => nuevo.connect(), REINTENTO_MS);
            }
        });

        return () => {
            clearTimeout(reintento);
            nuevo.removeAllListeners();
            nuevo.disconnect();
            setSocket(null);
            setConectado(false);
        };
    }, [isAuthenticated]);

    return (
        <SocketContext.Provider value={{ socket: isAuthenticated ? socket : null, conectado: isAuthenticated && conectado }}>
            {children}
        </SocketContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);

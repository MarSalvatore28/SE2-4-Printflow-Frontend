import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { modulos } from '@data/modulos.data';
import { useAuth } from '@context/AuthContext';
import { usePermisos } from '@hooks/usePermisos';
// Campana de notificaciones. En la Fase 2 el Equipo A BORRA la linea que termina
// en "[BORRAR en A-F2]" y quita el "// " de las dos que terminan en "[A-F2]".
import { NotificationBell } from './NotificationBell'; // [A-F2]
const Campana = NotificationBell; // [A-F2]

interface SidebarProps {
    /** Solo en celular: el menú está abierto encima del contenido. En escritorio siempre se ve. */
    abierto?: boolean;
    onCerrar?: () => void;
}

export const Sidebar = ({ abierto = false, onCerrar }: Readonly<SidebarProps>) => {
    const { logout, user } = useAuth();
    const { puedeVer, etiquetaRol } = usePermisos();
    const cerrarRef = useRef<HTMLButtonElement>(null);
    // Cada rol ve solo los módulos que puede usar (roles en modulos.data.ts)
    const modulosVisibles = modulos.filter((item) => puedeVer(item.roles));

    // Al abrirlo en el celular, el foco entra al menú
    useEffect(() => {
        if (abierto) cerrarRef.current?.focus();
    }, [abierto]);

    // En celular: fuera de la pantalla (e invisible para el teclado) hasta que se abre
    const posicionMovil = abierto ? 'translate-x-0 visible' : '-translate-x-full invisible';

    return (
        <aside
            id="menu-lateral"
            className={`fixed inset-y-0 left-0 z-40 md:relative md:z-40 md:translate-x-0 md:visible ${posicionMovil} w-64 h-full bg-primary text-white shadow-xl flex flex-col flex-shrink-0 transition-[transform,visibility] duration-300`}
        >
            <div className="p-6 border-b border-secondary/20 flex items-center justify-between gap-2">
                <h1 className="text-2xl font-bold tracking-wider">PrintFlow</h1>
                <div className="flex items-center gap-1">
                    <Campana />
                    <button
                        ref={cerrarRef}
                        type="button"
                        onClick={onCerrar}
                        aria-label="Cerrar menú"
                        className="md:hidden p-2 rounded-lg hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        <X aria-hidden="true" className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                {modulosVisibles.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onCerrar}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-secondary text-white font-semibold shadow-inner animate-fade-in border-l-4 border-width-2 border-white'
                                : 'hover:bg-primary-hover hover:translate-x-1 animate-fade-in'
                            }`
                        }
                    >
                        <item.icon />
                        <span> {item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-secondary/20">
                {user && (
                    <div className="mb-4 px-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-semibold truncate">{user.nombre} {user.apellido}</p>
                            <span data-testid="rol-usuario" className="flex-shrink-0 px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold uppercase tracking-wide">{etiquetaRol}</span>
                        </div>
                        <p className="text-xs text-accent truncate">{user.email}</p>
                    </div>
                )}
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-primary-hover transition-colors text-accent"
                >
                    <span>Cerrar sesión</span>
                </button>
            </div>
        </aside>
    );
};
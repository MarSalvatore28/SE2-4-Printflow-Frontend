import { NavLink } from 'react-router-dom';
import { modulos } from '@data/modulos.data';
import { useAuth } from '@context/AuthContext';
import { usePermisos } from '@hooks/usePermisos';
// Campana de notificaciones. En la Fase 2 el Equipo A BORRA la linea que termina
// en "[BORRAR en A-F2]" y quita el "// " de las dos que terminan en "[A-F2]".
import { NotificationBell } from './NotificationBell'; // [A-F2]
const Campana = NotificationBell; // [A-F2]

export const Sidebar = () => {
    const { logout, user } = useAuth();
    const { puedeVer, etiquetaRol } = usePermisos();
    // Cada rol ve solo los módulos que puede usar (roles en modulos.data.ts)
    const modulosVisibles = modulos.filter((item) => puedeVer(item.roles));
    return (
        <aside className="w-64 h-full bg-primary text-white shadow-xl flex flex-col flex-shrink-0 transition-all duration-300">
            <div className="p-6 border-b border-secondary/20 flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-wider">PrintFlow</h1>
                <Campana />
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                {modulosVisibles.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
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
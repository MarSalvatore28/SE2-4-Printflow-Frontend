import { useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { PermisoRuta } from '@components/auth/PermisoRuta';
import { NotificationBell } from './NotificationBell';

export const Layout = () => {
    // Solo en celular (menos de 768 px): el menú lateral se abre encima del contenido
    const [menuAbierto, setMenuAbierto] = useState(false);
    const botonMenuRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!menuAbierto) return;
        const alEscape = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            setMenuAbierto(false);
            botonMenuRef.current?.focus();
        };
        document.addEventListener('keydown', alEscape);
        return () => document.removeEventListener('keydown', alEscape);
    }, [menuAbierto]);

    return (
        <div className="flex h-screen w-full overflow-hidden text-text font-sans bg-gray-50 relative">
            <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
            {menuAbierto && (
                <div
                    role="presentation"
                    data-testid="fondo-menu"
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setMenuAbierto(false)}
                />
            )}
            <div className="flex-1 min-w-0 h-full flex flex-col">
                <header className="md:hidden flex items-center gap-3 px-4 h-14 flex-shrink-0 bg-primary text-white shadow">
                    <button
                        ref={botonMenuRef}
                        type="button"
                        onClick={() => setMenuAbierto(true)}
                        aria-label="Abrir menú"
                        aria-expanded={menuAbierto}
                        aria-controls="menu-lateral"
                        className="p-2 -ml-2 rounded-lg hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        <Menu aria-hidden="true" className="w-6 h-6" />
                    </button>
                    <span className="text-lg font-bold tracking-wider">PrintFlow</span>
                    {/* La campana también en la barra del celular, sin abrir el menú; el panel se abre hacia la izquierda */}
                    <div className="ml-auto" data-testid="campana-movil">
                        <NotificationBell alinear="derecha" />
                    </div>
                </header>
                <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto">
                    <PermisoRuta>
                        <Outlet />
                    </PermisoRuta>
                </main>
            </div>
        </div>
    );
};

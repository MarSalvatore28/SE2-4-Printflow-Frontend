import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { modulos } from '@data/modulos.data';
import { usePermisos } from '@hooks/usePermisos';

// Si alguien entra por URL a un módulo que su rol no ve en el menú, se muestra
// «No tiene permiso» en lugar de la pantalla. Los roles salen de modulos.data.ts.
export const PermisoRuta = ({ children }: { children: ReactNode }) => {
    const { pathname } = useLocation();
    const { puedeVer, etiquetaRol } = usePermisos();

    const modulo = modulos.find((m) => pathname === m.path || pathname.startsWith(`${m.path}/`));
    if (!modulo || puedeVer(modulo.roles)) return <>{children}</>;

    return (
        <div role="alert" className="bg-white p-10 rounded-lg shadow-sm border border-gray-200 mt-4 flex flex-col items-center text-center gap-4">
            <div className="bg-red-100 text-primary p-4 rounded-full">
                <ShieldAlert className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">No tiene permiso</h1>
            <p className="text-gray-600 max-w-md">
                Su rol ({etiquetaRol}) no tiene acceso a «{modulo.name}». Si lo necesita, pida a un administrador que cambie su rol.
            </p>
            <Link to="/" replace className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition-colors">
                Volver al inicio
            </Link>
        </div>
    );
};

export default PermisoRuta;

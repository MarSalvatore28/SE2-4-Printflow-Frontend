import { Eye } from 'lucide-react';
import { usePermisos } from '@hooks/usePermisos';

interface AvisoSoloLecturaProps {
    // Qué no se puede hacer, p. ej. «crear, editar o desactivar clientes»
    acciones?: string;
    // Rol que sí puede hacerlo
    rolNecesario?: string;
}

// Aviso de que la pantalla está en modo consulta para el rol de la sesión
export const AvisoSoloLectura = ({
    acciones = 'crear, editar o desactivar registros',
    rolNecesario = 'Administrador'
}: AvisoSoloLecturaProps) => {
    const { etiquetaRol } = usePermisos();
    return (
        <div role="note" className="mb-4 flex items-start gap-3 p-3 rounded-lg border border-edit/30 bg-edit/5 text-sm text-gray-700">
            <Eye className="w-4 h-4 mt-0.5 text-edit flex-shrink-0" />
            <span>
                <span className="font-semibold">Modo consulta.</span> Su rol ({etiquetaRol}) puede ver esta información,
                pero para {acciones} se necesita el rol {rolNecesario}.
            </span>
        </div>
    );
};

export default AvisoSoloLectura;

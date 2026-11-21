import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDialogoAccesible } from '@hooks/useDialogoAccesible';
import MarcoDialogo from './MarcoDialogo';

interface ModalAdvertenciaProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    buttonText?: string;
}

export default function ModalAdvertencia({
    isOpen,
    onClose,
    title = 'Datos incompletos',
    message,
    buttonText = 'Entendido'
}: Readonly<ModalAdvertenciaProps>) {
    // Sigue montado 200 ms después de cerrar, para la animación de salida
    const [isRendered, setIsRendered] = useState(isOpen);
    if (isOpen && !isRendered) setIsRendered(true);
    const dialogoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) return;
        const timer = setTimeout(() => setIsRendered(false), 200);
        return () => clearTimeout(timer);
    }, [isOpen]);

    useDialogoAccesible(isOpen && isRendered, onClose, dialogoRef);

    if (!isRendered) return null;

    return (
        <MarcoDialogo
            isOpen={isOpen}
            onClose={onClose}
            dialogoRef={dialogoRef}
            icono={<AlertTriangle className="w-12 h-12" />}
            iconoClase="bg-amber-100 text-amber-600"
            titulo={title}
            mensaje={message}
            mensajeClase="font-medium"
        >
            <div className="flex justify-center">
                <button
                    onClick={onClose}
                    className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-transform active:scale-95 font-bold shadow-md text-lg"
                >
                    {buttonText}
                </button>
            </div>
        </MarcoDialogo>
    );
}

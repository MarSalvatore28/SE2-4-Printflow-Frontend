import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    title = 'Datos Incompletos',
    message,
    buttonText = 'Entendido'
}: ModalAdvertenciaProps) {
    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
        } else {
            const timer = setTimeout(() => setIsRendered(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isRendered) return null;

    return (
        <>
            <style>
                {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes popIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          /* Nueva animación para el icono */
          @keyframes alertIconAnim {
            0% { transform: scale(0) rotate(-15deg); opacity: 0; }
            60% { transform: scale(1.2) rotate(10deg); opacity: 1; }
            80% { transform: scale(0.9) rotate(-5deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          .anim-backdrop {
            animation: fadeIn 0.2s ease-out forwards;
          }
          .anim-modal {
            animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .anim-icon {
            /* Se retrasa 0.1s para que aparezca justo después del modal */
            animation: alertIconAnim 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            animation-delay: 0.1s;
            opacity: 0; /* Se mantiene oculto hasta que empieza la animación */
          }
        `}
            </style>

            <div
                className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-200 ${isOpen ? 'bg-opacity-50 anim-backdrop' : 'bg-opacity-0'}`}
                onClick={onClose}
            >
                <div
                    className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transition-all duration-200 ${isOpen ? 'anim-modal opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-4'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-end p-4 pb-0">
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-700 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                            aria-label="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="px-8 pb-8 pt-2">
                        <div className="flex justify-center mb-6">
                            <div className="anim-icon bg-amber-100 text-amber-600 p-4 rounded-full shadow-inner">
                                <AlertTriangle className="w-12 h-12" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
                            {title}
                        </h2>

                        <div className="text-gray-600 text-center mb-8 leading-relaxed font-medium">
                            {message}
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={onClose}
                                className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-transform active:scale-95 font-bold shadow-md text-lg"
                            >
                                {buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
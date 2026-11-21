import { X } from 'lucide-react';
import { useId, type ReactNode, type RefObject } from 'react';

// Marco común de ModalConfirmacion y ModalAdvertencia: fondo, diálogo accesible, botón de cerrar,
// ícono, título y mensaje. Cada modal pone sus botones (y su campo, si tiene) como `children`.
interface MarcoDialogoProps {
  isOpen: boolean;
  onClose: () => void;
  dialogoRef: RefObject<HTMLDivElement | null>;
  icono: ReactNode;
  /** Clases del círculo del ícono (fondo y color) */
  iconoClase: string;
  titulo: ReactNode;
  mensaje: ReactNode;
  mensajeClase?: string;
  children: ReactNode;
}

const ESTILOS = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes popIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
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
    /* Se retrasa 0.1 s para que aparezca justo después del modal */
    animation: alertIconAnim 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    animation-delay: 0.1s;
    opacity: 0;
  }
`;

export default function MarcoDialogo({
  isOpen,
  onClose,
  dialogoRef,
  icono,
  iconoClase,
  titulo,
  mensaje,
  mensajeClase = '',
  children,
}: Readonly<MarcoDialogoProps>) {
  const idTitulo = useId();
  const idMensaje = useId();

  return (
    <>
      <style>{ESTILOS}</style>

      <div
        role="presentation"
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-200 ${isOpen ? 'bg-opacity-50 anim-backdrop' : 'bg-opacity-0'}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={dialogoRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={idTitulo}
          aria-describedby={idMensaje}
          tabIndex={-1}
          className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transition-all duration-200 focus:outline-none ${isOpen ? 'anim-modal opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-4'}`}
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
              <div aria-hidden="true" className={`anim-icon ${iconoClase} p-4 rounded-full shadow-inner`}>
                {icono}
              </div>
            </div>

            <h2 id={idTitulo} className="text-2xl font-bold text-gray-900 text-center mb-3">
              {titulo}
            </h2>

            <div id={idMensaje} className={`text-gray-600 text-center mb-8 leading-relaxed ${mensajeClase}`}>
              {mensaje}
            </div>

            {children}
          </div>
        </div>
      </div>
    </>
  );
}

import { AlertCircle, CheckCircle, Trash2, X } from 'lucide-react';
import { useState, useEffect, useId, useRef } from 'react';
import { useDialogoAccesible } from '@hooks/useDialogoAccesible';

interface ModalConfirmacionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inputValue?: string) => void;
  title: string;
  message: string | React.ReactNode;
  type?: 'delete' | 'activate' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  showInput?: boolean;
  inputPlaceholder?: string;
  showCancel?: boolean;
}

export default function ModalConfirmacion({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  showInput = false,
  inputPlaceholder = '',
  showCancel = true,
}: ModalConfirmacionProps) {
  const [inputValue, setInputValue] = useState('');

  const [isRendered, setIsRendered] = useState(false);
  const dialogoRef = useRef<HTMLDivElement>(null);
  // Con campo de texto, el foco empieza en él (en vez de autoFocus)
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const idTitulo = useId();
  const idMensaje = useId();

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => setIsRendered(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useDialogoAccesible(isOpen && isRendered, onClose, dialogoRef, campoRef);

  if (!isRendered) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'delete':
        return {
          icon: <Trash2 className="w-12 h-12" />,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          borderColor: 'border-red-200',
        };
      case 'activate':
        return {
          icon: <CheckCircle className="w-12 h-12" />,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          buttonBg: 'bg-green-600 hover:bg-green-700',
          borderColor: 'border-green-200',
        };
      case 'info':
        return {
          icon: <AlertCircle className="w-12 h-12" />,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          borderColor: 'border-blue-200',
        };
      default:
        return {
          icon: <AlertCircle className="w-12 h-12" />,
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
          borderColor: 'border-yellow-200',
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    onConfirm(inputValue);
    setInputValue('');
    onClose();
  };

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
            animation: alertIconAnim 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            animation-delay: 0.1s;
            opacity: 0;
          }
        `}
      </style>

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
              {/* Aquí se inyecta la clase anim-icon a tu lógica dinámica de estilos */}
              <div aria-hidden="true" className={`anim-icon ${styles.iconBg} ${styles.iconColor} p-4 rounded-full shadow-inner`}>
                {styles.icon}
              </div>
            </div>

            <h2 id={idTitulo} className="text-2xl font-bold text-gray-900 text-center mb-3">
              {title}
            </h2>

            <div id={idMensaje} className="text-gray-600 text-center mb-8 leading-relaxed">
              {message}
            </div>

            {showInput && (
              <div className="mb-6">
                <textarea
                  ref={campoRef}
                  aria-label={inputPlaceholder || title}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={inputPlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-shadow"
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-3">
              {showCancel && (
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all active:scale-95 font-semibold"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`flex-1 px-6 py-3 ${styles.buttonBg} text-white rounded-lg transition-all active:scale-95 font-semibold shadow-md`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
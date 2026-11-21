import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useDialogoAccesible } from '@hooks/useDialogoAccesible';
import MarcoDialogo from './MarcoDialogo';

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
}: Readonly<ModalConfirmacionProps>) {
  const [inputValue, setInputValue] = useState('');

  // Sigue montado 200 ms después de cerrar, para la animación de salida
  const [isRendered, setIsRendered] = useState(isOpen);
  if (isOpen && !isRendered) setIsRendered(true);
  const dialogoRef = useRef<HTMLDivElement>(null);
  // Con campo de texto, el foco empieza en él (en vez de autoFocus)
  const campoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => setIsRendered(false), 200);
    return () => clearTimeout(timer);
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
    <MarcoDialogo
      isOpen={isOpen}
      onClose={onClose}
      dialogoRef={dialogoRef}
      icono={styles.icon}
      iconoClase={`${styles.iconBg} ${styles.iconColor}`}
      titulo={title}
      mensaje={message}
    >
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
    </MarcoDialogo>
  );
}

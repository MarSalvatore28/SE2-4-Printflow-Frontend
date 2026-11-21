import { useEffect, useRef, type RefObject } from 'react';

const SELECTOR_ENFOCABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const elementosEnfocables = (contenedor: HTMLElement): HTMLElement[] =>
  Array.from(contenedor.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLE));

/**
 * Comportamiento de teclado de un diálogo modal:
 * - al abrir pone el foco en `focoInicialRef` (o en el primer elemento enfocable),
 * - Escape cierra,
 * - Tab y Shift+Tab no salen del diálogo,
 * - al cerrar devuelve el foco al elemento que lo tenía antes.
 */
export function useDialogoAccesible(
  activo: boolean,
  onCerrar: () => void,
  dialogoRef: RefObject<HTMLElement | null>,
  focoInicialRef?: RefObject<HTMLElement | null>,
) {
  const onCerrarRef = useRef(onCerrar);

  useEffect(() => {
    onCerrarRef.current = onCerrar;
  }, [onCerrar]);

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!activo || !dialogo) return;

    const focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const inicial = focoInicialRef?.current ?? elementosEnfocables(dialogo)[0] ?? dialogo;
    inicial.focus();

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrarRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const enfocables = elementosEnfocables(dialogo);
      if (enfocables.length === 0) {
        e.preventDefault();
        dialogo.focus();
        return;
      }
      const primero = enfocables[0];
      const ultimo = enfocables.at(-1) ?? primero;
      const actual = document.activeElement;
      const fuera = !dialogo.contains(actual);

      if (e.shiftKey && (actual === primero || fuera)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (actual === ultimo || fuera)) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      if (focoAnterior?.isConnected) focoAnterior.focus();
    };
  }, [activo, dialogoRef, focoInicialRef]);
}

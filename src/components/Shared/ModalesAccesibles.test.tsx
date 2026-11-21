import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ModalConfirmacion from './ModalConfirmacion';
import ModalAdvertencia from './ModalAdvertencia';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let contenedor: HTMLDivElement;
let raiz: Root;

const montar = (ui: ReactNode) => {
  contenedor = document.createElement('div');
  document.body.appendChild(contenedor);
  raiz = createRoot(contenedor);
  act(() => raiz.render(ui));
};

const tecla = (key: string, shiftKey = false) => {
  const destino = document.activeElement ?? document.body;
  act(() => {
    destino.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }));
  });
};

const dialogo = () => document.querySelector<HTMLElement>('[role="dialog"]');
const botones = () => Array.from(dialogo()?.querySelectorAll('button') ?? []);

afterEach(() => {
  act(() => raiz.unmount());
  contenedor.remove();
  document.body.innerHTML = '';
});

describe('ModalConfirmacion', () => {
  const props = {
    isOpen: true,
    onClose: () => {},
    onConfirm: () => {},
    title: 'Eliminar cliente',
    message: '¿Seguro que quieres eliminarlo?',
    type: 'delete' as const,
  };

  it('es un diálogo modal con nombre (el título)', () => {
    montar(<ModalConfirmacion {...props} />);
    const d = dialogo();
    expect(d).not.toBeNull();
    expect(d?.getAttribute('aria-modal')).toBe('true');
    const titulo = document.getElementById(d?.getAttribute('aria-labelledby') ?? '');
    expect(titulo?.textContent).toBe('Eliminar cliente');
    expect(d?.parentElement?.getAttribute('role')).toBe('presentation');
  });

  it('al abrir pone el foco dentro del diálogo', () => {
    montar(<ModalConfirmacion {...props} />);
    expect(dialogo()?.contains(document.activeElement)).toBe(true);
  });

  it('Escape cierra', () => {
    const onClose = vi.fn();
    montar(<ModalConfirmacion {...props} onClose={onClose} />);
    tecla('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Tab y Shift+Tab no sacan el foco del diálogo', () => {
    montar(<ModalConfirmacion {...props} />);
    const lista = botones();
    const primero = lista[0];
    const ultimo = lista[lista.length - 1];

    act(() => ultimo.focus());
    tecla('Tab');
    expect(document.activeElement).toBe(primero);

    tecla('Tab', true);
    expect(document.activeElement).toBe(ultimo);
  });

  it('tocar el fondo cierra; tocar dentro del diálogo no', () => {
    const onClose = vi.fn();
    montar(<ModalConfirmacion {...props} onClose={onClose} />);
    act(() => dialogo()?.click());
    expect(onClose).not.toHaveBeenCalled();
    act(() => (dialogo()?.parentElement as HTMLElement).click());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('con campo de texto, el foco empieza en el campo y sin autoFocus', () => {
    montar(<ModalConfirmacion {...props} showInput inputPlaceholder="Motivo" />);
    const campo = dialogo()?.querySelector('textarea');
    expect(document.activeElement).toBe(campo);
    expect(campo?.hasAttribute('autofocus')).toBe(false);
    expect(campo?.getAttribute('aria-label')).toBe('Motivo');
  });

  it('al cerrar devuelve el foco al botón que lo abrió', () => {
    const abridor = document.createElement('button');
    document.body.appendChild(abridor);
    abridor.focus();

    montar(<ModalConfirmacion {...props} />);
    expect(document.activeElement).not.toBe(abridor);

    act(() => raiz.render(<ModalConfirmacion {...props} isOpen={false} />));
    expect(document.activeElement).toBe(abridor);
  });
});

describe('ModalAdvertencia', () => {
  it('es un diálogo modal con nombre, Escape cierra y el foco queda dentro', () => {
    const onClose = vi.fn();
    montar(<ModalAdvertencia isOpen onClose={onClose} title="Datos incompletos" message="Falta el nombre" />);
    const d = dialogo();
    expect(d?.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(d?.getAttribute('aria-labelledby') ?? '')?.textContent).toBe('Datos incompletos');
    expect(d?.contains(document.activeElement)).toBe(true);

    const lista = botones();
    act(() => lista[lista.length - 1].focus());
    tecla('Tab');
    expect(document.activeElement).toBe(lista[0]);

    tecla('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

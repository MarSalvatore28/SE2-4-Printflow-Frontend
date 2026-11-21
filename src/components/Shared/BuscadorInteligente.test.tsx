import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { BuscadorInteligente } from './BuscadorInteligente';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface Cliente {
  id: number;
  nombre: string;
}

const clientes: Cliente[] = [
  { id: 1, nombre: 'Colegio Alfa' },
  { id: 2, nombre: 'Colegio Beta' },
  { id: 3, nombre: 'Colegio Gamma' },
];

let contenedor: HTMLDivElement;
let raiz: Root;
let onSeleccionar: Mock<(cliente: Cliente) => void>;

const campo = () => contenedor.querySelector<HTMLInputElement>('input[role="combobox"]') as HTMLInputElement;
const lista = () => contenedor.querySelector('[role="listbox"]');
const opciones = () => Array.from(contenedor.querySelectorAll('[role="option"]'));

const tecla = (key: string) => {
  act(() => {
    campo().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
};

beforeEach(() => {
  onSeleccionar = vi.fn<(cliente: Cliente) => void>();
  contenedor = document.createElement('div');
  document.body.appendChild(contenedor);
  raiz = createRoot(contenedor);
  act(() =>
    raiz.render(
      <BuscadorInteligente<Cliente>
        placeholder="Buscar cliente"
        buscarFn={async () => clientes}
        onSeleccionar={onSeleccionar}
        renderItem={(c) => c.nombre}
        getItemKey={(c) => c.id}
        getItemLabel={(c) => c.nombre}
        itemsCompletos={clientes}
      />,
    ),
  );
});

afterEach(() => {
  act(() => raiz.unmount());
  contenedor.remove();
});

describe('BuscadorInteligente con teclado', () => {
  it('el campo es un combobox con nombre y la lista empieza cerrada', () => {
    expect(campo().getAttribute('aria-label')).toBe('Buscar cliente');
    expect(campo().getAttribute('aria-expanded')).toBe('false');
    expect(lista()).toBeNull();
  });

  it('las flechas abren la lista y mueven la opción activa', () => {
    tecla('ArrowDown');
    expect(lista()).not.toBeNull();
    expect(campo().getAttribute('aria-expanded')).toBe('true');
    expect(campo().getAttribute('aria-controls')).toBe(lista()?.id);
    expect(opciones()).toHaveLength(3);
    expect(opciones()[0].getAttribute('aria-selected')).toBe('true');
    expect(campo().getAttribute('aria-activedescendant')).toBe(opciones()[0].id);

    tecla('ArrowDown');
    expect(opciones()[1].getAttribute('aria-selected')).toBe('true');
    expect(opciones()[0].getAttribute('aria-selected')).toBe('false');
    expect(campo().getAttribute('aria-activedescendant')).toBe(opciones()[1].id);

    tecla('ArrowUp');
    expect(campo().getAttribute('aria-activedescendant')).toBe(opciones()[0].id);
  });

  it('Enter elige la opción activa y cierra la lista', () => {
    tecla('ArrowDown');
    tecla('ArrowDown');
    tecla('Enter');
    expect(onSeleccionar).toHaveBeenCalledWith(clientes[1]);
    expect(lista()).toBeNull();
    expect(campo().value).toBe('Colegio Beta');
  });

  it('Escape cierra la lista sin llegar al modal que la contiene', () => {
    tecla('ArrowDown');
    expect(lista()).not.toBeNull();
    const escapeDelModal = vi.fn();
    document.addEventListener('keydown', escapeDelModal);
    tecla('Escape');
    document.removeEventListener('keydown', escapeDelModal);
    expect(lista()).toBeNull();
    expect(escapeDelModal).not.toHaveBeenCalled();
    expect(onSeleccionar).not.toHaveBeenCalled();
  });

  it('Enter sobre una opción enfocada también la elige', () => {
    tecla('ArrowDown');
    const tercera = opciones()[2] as HTMLElement;
    act(() => {
      tercera.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    });
    expect(onSeleccionar).toHaveBeenCalledWith(clientes[2]);
  });
});

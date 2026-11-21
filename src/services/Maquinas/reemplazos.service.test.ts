import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { anularReemplazo } from './reemplazos.service';

const respuesta = (status: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

describe('anularReemplazo', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'token-prueba');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  const pedido = () => vi.mocked(fetch).mock.calls[0];

  it('envía POST /api/maquinas-cambio/:id/anular con el motivo y devuelve el reemplazo', async () => {
    vi.mocked(fetch).mockResolvedValue(respuesta(200, { success: true, data: { id_maquina_cambio: 3, activo: false } }));

    const anulado = await anularReemplazo(3, '  Se eligió la máquina equivocada ');

    const [url, opciones] = pedido();
    expect(String(url)).toMatch(/\/api\/maquinas-cambio\/3\/anular$/);
    expect(opciones?.method).toBe('POST');
    expect(JSON.parse(String(opciones?.body))).toEqual({ motivo: 'Se eligió la máquina equivocada' });
    expect(new Headers(opciones?.headers).get('Authorization')).toBe('Bearer token-prueba');
    expect(anulado.activo).toBe(false);
  });

  it('sin motivo envía un cuerpo vacío', async () => {
    vi.mocked(fetch).mockResolvedValue(respuesta(200, { success: true, data: { id_maquina_cambio: 3 } }));

    await anularReemplazo(3, '   ');

    expect(JSON.parse(String(pedido()[1]?.body))).toEqual({});
  });

  it('un 409 lanza un Error con el mensaje de la API', async () => {
    const mensaje = 'No se puede anular el reemplazo #3: el período 2026-11 ya tiene lecturas aprobadas de SIMF0006. Un período aprobado no se recalcula';
    vi.mocked(fetch).mockResolvedValue(respuesta(409, { success: false, message: mensaje }));

    await expect(anularReemplazo(3)).rejects.toThrow(mensaje);
  });

  it('sin mensaje de la API usa uno por defecto con el código', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('error', { status: 500 }));

    await expect(anularReemplazo(3)).rejects.toThrow('Error al anular el reemplazo (500)');
  });
});

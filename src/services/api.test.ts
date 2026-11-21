import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './api';
import { EVENTO_USUARIO } from './Auth/auth.service';

// JWT de prueba con el payload dado (base64url, como los del backend)
const jwt = (payload: Record<string, unknown>) =>
  `cabecera.${btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.firma`;

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  const headersEnviados = () =>
    new Headers(vi.mocked(fetch).mock.calls[0]?.[1]?.headers);

  it('agrega Authorization cuando existe token', async () => {
    localStorage.setItem('token', 'token-prueba');

    await apiFetch('/api/clientes');

    expect(headersEnviados().get('Authorization')).toBe('Bearer token-prueba');
  });

  it('agrega Content-Type cuando el cuerpo es texto', async () => {
    await apiFetch('/api/clientes', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'Prueba' }),
    });

    expect(headersEnviados().get('Content-Type')).toBe('application/json');
  });

  it('no agrega Content-Type cuando no hay cuerpo', async () => {
    await apiFetch('/api/clientes');

    expect(headersEnviados().has('Content-Type')).toBe(false);
  });

  it('respeta un Content-Type personalizado', async () => {
    await apiFetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'prueba',
    });

    expect(headersEnviados().get('Content-Type')).toBe('text/plain');
  });

  it('guarda el token renovado de la respuesta', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { 'X-Nuevo-Token': 'token-nuevo' },
      })
    );

    await apiFetch('/api/clientes');

    expect(localStorage.getItem('token')).toBe('token-nuevo');
  });

  it('si el token renovado trae otro rol, actualiza el usuario guardado y avisa (menú al instante)', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 6, email: 'ana@printflow.local', rol: { id_rol: 2, nombre: 'operador', descripcion: '' } }));
    const avisos = vi.fn();
    window.addEventListener(EVENTO_USUARIO, avisos);
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 200, headers: { 'X-Nuevo-Token': jwt({ id: 6, email: 'ana@printflow.local', rol: 'admin' }) } })
    );

    await apiFetch('/api/clientes');
    window.removeEventListener(EVENTO_USUARIO, avisos);

    expect(JSON.parse(localStorage.getItem('user') ?? '{}').rol.nombre).toBe('admin');
    expect(avisos).toHaveBeenCalledTimes(1);
  });

  it('si el rol no cambió, no toca el usuario guardado', async () => {
    const usuario = { id: 6, email: 'ana@printflow.local', rol: { id_rol: 2, nombre: 'operador', descripcion: 'Carga' } };
    localStorage.setItem('user', JSON.stringify(usuario));
    const avisos = vi.fn();
    window.addEventListener(EVENTO_USUARIO, avisos);
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 200, headers: { 'X-Nuevo-Token': jwt({ id: 6, email: 'ana@printflow.local', rol: 'operador' }) } })
    );

    await apiFetch('/api/clientes');
    window.removeEventListener(EVENTO_USUARIO, avisos);

    expect(JSON.parse(localStorage.getItem('user') ?? '{}')).toEqual(usuario);
    expect(avisos).not.toHaveBeenCalled();
  });

  it('en 401 elimina la sesión, redirige y lanza error', async () => {
    localStorage.setItem('token', 'token-viejo');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    const redireccionar = vi.fn();
    vi.stubGlobal('window', {
      location: { replace: redireccionar },
    });

    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 401 })
    );

    await expect(apiFetch('/api/clientes')).rejects.toThrow(
      'Sesión vencida. Inicia sesión nuevamente.'
    );

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(redireccionar).toHaveBeenCalledWith('/login');
  });
});

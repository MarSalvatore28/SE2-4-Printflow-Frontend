import { describe, expect, it } from 'vitest';
import { getTokenExpiration, isTokenExpired, leerPayloadToken } from './jwtUtils';

const crearToken = (exp: number) =>
  `cabecera.${btoa(JSON.stringify({ exp }))}.firma`;

describe('Utilidades JWT', () => {
  it('detecta un token vencido', () => {
    const token = crearToken(Math.floor(Date.now() / 1000) - 3600);
    expect(isTokenExpired(token)).toBe(true);
  });

  it('acepta un token vigente', () => {
    const token = crearToken(Math.floor(Date.now() / 1000) + 3600);
    expect(isTokenExpired(token)).toBe(false);
  });

  it('considera vencido un token mal formado', () => {
    expect(isTokenExpired('token-invalido')).toBe(true);
  });

  it('obtiene la expiración en milisegundos', () => {
    expect(getTokenExpiration(crearToken(2000000000))).toBe(2000000000000);
  });

  it('devuelve null cuando no existe expiración', () => {
    expect(getTokenExpiration('invalido')).toBeNull();
  });

  it('lee el payload en base64url («-» y «_»), como lo firma el backend', () => {
    // «?>» en base64 normal da «Pz4», y «~~~» da «fn5+»: en base64url, «fn5-»
    const payload = { exp: 2000000000, rol: 'admin', nota: '~~~' };
    const base64url = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(base64url).toMatch(/[-_]/);
    const token = `cabecera.${base64url}.firma`;
    expect(leerPayloadToken(token)).toEqual(payload);
    expect(getTokenExpiration(token)).toBe(2000000000000);
  });
});

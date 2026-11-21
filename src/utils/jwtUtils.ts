// utils/jwtUtils.ts

// Contenido (payload) del JWT, o null si el token está mal formado. El JWT usa base64url
// («-» y «_» en lugar de «+» y «/», sin «=»): atob solo entiende base64 normal.
export function leerPayloadToken(token: string): Record<string, unknown> | null {
  try {
    const parte = token.split('.')[1];
    if (!parte) return null;
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// Decodifica el JWT y retorna el tiempo de expiración
export function getTokenExpiration(token: string): number | null {
  const exp = leerPayloadToken(token)?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}

// Retorna true si el token está expirado
export function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiration(token);
  if (!exp) return true;
  return Date.now() > exp;
}

import { describe, expect, it } from 'vitest';
import { ROLES, PERMISOS, rolPermitido, etiquetaRol } from './permisos';

describe('Permisos por rol', () => {
  const permisos = [
    'editarCatalogos',
    'aprobarLotes',
    'eliminarNotificaciones',
    'gestionarUsuarios',
  ] as const;

  const matriz = [
    { rol: ROLES.ADMIN, resultados: [true, true, true, true] },
    { rol: ROLES.OPERADOR, resultados: [false, true, true, false] },
    { rol: ROLES.AUDITOR, resultados: [false, false, false, false] },
  ];

  matriz.forEach(({ rol, resultados }) => {
    permisos.forEach((permiso, indice) => {
      it(`${rol} - ${permiso}`, () => {
        expect(rolPermitido(rol, PERMISOS[permiso])).toBe(resultados[indice]);
      });
    });
  });

  it('permite una lista de roles vacía', () => {
    expect(rolPermitido(null, [])).toBe(true);
  });

  it('rechaza un rol no autorizado', () => {
    expect(rolPermitido('invitado', PERMISOS.editarCatalogos)).toBe(false);
  });

  it('muestra la etiqueta de administrador', () => {
    expect(etiquetaRol(ROLES.ADMIN)).toBe('Administrador');
  });

  it('muestra Sin rol cuando no hay rol', () => {
    expect(etiquetaRol(null)).toBe('Sin rol');
  });
});

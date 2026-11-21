import type { Usuario } from '@models/Usuario/usuario.types';
import { etiquetaRol } from '@utils/permisos';

export const nombreCompleto = (u: Usuario) => [u.nombre, u.apellido].filter(Boolean).join(' ');

// Cada palabra del término debe aparecer en el nombre, el correo o el rol.
export const coincide = (u: Usuario, termino: string) => {
    const texto = [u.nombre, u.apellido, u.email, u.rol, etiquetaRol(u.rol)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return termino.toLowerCase().split(/\s+/).filter(Boolean).every(p => texto.includes(p));
};

export const ordenar = (lista: Usuario[]) =>
    [...lista].sort((a, b) => Number(b.activo) - Number(a.activo) || nombreCompleto(a).localeCompare(nombreCompleto(b)));

// Textos del modal de activar o desactivar según el estado actual del usuario
export const textosCambioEstado = (usuario: Usuario | null) => {
    const nombre = usuario ? nombreCompleto(usuario) : '';
    if (usuario?.activo) {
        return {
            type: 'delete' as const,
            title: '¿Desactivar usuario?',
            message: `¿Deseas desactivar a ${nombre} (${usuario.email})? No podrá iniciar sesión y su sesión abierta se cerrará en su próxima acción.`,
            confirmText: 'Desactivar',
        };
    }
    return {
        type: 'activate' as const,
        title: '¿Activar usuario?',
        message: `¿Deseas activar a ${nombre} (${usuario?.email ?? ''})? Podrá volver a iniciar sesión.`,
        confirmText: 'Activar',
    };
};

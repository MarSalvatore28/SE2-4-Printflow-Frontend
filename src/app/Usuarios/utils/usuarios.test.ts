import { describe, expect, it } from 'vitest';
import type { Usuario } from '@models/Usuario/usuario.types';
import { coincide, nombreCompleto, ordenar, textosCambioEstado } from './usuarios';

const usuario = (id_usuario: number, datos: Partial<Usuario>): Usuario => ({
    id_usuario,
    nombre: 'Ana',
    apellido: null,
    email: `u${id_usuario}@printflow.local`,
    activo: true,
    rol_id: 2,
    rol: 'operador',
    rol_descripcion: null,
    ...datos,
});

describe('usuarios', () => {
    it('nombreCompleto omite el apellido vacío', () => {
        expect(nombreCompleto(usuario(1, { nombre: 'Ana', apellido: 'Pérez' }))).toBe('Ana Pérez');
        expect(nombreCompleto(usuario(1, { nombre: 'Ana', apellido: null }))).toBe('Ana');
    });

    it('coincide busca cada palabra en nombre, correo o rol', () => {
        const u = usuario(1, { nombre: 'María', apellido: 'López', rol: 'auditor' });
        expect(coincide(u, 'maría auditor')).toBe(true);
        expect(coincide(u, 'U1@PRINTFLOW')).toBe(true);
        expect(coincide(u, 'maría operador')).toBe(false);
    });

    it('ordenar pone primero los activos y luego por nombre', () => {
        const lista = [
            usuario(1, { nombre: 'Zoe', activo: true }),
            usuario(2, { nombre: 'Ana', activo: false }),
            usuario(3, { nombre: 'Bruno', activo: true }),
        ];
        expect(ordenar(lista).map(u => u.id_usuario)).toEqual([3, 1, 2]);
        expect(lista.map(u => u.id_usuario)).toEqual([1, 2, 3]);
    });

    it('textosCambioEstado según el estado del usuario', () => {
        const activo = textosCambioEstado(usuario(1, { nombre: 'Ana', apellido: 'Pérez', activo: true }));
        expect(activo.type).toBe('delete');
        expect(activo.title).toBe('¿Desactivar usuario?');
        expect(activo.message).toContain('desactivar a Ana Pérez (u1@printflow.local)');
        expect(activo.confirmText).toBe('Desactivar');

        const inactivo = textosCambioEstado(usuario(2, { nombre: 'Luis', activo: false }));
        expect(inactivo.type).toBe('activate');
        expect(inactivo.message).toBe('¿Deseas activar a Luis (u2@printflow.local)? Podrá volver a iniciar sesión.');

        expect(textosCambioEstado(null).message).toBe('¿Deseas activar a  ()? Podrá volver a iniciar sesión.');
    });
});

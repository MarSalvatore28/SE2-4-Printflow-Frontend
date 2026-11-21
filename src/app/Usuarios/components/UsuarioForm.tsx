import { useState, type FC } from 'react';
import { etiquetaRol } from '@utils/permisos';
import type { RolUsuario, Usuario, UsuarioFormData } from '@models/Usuario/usuario.types';

interface UsuarioFormValues {
    nombre: string;
    apellido: string;
    email: string;
    rol_id: string;
    password: string;
    confirmacion: string;
}

type ErroresCampo = Partial<Record<keyof UsuarioFormValues, string>>;

interface UsuarioFormProps {
    usuario: Usuario | null;      // null = nuevo
    roles: RolUsuario[];
    esUsted: boolean;             // el admin se edita a sí mismo: no puede cambiarse el rol
    isSubmitting: boolean;
    errorApi: string | null;
    onSave: (datos: UsuarioFormData) => void;
    onCancel: () => void;
}

// Mismas reglas que el backend (src/utils/usuarios.validacion.js)
// Acepta los mismos correos que antes, pero sin retroceso costoso (igual que el backend)
const EMAIL_VALIDO = /^[^\s@]+@[^\s@][^\s@.]*\.[^\s@]+$/;
const PASSWORD_MIN = 8;

const validarPassword = (password: string): string | undefined => {
    if (password.length < PASSWORD_MIN) return `Debe tener al menos ${PASSWORD_MIN} caracteres`;
    if (new TextEncoder().encode(password).length > 72) return 'No puede tener más de 72 caracteres';
    if (!/\p{L}/u.test(password) || !/\d/.test(password)) return 'Debe tener al menos una letra y un número';
    return undefined;
};

const valoresIniciales = (usuario: Usuario | null): UsuarioFormValues => ({
    nombre: usuario?.nombre ?? '',
    apellido: usuario?.apellido ?? '',
    email: usuario?.email ?? '',
    rol_id: usuario?.rol_id ? String(usuario.rol_id) : '',
    password: '',
    confirmacion: ''
});

const inputClass = (conError: boolean) =>
    `w-full rounded-md border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-500 ${conError ? 'border-red-500' : 'border-gray-300'}`;

// Qué puede hacer cada rol, bajo el selector
const AYUDA_ROL: Record<string, string> = {
    auditor: 'Solo puede consultar: no crea, edita ni aprueba.',
    operador: 'Consulta todo y aprueba o rechaza lotes; no edita catálogos ni usuarios.',
    admin: 'Acceso total, incluida la gestión de usuarios.',
};

const AyudaRol = ({ error, esUsted, rol }: { error?: string; esUsted: boolean; rol?: string }) => {
    if (error) return <p className="mt-1 text-sm text-red-600">{error}</p>;
    if (esUsted) return <p className="mt-1 text-xs text-gray-500">No puede quitarse a sí mismo el rol de administrador.</p>;
    const ayuda = rol ? AYUDA_ROL[rol] : undefined;
    return ayuda ? <p className="mt-1 text-xs text-gray-500">{ayuda}</p> : null;
};

export const UsuarioForm: FC<UsuarioFormProps> = ({
    usuario,
    roles,
    esUsted,
    isSubmitting,
    errorApi,
    onSave,
    onCancel
}) => {
    const [valores, setValores] = useState<UsuarioFormValues>(() => valoresIniciales(usuario));
    const [errores, setErrores] = useState<ErroresCampo>({});
    const esNuevo = !usuario;

    const cambiar = (campo: keyof UsuarioFormValues, valor: string) => {
        setValores(prev => ({ ...prev, [campo]: valor }));
        setErrores(prev => ({ ...prev, [campo]: undefined }));
    };

    const validar = (): ErroresCampo => {
        const e: ErroresCampo = {};
        if (!valores.nombre.trim()) e.nombre = 'El nombre es obligatorio';
        const email = valores.email.trim();
        if (!email) e.email = 'El correo es obligatorio';
        else if (!EMAIL_VALIDO.test(email)) e.email = 'El correo no tiene un formato válido';
        if (!valores.rol_id) e.rol_id = 'Seleccione un rol';

        if (esNuevo || valores.password) {
            if (!valores.password) e.password = 'La contraseña es obligatoria';
            else e.password = validarPassword(valores.password);
            if (!e.password && valores.confirmacion !== valores.password) e.confirmacion = 'Las contraseñas no coinciden';
        }
        return Object.fromEntries(Object.entries(e).filter(([, v]) => v)) as ErroresCampo;
    };

    const handleGuardar = () => {
        const e = validar();
        setErrores(e);
        if (Object.keys(e).length > 0) return;
        onSave({
            nombre: valores.nombre.trim(),
            apellido: valores.apellido.trim(),
            email: valores.email.trim().toLowerCase(),
            rol_id: Number(valores.rol_id),
            ...(valores.password ? { password: valores.password } : {})
        });
    };

    const rolElegido = roles.find(r => String(r.id_rol) === valores.rol_id);
    const textoGuardar = esNuevo ? 'Guardar Usuario' : 'Actualizar Usuario';

    return (
        <div className="flex flex-col gap-8">
            {errorApi && (
                <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    {errorApi}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                    <label htmlFor="usuario-nombre" className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                    <input
                        id="usuario-nombre"
                        name="nombre"
                        type="text"
                        className={inputClass(!!errores.nombre)}
                        placeholder="Ej: María"
                        value={valores.nombre}
                        onChange={(e) => cambiar('nombre', e.target.value)}
                        maxLength={100}
                    />
                    {errores.nombre && <p className="mt-1 text-sm text-red-600">{errores.nombre}</p>}
                </div>

                <div>
                    <label htmlFor="usuario-apellido" className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                    <input
                        id="usuario-apellido"
                        name="apellido"
                        type="text"
                        className={inputClass(false)}
                        placeholder="Ej: Pérez"
                        value={valores.apellido}
                        onChange={(e) => cambiar('apellido', e.target.value)}
                        maxLength={100}
                    />
                </div>

                <div>
                    <label htmlFor="usuario-email" className="block text-sm font-medium text-gray-700 mb-2">Correo *</label>
                    <input
                        id="usuario-email"
                        name="email"
                        type="email"
                        autoComplete="off"
                        className={inputClass(!!errores.email)}
                        placeholder="Ej: maria.perez@empresa.com"
                        value={valores.email}
                        onChange={(e) => cambiar('email', e.target.value)}
                        maxLength={100}
                    />
                    {errores.email
                        ? <p className="mt-1 text-sm text-red-600">{errores.email}</p>
                        : <p className="mt-1 text-xs text-gray-500">Con este correo inicia sesión. Se guarda en minúsculas.</p>}
                </div>

                <div>
                    <label htmlFor="usuario-rol" className="block text-sm font-medium text-gray-700 mb-2">Rol *</label>
                    <select
                        id="usuario-rol"
                        name="rol_id"
                        className={inputClass(!!errores.rol_id)}
                        value={valores.rol_id}
                        onChange={(e) => cambiar('rol_id', e.target.value)}
                        disabled={esUsted}
                    >
                        <option value="">Seleccione...</option>
                        {roles.map(r => (
                            <option key={r.id_rol} value={r.id_rol}>
                                {etiquetaRol(r.nombre)}{r.descripcion ? ` · ${r.descripcion}` : ''}
                            </option>
                        ))}
                    </select>
                    <AyudaRol error={errores.rol_id} esUsted={esUsted} rol={rolElegido?.nombre} />
                </div>

                <div>
                    <label htmlFor="usuario-password" className="block text-sm font-medium text-gray-700 mb-2">
                        {esNuevo ? 'Contraseña *' : 'Nueva contraseña'}
                    </label>
                    <input
                        id="usuario-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        className={inputClass(!!errores.password)}
                        placeholder={esNuevo ? 'Mínimo 8 caracteres, con letra y número' : 'Déjela en blanco para no cambiarla'}
                        value={valores.password}
                        onChange={(e) => cambiar('password', e.target.value)}
                    />
                    {errores.password
                        ? <p className="mt-1 text-sm text-red-600">{errores.password}</p>
                        : <p className="mt-1 text-xs text-gray-500">Mínimo {PASSWORD_MIN} caracteres, con al menos una letra y un número.</p>}
                </div>

                <div>
                    <label htmlFor="usuario-confirmacion" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar contraseña{esNuevo ? ' *' : ''}
                    </label>
                    <input
                        id="usuario-confirmacion"
                        name="confirmacion"
                        type="password"
                        autoComplete="new-password"
                        className={inputClass(!!errores.confirmacion)}
                        value={valores.confirmacion}
                        onChange={(e) => cambiar('confirmacion', e.target.value)}
                        disabled={!esNuevo && !valores.password}
                    />
                    {errores.confirmacion && <p className="mt-1 text-sm text-red-600">{errores.confirmacion}</p>}
                </div>
            </div>

            <div className="mt-4 flex justify-end gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={handleGuardar}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Guardando...
                        </>
                    ) : (
                        textoGuardar
                    )}
                </button>
            </div>
        </div>
    );
};

export default UsuarioForm;

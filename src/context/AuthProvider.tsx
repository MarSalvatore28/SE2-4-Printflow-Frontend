import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import { isTokenExpired } from '@utils/jwtUtils';
import type { User, LoginCredentials } from '@models/auth.types';
import * as authService from '@services/Auth/auth.service';
import { AuthContext } from '@context/AuthContext';

// Sesión guardada al abrir la página. Un token vencido cuenta como sin sesión.
const leerSesionGuardada = (): { token: string | null; user: User | null } => {
    const token = authService.getToken();
    const user = authService.getUser();
    if (!token || !user || isTokenExpired(token)) return { token: null, user: null };
    return { token, user };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // La sesión se lee antes del primer render: no hace falta un estado de carga
    const [sesionInicial] = useState(leerSesionGuardada);
    const [user, setUser] = useState<User | null>(sesionInicial.user);
    const [token, setToken] = useState<string | null>(sesionInicial.token);

    const logout = useCallback(() => {
        authService.logout();
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        const storedToken = authService.getToken();
        if (storedToken && authService.getUser() && isTokenExpired(storedToken)) {
            // Token vencido: se borra la sesión guardada
            authService.logout();
            return;
        }
        if (!sesionInicial.token || !sesionInicial.user) return;
        const usuarioGuardado = sesionInicial.user;
        // El admin pudo cambiarle el rol mientras tanto: se trae el rol vigente para el menú.
        // Si el usuario fue desactivado, validateToken cierra la sesión (401).
        authService.validateToken()
            .then(({ usuario }) => {
                const actualizado = { ...usuarioGuardado, ...usuario };
                authService.saveUser(actualizado);
                setUser(actualizado);
            })
            .catch(() => undefined);
    }, [sesionInicial]);

    // Efecto para verificar expiración periódicamente
    useEffect(() => {
        if (!token) return;
        const interval = setInterval(() => {
            // Lee el token guardado: apiFetch lo renueva con X-Nuevo-Token
            if (isTokenExpired(authService.getToken() ?? '')) {
                logout();
            }
        }, 60000); // cada 1 minuto
        return () => clearInterval(interval);
    }, [token, logout]);

    const login = async (credentials: LoginCredentials) => {
        // Si falla, el error llega tal cual a la pantalla de login
        const response = await authService.login(credentials);
        const { token: newToken, usuario: newUser } = response;

        authService.saveToken(newToken);
        authService.saveUser(newUser);

        setToken(newToken);
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            isLoading: false,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

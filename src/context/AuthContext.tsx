import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { isTokenExpired } from '@utils/jwtUtils';
import type { User, LoginCredentials } from '@models/auth.types';
import * as authService from '@services/Auth/auth.service';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const storedToken = authService.getToken();
        const storedUser = authService.getUser();

        if (storedToken && storedUser) {
            if (isTokenExpired(storedToken)) {
                authService.logout();
                setToken(null);
                setUser(null);
            } else {
                setToken(storedToken);
                setUser(storedUser);
                // El admin pudo cambiarle el rol mientras tanto: se trae el rol vigente para el menú.
                // Si el usuario fue desactivado, validateToken cierra la sesión (401).
                authService.validateToken()
                    .then(({ usuario }) => {
                        const actualizado = { ...storedUser, ...usuario };
                        authService.saveUser(actualizado);
                        setUser(actualizado);
                    })
                    .catch(() => undefined);
            }
        }
        setIsLoading(false);
    }, []);

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
    }, [token]);
    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await authService.login(credentials);
            const { token: newToken, usuario: newUser } = response;

            authService.saveToken(newToken);
            authService.saveUser(newUser);

            setToken(newToken);
            setUser(newUser);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

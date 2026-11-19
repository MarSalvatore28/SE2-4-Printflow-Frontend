import { createContext, useContext } from 'react';
import type { User, LoginCredentials } from '@models/auth.types';

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
}

// El proveedor está en AuthProvider.tsx: así este archivo solo exporta el contexto y el hook.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

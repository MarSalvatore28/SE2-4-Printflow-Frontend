import type { AuthResponse, LoginCredentials, User, ValidateTokenResponse } from "@models/auth.types";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const AUTH_URL = `${API_BASE}/api/auth`;

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        let data;
        try {
            data = await response.json();
        } catch {
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
            }
            throw new Error('Error de conexión con el servidor (Respuesta inválida)');
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Error en las credenciales');
        }

        return data;
    } catch (error) {
        console.error("Login error details:", error);
        throw error;
    }
};

export const validateToken = async (): Promise<ValidateTokenResponse> => {
    const token = getToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`${AUTH_URL}/validate-token`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    handleUnauthorized(response);

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Token inválido');
    }

    return data;
};

export const logoutBackend = async (): Promise<void> => {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(`${AUTH_URL}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        handleUnauthorized(response);

    } catch (error) {
        console.error('Error in backend logout:', error);
    }
};

export const saveToken = (token: string) => {
    localStorage.setItem('token', token);
};

export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

export const removeToken = () => {
    localStorage.removeItem('token');
};

export const saveUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

export const removeUser = () => {
    localStorage.removeItem('user');
};

export const logout = () => {
    removeToken();
    removeUser();
};

export const handleUnauthorized = (response: Response) => {
    if (response.status === 401) {
        logout();
        window.location.replace('/login');
        throw new Error('Sesión vencida. Inicia sesión nuevamente.');
    }
};
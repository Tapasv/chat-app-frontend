import { useState, createContext, useEffect } from 'react';
import { authApi } from '../lib/api/auth.api';
import api from '../lib/axios';

export const Authcntxt = createContext();

export const Authprovider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const clearAuth = () => {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    const validateToken = async () => {
        const token = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!savedUser) {
            setIsLoading(false);
            return;
        }

        // Try access token first
        if (token) {
            try {
                const data = await authApi.validate();
                if (data?.valid) {
                    setUser(JSON.parse(savedUser));
                    setAccessToken(token);
                    setIsLoading(false);
                    return;
                }
            } catch {
                // Access token failed — try refresh
            }
        }

        // Access token missing or expired — try refresh token
        if (refreshToken) {
            try {
                const res = await api.post('/api/auth/refresh', { refreshToken });
                const newToken = res?.accessToken || res;

                if (newToken) {
                    localStorage.setItem('accessToken', newToken);
                    setUser(JSON.parse(savedUser));
                    setAccessToken(newToken);
                    setIsLoading(false);
                    return;
                }
            } catch {
                // Refresh also failed — clear everything
            }
        }

        clearAuth();
        setIsLoading(false);
    };

    useEffect(() => {
        validateToken();
    }, []);

    const login = (savedUser, token, refreshToken) => {
        setUser(savedUser);
        setAccessToken(token);
        localStorage.setItem('user', JSON.stringify(savedUser));
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await authApi.logout(refreshToken);
            }
        } catch {
            // Logout locally even if server fails
        } finally {
            clearAuth();
        }
    };

    return (
        <Authcntxt.Provider value={{ login, logout, user, accessToken, isLoading }}>
            {children}
        </Authcntxt.Provider>
    );
};
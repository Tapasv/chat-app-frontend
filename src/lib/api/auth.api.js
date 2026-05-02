import api from '../axios';

export const authApi = {
    login: (credentials) => api.post('/api/auth/login', credentials),
    register: (userData) => api.post('/api/auth/register', userData),
    logout: (refreshToken) => api.post('/api/auth/logout', { refreshToken }),
    validate: () => api.get('/api/auth/validate'),
    refresh: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
    forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
    resetPassword: (token, Password) => api.post(`/api/auth/reset-password/${token}`, { Password })
};
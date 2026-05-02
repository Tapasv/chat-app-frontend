import api from '../axios';

export const profileApi = {
    getProfile: () => api.get('/api/profile/me'),
    updateUsername: (Username) => api.put('/api/profile/update-username', { Username }),
    verifyPassword: (currentPassword) =>
        api.post('/api/profile/verify-password', { currentPassword }),
    updatePassword: (currentPassword, newPassword) =>
        api.put('/api/profile/update-password', { currentPassword, newPassword }),
    requestEmailChange: (newEmail) =>
        api.post('/api/profile/request-email-change', { newEmail }),
    uploadProfilePicture: (formData) =>
        api.post('/api/profile/upload-profile-picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
};
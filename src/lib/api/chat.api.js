import api from '../axios';

export const chatApi = {
    getConversation: (userId) => api.get(`/api/chat/private/${userId}`),
    getConversationPaginated: (userId, page = 1, limit = 50) =>
        api.get(`/api/chat/private/${userId}/paginated?page=${page}&limit=${limit}`),
    editMessage: (messageId, text) => api.put(`/api/chat/edit/${messageId}`, { text }),
    deleteMessage: (messageId, deleteType) =>
        api.delete(`/api/chat/delete/${messageId}`, { data: { deleteType } }),
    clearChat: (userId) => api.delete(`/api/chat/clear/${userId}`),
    blockUser: (userId) => api.post(`/api/chat/block/${userId}`),
    unblockUser: (userId) => api.delete(`/api/chat/unblock/${userId}`),
    getBlockedUsers: () => api.get('/api/chat/blocked-users')
};
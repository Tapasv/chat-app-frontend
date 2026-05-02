import api from '../axios';

export const friendApi = {
    getFriendList: () => api.get('/api/friends/list'),
    searchUsers: (query) => api.get(`/api/friends/search?q=${query}`),
    sendRequest: (receiverId) => api.post(`/api/friends/request/${receiverId}`),
    acceptRequest: (requestId) => api.put(`/api/friends/accept/${requestId}`),
    rejectRequest: (requestId) => api.put(`/api/friends/reject/${requestId}`),
    unfriend: (friendId) => api.delete(`/api/friends/unfriend/${friendId}`),
    getReceivedRequests: () => api.get('/api/friends/requests/received'),
    getSentRequests: () => api.get('/api/friends/requests/sent')
};
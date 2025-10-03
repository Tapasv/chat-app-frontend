import axios from 'axios'

export const apiadmin = axios.create({
    baseURL: `https://chat-app-backend-5208.onrender.com/api/admin`
})

apiadmin.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken")
    if(token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})
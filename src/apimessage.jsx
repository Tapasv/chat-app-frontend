import axios from 'axios';

const apimessage = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL}/api/chat`,
  withCredentials: true,
});

// Automatically attach Authorization header if accessToken exists
apimessage.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apimessage;
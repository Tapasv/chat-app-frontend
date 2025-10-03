import axios from 'axios';

export const apiadmin = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL}/api/admin`,
  withCredentials: true, // optional
});

// Automatically attach Authorization header if accessToken exists
apiadmin.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

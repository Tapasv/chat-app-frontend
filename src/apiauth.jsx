import axios from 'axios';

const apiauth = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL}/api/auth`,
  withCredentials: true, // optional, if you use cookies
});

export default apiauth;

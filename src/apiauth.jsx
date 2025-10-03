import axios from 'axios'


const apiauth = axios.create({
    baseURL: `https://chat-app-backend-5208.onrender.com`
})

export default apiauth
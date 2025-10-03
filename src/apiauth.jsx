import axios from 'axios'


const apiauth = axios.create({
    baseURL: `https://chat-app-backend-5208.onrender.com/api/auth`
})

export default apiauth
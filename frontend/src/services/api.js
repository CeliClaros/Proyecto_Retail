import axios from 'axios'

const BACKEND_URL = "https://fluffy-space-rotary-phone-vp6vv7jr4xp2p6v5-8000.app.github.dev"

const api = axios.create({
  baseURL: BACKEND_URL + '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api

import axios from 'axios'

const TOKEN_KEY = 'rosebot_token'

export const client = axios.create({ baseURL: '/api' })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.replace('/login')
    }
    return Promise.reject(error)
  },
)

export const TOKEN_STORAGE_KEY = TOKEN_KEY

import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'
import { clearStoredAdminAuth, getStoredAdminAuth } from '../utils/storage'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const auth = getStoredAdminAuth()

  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAdminAuth()
    }

    return Promise.reject(error)
  },
)

export default apiClient

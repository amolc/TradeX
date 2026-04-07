import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:8000/api/'
const STORAGE_KEY = 'tradex_auth'

const defaultAuthState = {
  token: '',
  refreshToken: '',
  role: '',
  user: null,
}

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const storedAuth = getStoredAuth()

  if (storedAuth.token) {
    config.headers.Authorization = `Bearer ${storedAuth.token}`
  }

  return config
})

export function getStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return defaultAuthState
  }

  try {
    return {
      ...defaultAuthState,
      ...JSON.parse(raw),
    }
  } catch {
    return defaultAuthState
  }
}

export function setStoredAuth(authState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(authState))
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY)
}

export function loginUser(credentials) {
  return api.post('token/', credentials)
}

export function registerUser(data) {
  return api.post('users/', data)
}

export function getUsers() {
  return api.get('users/')
}

export async function getUserProfileByIdentifier(identifier) {
  const response = await getUsers()
  const normalizedIdentifier = String(identifier).trim().toLowerCase()

  return (
    response.data.find((user) => {
      const email = String(user.email || '').trim().toLowerCase()
      const name = String(user.name || '').trim().toLowerCase()
      return email === normalizedIdentifier || name === normalizedIdentifier
    }) || null
  )
}

export function getProducts() {
  return api.get('products/')
}

export function addProduct(data) {
  return api.post('products/', data)
}

export function updateProduct(productId, data) {
  return api.patch(`products/${productId}/`, data)
}

export function deleteProduct(productId) {
  return api.delete(`products/${productId}/`)
}

export function getOrders() {
  return api.get('orders/')
}

export function createOrder(data) {
  return api.post('orders/', data)
}

export function runSupplierAction(orderId, data) {
  return api.post(`orders/${orderId}/supplier_action/`, data)
}

export function getOrderAnalytics() {
  return api.get('orders/analytics/')
}

export function getConversations() {
  return api.get('conversations/')
}

export function getConversationMessages(conversationId) {
  return api.get(`conversations/${conversationId}/messages/`)
}

export function respondToConversation(conversationId, data) {
  return api.post(`conversations/${conversationId}/messages/`, data)
}

export function getLogistics() {
  return api.get('logistics/')
}

export function updateLogistics(logisticsId, data) {
  return api.patch(`logistics/${logisticsId}/`, data)
}

export function getLogisticsInquiries() {
  return api.get('logistics-inquiry/')
}

export function createLogisticsInquiry(data) {
  return api.post('logistics-inquiry/', data)
}

export default api

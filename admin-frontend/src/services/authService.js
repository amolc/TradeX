import apiClient from './apiClient'

export function loginAdmin(credentials) {
  return apiClient.post('token/', credentials)
}

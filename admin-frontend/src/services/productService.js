import apiClient from './apiClient'

export async function getAdminProducts() {
  const response = await apiClient.get('products/')
  return response.data || []
}

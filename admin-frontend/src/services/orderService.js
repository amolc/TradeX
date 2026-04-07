import apiClient from './apiClient'

export async function getAdminOrders() {
  const response = await apiClient.get('orders/')
  return response.data || []
}

export async function updateAdminOrder(orderId, payload) {
  const response = await apiClient.post(`orders/${orderId}/admin-update/`, payload)
  return response.data
}

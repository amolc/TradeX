import apiClient from './apiClient'

export async function getAdminInquiries() {
  const response = await apiClient.get('orders/')
  return (response.data || []).filter((item) => item.order_type === 'enquiry')
}

export async function respondToInquiry(orderId, payload) {
  const response = await apiClient.post(`orders/${orderId}/supplier_action/`, {
    action: 'respond',
    supplier_response: payload.message,
  })
  return response.data
}

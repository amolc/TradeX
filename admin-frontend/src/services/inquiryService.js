import apiClient from './apiClient'

export async function getAdminInquiries() {
  const response = await apiClient.get('orders/')
  return (response.data || []).filter((item) => item.order_type === 'enquiry')
}

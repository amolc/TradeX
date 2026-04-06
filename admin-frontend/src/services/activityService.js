import apiClient from './apiClient'

export async function getActivityLogs() {
  const [ordersResponse, logisticsResponse] = await Promise.all([
    apiClient.get('orders/'),
    apiClient.get('logistics-inquiry/'),
  ])

  const orders = (ordersResponse.data || []).map((item) => ({
    id: `order-${item.id}`,
    actor: item.user?.name || 'Unknown user',
    action: item.order_type === 'enquiry' ? 'Created inquiry' : 'Placed order',
    target: item.product?.name || 'Unknown product',
    created_at: item.order_date,
  }))

  const logistics = (logisticsResponse.data || []).map((item) => ({
    id: `logistics-${item.id}`,
    actor: item.name || 'Unknown user',
    action: 'Submitted logistics inquiry',
    target: item.service_type || 'Logistics',
    created_at: item.created_at,
  }))

  return [...orders, ...logistics].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  )
}

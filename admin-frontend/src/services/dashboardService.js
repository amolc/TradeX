import apiClient from './apiClient'

export async function getDashboardOverview() {
  const [usersResponse, ordersResponse, analyticsResponse, logisticsResponse] =
    await Promise.all([
      apiClient.get('users/'),
      apiClient.get('orders/'),
      apiClient.get('orders/analytics/'),
      apiClient.get('logistics-inquiry/'),
    ])

  const users = usersResponse.data || []
  const orders = ordersResponse.data || []
  const analytics = analyticsResponse.data || {}
  const logisticsInquiries = logisticsResponse.data || []

  return {
    totalUsers: users.length,
    totalOrders: orders.length,
    revenue: analytics.total_value || 0,
    pendingInquiries: orders.filter((item) => item.order_type === 'enquiry').length,
    logisticsInquiriesCount: logisticsInquiries.length,
    recentActivity: [...orders]
      .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
      .slice(0, 6)
      .map((order) => ({
        id: order.id,
        title: `${order.order_type === 'enquiry' ? 'Inquiry' : 'Order'} #${order.id} by ${order.user?.name || 'Unknown'}`,
        created_at: order.order_date,
      })),
  }
}

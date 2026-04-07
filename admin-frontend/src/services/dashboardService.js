import apiClient from './apiClient'

export async function getDashboardOverview() {
  const [
    usersResponse,
    ordersResponse,
    analyticsResponse,
    logisticsInquiryResponse,
    productsResponse,
    conversationsResponse,
    shipmentsResponse,
  ] = await Promise.all([
    apiClient.get('users/'),
    apiClient.get('orders/'),
    apiClient.get('orders/analytics/'),
    apiClient.get('logistics-inquiry/'),
    apiClient.get('products/'),
    apiClient.get('conversations/'),
    apiClient.get('logistics/'),
  ])

  const users = usersResponse.data || []
  const orders = ordersResponse.data || []
  const analytics = analyticsResponse.data || {}
  const logisticsInquiries = logisticsInquiryResponse.data || []
  const products = productsResponse.data || []
  const conversations = conversationsResponse.data || []
  const shipments = shipmentsResponse.data || []

  return {
    totalUsers: users.length,
    totalOrders: orders.length,
    revenue: analytics.total_value || 0,
    totalProducts: products.length,
    totalConversations: conversations.length,
    pendingOrders: orders.filter((item) => item.status === 'pending').length,
    enquiryCount: orders.filter((item) => item.order_type === 'enquiry').length,
    activeShipments: shipments.filter((item) => item.status !== 'delivered').length,
    logisticsInquiriesCount: logisticsInquiries.length,
    recentActivity: [
      ...orders.map((order) => ({
        id: `order-${order.id}`,
        title: `${order.order_type === 'enquiry' ? 'Inquiry' : 'Order'} #${order.id} for ${order.product?.name || 'Unknown product'}`,
        meta: order.user?.name || 'Unknown buyer',
        created_at: order.order_date,
      })),
      ...shipments.map((shipment) => ({
        id: `shipment-${shipment.id}`,
        title: `Shipment #${shipment.id} is ${shipment.status || 'pending'}`,
        meta: shipment.order ? `Order #${shipment.order}` : 'Shipment workflow',
        created_at: shipment.updated_at || shipment.created_at || null,
      })),
    ]
      .filter((item) => item.created_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6),
  }
}

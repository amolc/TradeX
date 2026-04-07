import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { getDashboardOverview } from '../../services/dashboardService'
import { formatCurrency, formatDateTime } from '../../utils/formatters'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      setError('')

      try {
        const response = await getDashboardOverview()
        setData(response)
      } catch {
        setError('Could not load dashboard overview.')
      }
    }

    loadDashboard()
  }, [])

  return (
    <div className="page-stack">
      <PageHeader
        description="Track marketplace governance across users, inquiries, orders, shipments, and conversations from one operator workspace."
        eyebrow="Overview"
        title="Admin Dashboard"
      />

      {error ? <div className="alert error">{error}</div> : null}

      <div className="stats-grid">
        <StatCard detail="Registered buyer and supplier accounts" title="Total Users" value={data?.totalUsers || 0} />
        <StatCard detail="Active listings currently visible in the marketplace" title="Listings" value={data?.totalProducts || 0} />
        <StatCard detail="Buyer requests waiting in the system" title="Enquiries" value={data?.enquiryCount || 0} />
        <StatCard detail="Orders that still need workflow progress" title="Pending Orders" value={data?.pendingOrders || 0} />
        <StatCard detail="Conversation threads visible to admin" title="Conversations" value={data?.totalConversations || 0} />
        <StatCard detail="Shipment records not yet delivered" title="Active Shipments" value={data?.activeShipments || 0} />
        <StatCard detail="Live value reported by the analytics endpoint" title="Platform Value" value={formatCurrency(data?.revenue || 0)} />
        <StatCard detail="Open logistics service requests" title="Logistics Inquiries" value={data?.logisticsInquiriesCount || 0} />
      </div>

      <section className="panel">
        <h3 className="panel-title">Recent Activity</h3>
        <div className="activity-list">
          {(data?.recentActivity || []).map((item) => (
            <div className="activity-item" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                {item.meta ? <p className="activity-meta">{item.meta}</p> : null}
              </div>
              <span>{formatDateTime(item.created_at)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

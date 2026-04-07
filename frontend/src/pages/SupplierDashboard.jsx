import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import {
  getConversations,
  getLogistics,
  getOrders,
  getProducts,
  runSupplierAction,
} from '../services/api'

function formatDate(value) {
  if (!value) return 'No date available'
  return new Date(value).toLocaleString()
}

function getEnquiryStatus(order) {
  if (order.supplier_response?.toLowerCase().includes('reject')) {
    return { label: 'Rejected', tone: 'danger' }
  }

  if (order.status === 'responded') {
    return { label: 'Quoted', tone: 'success' }
  }

  return { label: 'Awaiting action', tone: 'warning' }
}

function SupplierDashboard() {
  const navigate = useNavigate()
  const { role, user } = useAuth()
  const [summary, setSummary] = useState({
    totalProducts: 0,
    activeEnquiries: 0,
    ordersInProgress: 0,
  })
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionKey, setActionKey] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const [productsResponse, ordersResponse, logisticsResponse, conversationsResponse] =
          await Promise.all([
            getProducts(),
            getOrders(),
            getLogistics(),
            getConversations(),
          ])

        if (!isMounted) return

        const products = Array.isArray(productsResponse.data) ? productsResponse.data : []
        const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : []
        const logistics = Array.isArray(logisticsResponse.data) ? logisticsResponse.data : []
        const conversations = Array.isArray(conversationsResponse.data)
          ? conversationsResponse.data
          : []

        const enquiryOrders = orders.filter((order) => order.order_type === 'enquiry')
        const logisticsByOrderId = logistics.reduce((map, item) => {
          map[item.order] = item
          return map
        }, {})
        const conversationById = conversations.reduce((map, item) => {
          map[item.id] = item
          return map
        }, {})

        const enquiryRows = enquiryOrders
          .map((order) => ({
            ...order,
            conversation: conversationById[order.conversation_id] || null,
          }))
          .sort(
            (a, b) =>
              new Date(b.order_date || b.created_at || 0) -
              new Date(a.order_date || a.created_at || 0),
          )

        setEnquiries(enquiryRows)
        setSummary({
          totalProducts: products.length,
          activeEnquiries: enquiryRows.filter((item) => item.status !== 'responded').length,
          ordersInProgress: orders.filter((order) => {
            if (order.order_type !== 'order') return false
            const shipment = logisticsByOrderId[order.id]
            return shipment ? shipment.status !== 'delivered' : order.status !== 'confirmed'
          }).length,
        })
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Could not load the supplier operations panel.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const welcomeName = useMemo(
    () => user?.name || user?.email || 'Supplier team',
    [user?.email, user?.name],
  )

  async function handleRespond(order, message) {
    setActionKey(`${order.id}-${message}`)
    setError('')

    try {
      await runSupplierAction(order.id, {
        action: 'respond',
        message,
      })

      setEnquiries((current) =>
        current.map((item) =>
          item.id === order.id
            ? {
                ...item,
                status: 'responded',
                supplier_response: message,
              }
            : item,
        ),
      )
      setSummary((current) => ({
        ...current,
        activeEnquiries: Math.max(0, current.activeEnquiries - 1),
      }))
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update the enquiry.')
    } finally {
      setActionKey('')
    }
  }

  if (role !== 'supplier') {
    return (
      <section className="page-card">
        <h2 className="page-title">Supplier Operations</h2>
        <div className="info-box">This workspace is available for supplier accounts only.</div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="page-card">
        <Spinner label="Loading supplier operations..." />
      </section>
    )
  }

  return (
    <section className="supplier-shell">
      {error ? <div className="error-box">{error}</div> : null}

      <div className="supplier-hero">
        <div>
          <p className="eyebrow supplier-hero-eyebrow">Operations Panel</p>
          <h2 className="supplier-hero-title">Supplier control center for live trade activity</h2>
          <p className="supplier-hero-text">
            Track inbound buyer demand, move enquiries into quotations, and keep order fulfillment
            progressing from one workspace.
          </p>
        </div>

        <div className="supplier-hero-panel">
          <span className="supplier-badge">Logged in as supplier</span>
          <h3 className="supplier-hero-panel-title">{welcomeName}</h3>
          <p className="supplier-hero-panel-text">
            Your dashboard is now aligned to buyer actions instead of marketplace browsing.
          </p>
          <div className="supplier-hero-links">
            <Link className="button" to="/supplier/products">
              Manage Products
            </Link>
            <Link className="button secondary" to="/supplier/orders">
              Review Orders
            </Link>
          </div>
        </div>
      </div>

      <div className="supplier-summary-grid">
        <article className="supplier-summary-card">
          <span className="supplier-summary-label">Total Products Listed</span>
          <strong className="supplier-summary-value">{summary.totalProducts}</strong>
        </article>
        <article className="supplier-summary-card">
          <span className="supplier-summary-label">Active Enquiries</span>
          <strong className="supplier-summary-value">{summary.activeEnquiries}</strong>
        </article>
        <article className="supplier-summary-card">
          <span className="supplier-summary-label">Orders In Progress</span>
          <strong className="supplier-summary-value">{summary.ordersInProgress}</strong>
        </article>
      </div>

      <div className="supplier-panel">
        <div className="supplier-section-head">
          <div>
            <p className="eyebrow">Incoming Enquiries</p>
            <h3 className="section-title">Buyer enquiries that need supplier action</h3>
            <p className="page-text">
              Open the detail view to review the buyer message, negotiation thread, and quotation
              workflow.
            </p>
          </div>
          <Link className="button secondary" to="/supplier/enquiries">
            View All Enquiries
          </Link>
        </div>

        {!enquiries.length ? (
          <div className="empty-state">No incoming enquiries are waiting for supplier review.</div>
        ) : (
          <div className="supplier-table-wrap">
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Buyer</th>
                  <th>Quantity</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.slice(0, 6).map((order) => {
                  const status = getEnquiryStatus(order)
                  const conversationId = order.conversation_id

                  return (
                    <tr key={order.id}>
                      <td>
                        <button
                          className="supplier-inline-link"
                          onClick={() => navigate(`/supplier/enquiries/${conversationId}`)}
                          type="button"
                        >
                          {order.product?.name || 'Unknown product'}
                        </button>
                      </td>
                      <td>{order.user?.name || order.user?.email || 'Unknown buyer'}</td>
                      <td>{order.quantity ?? 'N/A'}</td>
                      <td>{formatDate(order.order_date)}</td>
                      <td>
                        <span className={`status-pill ${status.tone}`}>{status.label}</span>
                      </td>
                      <td>
                        <div className="supplier-action-row">
                          <button
                            className="button secondary"
                            disabled={Boolean(actionKey)}
                            onClick={() =>
                              handleRespond(order, 'Supplier accepted the enquiry and is preparing a quotation.')
                            }
                            type="button"
                          >
                            {actionKey === `${order.id}-Supplier accepted the enquiry and is preparing a quotation.`
                              ? 'Updating...'
                              : 'Accept'}
                          </button>
                          <button
                            className="button"
                            onClick={() => navigate(`/supplier/enquiries/${conversationId}`)}
                            type="button"
                          >
                            Send Quotation
                          </button>
                          <button
                            className="button danger-button"
                            disabled={Boolean(actionKey)}
                            onClick={() =>
                              handleRespond(order, 'Rejected by supplier. This enquiry cannot be fulfilled.')
                            }
                            type="button"
                          >
                            {actionKey === `${order.id}-Rejected by supplier. This enquiry cannot be fulfilled.`
                              ? 'Updating...'
                              : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default SupplierDashboard

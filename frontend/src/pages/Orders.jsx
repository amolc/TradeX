import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { getLogistics, getOrders, runSupplierAction } from '../services/api'

function formatDate(value) {
  if (!value) return 'No date available'
  return new Date(value).toLocaleString()
}

function getOrderPill(order, shipment) {
  if (shipment?.status === 'delivered') return { label: 'Delivered', tone: 'success' }
  if (shipment?.status === 'in_transit' || shipment?.status === 'shipped') {
    return { label: 'Shipping', tone: 'warning' }
  }
  if (order.status === 'confirmed') return { label: 'Confirmed', tone: 'neutral' }
  return { label: 'Awaiting confirmation', tone: 'warning' }
}

function Orders() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [orders, setOrders] = useState([])
  const [logistics, setLogistics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submittingId, setSubmittingId] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    setError('')

    try {
      const [ordersResponse, logisticsResponse] = await Promise.all([getOrders(), getLogistics()])
      setOrders(
        (Array.isArray(ordersResponse.data) ? ordersResponse.data : []).filter(
          (item) => item.order_type === 'order',
        ),
      )
      setLogistics(Array.isArray(logisticsResponse.data) ? logisticsResponse.data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load supplier orders.')
    } finally {
      setLoading(false)
    }
  }

  const logisticsByOrderId = useMemo(
    () =>
      logistics.reduce((map, shipment) => {
        map[shipment.order] = shipment
        return map
      }, {}),
    [logistics],
  )

  async function handleConfirm(orderId) {
    setSubmittingId(orderId)
    setError('')

    try {
      await runSupplierAction(orderId, {
        action: 'confirm',
        message: 'Order confirmed by supplier.',
      })
      await loadOrders()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not confirm the order.')
    } finally {
      setSubmittingId(null)
    }
  }

  if (role !== 'supplier') {
    return (
      <section className="page-card">
        <h2 className="page-title">Supplier Orders</h2>
        <div className="info-box">This workspace is available for supplier accounts only.</div>
      </section>
    )
  }

  return (
    <section className="supplier-shell">
      {error ? <div className="error-box">{error}</div> : null}

      <div className="supplier-panel">
        <div className="supplier-section-head">
          <div>
            <p className="eyebrow">Orders</p>
            <h2 className="page-title">Orders requiring supplier fulfillment</h2>
            <p className="page-text">
              Confirm buyer orders here, then continue shipment updates from the shipments page.
            </p>
          </div>
        </div>

        {loading ? <Spinner label="Loading supplier orders..." /> : null}

        {!loading && !orders.length ? (
          <div className="empty-state">No supplier orders found.</div>
        ) : null}

        {!loading && orders.length ? (
          <div className="supplier-table-wrap">
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Buyer</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const shipment = logisticsByOrderId[order.id]
                  const pill = getOrderPill(order, shipment)

                  return (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.user?.name || order.user?.email || 'Unknown buyer'}</td>
                      <td>{order.product?.name || 'Unknown product'}</td>
                      <td>
                        <span className={`status-pill ${pill.tone}`}>{pill.label}</span>
                      </td>
                      <td>{formatDate(order.order_date)}</td>
                      <td>
                        <div className="supplier-action-row">
                          <button
                            className="button"
                            disabled={order.status === 'confirmed' || submittingId === order.id}
                            onClick={() => handleConfirm(order.id)}
                            type="button"
                          >
                            {submittingId === order.id ? 'Confirming...' : 'Confirm Order'}
                          </button>
                          <button
                            className="button secondary"
                            onClick={() => navigate('/supplier/shipments')}
                            type="button"
                          >
                            Update Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default Orders

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import {
  getLogistics,
  getOrders,
  runSupplierAction,
  updateLogistics,
} from '../services/api'

function OrdersPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [orders, setOrders] = useState([])
  const [logistics, setLogistics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submittingKey, setSubmittingKey] = useState('')

  const fetchOrdersAndLogistics = async () => {
    setLoading(true)
    setError('')

    try {
      const [ordersResponse, logisticsResponse] = await Promise.all([
        getOrders(),
        getLogistics(),
      ])

      setOrders(ordersResponse.data)
      setLogistics(logisticsResponse.data)
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Could not load requests right now.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrdersAndLogistics()
  }, [])

  const logisticsByOrderId = useMemo(
    () =>
      logistics.reduce((map, item) => {
        map[item.order] = item
        return map
      }, {}),
    [logistics],
  )

  const handleSupplierAction = async (order, action) => {
    if (action === 'respond' && order.conversation_id) {
      navigate(`/conversations/${order.conversation_id}`)
      return
    }

    setSubmittingKey(`${action}-${order.id}`)

    try {
      await runSupplierAction(order.id, {
        action,
        message:
          action === 'confirm'
            ? 'Order confirmed by supplier.'
            : 'Supplier responded to enquiry.',
      })
      await fetchOrdersAndLogistics()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update the request.')
    } finally {
      setSubmittingKey('')
    }
  }

  const handleTrackingUpdate = async (logisticsItem, field, value) => {
    setSubmittingKey(`tracking-${logisticsItem.id}-${field}`)

    try {
      await updateLogistics(logisticsItem.id, {
        [field]: value,
      })
      await fetchOrdersAndLogistics()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update shipment tracking.')
    } finally {
      setSubmittingKey('')
    }
  }

  const handleOpenConversation = (order) => {
    if (order.conversation_id) {
      navigate(`/conversations/${order.conversation_id}`)
      return
    }

    if (order.order_type === 'order') {
      navigate(`/orders/${order.id}`)
      return
    }

    setError('This request does not have a linked conversation yet.')
  }

  return (
    <section className="page-card">
      <h2 className="page-title">Requests and Orders</h2>
      <p className="page-text">
        Review enquiries, confirmed orders, shipping choices, and live tracking
        progress through the logistics flow.
      </p>

      {loading ? <Spinner label="Loading requests..." /> : null}
      {error ? <div className="error-box">{error}</div> : null}

      {!loading && !error && orders.length === 0 ? (
        <div className="empty-state">No requests found.</div>
      ) : null}

      {!loading && !error && orders.length > 0 ? (
        <ul className="list">
          {orders.map((order) => {
            const logisticsItem = logisticsByOrderId[order.id]
            const hasConversation = Boolean(order.conversation_id)

            return (
              <li className="list-item" key={order.id}>
                <h3>
                  {order.order_type === 'enquiry' ? 'Enquiry' : 'Order'} #{order.id}
                </h3>
                <p>Product: {order.product?.name || 'N/A'}</p>
                <p>Buyer: {order.user?.name || 'N/A'}</p>
                <p>Quantity: {order.quantity}</p>
                <p>Status: {order.status}</p>
                <p>Shipping: {order.shipping_mode || 'Not selected'}</p>
                <p>Total: Rs. {order.total_amount}</p>
                <p>
                  Date:{' '}
                  {order.order_date
                    ? new Date(order.order_date).toLocaleString()
                    : 'N/A'}
                </p>
                <p>Supplier Response: {order.supplier_response || 'Awaiting supplier action'}</p>
                <p>Tracking Stage: {logisticsItem?.tracking_stage || 'supplier'}</p>
                <p>Logistics Status: {logisticsItem?.status || 'pending'}</p>
                <p>Current Location: {logisticsItem?.location || 'Supplier'}</p>

                <div className="button-row section-gap">
                  <button
                    className="button secondary"
                    onClick={() => handleOpenConversation(order)}
                    type="button"
                  >
                    {hasConversation ? 'Open Chat' : order.order_type === 'order' ? 'Open Order' : 'No Chat Yet'}
                  </button>
                </div>

                {role === 'supplier' ? (
                  <div className="form-grid section-gap">
                    <div className="button-row">
                      {order.order_type === 'order' ? (
                        <button
                          className="button"
                          disabled={Boolean(submittingKey)}
                          onClick={() => handleSupplierAction(order, 'confirm')}
                          type="button"
                        >
                          {submittingKey === `confirm-${order.id}`
                            ? 'Confirming...'
                            : 'Confirm Order'}
                        </button>
                      ) : (
                        <button
                          className="button secondary"
                          disabled={Boolean(submittingKey)}
                          onClick={() => handleSupplierAction(order, 'respond')}
                          type="button"
                        >
                          {submittingKey === `respond-${order.id}`
                            ? 'Responding...'
                            : 'Respond to Enquiry'}
                        </button>
                      )}
                    </div>

                    {logisticsItem ? (
                      <div className="tracking-grid">
                        <div>
                          <label className="field-label" htmlFor={`stage-${order.id}`}>
                            Tracking Stage
                          </label>
                          <select
                            className="input"
                            defaultValue={logisticsItem.tracking_stage}
                            id={`stage-${order.id}`}
                            onChange={(event) =>
                              handleTrackingUpdate(
                                logisticsItem,
                                'tracking_stage',
                                event.target.value,
                              )
                            }
                          >
                            <option value="supplier">Supplier</option>
                            <option value="warehouse">Warehouse</option>
                            <option value="transport">Transport</option>
                            <option value="delivery">Delivery</option>
                            <option value="final_destination">Final Destination</option>
                          </select>
                        </div>

                        <div>
                          <label className="field-label" htmlFor={`status-${order.id}`}>
                            Shipment Status
                          </label>
                          <select
                            className="input"
                            defaultValue={logisticsItem.status}
                            id={`status-${order.id}`}
                            onChange={(event) =>
                              handleTrackingUpdate(
                                logisticsItem,
                                'status',
                                event.target.value,
                              )
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="in_transit">In Transit</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>

                        <div>
                          <label className="field-label" htmlFor={`location-${order.id}`}>
                            Location
                          </label>
                          <input
                            className="input"
                            defaultValue={logisticsItem.location}
                            id={`location-${order.id}`}
                            onBlur={(event) =>
                              handleTrackingUpdate(
                                logisticsItem,
                                'location',
                                event.target.value,
                              )
                            }
                            type="text"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}

export default OrdersPage

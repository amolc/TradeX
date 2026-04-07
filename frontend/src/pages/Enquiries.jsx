import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import {
  getConversationMessages,
  getConversations,
  getOrders,
  respondToConversation,
  runSupplierAction,
} from '../services/api'

function formatDate(value) {
  if (!value) return 'No date available'
  return new Date(value).toLocaleString()
}

function getEnquiryTone(order) {
  if (order.supplier_response?.toLowerCase().includes('reject')) return 'danger'
  if (order.status === 'responded') return 'success'
  return 'warning'
}

function getEnquiryLabel(order) {
  if (order.supplier_response?.toLowerCase().includes('reject')) return 'Rejected'
  if (order.status === 'responded') return 'Quoted'
  return 'Awaiting action'
}

function Enquiries() {
  const navigate = useNavigate()
  const { enquiryId } = useParams()
  const { role } = useAuth()
  const [orders, setOrders] = useState([])
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [formData, setFormData] = useState({
    price: '',
    deliveryTime: '',
    moq: '',
    notes: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadBaseData() {
      setLoading(true)
      setError('')

      try {
        const [ordersResponse, conversationsResponse] = await Promise.all([
          getOrders(),
          getConversations(),
        ])

        if (!isMounted) return

        const enquiryOrders = (Array.isArray(ordersResponse.data) ? ordersResponse.data : []).filter(
          (item) => item.order_type === 'enquiry',
        )
        setOrders(enquiryOrders)
        setConversations(Array.isArray(conversationsResponse.data) ? conversationsResponse.data : [])
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Could not load supplier enquiries.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadBaseData()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadMessages() {
      if (!enquiryId) {
        setMessages([])
        return
      }

      try {
        const response = await getConversationMessages(enquiryId)
        if (isMounted) {
          setMessages(Array.isArray(response.data) ? response.data : [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Could not load the enquiry conversation.')
        }
      }
    }

    loadMessages()

    return () => {
      isMounted = false
    }
  }, [enquiryId])

  const conversationById = useMemo(
    () =>
      conversations.reduce((map, conversation) => {
        map[String(conversation.id)] = conversation
        return map
      }, {}),
    [conversations],
  )

  const selectedOrder = useMemo(
    () => orders.find((order) => String(order.conversation_id) === String(enquiryId)) || null,
    [enquiryId, orders],
  )

  const selectedConversation = useMemo(
    () => conversationById[String(enquiryId)] || null,
    [conversationById, enquiryId],
  )

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.order_date || b.created_at || 0) - new Date(a.order_date || a.created_at || 0),
      ),
    [orders],
  )

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSendQuotation(event) {
    event.preventDefault()

    if (!enquiryId) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await respondToConversation(enquiryId, {
        message_type: 'offer',
        message_text: formData.notes.trim() || 'Quotation shared by supplier.',
        offer_unit_price: Number(formData.price),
        offer_quantity: Number(formData.moq),
        offer_delivery_days: Number(formData.deliveryTime),
      })

      if (selectedOrder) {
        await runSupplierAction(selectedOrder.id, {
          action: 'respond',
          message: 'Supplier sent a quotation.',
        })
      }

      const response = await getConversationMessages(enquiryId)
      setMessages(Array.isArray(response.data) ? response.data : [])
      setOrders((current) =>
        current.map((item) =>
          item.id === selectedOrder?.id
            ? { ...item, status: 'responded', supplier_response: 'Supplier sent a quotation.' }
            : item,
        ),
      )
      setFormData({
        price: '',
        deliveryTime: '',
        moq: '',
        notes: '',
      })
      setSuccess('Quotation sent successfully.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send the quotation.')
    } finally {
      setSubmitting(false)
    }
  }

  if (role !== 'supplier') {
    return (
      <section className="page-card">
        <h2 className="page-title">Supplier Enquiries</h2>
        <div className="info-box">This workspace is available for supplier accounts only.</div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="page-card">
        <Spinner label="Loading supplier enquiries..." />
      </section>
    )
  }

  if (!enquiryId) {
    return (
      <section className="supplier-shell">
        {error ? <div className="error-box">{error}</div> : null}

        <div className="supplier-panel">
          <div className="supplier-section-head">
            <div>
              <p className="eyebrow">Enquiries</p>
              <h2 className="page-title">Incoming buyer enquiries</h2>
              <p className="page-text">
                Review active buyer requests and open the detail view to continue negotiation.
              </p>
            </div>
          </div>

          {!sortedOrders.length ? (
            <div className="empty-state">No supplier enquiries found.</div>
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
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.product?.name || 'Unknown product'}</td>
                      <td>{order.user?.name || order.user?.email || 'Unknown buyer'}</td>
                      <td>{order.quantity ?? 'N/A'}</td>
                      <td>{formatDate(order.order_date)}</td>
                      <td>
                        <span className={`status-pill ${getEnquiryTone(order)}`}>
                          {getEnquiryLabel(order)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="button"
                          onClick={() => navigate(`/conversations/${order.conversation_id}`)}
                          type="button"
                        >
                          Open Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="supplier-shell">
      {error ? <div className="error-box">{error}</div> : null}
      {success ? <div className="success-box">{success}</div> : null}

      <div className="supplier-breadcrumbs">
        <Link className="inline-link" to="/supplier/enquiries">
          Supplier Enquiries
        </Link>
        <span>/</span>
        <span>Enquiry Detail</span>
      </div>

      <div className="supplier-detail-grid">
        <article className="supplier-panel">
          <div className="supplier-section-head">
            <div>
              <p className="eyebrow">Enquiry Detail</p>
              <h2 className="page-title">
                {selectedOrder?.product?.name || selectedConversation?.product?.name || 'Conversation'}
              </h2>
              <p className="page-text">
                Buyer: {selectedOrder?.user?.name || selectedConversation?.buyer?.name || 'Unknown buyer'}
              </p>
            </div>
            <span className={`status-pill ${selectedOrder ? getEnquiryTone(selectedOrder) : 'warning'}`}>
              {selectedOrder ? getEnquiryLabel(selectedOrder) : 'Awaiting action'}
            </span>
          </div>

          <div className="supplier-detail-meta">
            <div className="supplier-detail-card">
              <span className="supplier-detail-label">Requested quantity</span>
              <strong>{selectedOrder?.quantity ?? 'N/A'}</strong>
            </div>
            <div className="supplier-detail-card">
              <span className="supplier-detail-label">Created</span>
              <strong>{formatDate(selectedOrder?.order_date || selectedConversation?.created_at)}</strong>
            </div>
          </div>

          <div className="supplier-message-thread">
            {selectedConversation?.inquiry_text ? (
              <div className="supplier-thread-highlight">
                <span className="supplier-thread-kicker">Buyer message</span>
                <p>{selectedConversation.inquiry_text}</p>
              </div>
            ) : null}

            {!messages.length ? (
              <div className="empty-state">No chat messages found for this enquiry.</div>
            ) : (
              messages.map((message) => (
                <article
                  className={`supplier-message-card ${
                    message.sender?.role === 'supplier' ? 'own-message' : ''
                  }`}
                  key={message.id}
                >
                  <div className="supplier-message-head">
                    <strong>{message.sender?.name || 'Unknown sender'}</strong>
                    <span>{formatDate(message.created_at)}</span>
                  </div>
                  {message.message_type === 'offer' ? (
                    <div className="supplier-offer-summary">
                      <p>Price: Rs. {message.offer_unit_price}</p>
                      <p>MOQ: {message.offer_quantity}</p>
                      <p>Delivery: {message.offer_delivery_days} days</p>
                      <p>Notes: {message.content || 'Quotation from supplier'}</p>
                    </div>
                  ) : (
                    <p>{message.content || 'No message content.'}</p>
                  )}
                </article>
              ))
            )}
          </div>
        </article>

        <aside className="supplier-panel">
          <p className="eyebrow">Send Quotation</p>
          <h3 className="section-title">Respond with price and delivery terms</h3>
          <p className="page-text">
            This posts a structured quotation into the same buyer-supplier conversation.
          </p>

          {selectedOrder?.conversation_id ? (
            <div className="button-row section-gap" style={{ marginTop: 0, marginBottom: 16 }}>
              <button
                className="button secondary"
                onClick={() => navigate(`/conversations/${selectedOrder.conversation_id}`)}
                type="button"
              >
                Open Full Chat
              </button>
            </div>
          ) : null}

          <form className="form-grid" onSubmit={handleSendQuotation}>
            <div>
              <label className="field-label" htmlFor="price">
                Price
              </label>
              <input
                className="input"
                id="price"
                min="0"
                name="price"
                onChange={handleChange}
                required
                step="0.01"
                type="number"
                value={formData.price}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="deliveryTime">
                Delivery Time (Days)
              </label>
              <input
                className="input"
                id="deliveryTime"
                min="1"
                name="deliveryTime"
                onChange={handleChange}
                required
                type="number"
                value={formData.deliveryTime}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="moq">
                MOQ
              </label>
              <input
                className="input"
                id="moq"
                min="1"
                name="moq"
                onChange={handleChange}
                required
                type="number"
                value={formData.moq}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="notes">
                Notes
              </label>
              <textarea
                className="input"
                id="notes"
                name="notes"
                onChange={handleChange}
                rows="5"
                value={formData.notes}
              />
            </div>

            <button className="button" disabled={submitting} type="submit">
              {submitting ? 'Sending quotation...' : 'Send Quotation'}
            </button>
          </form>
        </aside>
      </div>
    </section>
  )
}

export default Enquiries

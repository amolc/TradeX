import { useEffect, useMemo, useRef, useState } from 'react'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import {
  createLogisticsInquiry,
  getLogisticsInquiries,
  replyToLogisticsInquiry,
} from '../services/api'

const SERVICES = [
  {
    key: 'sea',
    title: 'Sea Freight',
    shortDescription:
      'Cost-effective shipping for bulk cargo and container loads.',
    details:
      'Sea freight is ideal for bulk cargo, high-volume container movement, and long-haul international trade routes where cost efficiency matters most.',
  },
  {
    key: 'air',
    title: 'Air Freight',
    shortDescription:
      'Fast delivery for urgent shipments and high-value goods.',
    details:
      'Air freight supports time-sensitive deliveries, urgent supply chain needs, and high-value goods that require faster transit and closer scheduling control.',
  },
  {
    key: 'warehouse',
    title: 'Warehousing',
    shortDescription:
      'Secure storage, inventory handling, and distribution support.',
    details:
      'Warehousing helps with safe storage, dispatch planning, inventory handling, and distribution support before or after transportation.',
  },
]

function LogisticsPage() {
  const { role, user } = useAuth()
  const detailsRef = useRef(null)
  const quoteRef = useRef(null)
  const [selectedService, setSelectedService] = useState(SERVICES[0])
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    serviceType: SERVICES[0].key,
    cargoType: '',
    origin: '',
    destination: '',
    quantity: '',
    weight: '',
    notes: '',
  })
  const [inquiries, setInquiries] = useState([])
  const [selectedInquiryId, setSelectedInquiryId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [replying, setReplying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadInquiries = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getLogisticsInquiries()
      const items = Array.isArray(response.data) ? response.data : []
      setInquiries(items)
      setSelectedInquiryId((current) => current ?? items[0]?.id ?? null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load logistics requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInquiries()
  }, [role])

  useEffect(() => {
    if (role === 'buyer') {
      setFormData((current) => ({
        ...current,
        fullName: current.fullName || user?.name || '',
        email: current.email || user?.email || '',
      }))
    }
  }, [role, user])

  const selectedServiceLabel = useMemo(
    () => selectedService?.title || 'Sea Freight',
    [selectedService],
  )

  const selectedInquiry = useMemo(
    () => inquiries.find((item) => String(item.id) === String(selectedInquiryId)) || null,
    [inquiries, selectedInquiryId],
  )

  const handleSelectService = (service) => {
    setSelectedService(service)
    setFormData((current) => ({
      ...current,
      serviceType: service.key,
    }))

    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await createLogisticsInquiry({
        name: formData.fullName,
        email: formData.email,
        service_type: formData.serviceType,
        cargo_type: formData.cargoType,
        origin: formData.origin,
        destination: formData.destination,
        quantity: formData.quantity,
        weight: formData.weight,
        notes: formData.notes,
      })

      setSuccess('Logistics inquiry submitted successfully.')
      setFormData((current) => ({
        ...current,
        cargoType: '',
        origin: '',
        destination: '',
        quantity: '',
        weight: '',
        notes: '',
      }))
      await loadInquiries()
    } catch (err) {
      const data = err.response?.data
      const firstError =
        data?.email?.[0] ||
        data?.name?.[0] ||
        data?.service_type?.[0] ||
        data?.cargo_type?.[0] ||
        data?.origin?.[0] ||
        data?.destination?.[0] ||
        data?.quantity?.[0] ||
        data?.weight?.[0] ||
        data?.detail

      setError(firstError || 'Could not submit logistics inquiry.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async () => {
    if (!selectedInquiry || !replyText.trim()) {
      return
    }

    setReplying(true)
    setError('')
    setSuccess('')

    try {
      await replyToLogisticsInquiry(selectedInquiry.id, {
        message: replyText,
      })
      setReplyText('')
      setSuccess('Reply sent successfully.')
      await loadInquiries()
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message?.[0] || 'Could not send the reply.')
    } finally {
      setReplying(false)
    }
  }

  const scrollToQuote = () => {
    quoteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (role === 'supplier') {
    return (
      <section className="page-card">
        <h2 className="page-title">Logistics Requests</h2>
        <p className="page-text">
          Review buyer logistics requests, open the full request details, and reply from one workspace.
        </p>

        {loading ? <Spinner label="Loading logistics inquiries..." /> : null}
        {error ? <div className="error-box">{error}</div> : null}
        {success ? <div className="success-box">{success}</div> : null}

        {!loading && !error && inquiries.length === 0 ? (
          <div className="empty-state">No logistics requests yet.</div>
        ) : null}

        {!loading && !error && inquiries.length > 0 ? (
          <div className="supplier-detail-grid">
            <div className="supplier-cards">
              {inquiries.map((inquiry) => (
                <button
                  key={inquiry.id}
                  className="supplier-entity-card"
                  onClick={() => setSelectedInquiryId(inquiry.id)}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    background:
                      String(selectedInquiryId) === String(inquiry.id) ? '#eff6ff' : '#f8fafc',
                  }}
                  type="button"
                >
                  <div className="supplier-entity-head">
                    <div>
                      <h4>Inquiry #{inquiry.id}</h4>
                      <p>{inquiry.name}</p>
                    </div>
                    <span className={`status-pill ${inquiry.status === 'replied' ? 'success' : inquiry.status === 'closed' ? 'danger' : 'neutral'}`}>
                      {inquiry.status_display || inquiry.status}
                    </span>
                  </div>
                  <p>{inquiry.service_type_display}</p>
                  <p>
                    Route: {inquiry.origin} to {inquiry.destination}
                  </p>
                  <p>Quantity: {inquiry.quantity}</p>
                </button>
              ))}
            </div>

            <div className="supplier-panel">
              {!selectedInquiry ? (
                <div className="empty-state">Select a logistics request to review it.</div>
              ) : (
                <div className="supplier-message-thread">
                  <div className="supplier-detail-meta">
                    <div className="supplier-detail-card">
                      <span className="supplier-detail-label">Buyer</span>
                      <strong>{selectedInquiry.name}</strong>
                      <div>{selectedInquiry.email}</div>
                    </div>
                    <div className="supplier-detail-card">
                      <span className="supplier-detail-label">Service</span>
                      <strong>{selectedInquiry.service_type_display}</strong>
                    </div>
                    <div className="supplier-detail-card">
                      <span className="supplier-detail-label">Route</span>
                      <strong>{selectedInquiry.origin} to {selectedInquiry.destination}</strong>
                    </div>
                    <div className="supplier-detail-card">
                      <span className="supplier-detail-label">Cargo</span>
                      <strong>{selectedInquiry.cargo_type}</strong>
                      <div>{selectedInquiry.quantity} | {selectedInquiry.weight}</div>
                    </div>
                  </div>

                  {selectedInquiry.messages?.map((message) => (
                    <div
                      className={`supplier-message-card ${message.sender_role === 'supplier' ? 'own-message' : ''}`}
                      key={message.id}
                    >
                      <div className="supplier-message-head">
                        <strong>{message.sender_name}</strong>
                        <span>{new Date(message.created_at).toLocaleString()}</span>
                      </div>
                      <p>{message.message}</p>
                    </div>
                  ))}

                  <div className="form-grid">
                    <div>
                      <label className="field-label" htmlFor="supplierReply">
                        Reply to Buyer
                      </label>
                      <textarea
                        className="input"
                        id="supplierReply"
                        onChange={(event) => setReplyText(event.target.value)}
                        rows="4"
                        value={replyText}
                      />
                    </div>
                    <div className="button-row">
                      <button className="button" disabled={replying} onClick={handleReply} type="button">
                        {replying ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <section className="page-card">
      <h2 className="page-title">Logistics</h2>
      <p className="page-text">
        Explore shipping support, choose a service, review details, request a quote, and continue the logistics discussion from one place.
      </p>

      <div className="card-grid">
        {SERVICES.map((service) => (
          <button
            className="list-item"
            key={service.key}
            onClick={() => handleSelectService(service)}
            style={{
              cursor: 'pointer',
              textAlign: 'left',
              background:
                selectedService.key === service.key ? '#eff6ff' : '#f8fafc',
            }}
            type="button"
          >
            <h3>{service.title}</h3>
            <p>{service.shortDescription}</p>
          </button>
        ))}
      </div>

      <div className="section-gap" ref={detailsRef}>
        <h3 className="section-title">{selectedServiceLabel}</h3>
        <div className="info-box">
          <p style={{ margin: 0 }}>{selectedService.details}</p>
        </div>
        <div className="button-row">
          <button className="button" onClick={scrollToQuote} type="button">
            Request a Quote
          </button>
        </div>
      </div>

      <div className="section-gap" ref={quoteRef}>
        <h3 className="section-title">Request a Quote</h3>

        {success ? <div className="success-box">{success}</div> : null}
        {error ? <div className="error-box">{error}</div> : null}

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="details-grid">
            <div>
              <label className="field-label" htmlFor="fullName">
                Full Name
              </label>
              <input
                className="input"
                id="fullName"
                name="fullName"
                onChange={handleChange}
                required
                type="text"
                value={formData.fullName}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                className="input"
                id="email"
                name="email"
                onChange={handleChange}
                required
                type="email"
                value={formData.email}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="serviceType">
                Service Type
              </label>
              <input
                className="input"
                id="serviceType"
                name="serviceType"
                readOnly
                type="text"
                value={selectedServiceLabel}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="cargoType">
                Cargo Type
              </label>
              <input
                className="input"
                id="cargoType"
                name="cargoType"
                onChange={handleChange}
                required
                type="text"
                value={formData.cargoType}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="origin">
                Origin
              </label>
              <input
                className="input"
                id="origin"
                name="origin"
                onChange={handleChange}
                required
                type="text"
                value={formData.origin}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="destination">
                Destination
              </label>
              <input
                className="input"
                id="destination"
                name="destination"
                onChange={handleChange}
                required
                type="text"
                value={formData.destination}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="quantity">
                Quantity
              </label>
              <input
                className="input"
                id="quantity"
                name="quantity"
                onChange={handleChange}
                required
                type="text"
                value={formData.quantity}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="weight">
                Weight
              </label>
              <input
                className="input"
                id="weight"
                name="weight"
                onChange={handleChange}
                required
                type="text"
                value={formData.weight}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="notes">
              Additional Notes
            </label>
            <textarea
              className="input"
              id="notes"
              name="notes"
              onChange={handleChange}
              rows="4"
              value={formData.notes}
            />
          </div>

          <div className="button-row">
            <button className="button" disabled={submitting} type="submit">
              {submitting ? 'Submitting...' : 'Get a Quote'}
            </button>
          </div>
        </form>
      </div>

      <div className="section-gap">
        <h3 className="section-title">My Logistics Requests</h3>
        <p className="page-text">
          Open any logistics request below to review the latest supplier response and continue the exchange.
        </p>

        {loading ? <Spinner label="Loading your requests..." /> : null}

        {!loading && inquiries.length === 0 ? (
          <div className="empty-state">No logistics requests yet.</div>
        ) : null}

        {!loading && inquiries.length > 0 ? (
          <div className="supplier-detail-grid">
            <div className="supplier-cards">
              {inquiries.map((inquiry) => (
                <button
                  key={inquiry.id}
                  className="supplier-entity-card"
                  onClick={() => setSelectedInquiryId(inquiry.id)}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    background:
                      String(selectedInquiryId) === String(inquiry.id) ? '#eff6ff' : '#f8fafc',
                  }}
                  type="button"
                >
                  <div className="supplier-entity-head">
                    <div>
                      <h4>Request #{inquiry.id}</h4>
                      <p>{inquiry.service_type_display}</p>
                    </div>
                    <span className={`status-pill ${inquiry.status === 'replied' ? 'success' : inquiry.status === 'closed' ? 'danger' : 'neutral'}`}>
                      {inquiry.status_display || inquiry.status}
                    </span>
                  </div>
                  <p>
                    Route: {inquiry.origin} to {inquiry.destination}
                  </p>
                  <p>Cargo: {inquiry.cargo_type}</p>
                </button>
              ))}
            </div>

            <div className="supplier-panel">
              {!selectedInquiry ? (
                <div className="empty-state">Select a logistics request to view the thread.</div>
              ) : (
                <div className="supplier-message-thread">
                  <div className="supplier-thread-highlight">
                    <span className="supplier-thread-kicker">Selected Request</span>
                    <p>
                      {selectedInquiry.service_type_display} from {selectedInquiry.origin} to {selectedInquiry.destination} for {selectedInquiry.quantity}.
                    </p>
                  </div>

                  {selectedInquiry.messages?.map((message) => (
                    <div
                      className={`supplier-message-card ${message.sender_role === 'buyer' ? 'own-message' : ''}`}
                      key={message.id}
                    >
                      <div className="supplier-message-head">
                        <strong>{message.sender_name}</strong>
                        <span>{new Date(message.created_at).toLocaleString()}</span>
                      </div>
                      <p>{message.message}</p>
                    </div>
                  ))}

                  <div className="form-grid">
                    <div>
                      <label className="field-label" htmlFor="buyerReply">
                        Send Follow-up
                      </label>
                      <textarea
                        className="input"
                        id="buyerReply"
                        onChange={(event) => setReplyText(event.target.value)}
                        rows="4"
                        value={replyText}
                      />
                    </div>
                    <div className="button-row">
                      <button className="button" disabled={replying} onClick={handleReply} type="button">
                        {replying ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default LogisticsPage

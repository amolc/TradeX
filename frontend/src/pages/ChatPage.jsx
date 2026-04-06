import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function ChatPage() {
  const { id } = useParams()
  const { user, role } = useAuth()
  const bottomRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [offerMode, setOfferMode] = useState(false)
  const [offerUnitPrice, setOfferUnitPrice] = useState('')
  const [offerQuantity, setOfferQuantity] = useState('')
  const [offerDeliveryDays, setOfferDeliveryDays] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hoveredButton, setHoveredButton] = useState('')

  const isMessageEmpty = !messageText.trim()

  async function fetchMessages() {
    const response = await api.get(`conversations/${id}/messages/`)
    setMessages(Array.isArray(response.data) ? response.data : [])
  }

  useEffect(() => {
    let isMounted = true

    async function loadMessages() {
      try {
        setLoading(true)
        setError('')

        const response = await api.get(`conversations/${id}/messages/`)

        if (isMounted) {
          setMessages(Array.isArray(response.data) ? response.data : [])
        }
      } catch {
        if (isMounted) {
          setError('Failed to load messages.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadMessages()

    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages()
    }, 3000)

    return () => clearInterval(interval)
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  async function handleSend(event) {
    event.preventDefault()

    const trimmedMessage = messageText.trim()
    if (!trimmedMessage) {
      return
    }

    try {
      setSending(true)
      setError('')

      await api.post(`conversations/${id}/messages/`, {
        message_text: trimmedMessage,
      })

      setMessageText('')
      await fetchMessages()
    } catch {
      setError('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  function handleMessageKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSend(event)
    }
  }

  async function handleSendOffer(event) {
    event.preventDefault()

    if (!offerUnitPrice || !offerQuantity || !offerDeliveryDays) {
      return
    }

    try {
      setSending(true)
      setError('')

      await api.post(`conversations/${id}/messages/`, {
        message_type: 'offer',
        message_text: `Offer: Rs.${offerUnitPrice} x ${offerQuantity}`,
        offer_unit_price: Number(offerUnitPrice),
        offer_quantity: Number(offerQuantity),
        offer_delivery_days: Number(offerDeliveryDays),
      })

      setOfferUnitPrice('')
      setOfferQuantity('')
      setOfferDeliveryDays('')
      setOfferMode(false)
      await fetchMessages()
    } catch {
      setError('Failed to send offer.')
    } finally {
      setSending(false)
    }
  }

  async function handleAcceptOffer(messageId) {
    try {
      setSending(true)
      setError('')
      setSuccess('')

      await api.post('messages/accept-offer/', {
        message_id: messageId,
      })

      setSuccess('\ud83c\udf89 Order created successfully!')
      await fetchMessages()
    } catch {
      setError('Failed to accept offer.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <Spinner label="Loading messages..." />
  }

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 140px)',
        border: '1px solid #ddd',
        borderRadius: '12px',
        backgroundColor: '#fff',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #eee',
          backgroundColor: '#fafafa',
        }}
      >
        <h2 style={{ margin: 0 }}>Conversation Chat</h2>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          backgroundColor: '#f7f7f7',
        }}
      >
        {success ? (
          <p style={{ margin: 0, color: '#1f7a4d', fontWeight: 600 }}>{success}</p>
        ) : null}

        {error ? <p style={{ margin: 0, color: '#b00020' }}>{error}</p> : null}

        {!messages.length ? <p style={{ margin: 0 }}>No messages yet.</p> : null}

        {messages.map((message) => {
          const isOwnMessage =
            user &&
            ((message.sender?.id && message.sender.id === user.id) ||
              (message.sender?.email &&
                user.email &&
                message.sender.email.toLowerCase() === user.email.toLowerCase()))

          const canAcceptOffer =
            role === 'buyer' &&
            message.message_type === 'offer' &&
            !message.is_accepted

          return (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: isOwnMessage ? '#DCF8C6' : '#f1f1f1',
                  textAlign: isOwnMessage ? 'right' : 'left',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                }}
              >
                <p
                  style={{
                    margin: '0 0 6px',
                    fontSize: '12px',
                    color: '#666',
                  }}
                >
                  {message.sender?.name || 'Unknown'}
                </p>

                {message.message_type === 'offer' ? (
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '15px',
                        color: '#111',
                        fontWeight: 600,
                      }}
                    >
                      Offer: Rs.{message.offer_unit_price} x {message.offer_quantity}
                    </p>
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: '14px',
                        color: '#333',
                      }}
                    >
                      Delivery: {message.offer_delivery_days} days
                    </p>

                    {message.is_accepted ? (
                      <p
                        style={{
                          margin: '8px 0 0',
                          fontSize: '13px',
                          color: '#1f7a4d',
                          fontWeight: 600,
                        }}
                      >
                        {'\u2705'} Offer Accepted
                      </p>
                    ) : null}

                    {canAcceptOffer ? (
                      <button
                        type="button"
                        onClick={() => handleAcceptOffer(message.id)}
                        disabled={sending}
                        style={{
                          marginTop: '10px',
                          padding: '10px 14px',
                          border: 'none',
                          borderRadius: '10px',
                          backgroundColor: '#1f7a4d',
                          color: '#fff',
                          cursor: sending ? 'not-allowed' : 'pointer',
                          opacity: sending ? 0.7 : 1,
                        }}
                      >
                        Accept Offer
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      color: '#111',
                      wordBreak: 'break-word',
                    }}
                  >
                    {message.content || ''}
                  </p>
                )}

                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: '11px',
                    color: '#888',
                  }}
                >
                  {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {role === 'supplier' ? (
        <div
          style={{
            padding: '12px 16px 0',
            borderTop: '1px solid #eee',
            backgroundColor: '#fff',
          }}
        >
          <button
            type="button"
            onClick={() => setOfferMode((current) => !current)}
            onMouseEnter={() => setHoveredButton('toggle-offer')}
            onMouseLeave={() => setHoveredButton('')}
            style={{
              padding: '10px 14px',
              border: '1px solid #1f7a4d',
              borderRadius: '10px',
              backgroundColor:
                offerMode || hoveredButton === 'toggle-offer' ? '#1f7a4d' : '#fff',
              color: offerMode ? '#fff' : '#1f7a4d',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow:
                hoveredButton === 'toggle-offer'
                  ? '0 6px 16px rgba(31, 122, 77, 0.18)'
                  : 'none',
            }}
          >
            {offerMode ? 'Cancel Offer' : 'Send Offer'}
          </button>
        </div>
      ) : null}

      {role === 'supplier' && offerMode ? (
        <form
          onSubmit={handleSendOffer}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr) auto',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: '#fff',
          }}
        >
          <input
            type="number"
            min="0"
            step="0.01"
            value={offerUnitPrice}
            onChange={(event) => setOfferUnitPrice(event.target.value)}
            placeholder="Unit price"
            style={{
              padding: '12px 14px',
              border: '1px solid #ccc',
              borderRadius: '10px',
              fontSize: '14px',
            }}
          />
          <input
            type="number"
            min="1"
            value={offerQuantity}
            onChange={(event) => setOfferQuantity(event.target.value)}
            placeholder="Quantity"
            style={{
              padding: '12px 14px',
              border: '1px solid #ccc',
              borderRadius: '10px',
              fontSize: '14px',
            }}
          />
          <input
            type="number"
            min="1"
            value={offerDeliveryDays}
            onChange={(event) => setOfferDeliveryDays(event.target.value)}
            placeholder="Delivery days"
            style={{
              padding: '12px 14px',
              border: '1px solid #ccc',
              borderRadius: '10px',
              fontSize: '14px',
            }}
          />
          <button
            type="submit"
            disabled={sending}
            onMouseEnter={() => setHoveredButton('submit-offer')}
            onMouseLeave={() => setHoveredButton('')}
            style={{
              padding: '12px 18px',
              border: 'none',
              borderRadius: '10px',
              backgroundColor:
                hoveredButton === 'submit-offer' && !sending ? '#17633f' : '#1f7a4d',
              color: '#fff',
              cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.7 : 1,
              transition: 'all 0.2s ease',
              boxShadow:
                hoveredButton === 'submit-offer' && !sending
                  ? '0 6px 16px rgba(31, 122, 77, 0.22)'
                  : 'none',
            }}
          >
            {sending ? 'Sending...' : 'Send Offer'}
          </button>
        </form>
      ) : null}

      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          gap: '10px',
          padding: '18px 16px',
          borderTop: offerMode ? '1px solid #eee' : 'none',
          backgroundColor: '#fff',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          onKeyDown={handleMessageKeyDown}
          placeholder="Type your message and press Enter"
          style={{
            flex: 1,
            padding: '14px 16px',
            border: '1px solid #ccc',
            borderRadius: '10px',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
        />
        <button
          type="submit"
          disabled={sending || isMessageEmpty}
          onMouseEnter={() => setHoveredButton('send')}
          onMouseLeave={() => setHoveredButton('')}
          style={{
            padding: '12px 20px',
            border: 'none',
            borderRadius: '10px',
            backgroundColor:
              hoveredButton === 'send' && !sending && !isMessageEmpty
                ? '#17633f'
                : '#1f7a4d',
            color: '#fff',
            cursor: sending || isMessageEmpty ? 'not-allowed' : 'pointer',
            opacity: sending || isMessageEmpty ? 0.6 : 1,
            transition: 'all 0.2s ease',
            boxShadow:
              hoveredButton === 'send' && !sending && !isMessageEmpty
                ? '0 6px 16px rgba(31, 122, 77, 0.22)'
                : 'none',
          }}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default ChatPage

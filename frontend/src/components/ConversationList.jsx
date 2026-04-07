import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from './Spinner'
import api from '../services/api'

function formatDate(value) {
  if (!value) return 'No date available'
  return new Date(value).toLocaleString()
}

function getConversationTone(conversation) {
  if (conversation.status === 'closed') {
    return { label: 'Closed', tone: 'danger' }
  }

  if (conversation.status === 'ordered') {
    return { label: 'Converted to order', tone: 'success' }
  }

  const hasSupplierReply = Array.isArray(conversation.messages)
    && conversation.messages.some((message) => message.sender?.role === 'supplier')

  if (hasSupplierReply) {
    return { label: 'Supplier replied', tone: 'neutral' }
  }

  return { label: 'Awaiting reply', tone: 'warning' }
}

function getLatestMessage(conversation) {
  if (!Array.isArray(conversation.messages) || conversation.messages.length === 0) {
    return conversation.inquiry_text || 'No inquiry text available.'
  }

  const latestMessage = [...conversation.messages].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  )[0]

  if (latestMessage.message_type === 'offer') {
    return `Offer: ${latestMessage.offer_quantity || 'N/A'} units at Rs. ${latestMessage.offer_unit_price || 'N/A'}`
  }

  return latestMessage.content || 'No message content.'
}

function ConversationList() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchConversations() {
      try {
        setLoading(true)
        setError('')

        const response = await api.get('conversations/')

        if (isMounted) {
          setConversations(Array.isArray(response.data) ? response.data : [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Failed to load conversations.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchConversations()

    return () => {
      isMounted = false
    }
  }, [])

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at || 0) -
          new Date(a.updated_at || a.created_at || 0),
      ),
    [conversations],
  )

  if (loading) {
    return (
      <section className="conversation-shell">
        <section className="page-card">
          <Spinner label="Loading conversations..." />
        </section>
      </section>
    )
  }

  if (error) {
    return (
      <section className="conversation-shell">
        <section className="page-card">
          <div className="error-box">{error}</div>
        </section>
      </section>
    )
  }

  return (
    <section className="conversation-shell">
      <section className="page-card conversation-hero">
        <div>
          <p className="eyebrow">Send Enquiry</p>
          <h2 className="conversation-title">Your active conversations</h2>
          <p className="page-text conversation-subtitle">
            Review the conversations you have already started, track supplier responses,
            and open any thread to continue the negotiation.
          </p>
        </div>
        <div className="conversation-summary-grid">
          <article className="conversation-summary-card">
            <span className="conversation-summary-label">Total Conversations</span>
            <strong className="conversation-summary-value">{sortedConversations.length}</strong>
          </article>
          <article className="conversation-summary-card">
            <span className="conversation-summary-label">Awaiting Reply</span>
            <strong className="conversation-summary-value">
              {
                sortedConversations.filter((conversation) => getConversationTone(conversation).tone === 'warning').length
              }
            </strong>
          </article>
        </div>
      </section>

      <section className="page-card">
        <div className="conversation-head">
          <div>
            <p className="eyebrow">Conversations</p>
            <h3 className="section-title">Open a chat thread</h3>
          </div>
        </div>

        {!sortedConversations.length ? (
          <div className="empty-state">No conversations found yet. Start from a product page to send an enquiry.</div>
        ) : (
          <div className="conversation-grid">
            {sortedConversations.map((conversation) => {
              const tone = getConversationTone(conversation)

              return (
                <article
                  className="conversation-card"
                  key={conversation.id}
                  onClick={() => navigate(`/conversations/${conversation.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(`/conversations/${conversation.id}`)
                    }
                  }}
                >
                  <div className="conversation-card-top">
                    <div>
                      <p className="conversation-card-kicker">Conversation #{conversation.id}</p>
                      <h4>{conversation.product?.name || 'Unknown product'}</h4>
                    </div>
                    <span className={`status-pill ${tone.tone}`}>{tone.label}</span>
                  </div>

                  <div className="conversation-card-meta">
                    <p>
                      <strong>Supplier:</strong>{' '}
                      {conversation.supplier?.name || conversation.supplier?.email || 'N/A'}
                    </p>
                    <p>
                      <strong>Started:</strong> {formatDate(conversation.created_at)}
                    </p>
                    <p>
                      <strong>Last Update:</strong> {formatDate(conversation.updated_at)}
                    </p>
                  </div>

                  <div className="conversation-preview">
                    <span className="conversation-preview-label">Latest Message</span>
                    <p>{getLatestMessage(conversation)}</p>
                  </div>

                  <div className="conversation-card-actions">
                    <button
                      className="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        navigate(`/conversations/${conversation.id}`)
                      }}
                      type="button"
                    >
                      Open Chat
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </section>
  )
}

export default ConversationList

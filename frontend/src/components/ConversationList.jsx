import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from './Spinner'
import api from '../services/api'

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
          setError('Failed to load conversations.')
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

  if (loading) {
    return <Spinner label="Loading conversations..." />
  }

  if (error) {
    return <p>{error}</p>
  }

  if (!conversations.length) {
    return <p>No conversations found.</p>
  }

  return (
    <div>
      <h2>Conversations</h2>
      <ul>
        {conversations.map((conversation) => (
          <li
            key={conversation.id}
            onClick={() => navigate(`/conversations/${conversation.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <p>Product: {conversation.product?.name || 'N/A'}</p>
            <p>Supplier: {conversation.supplier?.name || 'N/A'}</p>
            <p>Inquiry: {conversation.inquiry_text || 'N/A'}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ConversationList

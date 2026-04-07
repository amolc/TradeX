import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ChatList from '../../components/chat/ChatList'
import ChatWindow from '../../components/chat/ChatWindow'
import PageHeader from '../../components/ui/PageHeader'
import { usePolling } from '../../hooks/usePolling'
import { getAdminConversations, getConversationMessages } from '../../services/conversationService'

export default function AdminChatPage() {
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const targetConversationId = Number(searchParams.get('conversation'))

  const loadConversations = useCallback(async () => {
    try {
      const response = await getAdminConversations()
      setConversations(response)

      if (!response.length) {
        setSelectedConversation(null)
        return
      }

      const matchedConversation = targetConversationId
        ? response.find((item) => item.id === targetConversationId)
        : null

      if (matchedConversation) {
        setSelectedConversation(matchedConversation)
        return
      }

      setSelectedConversation((current) => {
        if (current) {
          return response.find((item) => item.id === current.id) || response[0]
        }

        return response[0]
      })
    } catch {
      setError('Could not load conversations.')
    }
  }, [targetConversationId])

  const loadMessages = useCallback(async () => {
    if (!selectedConversation) {
      setMessages([])
      return
    }

    try {
      const response = await getConversationMessages(selectedConversation.id)
      setMessages(response)
    } catch {
      setError('Could not load messages.')
    }
  }, [selectedConversation])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  usePolling(loadMessages, 3000, Boolean(selectedConversation))

  return (
    <div className="page-stack">
      <PageHeader
        description="Monitor live buyer-supplier threads from one shared workspace without injecting admin messages into the deal flow."
        eyebrow="Messaging"
        title="Conversation Monitor"
      />

      {error ? <div className="alert error">{error}</div> : null}

      <div className="chat-grid">
        <ChatList
          conversations={conversations}
          onSelect={setSelectedConversation}
          selectedId={selectedConversation?.id}
        />
        <ChatWindow
          conversation={selectedConversation}
          messages={messages}
          readOnly
          sending={false}
        />
      </div>
    </div>
  )
}

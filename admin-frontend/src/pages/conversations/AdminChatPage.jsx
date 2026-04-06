import { useCallback, useEffect, useState } from 'react'
import ChatList from '../../components/chat/ChatList'
import ChatWindow from '../../components/chat/ChatWindow'
import PageHeader from '../../components/ui/PageHeader'
import { usePolling } from '../../hooks/usePolling'
import {
  getAdminConversations,
  getConversationMessages,
  sendConversationMessage,
} from '../../services/conversationService'

export default function AdminChatPage() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const loadConversations = useCallback(async () => {
    try {
      const response = await getAdminConversations()
      setConversations(response)

      if (!selectedConversation && response.length) {
        setSelectedConversation(response[0])
      }
    } catch {
      setError('Could not load conversations.')
    }
  }, [selectedConversation])

  const loadMessages = useCallback(async () => {
    if (!selectedConversation) {
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
        description="View active conversations and respond from one shared WhatsApp-style workspace."
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
          onSend={async (text) => {
            if (!selectedConversation) {
              return
            }

            setSending(true)

            try {
              await sendConversationMessage(selectedConversation.id, {
                message_text: text,
              })
              loadMessages()
            } finally {
              setSending(false)
            }
          }}
          sending={sending}
        />
      </div>
    </div>
  )
}

import ChatComposer from './ChatComposer'
import MessageBubble from './MessageBubble'

export default function ChatWindow({ conversation, messages, onSend, sending, readOnly = false }) {
  return (
    <div className="panel chat-window">
      <div className="chat-window-header">
        {conversation
          ? `Chat for ${conversation.product?.name || `Conversation #${conversation.id}`}`
          : 'Select a conversation'}
      </div>
      <div className="chat-window-body">
        {messages.map((message) => (
          <MessageBubble
            isOwn={message.sender?.role === 'admin'}
            key={message.id}
            message={message}
          />
        ))}
      </div>
      {conversation && !readOnly ? <ChatComposer disabled={sending} onSend={onSend} /> : null}
      {conversation && readOnly ? (
        <div className="chat-monitor-note">Admin monitor is read-only so buyer and supplier identities stay intact.</div>
      ) : null}
    </div>
  )
}

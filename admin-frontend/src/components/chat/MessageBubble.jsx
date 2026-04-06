import { formatDateTime } from '../../utils/formatters'

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`message-row ${isOwn ? 'own' : ''}`}>
      <div className={`message-bubble ${isOwn ? 'own' : ''}`}>
        <p className="message-sender">{message.sender?.name || 'Unknown'}</p>
        <p className="message-content">{message.content || 'Offer / system message'}</p>
        <p className="message-time">{formatDateTime(message.created_at)}</p>
      </div>
    </div>
  )
}

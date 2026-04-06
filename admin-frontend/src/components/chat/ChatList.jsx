export default function ChatList({ conversations, selectedId, onSelect }) {
  return (
    <div className="panel chat-list">
      <div className="chat-list-header">Conversations</div>
      <div className="chat-list-body">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            className={`chat-list-item ${selectedId === conversation.id ? 'active' : ''}`}
            onClick={() => onSelect(conversation)}
            type="button"
          >
            <strong>{conversation.product?.name || `Conversation #${conversation.id}`}</strong>
            <span>
              {conversation.buyer?.name || 'Buyer'} • {conversation.supplier?.name || 'Supplier'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

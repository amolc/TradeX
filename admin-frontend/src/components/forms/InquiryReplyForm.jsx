import { useState } from 'react'

export default function InquiryReplyForm({ onSubmit, loading }) {
  const [message, setMessage] = useState('')

  return (
    <form
      className="reply-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (!message.trim()) {
          return
        }
        onSubmit({ message: message.trim() })
        setMessage('')
      }}
    >
      <textarea
        className="input textarea"
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Write an admin response"
        rows="4"
        value={message}
      />
      <button className="button button-primary" disabled={loading} type="submit">
        {loading ? 'Sending...' : 'Send Response'}
      </button>
    </form>
  )
}

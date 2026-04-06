import { useState } from 'react'

export default function ChatComposer({ onSend, disabled }) {
  const [text, setText] = useState('')

  return (
    <form
      className="chat-composer"
      onSubmit={(event) => {
        event.preventDefault()
        if (!text.trim()) {
          return
        }
        onSend(text.trim())
        setText('')
      }}
    >
      <input
        className="input"
        onChange={(event) => setText(event.target.value)}
        placeholder="Reply as admin"
        value={text}
      />
      <button className="button button-primary" disabled={disabled} type="submit">
        Send
      </button>
    </form>
  )
}

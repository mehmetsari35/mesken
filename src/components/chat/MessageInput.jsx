import { useState } from 'react'
import { Send } from 'lucide-react'
import styles from './MessageInput.module.css'

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Mesaj yazin..."
        className={styles.input}
        autoFocus
      />
      <button
        type="submit"
        className={`${styles.sendBtn} ${text.trim() ? styles.active : ''}`}
        disabled={!text.trim()}
      >
        <Send size={20} />
      </button>
    </form>
  )
}

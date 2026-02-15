import { useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useMessages } from '../../hooks/useMessages'
import { ArrowLeft } from 'lucide-react'
import Avatar from '../ui/Avatar'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import styles from './ChatWindow.module.css'

export default function ChatWindow({ conversation, onBack }) {
  const { user } = useAuth()
  const { messages, loading, sendMessage } = useMessages(conversation?.id)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!conversation) {
    return (
      <div className={styles.empty}>
        <svg viewBox="0 0 120 120" className={styles.emptyIcon} width="64" height="64">
          <circle cx="60" cy="60" r="60" fill="#2AABEE"/>
          <path d="M60 25 L92 72 Q93 75 90 75 L30 75 Q27 75 28 72 Z" fill="white" strokeLinejoin="round" stroke="white" strokeWidth="6"/>
        </svg>
        <h3>Mesken</h3>
        <p>Bir sohbet secin veya yeni bir sohbet baslatin</p>
      </div>
    )
  }

  const otherUser = conversation.otherUser

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn}>
          <ArrowLeft size={22} />
        </button>
        <Avatar
          username={otherUser?.username}
          color={otherUser?.avatar_color}
          size={38}
          online={otherUser?.online}
        />
        <div className={styles.headerInfo}>
          <span className={styles.headerName}>{otherUser?.username || 'Kullanici'}</span>
          <span className={styles.headerStatus}>
            {otherUser?.online ? 'Cevrimici' : 'Cevrimdisi'}
          </span>
        </div>
      </div>

      <div className={styles.messages}>
        {loading ? (
          <div className={styles.loadingMessages}>
            <p>Mesajlar yukleniyor...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.noMessages}>
            <p>Henuz mesaj yok. Merhaba deyin!</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.sender_id === user.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={sendMessage} />
    </div>
  )
}

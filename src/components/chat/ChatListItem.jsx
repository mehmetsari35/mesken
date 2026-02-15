import Avatar from '../ui/Avatar'
import styles from './ChatListItem.module.css'

function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  if (diff < 86400000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  if (diff < 172800000) return 'Dun'

  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

export default function ChatListItem({ conversation, isActive, onClick }) {
  const { otherUser, lastMessage } = conversation

  return (
    <div
      className={`${styles.item} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <Avatar
        username={otherUser?.username}
        color={otherUser?.avatar_color}
        size={48}
        online={otherUser?.online}
      />
      <div className={styles.content}>
        <div className={styles.top}>
          <span className={styles.name}>{otherUser?.username || 'Kullanici'}</span>
          <span className={styles.time}>
            {formatTime(lastMessage?.created_at)}
          </span>
        </div>
        <p className={styles.preview}>
          {lastMessage?.content || 'Henuz mesaj yok'}
        </p>
      </div>
    </div>
  )
}

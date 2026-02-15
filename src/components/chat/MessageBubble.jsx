import styles from './MessageBubble.module.css'

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function MessageBubble({ message, isMine }) {
  return (
    <div className={`${styles.wrapper} ${isMine ? styles.mine : styles.theirs}`}>
      <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
        <p className={styles.content}>{message.content}</p>
        <span className={styles.time}>{formatTime(message.created_at)}</span>
      </div>
    </div>
  )
}

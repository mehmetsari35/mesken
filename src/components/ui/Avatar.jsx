import styles from './Avatar.module.css'

export default function Avatar({ username, color, size = 44, online }) {
  const initial = username ? username.charAt(0).toUpperCase() : '?'

  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: color || '#6C5CE7'
      }}
    >
      {initial}
      {online !== undefined && (
        <span className={`${styles.status} ${online ? styles.online : styles.offline}`} />
      )}
    </div>
  )
}

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './SplashScreen.module.css'

export default function SplashScreen() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        navigate(user ? '/chat' : '/login', { replace: true })
      }
    }, 2500)
    return () => clearTimeout(timer)
  }, [user, loading, navigate])

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoIcon}>
          <svg viewBox="0 0 100 100" className={styles.triangle}>
            <polygon points="50,10 90,75 10,75" fill="currentColor"/>
          </svg>
        </div>
        <h1 className={styles.logo}>Mesken</h1>
        <p className={styles.tagline}>Guvende mesajlas</p>
      </div>
      <p className={styles.credit}>Crafted by Mehmet Sari</p>
    </div>
  )
}

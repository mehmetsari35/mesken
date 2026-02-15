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
          <svg viewBox="0 0 120 120" className={styles.triangle}>
            <circle cx="60" cy="60" r="60" fill="#2AABEE"/>
            <path d="M60 26 L93 80 L52 80 L44 66 Z" fill="white" strokeLinejoin="round" stroke="white" strokeWidth="4"/>
            <path d="M40 62 L27 80 L48 80 Z" fill="white" strokeLinejoin="round" stroke="white" strokeWidth="4"/>
          </svg>
        </div>
        <h1 className={styles.logo}>Mesken</h1>
        <p className={styles.tagline}>Guvende mesajlas</p>
      </div>
      <p className={styles.credit}>Crafted by Mehmet Sari</p>
    </div>
  )
}

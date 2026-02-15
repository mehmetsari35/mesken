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
            <path d="M60 24 L90 84 L76 84 L66 68 L50 38 Z" fill="white" strokeLinejoin="round" stroke="white" strokeWidth="3"/>
            <path d="M40 58 L30 84 L50 84 Z" fill="white" strokeLinejoin="round" stroke="white" strokeWidth="3"/>
          </svg>
        </div>
        <h1 className={styles.logo}>Mesken</h1>
        <p className={styles.tagline}>Guvende mesajlas</p>
      </div>
      <p className={styles.credit}>Crafted by Mehmet Sari</p>
    </div>
  )
}

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
        <h1 className={styles.logo}>MESKEN</h1>
        <p className={styles.tagline}>Guvende mesajlas</p>
      </div>
      <p className={styles.credit}>Crafted by Mehmet Sari</p>
    </div>
  )
}

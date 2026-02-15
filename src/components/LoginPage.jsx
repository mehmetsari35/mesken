import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { KeyRound, User, Lock, ArrowRight, Loader2 } from 'lucide-react'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, register, login } = useAuth()
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) {
    navigate('/chat', { replace: true })
    return null
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Kullanici adi ve sifre girin')
      return
    }
    setLoading(true)
    setError('')
    const result = await login(username, password)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    navigate('/chat', { replace: true })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!inviteCode.trim()) {
      setError('Davet kodunu girin')
      return
    }
    if (!username.trim() || username.trim().length < 2) {
      setError('Kullanici adi en az 2 karakter olmali')
      return
    }
    if (!password || password.length < 4) {
      setError('Sifre en az 4 karakter olmali')
      return
    }
    setLoading(true)
    setError('')
    const result = await register(username, password, inviteCode)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    navigate('/chat', { replace: true })
  }

  const switchTab = (newTab) => {
    setTab(newTab)
    setError('')
    setUsername('')
    setPassword('')
    setInviteCode('')
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <svg viewBox="0 0 100 100" className={styles.logoIcon} width="48" height="48">
            <polygon points="50,10 90,75 10,75" fill="#2AABEE"/>
          </svg>
          <h1 className={styles.logo}>Mesken</h1>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
            onClick={() => switchTab('login')}
          >
            Giris Yap
          </button>
          <button
            className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`}
            onClick={() => switchTab('register')}
          >
            Kayit Ol
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <User size={20} className={styles.inputIcon} />
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                placeholder="Kullanici adi"
                className={styles.input}
                maxLength={20}
                autoFocus
              />
            </div>
            <div className={styles.inputGroup}>
              <Lock size={20} className={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Sifre"
                className={styles.input}
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? <Loader2 size={20} className={styles.spinner} /> : (
                <>
                  Giris Yap
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.inputGroup}>
              <KeyRound size={20} className={styles.inputIcon} />
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setError('') }}
                placeholder="Davet kodu"
                className={styles.input}
                maxLength={10}
                autoFocus
              />
            </div>
            <div className={styles.inputGroup}>
              <User size={20} className={styles.inputIcon} />
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                placeholder="Kullanici adi"
                className={styles.input}
                maxLength={20}
              />
            </div>
            <div className={styles.inputGroup}>
              <Lock size={20} className={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Sifre"
                className={styles.input}
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? <Loader2 size={20} className={styles.spinner} /> : (
                <>
                  Kayit Ol
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

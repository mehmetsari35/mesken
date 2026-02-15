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
          <svg viewBox="0 0 1503 1504" className={styles.logoIcon} width="72" height="72">
            <circle cx="751.5" cy="752" r="751" fill="#2AABEE"/>
            <g transform="translate(1503,0) scale(-1,1)">
              <path d="M538.688 1050.86H392.94C362.314 1050.86 347.186 1050.86 337.962 1044.96C327.999 1038.5 321.911 1027.8 321.173 1015.99C320.619 1005.11 328.184 991.822 343.312 965.255L703.182 330.935C718.495 303.999 726.243 290.531 736.021 285.55C746.537 280.2 759.083 280.2 769.599 285.55C779.377 290.531 787.126 303.999 802.438 330.935L876.42 460.079L876.797 460.738C893.336 489.635 901.723 504.289 905.385 519.669C909.443 536.458 909.443 554.169 905.385 570.958C901.695 586.455 893.393 601.215 876.604 630.549L687.573 964.702L687.084 965.558C670.436 994.693 661.999 1009.46 650.306 1020.6C637.576 1032.78 622.263 1041.63 605.474 1046.62C590.161 1050.86 573.004 1050.86 538.688 1050.86Z" fill="white"/>
              <path d="M906.75 1050.86H1115.59C1146.4 1050.86 1161.9 1050.86 1171.13 1044.78C1181.09 1038.32 1187.36 1027.43 1187.92 1015.63C1188.45 1005.1 1181.05 992.33 1166.55 967.307C1166.05 966.455 1165.55 965.588 1165.04 964.706L1060.43 785.75L1059.24 783.735C1044.54 758.877 1037.12 746.324 1027.59 741.472C1017.08 736.121 1004.71 736.121 994.199 741.472C984.605 746.453 976.857 759.552 961.544 785.934L857.306 964.891L856.949 965.507C841.69 991.847 834.064 1005.01 834.614 1015.81C835.352 1027.62 841.44 1038.5 851.402 1044.96C860.443 1050.86 875.94 1050.86 906.75 1050.86Z" fill="white"/>
            </g>
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

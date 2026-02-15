import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { KeyRound, User, ArrowRight, Loader2 } from 'lucide-react'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, validateInviteCode, createUser } = useAuth()
  const [step, setStep] = useState('code')
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeData, setCodeData] = useState(null)

  if (user) {
    navigate('/chat', { replace: true })
    return null
  }

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    if (code.length < 4) {
      setError('Davet kodunu girin')
      return
    }

    setLoading(true)
    setError('')

    const result = await validateInviteCode(code)

    if (!result.valid) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.existingUser) {
      navigate('/chat', { replace: true })
      return
    }

    setCodeData({ codeId: result.codeId, code: result.code })
    setStep('username')
    setLoading(false)
  }

  const handleUsernameSubmit = async (e) => {
    e.preventDefault()
    if (username.trim().length < 2) {
      setError('Kullanici adi en az 2 karakter olmali')
      return
    }

    setLoading(true)
    setError('')

    const result = await createUser(username.trim(), codeData.codeId, codeData.code)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    navigate('/chat', { replace: true })
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.logo}>MESKEN</h1>
          <p className={styles.subtitle}>
            {step === 'code' ? 'Davet kodunuzu girin' : 'Kullanici adinizi secin'}
          </p>
        </div>

        {step === 'code' ? (
          <form onSubmit={handleCodeSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <KeyRound size={20} className={styles.inputIcon} />
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  setError('')
                }}
                placeholder="Davet kodu"
                className={styles.input}
                maxLength={10}
                autoFocus
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? <Loader2 size={20} className={styles.spinner} /> : (
                <>
                  Devam Et
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUsernameSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <User size={20} className={styles.inputIcon} />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError('')
                }}
                placeholder="Kullanici adi"
                className={styles.input}
                maxLength={20}
                autoFocus
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? <Loader2 size={20} className={styles.spinner} /> : (
                <>
                  Hesap Olustur
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

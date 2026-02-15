import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import styles from './InstallPrompt.module.css'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = localStorage.getItem('mesken_install_dismissed')
      if (!dismissed) setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setShow(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('mesken_install_dismissed', '1')
  }

  if (!show) return null

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <Download size={20} />
        <span>MESKEN'i uygulamaya yukleyin!</span>
      </div>
      <div className={styles.actions}>
        <button onClick={handleInstall} className={styles.installBtn}>Yukle</button>
        <button onClick={handleDismiss} className={styles.dismissBtn}>
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

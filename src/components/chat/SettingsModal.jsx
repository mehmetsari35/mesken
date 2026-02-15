import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { X, Sun, Moon, LogOut, Copy, Check, Ticket } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Avatar from '../ui/Avatar'
import styles from './SettingsModal.module.css'

export default function SettingsModal({ onClose }) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [inviteCode, setInviteCode] = useState(null)
  const [creatingCode, setCreatingCode] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleLogout = () => {
    logout()
    onClose()
  }

  const generateInviteCode = async () => {
    setCreatingCode(true)
    const code = 'MESKEN-' + Math.random().toString(36).substring(2, 8).toUpperCase()

    const { error } = await supabase
      .from('invite_codes')
      .insert({ code, max_uses: 5, use_count: 0 })

    if (!error) {
      setInviteCode(code)
    }
    setCreatingCode(false)
  }

  const copyCode = async () => {
    if (inviteCode) {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Ayarlar</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        {/* Profil */}
        <div className={styles.profile}>
          <Avatar username={user?.username} color={user?.avatar_color} size={56} />
          <span className={styles.profileName}>{user?.username}</span>
        </div>

        {/* Tema */}
        <div className={styles.section}>
          <button onClick={toggle} className={styles.settingItem}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span className={styles.settingLabel}>
              {theme === 'dark' ? 'Acik Tema' : 'Koyu Tema'}
            </span>
            <span className={styles.settingValue}>
              {theme === 'dark' ? 'Koyu' : 'Acik'}
            </span>
          </button>
        </div>

        {/* Davet Kodu Oluştur */}
        <div className={styles.section}>
          {!inviteCode ? (
            <button
              onClick={generateInviteCode}
              className={styles.settingItem}
              disabled={creatingCode}
            >
              <Ticket size={20} />
              <span className={styles.settingLabel}>
                {creatingCode ? 'Olusturuluyor...' : 'Davet Kodu Olustur'}
              </span>
            </button>
          ) : (
            <div className={styles.inviteResult}>
              <div className={styles.inviteHeader}>
                <Ticket size={20} className={styles.inviteIcon} />
                <span>Davet Kodunuz</span>
              </div>
              <div className={styles.codeBox}>
                <span className={styles.codeText}>{inviteCode}</span>
                <button onClick={copyCode} className={styles.copyBtn}>
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className={styles.codeHint}>Bu kod 5 kez kullanilabilir</p>
            </div>
          )}
        </div>

        {/* Çıkış */}
        <div className={styles.section}>
          {!showLogoutConfirm ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={`${styles.settingItem} ${styles.dangerItem}`}
            >
              <LogOut size={20} />
              <span className={styles.settingLabel}>Cikis Yap</span>
            </button>
          ) : (
            <div className={styles.confirmBox}>
              <p className={styles.confirmText}>Cikis yapmak istediginize emin misiniz?</p>
              <div className={styles.confirmActions}>
                <button onClick={() => setShowLogoutConfirm(false)} className={styles.cancelBtn}>
                  Vazgec
                </button>
                <button onClick={handleLogout} className={styles.confirmBtn}>
                  Evet, Cikis Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

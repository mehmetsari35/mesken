import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { X, Search } from 'lucide-react'
import Avatar from '../ui/Avatar'
import styles from './NewChatModal.module.css'

export default function NewChatModal({ onClose, onSelect }) {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .neq('id', user.id)
        .order('username')

      setUsers(data || [])
      setLoading(false)
    }
    fetchUsers()
  }, [user.id])

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Yeni Sohbet</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={22} />
          </button>
        </div>

        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Kullanici ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
        </div>

        <div className={styles.list}>
          {loading ? (
            <p className={styles.emptyText}>Yukleniyor...</p>
          ) : filtered.length === 0 ? (
            <p className={styles.emptyText}>Kullanici bulunamadi</p>
          ) : (
            filtered.map(u => (
              <div
                key={u.id}
                className={styles.userItem}
                onClick={() => onSelect(u.id)}
              >
                <Avatar username={u.username} color={u.avatar_color} size={42} online={u.online} />
                <span className={styles.userName}>{u.username}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

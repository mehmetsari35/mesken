import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { X, Search, UserPlus } from 'lucide-react'
import Avatar from '../ui/Avatar'
import styles from './NewChatModal.module.css'

export default function NewChatModal({ onClose, onSelect }) {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const searchUsers = async (query) => {
    setSearch(query)
    if (query.length < 2) {
      setUsers([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .neq('id', user.id)
      .ilike('username', `%${query}%`)
      .limit(10)

    setUsers(data || [])
    setLoading(false)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Kisi Ara</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Kullanici adi yaz..."
            value={search}
            onChange={(e) => searchUsers(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
        </div>

        <div className={styles.list}>
          {!searched && !loading ? (
            <div className={styles.emptyState}>
              <UserPlus size={48} strokeWidth={1.2} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>Sohbet baslatmak icin</p>
              <p className={styles.emptyDesc}>kullanici adi yazin</p>
            </div>
          ) : loading ? (
            <p className={styles.emptyText}>Araniyor...</p>
          ) : users.length === 0 ? (
            <p className={styles.emptyText}>Kullanici bulunamadi</p>
          ) : (
            users.map(u => (
              <div
                key={u.id}
                className={styles.userItem}
                onClick={() => onSelect(u.id)}
              >
                <Avatar username={u.username} color={u.avatar_color} size={48} online={u.online} />
                <span className={styles.userName}>{u.username}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

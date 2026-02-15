import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Search, Plus, LogOut, Settings } from 'lucide-react'
import Avatar from '../ui/Avatar'
import ChatListItem from './ChatListItem'
import NewChatModal from './NewChatModal'
import styles from './ChatSidebar.module.css'

export default function ChatSidebar({ conversations, loading, activeId, onSelect, onNewChat }) {
  const { user, logout } = useAuth()
  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)

  const filtered = conversations.filter(conv => {
    if (!search) return true
    return conv.otherUser?.username?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <>
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <Avatar username={user?.username} color={user?.avatar_color} size={40} />
          <span className={styles.username}>{user?.username}</span>
        </div>
      </div>

      <div className={styles.searchBar}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Sohbet ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}>
            <p className={styles.loadingText}>Yukleniyor...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>
              {search ? 'Sonuc bulunamadi' : 'Henuz sohbet yok'}
            </p>
            {!search && (
              <button onClick={() => setShowNewChat(true)} className={styles.startBtn}>
                Sohbet Baslat
              </button>
            )}
          </div>
        ) : (
          filtered.map(conv => (
            <ChatListItem
              key={conv.id}
              conversation={conv}
              isActive={activeId === conv.id}
              onClick={() => onSelect(conv)}
            />
          ))
        )}
      </div>

      {/* FAB - Yeni sohbet butonu */}
      <button
        onClick={() => setShowNewChat(true)}
        className={styles.fab}
        title="Yeni sohbet"
      >
        <Plus size={26} />
      </button>

      {/* Alt bar - Çıkış */}
      <div className={styles.bottomBar}>
        <button onClick={logout} className={styles.logoutBtn}>
          <LogOut size={18} />
          <span>Cikis Yap</span>
        </button>
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelect={(userId) => {
            setShowNewChat(false)
            onNewChat(userId)
          }}
        />
      )}
    </>
  )
}

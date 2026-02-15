import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Search, Plus, Settings } from 'lucide-react'
import Avatar from '../ui/Avatar'
import ChatListItem from './ChatListItem'
import NewChatModal from './NewChatModal'
import SettingsModal from './SettingsModal'
import styles from './ChatSidebar.module.css'

export default function ChatSidebar({ conversations, loading, activeId, onSelect, onNewChat }) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

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
        <button onClick={() => setShowSettings(true)} className={styles.settingsBtn} title="Ayarlar">
          <Settings size={20} />
        </button>
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

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelect={(userId) => {
            setShowNewChat(false)
            onNewChat(userId)
          }}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  )
}

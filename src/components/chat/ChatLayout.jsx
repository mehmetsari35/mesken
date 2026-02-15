import { useState } from 'react'
import ChatSidebar from './ChatSidebar'
import ChatWindow from './ChatWindow'
import { useConversations } from '../../hooks/useConversations'
import styles from './ChatLayout.module.css'

export default function ChatLayout() {
  const [activeConversation, setActiveConversation] = useState(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const { conversations, loading, createConversation } = useConversations()

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv)
    setShowSidebar(false)
  }

  const handleBack = () => {
    setShowSidebar(true)
    setActiveConversation(null)
  }

  const handleNewChat = async (userId) => {
    const convId = await createConversation(userId)
    if (convId) {
      const conv = conversations.find(c => c.id === convId)
      if (conv) {
        handleSelectConversation(conv)
      } else {
        setActiveConversation({ id: convId })
        setShowSidebar(false)
      }
    }
  }

  return (
    <div className={styles.layout}>
      <div className={`${styles.sidebar} ${!showSidebar ? styles.hideMobile : ''}`}>
        <ChatSidebar
          conversations={conversations}
          loading={loading}
          activeId={activeConversation?.id}
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
        />
      </div>
      <div className={`${styles.main} ${showSidebar ? styles.hideMobile : ''}`}>
        <ChatWindow
          conversation={activeConversation}
          onBack={handleBack}
        />
      </div>
    </div>
  )
}

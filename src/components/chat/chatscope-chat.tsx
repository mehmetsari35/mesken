'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  ConversationHeader,
  Avatar,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { MessageWithSender } from '@/types/database'

interface ChatscopeChatProps {
  conversationId: string
  otherUser: {
    id: string
    username: string
    display_name?: string | null
    avatar_url?: string | null
  }
  onBack?: () => void
}

export function ChatscopeChat({ conversationId, otherUser, onBack }: ChatscopeChatProps) {
  const supabase = getSupabaseClient()
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, sender:profiles(*)`)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }

      setMessages(data as MessageWithSender[] || [])
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, conversationId])

  // Initial fetch and polling
  useEffect(() => {
    fetchMessages()

    // Start polling every 2 seconds for new messages
    pollingRef.current = setInterval(fetchMessages, 2000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [fetchMessages])

  // Send message
  const handleSend = async (text: string) => {
    if (!text.trim() || !user || isSending) return

    setIsSending(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          type: 'text',
          content: text.trim(),
        } as never)
        .select(`*, sender:profiles(*)`)
        .single()

      if (error) {
        console.error('Send error:', error)
        return
      }

      // Add message immediately
      if (data) {
        setMessages(prev => [...prev, data as MessageWithSender])
      }
    } catch (err) {
      console.error('Send error:', err)
    } finally {
      setIsSending(false)
    }
  }

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  const displayName = otherUser.display_name || otherUser.username

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MainContainer>
        <ChatContainer>
          <ConversationHeader>
            {onBack && (
              <ConversationHeader.Back onClick={onBack} />
            )}
            <Avatar
              name={displayName}
              src={otherUser.avatar_url || undefined}
            />
            <ConversationHeader.Content
              userName={displayName}
              info="Çevrimiçi"
            />
          </ConversationHeader>

          <MessageList
            typingIndicator={isSending ? <TypingIndicator content="Gönderiliyor..." /> : null}
            loading={isLoading}
          >
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id
              const senderName = msg.sender?.display_name || msg.sender?.username || 'Unknown'

              return (
                <Message
                  key={msg.id}
                  model={{
                    message: msg.content || '',
                    sentTime: formatTime(msg.created_at),
                    sender: senderName,
                    direction: isOwn ? 'outgoing' : 'incoming',
                    position: 'single',
                  }}
                >
                  {!isOwn && (
                    <Avatar
                      name={senderName}
                      src={msg.sender?.avatar_url || undefined}
                    />
                  )}
                  <Message.Footer sentTime={formatTime(msg.created_at)} />
                </Message>
              )
            })}
          </MessageList>

          <MessageInput
            placeholder="Mesaj yaz..."
            onSend={handleSend}
            attachButton={false}
            disabled={isSending}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  )
}

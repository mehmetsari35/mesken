'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  ConversationHeader,
  Avatar,
} from '@chatscope/chat-ui-kit-react'
import { Loading } from '@/components/ui/loading'
import { useAuth } from '@/hooks/use-auth'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { MessageWithSender, ConversationWithMembers } from '@/types/database'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const { user, isLoading: authLoading, isInitialized } = useAuth()
  const supabase = getSupabaseClient()

  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [conversation, setConversation] = useState<ConversationWithMembers | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  // Fetch conversation and messages
  useEffect(() => {
    if (!conversationId || !user) return

    const fetchData = async () => {
      setIsLoading(true)

      // Fetch conversation
      const { data: convData } = await supabase
        .from('conversations')
        .select(`*, members:conversation_members(*, profile:profiles(*))`)
        .eq('id', conversationId)
        .single()

      if (convData) {
        setConversation(convData as ConversationWithMembers)
      }

      // Fetch messages
      const { data: msgData } = await supabase
        .from('messages')
        .select(`*, sender:profiles(*)`)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (msgData) {
        setMessages(msgData as MessageWithSender[])
      }

      setIsLoading(false)
    }

    fetchData()

    // Polling for new messages every 2 seconds
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('messages')
        .select(`*, sender:profiles(*)`)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (data) {
        setMessages(data as MessageWithSender[])
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [conversationId, user, supabase])

  // Send message
  const handleSend = async (text: string) => {
    if (!text.trim() || !user || isSending) return

    setIsSending(true)
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

    if (!error && data) {
      setMessages(prev => [...prev, data as MessageWithSender])
    }
    setIsSending(false)
  }

  // Format time
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  // Loading states
  if (authLoading || !isInitialized) {
    return <Loading fullScreen text="Yükleniyor..." />
  }

  if (!user) {
    router.push('/login')
    return <Loading fullScreen text="Yönlendiriliyor..." />
  }

  if (isLoading || !conversation) {
    return <Loading fullScreen text="Sohbet yükleniyor..." />
  }

  // Get other user info
  const otherMember = conversation.members?.find(m => m.user_id !== user.id)
  const otherUser = otherMember?.profile
  const displayName = conversation.type === 'group'
    ? (conversation.name || 'Grup')
    : (otherUser?.display_name || otherUser?.username || 'Kullanıcı')

  return (
    <div style={{ height: '100dvh', background: '#18181b' }}>
      <MainContainer>
        <ChatContainer>
          <ConversationHeader>
            <ConversationHeader.Back onClick={() => router.push('/app')} />
            <Avatar name={displayName} src={otherUser?.avatar_url || undefined} />
            <ConversationHeader.Content userName={displayName} info="Çevrimiçi" />
          </ConversationHeader>

          <MessageList loading={isLoading}>
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user.id
              const senderName = msg.sender?.display_name || msg.sender?.username || ''

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

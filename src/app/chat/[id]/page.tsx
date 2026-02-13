'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChatHeader } from '@/components/chat/chat-header'
import { MessageItem } from '@/components/chat/message-item'
import { MessageInput } from '@/components/chat/message-input'
import { Loading } from '@/components/ui/loading'
import { useAuth } from '@/hooks/use-auth'
import { useMessages } from '@/hooks/use-messages'
import { useChatStore } from '@/stores/chat-store'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { ConversationWithMembers } from '@/types/database'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const { user, isLoading: authLoading, isInitialized } = useAuth()
  const {
    messages,
    isLoading: messagesLoading,
    sendTextMessage,
    sendVoiceMessage,
    getVoiceUrl,
  } = useMessages(conversationId)

  const { currentConversation, setCurrentConversation } = useChatStore()
  const [isLoadingConversation, setIsLoadingConversation] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch conversation details
  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId) return

      setIsLoadingConversation(true)
      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          *,
          members:conversation_members(
            *,
            profile:profiles(*)
          )
        `
        )
        .eq('id', conversationId)
        .single()

      if (error || !data) {
        router.push('/app')
        return
      }

      setCurrentConversation(data as ConversationWithMembers)
      setIsLoadingConversation(false)
    }

    fetchConversation()

    return () => {
      setCurrentConversation(null)
    }
  }, [conversationId, setCurrentConversation, router])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendText = async (content: string) => {
    await sendTextMessage(content)
  }

  const handleSendVoice = async (blob: Blob, duration: number) => {
    await sendVoiceMessage(blob, duration)
  }

  const handleBack = () => {
    router.push('/app')
  }

  // Show loading while auth is initializing
  if (authLoading || !isInitialized) {
    return <Loading fullScreen text="Yükleniyor..." />
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login')
    return <Loading fullScreen text="Yönlendiriliyor..." />
  }

  if (isLoadingConversation || !currentConversation) {
    return <Loading fullScreen text="Sohbet yükleniyor..." />
  }

  const isGroup = currentConversation.type === 'group'

  return (
    <div className="h-screen flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="flex-shrink-0 safe-area-top">
        <ChatHeader
          conversation={currentConversation}
          currentUserId={user.id}
          onBack={handleBack}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loading text="Mesajlar yükleniyor..." />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p className="text-sm">Henüz mesaj yok</p>
            <p className="text-xs mt-1">İlk mesajı gönder!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user.id
              const showSender =
                isGroup &&
                !isOwn &&
                (index === 0 ||
                  messages[index - 1].sender_id !== message.sender_id)

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showSender={showSender}
                  onGetVoiceUrl={getVoiceUrl}
                />
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 safe-area-bottom">
        <MessageInput
          onSendText={handleSendText}
          onSendVoice={handleSendVoice}
        />
      </div>
    </div>
  )
}

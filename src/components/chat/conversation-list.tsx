'use client'

import { format, isToday, isYesterday } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Users, Mic } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { ConversationWithMembers, Profile } from '@/types/database'

interface ConversationListProps {
  conversations: ConversationWithMembers[]
  currentUserId: string
  selectedId?: string
  onSelect: (conversation: ConversationWithMembers) => void
}

export function ConversationList({
  conversations,
  currentUserId,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const getConversationTitle = (conv: ConversationWithMembers): string => {
    if (conv.type === 'group') {
      return conv.title || 'Grup'
    }

    // DM: Get the other user's name
    const otherMember = conv.members?.find((m) => m.user_id !== currentUserId)
    if (otherMember?.profile) {
      return otherMember.profile.display_name || otherMember.profile.username
    }

    return 'Sohbet'
  }

  const getConversationAvatar = (
    conv: ConversationWithMembers
  ): { src?: string; name: string } => {
    if (conv.type === 'group') {
      return { src: conv.avatar_url || undefined, name: conv.title || 'Grup' }
    }

    const otherMember = conv.members?.find((m) => m.user_id !== currentUserId)
    if (otherMember?.profile) {
      return {
        src: otherMember.profile.avatar_url || undefined,
        name:
          otherMember.profile.display_name || otherMember.profile.username,
      }
    }

    return { name: 'Sohbet' }
  }

  const formatMessageTime = (date: string): string => {
    const messageDate = new Date(date)

    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm')
    }

    if (isYesterday(messageDate)) {
      return 'Dün'
    }

    return format(messageDate, 'dd.MM.yyyy')
  }

  const getLastMessagePreview = (conv: ConversationWithMembers): string => {
    if (!conv.last_message) {
      return 'Henüz mesaj yok'
    }

    const { type, content, sender_id } = conv.last_message
    const isOwn = sender_id === currentUserId
    const prefix = isOwn ? 'Sen: ' : ''

    if (type === 'voice') {
      return `${prefix}🎤 Sesli mesaj`
    }

    if (type === 'system') {
      return content || ''
    }

    return `${prefix}${content || ''}`
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <Users className="h-12 w-12 mb-4" />
        <p className="text-sm">Henüz sohbet yok</p>
        <p className="text-xs mt-1">Yeni bir sohbet başlatın</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-zinc-800/50">
      {conversations.map((conv) => {
        const avatar = getConversationAvatar(conv)
        const title = getConversationTitle(conv)
        const lastMessagePreview = getLastMessagePreview(conv)
        const lastMessageTime = conv.last_message
          ? formatMessageTime(conv.last_message.created_at)
          : ''

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`
              w-full flex items-center gap-3 p-4 text-left
              transition-colors hover:bg-zinc-800/50
              ${selectedId === conv.id ? 'bg-zinc-800' : ''}
            `}
          >
            <div className="relative">
              <Avatar src={avatar.src} name={avatar.name} size="lg" />
              {conv.type === 'group' && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-zinc-700 flex items-center justify-center">
                  <Users className="h-3 w-3 text-zinc-300" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-zinc-100 truncate">{title}</h3>
                {lastMessageTime && (
                  <span className="text-xs text-zinc-500 flex-shrink-0">
                    {lastMessageTime}
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-500 truncate mt-0.5">
                {lastMessagePreview}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

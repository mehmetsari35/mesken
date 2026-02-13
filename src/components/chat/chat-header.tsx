'use client'

import { ArrowLeft, MoreVertical, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { ConversationWithMembers } from '@/types/database'

interface ChatHeaderProps {
  conversation: ConversationWithMembers
  currentUserId: string
  onBack: () => void
  onMenuClick?: () => void
}

export function ChatHeader({
  conversation,
  currentUserId,
  onBack,
  onMenuClick,
}: ChatHeaderProps) {
  const getTitle = (): string => {
    if (conversation.type === 'group') {
      return conversation.title || 'Grup'
    }

    const otherMember = conversation.members?.find(
      (m) => m.user_id !== currentUserId
    )
    if (otherMember?.profile) {
      return (
        otherMember.profile.display_name || otherMember.profile.username
      )
    }

    return 'Sohbet'
  }

  const getSubtitle = (): string => {
    if (conversation.type === 'group') {
      const memberCount = conversation.members?.length || 0
      return `${memberCount} üye`
    }

    return 'çevrimiçi' // TODO: Implement online status
  }

  const getAvatar = (): { src?: string; name: string } => {
    if (conversation.type === 'group') {
      return {
        src: conversation.avatar_url || undefined,
        name: conversation.title || 'Grup',
      }
    }

    const otherMember = conversation.members?.find(
      (m) => m.user_id !== currentUserId
    )
    if (otherMember?.profile) {
      return {
        src: otherMember.profile.avatar_url || undefined,
        name:
          otherMember.profile.display_name || otherMember.profile.username,
      }
    }

    return { name: 'Sohbet' }
  }

  const avatar = getAvatar()

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
      <button
        onClick={onBack}
        className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors md:hidden"
      >
        <ArrowLeft className="h-5 w-5 text-zinc-300" />
      </button>

      <div className="relative">
        <Avatar src={avatar.src} name={avatar.name} size="md" />
        {conversation.type === 'group' && (
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-zinc-700 flex items-center justify-center">
            <Users className="h-2.5 w-2.5 text-zinc-300" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h2 className="font-medium text-zinc-100 truncate">{getTitle()}</h2>
        <p className="text-xs text-zinc-500">{getSubtitle()}</p>
      </div>

      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
        >
          <MoreVertical className="h-5 w-5 text-zinc-300" />
        </button>
      )}
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { ConversationList } from '@/components/chat/conversation-list'
import { Loading } from '@/components/ui/loading'
import { useAuth } from '@/hooks/use-auth'
import { useConversations } from '@/hooks/use-conversations'

export default function ChatsPage() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading, isInitialized } = useAuth()
  const { conversations, isLoading: conversationsLoading } = useConversations()

  // Show loading while auth is initializing
  if (authLoading || !isInitialized) {
    return <Loading fullScreen text="Yükleniyor..." />
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login')
    return <Loading fullScreen text="Yönlendiriliyor..." />
  }

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 px-4 py-4 border-b border-zinc-800 safe-area-top">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-zinc-100">Sohbetler</h1>
              <p className="text-sm text-zinc-500">
                Merhaba, {profile?.display_name || profile?.username}
              </p>
            </div>
            <button
              onClick={() => router.push('/new')}
              className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-5 w-5 text-white" />
            </button>
          </div>
        </header>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loading text="Sohbetler yükleniyor..." />
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              currentUserId={user.id}
              onSelect={(conv) => router.push(`/chat/${conv.id}`)}
            />
          )}
        </div>
      </div>
    </AppShell>
  )
}

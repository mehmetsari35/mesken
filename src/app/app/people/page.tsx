'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UserPlus } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { useAuth } from '@/hooks/use-auth'
import { useConversations } from '@/hooks/use-conversations'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

export default function PeoplePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { createDM } = useConversations()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreatingDM, setIsCreatingDM] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Search users
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    // Don't search until we have the user ID
    if (!user?.id) {
      return
    }

    const searchUsers = async () => {
      setIsSearching(true)
      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('id', user.id)
        .limit(20)

      if (!error && data) {
        setSearchResults(data)
      } else if (error) {
        console.error('Search error:', error)
      }
      setIsSearching(false)
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, user?.id])

  const handleStartChat = async (profile: Profile) => {
    setIsCreatingDM(profile.id)
    setError(null)
    try {
      console.log('Creating DM with:', profile.id)
      const result = await createDM(profile.id)
      console.log('createDM full result:', result)

      const { data: conversationId, error: createError } = result

      if (createError) {
        console.error('createDM error:', createError)
        setError(createError.message || 'Sohbet oluşturulamadı')
        return
      }

      if (conversationId) {
        console.log('Navigating to:', `/chat/${conversationId}`)
        router.push(`/chat/${conversationId}`)
      } else {
        setError('Sohbet ID alınamadı')
      }
    } catch (err) {
      console.error('handleStartChat error:', err)
      setError('Bir hata oluştu: ' + (err as Error).message)
    } finally {
      setIsCreatingDM(null)
    }
  }

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 px-4 py-4 border-b border-zinc-800 safe-area-top">
          <h1 className="text-xl font-semibold text-zinc-100 mb-4">Kişiler</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kullanıcı ara..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center h-32">
              <Loading size="sm" text="Aranıyor..." />
            </div>
          ) : searchQuery.length < 2 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <Search className="h-12 w-12 mb-4" />
              <p className="text-sm">Kullanıcı aramak için yazın</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <UserPlus className="h-12 w-12 mb-4" />
              <p className="text-sm">Kullanıcı bulunamadı</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {searchResults.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => {
                    if (isCreatingDM !== profile.id) {
                      handleStartChat(profile)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-800/50 transition-colors cursor-pointer active:bg-zinc-800"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="pointer-events-none">
                    <Avatar
                      src={profile.avatar_url}
                      name={profile.display_name || profile.username}
                      size="lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0 pointer-events-none">
                    <h3 className="font-medium text-zinc-100 truncate">
                      {profile.display_name || profile.username}
                    </h3>
                    <p className="text-sm text-zinc-500 truncate">
                      @{profile.username}
                    </p>
                  </div>
                  {isCreatingDM === profile.id && (
                    <div className="pointer-events-none">
                      <Loading size="sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

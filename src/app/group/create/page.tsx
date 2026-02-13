'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Loading } from '@/components/ui/loading'
import { useAuth } from '@/hooks/use-auth'
import { useConversations } from '@/hooks/use-conversations'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

export default function CreateGroupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { createGroup } = useConversations()

  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  // Search users
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const searchUsers = async () => {
      if (!user?.id) return
      setIsSearching(true)
      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('id', user.id)
        .limit(20)

      if (!error && data) {
        const profiles = data as Profile[]
        // Filter out already selected members
        const filtered = profiles.filter(
          (p) => !selectedMembers.some((m) => m.id === p.id)
        )
        setSearchResults(filtered)
      }
      setIsSearching(false)
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, user?.id, selectedMembers])

  const handleSelectMember = (profile: Profile) => {
    setSelectedMembers((prev) => [...prev, profile])
    setSearchQuery('')
    setSearchResults([])
  }

  const handleRemoveMember = (profileId: string) => {
    setSelectedMembers((prev) => prev.filter((p) => p.id !== profileId))
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Grup adı gerekli')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      const memberIds = selectedMembers.map((m) => m.id)
      const { data: groupId, error: createError } = await createGroup(
        groupName.trim(),
        groupDescription.trim() || undefined,
        memberIds
      )

      if (createError) {
        setError('Grup oluşturulamadı')
        return
      }

      if (groupId) {
        router.push(`/chat/${groupId}`)
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800 safe-area-top">
        <button
          onClick={() => router.back()}
          className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-300" />
        </button>
        <h1 className="text-xl font-semibold text-zinc-100">Yeni Grup</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-safe-extra">
        {/* Group Info */}
        <div className="space-y-4">
          <Input
            label="Grup Adı"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Grup adı girin"
            maxLength={50}
          />

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Grup açıklaması..."
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Selected Members */}
        {selectedMembers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">
              Seçilen Üyeler ({selectedMembers.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800"
                >
                  <Avatar
                    src={member.avatar_url}
                    name={member.display_name || member.username}
                    size="sm"
                  />
                  <span className="text-sm text-zinc-200">
                    {member.display_name || member.username}
                  </span>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="h-5 w-5 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 transition-colors"
                  >
                    <X className="h-3 w-3 text-zinc-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Members */}
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-3">
            Üye Ekle (Opsiyonel)
          </h3>
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

          {/* Search Results */}
          {isSearching ? (
            <div className="mt-4 flex justify-center">
              <Loading size="sm" text="Aranıyor..." />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="mt-4 divide-y divide-zinc-800 rounded-xl bg-zinc-800/50 overflow-hidden">
              {searchResults.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectMember(profile)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-800 transition-colors"
                >
                  <Avatar
                    src={profile.avatar_url}
                    name={profile.display_name || profile.username}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-zinc-100 truncate">
                      {profile.display_name || profile.username}
                    </h4>
                    <p className="text-sm text-zinc-500 truncate">
                      @{profile.username}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-emerald-600/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-emerald-500" />
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Create Button */}
        <Button
          onClick={handleCreateGroup}
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isCreating}
          disabled={!groupName.trim()}
        >
          Grup Oluştur
        </Button>
      </div>
    </div>
  )
}

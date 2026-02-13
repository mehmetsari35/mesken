'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, UserPlus, Link as LinkIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useConversations } from '@/hooks/use-conversations'

export default function NewConversationPage() {
  const router = useRouter()
  const { joinGroup } = useConversations()
  const [groupInviteCode, setGroupInviteCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')

  const handleJoinGroup = async () => {
    if (!groupInviteCode.trim()) {
      setError('Grup davet kodu gerekli')
      return
    }

    setIsJoining(true)
    setError('')

    try {
      const { data, error: joinError } = await joinGroup(groupInviteCode.trim())

      if (joinError || !data) {
        setError('Grup bulunamadı veya davet kodu geçersiz')
        return
      }

      const result = data as unknown as { success: boolean; group_id?: string; error?: string }

      if (!result.success) {
        setError(result.error || 'Gruba katılınamadı')
        return
      }

      if (result.group_id) {
        router.push(`/chat/${result.group_id}`)
      }
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800 safe-area-top">
        <button
          onClick={() => router.back()}
          className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-300" />
        </button>
        <h1 className="text-xl font-semibold text-zinc-100">Yeni Sohbet</h1>
      </header>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* New DM */}
        <button
          onClick={() => router.push('/app/people')}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
        >
          <div className="h-12 w-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-zinc-100">Yeni Mesaj</h3>
            <p className="text-sm text-zinc-500">Bir kullanıcıya mesaj gönder</p>
          </div>
        </button>

        {/* New Group */}
        <button
          onClick={() => router.push('/group/create')}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
        >
          <div className="h-12 w-12 rounded-full bg-blue-600/20 flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-zinc-100">Yeni Grup</h3>
            <p className="text-sm text-zinc-500">Bir grup sohbeti oluştur</p>
          </div>
        </button>

        {/* Join Group with Code */}
        <div className="p-4 rounded-xl bg-zinc-800/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-purple-600/20 flex items-center justify-center">
              <LinkIcon className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-100">Gruba Katıl</h3>
              <p className="text-sm text-zinc-500">Davet kodu ile gruba katıl</p>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              value={groupInviteCode}
              onChange={(e) => setGroupInviteCode(e.target.value)}
              placeholder="Grup davet kodu"
              disabled={isJoining}
              error={error}
            />
            <Button
              onClick={handleJoinGroup}
              variant="secondary"
              className="w-full"
              isLoading={isJoining}
              disabled={!groupInviteCode.trim()}
            >
              Gruba Katıl
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

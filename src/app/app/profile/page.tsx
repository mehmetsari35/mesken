'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { LogOut, Copy, Check, Share2, RefreshCw } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { useAuth } from '@/hooks/use-auth'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const { user, profile, logout, updateProfile, isLoading } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)
  const [copied, setCopied] = useState(false)

  if (isLoading || !user || !profile) {
    return <Loading fullScreen text="Yükleniyor..." />
  }

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return

    setIsSaving(true)
    await updateProfile({ display_name: displayName.trim() })
    setIsSaving(false)
  }

  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true)
    try {
      const supabase = getSupabaseClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('generate_invite_code', {
        max_uses_param: 5,
        expires_in_days: 7,
      })

      if (!error && data) {
        setInviteCode(data as string)
      }
    } finally {
      setIsGeneratingInvite(false)
    }
  }

  const handleCopyInvite = async () => {
    if (!inviteCode) return

    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = inviteCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareInvite = async () => {
    if (!inviteCode) return

    const shareData = {
      title: 'MESKEN Davet',
      text: `MESKEN'e katıl! Davet kodun: ${inviteCode}`,
      url: `${window.location.origin}/invite?code=${inviteCode}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopyInvite()
    }
  }

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 px-4 py-4 border-b border-zinc-800 safe-area-top">
          <h1 className="text-xl font-semibold text-zinc-100">Profil</h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Avatar & Username */}
          <div className="flex flex-col items-center mb-8">
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name || profile.username}
              size="xl"
            />
            <h2 className="mt-4 text-xl font-semibold text-zinc-100">
              {profile.display_name || profile.username}
            </h2>
            <p className="text-sm text-zinc-500">@{profile.username}</p>
          </div>

          {/* Edit Display Name */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">
              Görünen Ad
            </h3>
            <div className="flex gap-3">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Görünen adınız"
                className="flex-1"
              />
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || !displayName.trim() || displayName === profile.display_name}
                isLoading={isSaving}
              >
                Kaydet
              </Button>
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              Kullanıcı adı değiştirilemez: @{profile.username}
            </p>
          </div>

          {/* Invite Code Section */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">
              Davet Kodu Oluştur
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              Arkadaşlarını MESKEN&apos;e davet et. Her kod 5 kez kullanılabilir ve 7 gün geçerlidir.
            </p>

            {inviteCode ? (
              <div className="p-4 rounded-xl bg-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-mono font-semibold text-emerald-500">
                    {inviteCode}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyInvite}
                      className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 transition-colors"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Copy className="h-5 w-5 text-zinc-300" />
                      )}
                    </button>
                    <button
                      onClick={handleShareInvite}
                      className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 transition-colors"
                    >
                      <Share2 className="h-5 w-5 text-zinc-300" />
                    </button>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateInvite}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  isLoading={isGeneratingInvite}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yeni Kod Oluştur
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleGenerateInvite}
                variant="secondary"
                className="w-full"
                isLoading={isGeneratingInvite}
              >
                Davet Kodu Oluştur
              </Button>
            )}
          </div>

          {/* Logout */}
          <div className="pt-4 border-t border-zinc-800">
            <Button
              onClick={logout}
              variant="danger"
              className="w-full"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

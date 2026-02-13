'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Invite } from '@/types/database'

export default function InvitePage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const code = inviteCode.trim().toUpperCase()
    if (!code) {
      setError('Davet kodu gerekli')
      return
    }

    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()

      // Check if invite exists and is valid
      const { data, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('code', code)
        .single()

      if (inviteError || !data) {
        setError('Davet kodu bulunamadı')
        return
      }

      const invite = data as Invite

      if (!invite.is_active) {
        setError('Bu davet kodu artık aktif değil')
        return
      }

      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        setError('Bu davet kodunun süresi dolmuş')
        return
      }

      if (invite.uses_count >= invite.max_uses) {
        setError('Bu davet kodu kullanım limitine ulaşmış')
        return
      }

      // Valid invite, redirect to register
      router.push(`/register?code=${encodeURIComponent(code)}`)
    } catch {
      setError('Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Davet Kodu"
      subtitle="Kayıt olmak için geçerli bir davet kodu girin"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Davet Kodu"
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="ABCD1234"
          autoComplete="off"
          autoCapitalize="characters"
          disabled={isLoading}
          hint="Davet kodunuz yoksa mevcut bir kullanıcıdan alabilirsiniz"
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          Devam Et
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-zinc-500">
          Zaten hesabın var mı?{' '}
          <Link
            href="/login"
            className="text-emerald-500 hover:text-emerald-400 font-medium"
          >
            Giriş yap
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

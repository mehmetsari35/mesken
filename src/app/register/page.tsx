'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { useAuth } from '@/hooks/use-auth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Check, X } from 'lucide-react'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, isLoading } = useAuth()

  const [inviteCode, setInviteCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  // Get invite code from URL
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setInviteCode(code)
    } else {
      router.replace('/invite')
    }
  }, [searchParams, router])

  // Check username availability
  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus('idle')
      return
    }

    const checkUsername = async () => {
      setUsernameStatus('checking')
      const supabase = getSupabaseClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('check_username_available', {
        check_username: username.toLowerCase(),
      })

      if (error) {
        setUsernameStatus('idle')
        return
      }

      setUsernameStatus(data ? 'available' : 'taken')
    }

    const debounce = setTimeout(checkUsername, 500)
    return () => clearTimeout(debounce)
  }, [username])

  const validateForm = (): string | null => {
    if (!inviteCode.trim()) {
      return 'Davet kodu gerekli'
    }

    if (!username.trim()) {
      return 'Kullanıcı adı gerekli'
    }

    if (username.length < 3) {
      return 'Kullanıcı adı en az 3 karakter olmalı'
    }

    if (username.length > 30) {
      return 'Kullanıcı adı en fazla 30 karakter olabilir'
    }

    if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
      return 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'
    }

    if (usernameStatus === 'taken') {
      return 'Bu kullanıcı adı zaten kullanılıyor'
    }

    if (!password) {
      return 'Şifre gerekli'
    }

    if (password.length < 6) {
      return 'Şifre en az 6 karakter olmalı'
    }

    if (password !== confirmPassword) {
      return 'Şifreler eşleşmiyor'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    const { error: registerError } = await register(
      username.toLowerCase(),
      password,
      inviteCode.trim()
    )

    if (registerError) {
      setError(registerError.message)
      return
    }

    router.push('/app')
  }

  return (
    <AuthLayout
      title="Hesap Oluştur"
      subtitle="MESKEN'e katıl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Davet Kodu"
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="ABCD1234"
          autoComplete="off"
          disabled
        />

        <div>
          <Input
            label="Kullanıcı Adı"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="kullanici_adi"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            disabled={isLoading}
            hint="3-30 karakter, sadece harf, rakam ve alt çizgi"
          />
          {username.length >= 3 && (
            <div className="mt-2 flex items-center gap-2">
              {usernameStatus === 'checking' && (
                <span className="text-xs text-zinc-500">Kontrol ediliyor...</span>
              )}
              {usernameStatus === 'available' && (
                <span className="text-xs text-emerald-500 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Kullanılabilir
                </span>
              )}
              {usernameStatus === 'taken' && (
                <span className="text-xs text-red-400 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Bu kullanıcı adı alınmış
                </span>
              )}
            </div>
          )}
        </div>

        <Input
          label="Şifre"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isLoading}
          hint="En az 6 karakter"
        />

        <Input
          label="Şifre Tekrar"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={isLoading}
          error={confirmPassword && password !== confirmPassword ? 'Şifreler eşleşmiyor' : undefined}
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
          disabled={usernameStatus === 'taken' || usernameStatus === 'checking'}
        >
          Hesap Oluştur
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

      <p className="mt-8 text-xs text-zinc-600 text-center">
        Hesap oluşturarak, kullanıcı adınızın değiştirilemeyeceğini kabul
        ediyorsunuz.
      </p>
    </AuthLayout>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Yükleniyor..." />}>
      <RegisterForm />
    </Suspense>
  )
}

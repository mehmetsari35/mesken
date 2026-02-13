'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Kullanıcı adı ve şifre gerekli')
      return
    }

    const { error: loginError } = await login(username.trim(), password)

    if (loginError) {
      setError(loginError.message)
      return
    }

    router.push('/app')
  }

  return (
    <AuthLayout
      title="Hoş Geldin"
      subtitle="Devam etmek için giriş yap"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Kullanıcı Adı"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="kullanici_adi"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          disabled={isLoading}
        />

        <Input
          label="Şifre"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={isLoading}
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
          Giriş Yap
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-zinc-500">
          Hesabın yok mu?{' '}
          <Link
            href="/invite"
            className="text-emerald-500 hover:text-emerald-400 font-medium"
          >
            Davet kodu ile kayıt ol
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Loading } from '@/components/ui/loading'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, isInitialized } = useAuth()
  const [isReady, setIsReady] = useState(false)

  const publicPaths = ['/', '/login', '/register', '/invite']

  useEffect(() => {
    if (!isInitialized) return

    const isPublicPath = publicPaths.some(
      (path) => pathname === path || pathname?.startsWith('/invite/')
    )

    if (!user && !isPublicPath) {
      router.replace('/login')
      return
    }

    if (user && (pathname === '/login' || pathname === '/register')) {
      router.replace('/app')
      return
    }

    setIsReady(true)
  }, [user, isInitialized, pathname, router])

  // Show loading during auth check
  if (!isInitialized || isLoading) {
    return <Loading fullScreen text="Yükleniyor..." />
  }

  if (!isReady) {
    return <Loading fullScreen />
  }

  return <>{children}</>
}

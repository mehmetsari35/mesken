'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Profile } from '@/types/database'

export function useAuth() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const {
    user,
    profile,
    isLoading,
    isInitialized,
    setUser,
    setProfile,
    setLoading,
    setInitialized,
    reset,
  } = useAuthStore()

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!mounted) return

        setUser(authUser)

        if (authUser) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (mounted) {
            setProfile(profileData)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        // Only update if actually changed
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null)
          if (session?.user) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            if (mounted) {
              setProfile(profileData)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          router.push('/login')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, setUser, setProfile, setLoading, setInitialized, router])

  // Login with username and password
  const login = useCallback(
    async (username: string, password: string) => {
      setLoading(true)
      try {
        // Convert username to synthetic email
        const email = `${username.toLowerCase()}@mesken.local`

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Kullanıcı adı veya şifre hatalı')
          }
          throw error
        }

        return { user: data.user, error: null }
      } catch (error) {
        return { user: null, error: error as Error }
      } finally {
        setLoading(false)
      }
    },
    [supabase, setLoading]
  )

  // Register new user
  const register = useCallback(
    async (username: string, password: string, inviteCode: string) => {
      setLoading(true)
      try {
        // First validate the invite code
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: inviteResult, error: inviteError } = await (supabase.rpc as any)(
          'validate_and_consume_invite',
          { invite_code: inviteCode }
        )

        if (inviteError) throw inviteError

        const inviteData = inviteResult as { valid: boolean; error?: string }
        if (!inviteData.valid) {
          throw new Error(inviteData.error || 'Geçersiz davet kodu')
        }

        // Check username availability
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: isAvailable, error: usernameError } = await (supabase.rpc as any)(
          'check_username_available',
          { check_username: username.toLowerCase() }
        )

        if (usernameError) throw usernameError
        if (!isAvailable) {
          throw new Error('Bu kullanıcı adı zaten kullanılıyor')
        }

        // Create user with synthetic email
        const email = `${username.toLowerCase()}@mesken.local`

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.toLowerCase(),
            },
          },
        })

        if (error) throw error

        return { user: data.user, error: null }
      } catch (error) {
        return { user: null, error: error as Error }
      } finally {
        setLoading(false)
      }
    },
    [supabase, setLoading]
  )

  // Logout
  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    reset()
    router.push('/login')
  }, [supabase, reset, router])

  // Update profile
  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) return { error: new Error('Not authenticated') }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates as never)
        .eq('id', user.id)
        .select()
        .single()

      if (!error && data) {
        setProfile(data as Profile)
      }

      return { data, error }
    },
    [supabase, user, setProfile]
  )

  return {
    user,
    profile,
    isLoading,
    isInitialized,
    login,
    register,
    logout,
    updateProfile,
  }
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: true,
      isInitialized: false,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      reset: () => set({ user: null, profile: null, isLoading: false }),
    }),
    {
      name: 'mesken-auth',
      partialize: (state) => ({
        // Only persist necessary data
        profile: state.profile,
      }),
    }
  )
)

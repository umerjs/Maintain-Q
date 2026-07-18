import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile } from './supabase'
import { supabase } from './supabase'

type AuthState = {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),

  initialize: async () => {
    set({ loading: true })
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      set({ user })

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          set({ profile })
        } else {
          // Profiles table may not exist yet — fall back to user_metadata set at sign-up
          const meta = user.user_metadata as { role?: string; full_name?: string } | undefined
          if (meta?.role) {
            set({
              profile: {
                id: user.id,
                email: user.email ?? '',
                role: meta.role,
                full_name: meta.full_name ?? '',
              } as Profile,
            })
          } else {
            set({ profile: null })
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      set({ loading: false, initialized: true })
    }
  },
}))
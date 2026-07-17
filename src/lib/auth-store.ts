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

        set({ profile })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      set({ loading: false, initialized: true })
    }
  },
}))
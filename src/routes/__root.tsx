import { useEffect } from 'react'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { supabase } from '@/lib/supabase'
import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const initialize = useAuthStore((state) => state.initialize)
  const setUser = useAuthStore((state) => state.setUser)
  const setProfile = useAuthStore((state) => state.setProfile)

  useEffect(() => {
    initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setProfile(profile)
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [initialize, setUser, setProfile])

  return (
    <div className="min-h-screen bg-slate-50">
      <Outlet />
    </div>
  )
}

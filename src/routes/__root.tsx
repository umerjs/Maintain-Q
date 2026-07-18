import { useEffect } from 'react'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { supabase } from '@/lib/supabase'
import { Toaster } from '@/components/ui/sonner'
import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const initialize = useAuthStore((state) => state.initialize)
  const setUser = useAuthStore((state) => state.setUser)
  const setProfile = useAuthStore((state) => state.setProfile)

  useEffect(() => {
    // Initialize auth on mount
    initialize()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setProfile(profile)
        } catch (error) {
          console.error('Failed to fetch profile:', error)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [initialize, setUser, setProfile])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>MaintainIQ — Inventory Management System</title>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-slate-50 antialiased">
        <Outlet />
        <Toaster richColors position="top-right" />
        <Scripts />
      </body>
    </html>
  )
}

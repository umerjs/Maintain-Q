import { useEffect } from 'react'
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { logout } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const initialized = useAuthStore((state) => state.initialized)

  useEffect(() => {
    if (!initialized) return
    if (!user || !profile) {
      navigate({ to: '/login' })
    }
  }, [user, profile, initialized, navigate])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      navigate({ to: '/login' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed'
      toast.error(message)
    }
  }

  if (!initialized || !user || !profile) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">AssetTrack</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="text-slate-600">{user.email}</p>
              <p className="text-slate-500 capitalize">{profile.role}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

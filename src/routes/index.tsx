import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'

export const Route = createFileRoute('/')({\n  component: Home,
})

function Home() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const initialized = useAuthStore((state) => state.initialized)

  useEffect(() => {
    if (!initialized) return

    if (user && profile) {
      // Redirect to role-based dashboard
      const roleDashboard = {
        student: '/dashboard/student',
        technician: '/dashboard/technician',
        admin: '/dashboard/admin',
      }
      navigate({ to: roleDashboard[profile.role] })
    } else {
      // Redirect to login
      navigate({ to: '/login' })
    }
  }, [user, profile, initialized, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">AssetTrack</h1>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  )
}

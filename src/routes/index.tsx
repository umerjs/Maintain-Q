import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const initialized = useAuthStore((state) => state.initialized)

  useEffect(() => {
    if (!initialized) return

    if (user && profile) {
      const roleDashboard: Record<string, string> = {
        student: '/dashboard/student',
        reporter: '/dashboard/student',
        technician: '/dashboard/technician',
        admin: '/dashboard/admin',
        administrator: '/dashboard/admin',
      }
      navigate({ to: roleDashboard[profile.role] ?? '/dashboard/student' })
    } else {
      navigate({ to: '/login' })
    }
  }, [user, profile, initialized, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-slate-800">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MaintainIQ</h1>
        </div>
        <p className="text-slate-400 text-sm">Inventory Management · QR Tracking · Reporting</p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

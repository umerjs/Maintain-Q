import { useEffect } from 'react'
import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { logout } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { LayoutDashboard, Package, Ticket, FileText, LogOut, QrCode, ChevronRight } from 'lucide-react'

export const Route = createFileRoute('/dashboard/_layout')({
  component: DashboardLayout,
})

const roleLabel: Record<string, string> = {
  student: 'Reporter',
  technician: 'Technician',
  admin: 'Administrator',
}

const roleBadgeColor: Record<string, string> = {
  student: 'bg-sky-100 text-sky-800 border-sky-200',
  technician: 'bg-amber-100 text-amber-800 border-amber-200',
  admin: 'bg-violet-100 text-violet-800 border-violet-200',
}

function NavLink({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  const { location } = useRouterState()
  const active = location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  )
}

function DashboardLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const initialized = useAuthStore((state) => state.initialized)

  useEffect(() => {
    if (!initialized) return
    if (!user || !profile) navigate({ to: '/login' })
  }, [user, profile, initialized, navigate])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Signed out successfully')
      navigate({ to: '/login' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed'
      toast.error(message)
    }
  }

  if (!initialized || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      </div>
    )
  }

  const role = profile.role as 'student' | 'technician' | 'admin'

  const navLinks = {
    admin: [
      { to: '/dashboard/admin', icon: LayoutDashboard, label: 'Overview' },
      { to: '/dashboard/admin/assets', icon: Package, label: 'Assets' },
      { to: '/dashboard/admin/tickets', icon: Ticket, label: 'Tickets' },
    ],
    technician: [
      { to: '/dashboard/technician', icon: LayoutDashboard, label: 'Overview' },
      { to: '/dashboard/technician/assigned-tickets', icon: Ticket, label: 'My Tickets' },
    ],
    student: [
      { to: '/dashboard/student', icon: LayoutDashboard, label: 'Overview' },
      { to: '/dashboard/student/my-reports', icon: FileText, label: 'My Reports' },
    ],
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-slate-900 text-sm leading-none">MaintainIQ</span>
              <p className="text-xs text-slate-400 leading-none mt-0.5">Inventory Management System</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navLinks[role]?.map((link) => (
              <NavLink key={link.to} {...link} />
            ))}
          </nav>

          {/* User info + logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900 leading-none">{profile.full_name || profile.name}</p>
              <Badge
                className={`text-xs mt-1 border font-normal ${roleBadgeColor[role] ?? 'bg-slate-100 text-slate-600'}`}
                variant="outline"
              >
                {roleLabel[role] ?? role}
              </Badge>
            </div>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-1.5 text-slate-600">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb strip */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-9 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="font-medium text-slate-600">MaintainIQ</span>
          <ChevronRight className="w-3 h-3" />
          <span className="capitalize">{roleLabel[role] ?? role} Dashboard</span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-between text-xs text-slate-400">
          <span>MaintainIQ — Inventory Management System with QR Tracking & Reporting</span>
          <span>v1.0</span>
        </div>
      </footer>
    </div>
  )
}

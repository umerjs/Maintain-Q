import { useEffect, useState } from 'react'
import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { logout } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  LayoutDashboard, Package, Ticket, FileText, LogOut,
  QrCode, ChevronRight, Menu, X, User, Wrench,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/_layout')({
  component: DashboardLayout,
})

const roleLabel: Record<string, string> = {
  student: 'Reporter',
  technician: 'Technician',
  admin: 'Administrator',
}

const roleBadgeColor: Record<string, string> = {
  student: 'bg-sky-100 text-sky-700 border-sky-200',
  technician: 'bg-amber-100 text-amber-700 border-amber-200',
  admin: 'bg-violet-100 text-violet-700 border-violet-200',
}

const roleAccent: Record<string, string> = {
  student: 'from-sky-600 to-blue-700',
  technician: 'from-amber-500 to-orange-600',
  admin: 'from-violet-600 to-blue-700',
}

function NavLink({
  to, icon: Icon, label, onClick,
}: { to: string; icon: React.ElementType; label: string; onClick?: () => void }) {
  const { location } = useRouterState()
  const active = location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
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

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
      {initials || <User className="w-4 h-4" />}
    </div>
  )
}

function DashboardLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const initialized = useAuthStore((state) => state.initialized)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!initialized) return
    if (!user || !profile) navigate({ to: '/login' })
  }, [user, profile, initialized, navigate])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Signed out successfully')
      navigate({ to: '/login' })
    } catch {
      toast.error('Logout failed')
    }
  }

  if (!initialized || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      </div>
    )
  }

  const role = profile.role as 'student' | 'technician' | 'admin'
  const displayName = profile.full_name || (profile as any).name || user.email?.split('@')[0] || 'User'

  const navLinks = {
    admin: [
      { to: '/dashboard/admin', icon: LayoutDashboard, label: 'Overview' },
      { to: '/dashboard/admin/assets', icon: Package, label: 'Assets' },
      { to: '/dashboard/admin/tickets', icon: Ticket, label: 'Tickets' },
    ],
    technician: [
      { to: '/dashboard/technician', icon: LayoutDashboard, label: 'Overview' },
      { to: '/dashboard/technician/assigned-tickets', icon: Wrench, label: 'My Tickets' },
    ],
    student: [
      { to: '/dashboard/student', icon: LayoutDashboard, label: 'Overview' },
      { to: '/dashboard/student/my-reports', icon: FileText, label: 'Track Reports' },
    ],
  }

  const links = navLinks[role] ?? []

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Top navbar ── */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleAccent[role]} flex items-center justify-center shadow-sm`}>
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block leading-none">
              <p className="font-bold text-slate-900 text-sm">MaintainIQ</p>
              <p className="text-[10px] text-slate-400">Inventory Management</p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <NavLink key={link.to} {...link} />
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* User pill */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-3 py-1">
              <Avatar name={displayName} />
              <div className="leading-none">
                <p className="text-xs font-semibold text-slate-800">{displayName}</p>
                <Badge
                  className={`text-[10px] mt-0.5 px-1.5 py-0 border font-normal h-4 ${roleBadgeColor[role] ?? ''}`}
                  variant="outline"
                >
                  {roleLabel[role] ?? role}
                </Badge>
              </div>
            </div>

            {/* Logout */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="gap-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Sign Out</span>
            </Button>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
            {/* Mobile user info */}
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <Avatar name={displayName} />
              <div>
                <p className="text-sm font-semibold text-slate-800">{displayName}</p>
                <p className="text-xs text-slate-500">{roleLabel[role]}</p>
              </div>
            </div>
            {links.map((link) => (
              <NavLink key={link.to} {...link} onClick={() => setMobileOpen(false)} />
            ))}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-9 flex items-center gap-1.5 text-xs text-slate-400">
          <QrCode className="w-3 h-3" />
          <span className="font-medium text-slate-500">MaintainIQ</span>
          <ChevronRight className="w-3 h-3" />
          <span className="capitalize text-slate-700 font-medium">{roleLabel[role]} Dashboard</span>
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center justify-between text-xs text-slate-400">
          <span>MaintainIQ — Inventory Management · QR Tracking · Reporting</span>
          <span>v1.0</span>
        </div>
      </footer>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { getAllAssets, getAllTickets, getUnreadNotifications, markAllNotificationsAsRead } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Bell, Loader2, Package, Ticket, CheckCircle2, AlertTriangle,
  ArrowRight, Clock, Plus, TrendingUp, Activity, Wrench,
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/admin/')({
  component: AdminDashboard,
})

const statusColor: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  assigned: 'bg-violet-100 text-violet-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  escalated: 'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-700',
}

const severityDot: Record<string, string> = {
  low: 'bg-green-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
}

function StatCard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; color: string; trend?: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
            {trend && (
              <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> {trend}
              </p>
            )}
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-6 text-right">{value}</span>
    </div>
  )
}

function AdminDashboard() {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        const [a, t, n] = await Promise.all([
          getAllAssets(),
          getAllTickets(),
          getUnreadNotifications(user.id),
        ])
        setAssets(a)
        setTickets(t)
        setNotifications(n)
      } catch {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleClearNotifications = async () => {
    if (!user) return
    try {
      await markAllNotificationsAsRead(user.id)
      setNotifications([])
      toast.success('Notifications cleared')
    } catch {
      toast.error('Failed to clear notifications')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  const stats = {
    total: assets.length,
    working: assets.filter((a) => a.status === 'working').length,
    underRepair: assets.filter((a) => a.status === 'under_repair').length,
    outOfService: assets.filter((a) => a.status === 'out_of_service').length,
    totalTickets: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    assigned: tickets.filter((t) => t.status === 'assigned').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    escalated: tickets.filter((t) => t.status === 'escalated').length,
  }

  const resolutionRate = stats.totalTickets > 0
    ? Math.round((stats.resolved / stats.totalTickets) * 100)
    : 0

  const recentTickets = tickets.slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good day, {profile?.full_name || (profile as any)?.name} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Here's your inventory & maintenance overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard/admin/assets">
            <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 hidden sm:flex">
              <Plus className="w-4 h-4" /> Add Asset
            </Button>
          </Link>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {notifications.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={handleClearNotifications}>
                      Clear all
                    </Button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">All caught up ✓</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs text-slate-800 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assets"     value={stats.total}          sub={`${stats.working} working`}           icon={Package}       color="bg-blue-100 text-blue-600" />
        <StatCard label="Open Tickets"     value={stats.open}           sub="Awaiting assignment"                  icon={Clock}         color="bg-amber-100 text-amber-600" />
        <StatCard label="Under Repair"     value={stats.underRepair}    sub={`${stats.inProgress} in progress`}   icon={AlertTriangle} color="bg-orange-100 text-orange-600" />
        <StatCard label="Resolution Rate"  value={`${resolutionRate}%`} sub={`${stats.resolved} of ${stats.totalTickets} resolved`} icon={CheckCircle2} color="bg-green-100 text-green-600" />
      </div>

      {/* Mid row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Asset status */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-700">Asset Health</CardTitle>
                <CardDescription className="text-xs">Current inventory breakdown</CardDescription>
              </div>
              <Link to="/dashboard/admin/assets">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-blue-600 h-7 px-2">
                  Manage <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {[
              { label: 'Working',      value: stats.working,     max: stats.total, color: 'bg-green-500' },
              { label: 'Under Repair', value: stats.underRepair, max: stats.total, color: 'bg-amber-500' },
              { label: 'Out of Service',value: stats.outOfService,max: stats.total, color: 'bg-red-500'  },
            ].map(({ label, value, max, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600">{label}</span>
                  <span className="text-xs text-slate-400">{max > 0 ? Math.round((value / max) * 100) : 0}%</span>
                </div>
                <ProgressBar value={value} max={max} color={color} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ticket status */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-700">Ticket Pipeline</CardTitle>
                <CardDescription className="text-xs">Issue report statuses</CardDescription>
              </div>
              <Link to="/dashboard/admin/tickets">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-blue-600 h-7 px-2">
                  View all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-1">
            {[
              { label: 'Open',       value: stats.open,       color: 'bg-blue-100 text-blue-700'   },
              { label: 'Assigned',   value: stats.assigned,   color: 'bg-violet-100 text-violet-700'},
              { label: 'In Progress',value: stats.inProgress, color: 'bg-amber-100 text-amber-700'  },
              { label: 'Escalated',  value: stats.escalated,  color: 'bg-orange-100 text-orange-700'},
              { label: 'Resolved',   value: stats.resolved,   color: 'bg-green-100 text-green-700'  },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-slate-600">{label}</span>
                <Badge className={`${color} text-xs font-semibold`}>{value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent tickets */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Recent Tickets
              </CardTitle>
              <CardDescription className="text-xs">Latest reported issues across all assets</CardDescription>
            </div>
            <Link to="/dashboard/admin/tickets">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-blue-600 h-7 px-2">
                All tickets <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTickets.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No tickets yet</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-3 py-3">
                  {ticket.severity && (
                    <div className={`w-2 h-2 rounded-full shrink-0 ${severityDot[ticket.severity] ?? 'bg-slate-300'}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{ticket.title}</p>
                    <p className="text-xs text-slate-400">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ticket.severity && (
                      <span className="text-xs text-slate-400 capitalize hidden sm:block">{ticket.severity}</span>
                    )}
                    <Badge className={`text-xs ${statusColor[ticket.status] ?? ''}`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { to: '/dashboard/admin/assets',  icon: Package,  label: 'Manage Assets',   sub: 'Add or edit inventory',     bg: 'bg-blue-50 hover:bg-blue-100 border-blue-100',   ic: 'text-blue-600'   },
          { to: '/dashboard/admin/tickets', icon: Ticket,   label: 'Manage Tickets',  sub: 'Assign & resolve issues',   bg: 'bg-amber-50 hover:bg-amber-100 border-amber-100', ic: 'text-amber-600'  },
          { to: '/dashboard/admin/tickets', icon: Wrench,   label: 'View Escalated',  sub: `${stats.escalated} need attention`, bg: 'bg-red-50 hover:bg-red-100 border-red-100', ic: 'text-red-600' },
        ].map(({ to, icon: Icon, label, sub, bg, ic }) => (
          <Link key={label} to={to}>
            <button className={`w-full p-4 text-left rounded-xl border transition-colors ${bg}`}>
              <Icon className={`w-5 h-5 ${ic} mb-2`} />
              <p className="text-sm font-semibold text-slate-900">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
            </button>
          </Link>
        ))}
      </div>
    </div>
  )
}

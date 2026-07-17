import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { getAllAssets, getAllTickets, getUnreadNotifications, markAllNotificationsAsRead } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Bell, Loader2, Package, Ticket, CheckCircle2, AlertTriangle, ArrowRight, Clock } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/admin/')({
  component: AdminDashboard,
})

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number | string; sub?: string; icon: React.ElementType; color: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AdminDashboard() {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAssets: 0,
    workingAssets: 0,
    underRepair: 0,
    outOfService: 0,
    totalTickets: 0,
    openTickets: 0,
    assignedTickets: 0,
    resolvedTickets: 0,
  })
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return
      try {
        const [assetsData, ticketsData, notificationsData] = await Promise.all([
          getAllAssets(),
          getAllTickets(),
          getUnreadNotifications(user.id),
        ])

        setStats({
          totalAssets: assetsData.length,
          workingAssets: assetsData.filter((a) => a.status === 'working').length,
          underRepair: assetsData.filter((a) => a.status === 'under_repair').length,
          outOfService: assetsData.filter((a) => a.status === 'out_of_service').length,
          totalTickets: ticketsData.length,
          openTickets: ticketsData.filter((t) => t.status === 'open').length,
          assignedTickets: ticketsData.filter((t) => t.status === 'assigned').length,
          resolvedTickets: ticketsData.filter((t) => t.status === 'resolved').length,
        })

        setNotifications(notificationsData)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  const handleMarkAsRead = async () => {
    if (!user) return
    try {
      await markAllNotificationsAsRead(user.id)
      setNotifications([])
      toast.success('All notifications cleared')
    } catch (error) {
      toast.error('Failed to clear notifications')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  const resolutionRate = stats.totalTickets > 0
    ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good day, {profile?.full_name || profile?.name} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Here's your inventory overview for today.</p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative shrink-0">
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center leading-none">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleMarkAsRead}>
                    Clear all
                  </Button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">You're all caught up ✓</p>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 5).map((notif) => (
                    <div key={notif.id} className="text-sm p-2.5 bg-slate-50 rounded-md">
                      <p className="text-slate-800 leading-snug">{notif.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Assets" value={stats.totalAssets} icon={Package} color="bg-blue-100 text-blue-600" />
        <StatCard label="Open Tickets" value={stats.openTickets} sub="Awaiting action" icon={Clock} color="bg-amber-100 text-amber-600" />
        <StatCard label="Under Repair" value={stats.underRepair} icon={AlertTriangle} color="bg-orange-100 text-orange-600" />
        <StatCard label="Resolution Rate" value={`${resolutionRate}%`} sub={`${stats.resolvedTickets} resolved`} icon={CheckCircle2} color="bg-green-100 text-green-600" />
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Asset Status</CardTitle>
                <CardDescription>Inventory breakdown</CardDescription>
              </div>
              <Link to="/dashboard/admin/assets">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-blue-600 h-7">
                  Manage <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-slate-700">Working</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 bg-green-200 rounded-full" style={{ width: `${stats.totalAssets ? (stats.workingAssets / stats.totalAssets) * 100 : 0}px`, minWidth: '40px', maxWidth: '120px' }} />
                <span className="text-sm font-semibold w-8 text-right">{stats.workingAssets}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-sm text-slate-700">Under Repair</span>
              </div>
              <span className="text-sm font-semibold">{stats.underRepair}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-sm text-slate-700">Out of Service</span>
              </div>
              <span className="text-sm font-semibold">{stats.outOfService}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Ticket Overview</CardTitle>
                <CardDescription>Issue report status</CardDescription>
              </div>
              <Link to="/dashboard/admin/tickets">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-blue-600 h-7">
                  View all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Open', value: stats.openTickets, color: 'bg-blue-100 text-blue-700' },
              { label: 'Assigned', value: stats.assignedTickets, color: 'bg-purple-100 text-purple-700' },
              { label: 'Resolved', value: stats.resolvedTickets, color: 'bg-green-100 text-green-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-700">{label}</span>
                <Badge className={`${color} font-semibold text-xs`}>{value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common management tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link to="/dashboard/admin/assets">
            <button className="w-full p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors">
              <Package className="w-5 h-5 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-slate-900">Add Asset</p>
              <p className="text-xs text-slate-500 mt-0.5">Register new inventory item</p>
            </button>
          </Link>
          <Link to="/dashboard/admin/tickets">
            <button className="w-full p-4 text-left bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-100 transition-colors">
              <Ticket className="w-5 h-5 text-amber-600 mb-2" />
              <p className="text-sm font-medium text-slate-900">Manage Tickets</p>
              <p className="text-xs text-slate-500 mt-0.5">Review open issue reports</p>
            </button>
          </Link>
          <Link to="/dashboard/admin/assets">
            <button className="w-full p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-100 transition-colors">
              <CheckCircle2 className="w-5 h-5 text-green-600 mb-2" />
              <p className="text-sm font-medium text-slate-900">View Reports</p>
              <p className="text-xs text-slate-500 mt-0.5">Check asset usage stats</p>
            </button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

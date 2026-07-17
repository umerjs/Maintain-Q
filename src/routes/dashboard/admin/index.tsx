import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
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
import { Bell, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/admin/')({
  component: AdminDashboard,
})

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
    avgResolutionTime: 0,
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
          avgResolutionTime: 0,
        })

        setNotifications(notificationsData)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        toast.error('Failed to load dashboard')
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
      toast.success('Marked all as read')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark notifications as read'
      toast.error(message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {profile?.full_name}</h1>
          <p className="text-slate-600">System overview and analytics</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAsRead}>
                    Mark all read
                  </Button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500">No unread notifications</p>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 5).map((notif) => (
                    <div key={notif.id} className="text-sm p-2 bg-slate-50 rounded">
                      <p className="text-slate-900">{notif.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{stats.totalAssets}</CardTitle>
            <CardDescription>Total Assets</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{stats.openTickets}</CardTitle>
            <CardDescription>Open Tickets</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{stats.assignedTickets}</CardTitle>
            <CardDescription>Assigned Tickets</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{stats.resolvedTickets}</CardTitle>
            <CardDescription>Resolved Tickets</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Asset Status</CardTitle>
            <CardDescription>Inventory breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Working</span>
              <Badge className="bg-green-100 text-green-800">{stats.workingAssets}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Under Repair</span>
              <Badge className="bg-yellow-100 text-yellow-800">{stats.underRepair}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Out of Service</span>
              <Badge className="bg-red-100 text-red-800">{stats.outOfService}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Overview</CardTitle>
            <CardDescription>Status distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Tickets</span>
              <span className="font-semibold">{stats.totalTickets}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">In Progress</span>
              <Badge className="bg-yellow-100 text-yellow-800">Coming soon</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Resolution Rate</span>
              <span className="font-semibold">
                {stats.totalTickets > 0
                  ? `${Math.round((stats.resolvedTickets / stats.totalTickets) * 100)}%`
                  : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
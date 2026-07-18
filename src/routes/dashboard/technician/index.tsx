import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { getTechnicianTickets } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Ticket, CheckCircle2, Clock, ArrowRight, Wrench, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/dashboard/technician/')({
  component: TechnicianDashboard,
})

const statusColor: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  escalated: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
}

function TechnicianDashboard() {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      if (!user) return
      try {
        const data = await getTechnicianTickets(user.id)
        setTickets(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user])

  const assignedCount = tickets.filter((t) => t.status === 'assigned').length
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length
  const recentTickets = tickets.slice(0, 3)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {profile?.full_name || profile?.name} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Review your assigned maintenance tickets and update their status.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Assigned</p>
                <p className="text-3xl font-bold text-slate-900">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : assignedCount}
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-slate-900">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : inProgressCount}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Resolved</p>
                <p className="text-3xl font-bold text-slate-900">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300" /> : resolvedCount}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-600" />
                Recent Tickets
              </CardTitle>
              <CardDescription>Issues assigned to you for resolution</CardDescription>
            </div>
            <Link
              to="/dashboard/technician/assigned-tickets"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
            </div>
          ) : recentTickets.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No tickets assigned yet</p>
              <p className="text-xs mt-1">Tickets assigned to you will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{ticket.title}</p>
                    <p className="text-xs text-slate-400">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge className={`text-xs ml-3 shrink-0 ${statusColor[ticket.status] ?? ''}`}>
                    {ticket.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

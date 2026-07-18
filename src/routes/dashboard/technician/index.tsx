import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { getTechnicianTickets, updateTicket } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Ticket, CheckCircle2, Clock, ArrowRight, Wrench, Loader2, AlertTriangle, PlayCircle } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/technician/')({
  component: TechnicianDashboard,
})

const statusColor: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  assigned: 'bg-violet-100 text-violet-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  escalated: 'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-700',
}

const severityBorder: Record<string, string> = {
  low: 'border-l-green-400',
  medium: 'border-l-yellow-400',
  high: 'border-l-orange-500',
  critical: 'border-l-red-500',
}

function TechnicianDashboard() {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        setTickets(await getTechnicianTickets(user.id))
      } catch {
        toast.error('Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleStartWork = async (ticketId: string) => {
    setUpdatingId(ticketId)
    try {
      await updateTicket(ticketId, { status: 'in_progress' })
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: 'in_progress' } : t))
      toast.success('Ticket marked In Progress')
    } catch {
      toast.error('Failed to update ticket')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleResolve = async (ticketId: string) => {
    setUpdatingId(ticketId)
    try {
      await updateTicket(ticketId, { status: 'resolved' })
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: 'resolved' } : t))
      toast.success('Ticket resolved!')
    } catch {
      toast.error('Failed to resolve ticket')
    } finally {
      setUpdatingId(null)
    }
  }

  const assigned = tickets.filter((t) => t.status === 'assigned')
  const inProgress = tickets.filter((t) => t.status === 'in_progress')
  const resolved = tickets.filter((t) => t.status === 'resolved')
  const urgent = tickets.filter((t) => ['high', 'critical'].includes(t.severity) && t.status !== 'resolved')
  const displayTickets = tickets.filter((t) => t.status !== 'resolved').slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {profile?.full_name || (profile as any)?.name} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Your maintenance assignments and task overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Assigned',    value: assigned.length,   icon: Ticket,       color: 'bg-violet-100 text-violet-600' },
          { label: 'In Progress', value: inProgress.length, icon: Clock,        color: 'bg-amber-100 text-amber-600'   },
          { label: 'Resolved',    value: resolved.length,   icon: CheckCircle2, color: 'bg-green-100 text-green-600'   },
          { label: 'Urgent',      value: urgent.length,     icon: AlertTriangle,color: 'bg-red-100 text-red-600'       },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-300 mt-1" /> : value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active tickets */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Active Tickets
              </CardTitle>
              <CardDescription className="text-xs">Tickets needing your attention</CardDescription>
            </div>
            <Link to="/dashboard/technician/assigned-tickets">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-blue-600 h-7 px-2">
                All tickets <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
            </div>
          ) : displayTickets.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs mt-1">No active tickets assigned to you.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-3.5 rounded-lg border border-slate-200 border-l-4 ${severityBorder[ticket.severity] ?? 'border-l-slate-300'} bg-white hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{ticket.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ticket.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-xs ${statusColor[ticket.status] ?? ''}`}>
                          {ticket.status.replace(/_/g, ' ')}
                        </Badge>
                        {ticket.severity && (
                          <span className="text-xs text-slate-400 capitalize">{ticket.severity} priority</span>
                        )}
                        <span className="text-xs text-slate-400">{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {ticket.status === 'assigned' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                          disabled={updatingId === ticket.id}
                          onClick={() => handleStartWork(ticket.id)}
                        >
                          {updatingId === ticket.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                          Start
                        </Button>
                      )}
                      {ticket.status === 'in_progress' && (
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                          disabled={updatingId === ticket.id}
                          onClick={() => handleResolve(ticket.id)}
                        >
                          {updatingId === ticket.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: '📋', label: 'Update status', desc: 'Keep ticket status current so the team stays informed.' },
          { icon: '📝', label: 'Add notes',     desc: 'Log what you found and what action was taken.' },
          { icon: '⚡', label: 'Escalate fast', desc: 'Use Escalate if a ticket needs external support.' },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="p-4 bg-white rounded-xl border border-slate-200 text-center">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-sm font-semibold text-slate-800">{label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

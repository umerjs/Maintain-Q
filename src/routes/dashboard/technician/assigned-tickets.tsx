import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { getTechnicianTickets, updateTicket } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, ChevronDown, ChevronUp, Wrench, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/technician/assigned-tickets')({
  component: AssignedTicketsPage,
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
  critical: 'border-l-red-600',
}

const severityColor: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

function AssignedTicketsPage() {
  const user = useAuthStore((state) => state.user)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState('active')

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

  const handleUpdate = async (ticketId: string, newStatus: string) => {
    setUpdatingId(ticketId)
    try {
      const ticket = tickets.find((t) => t.id === ticketId)
      await updateTicket(ticketId, {
        status: newStatus as any,
        resolution_notes: notes[ticketId] ?? ticket?.resolution_notes ?? '',
      })
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: newStatus } : t))
      toast.success('Ticket updated')
      if (newStatus === 'resolved') setExpandedId(null)
    } catch {
      toast.error('Failed to update ticket')
    } finally {
      setUpdatingId(null)
    }
  }

  const filters = [
    { value: 'active',   label: 'Active',   count: tickets.filter((t) => ['assigned', 'in_progress'].includes(t.status)).length },
    { value: 'all',      label: 'All',      count: tickets.length },
    { value: 'resolved', label: 'Resolved', count: tickets.filter((t) => t.status === 'resolved').length },
  ]

  const displayed = filter === 'active'
    ? tickets.filter((t) => ['assigned', 'in_progress', 'escalated'].includes(t.status))
    : filter === 'resolved'
    ? tickets.filter((t) => t.status === 'resolved')
    : tickets

  const stats = {
    assigned: tickets.filter((t) => t.status === 'assigned').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    critical: tickets.filter((t) => t.severity === 'critical' && t.status !== 'resolved').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-amber-500" /> My Tickets
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Update status and add notes for tickets assigned to you.</p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Assigned',    value: stats.assigned,   icon: Clock,         color: 'text-violet-600 bg-violet-50 border-violet-200' },
          { label: 'In Progress', value: stats.inProgress, icon: Wrench,        color: 'text-amber-600 bg-amber-50 border-amber-200'   },
          { label: 'Resolved',    value: stats.resolved,   icon: CheckCircle2,  color: 'text-green-600 bg-green-50 border-green-200'   },
          { label: 'Critical',    value: stats.critical,   icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200'         },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
            <Icon className="w-4 h-4 mx-auto mb-1 opacity-70" />
            <p className="text-xl font-bold">{value}</p>
            <p className="text-[10px] font-medium mt-0.5 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === f.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {displayed.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {filter === 'active' ? 'No active tickets — great work!' : 'No tickets in this category.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayed.map((ticket) => {
            const isExpanded = expandedId === ticket.id

            return (
              <div
                key={ticket.id}
                className={`bg-white rounded-xl border border-slate-200 border-l-4 overflow-hidden transition-shadow hover:shadow-md ${
                  severityBorder[ticket.severity] ?? 'border-l-slate-300'
                }`}
              >
                {/* Collapsed row */}
                <button
                  className="w-full flex items-center gap-3 p-4 text-left"
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 truncate">{ticket.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className={`text-[10px] ${statusColor[ticket.status] ?? ''}`}>
                        {ticket.status.replace(/_/g, ' ')}
                      </Badge>
                      {ticket.severity && (
                        <Badge className={`text-[10px] ${severityColor[ticket.severity] ?? ''}`}>
                          {ticket.severity}
                        </Badge>
                      )}
                      {ticket.category && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{ticket.category}</span>
                      )}
                      <span className="text-[10px] text-slate-400">{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 space-y-4">
                    {/* Description */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Description</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{ticket.description}</p>
                    </div>

                    {/* Resolution notes */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1.5">Resolution Notes</p>
                      <Textarea
                        placeholder="Describe what you found and what action was taken…"
                        value={notes[ticket.id] ?? ticket.resolution_notes ?? ''}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                        disabled={updatingId === ticket.id}
                        rows={3}
                        className="text-sm bg-white"
                      />
                    </div>

                    {/* Status update */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1.5">Update Status</p>
                      <div className="flex items-center gap-2">
                        <Select
                          value={ticket.status}
                          onValueChange={(val) => handleUpdate(ticket.id, val)}
                          disabled={updatingId === ticket.id}
                        >
                          <SelectTrigger className="flex-1 h-9 text-sm bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="escalated">Escalated</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-9 gap-1.5 bg-green-600 hover:bg-green-700 shrink-0"
                          disabled={updatingId === ticket.id}
                          onClick={() => handleUpdate(ticket.id, 'resolved')}
                        >
                          {updatingId === ticket.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <CheckCircle2 className="w-3 h-3" />}
                          Mark Resolved
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

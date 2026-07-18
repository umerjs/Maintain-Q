import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { getStudentTickets } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, CheckCircle2, Clock, CircleDot, XCircle, AlertTriangle } from 'lucide-react'

export const Route = createFileRoute('/dashboard/student/my-reports')({
  component: MyReportsPage,
})

const statusMeta: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open:        { label: 'Open',        color: 'bg-blue-100 text-blue-700',    icon: CircleDot   },
  assigned:    { label: 'Assigned',    color: 'bg-violet-100 text-violet-700',icon: Clock        },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700',  icon: Clock        },
  resolved:    { label: 'Resolved',    color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  escalated:   { label: 'Escalated',   color: 'bg-orange-100 text-orange-700',icon: AlertTriangle},
  rejected:    { label: 'Rejected',    color: 'bg-red-100 text-red-700',      icon: XCircle      },
}

const severityColor: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const STEPS = [
  { key: 'open',        label: 'Reported'    },
  { key: 'assigned',    label: 'Assigned'    },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved',    label: 'Resolved'    },
]

function TicketTracker({ status }: { status: string }) {
  const stepOrder = ['open', 'assigned', 'in_progress', 'resolved']
  const currentIdx = status === 'rejected' ? 0
    : status === 'escalated' ? 2
    : stepOrder.indexOf(status)

  return (
    <div className="flex items-center gap-0 mt-3">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx && status !== 'rejected'
        const active = i === currentIdx && status !== 'rejected'
        const rejected = status === 'rejected' && i === 0
        const escalated = status === 'escalated' && i === 2

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  rejected ? 'bg-red-500 text-white'
                  : escalated && i === 2 ? 'bg-orange-500 text-white'
                  : done ? 'bg-blue-600 text-white'
                  : active ? 'bg-blue-200 text-blue-700 ring-2 ring-blue-400'
                  : 'bg-slate-200 text-slate-400'
                }`}
              >
                {rejected ? '✕' : done && !active ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight ${
                done && !rejected ? 'text-blue-600' : rejected && i === 0 ? 'text-red-500' : 'text-slate-400'
              }`}>
                {escalated && i === 2 ? 'Escalated' : step.label}
              </span>
            </div>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded ${i < currentIdx && !rejected ? 'bg-blue-400' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function MyReportsPage() {
  const user = useAuthStore((state) => state.user)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        setTickets(await getStudentTickets(user.id))
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const filters = [
    { value: 'all',         label: 'All'         },
    { value: 'open',        label: 'Open'        },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved',    label: 'Resolved'    },
  ]

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)

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
          <FileText className="w-6 h-6 text-amber-500" /> Track My Reports
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Follow each issue report from submission to resolution.</p>
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => {
          const count = f.value === 'all' ? tickets.length : tickets.filter((t) => t.status === f.value).length
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filter === f.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {f.label} <span className="ml-1 opacity-75">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Ticket cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No reports found</p>
            <p className="text-xs mt-1">
              {filter === 'all' ? 'Scan a QR code on any asset to submit your first report.' : `No ${filter.replace(/_/g, ' ')} tickets.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((ticket) => {
            const meta = statusMeta[ticket.status]
            const StatusIcon = meta?.icon ?? CircleDot

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-bold text-slate-900 leading-snug">{ticket.title}</p>
                  <Badge className={`text-[10px] shrink-0 gap-1 ${meta?.color ?? ''}`}>
                    <StatusIcon className="w-3 h-3" />
                    {meta?.label ?? ticket.status}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 line-clamp-2">{ticket.description}</p>

                {/* Meta row */}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {ticket.category && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{ticket.category}</span>
                  )}
                  {ticket.severity && (
                    <Badge className={`text-[10px] ${severityColor[ticket.severity] ?? ''}`}>
                      {ticket.severity}
                    </Badge>
                  )}
                  <span className="text-xs text-slate-400">
                    Submitted {new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {ticket.resolved_at && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Resolved {new Date(ticket.resolved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>

                {/* Progress tracker */}
                <TicketTracker status={ticket.status} />

                {/* Resolution notes */}
                {ticket.resolution_notes && (
                  <div className="mt-3 p-2.5 bg-green-50 border border-green-100 rounded-lg">
                    <p className="text-xs font-semibold text-green-700 mb-0.5">Technician Notes</p>
                    <p className="text-xs text-green-800">{ticket.resolution_notes}</p>
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

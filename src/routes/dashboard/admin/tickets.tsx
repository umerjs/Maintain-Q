import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { getAllTickets, getAllAssets, assignTicket, updateTicket, getTechnicians } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, UserCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/admin/tickets')({
  component: AdminTicketsPage,
})

const statusColor: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  escalated: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
}

const severityColor: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

function AdminTicketsPage() {
  const user = useAuthStore((state) => state.user)
  const [tickets, setTickets] = useState<any[]>([])
  const [assets, setAssets] = useState<Record<string, any>>({})
  const [technicians, setTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [assigningTicket, setAssigningTicket] = useState<any | null>(null)
  const [selectedTech, setSelectedTech] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      try {
        const [ticketsData, assetsData, techsData] = await Promise.all([
          getAllTickets(),
          getAllAssets(),
          getTechnicians(),
        ])
        setTickets(ticketsData)
        setTechnicians(techsData)
        const assetMap = assetsData.reduce(
          (acc, asset) => { acc[asset.id] = asset; return acc },
          {} as Record<string, any>
        )
        setAssets(assetMap)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  const filteredTickets =
    filter === 'all'
      ? tickets
      : filter === 'open_assigned'
      ? tickets.filter((t) => ['open', 'assigned'].includes(t.status))
      : tickets.filter((t) => t.status === filter)

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    assigned: tickets.filter((t) => t.status === 'assigned').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }

  const handleAssign = async () => {
    if (!assigningTicket || !selectedTech) return
    setAssignLoading(true)
    try {
      await assignTicket(assigningTicket.id, selectedTech)
      const techName = technicians.find((t) => t.id === selectedTech)?.full_name || 'Technician'
      setTickets(tickets.map((t) =>
        t.id === assigningTicket.id
          ? { ...t, assigned_to: selectedTech, status: 'assigned' }
          : t
      ))
      toast.success(`Ticket assigned to ${techName}`)
      setAssigningTicket(null)
      setSelectedTech('')
    } catch (error) {
      toast.error('Failed to assign ticket')
    } finally {
      setAssignLoading(false)
    }
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    setStatusUpdating(ticketId)
    try {
      await updateTicket(ticketId, { status: newStatus as any })
      setTickets(tickets.map((t) => t.id === ticketId ? { ...t, status: newStatus } : t))
      toast.success('Status updated')
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setStatusUpdating(null)
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tickets Management</h1>
        <p className="text-slate-500 text-sm mt-1">View, assign, and manage all issue reports</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-900' },
          { label: 'Open', value: stats.open, color: 'text-blue-700' },
          { label: 'Assigned', value: stats.assigned, color: 'text-purple-700' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-yellow-700' },
          { label: 'Resolved', value: stats.resolved, color: 'text-green-700' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardHeader className="pb-1 pt-4">
              <CardTitle className={`text-2xl ${color}`}>{value}</CardTitle>
              <CardDescription className="text-xs">{label}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open_assigned">Open &amp; Assigned</SelectItem>
            <SelectItem value="open">Open Only</SelectItem>
            <SelectItem value="assigned">Assigned Only</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-400">{filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Ticket list */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No tickets found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredTickets.map((ticket) => {
            const expanded = expandedId === ticket.id
            const assetName = assets[ticket.asset_id]?.name
            const assignedTechName = technicians.find((t) => t.id === ticket.assigned_to)?.full_name

            return (
              <Card key={ticket.id} className="overflow-hidden">
                {/* Header row — always visible */}
                <div
                  className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : ticket.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{ticket.title}</p>
                      {assetName && (
                        <span className="text-xs text-slate-400 font-normal">· {assetName}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ticket.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-xs ${statusColor[ticket.status] ?? 'bg-slate-100 text-slate-700'}`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </Badge>
                    {ticket.severity && (
                      <Badge className={`text-xs ${severityColor[ticket.severity] ?? ''}`}>
                        {ticket.severity}
                      </Badge>
                    )}
                    {expanded
                      ? <ChevronUp className="w-4 h-4 text-slate-400" />
                      : <ChevronDown className="w-4 h-4 text-slate-400" />
                    }
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4 bg-slate-50/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Category</p>
                        <p className="font-medium text-slate-800">{ticket.category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Reported</p>
                        <p className="font-medium text-slate-800">{new Date(ticket.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Assigned To</p>
                        <p className="font-medium text-slate-800">{assignedTechName || 'Unassigned'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Resolution</p>
                        <p className="font-medium text-slate-800">{ticket.resolution_notes ? 'Notes added' : 'Pending'}</p>
                      </div>
                    </div>

                    {ticket.description && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Full Description</p>
                        <p className="text-sm text-slate-700 bg-white border border-slate-100 rounded p-2">{ticket.description}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Assign button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={(e) => { e.stopPropagation(); setAssigningTicket(ticket); setSelectedTech(ticket.assigned_to || '') }}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {ticket.assigned_to ? 'Reassign' : 'Assign Technician'}
                      </Button>

                      {/* Quick status change */}
                      <Select
                        value={ticket.status}
                        onValueChange={(v) => { handleStatusChange(ticket.id, v) }}
                        disabled={statusUpdating === ticket.id}
                      >
                        <SelectTrigger className="h-8 text-xs w-40" onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="escalated">Escalated</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>

                      {statusUpdating === ticket.id && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Assign Dialog */}
      <Dialog open={!!assigningTicket} onOpenChange={(open) => { if (!open) { setAssigningTicket(null); setSelectedTech('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
            <DialogDescription>
              Select a technician to handle "{assigningTicket?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {technicians.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No technicians registered yet. Ask a user to sign up with the Technician role.
              </p>
            ) : (
              <Select value={selectedTech} onValueChange={setSelectedTech}>
                <SelectTrigger>
                  <SelectValue placeholder="Select technician…" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.full_name || tech.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setAssigningTicket(null); setSelectedTech('') }}>
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedTech || assignLoading}
              >
                {assignLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

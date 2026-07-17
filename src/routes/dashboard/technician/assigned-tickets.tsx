import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { getTechnicianTickets, updateTicket } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/technician/assigned-tickets')({
  component: AssignedTicketsPage,
})

const statusColor = {
  open: 'bg-blue-100 text-blue-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  escalated: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
}

const severityColor = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

function AssignedTicketsPage() {
  const user = useAuthStore((state) => state.user)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return
      try {
        const data = await getTechnicianTickets(user.id)
        setTickets(data)
      } catch (error) {
        console.error('Failed to fetch tickets:', error)
        toast.error('Failed to load tickets')
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [user])

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    setUpdatingId(ticketId)
    try {
      const ticket = tickets.find((t) => t.id === ticketId)
      await updateTicket(ticketId, {
        status: newStatus as any,
        resolution_notes: notes[ticketId] || ticket.resolution_notes,
      })
      setTickets(tickets.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)))
      toast.success('Ticket updated')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update ticket'
      toast.error(message)
    } finally {
      setUpdatingId(null)
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
        <h1 className="text-3xl font-bold text-slate-900">Assigned Tickets</h1>
        <p className="text-slate-600">Manage and resolve tickets assigned to you</p>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No tickets assigned yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{ticket.title}</CardTitle>
                    <CardDescription>{ticket.description.substring(0, 100)}...</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={statusColor[ticket.status as keyof typeof statusColor]}>
                      {ticket.status.replace(/_/g, ' ')}
                    </Badge>
                    {ticket.severity && (
                      <Badge className={severityColor[ticket.severity as keyof typeof severityColor]}>
                        {ticket.severity}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedId === ticket.id && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Category</p>
                      <p className="text-slate-900">{ticket.category || 'Uncategorized'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Created</p>
                      <p className="text-slate-900">{new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">Resolution Notes</p>
                    <Textarea
                      placeholder="Add resolution notes..."
                      value={notes[ticket.id] || ticket.resolution_notes || ''}
                      onChange={(e) => setNotes({ ...notes, [ticket.id]: e.target.value })}
                      disabled={updatingId === ticket.id}
                      rows={3}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-2">Update Status</p>
                    <div className="flex gap-2">
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => handleStatusChange(ticket.id, value)}
                        disabled={updatingId === ticket.id}
                      >
                        <SelectTrigger className="flex-1">
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
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
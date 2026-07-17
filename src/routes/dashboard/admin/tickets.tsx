import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { getAllTickets, getAllAssets } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/dashboard/admin/tickets')({
  component: AdminTicketsPage,
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

function AdminTicketsPage() {
  const user = useAuthStore((state) => state.user)
  const [tickets, setTickets] = useState<any[]>([])
  const [assets, setAssets] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      try {
        const [ticketsData, assetsData] = await Promise.all([
          getAllTickets(),
          getAllAssets(),
        ])
        setTickets(ticketsData)
        const assetMap = assetsData.reduce(
          (acc, asset) => {
            acc[asset.id] = asset
            return acc
          },
          {} as Record<string, any>
        )
        setAssets(assetMap)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const filteredTickets =
    filter === 'all'
      ? tickets
      : tickets.filter(
          (t) => t.status === filter || (filter === 'open_assigned' && ['open', 'assigned'].includes(t.status))
        )

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    assigned: tickets.filter((t) => t.status === 'assigned').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
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
        <h1 className="text-3xl font-bold text-slate-900">Tickets Management</h1>
        <p className="text-slate-600">View and manage all tickets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
            <CardDescription>Total Tickets</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{stats.open}</CardTitle>
            <CardDescription>Open</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{stats.assigned}</CardTitle>
            <CardDescription>Assigned</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{stats.inProgress}</CardTitle>
            <CardDescription>In Progress</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{stats.resolved}</CardTitle>
            <CardDescription>Resolved</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="mb-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open_assigned">Open & Assigned</SelectItem>
            <SelectItem value="open">Open Only</SelectItem>
            <SelectItem value="assigned">Assigned Only</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No tickets found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{ticket.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {assets[ticket.asset_id]?.name || 'No asset'} • {ticket.description.substring(0, 60)}...
                    </CardDescription>
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
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Category</p>
                    <p className="text-slate-900">{ticket.category || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Created</p>
                    <p className="text-slate-900">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Assigned To</p>
                    <p className="text-slate-900">{ticket.assigned_to ? 'Tech' : 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Resolution</p>
                    <p className="text-slate-900">{ticket.resolution_notes ? 'Yes' : 'Pending'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
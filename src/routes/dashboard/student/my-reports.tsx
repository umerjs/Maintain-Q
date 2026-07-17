import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { getStudentTickets } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/dashboard/student/my-reports')({
  component: MyReportsPage,
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

function MyReportsPage() {
  const user = useAuthStore((state) => state.user)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return
      try {
        const data = await getStudentTickets(user.id)
        setTickets(data)
      } catch (error) {
        console.error('Failed to fetch tickets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [user])

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
        <h1 className="text-3xl font-bold text-slate-900">My Reports</h1>
        <p className="text-slate-600">Track the status of your reported issues</p>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No reports yet. Scan a QR code to report an issue.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
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
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Category</p>
                    <p className="text-slate-900">{ticket.category || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Created</p>
                    <p className="text-slate-900">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                  {ticket.resolution_notes && (
                    <div className="col-span-2">
                      <p className="text-slate-600">Resolution Notes</p>
                      <p className="text-slate-900">{ticket.resolution_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
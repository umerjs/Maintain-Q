import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Ticket, CheckCircle2, Clock, ArrowRight, Wrench } from 'lucide-react'

export const Route = createFileRoute('/dashboard/technician/')({
  component: TechnicianDashboard,
})

function TechnicianDashboard() {
  const profile = useAuthStore((state) => state.profile)

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
                <p className="text-3xl font-bold text-slate-900">0</p>
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
                <p className="text-3xl font-bold text-slate-900">0</p>
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
                <p className="text-3xl font-bold text-slate-900">0</p>
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
                Assigned Tickets
              </CardTitle>
              <CardDescription>Issues assigned to you for resolution</CardDescription>
            </div>
            <Link to="/dashboard/technician/assigned-tickets" className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-slate-400">
            <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tickets assigned yet</p>
            <p className="text-xs mt-1">Tickets assigned to you will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

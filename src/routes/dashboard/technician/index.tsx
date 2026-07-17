import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/dashboard/technician/')({
  component: TechnicianDashboard,
})

function TechnicianDashboard() {
  const profile = useAuthStore((state) => state.profile)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {profile?.full_name}</h1>
        <p className="text-slate-600">Manage and resolve assigned tickets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">0</CardTitle>
            <CardDescription>Assigned Tickets</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">0</CardTitle>
            <CardDescription>In Progress</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">0</CardTitle>
            <CardDescription>Resolved</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Tickets</CardTitle>
          <CardDescription>No tickets assigned yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Tickets will appear here</p>
        </CardContent>
      </Card>
    </div>
  )
}

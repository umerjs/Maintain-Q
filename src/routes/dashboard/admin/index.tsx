import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/dashboard/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const profile = useAuthStore((state) => state.profile)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {profile?.full_name}</h1>
        <p className="text-slate-600">System overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">0</CardTitle>
            <CardDescription>Total Assets</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">0</CardTitle>
            <CardDescription>Open Tickets</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">0</CardTitle>
            <CardDescription>Users</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">0</CardTitle>
            <CardDescription>Resolved Today</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
            <CardDescription>Management tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 font-medium">
              Manage Assets
            </button>
            <button className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 font-medium">
              Manage Tickets
            </button>
            <button className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 font-medium">
              Manage Users
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>System metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Analytics will appear here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

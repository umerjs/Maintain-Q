import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/dashboard/student/')({
  component: StudentDashboard,
})

function StudentDashboard() {
  const profile = useAuthStore((state) => state.profile)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {profile?.full_name}</h1>
        <p className="text-slate-600">Manage your asset reports and track their status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 font-medium">
              Scan QR Code
            </button>
            <button className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 font-medium">
              Report an Issue
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Reports</CardTitle>
            <CardDescription>No reports yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Reports will appear here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

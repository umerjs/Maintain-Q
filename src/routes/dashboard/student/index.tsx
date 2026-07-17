import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, FileText, ClipboardList, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/dashboard/student/')({
  component: StudentDashboard,
})

function StudentDashboard() {
  const profile = useAuthStore((state) => state.profile)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {profile?.full_name || profile?.name} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Scan a QR code on any asset to view its details or report an issue.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col items-center text-center p-5 bg-blue-50 rounded-xl border border-blue-100">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-3">
            <span className="text-white font-bold text-sm">1</span>
          </div>
          <QrCode className="w-6 h-6 text-blue-600 mb-2" />
          <p className="text-sm font-semibold text-slate-900">Scan QR Code</p>
          <p className="text-xs text-slate-500 mt-1">Use your phone camera on any tagged asset</p>
        </div>
        <div className="flex flex-col items-center text-center p-5 bg-amber-50 rounded-xl border border-amber-100">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center mb-3">
            <span className="text-white font-bold text-sm">2</span>
          </div>
          <FileText className="w-6 h-6 text-amber-600 mb-2" />
          <p className="text-sm font-semibold text-slate-900">Report Issue</p>
          <p className="text-xs text-slate-500 mt-1">Describe the problem and set severity</p>
        </div>
        <div className="flex flex-col items-center text-center p-5 bg-green-50 rounded-xl border border-green-100">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mb-3">
            <span className="text-white font-bold text-sm">3</span>
          </div>
          <ClipboardList className="w-6 h-6 text-green-600 mb-2" />
          <p className="text-sm font-semibold text-slate-900">Track Status</p>
          <p className="text-xs text-slate-500 mt-1">Follow your report until it's resolved</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="w-4 h-4 text-blue-600" />
              Scan an Asset
            </CardTitle>
            <CardDescription>Navigate to any asset's QR URL to view details and report issues</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400 bg-slate-50 rounded p-2 font-mono">
              /asset/&#123;QR-CODE-ID&#125;
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Point your camera at the QR code on any physical asset to open its page directly.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                My Reports
              </CardTitle>
              <Link to="/dashboard/student/my-reports" className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <CardDescription>Track all issue reports you've submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 text-center py-4">
              No reports yet. Scan a QR code to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

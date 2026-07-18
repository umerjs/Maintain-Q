import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { getStudentTickets } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QrCode, FileText, ClipboardList, ArrowRight, Loader2, CheckCircle2, Clock } from 'lucide-react'

export const Route = createFileRoute('/dashboard/student/')({
  component: StudentDashboard,
})

const statusColor: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  assigned: 'bg-violet-100 text-violet-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  escalated: 'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-700',
}

const statusStep: Record<string, number> = {
  open: 1, assigned: 2, in_progress: 3, escalated: 3, resolved: 4, rejected: 4,
}

function MiniTracker({ status }: { status: string }) {
  const step = statusStep[status] ?? 1
  const steps = ['Reported', 'Assigned', 'In Progress', 'Resolved']
  return (
    <div className="flex items-center gap-1 mt-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${
              i < step ? (status === 'rejected' && i === step - 1 ? 'bg-red-400' : 'bg-blue-500') : 'bg-slate-200'
            }`}
          />
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-4 ${i < step - 1 ? 'bg-blue-400' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
      <span className="ml-1 text-[10px] text-slate-500 capitalize">{status.replace(/_/g, ' ')}</span>
    </div>
  )
}

function StudentDashboard() {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  const open = tickets.filter((t) => ['open', 'assigned', 'in_progress'].includes(t.status)).length
  const resolved = tickets.filter((t) => t.status === 'resolved').length
  const recentTickets = tickets.slice(0, 4)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {profile?.full_name || (profile as any)?.name} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Scan a QR code on any asset to report an issue.</p>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Reports', value: loading ? '…' : tickets.length, icon: FileText,   color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Active',        value: loading ? '…' : open,           icon: Clock,       color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Resolved',      value: loading ? '…' : resolved,       icon: CheckCircle2,color: 'bg-green-50 border-green-200 text-green-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`rounded-xl border p-4 text-center ${color}`}>
            <Icon className="w-5 h-5 mx-auto mb-1 opacity-70" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              step: '1', icon: QrCode, color: 'bg-blue-600', bg: 'bg-blue-50 border-blue-100',
              label: 'Scan QR Code', desc: 'Point your camera at the QR tag on any physical asset.',
            },
            {
              step: '2', icon: FileText, color: 'bg-amber-500', bg: 'bg-amber-50 border-amber-100',
              label: 'Report Issue', desc: 'Describe the problem. AI suggests category & severity.',
            },
            {
              step: '3', icon: ClipboardList, color: 'bg-green-600', bg: 'bg-green-50 border-green-100',
              label: 'Track Progress', desc: 'Follow your ticket from assignment to resolution.',
            },
          ].map(({ step, icon: Icon, color, bg, label, desc }) => (
            <div key={step} className={`flex items-start gap-3 p-4 rounded-xl border ${bg}`}>
              <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center shrink-0`}>
                <span className="text-white font-bold text-sm">{step}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scan hint + Recent reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Scan an Asset</p>
              <p className="text-xs text-slate-500 mt-1">Navigate to <code className="bg-white border rounded px-1 font-mono">/asset/ASSET-001</code></p>
              <p className="text-xs text-slate-400 mt-1">or scan the QR code on the physical asset</p>
            </div>
            <Link to="/asset/ASSET-001">
              <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 mt-1">
                <QrCode className="w-3.5 h-3.5" /> Try Demo Asset
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" /> Recent Reports
              </CardTitle>
              <Link to="/dashboard/student/my-reports">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-blue-600 h-7 px-2">
                  Track all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            <CardDescription className="text-xs">
              {loading ? 'Loading…' : `${tickets.length} total · ${open} active · ${resolved} resolved`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
              </div>
            ) : recentTickets.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No reports yet</p>
                <p className="text-xs mt-0.5">Scan a QR code to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800 truncate flex-1">{ticket.title}</p>
                      <Badge className={`text-[10px] shrink-0 ${statusColor[ticket.status] ?? ''}`}>
                        {ticket.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <MiniTracker status={ticket.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { getAssetByQRCode } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export const Route = createFileRoute('/asset/$qrCodeId')({
  component: AssetPage,
})

function AssetPage() {
  const { qrCodeId } = Route.useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [asset, setAsset] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const data = await getAssetByQRCode(qrCodeId)
        if (!data) {
          setError('Asset not found')
        } else {
          setAsset(data)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load asset'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchAsset()
  }, [qrCodeId])

  const statusColor = {
    working: 'bg-green-100 text-green-800',
    under_repair: 'bg-yellow-100 text-yellow-800',
    out_of_service: 'bg-red-100 text-red-800',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading asset...</p>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Asset Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">{error || 'The asset you are looking for does not exist.'}</p>
            <Button onClick={() => navigate({ to: '/' })} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/' })}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back
          </button>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-600">MaintainIQ</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">{asset.name}</CardTitle>
                <CardDescription>{asset.category}</CardDescription>
              </div>
              <Badge className={statusColor[asset.status as keyof typeof statusColor]}>
                {asset.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Location</p>
                <p className="text-lg text-slate-900">{asset.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">QR Code ID</p>
                <p className="text-lg font-mono text-slate-900">{asset.qr_code_id}</p>
              </div>
            </div>

            {asset.notes && (
              <div>
                <p className="text-sm font-medium text-slate-600">Notes</p>
                <p className="text-slate-900">{asset.notes}</p>
              </div>
            )}

            {user ? (
              <Button
                onClick={() => navigate({ to: `/report-issue/${asset.id}` })}
                className="w-full"
              >
                Report Issue
              </Button>
            ) : (
              <Button
                onClick={() => navigate({ to: '/login' })}
                className="w-full"
              >
                Sign In to Report Issue
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
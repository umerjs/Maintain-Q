// src/routes/dashboard/admin/add-asset.tsx
import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { createAsset } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'

export const Route = createFileRoute('/dashboard/admin/add-asset')({
  component: AddAssetPage,
})

function AddAssetPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    qr_code_id: '',
    name: '',
    category: 'other',
    location: '',
    status: 'working',
    notes: '',
  })
  const [qrGenerated, setQrGenerated] = useState(false)

  const generateQRCode = () => {
    if (!formData.qr_code_id.trim()) {
      toast.error('Please enter a QR Code ID')
      return
    }
    setQrGenerated(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.qr_code_id.trim() || !formData.name.trim() || !formData.location.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      await createAsset({
        qr_code_id: formData.qr_code_id,
        name: formData.name,
        category: formData.category,
        location: formData.location,
        status: formData.status as any,
        notes: formData.notes,
      })

      toast.success('Asset created successfully!')
      navigate({ to: '/dashboard/admin/assets' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create asset'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Register Asset</h1>
        <p className="text-slate-600 mt-2">Add a new asset to the system</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
            <CardDescription>Enter asset details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="qr_code_id">QR Code ID *</Label>
                <Input
                  id="qr_code_id"
                  placeholder="e.g., ASSET-001"
                  value={formData.qr_code_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, qr_code_id: e.target.value }))}
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Elevator"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elevator">Elevator</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="laboratory">Laboratory</SelectItem>
                    <SelectItem value="fire_safety">Fire Safety</SelectItem>
                    <SelectItem value="power">Power</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., Building A, Lobby"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="working">Working</SelectItem>
                    <SelectItem value="under_repair">Under Repair</SelectItem>
                    <SelectItem value="out_of_service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this asset"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  disabled={submitting}
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Creating...' : 'Create Asset'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code Preview</CardTitle>
            <CardDescription>Generate and download QR code</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            {qrGenerated && formData.qr_code_id ? (
              <>
                <QRCodeSVG value={formData.qr_code_id} size={200} />
                <Button
                  variant="outline"
                  onClick={() => {
                    const qrCanvas = document.querySelector('canvas')
                    if (qrCanvas) {
                      const link = document.createElement('a')
                      link.href = qrCanvas.toDataURL()
                      link.download = `${formData.qr_code_id}.png`
                      link.click()
                    }
                  }}
                >
                  Download QR Code
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={generateQRCode} disabled={!formData.qr_code_id.trim()}>
                Generate QR Code
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

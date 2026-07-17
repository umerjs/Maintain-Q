// src/routes/dashboard/student/report-issue.tsx
import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { createTicket, getAllAssets, suggestCategoryAndSeverity } from '@/lib/db'
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

export const Route = createFileRoute('/dashboard/student/report-issue')({
  component: ReportIssuePage,
})

function ReportIssuePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    asset_id: '',
    title: '',
    description: '',
    category: 'other',
    severity: 'medium',
  })

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const data = await getAllAssets()
        setAssets(data)
      } catch (error) {
        toast.error('Failed to load assets')
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [])

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const description = e.target.value
    setFormData((prev) => ({ ...prev, description }))

    // Auto-suggest category and severity
    if (description.length > 10) {
      const { category, severity } = suggestCategoryAndSeverity(description)
      setFormData((prev) => ({ ...prev, category, severity }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      await createTicket({
        asset_id: formData.asset_id || undefined,
        reported_by: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity as any,
        status: 'open',
      })

      toast.success('Ticket created successfully!')
      navigate({ to: '/dashboard/student/my-reports' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create ticket'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Report an Issue</h1>
        <p className="text-slate-600 mt-2">Create a new maintenance ticket</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Issue Details</CardTitle>
          <CardDescription>Describe the problem you're experiencing</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="asset">Asset (Optional)</Label>
              <Select value={formData.asset_id} onValueChange={(value) => setFormData((prev) => ({ ...prev, asset_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief summary of the issue"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                disabled={submitting}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed description (AI will auto-suggest category & severity)"
                value={formData.description}
                onChange={handleDescriptionChange}
                disabled={submitting}
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="display">Display</SelectItem>
                    <SelectItem value="keyboard">Keyboard</SelectItem>
                    <SelectItem value="mouse">Mouse</SelectItem>
                    <SelectItem value="power">Power</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={formData.severity} onValueChange={(value) => setFormData((prev) => ({ ...prev, severity: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/lib/auth-store'
import { createTicket, suggestCategoryAndSeverity, getAssetById } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export const Route = createFileRoute('/report-issue/$assetId')({
  component: ReportIssuePage,
})

const reportIssueSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
})

type ReportIssueFormData = z.infer<typeof reportIssueSchema>

function ReportIssuePage() {
  const { assetId } = Route.useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [asset, setAsset] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [suggestion, setSuggestion] = useState<any>(null)

  const form = useForm<ReportIssueFormData>({
    resolver: zodResolver(reportIssueSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      severity: 'medium',
    },
  })

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        if (!user) {
          navigate({ to: '/login' })
          return
        }
        const data = await getAssetById(assetId)
        if (!data) {
          toast.error('Asset not found')
          navigate({ to: '/' })
        } else {
          setAsset(data)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load asset'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    fetchAsset()
  }, [assetId, user, navigate])

  const description = form.watch('description')

  useEffect(() => {
    if (description.length > 10) {
      const suggested = suggestCategoryAndSeverity(description)
      setSuggestion(suggested)
      if (!form.getValues('category')) {
        form.setValue('category', suggested.category)
      }
      if (!form.getValues('severity') || form.getValues('severity') === 'medium') {
        form.setValue('severity', suggested.severity)
      }
    }
  }, [description, form])

  const onSubmit = async (data: ReportIssueFormData) => {
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    setSubmitting(true)
    try {
      await createTicket({
        asset_id: assetId,
        reported_by: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        severity: data.severity as 'low' | 'medium' | 'high' | 'critical',
        status: 'open',
      })
      toast.success('Issue reported successfully!')
      navigate({ to: '/dashboard/student' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to report issue'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading...</p>
      </div>
    )
  }

  if (!asset) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate({ to: `/asset/${asset.qr_code_id}` })}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Asset
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Issue</CardTitle>
            <CardDescription>Asset: {asset.name}</CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of the issue" {...field} disabled={submitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the issue in detail..."
                          rows={5}
                          {...field}
                          disabled={submitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {suggestion && (
                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">💡 Smart Suggestion</p>
                    <p className="text-xs text-blue-700 mb-2">Based on your description, we suggest:</p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{suggestion.category}</Badge>
                      <Badge variant="secondary">{suggestion.severity}</Badge>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value || ''} onValueChange={field.onChange} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
                      <Select value={field.value || 'medium'} onValueChange={field.onChange} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Reporting...' : 'Report Issue'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
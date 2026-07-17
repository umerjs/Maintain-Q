import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '@/lib/auth-store'
import { getAllAssets, createAsset, updateAsset, deleteAsset } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

export const Route = createFileRoute('/dashboard/admin/assets')({
  component: AdminAssetsPage,
})

const assetSchema = z.object({
  qr_code_id: z.string().min(1, 'QR Code ID required'),
  name: z.string().min(1, 'Asset name required'),
  category: z.string().min(1, 'Category required'),
  location: z.string().min(1, 'Location required'),
  status: z.enum(['working', 'under_repair', 'out_of_service']),
  notes: z.string().optional(),
})

type AssetFormData = z.infer<typeof assetSchema>

const statusColor = {
  working: 'bg-green-100 text-green-800',
  under_repair: 'bg-yellow-100 text-yellow-800',
  out_of_service: 'bg-red-100 text-red-800',
}

function AdminAssetsPage() {
  const user = useAuthStore((state) => state.user)
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      qr_code_id: '',
      name: '',
      category: '',
      location: '',
      status: 'working',
      notes: '',
    },
  })

  useEffect(() => {
    const fetchAssets = async () => {
      if (!user) return
      try {
        const data = await getAllAssets()
        setAssets(data)
      } catch (error) {
        console.error('Failed to fetch assets:', error)
        toast.error('Failed to load assets')
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [user])

  const onSubmit = async (data: AssetFormData) => {
    setSubmitting(true)
    try {
      if (editingId) {
        await updateAsset(editingId, data)
        setAssets(assets.map((a) => (a.id === editingId ? { ...a, ...data } : a)))
        toast.success('Asset updated')
      } else {
        const newAsset = await createAsset(data)
        setAssets([newAsset, ...assets])
        toast.success('Asset created')
      }
      setOpen(false)
      form.reset()
      setEditingId(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save asset'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return
    try {
      await deleteAsset(id)
      setAssets(assets.filter((a) => a.id !== id))
      toast.success('Asset deleted')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete asset'
      toast.error(message)
    }
  }

  const handleEdit = (asset: any) => {
    setEditingId(asset.id)
    form.reset(asset)
    setOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Assets Management</h1>
          <p className="text-slate-600">Add and manage inventory</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null)
                form.reset()
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
              <DialogDescription>Create or update an asset in the system</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="qr_code_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>QR Code ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ASSET-001" {...field} disabled={submitting || !!editingId} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Dell Monitor" {...field} disabled={submitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Computer" {...field} disabled={submitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lab A, Room 201" {...field} disabled={submitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="working">Working</SelectItem>
                          <SelectItem value="under_repair">Under Repair</SelectItem>
                          <SelectItem value="out_of_service">Out of Service</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Any additional notes" {...field} disabled={submitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Update Asset' : 'Create Asset'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No assets yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assets.map((asset) => (
            <Card key={asset.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{asset.name}</CardTitle>
                    <CardDescription>{asset.category}</CardDescription>
                  </div>
                  <Badge className={statusColor[asset.status as keyof typeof statusColor]}>
                    {asset.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-slate-600">QR Code ID</p>
                    <p className="font-mono text-slate-900">{asset.qr_code_id}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Location</p>
                    <p className="text-slate-900">{asset.location}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Created</p>
                    <p className="text-slate-900">{new Date(asset.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(asset)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(asset.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
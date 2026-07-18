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
import { Loader2, Plus, Trash2, QrCode, Pencil, ExternalLink } from 'lucide-react'
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
import { QRCodeSVG } from 'qrcode.react'

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

const statusColor: Record<string, string> = {
  working: 'bg-green-100 text-green-800',
  under_repair: 'bg-yellow-100 text-yellow-800',
  out_of_service: 'bg-red-100 text-red-800',
}

function getAssetUrl(qrCodeId: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}/asset/${qrCodeId}`
}

function AdminAssetsPage() {
  const user = useAuthStore((state) => state.user)
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [qrAsset, setQrAsset] = useState<any | null>(null)

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

  const handlePrintQR = () => {
    window.print()
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
          <h1 className="text-2xl font-bold text-slate-900">Assets Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            {assets.length} asset{assets.length !== 1 ? 's' : ''} registered
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => { setEditingId(null); form.reset() }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
              <DialogDescription>
                {editingId
                  ? 'Update asset details. QR Code ID cannot be changed.'
                  : 'Register a new asset. The QR Code ID will be used to generate a scannable code.'}
              </DialogDescription>
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

                <div className="grid grid-cols-2 gap-3">
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
                </div>

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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {submitting ? 'Saving...' : editingId ? 'Update Asset' : 'Create Asset'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Asset grid */}
      {assets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <QrCode className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No assets yet</p>
            <p className="text-slate-400 text-sm mt-1">Create your first asset to generate a QR code.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <Card key={asset.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-tight truncate">{asset.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{asset.category} · {asset.location}</CardDescription>
                  </div>
                  <Badge className={`text-xs shrink-0 ${statusColor[asset.status as keyof typeof statusColor] ?? 'bg-slate-100'}`}>
                    {asset.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-3">
                {/* QR ID */}
                <div className="flex items-center gap-2 text-xs bg-slate-50 rounded px-2.5 py-1.5 border border-slate-100">
                  <QrCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-700 truncate">{asset.qr_code_id}</span>
                </div>

                {asset.notes && (
                  <p className="text-xs text-slate-500 line-clamp-2">{asset.notes}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1.5"
                    onClick={() => setQrAsset(asset)}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR Code
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => handleEdit(asset)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleDelete(asset.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={!!qrAsset} onOpenChange={(open) => { if (!open) setQrAsset(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code — {qrAsset?.name}</DialogTitle>
            <DialogDescription>
              Scan this code to view the asset page and report issues.
            </DialogDescription>
          </DialogHeader>

          {qrAsset && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="p-4 bg-white border-2 border-slate-200 rounded-xl">
                <QRCodeSVG
                  value={getAssetUrl(qrAsset.qr_code_id)}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="text-center space-y-1">
                <p className="font-mono text-sm font-semibold text-slate-700">{qrAsset.qr_code_id}</p>
                <p className="text-xs text-slate-400">{qrAsset.location}</p>
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded px-3 py-2">
                  <span className="text-xs text-slate-500 flex-1 truncate font-mono">
                    {getAssetUrl(qrAsset.qr_code_id)}
                  </span>
                  <button
                    className="text-blue-600 hover:underline text-xs shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(getAssetUrl(qrAsset.qr_code_id))
                      toast.success('URL copied!')
                    }}
                  >
                    Copy
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handlePrintQR}>
                    Print QR
                  </Button>
                  <a href={getAssetUrl(qrAsset.qr_code_id)} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Page
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

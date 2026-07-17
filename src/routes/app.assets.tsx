import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type AssetStatus } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssetStatusBadge } from "@/components/badges";
import { QRCodeSVG } from "qrcode.react";
import { Grid3x3, List, Plus, Search, MapPin, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/assets")({ component: AssetsPage });

function AssetsPage() {
  const assets = useStore((s) => s.assets);
  const categories = useStore((s) => s.categories);
  const addAsset = useStore((s) => s.addAsset);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [status, setStatus] = useState<AssetStatus>("Active");

  const filtered = assets.filter((a) => {
    if (cat !== "all" && a.category !== cat) return false;
    if (q && !(`${a.name} ${a.id} ${a.location}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  const reset = () => {
    setName(""); setCategory(""); setLocation(""); setDescription("");
    setInstallationDate(""); setManufacturer(""); setModelNumber(""); setStatus("Active");
  };

  const submit = () => {
    if (!name || !category || !location) { toast.error("Name, category, and location are required"); return; }
    const a = addAsset({ name, category, location, description, installationDate, manufacturer, modelNumber, status });
    toast.success(`Added ${a.id}`);
    reset(); setOpen(false);
  };

  const reportUrl = (id: string) => `${typeof window !== "undefined" ? window.location.origin : ""}/report/${id}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-sm text-muted-foreground">{assets.length} assets · Every one has a QR identity.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1.5 h-4 w-4" /> Add Asset</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add a new asset</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HVAC Unit 4" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as AssetStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Location *</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Roof, Block C" /></div>
              <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Manufacturer</Label><Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} /></div>
                <div><Label>Model #</Label><Input value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} /></div>
              </div>
              <div><Label>Installation Date</Label><Input type="date" value={installationDate} onChange={(e) => setInstallationDate(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit}>Create asset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assets…" className="pl-9" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex overflow-hidden rounded-md border">
          <Button size="icon" variant={view === "grid" ? "default" : "ghost"} className="h-9 w-9 rounded-none" onClick={() => setView("grid")}><Grid3x3 className="h-4 w-4" /></Button>
          <Button size="icon" variant={view === "list" ? "default" : "ghost"} className="h-9 w-9 rounded-none" onClick={() => setView("list")}><List className="h-4 w-4" /></Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <div className="text-muted-foreground">No assets match your filters.</div>
        </CardContent></Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a.id} className="group transition hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-muted-foreground">{a.id}</div>
                    <h3 className="mt-0.5 truncate font-semibold">{a.name}</h3>
                    <div className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">{a.category}</div>
                  </div>
                  <div className="rounded-md border bg-white p-1.5">
                    <QRCodeSVG value={reportUrl(a.id)} size={56} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {a.location}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <AssetStatusBadge status={a.status} />
                  <Link to="/app/assets/$assetId" params={{ assetId: a.id }} className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline">
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Asset</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Location</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{a.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{a.id}</div>
                  </td>
                  <td className="px-4 py-2.5">{a.category}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{a.location}</td>
                  <td className="px-4 py-2.5"><AssetStatusBadge status={a.status} /></td>
                  <td className="px-4 py-2.5 text-right">
                    <Link to="/app/assets/$assetId" params={{ assetId: a.id }} className="text-sm font-medium text-primary hover:underline">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      )}
    </div>
  );
}

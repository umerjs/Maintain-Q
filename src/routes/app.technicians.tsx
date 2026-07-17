import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Mail, Phone, Wrench } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/technicians")({ component: TechniciansPage });

function TechniciansPage() {
  const technicians = useStore((s) => s.technicians);
  const issues = useStore((s) => s.issues);
  const addTechnician = useStore((s) => s.addTechnician);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [spec, setSpec] = useState("");

  const submit = () => {
    if (!name || !email || !spec) { toast.error("Name, email, and specialization required"); return; }
    addTechnician({ name, email, phone, specialization: spec });
    toast.success("Technician added");
    setName(""); setEmail(""); setPhone(""); setSpec(""); setOpen(false);
  };

  const stats = (id: string) => {
    const active = issues.filter((i) => i.assignedTo === id && i.status !== "Resolved").length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const doneMonth = issues.filter((i) => i.assignedTo === id && i.status === "Resolved" && i.resolvedAt && new Date(i.resolvedAt) >= monthStart).length;
    const resolved = issues.filter((i) => i.assignedTo === id && i.resolvedAt);
    const avg = resolved.length
      ? Math.round(resolved.reduce((sum, i) => sum + (+new Date(i.resolvedAt!) - +new Date(i.reportedAt)) / 3600000, 0) / resolved.length)
      : 0;
    return { active, doneMonth, avg };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Technicians</h1>
          <p className="text-sm text-muted-foreground">Your maintenance team.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" /> Add Technician</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add a technician</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><Label>Specialization *</Label><Input value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="e.g. Plumbing + HVAC" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit}>Add technician</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {technicians.map((t) => {
          const s = stats(t.id);
          return (
            <Card key={t.id}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                    {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{t.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{t.specialization}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {t.email}</div>
                  {t.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {t.phone}</div>}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center">
                  <div><div className="text-lg font-bold text-warning-foreground">{s.active}</div><div className="text-[10px] uppercase text-muted-foreground">Active</div></div>
                  <div><div className="text-lg font-bold text-success">{s.doneMonth}</div><div className="text-[10px] uppercase text-muted-foreground">Done/mo</div></div>
                  <div><div className="text-lg font-bold">{s.avg}h</div><div className="text-[10px] uppercase text-muted-foreground">Avg</div></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {technicians.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="py-14 text-center">
              <Wrench className="mx-auto h-10 w-10 text-muted-foreground" />
              <div className="mt-3 font-medium">No technicians yet</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

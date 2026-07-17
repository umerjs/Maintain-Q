import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { MapPin, PlayCircle, CheckCircle2, Upload, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/app/my-jobs")({ component: MyJobs });

function MyJobs() {
  const auth = useStore((s) => s.auth);
  const issues = useStore((s) => s.issues);
  const assets = useStore((s) => s.assets);
  const technicians = useStore((s) => s.technicians);
  const updateIssue = useStore((s) => s.updateIssue);

  // Map current auth user to a technician. If none matches by email, default to first technician for demo.
  const me = technicians.find((t) => t.email === auth?.email) ?? technicians[0];

  const [resolveFor, setResolveFor] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();

  const mine = issues.filter((i) => i.assignedTo === me?.id && i.status !== "Resolved")
    .sort((a, b) => {
      const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 } as const;
      return rank[b.priority] - rank[a.priority];
    });

  const start = (id: string) => {
    updateIssue(id, { status: "In Progress" }, me?.name ?? "Technician", "Started work");
    toast.success("Marked in progress");
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setPhoto(r.result as string); r.readAsDataURL(f);
  };

  const complete = () => {
    if (!resolveFor) return;
    updateIssue(resolveFor, { status: "Resolved", resolvedAt: new Date().toISOString(), resolutionNotes: notes, photoUrl: photo }, me?.name ?? "Technician", "Completed job");
    toast.success("Job completed");
    setResolveFor(null); setNotes(""); setPhoto(undefined);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Technician view</div>
        <h1 className="text-2xl font-bold tracking-tight">My Assigned Jobs</h1>
        <p className="text-sm text-muted-foreground">{mine.length} open · Sorted by priority.</p>
      </div>

      {mine.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <div className="mt-3 font-medium">All caught up.</div>
          <div className="text-sm text-muted-foreground">No open jobs assigned to you.</div>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {mine.map((i) => {
            const asset = assets.find((a) => a.id === i.assetId);
            return (
              <Card key={i.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{i.id}</span>
                        <PriorityBadge priority={i.priority} />
                        <StatusBadge status={i.status} />
                      </div>
                      <div className="mt-2 font-semibold">{i.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{i.description}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{asset?.name}</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {asset?.location}</span>
                        {i.dueDate && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Due {format(new Date(i.dueDate), "MMM d")}</span>}
                        <span>Reported {formatDistanceToNow(new Date(i.reportedAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {i.status === "Open" && <Button size="sm" variant="outline" onClick={() => start(i.id)}><PlayCircle className="mr-1.5 h-4 w-4" /> Start Work</Button>}
                      <Button size="sm" onClick={() => { setResolveFor(i.id); setNotes(""); setPhoto(undefined); }}><CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark Complete</Button>
                      {asset && <Link to="/app/assets/$assetId" params={{ assetId: asset.id }} className="text-center text-xs font-medium text-primary hover:underline">View history</Link>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!resolveFor} onOpenChange={(o) => !o && setResolveFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Complete job</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Resolution notes *</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="What did you do to resolve it?" /></div>
            <div>
              <Label>Photo evidence (optional)</Label>
              <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-5 text-sm text-muted-foreground hover:border-primary/40">
                <Upload className="h-4 w-4" /> {photo ? "Photo attached" : "Upload a photo"}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
              {photo && <img src={photo} alt="" className="mt-2 max-h-40 rounded border" />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveFor(null)}>Cancel</Button>
            <Button onClick={complete} disabled={!notes.trim()}>Confirm complete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, helpersForRequest } from "@/data/mockData";
import { aiSummary } from "@/lib/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UrgencyBadge, StatusBadge } from "@/components/badges";
import { ArrowLeft, Bot, CheckCircle2, HandHelping, MapPin, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/app/requests/$requestId")({
  component: RequestDetailPage,
});

function RequestDetailPage() {
  const { requestId } = Route.useParams();
  const nav = useNavigate();
  const auth = useStore((s) => s.auth);
  const profile = useStore((s) => s.profile);
  const requests = useStore((s) => s.requests);
  const helpers = useStore((s) => s.helpers);
  const offerHelp = useStore((s) => s.offerHelp);
  const markSolved = useStore((s) => s.markSolved);

  const request = requests.find((r) => r.id === requestId);
  const offered = useMemo(() => (request ? helpersForRequest(helpers, request.helperIds) : []), [request, helpers]);
  const [solveOpen, setSolveOpen] = useState(false);
  const [notes, setNotes] = useState("");

  if (!request) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Request not found.</p>
        <Button variant="outline" onClick={() => nav({ to: "/app/explore" })}>Back to Explore</Button>
      </div>
    );
  }

  const meHelper = helpers.find((h) => h.email === auth?.email);
  const helperId = meHelper?.id ?? auth?.id ?? "local-helper";
  const helperName = auth?.name ?? meHelper?.name ?? "Helper";
  const alreadyOffered = request.helperIds.includes(helperId) || request.helperIds.includes(meHelper?.id ?? "");
  const canOffer = auth?.role === "Technician" || auth?.role === "Admin";
  const canSolve = alreadyOffered || auth?.role === "Admin" || request.reporterId === auth?.id || request.reporterName === auth?.name;

  const onOffer = () => {
    offerHelp(request.id, helperId, helperName);
    toast.success("You offered to help!");
  };

  const onSolve = () => {
    markSolved(request.id, helperName, notes);
    setSolveOpen(false);
    setNotes("");
    toast.success("Marked as solved");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <button onClick={() => nav({ to: "/app/explore" })} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Explore
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{request.id}</span>
            <UrgencyBadge urgency={request.urgency} />
            <StatusBadge status={request.status} />
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{request.title}</h1>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>{request.category}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {request.location || "Anywhere"}</span>
            {request.reporterName && <span>Posted by {request.reporterName}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canOffer && request.status !== "Solved" && !alreadyOffered && (
            <Button onClick={onOffer}><HandHelping className="mr-1.5 h-4 w-4" /> I can help</Button>
          )}
          {canSolve && request.status !== "Solved" && (
            <Button variant="outline" onClick={() => setSolveOpen(true)}><CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark as solved</Button>
          )}
          <Link to="/app/messages">
            <Button variant="ghost"><MessageCircle className="mr-1.5 h-4 w-4" /> Message</Button>
          </Link>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4 text-primary" /> AI Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{aiSummary(request)}</CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{request.description}</p>
            {request.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {request.tags.map((t) => <span key={t} className="rounded-full border px-2.5 py-0.5 text-xs">{t}</span>)}
              </div>
            )}
            {request.resolutionNotes && (
              <div className="rounded-md border border-success/30 bg-success/5 p-3 text-sm">
                <span className="font-medium text-success">Resolution:</span> {request.resolutionNotes}
              </div>
            )}
            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Activity</div>
              <ol className="space-y-2 border-l pl-4">
                {request.activity.slice().reverse().map((a) => (
                  <li key={a.id} className="relative text-sm">
                    <span className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                    <div className="font-medium">{a.action}</div>
                    <div className="text-xs text-muted-foreground">{a.who} · {format(new Date(a.at), "MMM d, yyyy · HH:mm")}</div>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Helpers who offered ({offered.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {offered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one has offered yet.</p>
            ) : offered.map((h) => (
              <div key={h.id} className="rounded-md border p-3">
                <div className="font-medium">{h.name}</div>
                <div className="text-xs text-muted-foreground">Trust {h.trustScore} · {h.skills.slice(0, 3).join(", ")}</div>
                {h.badges.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {h.badges.map((b) => <span key={b} className="rounded-full border px-2 py-0.5 text-[10px]">{b}</span>)}
                  </div>
                )}
              </div>
            ))}
            <div className="text-xs text-muted-foreground">Skills needed: {request.skillsNeeded.join(", ") || "Any"}</div>
            <div className="text-xs text-muted-foreground">Your trust: {profile.trustScore}</div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={solveOpen} onOpenChange={setSolveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark as solved</DialogTitle></DialogHeader>
          <div>
            <Label>Resolution notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="What helped resolve this?" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSolveOpen(false)}>Cancel</Button>
            <Button onClick={onSolve}>Confirm solved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

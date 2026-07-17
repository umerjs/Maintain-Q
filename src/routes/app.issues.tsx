import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore, techName, type IssueStatus, type Priority, type Issue } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { Search, ArrowUpDown, CheckCircle2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/app/issues")({ component: IssuesPage });

type SortKey = "reportedAt" | "priority" | "status";
const priorityRank: Record<Priority, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

function IssuesPage() {
  const issues = useStore((s) => s.issues);
  const assets = useStore((s) => s.assets);
  const technicians = useStore((s) => s.technicians);
  const updateIssue = useStore((s) => s.updateIssue);

  const [tab, setTab] = useState<"All" | IssueStatus>("All");
  const [q, setQ] = useState("");
  const [assetFilter, setAssetFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [techFilter, setTechFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("reportedAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const now = new Date();
  const isOverdue = (i: Issue) => i.dueDate && i.status !== "Resolved" && new Date(i.dueDate) < now;

  const filtered = useMemo(() => {
    let arr = issues.slice();
    if (tab === "Overdue") arr = arr.filter(isOverdue);
    else if (tab !== "All") arr = arr.filter((i) => i.status === tab);
    if (assetFilter !== "all") arr = arr.filter((i) => i.assetId === assetFilter);
    if (priorityFilter !== "all") arr = arr.filter((i) => i.priority === priorityFilter);
    if (techFilter !== "all") arr = arr.filter((i) => (techFilter === "unassigned" ? !i.assignedTo : i.assignedTo === techFilter));
    if (q) arr = arr.filter((i) => `${i.id} ${i.title} ${i.description}`.toLowerCase().includes(q.toLowerCase()));
    arr.sort((a, b) => {
      let diff = 0;
      if (sortKey === "reportedAt") diff = +new Date(a.reportedAt) - +new Date(b.reportedAt);
      else if (sortKey === "priority") diff = priorityRank[a.priority] - priorityRank[b.priority];
      else diff = a.status.localeCompare(b.status);
      return sortAsc ? diff : -diff;
    });
    return arr;
  }, [issues, tab, q, assetFilter, priorityFilter, techFilter, sortKey, sortAsc]);

  const getAsset = (id: string) => assets.find((a) => a.id === id);
  const toggleSort = (k: SortKey) => { if (sortKey === k) setSortAsc(!sortAsc); else { setSortKey(k); setSortAsc(false); } };

  const openIssue = openId ? issues.find((i) => i.id === openId) : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Issues</h1>
        <p className="text-sm text-muted-foreground">All reported issues across every asset.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="All">All ({issues.length})</TabsTrigger>
          <TabsTrigger value="Open">Open ({issues.filter((i) => i.status === "Open").length})</TabsTrigger>
          <TabsTrigger value="In Progress">In Progress ({issues.filter((i) => i.status === "In Progress").length})</TabsTrigger>
          <TabsTrigger value="Resolved">Resolved ({issues.filter((i) => i.status === "Resolved").length})</TabsTrigger>
          <TabsTrigger value="Overdue">Overdue ({issues.filter(isOverdue).length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search issues…" className="pl-9" />
        </div>
        <Select value={assetFilter} onValueChange={setAssetFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Asset" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assets</SelectItem>
            {assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {["Low","Medium","High","Critical"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={techFilter} onValueChange={setTechFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Technician" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All technicians</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {technicians.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card><CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">ID</th>
              <th className="px-4 py-2 font-medium">Asset</th>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium"><button className="inline-flex items-center gap-1" onClick={() => toggleSort("priority")}>Priority <ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-2 font-medium"><button className="inline-flex items-center gap-1" onClick={() => toggleSort("status")}>Status <ArrowUpDown className="h-3 w-3" /></button></th>
              <th className="px-4 py-2 font-medium">Assigned</th>
              <th className="px-4 py-2 font-medium"><button className="inline-flex items-center gap-1" onClick={() => toggleSort("reportedAt")}>Reported <ArrowUpDown className="h-3 w-3" /></button></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-14 text-center text-muted-foreground">No issues match your filters.</td></tr>
            ) : filtered.map((i) => (
              <tr key={i.id} className="cursor-pointer border-t hover:bg-muted/40" onClick={() => setOpenId(i.id)}>
                <td className="px-4 py-2.5 font-mono text-xs">{i.id}</td>
                <td className="px-4 py-2.5">
                  <div className="font-medium">{getAsset(i.assetId)?.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{i.assetId}</div>
                </td>
                <td className="px-4 py-2.5">{i.title}</td>
                <td className="px-4 py-2.5"><PriorityBadge priority={i.priority} /></td>
                <td className="px-4 py-2.5">{isOverdue(i) ? <StatusBadge status="Overdue" /> : <StatusBadge status={i.status} />}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{techName(technicians, i.assignedTo)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{formatDistanceToNow(new Date(i.reportedAt), { addSuffix: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <IssueDetail issue={openIssue} onClose={() => setOpenId(null)} technicians={technicians} assets={assets} updateIssue={updateIssue} />
    </div>
  );
}

function IssueDetail({ issue, onClose, technicians, assets, updateIssue }: {
  issue: Issue | null | undefined;
  onClose: () => void;
  technicians: ReturnType<typeof useStore.getState>["technicians"];
  assets: ReturnType<typeof useStore.getState>["assets"];
  updateIssue: ReturnType<typeof useStore.getState>["updateIssue"];
}) {
  const [notes, setNotes] = useState("");
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  if (!issue) return null;
  const asset = assets.find((a) => a.id === issue.assetId);

  const changeStatus = (v: IssueStatus) => {
    updateIssue(issue.id, { status: v }, "Admin", `Changed status to ${v}`);
    toast.success(`Status updated to ${v}`);
  };
  const changePriority = (v: Priority) => {
    updateIssue(issue.id, { priority: v }, "Admin", `Changed priority to ${v}`);
    toast.success(`Priority set to ${v}`);
  };
  const assign = (techId: string) => {
    const val = techId === "unassigned" ? undefined : techId;
    updateIssue(issue.id, { assignedTo: val }, "Admin", val ? `Assigned to ${techName(technicians, val)}` : "Unassigned");
    toast.success("Assignment updated");
  };
  const setDue = (v: string) => {
    updateIssue(issue.id, { dueDate: v ? new Date(v).toISOString() : undefined }, "Admin", v ? `Due date set to ${format(new Date(v), "MMM d, yyyy")}` : "Due date cleared");
  };
  const addNote = () => {
    if (!notes.trim()) return;
    updateIssue(issue.id, { internalNotes: (issue.internalNotes ? issue.internalNotes + "\n" : "") + notes }, "Admin", "Added internal note");
    setNotes(""); toast.success("Note added");
  };
  const markResolved = () => {
    updateIssue(issue.id, {
      status: "Resolved", resolvedAt: new Date().toISOString(), resolutionNotes,
    }, "Admin", `Marked resolved: ${resolutionNotes || "no notes"}`);
    setResolveOpen(false); setResolutionNotes(""); onClose();
    toast.success("Issue resolved");
  };

  return (
    <Dialog open={!!issue} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{issue.id}</span>
            <PriorityBadge priority={issue.priority} />
            <StatusBadge status={issue.status} />
          </div>
          <DialogTitle className="text-xl">{issue.title}</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {asset?.name} · <span className="font-mono">{asset?.id}</span> · {asset?.location}
          </div>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">Description</div>
              <p className="mt-1 text-sm">{issue.description}</p>
            </div>
            {issue.photoUrl && (
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Photo evidence</div>
                <img src={issue.photoUrl} alt="evidence" className="mt-2 max-h-64 rounded-md border" />
              </div>
            )}
            {issue.reporterName && (
              <div className="text-sm text-muted-foreground">
                Reported by <span className="font-medium text-foreground">{issue.reporterName}</span>
                {issue.reporterContact && <> ({issue.reporterContact})</>}
              </div>
            )}
            {issue.resolutionNotes && (
              <div className="rounded-md border border-success/30 bg-success/5 p-3 text-sm">
                <span className="font-medium text-success">Resolution:</span> {issue.resolutionNotes}
              </div>
            )}

            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Internal notes (admin only)</div>
              {issue.internalNotes && <div className="mb-2 whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm">{issue.internalNotes}</div>}
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Add a private note…" />
              <Button size="sm" className="mt-2" onClick={addNote}>Add note</Button>
            </div>

            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Activity log</div>
              <ol className="space-y-2 border-l pl-4">
                {issue.activity.slice().reverse().map((a) => (
                  <li key={a.id} className="relative text-sm">
                    <span className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                    <div className="font-medium">{a.action}</div>
                    <div className="text-xs text-muted-foreground">{a.who} · {format(new Date(a.at), "MMM d, yyyy · HH:mm")}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="space-y-4 md:border-l md:pl-4">
            <div>
              <Label>Status</Label>
              <Select value={issue.status} onValueChange={(v) => changeStatus(v as IssueStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Open","In Progress","Resolved"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={issue.priority} onValueChange={(v) => changePriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Low","Medium","High","Critical"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign technician</Label>
              <Select value={issue.assignedTo ?? "unassigned"} onValueChange={assign}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {technicians.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="date" value={issue.dueDate ? issue.dueDate.slice(0, 10) : ""} onChange={(e) => setDue(e.target.value)} />
            </div>
            {issue.status !== "Resolved" && (
              <Button className="w-full" onClick={() => setResolveOpen(true)}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark Resolved
              </Button>
            )}
          </div>
        </div>

        <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Mark issue resolved</DialogTitle></DialogHeader>
            <div>
              <Label>Resolution notes</Label>
              <Textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} rows={4} placeholder="What was done to resolve it?" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
              <Button onClick={markResolved}>Confirm resolved</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

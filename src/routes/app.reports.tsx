import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, techName } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/app/reports")({ component: ReportsPage });

function ReportsPage() {
  const issues = useStore((s) => s.issues);
  const assets = useStore((s) => s.assets);
  const technicians = useStore((s) => s.technicians);
  const [from, setFrom] = useState(format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const filtered = useMemo(() => {
    const f = new Date(from); const t = new Date(to); t.setHours(23, 59, 59);
    return issues.filter((i) => { const d = new Date(i.reportedAt); return d >= f && d <= t; });
  }, [issues, from, to]);

  const stats = {
    total: filtered.length,
    resolved: filtered.filter((i) => i.status === "Resolved").length,
    open: filtered.filter((i) => i.status === "Open").length,
    critical: filtered.filter((i) => i.priority === "Critical").length,
  };

  const downloadCSV = (rows: (string | number | undefined)[][], filename: string) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const downloadPDF = (title: string, rows: string[][]) => {
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(`<html><head><title>${title}</title>
      <style>body{font-family:Inter,sans-serif;padding:30px;color:#0F172A}h1{margin:0 0 8px}small{color:#64748B}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}th,td{padding:8px;border-bottom:1px solid #E2E8F0;text-align:left}th{background:#F8FAFC}</style></head><body>
      <h1>${title}</h1><small>${format(new Date(from), "MMM d, yyyy")} – ${format(new Date(to), "MMM d, yyyy")}</small>
      <table>${rows.map((r, idx) => `<tr>${r.map((c) => idx === 0 ? `<th>${c}</th>` : `<td>${c}</td>`).join("")}</tr>`).join("")}</table>
      </body></html>`);
    w.document.close(); setTimeout(() => w.print(), 300);
  };

  const allIssuesRows = () => [
    ["ID", "Asset", "Title", "Priority", "Status", "Assigned", "Reported"],
    ...filtered.map((i) => [i.id, assets.find((a) => a.id === i.assetId)?.name ?? i.assetId, i.title, i.priority, i.status, techName(technicians, i.assignedTo), format(new Date(i.reportedAt), "yyyy-MM-dd")]),
  ];

  const techPerfRows = () => {
    const rows: string[][] = [["Technician", "Active", "Resolved", "Avg Hours"]];
    technicians.forEach((t) => {
      const mine = filtered.filter((i) => i.assignedTo === t.id);
      const active = mine.filter((i) => i.status !== "Resolved").length;
      const done = mine.filter((i) => i.resolvedAt);
      const avg = done.length ? Math.round(done.reduce((s, i) => s + (+new Date(i.resolvedAt!) - +new Date(i.reportedAt)) / 3600000, 0) / done.length) : 0;
      rows.push([t.name, String(active), String(done.length), `${avg}h`]);
    });
    return rows;
  };

  const assetHealthRows = () => {
    const rows: string[][] = [["Asset", "Category", "Location", "Status", "Issues", "Open"]];
    assets.forEach((a) => {
      const its = filtered.filter((i) => i.assetId === a.id);
      rows.push([a.name, a.category, a.location, a.status, String(its.length), String(its.filter((i) => i.status !== "Resolved").length)]);
    });
    return rows;
  };

  const overdueRows = () => {
    const now = new Date();
    const overdue = filtered.filter((i) => i.dueDate && i.status !== "Resolved" && new Date(i.dueDate) < now);
    return [["ID", "Asset", "Title", "Priority", "Assigned", "Due"], ...overdue.map((i) => [i.id, assets.find((a) => a.id === i.assetId)?.name ?? i.assetId, i.title, i.priority, techName(technicians, i.assignedTo), format(new Date(i.dueDate!), "yyyy-MM-dd")])];
  };

  const reports = [
    { title: "All Issues Report", get: allIssuesRows },
    { title: "Technician Performance Report", get: techPerfRows },
    { title: "Asset Health Report", get: assetHealthRows },
    { title: "Overdue Tasks Report", get: overdueRows },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Export operational data for the selected period.</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Issues" value={stats.total} />
        <StatCard label="Resolved" value={stats.resolved} />
        <StatCard label="Open" value={stats.open} />
        <StatCard label="Critical" value={stats.critical} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.title}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> {r.title}</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadPDF(r.title, r.get())}><FileDown className="mr-1.5 h-4 w-4" /> PDF</Button>
              <Button variant="outline" size="sm" onClick={() => downloadCSV(r.get(), `${r.title.toLowerCase().replace(/ /g, "-")}.csv`)}><FileDown className="mr-1.5 h-4 w-4" /> CSV</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card><CardContent className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </CardContent></Card>
  );
}

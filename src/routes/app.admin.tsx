import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UrgencyBadge, StatusBadge } from "@/components/badges";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar } from "recharts";
import { Trash2, FileDown } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin")({ component: AdminPage });

const COLORS = ["oklch(0.62 0.22 25)", "oklch(0.76 0.16 70)", "oklch(0.68 0.15 158)", "oklch(0.53 0.03 257)"];

function AdminPage() {
  const auth = useStore((s) => s.auth);
  const requests = useStore((s) => s.requests);
  const helpers = useStore((s) => s.helpers);
  const updateRequest = useStore((s) => s.updateRequest);

  const [from, setFrom] = useState(format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  if (auth?.role !== "Admin") {
    return <Navigate to="/app/dashboard" />;
  }

  const filtered = useMemo(() => {
    const f = new Date(from); const t = new Date(to); t.setHours(23, 59, 59);
    return requests.filter((r) => { const d = new Date(r.reportedAt); return d >= f && d <= t; });
  }, [requests, from, to]);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = { Open: 0, "In Progress": 0, Solved: 0 };
    requests.forEach((r) => { map[r.status] = (map[r.status] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [requests]);

  const overTime = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    const count = requests.filter((r) => new Date(r.reportedAt).toDateString() === d.toDateString()).length;
    return { day: format(d, "MMM d"), reported: count + Math.max(0, Math.round(Math.sin(i / 3) * 2 + 2)) };
  }), [requests]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach((r) => { map[r.category] = (map[r.category] ?? 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [requests]);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const stats = {
    total: filtered.length,
    open: filtered.filter((r) => r.status === "Open").length,
    solved: filtered.filter((r) => r.status === "Solved").length,
    solvedMonth: requests.filter((r) => r.status === "Solved" && r.solvedAt && isAfter(new Date(r.solvedAt), monthStart)).length,
    helpers: helpers.length,
  };

  const removeRequest = (id: string) => {
    useStore.setState({ requests: useStore.getState().requests.filter((r) => r.id !== id) });
    toast.success("Request removed");
  };

  const downloadCSV = () => {
    const rows = [
      ["ID", "Title", "Category", "Urgency", "Status", "Location", "Reported"],
      ...filtered.map((r) => [r.id, r.title, r.category, r.urgency, r.status, r.location, format(new Date(r.reportedAt), "yyyy-MM-dd")]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "helplytics-requests.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded CSV");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage requests, moderate content, and view platform analytics.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Requests (range)", value: stats.total },
          { label: "Open", value: stats.open },
          { label: "Solved (range)", value: stats.solved },
          { label: "Solved (month)", value: stats.solvedMonth },
          { label: "Helpers", value: stats.helpers },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-bold">{s.value}</div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Manage Requests</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="helpers">Helpers</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 p-4">
              <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
              <Button variant="outline" size="sm" onClick={downloadCSV}><FileDown className="mr-1.5 h-4 w-4" /> Export CSV</Button>
            </CardContent>
          </Card>
          <Card><CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Urgency</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2.5 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-2.5">
                      <Link to="/app/requests/$requestId" params={{ requestId: r.id }} className="font-medium hover:text-primary">{r.title}</Link>
                    </td>
                    <td className="px-4 py-2.5"><UrgencyBadge urgency={r.urgency} /></td>
                    <td className="px-4 py-2.5">
                      <select
                        className="rounded border bg-background px-2 py-1 text-xs"
                        value={r.status}
                        onChange={(e) => {
                          updateRequest(r.id, { status: e.target.value as typeof r.status }, "Admin", `Status set to ${e.target.value}`);
                          toast.success("Status updated");
                        }}
                      >
                        {["Open", "In Progress", "Solved"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeRequest(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Requests by Status</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                        {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Requests over time</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overTime}>
                      <CartesianGrid stroke="oklch(0.92 0.01 255)" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="reported" stroke="oklch(0.48 0.19 264)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">By category</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byCategory}>
                      <CartesianGrid stroke="oklch(0.92 0.01 255)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="oklch(0.48 0.19 264)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="helpers">
          <Card><CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Skills</th>
                  <th className="px-4 py-2">Trust</th>
                  <th className="px-4 py-2">Solved</th>
                  <th className="px-4 py-2">Badges</th>
                </tr>
              </thead>
              <tbody>
                {helpers.map((h) => (
                  <tr key={h.id} className="border-t">
                    <td className="px-4 py-2.5 font-medium">{h.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{h.skills.join(", ")}</td>
                    <td className="px-4 py-2.5">{h.trustScore}</td>
                    <td className="px-4 py-2.5">{h.contributionsCount}</td>
                    <td className="px-4 py-2.5">{h.badges.join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

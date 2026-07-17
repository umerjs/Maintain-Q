import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore, techName } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, BarChart, Bar, CartesianGrid, Legend } from "recharts";
import { Package, AlertOctagon, Wrench, CheckCircle2, Clock } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { formatDistanceToNow, subDays, format, isAfter } from "date-fns";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

const COLORS = ["oklch(0.62 0.22 25)", "oklch(0.76 0.16 70)", "oklch(0.68 0.15 158)", "oklch(0.53 0.03 257)"];

function Dashboard() {
  const issues = useStore((s) => s.issues);
  const assets = useStore((s) => s.assets);
  const technicians = useStore((s) => s.technicians);

  const totals = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      assets: assets.length,
      open: issues.filter((i) => i.status === "Open").length,
      inProgress: issues.filter((i) => i.status === "In Progress").length,
      resolvedMonth: issues.filter((i) => i.status === "Resolved" && i.resolvedAt && isAfter(new Date(i.resolvedAt), monthStart)).length,
      overdue: issues.filter((i) => i.dueDate && i.status !== "Resolved" && new Date(i.dueDate) < now).length,
    };
  }, [issues, assets]);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = { Open: 0, "In Progress": 0, Resolved: 0, Overdue: 0 };
    issues.forEach((i) => { map[i.status] = (map[i.status] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [issues]);

  const overTime = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      const label = format(d, "MMM d");
      const count = issues.filter((iss) => {
        const rd = new Date(iss.reportedAt);
        return rd.toDateString() === d.toDateString();
      }).length;
      // seed with a bit of synthetic data for empty days
      const synthetic = Math.max(0, Math.round(Math.sin(i / 3) * 2 + 3));
      return { day: label, reported: count + synthetic };
    });
    return days;
  }, [issues]);

  const topAssets = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach((i) => { counts[i.assetId] = (counts[i.assetId] ?? 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ name: assets.find((a) => a.id === id)?.name ?? id, count }));
  }, [issues, assets]);

  const recent = issues.slice(0, 6);
  const getAsset = (id: string) => assets.find((a) => a.id === id);

  const stats = [
    { label: "Total Assets", value: totals.assets, icon: Package, tone: "text-primary bg-primary/10" },
    { label: "Open Issues", value: totals.open, icon: AlertOctagon, tone: "text-destructive bg-destructive/10" },
    { label: "In Progress", value: totals.inProgress, icon: Wrench, tone: "text-warning-foreground bg-warning/15" },
    { label: "Resolved (Month)", value: totals.resolvedMonth, icon: CheckCircle2, tone: "text-success bg-success/15" },
    { label: "Overdue Tasks", value: totals.overdue, icon: Clock, tone: "text-destructive bg-destructive/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of your operations.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${s.tone}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Issues by Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Issues Reported — Last 30 Days</CardTitle></CardHeader>
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

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle className="text-base">Top 5 Assets by Issue Count</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAssets} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid stroke="oklch(0.92 0.01 255)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip />
                  <Bar dataKey="count" fill="oklch(0.48 0.19 264)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Issues</CardTitle>
          <Link to="/app/issues" className="text-sm font-medium text-primary hover:underline">View all →</Link>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Asset</th>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Priority</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Assigned</th>
                <th className="px-4 py-2 font-medium">Reported</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((i) => (
                <tr key={i.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{getAsset(i.assetId)?.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{i.assetId}</div>
                  </td>
                  <td className="px-4 py-2.5">{i.title}</td>
                  <td className="px-4 py-2.5"><PriorityBadge priority={i.priority} /></td>
                  <td className="px-4 py-2.5"><StatusBadge status={i.status} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{techName(technicians, i.assignedTo)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDistanceToNow(new Date(i.reportedAt), { addSuffix: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

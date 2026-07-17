import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/data/mockData";
import { suggestSkillMatches } from "@/lib/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { AlertOctagon, CheckCircle2, Users, Shield, PlusCircle, Compass, Bot, Sparkles } from "lucide-react";
import { UrgencyBadge, StatusBadge } from "@/components/badges";
import { formatDistanceToNow, subDays, format, isAfter } from "date-fns";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

const COLORS = ["oklch(0.62 0.22 25)", "oklch(0.76 0.16 70)", "oklch(0.68 0.15 158)", "oklch(0.53 0.03 257)"];

function Dashboard() {
  const auth = useStore((s) => s.auth);
  const profile = useStore((s) => s.profile);
  const requests = useStore((s) => s.requests);
  const helpers = useStore((s) => s.helpers);

  const role = auth?.role ?? "Student";

  const totals = useMemo(() => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return {
      open: requests.filter((r) => r.status === "Open").length,
      solvedMonth: requests.filter((r) => r.status === "Solved" && r.solvedAt && isAfter(new Date(r.solvedAt), monthStart)).length,
      helpers: helpers.length,
      trust: profile.trustScore,
    };
  }, [requests, helpers, profile.trustScore]);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = { Open: 0, "In Progress": 0, Solved: 0 };
    requests.forEach((r) => { map[r.status] = (map[r.status] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [requests]);

  const overTime = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      const count = requests.filter((r) => new Date(r.reportedAt).toDateString() === d.toDateString()).length;
      const synthetic = Math.max(0, Math.round(Math.sin(i / 3) * 2 + 2));
      return { day: format(d, "MMM d"), reported: count + synthetic };
    });
  }, [requests]);

  const myPosted = useMemo(
    () => requests.filter((r) => r.reporterId === auth?.id || r.reporterName === auth?.name),
    [requests, auth],
  );

  const matches = useMemo(
    () => suggestSkillMatches(profile.skills.length ? profile.skills : (helpers.find((h) => h.email === auth?.email)?.skills ?? []), requests).slice(0, 4),
    [profile.skills, helpers, auth?.email, requests],
  );

  const helping = useMemo(() => {
    const me = helpers.find((h) => h.email === auth?.email);
    const id = me?.id ?? auth?.id;
    return requests.filter((r) => r.helperIds.includes(id ?? "") && r.status !== "Solved");
  }, [requests, helpers, auth]);

  const stats = [
    { label: "Open Requests", value: totals.open, icon: AlertOctagon, tone: "text-destructive bg-destructive/10" },
    { label: "Solved This Month", value: totals.solvedMonth, icon: CheckCircle2, tone: "text-success bg-success/15" },
    { label: "Active Helpers", value: totals.helpers, icon: Users, tone: "text-primary bg-primary/10" },
    { label: "My Trust Score", value: totals.trust, icon: Shield, tone: "text-warning-foreground bg-warning/15" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {role === "Student" ? "Student dashboard" : role === "Technician" ? "Helper dashboard" : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">Welcome back{auth?.name ? `, ${auth.name}` : ""}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/create-request"><Button size="sm"><PlusCircle className="mr-1.5 h-4 w-4" /> New Request</Button></Link>
          <Link to="/app/explore"><Button size="sm" variant="outline"><Compass className="mr-1.5 h-4 w-4" /> Browse Feed</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${s.tone}`}><s.icon className="h-4 w-4" /></div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4 text-primary" /> AI Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {role === "Technician" ? (
              <>
                <p className="text-muted-foreground"><Sparkles className="mr-1 inline h-3.5 w-3.5" /> {matches.length} open requests match your skills.</p>
                {matches.slice(0, 3).map((r) => (
                  <Link key={r.id} to="/app/requests/$requestId" params={{ requestId: r.id }} className="block rounded-md border bg-background p-2 hover:border-primary/40">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.category} · {r.location}</div>
                  </Link>
                ))}
                {!matches.length && <p className="text-muted-foreground">Add skills on your profile to get matches.</p>}
              </>
            ) : (
              <>
                <p className="text-muted-foreground">You have {myPosted.filter((r) => r.status !== "Solved").length} active requests.</p>
                {myPosted.slice(0, 3).map((r) => (
                  <Link key={r.id} to="/app/requests/$requestId" params={{ requestId: r.id }} className="block rounded-md border bg-background p-2 hover:border-primary/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{r.title}</span>
                      <StatusBadge status={r.status} />
                    </div>
                  </Link>
                ))}
                {!myPosted.length && <p className="text-muted-foreground">Create a request to get AI category & tag suggestions.</p>}
              </>
            )}
            <Link to="/app/ai-center" className="text-xs font-medium text-primary hover:underline">Open AI Center →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Requests by Status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Requests — Last 30 Days</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
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
      </div>

      {role === "Technician" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Requests I'm helping with</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <BadgeTrust score={profile.trustScore} badges={profile.badges} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {helping.length === 0 ? <p className="text-sm text-muted-foreground">No active contributions yet. Browse the feed to offer help.</p> : helping.map((r) => (
              <Link key={r.id} to="/app/requests/$requestId" params={{ requestId: r.id }} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/40">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.category} · {r.location}</div>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {role === "Student" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">My posted requests</CardTitle>
            <Link to="/app/create-request" className="text-sm font-medium text-primary hover:underline">Create request →</Link>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Urgency</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Posted</th>
                </tr>
              </thead>
              <tbody>
                {(myPosted.length ? myPosted : requests.slice(0, 4)).map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <Link to="/app/requests/$requestId" params={{ requestId: r.id }} className="font-medium hover:text-primary">{r.title}</Link>
                    </td>
                    <td className="px-4 py-2.5"><UrgencyBadge urgency={r.urgency} /></td>
                    <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-2.5 text-muted-foreground">{formatDistanceToNow(new Date(r.reportedAt), { addSuffix: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {role === "Admin" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Platform overview</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link to="/app/admin"><Button>Open Admin Panel</Button></Link>
            <Link to="/app/explore"><Button variant="outline">Moderate Explore feed</Button></Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BadgeTrust({ score, badges }: { score: number; badges: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Trust {score}</span>
      {badges.slice(0, 2).map((b) => (
        <span key={b} className="rounded-full border px-2 py-0.5 text-[10px]">{b}</span>
      ))}
    </div>
  );
}

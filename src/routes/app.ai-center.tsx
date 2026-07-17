import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/data/mockData";
import { suggestSkillMatches, categorize } from "@/lib/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, TrendingUp, Lightbulb, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/badges";

export const Route = createFileRoute("/app/ai-center")({ component: AiCenterPage });

function AiCenterPage() {
  const auth = useStore((s) => s.auth);
  const profile = useStore((s) => s.profile);
  const requests = useStore((s) => s.requests);
  const helpers = useStore((s) => s.helpers);

  const skills = profile.skills.length
    ? profile.skills
    : helpers.find((h) => h.email === auth?.email)?.skills ?? [];

  const matches = useMemo(() => suggestSkillMatches(skills, requests), [skills, requests]);

  const trending = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => { counts[r.category] = (counts[r.category] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [requests]);

  const tips = [
    "Add specific skills on your profile to improve match quality.",
    "High-urgency requests often need helpers within 24 hours — check Critical first.",
    "Mark requests solved promptly so trust score and badges update.",
    `Trending right now: ${trending[0]?.[0] ?? "Coding"} — great time to offer help there.`,
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Center</h1>
        <p className="text-sm text-muted-foreground">Aggregated insights, matches, and tips powered by Helplytics AI.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Skill matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{matches.length}</div>
            <p className="text-sm text-muted-foreground">requests match your skills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" /> Top category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{trending[0]?.[0] ?? "—"}</div>
            <p className="text-sm text-muted-foreground">{trending[0]?.[1] ?? 0} requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4" /> Open volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{requests.filter((r) => r.status === "Open").length}</div>
            <p className="text-sm text-muted-foreground">waiting for helpers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Suggested matches</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {matches.slice(0, 6).map((r) => (
              <Link key={r.id} to="/app/requests/$requestId" params={{ requestId: r.id }} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/40">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.category} · AI: {categorize(r.title + " " + r.description)}</div>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            ))}
            {!matches.length && <p className="text-sm text-muted-foreground">Add skills on your profile to unlock matches.</p>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Trending categories</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {trending.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span>{cat}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-4 w-4" /> Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                {tips.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

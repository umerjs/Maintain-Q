import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";

export const Route = createFileRoute("/app/leaderboard")({ component: LeaderboardPage });

function LeaderboardPage() {
  const helpers = useStore((s) => s.helpers);

  const ranked = useMemo(
    () => [...helpers].sort((a, b) => b.trustScore - a.trustScore || b.contributionsCount - a.contributionsCount),
    [helpers],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Top helpers ranked by trust score and solved requests.</p>
      </div>

      <div className="grid gap-3">
        {ranked.map((h, i) => (
          <Card key={h.id} className={i < 3 ? "border-primary/30" : ""}>
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-muted font-bold">
                {i === 0 ? <Trophy className="h-5 w-5 text-warning-foreground" /> : i < 3 ? <Medal className="h-5 w-5 text-primary" /> : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{h.name}</div>
                <div className="text-sm text-muted-foreground">{h.skills.slice(0, 4).join(" · ")} · {h.location}</div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {h.badges.map((b) => (
                    <span key={b} className="rounded-full border px-2 py-0.5 text-[10px]">{b}</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{h.trustScore}</div>
                <div className="text-xs text-muted-foreground">trust · {h.contributionsCount} solved</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

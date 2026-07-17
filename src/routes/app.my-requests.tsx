import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { UrgencyBadge, StatusBadge } from "@/components/badges";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/app/my-requests")({ component: MyRequestsPage });

function MyRequestsPage() {
  const auth = useStore((s) => s.auth);
  const requests = useStore((s) => s.requests);
  const helpers = useStore((s) => s.helpers);

  const meHelper = helpers.find((h) => h.email === auth?.email);
  const helperId = meHelper?.id ?? auth?.id;

  const mine = useMemo(() => {
    if (auth?.role === "Technician") {
      return requests.filter((r) => r.helperIds.includes(helperId ?? ""));
    }
    return requests.filter(
      (r) =>
        r.reporterId === auth?.id ||
        r.reporterName === auth?.name ||
        r.reporterContact === auth?.email,
    );
  }, [requests, auth, helperId]);

  const title = auth?.role === "Technician" ? "My Contributions" : "My Requests";
  const subtitle =
    auth?.role === "Technician"
      ? "Requests you've offered to help with."
      : "Help requests you've posted.";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {mine.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Nothing here yet.{" "}
            <Link
              to={auth?.role === "Technician" ? "/app/explore" : "/app/create-request"}
              className="font-medium text-primary hover:underline"
            >
              {auth?.role === "Technician" ? "Browse the feed" : "Create a request"}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {mine.map((r) => (
            <Link key={r.id} to="/app/requests/$requestId" params={{ requestId: r.id }}>
              <Card className="transition hover:border-primary/40">
                <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                      <UrgencyBadge urgency={r.urgency} />
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="mt-2 font-semibold">{r.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {r.category} · {r.location}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.reportedAt), { addSuffix: true })}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/app/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const auth = useStore((s) => s.auth);
  const notifications = useStore((s) => s.notifications);
  const helpers = useStore((s) => s.helpers);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);

  const meHelper = helpers.find((h) => h.email === auth?.email);
  const ids = useMemo(
    () => new Set([auth?.id, auth?.email, meHelper?.id].filter(Boolean) as string[]),
    [auth, meHelper],
  );

  const mine = useMemo(
    () => notifications.filter((n) => ids.has(n.userId)).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [notifications, ids],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Matches, status changes, messages, and badges.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            ids.forEach((id) => markAllNotificationsRead(id));
          }}
        >
          <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
        </Button>
      </div>

      {mine.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <Bell className="mx-auto mb-2 h-8 w-8 opacity-40" />
          You're all caught up.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {mine.map((n) => (
            <Card key={n.id} className={n.read ? "opacity-70" : "border-primary/30"}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{n.type.replace("_", " ")}</div>
                  <div className="mt-1 text-sm">{n.text}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
                </div>
                <div className="flex gap-2">
                  {!n.read && <Button size="sm" variant="ghost" onClick={() => markNotificationRead(n.id)}>Mark read</Button>}
                  {n.requestId && (
                    <Link to="/app/requests/$requestId" params={{ requestId: n.requestId }}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

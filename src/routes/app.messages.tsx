import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/app/messages")({ component: MessagesPage });

function MessagesPage() {
  const auth = useStore((s) => s.auth);
  const messages = useStore((s) => s.messages);
  const requests = useStore((s) => s.requests);
  const helpers = useStore((s) => s.helpers);
  const addMessage = useStore((s) => s.addMessage);

  const threads = useMemo(() => {
    const map = new Map<string, typeof messages>();
    messages.forEach((m) => {
      const list = map.get(m.requestId) ?? [];
      list.push(m);
      map.set(m.requestId, list);
    });
    return [...map.entries()].map(([requestId, msgs]) => ({
      requestId,
      request: requests.find((r) => r.id === requestId),
      msgs: msgs.sort((a, b) => +new Date(a.sentAt) - +new Date(b.sentAt)),
      last: msgs[msgs.length - 1],
    })).sort((a, b) => +new Date(b.last?.sentAt ?? 0) - +new Date(a.last?.sentAt ?? 0));
  }, [messages, requests]);

  const [activeId, setActiveId] = useState(threads[0]?.requestId ?? "");
  const [body, setBody] = useState("");

  const active = threads.find((t) => t.requestId === activeId) ?? threads[0];
  const activeMsgs = active?.msgs ?? [];

  const resolveName = (userId: string) => {
    if (userId === auth?.id) return "You";
    const h = helpers.find((x) => x.id === userId);
    if (h) return h.name;
    const req = requests.find((r) => r.reporterId === userId);
    return req?.reporterName ?? userId;
  };

  const send = () => {
    if (!body.trim() || !active) return;
    const last = activeMsgs[activeMsgs.length - 1];
    const toUserId = last
      ? (last.fromUserId === auth?.id ? last.toUserId : last.fromUserId)
      : (active.request?.helperIds[0] ?? active.request?.reporterId ?? "user-unknown");
    addMessage({
      requestId: active.requestId,
      fromUserId: auth?.id ?? "local-user",
      toUserId,
      body: body.trim(),
    });
    setBody("");
    toast.success("Message sent");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">Conversations tied to help requests.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-base">Threads</CardTitle></CardHeader>
          <CardContent className="space-y-1 p-2">
            {threads.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No messages yet.</p>
            ) : threads.map((t) => (
              <button
                key={t.requestId}
                type="button"
                onClick={() => setActiveId(t.requestId)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${(activeId || threads[0]?.requestId) === t.requestId ? "bg-primary/10" : "hover:bg-muted/50"}`}
              >
                <div className="font-medium">{t.request?.title ?? t.requestId}</div>
                <div className="truncate text-xs text-muted-foreground">{t.last?.body}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{active?.request?.title ?? "Select a thread"}</CardTitle>
          </CardHeader>
          <CardContent className="flex h-[420px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {activeMsgs.map((m) => {
                const mine = m.fromUserId === auth?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {!mine && <div className="mb-0.5 text-[10px] opacity-70">{resolveName(m.fromUserId)}</div>}
                      <div>{m.body}</div>
                      <div className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {format(new Date(m.sentAt), "MMM d · HH:mm")}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!activeMsgs.length && <p className="text-sm text-muted-foreground">No messages in this thread.</p>}
            </div>
            {active && (
              <div className="mt-3 flex gap-2 border-t pt-3">
                <Input value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Write a message…" />
                <Button onClick={send}>Send</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

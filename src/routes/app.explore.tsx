import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, type RequestStatus, type Urgency } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UrgencyBadge, StatusBadge } from "@/components/badges";
import { Search, MapPin, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/app/explore")({ component: ExplorePage });

function ExplorePage() {
  const requests = useStore((s) => s.requests);
  const categories = useStore((s) => s.categories);
  const helpers = useStore((s) => s.helpers);

  const [tab, setTab] = useState<"All" | RequestStatus>("All");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [urgency, setUrgency] = useState("all");
  const [skill, setSkill] = useState("all");
  const [location, setLocation] = useState("all");

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    helpers.forEach((h) => h.skills.forEach((s) => set.add(s)));
    requests.forEach((r) => r.skillsNeeded.forEach((s) => set.add(s)));
    return [...set].sort();
  }, [helpers, requests]);

  const allLocations = useMemo(() => {
    const set = new Set(requests.map((r) => r.location).filter(Boolean));
    return [...set].sort();
  }, [requests]);

  const filtered = useMemo(() => {
    let arr = requests.slice();
    if (tab !== "All") arr = arr.filter((r) => r.status === tab);
    if (category !== "all") arr = arr.filter((r) => r.category === category);
    if (urgency !== "all") arr = arr.filter((r) => r.urgency === urgency);
    if (skill !== "all") arr = arr.filter((r) =>
      r.skillsNeeded.some((s) => s.toLowerCase() === skill.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase() === skill.toLowerCase()) ||
      r.category.toLowerCase() === skill.toLowerCase(),
    );
    if (location !== "all") arr = arr.filter((r) => r.location === location);
    if (q) {
      const qq = q.toLowerCase();
      arr = arr.filter((r) => `${r.id} ${r.title} ${r.description} ${r.tags.join(" ")}`.toLowerCase().includes(qq));
    }
    return arr.sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));
  }, [requests, tab, category, urgency, skill, location, q]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Explore</h1>
        <p className="text-sm text-muted-foreground">Browse help requests across the community.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="All">All ({requests.length})</TabsTrigger>
          <TabsTrigger value="Open">Open ({requests.filter((r) => r.status === "Open").length})</TabsTrigger>
          <TabsTrigger value="In Progress">In Progress ({requests.filter((r) => r.status === "In Progress").length})</TabsTrigger>
          <TabsTrigger value="Solved">Solved ({requests.filter((r) => r.status === "Solved").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search requests…" className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={urgency} onValueChange={setUrgency}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Urgency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All urgency</SelectItem>
            {(["Low", "Medium", "High", "Critical"] as Urgency[]).map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={skill} onValueChange={setSkill}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Skills" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All skills</SelectItem>
            {allSkills.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Location" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {allLocations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No requests match your filters.</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((r) => (
            <Link key={r.id} to="/app/requests/$requestId" params={{ requestId: r.id }}>
              <Card className="h-full transition hover:border-primary/40 hover:shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                    <UrgencyBadge urgency={r.urgency} />
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="font-semibold">{r.title}</div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Tag className="h-3 w-3" /> {r.category}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.location || "Anywhere"}</span>
                    <span>{formatDistanceToNow(new Date(r.reportedAt), { addSuffix: true })}</span>
                  </div>
                  {r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {r.tags.slice(0, 4).map((t) => (
                        <span key={t} className="rounded-full border px-2 py-0.5 text-[10px]">{t}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

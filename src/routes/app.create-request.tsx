import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore, type Urgency } from "@/data/mockData";
import { categorize, suggestTags, detectUrgency, suggestRewrite } from "@/lib/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/create-request")({ component: CreateRequestPage });

function CreateRequestPage() {
  const auth = useStore((s) => s.auth);
  const profile = useStore((s) => s.profile);
  const categories = useStore((s) => s.categories);
  const addRequest = useStore((s) => s.addRequest);
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [urgency, setUrgency] = useState<Urgency>("Medium");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [location, setLocation] = useState(profile.location || "");
  const [suggested, setSuggested] = useState<string[]>([]);

  const blob = `${title} ${description}`;

  useEffect(() => {
    if (blob.trim().length < 8) return;
    setCategory(categorize(blob));
    setUrgency(detectUrgency(blob));
    setSuggested(suggestTags(blob));
  }, [blob]);

  const addTag = (t: string) => {
    const v = t.trim().toLowerCase();
    if (!v || tags.includes(v)) return;
    setTags([...tags, v]);
    setTagDraft("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { toast.error("Title and description are required"); return; }
    const req = addRequest({
      title: title.trim(),
      description: description.trim(),
      category,
      tags,
      urgency,
      location: location.trim() || "Anywhere",
      skillsNeeded: tags.length ? tags : [category],
      reporterId: auth?.id,
      reporterName: auth?.name ?? profile.name,
      reporterContact: auth?.email,
    });
    toast.success("Help request posted!");
    nav({ to: "/app/requests/$requestId", params: { requestId: req.id } });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Request</h1>
        <p className="text-sm text-muted-foreground">Describe what you need — AI will suggest category, tags, and urgency.</p>
      </div>

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Need help with React hooks" required /></div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label>Description</Label>
              <Button type="button" size="sm" variant="ghost" onClick={() => setDescription(suggestRewrite(description || title))}>
                <Sparkles className="mr-1 h-3.5 w-3.5" /> Rewrite suggestion
              </Button>
            </div>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="What do you need help with, and why?" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Urgency</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Low", "Medium", "High", "Critical"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Campus Library…" /></div>
          <div>
            <Label>Tags</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1 pr-1">
                  {t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(tagDraft))} placeholder="Add tag" />
              <Button type="button" variant="outline" onClick={() => addTag(tagDraft)}>Add</Button>
            </div>
          </div>
          <Button type="submit">Post request</Button>
        </div>

        <Card className="h-fit border-primary/20 bg-primary/5 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4 text-primary" /> AI Assist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Detected category</div>
              <div className="font-medium">{blob.trim().length >= 8 ? categorize(blob) : "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Detected urgency</div>
              <div className="font-medium">{blob.trim().length >= 8 ? detectUrgency(blob) : "—"}</div>
            </div>
            <div>
              <div className="mb-1.5 text-xs uppercase text-muted-foreground">Suggested tags</div>
              <div className="flex flex-wrap gap-1.5">
                {suggested.length ? suggested.map((t) => (
                  <button key={t} type="button" onClick={() => addTag(t)} className="rounded-full border border-primary/30 bg-background px-2.5 py-0.5 text-xs hover:bg-primary/10">{t}</button>
                )) : <span className="text-muted-foreground">Keep typing…</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/data/mockData";
import { suggestSkillsFromInterests, suggestHelpAreas } from "@/lib/ai";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Plus, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const SKILL_SUGGESTIONS = ["React", "TypeScript", "Python", "Calculus", "Statistics", "Figma", "UI/UX", "Essay Writing", "Resume", "Interview Prep"];

function TagInput({ label, values, onChange, suggestions }: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");
  const add = (v: string) => {
    const t = v.trim();
    if (!t || values.includes(t)) return;
    onChange([...values, t]);
    setDraft("");
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1 pl-2.5 pr-1">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="rounded-full p-0.5 hover:bg-destructive/20"><X className="h-3 w-3" /></button>
          </Badge>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(draft))} placeholder="Type and press Enter" />
        <Button type="button" variant="outline" onClick={() => add(draft)}><Plus className="h-4 w-4" /></Button>
      </div>
      {suggestions && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.filter((s) => !values.includes(s)).slice(0, 6).map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground">{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Onboarding() {
  const auth = useStore((s) => s.auth);
  const updateProfile = useStore((s) => s.updateProfile);
  const profile = useStore((s) => s.profile);
  const nav = useNavigate();
  const [name, setName] = useState(auth?.name || profile.name || "");
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [location, setLocation] = useState(profile.location);
  const [saving, setSaving] = useState(false);

  const aiSkills = useMemo(() => suggestSkillsFromInterests(interests, skills), [interests, skills]);
  const aiAreas = useMemo(() => suggestHelpAreas(skills, interests), [skills, interests]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Enter your name"); return; }

    setSaving(true);

    // Persist to Supabase first — only update local state on success
    if (auth?.id && !auth.id.startsWith("local-")) {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          skills,
          interests,
          location: location.trim(),
        })
        .eq("id", auth.id);

      if (error) {
        setSaving(false);
        toast.error(`Failed to save profile: ${error.message}`);
        return;
      }
    }

    updateProfile({ name: name.trim(), skills, interests, location: location.trim() });
    toast.success("Profile ready — welcome!");
    setSaving(false);
    nav({ to: "/app/dashboard" });
  };

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Set up your profile</h1>
        <p className="text-sm text-muted-foreground">Tell the community what you can help with — and what you need.</p>
      </div>
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <TagInput label="Skills (what you can help with)" values={skills} onChange={setSkills} suggestions={SKILL_SUGGESTIONS} />
          <TagInput label="Interests" values={interests} onChange={setInterests} suggestions={SKILL_SUGGESTIONS} />
          <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Campus Library, Building A…" /></div>
          <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
            {saving ? "Saving…" : "Continue to dashboard"}
          </Button>
        </div>
        <Card className="lg:col-span-2 h-fit border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4 text-primary" /> AI Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase text-muted-foreground">Skills you could offer</div>
              <div className="flex flex-wrap gap-1.5">
                {aiSkills.length ? aiSkills.map((s) => (
                  <button key={s} type="button" onClick={() => !skills.includes(s) && setSkills([...skills, s])} className="rounded-full border border-primary/30 bg-background px-2.5 py-0.5 text-xs hover:bg-primary/10">{s}</button>
                )) : <span className="text-muted-foreground">Add interests to get suggestions</span>}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-medium uppercase text-muted-foreground">Areas you may need help</div>
              <div className="flex flex-wrap gap-1.5">
                {aiAreas.map((s) => (
                  <button key={s} type="button" onClick={() => !interests.includes(s) && setInterests([...interests, s])} className="rounded-full border px-2.5 py-0.5 text-xs hover:border-primary">{s}</button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

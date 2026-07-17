import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Plus, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({ component: ProfilePage });

function ProfilePage() {
  const auth = useStore((s) => s.auth);
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const orgName = useStore((s) => s.orgName);
  const setOrgName = useStore((s) => s.setOrgName);

  const [name, setName] = useState(profile.name || auth?.name || "");
  const [email, setEmail] = useState(profile.email || auth?.email || "");
  const [location, setLocation] = useState(profile.location);
  const [skills, setSkills] = useState(profile.skills);
  const [interests, setInterests] = useState(profile.interests);
  const [skillDraft, setSkillDraft] = useState("");
  const [interestDraft, setInterestDraft] = useState("");
  const [password, setPassword] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(true);

  const save = () => {
    updateProfile({ name, email, location, skills, interests });
    setOrgName(orgName);
    toast.success("Profile updated");
  };

  const addSkill = () => {
    const t = skillDraft.trim();
    if (!t || skills.includes(t)) return;
    setSkills([...skills, t]);
    setSkillDraft("");
  };

  const addInterest = () => {
    const t = interestDraft.trim();
    if (!t || interests.includes(t)) return;
    setInterests([...interests, t]);
    setInterestDraft("");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your public identity, skills, and account settings.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" /> Trust score
            </div>
            <div className="mt-1 text-3xl font-bold">{profile.trustScore}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Contributions</div>
            <div className="mt-1 text-3xl font-bold">{profile.contributionsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Role</div>
            <div className="mt-1 text-xl font-bold">{auth?.role}</div>
          </CardContent>
        </Card>
      </div>

      {profile.badges.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Badges</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.badges.map((b) => (
              <Badge key={b} variant="secondary">
                {b}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <Label>New password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1 pr-1">
                {s}
                <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="Add skill"
            />
            <Button type="button" variant="outline" onClick={addSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {interests.map((s) => (
              <Badge key={s} variant="outline" className="gap-1 pr-1">
                {s}
                <button
                  type="button"
                  onClick={() => setInterests(interests.filter((x) => x !== s))}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={interestDraft}
              onChange={(e) => setInterestDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
              placeholder="Add interest"
            />
            <Button type="button" variant="outline" onClick={addInterest}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="font-medium">Email alerts for new matches</div>
            <div className="text-sm text-muted-foreground">
              Get notified when a request matches your skills.
            </div>
          </div>
          <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
        </CardContent>
      </Card>

      <Button onClick={save}>Save profile</Button>
    </div>
  );
}

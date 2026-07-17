import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeartHandshake, GraduationCap, Wrench } from "lucide-react";
import { useStore, type UserRole } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({ component: Signup });

function Signup() {
  const login = useStore((s) => s.login);
  const setOrgName = useStore((s) => s.setOrgName);
  const updateProfile = useStore((s) => s.updateProfile);
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "Admin">>("Student");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/app/dashboard" });
    });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Fill in all fields"); return; }
    setLoading(true);
    const org = "Helplytics AI Community";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name, org_name: org, role },
      },
    });

    // Local demo path when Supabase rejects / unavailable
    if (error || !data.user) {
      const localId = `local-${Date.now()}`;
      setOrgName(org);
      login({ id: localId, name, email, orgName: org, role });
      updateProfile({ id: localId, name, email, role, skills: [], interests: [], location: "", trustScore: 50, badges: [], contributionsCount: 0 });
      toast.success(error ? `Offline demo account created (${error.message})` : "Account created — welcome to Helplytics AI!");
      setLoading(false);
      nav({ to: "/onboarding" });
      return;
    }

    setOrgName(org);
    login({ id: data.user.id, name, email, orgName: org, role });
    updateProfile({ id: data.user.id, name, email, role, skills: [], interests: [], location: "", trustScore: 50, badges: [], contributionsCount: 0 });
    toast.success("Account created — welcome to Helplytics AI!");
    setLoading(false);
    nav({ to: "/onboarding" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><HeartHandshake className="h-4 w-4" /></div>
          <span className="text-lg font-bold">Helplytics AI</span>
        </Link>
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join as someone who needs help or can help.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label htmlFor="n">Your name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" required /></div>
            <div><Label htmlFor="e">Email</Label><Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@school.edu" required /></div>
            <div>
              <Label>I am a…</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("Student")}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition",
                    role === "Student" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40",
                  )}
                >
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span className="font-medium">Student</span>
                  <span className="text-[11px] text-muted-foreground">Need help</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("Technician")}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition",
                    role === "Technician" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40",
                  )}
                >
                  <Wrench className="h-5 w-5 text-primary" />
                  <span className="font-medium">Technician</span>
                  <span className="text-[11px] text-muted-foreground">Can help</span>
                </button>
              </div>
            </div>
            <div><Label htmlFor="p">Password</Label><Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

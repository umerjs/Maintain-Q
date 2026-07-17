import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeartHandshake } from "lucide-react";
import { useStore, ADMIN_EMAIL, ADMIN_PASSWORD } from "@/data/mockData";
import { resolveRole } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const login = useStore((s) => s.login);
  const setOrgName = useStore((s) => s.setOrgName);
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const isAdmin = data.session.user.email?.toLowerCase() === ADMIN_EMAIL;
        nav({ to: isAdmin ? "/app/admin" : "/app/dashboard" });
      }
    });
  }, [nav]);

  const finishLogin = (opts: {
    id: string;
    name: string;
    email: string;
    orgName: string;
    role: "Student" | "Technician" | "Admin";
  }) => {
    setOrgName(opts.orgName);
    login(opts);
    toast.success("Welcome back!");
    nav({
      to:
        opts.role === "Admin" || opts.email.toLowerCase() === ADMIN_EMAIL
          ? "/app/admin"
          : "/app/dashboard",
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter email and password");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message ?? "Sign-in failed");
      return;
    }

    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("name, org_name")
        .eq("id", data.user.id)
        .maybeSingle(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id),
    ]);

    const role = resolveRole(roles, email);

    finishLogin({
      id: data.user.id,
      name: profile?.name ?? email.split("@")[0],
      email,
      orgName: profile?.org_name ?? "Helplytics AI Community",
      role,
    });
    setLoading(false);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <HeartHandshake className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold">Helplytics AI</span>
        </Link>
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log in to your community dashboard.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="e">Email</Label>
              <Input
                id="e"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="p">Password</Label>
              <Input
                id="p"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Log in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link
              to="/signup"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

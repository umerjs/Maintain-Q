import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanLine } from "lucide-react";
import { useStore } from "@/data/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({ component: Signup });

function Signup() {
  const login = useStore((s) => s.login);
  const setOrgName = useStore((s) => s.setOrgName);
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !org || !password) { toast.error("Fill in all fields"); return; }
    setOrgName(org);
    login({ name, email, orgName: org, role: "Admin" });
    toast.success("Account created — welcome to MaintainIQ!");
    nav({ to: "/app/dashboard" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><ScanLine className="h-4 w-4" /></div>
          <span className="text-lg font-bold">MaintainIQ</span>
        </Link>
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Free to start. No credit card.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label htmlFor="n">Your name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" required /></div>
            <div><Label htmlFor="e">Work email</Label><Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" required /></div>
            <div><Label htmlFor="o">Organization name</Label><Input id="o" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Acme Facilities" required /></div>
            <div><Label htmlFor="p">Password</Label><Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full">Create account</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

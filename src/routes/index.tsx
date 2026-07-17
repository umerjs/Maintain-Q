import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  HeartHandshake, Users, MessageCircle, Trophy, Bot, ArrowRight,
  Sparkles, ShieldCheck, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <HeartHandshake className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight">Helplytics AI</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#who" className="text-muted-foreground hover:text-foreground">Who it's for</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup"><Button size="sm">Get Started</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,oklch(0.48_0.19_264/0.12),transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Community help, powered by AI matching
            </div>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-6xl">
              Ask for help. Offer help. <span className="text-primary">Build a stronger community.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
              Post help requests, get matched with skilled helpers, message in context, and climb the leaderboard — with AI insights along the way.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/signup"><Button size="lg" className="h-11 px-6">Join the community <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>
              <Link to="/login"><Button size="lg" variant="outline" className="h-11 px-6"><Sparkles className="mr-1.5 h-4 w-4" /> Explore demo</Button></Link>
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-5xl">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/10">
              <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-3 font-mono text-xs text-muted-foreground">app.helplytics.ai/dashboard</span>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-4">
                {[
                  { label: "Total Members", value: "1,248", tone: "text-primary" },
                  { label: "Requests Solved", value: "892", tone: "text-success" },
                  { label: "Active Helpers", value: "316", tone: "text-warning-foreground" },
                  { label: "Open Requests", value: "47", tone: "text-destructive" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className={`mt-1 text-2xl font-bold ${s.tone}`}>{s.value}</div>
                  </div>
                ))}
                <div className="md:col-span-4 rounded-lg border p-4">
                  <div className="mb-3 text-sm font-semibold">Recent help requests</div>
                  <div className="space-y-2 text-sm">
                    {[
                      { id: "HR-001", t: "Need help debugging React useEffect loop", p: "High", s: "In Progress" },
                      { id: "HR-004", t: "Resume review before career fair", p: "Critical", s: "Open" },
                      { id: "HR-002", t: "Stuck on multivariable calculus homework", p: "Low", s: "Open" },
                    ].map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded border-b py-1.5 last:border-b-0">
                        <div className="flex items-center gap-3"><span className="font-mono text-xs text-muted-foreground">{r.id}</span><span>{r.t}</span></div>
                        <div className="flex gap-2 text-xs">
                          <span className={r.p === "Critical" ? "text-destructive font-medium" : r.p === "High" ? "text-warning-foreground font-medium" : "text-muted-foreground"}>{r.p}</span>
                          <span className="text-muted-foreground">·</span>
                          <span>{r.s}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for communities that lift each other up</h2>
            <p className="mt-3 text-muted-foreground">Everything you need to ask, offer, match, and grow — in one place.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { icon: Users, title: "Need help or can help", desc: "Join as a Student or Technician. Post requests or offer your skills to the community." },
              { icon: MessageCircle, title: "Matched messaging", desc: "Talk in context of a request — no more lost DMs. Threads stay tied to the help topic." },
              { icon: Trophy, title: "Trust & leaderboard", desc: "Earn trust score and badges as you solve requests. Climb the helper leaderboard." },
              { icon: Bot, title: "AI matching", desc: "Auto-categorize requests, suggest tags, and surface skill-matched opportunities." },
              { icon: ShieldCheck, title: "Transparent timeline", desc: "Every offer and status change is logged — who helped, and when." },
              { icon: CheckCircle2, title: "From open to solved", desc: "Track requests from Open → In Progress → Solved with clear ownership." },
            ].map((f) => (
              <div key={f.title} className="group rounded-xl border bg-card p-6 transition hover:border-primary/40 hover:shadow-md">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 md:grid-cols-3">
            {[
              { n: "01", t: "Create your profile", d: "Pick Student or Technician, add skills and interests, get AI suggestions." },
              { n: "02", t: "Post or browse requests", d: "Describe what you need — or explore the feed filtered by category, urgency, skills, location." },
              { n: "03", t: "Match, message, solve", d: "Offer help, chat in-thread, mark solved, and earn trust on the leaderboard." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-xl border bg-card p-6">
                <div className="font-mono text-xs font-bold text-primary">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="who" className="border-t bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">Built for every kind of community</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {["Campuses", "Study groups", "Coding clubs", "Hackathons", "Career networks", "Design cohorts", "Tutoring hubs", "Student orgs"].map((x) => (
              <span key={x} className="rounded-full border bg-card px-4 py-1.5 text-sm">{x}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl rounded-2xl border bg-primary p-10 text-center text-primary-foreground shadow-xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to help — or get help?</h2>
          <p className="mt-3 text-primary-foreground/80">Set up your profile in under a minute.</p>
          <div className="mt-6">
            <Link to="/signup"><Button size="lg" variant="secondary" className="h-11 px-6">Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div>© {new Date().getFullYear()} Helplytics AI</div>
          <div>Ask for help. Offer help.</div>
        </div>
      </footer>
    </div>
  );
}

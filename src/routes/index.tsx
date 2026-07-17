import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ScanLine, ClipboardCheck, Users, History, ShieldCheck, ArrowRight, QrCode, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ScanLine className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight">MaintainIQ</span>
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,oklch(0.48_0.19_264/0.12),transparent_70%)]" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Trusted by facilities teams across sectors
            </div>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-6xl">
              Every Asset. One Scan. <span className="text-primary">Full Accountability.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
              Report issues, assign technicians, track repairs, and prevent failures — all from a QR code.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/signup"><Button size="lg" className="h-11 px-6">Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>
              <Link to="/report/ASSET-001"><Button size="lg" variant="outline" className="h-11 px-6"><QrCode className="mr-1.5 h-4 w-4" /> Try a demo scan</Button></Link>
            </div>
          </div>

          {/* Hero mockup */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/10">
              <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-3 font-mono text-xs text-muted-foreground">app.maintainiq.io/dashboard</span>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-4">
                {[
                  { label: "Total Assets", value: "142", tone: "text-primary" },
                  { label: "Open Issues", value: "23", tone: "text-destructive" },
                  { label: "In Progress", value: "11", tone: "text-warning-foreground" },
                  { label: "Resolved (mo)", value: "58", tone: "text-success" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className={`mt-1 text-2xl font-bold ${s.tone}`}>{s.value}</div>
                  </div>
                ))}
                <div className="md:col-span-4 rounded-lg border p-4">
                  <div className="mb-3 text-sm font-semibold">Recent issues</div>
                  <div className="space-y-2 text-sm">
                    {[
                      { id: "IQ-001", t: "Cooling not working, temp rising", p: "Critical", s: "In Progress" },
                      { id: "IQ-004", t: "Oil leak noticed near base", p: "High", s: "Open" },
                      { id: "IQ-002", t: "Door closing too slowly", p: "Medium", s: "Open" },
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

      {/* Features */}
      <section id="features" className="border-t bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for teams who can't afford downtime</h2>
            <p className="mt-3 text-muted-foreground">Everything you need to keep physical assets accountable, from a single link.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { icon: QrCode, title: "Asset Identity", desc: "Every asset gets a unique ID, QR code, and public page — printed, scanned, tracked." },
              { icon: ClipboardCheck, title: "Issue Reporting", desc: "Anyone can scan and report — no login required. Photos, priority, contact optional." },
              { icon: Users, title: "Technician Assignment", desc: "Route jobs by specialization, set due dates, and see load per technician." },
              { icon: History, title: "Service History", desc: "Chronological, immutable log of every issue, action, and resolution per asset." },
              { icon: ShieldCheck, title: "Accountability", desc: "Timestamped activity log on every issue — who changed what, and when." },
              { icon: CheckCircle2, title: "Preventive Recs", desc: "Recommended maintenance intervals with next-due dates per asset." },
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

      {/* How */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 md:grid-cols-3">
            {[
              { n: "01", t: "Register your assets", d: "Add equipment, rooms, or vehicles. Generate & print QR codes." },
              { n: "02", t: "Anyone reports issues", d: "Staff or public scans the QR. No login. Fills out a mobile-first form." },
              { n: "03", t: "You assign & resolve", d: "Route to the right technician. Track status, evidence, and history." },
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

      {/* Who */}
      <section id="who" className="border-t bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">Built for every kind of facility</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {["Schools", "Universities", "Hospitals", "Offices", "Factories", "Housing societies", "Labs", "Hotels", "Restaurants", "Warehouses", "Facility management"].map((x) => (
              <span key={x} className="rounded-full border bg-card px-4 py-1.5 text-sm">{x}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl rounded-2xl border bg-primary p-10 text-center text-primary-foreground shadow-xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Stop losing track of maintenance.</h2>
          <p className="mt-3 text-primary-foreground/80">Set up your first asset in under 60 seconds.</p>
          <div className="mt-6">
            <Link to="/signup"><Button size="lg" variant="secondary" className="h-11 px-6">Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div>© {new Date().getFullYear()} MaintainIQ</div>
          <div>Every Asset. One Scan.</div>
        </div>
      </footer>
    </div>
  );
}

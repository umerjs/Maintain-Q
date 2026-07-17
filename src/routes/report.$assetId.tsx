import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useStore } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, CheckCircle2, MapPin, ScanLine, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/report/$assetId")({ component: ReportPage });

function ReportPage() {
  const { assetId } = useParams({ from: "/report/$assetId" });
  const asset = useStore((s) => s.assets.find((a) => a.id === assetId));
  const addIssue = useStore((s) => s.addIssue);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState<string | null>(null);

  const priorities = useMemo(() => [
    { v: "Low", d: "Minor, can wait" },
    { v: "Medium", d: "Should be looked at" },
    { v: "High", d: "Urgent" },
    { v: "Critical", d: "Emergency" },
  ] as const, []);

  if (!asset) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold">Asset not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">The asset ID "{assetId}" doesn't exist in this system.</p>
          <Link to="/"><Button className="mt-6" variant="outline">Go home</Button></Link>
        </div>
      </div>
    );
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { toast.error("Please add a title and description"); return; }
    const issue = addIssue({
      assetId: asset.id, title, description, priority,
      reporterName: name || "Anonymous", reporterContact: contact || undefined,
      photoUrl: photo,
    });
    setSubmitted(issue.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Issue reported</h1>
          <p className="mt-2 text-sm text-muted-foreground">Thank you. A technician will be assigned shortly.</p>
          <div className="mt-6 rounded-lg border bg-muted/40 p-4">
            <div className="text-xs text-muted-foreground">Reference number</div>
            <div className="mt-1 font-mono text-lg font-bold text-primary">#{submitted}</div>
          </div>
          <Button className="mt-6 w-full" onClick={() => { setSubmitted(null); setTitle(""); setDescription(""); setPhoto(undefined); }}>
            Report another issue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-4 py-6 sm:py-10">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><ScanLine className="h-4 w-4" /></div>
          <span className="font-bold">MaintainIQ</span>
        </Link>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="text-xs font-mono text-muted-foreground">{asset.id}</div>
          <h1 className="mt-1 text-xl font-bold">{asset.name}</h1>
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {asset.location}
          </div>
          <div className="mt-2 inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{asset.category}</div>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-5 rounded-2xl border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-base font-semibold">Report an issue</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Takes less than a minute.</p>
          </div>

          <div>
            <Label htmlFor="t">Issue title *</Label>
            <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Not turning on" required />
          </div>

          <div>
            <Label htmlFor="d">Description *</Label>
            <Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="What's happening? When did it start?" required />
          </div>

          <div>
            <Label>Priority *</Label>
            <RadioGroup value={priority} onValueChange={(v) => setPriority(v as typeof priority)} className="mt-2 grid grid-cols-2 gap-2">
              {priorities.map((p) => (
                <label key={p.v} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition ${priority === p.v ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                  <RadioGroupItem value={p.v} className="mt-0.5" />
                  <div>
                    <div className="font-medium">{p.v}</div>
                    <div className="text-xs text-muted-foreground">{p.d}</div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Photo (optional)</Label>
            <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-muted/40">
              <Upload className="h-4 w-4" />
              {photo ? "Photo attached — tap to change" : "Tap to upload a photo"}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
            {photo && <img src={photo} alt="uploaded" className="mt-2 max-h-40 rounded-lg border object-cover" />}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="n">Your name (optional)</Label>
              <Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane" />
            </div>
            <div>
              <Label htmlFor="c">Contact (optional)</Label>
              <Input id="c" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or phone" />
            </div>
          </div>

          <Button type="submit" className="h-11 w-full text-base">Submit report</Button>
          <p className="text-center text-xs text-muted-foreground">Powered by MaintainIQ</p>
        </form>
      </div>
    </div>
  );
}

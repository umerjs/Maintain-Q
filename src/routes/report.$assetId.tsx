import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, CheckCircle2, Loader2, MapPin, ScanLine, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/report/$assetId")({ component: ReportPage });

type AssetRow = {
  id: string;
  code: string;
  name: string;
  category: string;
  location: string;
  status: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ReportPage() {
  const { assetId } = useParams({ from: "/report/$assetId" });

  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<AssetRow | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const priorities = useMemo(() => [
    { v: "Low", d: "Minor, can wait" },
    { v: "Medium", d: "Should be looked at" },
    { v: "High", d: "Urgent" },
    { v: "Critical", d: "Emergency" },
  ] as const, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const col = UUID_RE.test(assetId) ? "id" : "code";
      const [{ data: assetData }, { data: catData }] = await Promise.all([
        supabase.from("assets").select("id,code,name,category,location,status").eq(col, assetId).maybeSingle(),
        supabase.from("categories").select("name").order("name"),
      ]);
      if (!alive) return;
      setAsset((assetData as AssetRow) ?? null);
      setCategories((catData ?? []).map((c: { name: string }) => c.name));
      if (assetData?.category) setCategory(assetData.category);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [assetId]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    if (!title.trim() || !description.trim()) { toast.error("Please add a title and description"); return; }
    setSubmitting(true);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${asset.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("issue-photos").upload(path, photoFile, {
          contentType: photoFile.type, upsert: false,
        });
        if (upErr) throw upErr;
        photoUrl = path;
      }

      const { data, error } = await supabase.from("issues").insert({
        asset_id: asset.id,
        title: title.trim(),
        description: description.trim(),
        priority,
        reporter_name: name.trim() || "Anonymous",
        reporter_contact: contact.trim() || null,
        photo_url: photoUrl ?? null,
        code: "",
      }).select("id,code").single();
      if (error) throw error;

      await supabase.from("issue_activity").insert({
        issue_id: data.id,
        who: name.trim() || "Anonymous reporter",
        action: `Reported issue: ${title.trim()}`,
      });

      setSubmitted(data.code ?? data.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <Button className="mt-6 w-full" onClick={() => {
            setSubmitted(null); setTitle(""); setDescription(""); setPhotoFile(null); setPhotoPreview(undefined);
          }}>
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
          <div className="text-xs font-mono text-muted-foreground">{asset.code}</div>
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

          {categories.length > 0 && (
            <div>
              <Label htmlFor="cat">Category</Label>
              <select
                id="cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

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
              {photoFile ? "Photo attached — tap to change" : "Tap to upload a photo"}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
            {photoPreview && <img src={photoPreview} alt="uploaded" className="mt-2 max-h-40 rounded-lg border object-cover" />}
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

          <Button type="submit" disabled={submitting} className="h-11 w-full text-base">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : "Submit report"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Powered by MaintainIQ</p>
        </form>
      </div>
    </div>
  );
}

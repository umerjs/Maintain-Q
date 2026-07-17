import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Printer, CheckSquare, Square, Download } from "lucide-react";
import { useStore } from "@/data/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/app/qr-labels")({
  component: QrLabels,
  head: () => ({
    meta: [
      { title: "QR Labels — MaintainIQ" },
      { name: "description", content: "Generate and print QR code labels for your assets in bulk." },
    ],
  }),
});

function QrLabels() {
  const assets = useStore((s) => s.assets);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(assets.map((a) => a.id)));
  const [size, setSize] = useState<"S" | "M" | "L">("M");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q),
    );
  }, [assets, query]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAll = () => setSelected(new Set(filtered.map((a) => a.id)));
  const clearAll = () => setSelected(new Set());

  const qrPixels = size === "S" ? 120 : size === "L" ? 220 : 170;
  const cellPadding = size === "S" ? 12 : size === "L" ? 24 : 18;
  const gridCols = size === "S" ? 4 : size === "L" ? 2 : 3;

  const selectedAssets = assets.filter((a) => selected.has(a.id));
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const print = () => {
    if (selectedAssets.length === 0) {
      toast.error("Select at least one asset");
      return;
    }
    const printArea = document.getElementById("qr-print-area");
    if (!printArea) return;
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) {
      toast.error("Popup blocked");
      return;
    }
    w.document.write(`<!doctype html><html><head><title>MaintainIQ QR Labels</title>
<style>
  @page { size: A4; margin: 12mm; }
  body { font-family: Inter, system-ui, sans-serif; margin: 0; padding: 0; color: #0f172a; }
  h1 { font-size: 14px; margin: 0 0 12px; color: #64748b; font-weight: 500; }
  .grid { display: grid; grid-template-columns: repeat(${gridCols}, 1fr); gap: 12px; }
  .label { border: 1px dashed #cbd5e1; border-radius: 10px; padding: ${cellPadding}px; text-align: center; page-break-inside: avoid; }
  .label svg { display: block; margin: 0 auto; }
  .name { font-weight: 600; font-size: 13px; margin-top: 8px; }
  .meta { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 10px; color: #64748b; margin-top: 2px; }
  .loc { font-size: 10px; color: #64748b; margin-top: 2px; }
  .hint { font-size: 9px; color: #94a3b8; margin-top: 6px; }
</style></head><body>
<h1>MaintainIQ — ${selectedAssets.length} asset label${selectedAssets.length === 1 ? "" : "s"}</h1>
${printArea.innerHTML}
</body></html>`);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 400);
  };

  const downloadSvg = (assetId: string) => {
    const svg = document.getElementById(`bulk-qr-${assetId}`);
    if (!svg) return;
    const s = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([s], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${assetId}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QR Labels</h1>
        <p className="text-sm text-muted-foreground">
          Select assets, then print a QR sheet. Each label opens the public reporting page for that asset.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Search by name, ID, category, location…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sm:max-w-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border p-0.5 text-xs">
              {(["S", "M", "L"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`rounded px-2.5 py-1 ${size === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={selectAll}>
              <CheckSquare className="mr-1.5 h-4 w-4" /> All
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Square className="mr-1.5 h-4 w-4" /> None
            </Button>
            <Button size="sm" onClick={print} disabled={selectedAssets.length === 0}>
              <Printer className="mr-1.5 h-4 w-4" /> Print ({selectedAssets.length})
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => {
          const isSel = selected.has(a.id);
          const url = `${origin}/report/${a.id}`;
          return (
            <Card
              key={a.id}
              className={`p-4 transition ${isSel ? "border-primary ring-1 ring-primary/30" : ""}`}
            >
              <div className="flex items-start gap-3">
                <Checkbox checked={isSel} onCheckedChange={() => toggle(a.id)} className="mt-1" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{a.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{a.id}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {a.category} • {a.location}
                  </div>
                </div>
                <div className="rounded-md bg-white p-1.5">
                  <QRCodeSVG value={url} size={64} level="M" />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => downloadSvg(a.id)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> SVG
                </Button>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            No assets match "{query}".
          </div>
        )}
      </div>

      {/* Hidden print-only render of selected labels */}
      <div id="qr-print-area" className="hidden">
        <div className="grid">
          {selectedAssets.map((a) => {
            const url = `${origin}/report/${a.id}`;
            return (
              <div key={a.id} className="label">
                <QRCodeSVG id={`bulk-qr-${a.id}`} value={url} size={qrPixels} level="M" />
                <div className="name">{a.name}</div>
                <div className="meta">{a.id}</div>
                <div className="loc">{a.location}</div>
                <div className="hint">Scan to report an issue</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

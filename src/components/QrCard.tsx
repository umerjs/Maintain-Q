import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

export function QrCode({ value, size = 180, label }: { value: string; size?: number; label?: string }) {
  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-xl border bg-white p-4">
      <QRCodeSVG value={value} size={size} level="M" includeMargin={false} />
      {label && <div className="font-mono text-xs text-slate-600">{label}</div>}
    </div>
  );
}

export function QrCard({ value, assetId, assetName }: { value: string; assetId: string; assetName: string }) {
  const download = () => {
    const svg = document.getElementById(`qr-${assetId}`);
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

  const print = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const svg = document.getElementById(`qr-${assetId}`)?.outerHTML || "";
    w.document.write(`<html><head><title>${assetId}</title></head><body style="text-align:center;font-family:Inter,sans-serif;padding:40px">
      <h2>${assetName}</h2><div style="font-family:monospace;color:#64748B;margin-bottom:16px">${assetId}</div>
      ${svg}<p style="margin-top:16px;color:#64748B">Scan to report an issue</p></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border bg-white p-6">
      <QRCodeSVG id={`qr-${assetId}`} value={value} size={220} level="M" />
      <div className="text-center">
        <div className="font-semibold">{assetName}</div>
        <div className="font-mono text-xs text-muted-foreground">{assetId}</div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={download}><Download className="mr-1.5 h-4 w-4" /> Download</Button>
        <Button variant="outline" size="sm" onClick={print}><Printer className="mr-1.5 h-4 w-4" /> Print</Button>
      </div>
    </div>
  );
}

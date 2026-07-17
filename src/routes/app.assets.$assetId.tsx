import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useStore, techName, issuesForAsset } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AssetStatusBadge, PriorityBadge, StatusBadge } from "@/components/badges";
import { QrCard } from "@/components/QrCard";
import { ArrowLeft, MapPin, Calendar, Factory, Hash, FileText, Wrench } from "lucide-react";
import { format, formatDistanceToNow, addMonths } from "date-fns";

export const Route = createFileRoute("/app/assets/$assetId")({ component: AssetDetail });

function AssetDetail() {
  const { assetId } = useParams({ from: "/app/assets/$assetId" });
  const asset = useStore((s) => s.assets.find((a) => a.id === assetId));
  const allIssues = useStore((s) => s.issues);
  const technicians = useStore((s) => s.technicians);

  if (!asset) {
    return (
      <div className="text-center py-20">
        <div className="text-lg font-semibold">Asset not found</div>
        <Link to="/app/assets"><Button variant="outline" className="mt-4"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button></Link>
      </div>
    );
  }

  const issues = issuesForAsset(allIssues, asset.id).sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));
  const openIssues = issues.filter((i) => i.status !== "Resolved");
  const reportUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/report/${asset.id}`;

  const nextService = asset.installationDate
    ? addMonths(new Date(asset.installationDate), 6 * (Math.floor((Date.now() - +new Date(asset.installationDate)) / (86400000 * 30 * 6)) + 1))
    : addMonths(new Date(), 3);

  return (
    <div className="space-y-5">
      <Link to="/app/assets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All assets
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="font-mono text-xs text-muted-foreground">{asset.id}</div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
            <AssetStatusBadge status={asset.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5"><span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{asset.category}</span></div>
            <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {asset.location}</div>
            {asset.manufacturer && <div className="flex items-center gap-1.5"><Factory className="h-4 w-4" /> {asset.manufacturer}</div>}
            {asset.modelNumber && <div className="flex items-center gap-1.5"><Hash className="h-4 w-4" /> {asset.modelNumber}</div>}
            {asset.installationDate && <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Installed {format(new Date(asset.installationDate), "MMM d, yyyy")}</div>}
          </div>
          {asset.description && <p className="mt-4 max-w-2xl text-sm">{asset.description}</p>}
        </div>
        <QrCard value={reportUrl} assetId={asset.id} assetName={asset.name} />
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Service History ({issues.length})</TabsTrigger>
          <TabsTrigger value="open">Open Issues ({openIssues.length})</TabsTrigger>
          <TabsTrigger value="preventive">Preventive Schedule</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card><CardContent className="p-0">
            {issues.length === 0 ? (
              <div className="py-14 text-center text-sm text-muted-foreground">No service history yet.</div>
            ) : (
              <ol className="divide-y">
                {issues.map((i) => (
                  <li key={i.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{i.id}</span>
                          <PriorityBadge priority={i.priority} />
                          <StatusBadge status={i.status} />
                        </div>
                        <div className="mt-1 font-medium">{i.title}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{i.description}</div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Reported {formatDistanceToNow(new Date(i.reportedAt), { addSuffix: true })}
                          {i.assignedTo && <> · Assigned to <span className="font-medium text-foreground">{techName(technicians, i.assignedTo)}</span></>}
                          {i.resolvedAt && <> · Resolved {formatDistanceToNow(new Date(i.resolvedAt), { addSuffix: true })}</>}
                        </div>
                        {i.resolutionNotes && (
                          <div className="mt-2 rounded-md border border-success/30 bg-success/5 p-3 text-sm">
                            <span className="font-medium text-success">Resolution:</span> {i.resolutionNotes}
                          </div>
                        )}
                      </div>
                      {i.photoUrl && <img src={i.photoUrl} alt="evidence" className="h-20 w-20 rounded-md border object-cover" />}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="open">
          <Card><CardContent className="p-0">
            {openIssues.length === 0 ? (
              <div className="py-14 text-center text-sm text-muted-foreground">No open issues. 🎉</div>
            ) : (
              <ul className="divide-y">
                {openIssues.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{i.id}</span>
                        <PriorityBadge priority={i.priority} />
                        <StatusBadge status={i.status} />
                      </div>
                      <div className="mt-1 font-medium">{i.title}</div>
                    </div>
                    <Link to="/app/issues" search={{ id: i.id } as never} className="text-sm font-medium text-primary hover:underline">Open →</Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="preventive">
          <Card><CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary"><Wrench className="h-5 w-5" /></div>
              <div>
                <div className="font-semibold">Recommended maintenance interval</div>
                <div className="mt-0.5 text-sm text-muted-foreground">Every 6 months, based on {asset.category} best practice.</div>
                <div className="mt-4 rounded-lg border bg-muted/40 p-4">
                  <div className="text-xs text-muted-foreground">Next service due</div>
                  <div className="mt-1 text-lg font-bold">{format(nextService, "MMMM d, yyyy")}</div>
                  <div className="text-xs text-muted-foreground">{formatDistanceToNow(nextService, { addSuffix: true })}</div>
                </div>
              </div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card><CardContent className="py-14 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <div className="mt-3 font-medium">No documents attached</div>
            <div className="mt-1 text-sm text-muted-foreground">Upload manuals, warranties, and safety sheets.</div>
            <Button variant="outline" size="sm" className="mt-4">Upload document</Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

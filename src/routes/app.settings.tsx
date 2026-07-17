import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

function SettingsPage() {
  const orgName = useStore((s) => s.orgName);
  const setOrgName = useStore((s) => s.setOrgName);
  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const removeCategory = useStore((s) => s.removeCategory);
  const technicians = useStore((s) => s.technicians);
  const [org, setOrg] = useState(orgName);
  const [newCat, setNewCat] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);

  const saveOrg = () => { setOrgName(org); toast.success("Organization updated"); };

  const addCat = () => {
    if (!newCat.trim()) return;
    addCategory(newCat.trim()); setNewCat(""); toast.success("Category added");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your organization.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Organization</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Organization name</Label><Input value={org} onChange={(e) => setOrg(e.target.value)} /></div>
          <div>
            <Label>Logo</Label>
            <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground hover:border-primary/40">
              Click to upload logo
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>
          <Button onClick={saveOrg}>Save changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Asset Categories</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Badge key={c} variant="secondary" className="gap-1 pl-3 pr-1 text-sm">
                {c}
                <button onClick={() => removeCategory(c)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCat()} placeholder="Add category…" />
            <Button onClick={addCat}><Plus className="mr-1.5 h-4 w-4" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email alerts for new issues</div>
              <div className="text-sm text-muted-foreground">Get notified when someone reports an issue.</div>
            </div>
            <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Overdue task alerts</div>
              <div className="text-sm text-muted-foreground">Daily email digest of overdue tasks.</div>
            </div>
            <Switch checked={overdueAlerts} onCheckedChange={setOverdueAlerts} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Team Members</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-2 font-medium">Name</th><th className="px-4 py-2 font-medium">Email</th><th className="px-4 py-2 font-medium">Role</th></tr>
            </thead>
            <tbody>
              {technicians.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-2.5 font-medium">{t.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{t.email}</td>
                  <td className="px-4 py-2.5"><Badge variant="outline">Technician</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

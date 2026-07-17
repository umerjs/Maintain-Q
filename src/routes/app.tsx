import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/data/mockData";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const auth = useStore((s) => s.auth);
  const setRole = useStore((s) => s.setRole);
  const nav = useNavigate();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useStore.persist.hasHydrated()) setHydrated(true);
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && !useStore.getState().auth) nav({ to: "/login" });
  }, [hydrated, nav, auth]);

  if (!hydrated) return <div className="grid min-h-screen place-items-center bg-background"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!auth) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Badge variant="outline" className="hidden font-normal sm:inline-flex">{auth.orgName}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">View as:</span>
              <div className="flex overflow-hidden rounded-md border">
                <Button
                  size="sm" variant={auth.role === "Admin" ? "default" : "ghost"}
                  className="h-8 rounded-none px-3" onClick={() => setRole("Admin")}>Admin</Button>
                <Button
                  size="sm" variant={auth.role === "Technician" ? "default" : "ghost"}
                  className="h-8 rounded-none px-3" onClick={() => { setRole("Technician"); nav({ to: "/app/my-jobs" }); }}>Technician</Button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

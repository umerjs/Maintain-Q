import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const auth = useStore((s) => s.auth);
  const login = useStore((s) => s.login);
  const logout = useStore((s) => s.logout);
  const setOrgName = useStore((s) => s.setOrgName);
  const setRole = useStore((s) => s.setRole);
  const nav = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.user) {
        logout();
        nav({ to: "/login" });
        setChecked(true);
        return;
      }
      if (!useStore.getState().auth) {
        const uid = session.user.id;
        const [{ data: profile }, { data: roles }] = await Promise.all([
          supabase.from("profiles").select("name, org_name").eq("id", uid).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", uid),
        ]);
        const role = roles?.find((r) => r.role === "Admin") ? "Admin"
          : roles?.find((r) => r.role === "Technician") ? "Technician" : "Reporter";
        const orgName = profile?.org_name ?? "MaintainIQ Org";
        setOrgName(orgName);
        login({
          name: profile?.name ?? session.user.email?.split("@")[0] ?? "User",
          email: session.user.email ?? "",
          orgName,
          role: role as "Admin" | "Technician" | "Reporter",
        });
      }
      setChecked(true);
    };
    hydrate();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { logout(); nav({ to: "/login" }); }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [login, logout, nav, setOrgName]);

  if (!checked) return <div className="grid min-h-screen place-items-center bg-background"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
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

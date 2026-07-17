import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore, ADMIN_EMAIL } from "@/data/mockData";
import { resolveRole } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const auth = useStore((s) => s.auth);
  const login = useStore((s) => s.login);
  const logout = useStore((s) => s.logout);
  const setOrgName = useStore((s) => s.setOrgName);
  const nav = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      // Always validate against Supabase session — Zustand auth is
      // only a cache, never the source of truth for login state.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session?.user) {
        logout();
        nav({ to: "/login" });
        setChecked(true);
        return;
      }

      const uid = session.user.id;
      const email = session.user.email ?? "";

      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("name, org_name")
          .eq("id", uid)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);

      const role = resolveRole(roles, email);
      const orgName = profile?.org_name ?? "Helplytics AI Community";
      setOrgName(orgName);
      login({
        id: uid,
        name: profile?.name ?? email.split("@")[0] ?? "User",
        email,
        orgName,
        role,
      });
      setChecked(true);
    };

    hydrate();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        logout();
        nav({ to: "/login" });
      }
      // Re-hydrate on token refresh or new sign-in to keep Zustand in sync
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        hydrate();
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [login, logout, nav, setOrgName]);

  if (!checked)
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  if (!auth) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Badge
                variant="outline"
                className="hidden font-normal sm:inline-flex"
              >
                {auth.orgName}
              </Badge>
            </div>
            <Badge variant="secondary">{auth.role}</Badge>
          </header>
          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

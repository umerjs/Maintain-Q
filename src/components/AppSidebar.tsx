import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, AlertTriangle, Wrench, FileBarChart, Settings, LogOut, ClipboardList, ScanLine, QrCode
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useStore } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const adminNav = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Assets", url: "/app/assets", icon: Package },
  { title: "Issues", url: "/app/issues", icon: AlertTriangle },
  { title: "Technicians", url: "/app/technicians", icon: Wrench },
  { title: "QR Labels", url: "/app/qr-labels", icon: QrCode },
  { title: "Reports", url: "/app/reports", icon: FileBarChart },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

const techNav = [
  { title: "My Jobs", url: "/app/my-jobs", icon: ClipboardList },
  { title: "Assets", url: "/app/assets", icon: Package },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const auth = useStore((s) => s.auth);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();

  const items = auth?.role === "Technician" ? techNav : adminNav;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link to="/app/dashboard" className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ScanLine className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">MaintainIQ</div>
              <div className="truncate text-[11px] text-muted-foreground">{auth?.orgName}</div>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{auth?.role === "Technician" ? "Technician" : "Workspace"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        {!collapsed && auth && (
          <div className="px-2 py-1.5">
            <div className="truncate text-sm font-medium">{auth.name}</div>
            <div className="truncate text-xs text-muted-foreground">{auth.role}</div>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className="justify-start"
          onClick={async () => { await supabase.auth.signOut().catch(() => {}); logout(); navigate({ to: "/" }); }}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Log out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Compass, PlusCircle, ClipboardList, MessageCircle,
  Trophy, Bot, Bell, UserCircle, Shield, LogOut, HeartHandshake,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useStore } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const baseNav = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Explore", url: "/app/explore", icon: Compass },
  { title: "Create Request", url: "/app/create-request", icon: PlusCircle },
  { title: "My Contributions", url: "/app/my-requests", icon: ClipboardList },
  { title: "Messages", url: "/app/messages", icon: MessageCircle },
  { title: "Leaderboard", url: "/app/leaderboard", icon: Trophy },
  { title: "AI Center", url: "/app/ai-center", icon: Bot },
  { title: "Notifications", url: "/app/notifications", icon: Bell },
  { title: "Profile", url: "/app/profile", icon: UserCircle },
];

const adminExtra = { title: "Admin Panel", url: "/app/admin", icon: Shield };

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const auth = useStore((s) => s.auth);
  const notifications = useStore((s) => s.notifications);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();

  const unread = notifications.filter(
    (n) => !n.read && (n.userId === auth?.id || n.userId === auth?.email),
  ).length;

  const items = auth?.role === "Admin" ? [...baseNav, adminExtra] : baseNav;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link to="/app/dashboard" className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <HeartHandshake className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">Helplytics AI</div>
              <div className="truncate text-[11px] text-muted-foreground">{auth?.orgName}</div>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{auth?.role ?? "Workspace"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="flex flex-1 items-center justify-between gap-2">
                            {item.title}
                            {item.title === "Notifications" && unread > 0 && (
                              <span className="rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">{unread}</span>
                            )}
                          </span>
                        )}
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

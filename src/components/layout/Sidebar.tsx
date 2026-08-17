import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Film, PlusSquare, ClipboardCheck, Kanban,
  BarChart3, Bell, ScrollText, User, Settings, LogOut, Clapperboard,
  Users, ShieldCheck, FileBarChart, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole, type Permission } from "@/lib/roles";

type Item = { to: string; label: string; icon: typeof Film; perm: Permission };

const nav: { section: string; items: Item[] }[] = [
  { section: "Overview", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "view_platform" },
    { to: "/analytics", label: "Analytics", icon: BarChart3, perm: "analytics" },
  ]},
  { section: "Content", items: [
    { to: "/shows", label: "Shows", icon: Film, perm: "search_shows" },
    { to: "/shows/new", label: "Submit Show", icon: PlusSquare, perm: "submit_show" },
    { to: "/evaluation", label: "Evaluation", icon: ClipboardCheck, perm: "evaluate_content" },
    { to: "/production", label: "Production", icon: Kanban, perm: "view_production_status" },
    { to: "/reports", label: "Reports", icon: FileBarChart, perm: "generate_reports" },
  ]},
  { section: "Administration", items: [
    { to: "/users", label: "User Management", icon: Users, perm: "manage_users" },
    { to: "/permissions", label: "Permission Matrix", icon: ShieldCheck, perm: "view_platform" },
    { to: "/audit-logs", label: "Audit Logs", icon: ScrollText, perm: "audit_logs" },
  ]},
  { section: "Workspace", items: [
    { to: "/notifications", label: "Notifications", icon: Bell, perm: "view_platform" },
    { to: "/profile", label: "Profile", icon: User, perm: "update_personal_info" },
    { to: "/settings", label: "Settings", icon: Settings, perm: "update_personal_info" },
  ]},
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { can, profile } = useRole();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-border bg-sidebar z-40">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-sidebar-border">
        <div className="h-9 w-9 grid place-items-center rounded-xl bg-primary shadow-[var(--shadow-glow)]">
          <Clapperboard className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-wide text-sidebar-foreground">NETFLIX</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Show Manager</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-6">
        {nav.map((group) => (
          <div key={group.section}>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.section}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
                const allowed = can(item.perm);
                if (!allowed) {
                  return (
                    <li key={item.to}>
                      <div
                        title={`Requires elevated role — locked for ${profile.label}`}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground/40 cursor-not-allowed"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        <Lock className="ml-auto h-3 w-3" />
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                        active
                          ? "bg-primary/10 text-primary-foreground shadow-inner"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      <span className="truncate">{item.label}</span>
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="glass rounded-2xl p-3 space-y-2">
          <div className="flex items-center gap-3">
            <img src={profile.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{profile.person}</div>
              <div className="text-xs text-muted-foreground truncate">{profile.label}</div>
            </div>
            <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

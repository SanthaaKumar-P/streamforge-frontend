import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Film, PlusSquare, ClipboardCheck, Kanban,
  BarChart3, Bell, ScrollText, User, Settings, LogOut, Clapperboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { section: "Overview", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
  ]},
  { section: "Content", items: [
    { to: "/shows", label: "Shows", icon: Film },
    { to: "/shows/new", label: "Submit Show", icon: PlusSquare },
    { to: "/evaluation", label: "Evaluation", icon: ClipboardCheck },
    { to: "/production", label: "Production", icon: Kanban },
  ]},
  { section: "Workspace", items: [
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/audit-logs", label: "Audit Logs", icon: ScrollText },
    { to: "/profile", label: "Profile", icon: User },
    { to: "/settings", label: "Settings", icon: Settings },
  ]},
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
            <img src="https://i.pravatar.cc/64?img=13" alt="" className="h-9 w-9 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">Ren Ito</div>
              <div className="text-xs text-muted-foreground truncate">Administrator</div>
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

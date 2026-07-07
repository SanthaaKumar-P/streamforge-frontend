import { Bell, MessageSquare, Search, Sun, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="h-full flex items-center gap-3 px-4 md:px-6">
        <div className="lg:hidden flex items-center gap-2 mr-2">
          <div className="h-8 w-8 grid place-items-center rounded-lg bg-primary">
            <span className="text-xs font-black text-primary-foreground">N</span>
          </div>
        </div>

        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search shows, creators, productions…"
            className="w-full h-10 pl-10 pr-16 rounded-xl bg-surface border border-border text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
          />
          <kbd className="hidden md:inline-flex items-center gap-1 absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-border">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-1.5">
          <Link to="/shows/new" className="hidden md:inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-[var(--shadow-glow)]">
            <Zap className="h-4 w-4" /> New Show
          </Link>
          <IconBtn><Sun className="h-4 w-4" /></IconBtn>
          <IconBtn badge="3"><MessageSquare className="h-4 w-4" /></IconBtn>
          <Link to="/notifications" className="relative h-10 w-10 grid place-items-center rounded-xl hover:bg-accent transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
          </Link>
          <Link to="/profile" className="ml-1">
            <img src="https://i.pravatar.cc/64?img=13" alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-border hover:ring-primary/60 transition" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function IconBtn({ children, badge }: { children: React.ReactNode; badge?: string }) {
  return (
    <button className="relative h-10 w-10 grid place-items-center rounded-xl hover:bg-accent transition-colors text-foreground/80 hover:text-foreground">
      {children}
      {badge && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 grid place-items-center text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}

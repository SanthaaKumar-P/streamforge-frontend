import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, CornerDownLeft, Film, Compass, ShieldCheck } from "lucide-react";
import { shows } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const pages = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Analytics", to: "/analytics" },
  { label: "Shows", to: "/shows" },
  { label: "Submit Show", to: "/shows/new" },
  { label: "Content Evaluation", to: "/evaluation" },
  { label: "Production Management", to: "/production" },
  { label: "Reports", to: "/reports" },
  { label: "User Management", to: "/users" },
  { label: "Permission Matrix", to: "/permissions" },
  { label: "Notifications", to: "/notifications" },
  { label: "Audit Logs", to: "/audit-logs" },
  { label: "Profile", to: "/profile" },
  { label: "Settings", to: "/settings" },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const p = pages
      .filter((x) => x.label.toLowerCase().includes(term))
      .map((x) => ({ kind: "page" as const, label: x.label, sub: x.to, to: x.to, params: undefined }));
    const s = shows
      .filter((x) => !term || `${x.title} ${x.genre} ${x.creator}`.toLowerCase().includes(term))
      .slice(0, 6)
      .map((x) => ({
        kind: "show" as const,
        label: x.title,
        sub: `${x.genre} · ${x.creator} · ${x.status}`,
        to: "/shows/$showId",
        params: { showId: x.id },
      }));
    return [...s, ...p].slice(0, 10);
  }, [q]);

  useEffect(() => setCursor(0), [q]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (!open) return null;

  const go = (r: (typeof results)[number]) => {
    onOpenChange(false);
    navigate({ to: r.to, params: r.params as never });
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-sm p-4 pt-[12vh]"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="glass mx-auto max-w-2xl rounded-2xl overflow-hidden shadow-[var(--shadow-elegant)] animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onOpenChange(false);
              if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => (c + 1) % results.length); }
              if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => (c - 1 + results.length) % results.length); }
              if (e.key === "Enter" && results[cursor]) go(results[cursor]);
            }}
            placeholder="Search shows, people, pages…"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">ESC</kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto scrollbar-thin p-2">
          {results.length === 0 && (
            <li className="p-6 text-center text-sm text-muted-foreground">No matches for “{q}”</li>
          )}
          {results.map((r, i) => (
            <li key={`${r.kind}-${r.label}`}>
              <button
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                  i === cursor ? "bg-primary/15" : "hover:bg-accent",
                )}
              >
                <span className="h-8 w-8 grid place-items-center rounded-lg bg-surface-elevated text-muted-foreground shrink-0">
                  {r.kind === "show" ? <Film className="h-4 w-4" /> : <Compass className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium truncate">{r.label}</span>
                  <span className="block text-xs text-muted-foreground truncate">{r.sub}</span>
                </span>
                {i === cursor && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </li>
          ))}
        </ul>

        <div className="px-4 py-2.5 border-t border-border flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Results are filtered by your active role permissions.
        </div>
      </div>
    </div>
  );
}

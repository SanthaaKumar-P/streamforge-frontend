import { useState } from "react";
import { ChevronDown, Check, UserCog } from "lucide-react";
import { ROLES, useRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const { role, setRole, profile } = useRole();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-border text-sm hover:bg-accent transition",
          compact ? "h-10 px-2.5" : "h-10 px-3",
        )}
      >
        <UserCog className="h-4 w-4 text-primary" />
        {!compact && <span className="font-medium">{profile.label}</span>}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 z-50 glass rounded-2xl p-2 shadow-[var(--shadow-elegant)] animate-fade-in-up">
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              Simulate role (RBAC preview)
            </div>
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => { setRole(r.id); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                  r.id === role ? "bg-primary/15" : "hover:bg-accent",
                )}
              >
                <img src={r.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium truncate">{r.label}</span>
                  <span className="block text-xs text-muted-foreground truncate">{r.blurb}</span>
                </span>
                {r.id === role && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn("rounded-2xl border border-border p-5", className)}
      style={{ background: "var(--gradient-card)" }}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label, value, delta, icon, accent,
}: { label: string; value: string; delta?: string; icon: ReactNode; accent?: "primary" | "success" | "warning" | "info" }) {
  const map: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
  };
  return (
    <Card className="card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight truncate">{value}</div>
          {delta && (
            <div className="mt-1 text-xs text-success">
              {delta} <span className="text-muted-foreground">vs last mo.</span>
            </div>
          )}
        </div>
        <div className={cn("h-10 w-10 shrink-0 grid place-items-center rounded-xl", map[accent ?? "primary"])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function Chip({
  children, variant = "default",
}: { children: ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info" | "primary" }) {
  const styles: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info",
    primary: "bg-primary/15 text-primary",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium", styles[variant])}>
      {children}
    </span>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: "var(--gradient-primary)" }}
      />
    </div>
  );
}

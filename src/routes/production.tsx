import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, Chip, Progress } from "@/components/ui-kit";
import { shows, formatCurrency, type ProductionStage } from "@/lib/mock-data";
import { Calendar, Users, Plus, Filter } from "lucide-react";

export const Route = createFileRoute("/production")({
  head: () => ({
    meta: [
      { title: "Production — Netflix Show Manager" },
      { name: "description", content: "Kanban board tracking productions from planning to release." },
    ],
  }),
  component: Production,
});

const columns: { id: ProductionStage; label: string; accent: string }[] = [
  { id: "planning", label: "Planning", accent: "bg-info" },
  { id: "pre-production", label: "Pre-Production", accent: "bg-warning" },
  { id: "production", label: "Production", accent: "bg-primary" },
  { id: "post-production", label: "Post-Production", accent: "bg-chart-4" },
  { id: "completed", label: "Completed", accent: "bg-success" },
];

const priorityVariant = {
  low: "info", medium: "default", high: "warning", critical: "danger",
} as const;

function Production() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Production Board"
        description="Drag-and-drop workflow across all active originals."
        actions={
          <>
            <button className="h-10 px-3 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition"><Filter className="h-4 w-4" /> Filter</button>
            <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition shadow-[var(--shadow-glow)]"><Plus className="h-4 w-4" /> Add card</button>
          </>
        }
      />

      <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-4 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
        {columns.map((col) => {
          const items = shows.filter((s) => s.stage === col.id);
          return (
            <div key={col.id} className="w-80 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.accent}`} />
                  <div className="text-sm font-semibold">{col.label}</div>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <button className="h-7 w-7 grid place-items-center rounded-lg hover:bg-accent transition text-muted-foreground">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {items.map((s) => (
                  <Card key={s.id} className="card-hover !p-0 overflow-hidden cursor-grab">
                    <div className="relative h-28">
                      <img src={s.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, oklch(0.14 0 0 / 0.9))" }} />
                      <div className="absolute top-2 left-2">
                        <Chip variant={priorityVariant[s.priority]}>{s.priority}</Chip>
                      </div>
                      <div className="absolute bottom-2 left-3 right-3">
                        <div className="text-sm font-bold truncate">{s.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{s.creator}</div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{s.progress}%</span>
                        </div>
                        <Progress value={s.progress} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-3 w-3" /> {s.team} crew
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                          <Calendar className="h-3 w-3" /> {new Date(s.deadline).toLocaleDateString("en", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="text-xs text-muted-foreground">Budget</div>
                        <div className="text-xs font-semibold">{formatCurrency(s.budget)}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, Chip, Progress } from "@/components/ui-kit";
import { shows, formatCurrency, type ShowStatus } from "@/lib/mock-data";
import { Filter, Search, SlidersHorizontal, MoreHorizontal, Eye, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/shows")({
  head: () => ({
    meta: [
      { title: "Shows — Netflix Show Manager" },
      { name: "description", content: "Browse and manage all submitted Netflix originals." },
    ],
  }),
  component: ShowsPage,
});

const statusVariant: Record<ShowStatus, "success" | "warning" | "danger" | "info" | "primary"> = {
  approved: "success", pending: "warning", rejected: "danger", review: "info", production: "primary",
};

function ShowsPage() {
  const [q, setQ] = useState("");
  const filtered = shows.filter((s) => s.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <DashboardLayout>
      <PageHeader
        title="Shows"
        description="All submitted, approved and in-production originals."
        actions={
          <Link to="/shows/new" className="inline-flex h-10 px-4 items-center rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition shadow-[var(--shadow-glow)]">
            Submit show
          </Link>
        }
      />

      <Card className="mb-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, creator, genre…"
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="h-10 px-3 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition">
              <Filter className="h-4 w-4" /> Status
            </button>
            <button className="h-10 px-3 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition">
              <SlidersHorizontal className="h-4 w-4" /> Sort
            </button>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {filtered.slice(0, 6).map((s) => (
          <Card key={s.id} className="card-hover overflow-hidden !p-0">
            <div className="relative h-40">
              <img src={s.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, oklch(0.14 0 0 / 0.95))" }} />
              <div className="absolute top-3 left-3 flex gap-2">
                <Chip variant={statusVariant[s.status]}>{s.status}</Chip>
                <Chip>{s.genre}</Chip>
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <div className="text-lg font-bold truncate">{s.title}</div>
                <div className="text-xs text-muted-foreground">by {s.creator} · {s.episodes} eps</div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-semibold">{formatCurrency(s.budget)}</span>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground capitalize">{s.stage}</span>
                  <span className="font-medium">{s.progress}%</span>
                </div>
                <Progress value={s.progress} />
              </div>
              <div className="flex items-center gap-2">
                <button className="flex-1 h-9 rounded-lg border border-border text-xs hover:bg-accent transition inline-flex items-center justify-center gap-1.5"><Eye className="h-3.5 w-3.5" /> View</button>
                <button className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-accent transition"><Pencil className="h-3.5 w-3.5" /></button>
                <button className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-destructive/20 hover:text-destructive transition"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">All shows</div>
          <div className="text-xs text-muted-foreground">{filtered.length} results</div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-surface-elevated/40">
              <tr>
                <th className="p-4">Show</th>
                <th className="p-4">Genre</th>
                <th className="p-4">Episodes</th>
                <th className="p-4">Budget</th>
                <th className="p-4">Creator</th>
                <th className="p-4">Submitted</th>
                <th className="p-4">Status</th>
                <th className="p-4">Stage</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-accent/40 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={s.poster} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{s.title}</div>
                        <div className="text-xs text-muted-foreground">{s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{s.genre}</td>
                  <td className="p-4">{s.episodes}</td>
                  <td className="p-4">{formatCurrency(s.budget)}</td>
                  <td className="p-4">{s.creator}</td>
                  <td className="p-4 whitespace-nowrap">{new Date(s.submittedAt).toLocaleDateString()}</td>
                  <td className="p-4"><Chip variant={statusVariant[s.status]}>{s.status}</Chip></td>
                  <td className="p-4 capitalize">{s.stage.replace("-", " ")}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button className="h-8 w-8 grid place-items-center rounded-lg hover:bg-success/20 hover:text-success transition"><CheckCircle2 className="h-4 w-4" /></button>
                      <button className="h-8 w-8 grid place-items-center rounded-lg hover:bg-destructive/20 hover:text-destructive transition"><XCircle className="h-4 w-4" /></button>
                      <button className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent transition"><MoreHorizontal className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div>Page 1 of 12</div>
          <div className="flex gap-1">
            {[1, 2, 3, "…", 12].map((p, i) => (
              <button key={i} className={`h-8 w-8 rounded-lg border border-border ${p === 1 ? "bg-primary text-primary-foreground border-transparent" : "hover:bg-accent"}`}>{p}</button>
            ))}
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}

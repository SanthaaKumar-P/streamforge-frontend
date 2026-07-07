import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, Chip, Progress } from "@/components/ui-kit";
import { shows, formatCurrency } from "@/lib/mock-data";
import { CheckCircle2, MessageSquare, RotateCcw, Star, XCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/evaluation")({
  head: () => ({
    meta: [
      { title: "Evaluation — Netflix Show Manager" },
      { name: "description", content: "Evaluate submitted shows across story, market and budget dimensions." },
    ],
  }),
  component: Evaluation,
});

const criteria = [
  { key: "story", label: "Story Quality", weight: 0.3 },
  { key: "originality", label: "Originality", weight: 0.2 },
  { key: "audience", label: "Audience Appeal", weight: 0.2 },
  { key: "budget", label: "Budget Feasibility", weight: 0.15 },
  { key: "market", label: "Market Potential", weight: 0.15 },
];

function Evaluation() {
  const [selected, setSelected] = useState(shows[0]);
  const [scores, setScores] = useState<Record<string, number>>({ story: 4, originality: 5, audience: 4, budget: 3, market: 4 });
  const weighted = criteria.reduce((acc, c) => acc + (scores[c.key] ?? 0) * c.weight, 0);

  return (
    <DashboardLayout>
      <PageHeader title="Content Evaluation" description="Score submissions and route them to production." />

      <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-6">
        <Card className="!p-0 h-fit">
          <div className="p-4 border-b border-border">
            <div className="text-sm font-semibold">Evaluation Queue</div>
            <div className="text-xs text-muted-foreground">{shows.length} pending</div>
          </div>
          <ul className="max-h-[70vh] overflow-y-auto scrollbar-thin divide-y divide-border">
            {shows.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setSelected(s)}
                  className={`w-full text-left p-4 hover:bg-accent/40 transition flex items-center gap-3 ${selected.id === s.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                >
                  <img src={s.poster} alt="" className="h-11 w-11 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{s.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.creator} · {s.genre}</div>
                  </div>
                  <Chip variant="warning">Review</Chip>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="!p-0 overflow-hidden">
            <div className="relative h-52">
              <img src={selected.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 20%, oklch(0.14 0 0 / 0.95))" }} />
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Chip variant="primary">{selected.genre}</Chip>
                    <Chip>{selected.language}</Chip>
                    <Chip variant="warning">Review</Chip>
                  </div>
                  <h2 className="text-2xl font-bold">{selected.title}</h2>
                  <div className="text-sm text-muted-foreground">by {selected.creator} · {selected.episodes} episodes · {formatCurrency(selected.budget)}</div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">{selected.description}</p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-sm font-semibold">Weighted score</div>
                <div className="text-xs text-muted-foreground">Auto-calculated from criteria</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold gradient-text">{weighted.toFixed(2)} / 5.0</div>
                <div className="text-xs text-success">Recommend: Approve</div>
              </div>
            </div>

            <div className="space-y-5">
              {criteria.map((c) => (
                <div key={c.key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm">
                      <span className="font-medium">{c.label}</span>
                      <span className="text-muted-foreground text-xs ml-2">weight {Math.round(c.weight * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button key={v} onClick={() => setScores((s) => ({ ...s, [c.key]: v }))}>
                          <Star className={`h-5 w-5 ${v <= (scores[c.key] ?? 0) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Progress value={((scores[c.key] ?? 0) / 5) * 100} />
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Reviewer notes</div>
              <textarea rows={4} className="w-full rounded-xl bg-surface border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" defaultValue="Strong pilot with a distinct voice. Suggest tightening episodes 4-6 pacing and clarifying the antagonist's motive." />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button className="h-10 px-4 rounded-xl bg-success text-success-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition">
                <CheckCircle2 className="h-4 w-4" /> Approve
              </button>
              <button className="h-10 px-4 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition">
                <XCircle className="h-4 w-4" /> Reject
              </button>
              <button className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition">
                <RotateCcw className="h-4 w-4" /> Request changes
              </button>
              <button className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition ml-auto">
                <MessageSquare className="h-4 w-4" /> Discuss
              </button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

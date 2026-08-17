import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, Chip, Progress } from "@/components/ui-kit";
import { shows, formatCurrency, genreDistribution } from "@/lib/mock-data";
import { useRole } from "@/lib/roles";
import { Download, FileBarChart, FileSpreadsheet, FileText, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Netflix Show Manager" },
      { name: "description", content: "Generate and export content, budget and production performance reports for the studio." },
      { property: "og:title", content: "Reports — Netflix Show Manager" },
      { property: "og:description", content: "Generate and export studio performance reports." },
    ],
  }),
  component: ReportsPage,
});

const templates = [
  { id: "content", name: "Content Pipeline Report", desc: "Submissions, approvals and rejection reasons by genre.", icon: FileBarChart },
  { id: "budget", name: "Budget Utilisation Report", desc: "Allocated vs. burned budget per production, with variance.", icon: FileSpreadsheet },
  { id: "production", name: "Production Health Report", desc: "Stage timelines, blockers and crew allocation.", icon: FileText },
  { id: "roi", name: "ROI & Forecast Report", desc: "Revenue projections against greenlight assumptions.", icon: Sparkles },
];

function ReportsPage() {
  const { can, profile } = useRole();
  const [tpl, setTpl] = useState(templates[0].id);
  const [range, setRange] = useState("Last 90 days");
  const [generating, setGenerating] = useState(false);
  const [ready, setReady] = useState(false);

  if (!can("generate_reports")) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <Card className="max-w-md text-center py-12">
            <div className="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-destructive/15 text-destructive mb-5">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold">Reporting locked</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Report generation is available to Directors (limited), Producers, Content Managers and Admins. Current role: {profile.label}.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const generate = () => {
    setGenerating(true);
    setReady(false);
    setTimeout(() => { setGenerating(false); setReady(true); }, 1200);
  };

  const totalBudget = shows.reduce((a, s) => a + s.budget, 0);

  return (
    <DashboardLayout>
      <PageHeader title="Reports" description="Build, preview and export executive reports across the content lifecycle." />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTpl(t.id); setReady(false); }}
                className={cn(
                  "text-left rounded-2xl border p-5 transition card-hover",
                  tpl === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                )}
                style={tpl === t.id ? undefined : { background: "var(--gradient-card)" }}
              >
                <div className="flex items-start gap-3">
                  <span className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <t.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="block text-xs text-muted-foreground mt-1">{t.desc}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>

          <Card className="!p-0 overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="text-sm font-semibold">Live preview</div>
              <Chip variant={ready ? "success" : "info"}>{ready ? "Ready to export" : "Draft"}</Chip>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid sm:grid-cols-3 gap-4">
                <Metric label="Titles in scope" value={String(shows.length)} />
                <Metric label="Committed budget" value={formatCurrency(totalBudget)} />
                <Metric label="Avg. completion" value={`${Math.round(shows.reduce((a, s) => a + s.progress, 0) / shows.length)}%`} />
              </div>

              <div className="space-y-3">
                {genreDistribution.map((g) => (
                  <div key={g.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{g.name}</span>
                      <span className="font-medium">{g.value}%</span>
                    </div>
                    <Progress value={g.value * 2.5} />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <Card className="h-fit sticky top-24 space-y-5">
          <div className="text-sm font-semibold">Report configuration</div>

          <label className="block">
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Date range</div>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option>Last 30 days</option><option>Last 90 days</option><option>Year to date</option><option>All time</option>
            </select>
          </label>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Include sections</div>
            <div className="space-y-2">
              {["Executive summary", "Budget breakdown", "Stage timelines", "Evaluation scores", "Risk register"].map((s, i) => (
                <label key={s} className="flex items-center gap-2.5 text-sm">
                  <input type="checkbox" defaultChecked={i < 3} className="h-4 w-4 rounded accent-[var(--primary)]" />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Format</div>
            <div className="grid grid-cols-3 gap-2">
              {["PDF", "CSV", "XLSX"].map((f, i) => (
                <button key={f} className={cn("h-10 rounded-xl border text-xs font-medium transition", i === 0 ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent")}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={generating}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition shadow-[var(--shadow-glow)] disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {generating ? "Generating…" : ready ? "Download report" : "Generate report"}
          </button>
          {ready && (
            <p className="text-xs text-success text-center">Report generated for {range.toLowerCase()} — ready for download.</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

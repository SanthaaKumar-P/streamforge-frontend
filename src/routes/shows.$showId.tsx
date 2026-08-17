import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, Chip, Progress } from "@/components/ui-kit";
import { shows, formatCurrency, type ShowStatus } from "@/lib/mock-data";
import { ArrowLeft, CalendarDays, Clapperboard, Coins, Film, Users2, Gauge, CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/shows/$showId")({
  loader: ({ params }) => {
    const show = shows.find((s) => s.id === params.showId);
    if (!show) throw notFound();
    return { show };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Show not found — Netflix Show Manager" }, { name: "robots", content: "noindex" }] };
    }
    const { show } = loaderData;
    const title = `${show.title} — Netflix Show Manager`;
    const description = `${show.genre} original by ${show.creator}. ${show.episodes} episodes, ${formatCurrency(show.budget)} budget, currently ${show.stage}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: show.poster },
        { name: "twitter:image", content: show.poster },
      ],
    };
  },
  component: ShowDetail,
});

const statusVariant: Record<ShowStatus, "success" | "warning" | "danger" | "info" | "primary"> = {
  approved: "success", pending: "warning", rejected: "danger", review: "info", production: "primary",
};

const stageOrder = ["planning", "pre-production", "production", "post-production", "completed"] as const;

const scorecard = [
  { label: "Story originality", value: 88 },
  { label: "Market viability", value: 74 },
  { label: "Platform / brand fit", value: 92 },
  { label: "Production feasibility", value: 66 },
];

function ShowDetail() {
  const { show } = Route.useLoaderData();
  const stageIndex = stageOrder.indexOf(show.stage);
  const spent = Math.round(show.budget * (show.progress / 100));

  return (
    <DashboardLayout>
      <Link to="/shows" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to shows
      </Link>

      <Card className="!p-0 overflow-hidden mb-6">
        <div className="relative h-56 md:h-72">
          <img src={show.poster} alt={`${show.title} key art`} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 20%, oklch(0.14 0 0 / 0.96))" }} />
          <div className="absolute bottom-5 left-5 right-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Chip variant={statusVariant[show.status]}>{show.status}</Chip>
              <Chip>{show.genre}</Chip>
              <Chip variant="info">{show.language}</Chip>
              <Chip variant={show.priority === "critical" ? "danger" : "warning"}>{show.priority} priority</Chip>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{show.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {show.id} · created by {show.creator} · submitted {new Date(show.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold mb-2">Logline</h2>
            <p className="text-sm text-muted-foreground">{show.description}</p>
            <div className="grid sm:grid-cols-4 gap-4 mt-6">
              <Fact icon={<Film className="h-4 w-4" />} label="Episodes" value={String(show.episodes)} />
              <Fact icon={<Coins className="h-4 w-4" />} label="Budget" value={formatCurrency(show.budget)} />
              <Fact icon={<Users2 className="h-4 w-4" />} label="Crew" value={String(show.team)} />
              <Fact icon={<CalendarDays className="h-4 w-4" />} label="Deadline" value={new Date(show.deadline).toLocaleDateString()} />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-5">Production timeline</h2>
            <ol className="relative">
              {stageOrder.map((stage, i) => {
                const done = i < stageIndex;
                const active = i === stageIndex;
                return (
                  <li key={stage} className="flex gap-4 pb-6 last:pb-0 relative">
                    {i < stageOrder.length - 1 && (
                      <span className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
                    )}
                    <span className={`h-7 w-7 shrink-0 grid place-items-center rounded-full ${done ? "bg-success/20 text-success" : active ? "bg-primary text-primary-foreground animate-pulse-glow" : "bg-muted text-muted-foreground"}`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-sm font-medium capitalize ${active ? "" : "text-muted-foreground"}`}>{stage.replace("-", " ")}</div>
                      <div className="text-xs text-muted-foreground">
                        {done ? "Completed" : active ? `In progress — ${show.progress}%` : "Not started"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-5">Evaluation scorecard</h2>
            <div className="space-y-4">
              {scorecard.map((c) => (
                <div key={c.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="font-medium">{c.value}/100</span>
                  </div>
                  <Progress value={c.value} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold mb-4">
              <Gauge className="h-4 w-4 text-primary" /> Budget utilisation
            </div>
            <div className="text-3xl font-bold">{formatCurrency(spent)}</div>
            <div className="text-xs text-muted-foreground mb-4">of {formatCurrency(show.budget)} allocated</div>
            <Progress value={show.progress} />
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-border p-3">
                <div className="text-muted-foreground">Remaining</div>
                <div className="font-semibold mt-0.5">{formatCurrency(show.budget - spent)}</div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <div className="text-muted-foreground">Burn rate</div>
                <div className="font-semibold mt-0.5">{formatCurrency(Math.round(spent / 6))}/mo</div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold mb-4">
              <Clapperboard className="h-4 w-4 text-primary" /> Assigned team
            </div>
            <ul className="space-y-3">
              {[
                { name: show.creator, role: "Creator" },
                { name: "Marco Herrera", role: "Producer" },
                { name: "Elias Ward", role: "Director" },
                { name: "Ava Chen", role: "Content Manager" },
              ].map((p, i) => (
                <li key={p.role} className="flex items-center gap-3">
                  <img src={`https://i.pravatar.cc/64?img=${20 + i * 5}`} alt="" className="h-8 w-8 rounded-full object-cover" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.role}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="text-sm font-semibold mb-3">Workflow actions</div>
            <div className="space-y-2">
              <button className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">Advance stage</button>
              <button className="w-full h-10 rounded-xl border border-border text-sm hover:bg-accent transition">Request changes</button>
              <button className="w-full h-10 rounded-xl border border-border text-sm hover:bg-destructive/20 hover:text-destructive transition">Put on hold</button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-widest">{icon}{label}</div>
      <div className="mt-1.5 text-lg font-bold truncate">{value}</div>
    </div>
  );
}

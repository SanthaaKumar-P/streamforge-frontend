import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, StatCard, Chip, Progress } from "@/components/ui-kit";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Film, CheckCircle2, XCircle, Clock, Users, DollarSign,
  Bell, TrendingUp, ArrowRight, Activity, Calendar, ShieldCheck,
} from "lucide-react";
import { activities, genreDistribution, revenueSeries, shows, stats, submissionsTrend, formatCurrency } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Netflix Show Manager" },
      { name: "description", content: "Executive overview of Netflix originals, approvals, productions and analytics." },
    ],
  }),
  component: AdminDashboard,
});

const chartColors = ["#E50914", "#38bdf8", "#f59e0b", "#a78bfa", "#10b981", "#f472b6"];

function AdminDashboard() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Studio Overview"
        description="Welcome back, Ren. Here's what's moving across originals today."
        actions={
          <>
            <button className="hidden md:inline-flex h-10 px-4 items-center rounded-xl border border-border text-sm hover:bg-accent transition">Export</button>
            <Link to="/shows/new" className="inline-flex h-10 px-4 items-center rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition shadow-[var(--shadow-glow)]">
              New show
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Shows" value={String(stats.totalShows)} delta="+12%" icon={<Film className="h-4 w-4" />} accent="primary" />
        <StatCard label="Approved" value={String(stats.approved)} delta="+8%" icon={<CheckCircle2 className="h-4 w-4" />} accent="success" />
        <StatCard label="Under Review" value={String(stats.review)} delta="+3%" icon={<Clock className="h-4 w-4" />} accent="warning" />
        <StatCard label="In Production" value={String(stats.production)} delta="+5%" icon={<Activity className="h-4 w-4" />} accent="info" />
        <StatCard label="Rejected" value={String(stats.rejected)} icon={<XCircle className="h-4 w-4" />} accent="primary" />
        <StatCard label="Users" value={stats.users.toLocaleString()} delta="+142" icon={<Users className="h-4 w-4" />} accent="info" />
        <StatCard label="Revenue" value={formatCurrency(stats.revenue)} delta="+18%" icon={<DollarSign className="h-4 w-4" />} accent="success" />
        <StatCard label="Notifications" value={String(stats.notifications)} icon={<Bell className="h-4 w-4" />} accent="warning" />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Revenue vs Target</div>
              <div className="text-xs text-muted-foreground">Last 8 months</div>
            </div>
            <Chip variant="success"><TrendingUp className="h-3 w-3" /> +24.8%</Chip>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={revenueSeries} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E50914" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#E50914" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <Tooltip contentStyle={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="target" stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" fill="transparent" />
                <Area type="monotone" dataKey="revenue" stroke="#E50914" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Genre Distribution</div>
            <Chip variant="primary">Q3 2026</Chip>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={genreDistribution} innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                  {genreDistribution.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Submissions vs Approvals</div>
              <div className="text-xs text-muted-foreground">Weekly cadence</div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={submissionsTrend} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <Tooltip contentStyle={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Bar dataKey="submissions" fill="#E50914" radius={[6, 6, 0, 0]} />
                <Bar dataKey="approvals" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Pending Approvals</div>
            <Link to="/evaluation" className="text-xs text-primary hover:underline inline-flex items-center gap-1">Review all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <ul className="space-y-3">
            {shows.slice(0, 4).map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <img src={s.poster} alt="" className="h-11 w-11 rounded-lg object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{s.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.creator} · {s.genre}</div>
                </div>
                <Chip variant="warning">Review</Chip>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Recent Activity</div>
            <Chip>Live</Chip>
          </div>
          <ol className="relative border-l border-border pl-6 space-y-5">
            {activities.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
                <div className="text-sm">
                  <span className="font-medium">{a.user}</span>
                  <span className="text-muted-foreground"> ({a.role}) </span>
                  <span className="text-muted-foreground">{a.action}</span>{" "}
                  <span className="font-medium">{a.target}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.time}</div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/10 text-success grid place-items-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">System healthy</div>
                <div className="text-xs text-muted-foreground">All 42 services operational</div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { label: "API latency", value: 82, unit: "ms" },
                { label: "Storage", value: 61, unit: "%" },
                { label: "Queue", value: 24, unit: "%" },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-medium">{m.value}{m.unit}</span>
                  </div>
                  <Progress value={m.value} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Upcoming</div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <ul className="space-y-3">
              {shows.slice(0, 3).map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <div className="h-10 w-10 grid place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <span className="text-[10px] font-bold">
                      {new Date(s.deadline).toLocaleString("en", { month: "short" }).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{s.title}</div>
                    <div className="text-xs text-muted-foreground">Deadline · {new Date(s.deadline).toLocaleDateString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

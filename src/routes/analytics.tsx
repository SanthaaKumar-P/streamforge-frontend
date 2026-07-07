import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, Chip } from "@/components/ui-kit";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { genreDistribution, revenueSeries, submissionsTrend } from "@/lib/mock-data";
import { TrendingUp, Globe2, Users, DollarSign } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Netflix Show Manager" },
      { name: "description", content: "Executive analytics: revenue, approvals, genres and market performance." },
    ],
  }),
  component: Analytics,
});

const colors = ["#E50914", "#38bdf8", "#f59e0b", "#a78bfa", "#10b981", "#f472b6"];
const geo = [
  { region: "North America", value: 42 }, { region: "Europe", value: 28 },
  { region: "APAC", value: 18 }, { region: "LATAM", value: 8 }, { region: "MEA", value: 4 },
];
const topCreators = [
  { name: "A. Nakamura", shows: 14, score: 4.8 },
  { name: "L. Okonkwo", shows: 11, score: 4.7 },
  { name: "M. Herrera", shows: 9, score: 4.6 },
  { name: "S. Reyes", shows: 8, score: 4.5 },
  { name: "K. Bishnoi", shows: 7, score: 4.4 },
];
const rad = [
  { name: "Approval rate", value: 78, fill: "#E50914" },
  { name: "On-time delivery", value: 86, fill: "#38bdf8" },
  { name: "Budget adherence", value: 71, fill: "#f59e0b" },
];

function Analytics() {
  return (
    <DashboardLayout>
      <PageHeader title="Executive Analytics" description="Real-time performance across originals, creators and markets." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Revenue (YTD)", value: "$247M", delta: "+18%", icon: DollarSign },
          { label: "Approval rate", value: "78%", delta: "+4pt", icon: TrendingUp },
          { label: "Active markets", value: "42", delta: "+3", icon: Globe2 },
          { label: "Active creators", value: "312", delta: "+21", icon: Users },
        ].map((s) => (
          <Card key={s.label} className="card-hover">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
                <div className="mt-2 text-3xl font-bold">{s.value}</div>
                <div className="mt-1 text-xs text-success">{s.delta} vs last quarter</div>
              </div>
              <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Revenue trend</div>
              <div className="text-xs text-muted-foreground">Monthly, USD millions</div>
            </div>
            <Chip variant="success">On track</Chip>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={revenueSeries} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E50914" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#E50914" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <Tooltip contentStyle={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#E50914" strokeWidth={2} fill="url(#a1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold mb-4">Performance KPIs</div>
          <div className="h-72">
            <ResponsiveContainer>
              <RadialBarChart data={rad} innerRadius="30%" outerRadius="100%" startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="value" cornerRadius={8} />
                <Tooltip contentStyle={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-sm font-semibold mb-4">Genre analysis</div>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={genreDistribution} innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value">
                  {genreDistribution.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="text-sm font-semibold mb-4">Submission velocity</div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={submissionsTrend} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <Tooltip contentStyle={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="submissions" stroke="#E50914" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="approvals" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="text-sm font-semibold mb-4">Geographical performance</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={geo} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis type="category" dataKey="region" stroke="rgba(255,255,255,0.5)" fontSize={11} width={90} />
                <Tooltip contentStyle={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Bar dataKey="value" fill="#E50914" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Top creators</div>
            <Chip variant="primary">Q3</Chip>
          </div>
          <ul className="divide-y divide-border">
            {topCreators.map((c, i) => (
              <li key={c.name} className="py-3 flex items-center gap-3">
                <div className="h-9 w-9 grid place-items-center rounded-full bg-primary/10 text-primary text-sm font-bold">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.shows} shows produced</div>
                </div>
                <div className="text-sm font-semibold">{c.score.toFixed(1)}<span className="text-xs text-muted-foreground">/5</span></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}

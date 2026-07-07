import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, Chip } from "@/components/ui-kit";
import { Bell, Globe, Lock, Palette, ShieldCheck, User } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Netflix Show Manager" },
      { name: "description", content: "Manage your workspace, security, and appearance preferences." },
    ],
  }),
  component: SettingsPage,
});

const tabs = [
  { id: "general", label: "General", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "language", label: "Language & Region", icon: Globe },
];

function SettingsPage() {
  const [tab, setTab] = useState("general");
  return (
    <DashboardLayout>
      <PageHeader title="Settings" description="Configure your workspace." />

      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-6">
        <Card className="!p-2 h-fit">
          <ul className="space-y-0.5">
            {tabs.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${tab === t.id ? "bg-primary/10 text-foreground" : "hover:bg-accent text-muted-foreground"}`}
                >
                  <t.icon className={`h-4 w-4 ${tab === t.id ? "text-primary" : ""}`} /> {t.label}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          {tab === "general" && <General />}
          {tab === "notifications" && <Notifs />}
          {tab === "security" && <Security />}
          {tab === "appearance" && <Appearance />}
          {tab === "language" && <Language />}
        </div>
      </div>
    </DashboardLayout>
  );
}

const inputCls = "w-full h-11 px-3.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function General() {
  return (
    <Card>
      <div className="text-sm font-semibold mb-4">Account</div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Fld label="Full name"><input className={inputCls} defaultValue="Ren Ito" /></Fld>
        <Fld label="Display name"><input className={inputCls} defaultValue="ren.ito" /></Fld>
        <Fld label="Work email"><input className={inputCls} defaultValue="ren.ito@netflix.com" /></Fld>
        <Fld label="Phone"><input className={inputCls} defaultValue="+81 90 1234 5678" /></Fld>
        <Fld label="Role"><input className={inputCls} defaultValue="Administrator" /></Fld>
        <Fld label="Department"><input className={inputCls} defaultValue="Studios · APAC" /></Fld>
      </div>
      <div className="mt-6 flex justify-end">
        <button className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition shadow-[var(--shadow-glow)]">Save changes</button>
      </div>
    </Card>
  );
}

function Notifs() {
  const items = ["Show approvals", "Rejection notices", "Budget threshold alerts", "Deadline reminders", "Weekly executive digest", "System announcements"];
  return (
    <Card>
      <div className="text-sm font-semibold mb-4">Notification channels</div>
      <ul className="divide-y divide-border">
        {items.map((label, i) => (
          <li key={label} className="py-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-muted-foreground">Sent via email + in-app.</div>
            </div>
            <button className={`w-11 h-6 rounded-full relative transition ${i !== 5 ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${i !== 5 ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Security() {
  return (
    <>
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Two-factor authentication</div>
            <div className="text-xs text-muted-foreground mt-1">Add an extra layer of security using an authenticator app.</div>
          </div>
          <Chip variant="success">Enabled</Chip>
        </div>
        <div className="grid sm:grid-cols-3 gap-2">
          <button className="h-10 rounded-xl border border-border text-sm hover:bg-accent transition">Regenerate codes</button>
          <button className="h-10 rounded-xl border border-border text-sm hover:bg-accent transition">Change method</button>
          <button className="h-10 rounded-xl border border-border text-sm hover:bg-destructive/20 hover:text-destructive transition">Disable</button>
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold mb-4">Change password</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Fld label="Current password"><input type="password" className={inputCls} defaultValue="••••••••" /></Fld>
          <Fld label="New password"><input type="password" className={inputCls} defaultValue="••••••••" /></Fld>
        </div>
      </Card>
      <Card>
        <div className="text-sm font-semibold mb-4">Active sessions</div>
        <ul className="divide-y divide-border">
          {[
            ["MacBook Pro · Tokyo", "Chrome · Active now", true],
            ["iPhone 15 · Tokyo", "Safari · 2 hours ago", false],
            ["Meeting room 4F · Tokyo", "Firefox · Yesterday", false],
          ].map(([device, meta, current], i) => (
            <li key={i} className="py-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{device as string}</div>
                <div className="text-xs text-muted-foreground">{meta as string}</div>
              </div>
              {current ? <Chip variant="success">Current</Chip> : <button className="text-xs text-primary hover:underline">Sign out</button>}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function Appearance() {
  return (
    <Card>
      <div className="text-sm font-semibold mb-4">Theme</div>
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { name: "Netflix Dark", desc: "Default", active: true, bg: "linear-gradient(135deg, #141414, #1c1c1c)" },
          { name: "Midnight", desc: "Deep blue", active: false, bg: "linear-gradient(135deg, #0b1220, #1e293b)" },
          { name: "Light", desc: "Bright surface", active: false, bg: "linear-gradient(135deg, #f5f5f5, #ffffff)" },
        ].map((t) => (
          <button key={t.name} className={`rounded-2xl border p-4 text-left transition ${t.active ? "border-primary shadow-[var(--shadow-glow)]" : "border-border hover:border-primary/50"}`}>
            <div className="h-24 rounded-xl mb-3" style={{ background: t.bg }} />
            <div className="text-sm font-medium">{t.name}</div>
            <div className="text-xs text-muted-foreground">{t.desc}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function Language() {
  return (
    <Card>
      <div className="text-sm font-semibold mb-4">Language & Region</div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Fld label="Language"><select className={inputCls}><option>English (US)</option><option>日本語</option><option>Español</option></select></Fld>
        <Fld label="Timezone"><select className={inputCls}><option>Asia/Tokyo (GMT+9)</option><option>America/Los Angeles (GMT-7)</option></select></Fld>
        <Fld label="Date format"><select className={inputCls}><option>MMM DD, YYYY</option><option>DD/MM/YYYY</option></select></Fld>
        <Fld label="Currency"><select className={inputCls}><option>USD ($)</option><option>JPY (¥)</option><option>EUR (€)</option></select></Fld>
      </div>
    </Card>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

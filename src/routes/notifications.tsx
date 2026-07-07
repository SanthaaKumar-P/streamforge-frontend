import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, Chip } from "@/components/ui-kit";
import { notifications } from "@/lib/mock-data";
import { Bell, CheckCircle2, DollarSign, Clock, Server, XCircle, Check } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Netflix Show Manager" },
      { name: "description", content: "Approvals, budget alerts, deadlines and system announcements." },
    ],
  }),
  component: NotificationsPage,
});

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  approval: CheckCircle2, budget: DollarSign, deadline: Clock, system: Server,
};
const variantMap = {
  approval: "success", budget: "warning", deadline: "info", system: "default",
} as const;

function NotificationsPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Notifications"
        description="Everything that needs your attention, in one place."
        actions={
          <>
            <button className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition"><Check className="h-4 w-4" /> Mark all read</button>
          </>
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <Card className="!p-0">
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <div className="text-sm font-semibold">Inbox</div>
            <Chip variant="primary">{notifications.filter((n) => n.unread).length} new</Chip>
            <div className="ml-auto flex gap-1 text-xs">
              {["All", "Approvals", "Budget", "Deadlines", "System"].map((t, i) => (
                <button key={t} className={`h-8 px-3 rounded-lg ${i === 0 ? "bg-primary text-primary-foreground" : "hover:bg-accent"} transition`}>{t}</button>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const Icon = iconMap[n.type] ?? Bell;
              return (
                <li key={n.id} className={`p-4 flex items-start gap-4 hover:bg-accent/30 transition ${n.unread ? "bg-primary/[0.03]" : ""}`}>
                  <div className={`h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-primary/10 text-primary`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm">{n.title}</div>
                      <Chip variant={variantMap[n.type as keyof typeof variantMap]}>{n.type}</Chip>
                      {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">{n.body}</div>
                    <div className="text-xs text-muted-foreground mt-1">{n.time} ago</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="h-8 w-8 grid place-items-center rounded-lg hover:bg-success/20 hover:text-success transition"><CheckCircle2 className="h-4 w-4" /></button>
                    <button className="h-8 w-8 grid place-items-center rounded-lg hover:bg-destructive/20 hover:text-destructive transition"><XCircle className="h-4 w-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="text-sm font-semibold mb-3">Preferences</div>
            <ul className="space-y-3 text-sm">
              {["Approvals", "Budget alerts", "Deadlines", "System updates", "Weekly digest"].map((p, i) => (
                <li key={p} className="flex items-center justify-between">
                  <span>{p}</span>
                  <button className={`w-10 h-6 rounded-full relative transition ${i !== 3 ? "bg-primary" : "bg-muted"}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${i !== 3 ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="text-sm font-semibold mb-3">Quiet hours</div>
            <div className="text-xs text-muted-foreground mb-3">Silence non-critical alerts.</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-border p-3">
                <div className="text-[10px] uppercase text-muted-foreground">From</div>
                <div className="font-medium">10:00 PM</div>
              </div>
              <div className="rounded-xl border border-border p-3">
                <div className="text-[10px] uppercase text-muted-foreground">Until</div>
                <div className="font-medium">7:00 AM</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

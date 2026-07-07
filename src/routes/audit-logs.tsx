import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, Chip } from "@/components/ui-kit";
import { auditLogs } from "@/lib/mock-data";
import { Download, Filter, Search } from "lucide-react";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Logs — Netflix Show Manager" },
      { name: "description", content: "Immutable trail of every action across the platform." },
    ],
  }),
  component: AuditLogs,
});

const statusVariant = {
  success: "success", warning: "warning", failed: "danger",
} as const;

function AuditLogs() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Audit Logs"
        description="Immutable, exportable record of every action across the platform."
        actions={
          <button className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      <Card className="mb-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Search user, action, IP…" className="w-full h-10 pl-10 pr-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="h-10 px-3 rounded-xl bg-surface border border-border text-sm">
              <option>All roles</option><option>Administrator</option><option>Producer</option>
            </select>
            <select className="h-10 px-3 rounded-xl bg-surface border border-border text-sm">
              <option>All actions</option><option>Approvals</option><option>Budget updates</option>
            </select>
            <button className="h-10 px-3 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition"><Filter className="h-4 w-4" /> More</button>
          </div>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-surface-elevated/40">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Action</th>
                <th className="p-4">Status</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Log ID</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-t border-border hover:bg-accent/40 transition">
                  <td className="p-4 whitespace-nowrap text-muted-foreground">{new Date(log.date).toLocaleString()}</td>
                  <td className="p-4 font-medium">{log.user}</td>
                  <td className="p-4">{log.role}</td>
                  <td className="p-4">{log.action}</td>
                  <td className="p-4"><Chip variant={statusVariant[log.status]}>{log.status}</Chip></td>
                  <td className="p-4 font-mono text-xs">{log.ip}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{log.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div>Showing 14 of 4,281 events</div>
          <div className="flex gap-1">
            <button className="h-8 px-3 rounded-lg border border-border hover:bg-accent">Prev</button>
            <button className="h-8 px-3 rounded-lg bg-primary text-primary-foreground border border-transparent">1</button>
            <button className="h-8 px-3 rounded-lg border border-border hover:bg-accent">Next</button>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}

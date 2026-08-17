import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, Chip } from "@/components/ui-kit";
import { PERMISSION_MATRIX, ROLES, useRole, type Role } from "@/lib/roles";
import { Check, Minus, ShieldCheck, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/permissions")({
  head: () => ({
    meta: [
      { title: "Permission Matrix — Netflix Show Manager" },
      { name: "description", content: "Role-based access control matrix across guest, viewer, creator, director, producer, content manager and admin." },
      { property: "og:title", content: "Permission Matrix — Netflix Show Manager" },
      { property: "og:description", content: "Explore the RBAC permission matrix and simulate any studio role." },
    ],
  }),
  component: PermissionsPage,
});

function PermissionsPage() {
  const { role, setRole, profile } = useRole();
  const order = ROLES.map((r) => r.id);

  const allowedCount = (r: Role) =>
    PERMISSION_MATRIX.filter((row) => row.grants[r] !== false).length;

  return (
    <DashboardLayout>
      <PageHeader
        title="Permission Matrix"
        description="Live RBAC map. Click any role column to simulate that persona across the entire product."
        actions={<Chip variant="primary"><ShieldCheck className="h-3 w-3" /> Active: {profile.label}</Chip>}
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {ROLES.slice(3).map((r) => (
          <Card key={r.id} className={cn("card-hover", r.id === role && "ring-1 ring-primary")}>
            <div className="flex items-center gap-3">
              <img src={r.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{r.label}</div>
                <div className="text-xs text-muted-foreground truncate">{r.blurb}</div>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold">{allowedCount(r.id)}</span>
              <span className="text-xs text-muted-foreground">/ {PERMISSION_MATRIX.length} capabilities</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold">Appendix A · Role-Based Permission Matrix</div>
            <div className="text-xs text-muted-foreground">Enforced in the UI — locked items appear disabled in navigation.</div>
          </div>
          <Chip variant="info"><UserCheck className="h-3 w-3" /> Click a column header to switch role</Chip>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-surface-elevated/40">
              <tr>
                <th className="p-4 text-left sticky left-0 bg-surface-elevated/90 backdrop-blur">Functionality</th>
                {ROLES.map((r) => (
                  <th key={r.id} className="p-3 text-center">
                    <button
                      onClick={() => setRole(r.id)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg transition whitespace-nowrap",
                        r.id === role ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                      )}
                    >
                      {r.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.key} className="border-t border-border hover:bg-accent/40 transition">
                  <td className="p-4 sticky left-0 bg-background/80 backdrop-blur font-medium">{row.label}</td>
                  {order.map((r) => {
                    const g = row.grants[r];
                    return (
                      <td key={r} className={cn("p-3 text-center", r === role && "bg-primary/5")}>
                        {g === false ? (
                          <Minus className="h-4 w-4 mx-auto text-muted-foreground/40" />
                        ) : g === true ? (
                          <Check className="h-4 w-4 mx-auto text-success" />
                        ) : (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-warning">{g}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}

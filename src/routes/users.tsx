import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, Chip, StatCard } from "@/components/ui-kit";
import { directory, roleCounts, type DirectoryUser } from "@/lib/directory";
import { ROLES, useRole } from "@/lib/roles";
import { Search, UserPlus, Users, ShieldAlert, UserCheck, KeyRound, Ban, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "User Management — Netflix Show Manager" },
      { name: "description", content: "Administer studio accounts, roles, specialties and access status across the platform." },
      { property: "og:title", content: "User Management — Netflix Show Manager" },
      { property: "og:description", content: "Administer studio accounts, roles and access status." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { can, profile } = useRole();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [users, setUsers] = useState<DirectoryUser[]>(directory);

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          (roleFilter === "ALL" || u.role === roleFilter) &&
          `${u.username} ${u.email} ${u.specialty} ${u.netflixId}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [users, q, roleFilter],
  );

  if (!can("manage_users")) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <Card className="max-w-md text-center py-12">
            <div className="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-destructive/15 text-destructive mb-5">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold">Access restricted</h2>
            <p className="text-sm text-muted-foreground mt-2">
              User management requires the Administrator role. You are currently signed in as {profile.label}.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="User Management"
        description="Accounts, roles, specialties and session health across the studio."
        actions={
          <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition shadow-[var(--shadow-glow)]">
            <UserPlus className="h-4 w-4" /> Invite user
          </button>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total accounts" value={String(users.length)} icon={<Users className="h-5 w-5" />} accent="primary" />
        <StatCard label="Active" value={String(users.filter((u) => u.isActive).length)} icon={<UserCheck className="h-5 w-5" />} accent="success" />
        <StatCard label="Suspended" value={String(users.filter((u) => !u.isActive).length)} icon={<Ban className="h-5 w-5" />} accent="warning" />
        <StatCard label="Privileged roles" value={String((roleCounts.ADMIN ?? 0) + (roleCounts.CONTENT_MANAGER ?? 0))} icon={<ShieldAlert className="h-5 w-5" />} accent="info" />
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, Netflix ID or specialty…"
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["ALL", ...ROLES.slice(1).map((r) => r.id)].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  "h-9 px-3 rounded-lg text-xs font-medium transition border",
                  roleFilter === r ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:bg-accent",
                )}
              >
                {r === "ALL" ? "All roles" : ROLES.find((x) => x.id === r)!.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-surface-elevated/40">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Netflix ID</th>
                <th className="p-4">Role</th>
                <th className="p-4">Specialty</th>
                <th className="p-4">Last login</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-accent/40 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{u.username}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{u.netflixId}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: e.target.value as DirectoryUser["role"] } : x)))
                      }
                      className="h-9 px-2 rounded-lg bg-surface border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {ROLES.slice(1).map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-muted-foreground">{u.specialty}</td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {new Date(u.lastLogin).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-4">
                    <Chip variant={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Suspended"}</Chip>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <button title="Force password rotation" className="h-8 w-8 grid place-items-center rounded-lg border border-border hover:bg-accent transition">
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: !x.isActive } : x)))}
                        className={cn(
                          "h-8 px-3 rounded-lg border text-xs transition",
                          u.isActive ? "border-border hover:bg-destructive/20 hover:text-destructive" : "border-border hover:bg-success/20 hover:text-success",
                        )}
                      >
                        {u.isActive ? "Suspend" : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No users match your filters.</div>}
      </Card>
    </DashboardLayout>
  );
}

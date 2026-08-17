import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "GUEST" | "VIEWER" | "CREATOR" | "DIRECTOR" | "PRODUCER" | "CONTENT_MANAGER" | "ADMIN";

export const ROLES: { id: Role; label: string; blurb: string; person: string; avatar: string }[] = [
  { id: "GUEST", label: "Guest", blurb: "Public browsing only", person: "Unauthenticated", avatar: "https://i.pravatar.cc/64?img=68" },
  { id: "VIEWER", label: "Viewer", blurb: "Reads own content", person: "Mia Torres", avatar: "https://i.pravatar.cc/64?img=45" },
  { id: "CREATOR", label: "Creator", blurb: "Submits pitches", person: "Sana Kapoor", avatar: "https://i.pravatar.cc/64?img=32" },
  { id: "DIRECTOR", label: "Director", blurb: "Runs own productions", person: "Elias Ward", avatar: "https://i.pravatar.cc/64?img=12" },
  { id: "PRODUCER", label: "Producer", blurb: "Owns budgets & crews", person: "Marco Herrera", avatar: "https://i.pravatar.cc/64?img=15" },
  { id: "CONTENT_MANAGER", label: "Content Manager", blurb: "Evaluates & approves", person: "Ava Chen", avatar: "https://i.pravatar.cc/64?img=47" },
  { id: "ADMIN", label: "Administrator", blurb: "Full system control", person: "Ren Ito", avatar: "https://i.pravatar.cc/64?img=13" },
];

export type Permission =
  | "view_platform" | "submit_show" | "view_own_content" | "search_shows" | "view_production_status"
  | "update_personal_info" | "manage_productions" | "evaluate_content" | "approve_shows" | "manage_budgets"
  | "view_all_content" | "generate_reports" | "manage_users" | "system_config" | "audit_logs" | "analytics";

type Grant = true | false | "own" | "limited";

export const PERMISSION_MATRIX: { key: Permission; label: string; grants: Record<Role, Grant> }[] = [
  row("view_platform", "View Platform Info", [true, true, true, true, true, true, true]),
  row("submit_show", "Submit Show", [false, false, true, true, false, false, false]),
  row("view_own_content", "View Own Content", [false, true, true, true, false, false, false]),
  row("search_shows", "Search Shows", [true, true, true, true, true, true, true]),
  row("view_production_status", "View Production Status", [false, false, true, true, true, false, false]),
  row("update_personal_info", "Update Personal Info", [false, true, true, true, true, true, true]),
  row("manage_productions", "Manage Productions", [false, false, false, "own", true, false, false]),
  row("evaluate_content", "Evaluate Content", [false, false, false, false, false, true, true]),
  row("approve_shows", "Approve Shows", [false, false, false, false, false, true, true]),
  row("manage_budgets", "Manage Budgets", [false, false, false, false, true, true, true]),
  row("view_all_content", "View All Content", [false, false, false, false, true, true, true]),
  row("generate_reports", "Generate Reports", [false, false, false, "limited", true, true, true]),
  row("manage_users", "Manage Users", [false, false, false, false, false, false, true]),
  row("system_config", "System Configuration", [false, false, false, false, false, false, true]),
  row("audit_logs", "Audit Logs", [false, false, false, false, false, false, true]),
  row("analytics", "Analytics Dashboard", [false, false, "own", "own", true, true, true]),
];

function row(key: Permission, label: string, values: Grant[]) {
  const order: Role[] = ["GUEST", "VIEWER", "CREATOR", "DIRECTOR", "PRODUCER", "CONTENT_MANAGER", "ADMIN"];
  const grants = {} as Record<Role, Grant>;
  order.forEach((r, i) => (grants[r] = values[i]));
  return { key, label, grants };
}

export function grantFor(role: Role, permission: Permission): Grant {
  return PERMISSION_MATRIX.find((r) => r.key === permission)?.grants[role] ?? false;
}
export function can(role: Role, permission: Permission): boolean {
  return grantFor(role, permission) !== false;
}

const RoleCtx = createContext<{ role: Role; setRole: (r: Role) => void }>({ role: "ADMIN", setRole: () => {} });

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("ADMIN");

  useEffect(() => {
    const saved = window.localStorage.getItem("nsms.role") as Role | null;
    if (saved) setRole(saved);
  }, []);

  const value = useMemo(
    () => ({
      role,
      setRole: (r: Role) => {
        setRole(r);
        window.localStorage.setItem("nsms.role", r);
      },
    }),
    [role],
  );

  return <RoleCtx.Provider value={value}>{children}</RoleCtx.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleCtx);
  const profile = ROLES.find((r) => r.id === ctx.role)!;
  return { ...ctx, profile, can: (p: Permission) => can(ctx.role, p) };
}

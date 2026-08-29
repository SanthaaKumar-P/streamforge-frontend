import { createFileRoute } from "@tanstack/react-router";
import {
  DashboardLayout,
  PageHeader,
} from "@/components/layout/DashboardLayout";
import { Card, Chip } from "@/components/ui-kit";
import { apiRequest } from "@/lib/api";
import {
  Download,
  Filter,
  Search,
  RefreshCw,
  ShieldCheck,
  Clock3,
  Database,
  X,
  AlertCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({
    meta: [
      {
        title: "Audit Logs — Netflix Show Manager",
      },
      {
        name: "description",
        content:
          "Immutable, exportable record of every action across the platform.",
      },
    ],
  }),
  component: AuditLogs,
});

// ============================================================
// TYPES
// ============================================================

interface AuditLog {
  logId: number;
  action: string;
  entityName: string | null;
  entityId: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  actionTime: string | null;
}

interface StoredUser {
  userId?: number;
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  name?: string;
}

// ============================================================
// USER ID HELPER
// ============================================================

function getLoggedInUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem("streamforge_user");

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed as StoredUser;
  } catch {
    return null;
  }
}

function getUserId(user: StoredUser | null): number | null {
  if (!user) {
    return null;
  }

  const possibleId =
    user.userId ??
    user.id;

  if (
    possibleId === undefined ||
    possibleId === null
  ) {
    return null;
  }

  const numericId = Number(possibleId);

  return Number.isFinite(numericId)
    ? numericId
    : null;
}

// ============================================================
// FORMAT HELPERS
// ============================================================

function formatDate(
  value: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatAction(
  action: string
): string {
  if (!action) {
    return "Unknown";
  }

  return action
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(
      /\w\S*/g,
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    );
}

function formatEntity(
  entityName: string | null
): string {
  if (!entityName) {
    return "Unknown";
  }

  return entityName
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(
      /\w\S*/g,
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    );
}

function getActionVariant(
  action: string
): "success" | "warning" | "danger" | "info" {
  const value =
    action.toLowerCase();

  if (
    value.includes("delete") ||
    value.includes("remove") ||
    value.includes("reject") ||
    value.includes("fail")
  ) {
    return "danger";
  }

  if (
    value.includes("update") ||
    value.includes("edit") ||
    value.includes("change")
  ) {
    return "warning";
  }

  if (
    value.includes("create") ||
    value.includes("add") ||
    value.includes("approve") ||
    value.includes("success")
  ) {
    return "success";
  }

  return "info";
}

// ============================================================
// CSV EXPORT
// ============================================================

function escapeCsv(
  value: unknown
): string {
  const text =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

function exportCsv(
  logs: AuditLog[]
): void {
  if (logs.length === 0) {
    return;
  }

  const headers = [
    "Log ID",
    "Timestamp",
    "Action",
    "Entity",
    "Entity ID",
    "IP Address",
    "User Agent",
  ];

  const rows = logs.map((log) => [
    log.logId,
    log.action,
    log.entityName ?? "",
    log.entityId ?? "",
    log.ipAddress ?? "",
    log.userAgent ?? "",
    log.actionTime ?? "",
  ]);

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) =>
      row.map(escapeCsv).join(",")
    ),
  ].join("\n");

  const blob = new Blob(
    [csv],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url =
    window.URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `audit_logs_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);
}

// ============================================================
// MAIN COMPONENT
// ============================================================

function AuditLogs() {
  const [logs, setLogs] =
    useState<AuditLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [actionFilter, setActionFilter] =
    useState("ALL");

  const [entityFilter, setEntityFilter] =
    useState("ALL");

  const [showMoreFilters, setShowMoreFilters] =
    useState(false);

  const [user, setUser] =
    useState<StoredUser | null>(null);

  // ==========================================================
  // LOAD USER
  // ==========================================================

  useEffect(() => {
    const loggedUser =
      getLoggedInUser();

    setUser(loggedUser);
  }, []);

  // ==========================================================
  // LOAD AUDIT LOGS
  // ==========================================================

  const loadLogs = async (
    showRefresh = false
  ) => {
    const loggedUser =
      getLoggedInUser();

    setUser(loggedUser);

    const userId =
      getUserId(loggedUser);

    if (!userId) {
      setError(
        "Unable to determine the logged-in user's ID."
      );

      setLogs([]);
      setLoading(false);
      setRefreshing(false);

      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const data =
        await apiRequest<AuditLog[]>(
          `/api/audit-logs/user/${userId}`
        );

      setLogs(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load audit logs.";

      setError(message);
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // ==========================================================
  // FILTER OPTIONS
  // ==========================================================

  const actionOptions =
    useMemo(() => {
      const values = logs
        .map((log) => log.action)
        .filter(Boolean);

      return Array.from(
        new Set(values)
      ).sort();
    }, [logs]);

  const entityOptions =
    useMemo(() => {
      const values = logs
        .map((log) => log.entityName)
        .filter(
          (
            value
          ): value is string =>
            Boolean(value)
        );

      return Array.from(
        new Set(values)
      ).sort();
    }, [logs]);

  // ==========================================================
  // FILTER LOGS
  // ==========================================================

  const filteredLogs =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return logs.filter((log) => {
        const matchesSearch =
          !query ||
          String(log.logId)
            .toLowerCase()
            .includes(query) ||
          (log.action ?? "")
            .toLowerCase()
            .includes(query) ||
          (log.entityName ?? "")
            .toLowerCase()
            .includes(query) ||
          String(log.entityId ?? "")
            .toLowerCase()
            .includes(query) ||
          (log.ipAddress ?? "")
            .toLowerCase()
            .includes(query) ||
          (log.userAgent ?? "")
            .toLowerCase()
            .includes(query);

        const matchesAction =
          actionFilter === "ALL" ||
          log.action === actionFilter;

        const matchesEntity =
          entityFilter === "ALL" ||
          log.entityName === entityFilter;

        return (
          matchesSearch &&
          matchesAction &&
          matchesEntity
        );
      });
    }, [
      logs,
      search,
      actionFilter,
      entityFilter,
    ]);

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const totalLogs =
    logs.length;

  const uniqueEntities =
    new Set(
      logs
        .map(
          (log) => log.entityName
        )
        .filter(Boolean)
    ).size;

  const todayLogs =
    logs.filter((log) => {
      if (!log.actionTime) {
        return false;
      }

      const date =
        new Date(log.actionTime);

      const today =
        new Date();

      return (
        date.getFullYear() ===
          today.getFullYear() &&
        date.getMonth() ===
          today.getMonth() &&
        date.getDate() ===
          today.getDate()
      );
    }).length;

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const clearFilters = () => {
    setSearch("");
    setActionFilter("ALL");
    setEntityFilter("ALL");
  };

  const hasFilters =
    search.trim() !== "" ||
    actionFilter !== "ALL" ||
    entityFilter !== "ALL";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <DashboardLayout>
      <PageHeader
        title="Audit Logs"
        description="Immutable, exportable record of every action across the platform."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                loadLogs(true)
              }
              disabled={refreshing}
              className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition disabled:opacity-50"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  refreshing &&
                    "animate-spin"
                )}
              />
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              onClick={() =>
                exportCsv(
                  filteredLogs
                )
              }
              disabled={
                filteredLogs.length === 0
              }
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm inline-flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        }
      />

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 flex items-start gap-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />

          <div className="flex-1">
            {error}
          </div>

          <button
            onClick={() =>
              setError(null)
            }
            className="shrink-0 hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ======================================================
          LOGGED-IN USER
      ====================================================== */}

      <Card className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Logged-in user
              </div>

              <div className="mt-1 text-base font-semibold">
                {user?.name ||
                  user?.username ||
                  user?.email ||
                  "Administrator"}
              </div>

              <div className="text-xs text-muted-foreground mt-0.5">
                User ID:{" "}
                {getUserId(user) ??
                  "Not available"}
              </div>
            </div>
          </div>

          <Chip variant="info">
            ADMIN ONLY
          </Chip>
        </div>
      </Card>

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={
            <Database className="h-5 w-5" />
          }
          label="Total logs"
          value={String(totalLogs)}
        />

        <StatCard
          icon={
            <Clock3 className="h-5 w-5" />
          }
          label="Today's activity"
          value={String(todayLogs)}
        />

        <StatCard
          icon={
            <ShieldCheck className="h-5 w-5" />
          }
          label="Entity types"
          value={String(uniqueEntities)}
        />
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <Card className="mb-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          {/* SEARCH */}

          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search action, entity, IP, log ID..."
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* ACTION */}

          <select
            value={actionFilter}
            onChange={(e) =>
              setActionFilter(
                e.target.value
              )
            }
            className="h-10 px-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">
              All actions
            </option>

            {actionOptions.map(
              (action) => (
                <option
                  key={action}
                  value={action}
                >
                  {formatAction(action)}
                </option>
              )
            )}
          </select>

          {/* ENTITY */}

          <select
            value={entityFilter}
            onChange={(e) =>
              setEntityFilter(
                e.target.value
              )
            }
            className="h-10 px-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">
              All entities
            </option>

            {entityOptions.map(
              (entity) => (
                <option
                  key={entity}
                  value={entity}
                >
                  {formatEntity(entity)}
                </option>
              )
            )}
          </select>

          {/* MORE */}

          <button
            onClick={() =>
              setShowMoreFilters(
                (value) => !value
              )
            }
            className={cn(
              "h-10 px-3 rounded-xl border text-sm inline-flex items-center justify-center gap-2 transition",
              showMoreFilters
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:bg-accent"
            )}
          >
            <Filter className="h-4 w-4" />
            More
          </button>
        </div>

        {/* MORE FILTER AREA */}

        {showMoreFilters && (
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {filteredLogs.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {logs.length}
              </span>{" "}
              logs
            </div>

            {hasFilters && (
              <button
                onClick={
                  clearFilters
                }
                className="h-9 px-3 rounded-lg border border-border text-xs hover:bg-accent transition inline-flex items-center gap-2"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>
        )}
      </Card>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <Card className="!p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">
              Activity history
            </div>

            <div className="text-xs text-muted-foreground mt-1">
              Audit events associated with your account.
            </div>
          </div>

          <Chip variant="info">
            {filteredLogs.length}{" "}
            {filteredLogs.length === 1
              ? "log"
              : "logs"}
          </Chip>
        </div>

        {loading ? (
          <LoadingState />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            filtered={hasFilters}
            onClear={clearFilters}
          />
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-surface-elevated/40">
                  <tr>
                    <th className="p-4 whitespace-nowrap">
                      Timestamp
                    </th>

                    <th className="p-4">
                      Action
                    </th>

                    <th className="p-4">
                      Entity
                    </th>

                    <th className="p-4">
                      Entity ID
                    </th>

                    <th className="p-4">
                      IP Address
                    </th>

                    <th className="p-4">
                      User Agent
                    </th>

                    <th className="p-4">
                      Log ID
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map(
                    (log) => (
                      <tr
                        key={log.logId}
                        className="border-t border-border hover:bg-accent/40 transition"
                      >
                        {/* TIMESTAMP */}

                        <td className="p-4 whitespace-nowrap text-muted-foreground">
                          {formatDate(
                            log.actionTime
                          )}
                        </td>

                        {/* ACTION */}

                        <td className="p-4">
                          <Chip
                            variant={getActionVariant(
                              log.action
                            )}
                          >
                            {formatAction(
                              log.action
                            )}
                          </Chip>
                        </td>

                        {/* ENTITY */}

                        <td className="p-4 font-medium">
                          {formatEntity(
                            log.entityName
                          )}
                        </td>

                        {/* ENTITY ID */}

                        <td className="p-4 font-mono text-xs text-muted-foreground">
                          {log.entityId ??
                            "—"}
                        </td>

                        {/* IP */}

                        <td className="p-4 font-mono text-xs">
                          {log.ipAddress ||
                            "—"}
                        </td>

                        {/* USER AGENT */}

                        <td
                          className="p-4 max-w-[280px]"
                          title={
                            log.userAgent ??
                            ""
                          }
                        >
                          <div className="truncate text-xs text-muted-foreground">
                            {log.userAgent ||
                              "—"}
                          </div>
                        </td>

                        {/* LOG ID */}

                        <td className="p-4 font-mono text-xs text-muted-foreground">
                          #{log.logId}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <div>
                Showing{" "}
                <span className="font-medium text-foreground">
                  {filteredLogs.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {logs.length}
                </span>{" "}
                events
              </div>

              <button
                onClick={() =>
                  exportCsv(
                    filteredLogs
                  )
                }
                className="h-8 px-3 rounded-lg border border-border hover:bg-accent transition inline-flex items-center gap-2"
              >
                <Download className="h-3.5 w-3.5" />
                Export visible logs
              </button>
            </div>
          </>
        )}
      </Card>
    </DashboardLayout>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {label}
          </div>

          <div className="mt-2 text-2xl font-bold">
            {value}
          </div>
        </div>

        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
          {icon}
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// LOADING STATE
// ============================================================

function LoadingState() {
  return (
    <div className="min-h-[360px] grid place-items-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 rounded-full border-2 border-border border-t-primary animate-spin" />

        <p className="mt-4 text-sm font-medium">
          Loading audit logs...
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Fetching activity from the database.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <div className="min-h-[360px] grid place-items-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary grid place-items-center">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <h3 className="mt-5 text-base font-semibold">
          {filtered
            ? "No matching audit logs"
            : "No audit logs yet"}
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          {filtered
            ? "Try changing your search or filters."
            : "There are no audit events associated with this account yet."}
        </p>

        {filtered && (
          <button
            onClick={onClear}
            className="mt-5 h-9 px-4 rounded-lg border border-border text-sm hover:bg-accent transition"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
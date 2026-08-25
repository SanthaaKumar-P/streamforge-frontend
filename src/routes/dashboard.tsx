import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import {
  DashboardLayout,
  PageHeader,
} from "@/components/layout/DashboardLayout";

import {
  Card,
  StatCard,
  Chip,
} from "@/components/ui-kit";

import {
  Film,
  CheckCircle2,
  XCircle,
  Clock3,
  DollarSign,
  Activity,
  Users,
  RefreshCw,
  AlertCircle,
  Bell,
  BarChart3,
  TrendingUp,
  CalendarDays,
  UserRound,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clapperboard,
} from "lucide-react";

import { apiRequest } from "@/api/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      {
        title: "Dashboard — StreamForge Show Manager",
      },
      {
        name: "description",
        content:
          "Studio overview of shows, evaluations, productions and upcoming releases.",
      },
    ],
  }),

  component: AdminDashboard,
});

/* =========================================================
   TYPES
========================================================= */

type ShowStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "REVIEW"
  | "PRODUCTION"
  | string;

interface Creator {
  userId?: number;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;

  role?: {
    roleId?: number;
    roleName?: string;
    description?: string;
  };
}

interface Show {
  showId: number;
  title: string;
  description?: string;
  synopsis?: string;
  language?: string;
  targetAudience?: string;
  estimatedBudget?: number;
  expectedReleaseDate?: string;
  status?: ShowStatus;
  creator?: Creator;
}

interface Evaluation {
  evaluationId: number;
  originalityScore?: number;
  creativityScore?: number;
  marketPotentialScore?: number;
  feasibilityScore?: number;
  overallScore?: number;
  decision?: string;
  remarks?: string;
}

interface Production {
  productionId: number;
  productionStatus?: string;
  allocatedBudget?: number;
  actualBudget?: number;
  notes?: string;
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeStatus(status?: string) {
  return (status || "")
    .toUpperCase()
    .replace(/[-\s]/g, "_");
}

function formatCurrency(value?: number) {
  if (value === undefined || value === null) {
    return "$0";
  }

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }

  return `$${value.toLocaleString()}`;
}

function formatDate(date?: string) {
  if (!date) {
    return "Not scheduled";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not scheduled";
  }

  return parsed.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   DASHBOARD
========================================================= */

function AdminDashboard() {
  const [shows, setShows] = useState<Show[]>([]);

  const [evaluations, setEvaluations] = useState<
    Record<number, Evaluation[]>
  >({});

  const [productions, setProductions] = useState<
    Record<number, Production[]>
  >({});

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  async function loadDashboard() {
    try {
      setError("");

      const showResponse =
        await apiRequest<Show[]>("/api/shows");

      const loadedShows =
        showResponse || [];

      setShows(loadedShows);

      const evaluationResults =
        await Promise.allSettled(
          loadedShows.map(async (show) => {
            const data =
              await apiRequest<Evaluation[]>(
                `/api/evaluations/show/${show.showId}`
              );

            return {
              showId: show.showId,
              data: data || [],
            };
          })
        );

      const productionResults =
        await Promise.allSettled(
          loadedShows.map(async (show) => {
            const data =
              await apiRequest<Production[]>(
                `/api/productions/show/${show.showId}`
              );

            return {
              showId: show.showId,
              data: data || [],
            };
          })
        );

      const evaluationMap: Record<
        number,
        Evaluation[]
      > = {};

      evaluationResults.forEach((result) => {
        if (result.status === "fulfilled") {
          evaluationMap[
            result.value.showId
          ] = result.value.data;
        }
      });

      const productionMap: Record<
        number,
        Production[]
      > = {};

      productionResults.forEach((result) => {
        if (result.status === "fulfilled") {
          productionMap[
            result.value.showId
          ] = result.value.data;
        }
      });

      setEvaluations(evaluationMap);
      setProductions(productionMap);
    } catch (err) {
      console.error(
        "Dashboard loading failed:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadDashboard();
  }

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics = useMemo(() => {
    const approved = shows.filter(
      (show) =>
        normalizeStatus(show.status) ===
        "APPROVED"
    ).length;

    const rejected = shows.filter(
      (show) =>
        normalizeStatus(show.status) ===
        "REJECTED"
    ).length;

    const pending = shows.filter((show) => {
      const status = normalizeStatus(
        show.status
      );

      return (
        status === "PENDING" ||
        status === "REVIEW" ||
        status === "UNDER_REVIEW"
      );
    }).length;

    const production =
      shows.filter(
        (show) =>
          normalizeStatus(
            show.status
          ) === "PRODUCTION"
      ).length;

    const budget = shows.reduce(
      (sum, show) =>
        sum +
        Number(
          show.estimatedBudget || 0
        ),
      0
    );

    const creators = new Set(
      shows
        .map(
          (show) =>
            show.creator?.userId
        )
        .filter(Boolean)
    );

    const evaluationCount =
      Object.values(evaluations).reduce(
        (sum, list) =>
          sum + list.length,
        0
      );

    return {
      total: shows.length,
      approved,
      pending,
      rejected,
      production,
      budget,
      creators: creators.size,
      evaluations: evaluationCount,
    };
  }, [
    shows,
    evaluations,
  ]);

  /* =======================================================
     GENRE / LANGUAGE DISTRIBUTION
     
     Your current ShowResponse does not contain genre.
     Therefore we use language as the real available
     categorical distribution instead of inventing genre.
  ======================================================= */

  const distribution = useMemo(() => {
    const map: Record<
      string,
      number
    > = {};

    shows.forEach((show) => {
      const key =
        show.language ||
        "Other";

      map[key] =
        (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [shows]);

  /* =======================================================
     PENDING SHOWS
  ======================================================= */

  const pendingShows = useMemo(() => {
    return shows
      .filter((show) => {
        const status =
          normalizeStatus(
            show.status
          );

        return (
          status === "PENDING" ||
          status === "REVIEW" ||
          status === "UNDER_REVIEW"
        );
      })
      .slice(0, 5);
  }, [shows]);

  /* =======================================================
     RECENT ACTIVITY
     
     Since there is no activity endpoint shown yet,
     create activity from actual show records.
  ======================================================= */

  const recentActivity =
    useMemo(() => {
      return [...shows]
        .sort(
          (a, b) =>
            b.showId - a.showId
        )
        .slice(0, 6)
        .map((show) => ({
          id: show.showId,
          title: show.title,
          creator:
            show.creator?.fullName ||
            show.creator?.username ||
            "Unknown creator",
          status:
            normalizeStatus(
              show.status
            ),
        }));
    }, [shows]);

  /* =======================================================
     EVALUATION SCORE
  ======================================================= */

  const averageScore =
    useMemo(() => {
      const all =
        Object.values(
          evaluations
        ).flat();

      const scores = all
        .map((item) =>
          Number(
            item.overallScore
          )
        )
        .filter(
          (score) =>
            !Number.isNaN(score)
        );

      if (!scores.length) {
        return 0;
      }

      return (
        scores.reduce(
          (a, b) => a + b,
          0
        ) / scores.length
      );
    }, [evaluations]);

  /* =======================================================
     BUDGET GRAPH DATA
  ======================================================= */

  const budgetGraph =
    useMemo(() => {
      const sorted = [...shows]
        .sort(
          (a, b) =>
            a.showId - b.showId
        )
        .slice(-8);

      if (!sorted.length) {
        return [];
      }

      return sorted.map(
        (show, index) => ({
          label:
            `S${index + 1}`,
          value:
            Number(
              show.estimatedBudget ||
                0
            ) / 1_000_000,
        })
      );
    }, [shows]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Studio Overview"
          description="Loading live studio data..."
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({
            length: 8,
          }).map((_, i) => (
            <Card
              key={i}
              className="animate-pulse"
            >
              <div className="h-3 w-24 bg-muted rounded" />

              <div className="h-8 w-16 bg-muted rounded mt-5" />
            </Card>
          ))}
        </div>

        <div className="mt-6 grid lg:grid-cols-3 gap-4">
  <Card className="lg:col-span-2">
    <div className="h-72 animate-pulse rounded-xl bg-muted" />
  </Card>

  <Card>
    <div className="h-72 animate-pulse rounded-xl bg-muted" />
  </Card>
</div>
      </DashboardLayout>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Studio Overview"
          description="Unable to load studio data."
        />

        <Card className="border-red-500/30">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 grid place-items-center">
              <AlertCircle className="h-5 w-5" />
            </div>

            <div>
              <div className="font-semibold">
                Dashboard connection failed
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                {error}
              </p>

              <button
                onClick={
                  handleRefresh
                }
                className="mt-4 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <DashboardLayout>
      <PageHeader
        title="Studio Overview"
        description="Live overview of shows, evaluations, productions and upcoming releases."
        actions={
          <>
            <button
              onClick={
                handleRefresh
              }
              disabled={refreshing}
              className="
                hidden md:inline-flex
                h-10 px-4
                items-center gap-2
                rounded-xl
                border border-border
                text-sm
                hover:bg-accent
                transition
              "
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>

            <Link
              to="/shows/new"
              className="
                inline-flex
                h-10 px-5
                items-center
                rounded-xl
                bg-primary
                text-primary-foreground
                text-sm
                font-semibold
                shadow-[var(--shadow-glow)]
              "
            >
              +&nbsp; New Show
            </Link>
          </>
        }
      />

      {/* ===================================================
          8 KPI CARDS
      =================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashboardStat
          label="Total Shows"
          value={statistics.total}
          icon={
            <Film className="h-4 w-4" />
          }
          tone="red"
        />

        <DashboardStat
          label="Approved"
          value={statistics.approved}
          icon={
            <CheckCircle2 className="h-4 w-4" />
          }
          tone="green"
        />

        <DashboardStat
          label="Under Review"
          value={statistics.pending}
          icon={
            <Clock3 className="h-4 w-4" />
          }
          tone="yellow"
        />

        <DashboardStat
          label="In Production"
          value={
            statistics.production
          }
          icon={
            <Activity className="h-4 w-4" />
          }
          tone="blue"
        />

        <DashboardStat
          label="Rejected"
          value={statistics.rejected}
          icon={
            <XCircle className="h-4 w-4" />
          }
          tone="red"
        />

        <DashboardStat
          label="Creators"
          value={
            statistics.creators
          }
          icon={
            <Users className="h-4 w-4" />
          }
          tone="blue"
        />

        <DashboardStat
          label="Estimated Budget"
          value={formatCurrency(
            statistics.budget
          )}
          icon={
            <DollarSign className="h-4 w-4" />
          }
          tone="green"
        />

        <DashboardStat
          label="Evaluations"
          value={
            statistics.evaluations
          }
          icon={
            <SparklesIcon />
          }
          tone="yellow"
        />
      </div>

      {/* ===================================================
          ROW 1 — CHART + DISTRIBUTION
      =================================================== */}

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-4">
        {/* BUDGET TREND */}

        <Card className="min-h-[330px]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">
                Budget Trend
              </div>

              <div className="text-xs text-muted-foreground">
                Estimated budget across recent shows
              </div>
            </div>

            <Chip variant="primary">
              Live
            </Chip>
          </div>

          <div className="mt-6 h-[235px]">
            <BudgetChart
              data={budgetGraph}
            />
          </div>
        </Card>

        {/* DISTRIBUTION */}

        <Card className="min-h-[330px]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">
                Content Distribution
              </div>

              <div className="text-xs text-muted-foreground">
                Shows by language
              </div>
            </div>

            <span className="text-[10px] text-primary">
              LIVE
            </span>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <DonutChart
              data={distribution}
              total={
                statistics.total
              }
            />
          </div>
        </Card>
      </div>

      {/* ===================================================
          ROW 2 — BAR CHART + PENDING
      =================================================== */}

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-4">
        {/* SUBMISSIONS */}

        <Card className="min-h-[300px]">
          <div>
            <div className="text-sm font-semibold">
              Submissions vs Approvals
            </div>

            <div className="text-xs text-muted-foreground">
              Current show pipeline
            </div>
          </div>

          <div className="mt-5">
            <SubmissionChart
              total={statistics.total}
              approved={
                statistics.approved
              }
              pending={
                statistics.pending
              }
              rejected={
                statistics.rejected
              }
            />
          </div>
        </Card>

        {/* PENDING APPROVALS */}

        <Card className="min-h-[300px]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">
                Pending Approvals
              </div>

              <div className="text-xs text-muted-foreground">
                Shows requiring review
              </div>
            </div>

            <Link
              to="/evaluation"
              className="text-[10px] text-primary inline-flex items-center gap-1"
            >
              Review all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-1">
            {pendingShows.length ===
            0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No pending approvals
              </div>
            ) : (
              pendingShows.map(
                (show) => (
                  <div
                    key={
                      show.showId
                    }
                    className="
                      flex items-center
                      gap-3
                      px-2 py-3
                      rounded-xl
                      hover:bg-accent/40
                    "
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                      <Clapperboard className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">
                        {
                          show.title
                        }
                      </div>

                      <div className="text-[10px] text-muted-foreground truncate">
                        {show.creator
                          ?.fullName ||
                          show.creator
                            ?.username ||
                          "Unknown"}
                        {" · "}
                        {show.language ||
                          "Unknown"}
                      </div>
                    </div>

                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-semibold text-amber-500">
                      Review
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </Card>
      </div>

      {/* ===================================================
          ROW 3 — ACTIVITY + SYSTEM HEALTH
      =================================================== */}

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-4">
        {/* RECENT ACTIVITY */}

        <Card className="min-h-[300px]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                Recent Activity
              </div>

              <div className="text-xs text-muted-foreground">
                Latest activity from your show pipeline
              </div>
            </div>

            <span className="text-[10px] text-muted-foreground">
              Live
            </span>
          </div>

          <div className="mt-5">
            {recentActivity.length ===
            0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No recent activity
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                <div className="space-y-5">
                  {recentActivity.map(
                    (item) => (
                      <div
                        key={
                          item.id
                        }
                        className="relative flex gap-4"
                      >
                        <div className="relative z-10 mt-1 h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-primary/10 shrink-0" />

                        <div>
                          <div className="text-xs">
                            <span className="font-semibold">
                              {item.creator}
                            </span>

                            <span className="text-muted-foreground">
                              {" "}
                              submitted/updated{" "}
                            </span>

                            <span className="font-semibold">
                              {
                                item.title
                              }
                            </span>
                          </div>

                          <div className="text-[10px] text-muted-foreground mt-1">
                            Status:{" "}
                            {item.status ||
                              "Unknown"}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* SYSTEM HEALTH */}

        <Card className="min-h-[300px]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">
                  System healthy
                </div>

                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="text-xs text-muted-foreground">
                StreamForge services status
              </div>
            </div>

            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>

          <div className="mt-6 space-y-5">
            <HealthBar
              label="API latency"
              value="82ms"
              percentage={82}
            />

            <HealthBar
              label="Storage"
              value="61%"
              percentage={61}
            />

            <HealthBar
              label="Queue"
              value="24%"
              percentage={24}
            />
          </div>

          <div className="mt-6 rounded-xl border border-border bg-background/30 p-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />

              <div>
                <div className="text-xs font-semibold">
                  Backend connected
                </div>

                <div className="text-[10px] text-muted-foreground">
                  Live API data is available.
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function DashboardStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone:
    | "red"
    | "green"
    | "yellow"
    | "blue";
}) {
  const styles = {
    red: "bg-red-500/10 text-red-500",
    green:
      "bg-emerald-500/10 text-emerald-500",
    yellow:
      "bg-amber-500/10 text-amber-500",
    blue: "bg-sky-500/10 text-sky-500",
  };

  return (
    <Card className="!p-4 relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>

          <div className="text-2xl font-bold mt-2">
            {value}
          </div>
        </div>

        <div
          className={`h-9 w-9 rounded-full grid place-items-center ${styles[tone]}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

/* =========================================================
   BUDGET CHART
========================================================= */

function BudgetChart({
  data,
}: {
  data: {
    label: string;
    value: number;
  }[];
}) {
  if (!data.length) {
    return (
      <div className="h-full grid place-items-center text-sm text-muted-foreground">
        No budget data available
      </div>
    );
  }

  const width = 900;
  const height = 230;

  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const max =
    Math.max(
      ...data.map(
        (item) => item.value
      ),
      1
    );

  const points = data.map(
    (item, index) => {
      const x =
        paddingLeft +
        (index /
          Math.max(
            data.length - 1,
            1
          )) *
          chartWidth;

      const y =
        paddingTop +
        chartHeight -
        (item.value / max) *
          chartHeight;

      return {
        x,
        y,
        ...item,
      };
    }
  );

  const line = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  const area = `
    ${line}
    L ${points[points.length - 1].x}
      ${paddingTop + chartHeight}
    L ${points[0].x}
      ${paddingTop + chartHeight}
    Z
  `;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      {/* GRID */}

      {[0, 1, 2, 3].map(
        (row) => {
          const y =
            paddingTop +
            (chartHeight / 3) *
              row;

          return (
            <line
              key={row}
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-border"
              strokeOpacity="0.45"
              strokeDasharray="2 5"
            />
          );
        }
      )}

      {/* AREA */}

      <path
        d={area}
        fill="currentColor"
        className="text-primary"
        fillOpacity="0.12"
      />

      {/* LINE */}

      <path
        d={line}
        fill="none"
        stroke="currentColor"
        className="text-primary"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* POINTS */}

      {points.map(
        (point) => (
          <circle
            key={point.label}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="currentColor"
            className="text-primary"
          />
        )
      )}

      {/* LABELS */}

      {points.map(
        (point) => (
          <text
            key={`${point.label}-label`}
            x={point.x}
            y={
              height -
              8
            }
            textAnchor="middle"
            fontSize="10"
            fill="currentColor"
            className="text-muted-foreground"
          >
            {point.label}
          </text>
        )
      )}
    </svg>
  );
}

/* =========================================================
   DONUT
========================================================= */

function DonutChart({
  data,
  total,
}: {
  data: [string, number][];
  total: number;
}) {
  if (!data.length || !total) {
    return (
      <div className="h-48 grid place-items-center text-sm text-muted-foreground">
        No distribution data
      </div>
    );
  }

  const colors = [
    "#E50914",
    "#38BDF8",
    "#F59E0B",
    "#A78BFA",
    "#10B981",
    "#EC4899",
  ];

  let currentAngle = -90;

  const radius = 70;
  const circumference =
    2 * Math.PI * radius;

  return (
    <div className="w-full">
      <div className="relative mx-auto w-[190px] h-[190px]">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full -rotate-0"
        >
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-muted"
            strokeWidth="24"
          />

          {data.map(
            ([name, value], index) => {
              const percentage =
                value / total;

              const dash =
                circumference *
                percentage;

              const gap = 2;

              const offset =
                circumference *
                (currentAngle + 90) /
                360;

              currentAngle +=
                percentage * 360;

              return (
                <circle
                  key={name}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={
                    colors[
                      index %
                        colors.length
                    ]
                  }
                  strokeWidth="24"
                  strokeDasharray={`${Math.max(
                    dash - gap,
                    0
                  )} ${circumference}`}
                  strokeDashoffset={
                    -offset
                  }
                  strokeLinecap="butt"
                  transform="rotate(-90 100 100)"
                />
              );
            }
          )}
        </svg>

        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-3xl font-bold">
              {total}
            </div>

            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Shows
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {data.map(
          ([name, value], index) => (
            <div
              key={name}
              className="flex items-center gap-1.5 text-[10px]"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background:
                    colors[
                      index %
                        colors.length
                    ],
                }}
              />

              <span className="text-muted-foreground">
                {name}
              </span>

              <span className="font-medium">
                {value}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SUBMISSION CHART
========================================================= */

function SubmissionChart({
  total,
  approved,
  pending,
  rejected,
}: {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}) {
  const values = [
    total,
    approved,
    pending,
    rejected,
  ];

  const labels = [
    "Submitted",
    "Approved",
    "Review",
    "Rejected",
  ];

  const max = Math.max(
    ...values,
    1
  );

  return (
    <div>
      <div className="h-[205px] flex items-end gap-5 px-3">
        {values.map(
          (value, index) => {
            const height =
              Math.max(
                (value / max) *
                  100,
                value > 0
                  ? 5
                  : 0
              );

            return (
              <div
                key={
                  labels[index]
                }
                className="flex-1 h-full flex flex-col justify-end items-center"
              >
                <div className="text-[10px] text-muted-foreground mb-2">
                  {value}
                </div>

                <div
                  className={`
                    w-full max-w-[90px]
                    rounded-t-md
                    transition-all
                    ${
                      index === 0
                        ? "bg-primary"
                        : index === 1
                        ? "bg-sky-400"
                        : index === 2
                        ? "bg-amber-400"
                        : "bg-red-500/60"
                    }
                  `}
                  style={{
                    height: `${height}%`,
                  }}
                />
              </div>
            );
          }
        )}
      </div>

      <div className="grid grid-cols-4 gap-5 px-3 mt-2">
        {labels.map(
          (label) => (
            <div
              key={label}
              className="text-center text-[10px] text-muted-foreground"
            >
              {label}
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   HEALTH BAR
========================================================= */

function HealthBar({
  label,
  value,
  percentage,
}: {
  label: string;
  value: string;
  percentage: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-2">
        <span className="text-muted-foreground">
          {label}
        </span>

        <span className="font-semibold">
          {value}
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   SPARKLE ICON
========================================================= */

function SparklesIcon() {
  return (
    <div className="relative">
      <TrendingUp className="h-4 w-4" />
    </div>
  );
}
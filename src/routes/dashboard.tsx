import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  DashboardLayout,
  PageHeader,
} from "@/components/layout/DashboardLayout";

import {
  Card,
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
  ShieldCheck,
  Zap,
  ArrowRight,
  Clapperboard,
  TrendingUp,
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
  | "DRAFT"
  | "IN_PRODUCTION"
  | "APPROVED"
  | "COMPLETED"
  | "REJECTED"
  | "UNDER_REVIEW"
  | "SUBMITTED"
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
  showId?: number;
  producerId?: number;
  productionStatus?: string;
  allocatedBudget?: number;
  actualBudget?: number;
  startDate?: string;
  expectedEndDate?: string;
  completionDate?: string;
  notes?: string;
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeStatus(status?: string) {
  return (status || "")
    .trim()
    .toUpperCase()
    .replace(/[-\s]/g, "_");
}

function formatCurrency(value?: number) {
  const amount = Number(value || 0);

  if (!amount) {
    return "$0";
  }

  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }

  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }

  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }

  return `$${amount.toLocaleString()}`;
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

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  async function loadDashboard() {
    try {
      setError("");

      /*
       * -----------------------------------------------------
       * LOAD SHOWS
       * -----------------------------------------------------
       */

      const showResponse =
        await apiRequest<Show[]>("/api/shows");

      const loadedShows = Array.isArray(showResponse)
        ? showResponse
        : [];

      setShows(loadedShows);

      /*
       * -----------------------------------------------------
       * LOAD EVALUATIONS
       * -----------------------------------------------------
       */

      const evaluationResults =
        await Promise.allSettled(
          loadedShows.map(async (show) => {
            const data =
              await apiRequest<Evaluation[]>(
                `/api/evaluations/show/${show.showId}`
              );

            return {
              showId: show.showId,
              data: Array.isArray(data) ? data : [],
            };
          })
        );

      /*
       * -----------------------------------------------------
       * LOAD PRODUCTIONS
       * -----------------------------------------------------
       */

      const productionResults =
        await Promise.allSettled(
          loadedShows.map(async (show) => {
            const data =
              await apiRequest<Production[]>(
                `/api/productions/show/${show.showId}`
              );

            return {
              showId: show.showId,
              data: Array.isArray(data) ? data : [],
            };
          })
        );

      /*
       * -----------------------------------------------------
       * BUILD EVALUATION MAP
       * -----------------------------------------------------
       */

      const evaluationMap: Record<
        number,
        Evaluation[]
      > = {};

      evaluationResults.forEach((result) => {
        if (result.status === "fulfilled") {
          evaluationMap[result.value.showId] =
            result.value.data;
        }
      });

      /*
       * -----------------------------------------------------
       * BUILD PRODUCTION MAP
       * -----------------------------------------------------
       */

      const productionMap: Record<
        number,
        Production[]
      > = {};

      productionResults.forEach((result) => {
        if (result.status === "fulfilled") {
          productionMap[result.value.showId] =
            result.value.data;
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
    /*
     * Backend ShowStatus values confirmed:
     *
     * DRAFT
     * IN_PRODUCTION
     * APPROVED
     * COMPLETED
     * REJECTED
     * UNDER_REVIEW
     * SUBMITTED
     */

    const approved = shows.filter(
      (show) =>
        normalizeStatus(show.status) === "APPROVED"
    ).length;

    const rejected = shows.filter(
      (show) =>
        normalizeStatus(show.status) === "REJECTED"
    ).length;

    const pending = shows.filter((show) => {
      const status =
        normalizeStatus(show.status);

      return (
        status === "UNDER_REVIEW" ||
        status === "SUBMITTED"
      );
    }).length;

    const production = shows.filter(
      (show) =>
        normalizeStatus(show.status) ===
        "IN_PRODUCTION"
    ).length;

    const completed = shows.filter(
      (show) =>
        normalizeStatus(show.status) ===
        "COMPLETED"
    ).length;

    const budget = shows.reduce(
      (sum, show) =>
        sum +
        Number(show.estimatedBudget || 0),
      0
    );

    const creators = new Set(
      shows
        .map(
          (show) =>
            show.creator?.userId
        )
        .filter(
          (
            userId
          ): userId is number =>
            typeof userId === "number"
        )
    );

    const evaluationCount =
      Object.values(evaluations).reduce(
        (sum, list) =>
          sum + list.length,
        0
      );

    const productionCount =
      Object.values(productions).reduce(
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
      completed,
      budget,
      creators: creators.size,
      evaluations: evaluationCount,
      productionCount,
    };
  }, [
    shows,
    evaluations,
    productions,
  ]);

  /* =======================================================
     LANGUAGE DISTRIBUTION
  ======================================================= */

  const distribution = useMemo(() => {
    const map: Record<string, number> = {};

    shows.forEach((show) => {
      const language =
        show.language?.trim() || "Other";

      map[language] =
        (map[language] || 0) + 1;
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
          normalizeStatus(show.status);

        return (
          status === "UNDER_REVIEW" ||
          status === "SUBMITTED"
        );
      })
      .slice(0, 5);
  }, [shows]);

  /* =======================================================
     RECENT ACTIVITY
  ======================================================= */

  const recentActivity = useMemo(() => {
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
          normalizeStatus(show.status),
        releaseDate:
          show.expectedReleaseDate,
      }));
  }, [shows]);

  /* =======================================================
     AVERAGE EVALUATION SCORE
  ======================================================= */

  const averageScore = useMemo(() => {
    const all =
      Object.values(evaluations).flat();

    const scores = all
      .map((item) =>
        Number(item.overallScore)
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
     PRODUCTION BUDGET
  ======================================================= */

  const productionBudget = useMemo(() => {
    return Object.values(productions)
      .flat()
      .reduce(
        (sum, production) =>
          sum +
          Number(
            production.allocatedBudget || 0
          ),
        0
      );
  }, [productions]);

  /* =======================================================
     BUDGET GRAPH
  ======================================================= */

  const budgetGraph = useMemo(() => {
    const sorted = [...shows]
      .sort(
        (a, b) =>
          a.showId - b.showId
      )
      .slice(-8);

    return sorted.map((show) => ({
      label: `#${show.showId}`,
      value:
        Number(
          show.estimatedBudget || 0
        ) / 1_000_000,
    }));
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
          }).map((_, index) => (
            <Card
              key={index}
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
            <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 grid place-items-center shrink-0">
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
                onClick={handleRefresh}
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
     MAIN DASHBOARD
  ======================================================= */

  return (
    <DashboardLayout>
      <PageHeader
        title="Studio Overview"
        description="Live overview of shows, evaluations, productions and upcoming releases."
        actions={
          <>
            <button
              onClick={handleRefresh}
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
                disabled:opacity-50
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
          KPI CARDS
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
          value={statistics.production}
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
          value={statistics.creators}
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
          value={statistics.evaluations}
          icon={
            <TrendingUp className="h-4 w-4" />
          }
          tone="yellow"
        />
      </div>

      {/* ===================================================
          SECONDARY LIVE SUMMARY
      =================================================== */}

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniSummary
          label="Completed Shows"
          value={statistics.completed}
        />

        <MiniSummary
          label="Production Records"
          value={statistics.productionCount}
        />

        <MiniSummary
          label="Production Budget"
          value={formatCurrency(
            productionBudget
          )}
        />

        <MiniSummary
          label="Average Evaluation"
          value={
            averageScore
              ? `${averageScore.toFixed(2)}/10`
              : "—"
          }
        />
      </div>

      {/* ===================================================
          ROW 1 — BUDGET + DISTRIBUTION
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

        {/* CONTENT DISTRIBUTION */}

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

          <div className="mt-4">
            <DonutChart
              data={distribution}
              total={statistics.total}
            />
          </div>
        </Card>
      </div>

      {/* ===================================================
          ROW 2 — PIPELINE + PENDING
      =================================================== */}

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-4">
        {/* SUBMISSIONS */}

        <Card className="min-h-[300px]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">
                Show Pipeline
              </div>

              <div className="text-xs text-muted-foreground">
                Current status distribution
              </div>
            </div>

            <Chip variant="info">
              {statistics.total} shows
            </Chip>
          </div>

          <div className="mt-5">
            <SubmissionChart
              draft={
                shows.filter(
                  (show) =>
                    normalizeStatus(
                      show.status
                    ) === "DRAFT"
                ).length
              }
              submitted={
                shows.filter(
                  (show) =>
                    normalizeStatus(
                      show.status
                    ) === "SUBMITTED"
                ).length
              }
              review={
                shows.filter(
                  (show) =>
                    normalizeStatus(
                      show.status
                    ) === "UNDER_REVIEW"
                ).length
              }
              approved={
                statistics.approved
              }
              production={
                statistics.production
              }
              completed={
                statistics.completed
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
            {pendingShows.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-3" />

                <div className="text-sm font-medium">
                  No pending approvals
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                  Everything is up to date.
                </div>
              </div>
            ) : (
              pendingShows.map((show) => (
                <div
                  key={show.showId}
                  className="
                    flex items-center
                    gap-3
                    px-2 py-3
                    rounded-xl
                    hover:bg-accent/40
                    transition
                  "
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Clapperboard className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">
                      {show.title}
                    </div>

                    <div className="text-[10px] text-muted-foreground truncate">
                      {show.creator?.fullName ||
                        show.creator?.username ||
                        "Unknown creator"}

                      {" · "}

                      {show.language ||
                        "Unknown"}
                    </div>
                  </div>

                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-semibold text-amber-500 whitespace-nowrap">
                    {normalizeStatus(
                      show.status
                    ) === "SUBMITTED"
                      ? "Submitted"
                      : "Review"}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ===================================================
          ROW 3 — RECENT ACTIVITY + RELEASES
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
                Latest shows from your pipeline
              </div>
            </div>

            <span className="text-[10px] text-muted-foreground">
              Live
            </span>
          </div>

          <div className="mt-5">
            {recentActivity.length === 0 ? (
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
                        key={item.id}
                        className="relative flex gap-4"
                      >
                        <div className="relative z-10 mt-1 h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-primary/10 shrink-0" />

                        <div className="min-w-0">
                          <div className="text-xs">
                            <span className="font-semibold">
                              {item.creator}
                            </span>

                            <span className="text-muted-foreground">
                              {" "}
                              submitted/updated{" "}
                            </span>

                            <span className="font-semibold">
                              {item.title}
                            </span>
                          </div>

                          <div className="text-[10px] text-muted-foreground mt-1">
                            Status:{" "}
                            <span className="text-foreground/80">
                              {item.status ||
                                "Unknown"}
                            </span>

                            {item.releaseDate && (
                              <>
                                {" · Release: "}
                                {formatDate(
                                  item.releaseDate
                                )}
                              </>
                            )}
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

        {/* UPCOMING RELEASES */}

        <Card className="min-h-[300px]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">
                Upcoming Releases
              </div>

              <div className="text-xs text-muted-foreground">
                Scheduled release dates
              </div>
            </div>

            <span className="text-[10px] text-primary">
              LIVE
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {shows
              .filter(
                (show) =>
                  Boolean(
                    show.expectedReleaseDate
                  )
              )
              .sort(
                (a, b) =>
                  new Date(
                    a.expectedReleaseDate || ""
                  ).getTime() -
                  new Date(
                    b.expectedReleaseDate || ""
                  ).getTime()
              )
              .slice(0, 5)
              .map((show) => (
                <div
                  key={show.showId}
                  className="
                    flex items-center
                    gap-3
                    rounded-xl
                    border border-border
                    p-3
                  "
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                    <CalendarIcon />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">
                      {show.title}
                    </div>

                    <div className="text-[10px] text-muted-foreground">
                      {formatDate(
                        show.expectedReleaseDate
                      )}
                    </div>
                  </div>

                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                    #{show.showId}
                  </span>
                </div>
              ))}

            {!shows.some(
              (show) =>
                Boolean(
                  show.expectedReleaseDate
                )
            ) && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No upcoming releases
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ===================================================
          ROW 4 — SYSTEM HEALTH
      =================================================== */}

      <div className="mt-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">
                  System connected
                </div>

                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="text-xs text-muted-foreground">
                StreamForge backend data is available.
              </div>
            </div>

            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SystemStatus
              label="Shows API"
              value={`${statistics.total} records`}
            />

            <SystemStatus
              label="Evaluations API"
              value={`${statistics.evaluations} records`}
            />

            <SystemStatus
              label="Productions API"
              value={`${statistics.productionCount} records`}
            />
          </div>

          <div className="mt-4 rounded-xl border border-border bg-background/30 p-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />

              <div>
                <div className="text-xs font-semibold">
                  Live backend connection
                </div>

                <div className="text-[10px] text-muted-foreground">
                  Dashboard values are loaded from StreamForge APIs.
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
   DASHBOARD STAT
========================================================= */

function DashboardStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
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
    blue:
      "bg-sky-500/10 text-sky-500",
  };

  return (
    <Card className="!p-4 relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground truncate">
            {label}
          </div>

          <div className="text-2xl font-bold mt-2 truncate">
            {value}
          </div>
        </div>

        <div
          className={`h-9 w-9 rounded-full grid place-items-center shrink-0 ${styles[tone]}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

/* =========================================================
   MINI SUMMARY
========================================================= */

function MiniSummary({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card className="!p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>

      <div className="mt-2 text-lg font-semibold">
        {value}
      </div>
    </Card>
  );
}

/* =========================================================
   SYSTEM STATUS
========================================================= */

function SystemStatus({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {label}
        </span>

        <span className="h-2 w-2 rounded-full bg-emerald-500" />
      </div>

      <div className="text-xs font-semibold mt-2">
        Connected
      </div>

      <div className="text-[10px] text-muted-foreground mt-1">
        {value}
      </div>
    </div>
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

  const max = Math.max(
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

  const lastPoint =
    points[points.length - 1];

  const firstPoint =
    points[0];

  const area = `
    ${line}
    L ${lastPoint.x} ${paddingTop + chartHeight}
    L ${firstPoint.x} ${paddingTop + chartHeight}
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
              x2={
                width -
                paddingRight
              }
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
   DONUT CHART
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

  const radius = 70;

  const circumference =
    2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <div className="w-full">
      <div className="relative mx-auto w-[190px] h-[190px]">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
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
                -circumference *
                accumulated;

              accumulated +=
                percentage;

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
                    offset
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
   SUBMISSION / PIPELINE CHART
========================================================= */

function SubmissionChart({
  draft,
  submitted,
  review,
  approved,
  production,
  completed,
  rejected,
}: {
  draft: number;
  submitted: number;
  review: number;
  approved: number;
  production: number;
  completed: number;
  rejected: number;
}) {
  const values = [
    draft,
    submitted,
    review,
    approved,
    production,
    completed,
    rejected,
  ];

  const labels = [
    "Draft",
    "Submitted",
    "Review",
    "Approved",
    "Production",
    "Completed",
    "Rejected",
  ];

  const max = Math.max(
    ...values,
    1
  );

  return (
    <div>
      <div className="h-[205px] flex items-end gap-2 sm:gap-4 px-2 overflow-x-auto">
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
                className="flex-1 min-w-[55px] h-full flex flex-col justify-end items-center"
              >
                <div className="text-[10px] text-muted-foreground mb-2">
                  {value}
                </div>

                <div
                  className={`
                    w-full max-w-[70px]
                    rounded-t-md
                    transition-all
                    ${
                      index === 0
                        ? "bg-slate-500"
                        : index === 1
                        ? "bg-sky-400"
                        : index === 2
                        ? "bg-amber-400"
                        : index === 3
                        ? "bg-emerald-400"
                        : index === 4
                        ? "bg-violet-400"
                        : index === 5
                        ? "bg-cyan-400"
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

      <div className="grid grid-cols-7 gap-2 sm:gap-4 px-2 mt-2">
        {labels.map(
          (label) => (
            <div
              key={label}
              className="text-center text-[9px] text-muted-foreground"
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
   CALENDAR ICON
========================================================= */

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
      />

      <line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
      />

      <line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
      />

      <line
        x1="3"
        y1="10"
        x2="21"
        y2="10"
      />
    </svg>
  );
}
import {
  createFileRoute,
  Link,
  notFound,
} from "@tanstack/react-router";

import {
  useState,
  type ReactNode,
} from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

import {
  Card,
  Chip,
  Progress,
} from "@/components/ui-kit";

import {
  getShowById,
  type ShowResponse,
} from "@/api/shows";

import {
  generateAIPrediction,
  type AIAnalysisResponse,
} from "@/api/ai-analysis";

import {
  getAIFutureForecast,
  type AIFuturePlannerResponse,
} from "@/api/ai-future-planner";

import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  Clapperboard,
  Coins,
  Film,
  Gauge,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users2,
} from "lucide-react";

/* =========================================================
   ROUTE
========================================================= */

export const Route = createFileRoute(
  "/shows/$showId",
)({
  loader: async ({ params }) => {
    const showId = Number(
      params.showId,
    );

    if (
      !Number.isInteger(showId) ||
      showId <= 0
    ) {
      throw notFound();
    }

    try {
      const show =
        await getShowById(showId);

      return {
        show,
      };
    } catch (error) {
      console.error(
        "Failed to load show:",
        error,
      );

      throw notFound();
    }
  },

  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          {
            title:
              "Show not found — Netflix Show Manager",
          },
          {
            name: "robots",
            content: "noindex",
          },
        ],
      };
    }

    const { show } =
      loaderData;

    return {
      meta: [
        {
          title:
            `${show.title} — Netflix Show Manager`,
        },
        {
          name: "description",
          content:
            show.description ||
            "Netflix Show Manager show details.",
        },
      ],
    };
  },

  component: ShowDetail,
});

/* =========================================================
   STATUS HELPERS
========================================================= */

function normalizeStatus(
  status?: string | null,
): string {
  if (!status) {
    return "PENDING";
  }

  return status
    .toUpperCase()
    .replace(/[-\s]/g, "_");
}

function statusLabel(
  status?: string | null,
): string {
  switch (
    normalizeStatus(status)
  ) {
    case "APPROVED":
      return "Approved";

    case "REJECTED":
      return "Rejected";

    case "UNDER_REVIEW":
      return "Under Review";

    case "IN_PRODUCTION":
    case "PRODUCTION":
      return "In Production";

    case "SUBMITTED":
      return "Submitted";

    case "PENDING":
      return "Pending";

    default:
      return (
        status ||
        "Pending"
      );
  }
}

function statusVariant(
  status?: string | null,
):
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "primary" {
  switch (
    normalizeStatus(status)
  ) {
    case "APPROVED":
      return "success";

    case "REJECTED":
      return "danger";

    case "UNDER_REVIEW":
      return "warning";

    case "IN_PRODUCTION":
    case "PRODUCTION":
      return "primary";

    default:
      return "info";
  }
}

/* =========================================================
   FORMATTERS
========================================================= */

function formatCurrency(
  value?: number | string | null,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
  ) {
    return "—";
  }

  if (
    amount >= 1_000_000
  ) {
    return `$${(
      amount / 1_000_000
    ).toFixed(1)}M`;
  }

  if (
    amount >= 1_000
  ) {
    return `$${(
      amount / 1_000
    ).toFixed(0)}K`;
  }

  return `$${amount.toLocaleString(
    "en-US",
  )}`;
}

function formatDate(
  value?: string | null,
): string {
  if (!value) {
    return "Not scheduled";
  }

  const date =
    new Date(
      `${value}T00:00:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

/* =========================================================
   WORKFLOW PROGRESS
========================================================= */

function getStatusProgress(
  status?: string | null,
): number {
  switch (
    normalizeStatus(status)
  ) {
    case "APPROVED":
      return 100;

    case "IN_PRODUCTION":
    case "PRODUCTION":
      return 75;

    case "UNDER_REVIEW":
      return 50;

    case "SUBMITTED":
      return 30;

    case "REJECTED":
      return 100;

    case "PENDING":
    default:
      return 20;
  }
}

/* =========================================================
   CREATOR HELPERS
========================================================= */

function getCreatorObject(
  show: ShowResponse,
): Record<string, unknown> | null {
  const creator =
    show.creator;

  if (
    !creator ||
    typeof creator !== "object"
  ) {
    return null;
  }

  return creator as unknown as Record<
    string,
    unknown
  >;
}

function getCreatorName(
  show: ShowResponse,
): string {
  const creator =
    getCreatorObject(show);

  if (!creator) {
    return "Unknown creator";
  }

  const fullName =
    typeof creator.fullName ===
    "string"
      ? creator.fullName.trim()
      : "";

  const username =
    typeof creator.username ===
    "string"
      ? creator.username.trim()
      : "";

  const name =
    typeof creator.name ===
    "string"
      ? creator.name.trim()
      : "";

  return (
    fullName ||
    username ||
    name ||
    "Unknown creator"
  );
}

function getCreatorEmail(
  show: ShowResponse,
): string {
  const creator =
    getCreatorObject(show);

  if (!creator) {
    return "No email available";
  }

  const email =
    typeof creator.email ===
    "string"
      ? creator.email.trim()
      : "";

  return (
    email ||
    "No email available"
  );
}

/* =========================================================
   GENRE HELPERS
========================================================= */

function getGenreNames(
  show: ShowResponse,
): string {
  if (
    !show.genres ||
    show.genres.length === 0
  ) {
    return "Not specified";
  }

  const names =
    show.genres
      .map((genre) => {
        const item =
          genre as unknown as Record<
            string,
            unknown
          >;

        if (
          typeof item.name ===
          "string"
        ) {
          return item.name;
        }

        if (
          typeof item.genreName ===
          "string"
        ) {
          return item.genreName;
        }

        if (
          typeof item.title ===
          "string"
        ) {
          return item.title;
        }

        return "";
      })
      .filter(Boolean);

  return names.length > 0
    ? names.join(", ")
    : "Not specified";
}

/* =========================================================
   MAIN PAGE
========================================================= */

function ShowDetail() {
  const {
    show,
  } = Route.useLoaderData();

  /* =======================================================
     AI PREDICTION STATE
  ======================================================= */

  const [
    aiAnalysis,
    setAIAnalysis,
  ] = useState<AIAnalysisResponse | null>(
    null,
  );

  const [
    aiLoading,
    setAILoading,
  ] = useState(false);

  const [
    aiError,
    setAIError,
  ] = useState("");

  /* =======================================================
     FUTURE PLANNER STATE
  ======================================================= */

  const [
    futureForecast,
    setFutureForecast,
  ] =
    useState<AIFuturePlannerResponse | null>(
      null,
    );

  const [
    futureLoading,
    setFutureLoading,
  ] = useState(false);

  const [
    futureError,
    setFutureError,
  ] = useState("");

  /* =======================================================
     COMMON VALUES
  ======================================================= */

  const creatorName =
    getCreatorName(show);

  const creatorEmail =
    getCreatorEmail(show);

  const genreNames =
    getGenreNames(show);

  const progress =
    getStatusProgress(
      show.status,
    );

  /*
   * Backend controls actual authorization.
   * The endpoint itself is protected by Spring Security.
   */
  const canGenerateAI =
    true;

  /* =======================================================
     GENERATE AI PREDICTION
  ======================================================= */

  const handleGeneratePrediction =
    async () => {
      try {
        setAILoading(true);
        setAIError("");

        const result =
          await generateAIPrediction(
            show.showId,
          );

        setAIAnalysis(
          result,
        );
      } catch (error) {
        console.error(
          "AI prediction failed:",
          error,
        );

        setAIError(
          error instanceof Error
            ? error.message
            : "Unable to generate AI prediction.",
        );
      } finally {
        setAILoading(false);
      }
    };

  /* =======================================================
     GENERATE FUTURE FORECAST
  ======================================================= */

  const handleGenerateFutureForecast =
    async () => {
      try {
        setFutureLoading(true);
        setFutureError("");

        const result =
          await getAIFutureForecast(
            show.showId,
          );

        setFutureForecast(
          result,
        );
      } catch (error) {
        console.error(
          "Future forecast failed:",
          error,
        );

        setFutureError(
          error instanceof Error
            ? error.message
            : "Unable to generate future forecast.",
        );
      } finally {
        setFutureLoading(false);
      }
    };

  return (
    <DashboardLayout>

      {/* ===================================================
          BACK
      =================================================== */}

      <Link
        to="/shows"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shows
      </Link>

      {/* ===================================================
          HERO
      =================================================== */}

      <Card className="!p-0 overflow-hidden mb-6">

        <div className="relative h-64 md:h-80">

          <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-background to-background" />

          <div className="absolute inset-0 flex items-center justify-center">

            <Film className="h-24 w-24 text-primary/20" />

          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

          <div className="absolute bottom-5 left-5 right-5">

            <div className="flex flex-wrap items-center gap-2 mb-3">

              <Chip
                variant={statusVariant(
                  show.status,
                )}
              >
                {statusLabel(
                  show.status,
                )}
              </Chip>

              {show.language && (
                <Chip variant="info">
                  {show.language}
                </Chip>
              )}

              {show.targetAudience && (
                <Chip>
                  {show.targetAudience}
                </Chip>
              )}

              {show.episodeCount !==
                null &&
                show.episodeCount !==
                  undefined && (
                  <Chip variant="primary">
                    {show.episodeCount}{" "}
                    {show.episodeCount ===
                    1
                      ? "Episode"
                      : "Episodes"}
                  </Chip>
                )}

            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {show.title}
            </h1>

            <p className="text-sm text-muted-foreground mt-2">
              SH-{show.showId}
              {" · "}
              created by{" "}
              {creatorName}
            </p>

          </div>
        </div>

      </Card>

      {/* ===================================================
          QUICK FACTS
      =================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        <Fact
          icon={
            <Coins className="h-4 w-4" />
          }
          label="Budget"
          value={formatCurrency(
            show.estimatedBudget,
          )}
        />

        <Fact
          icon={
            <Film className="h-4 w-4" />
          }
          label="Episodes"
          value={
            show.episodeCount !==
              null &&
            show.episodeCount !==
              undefined
              ? String(
                  show.episodeCount,
                )
              : "—"
          }
        />

        <Fact
          icon={
            <Users2 className="h-4 w-4" />
          }
          label="Creator"
          value={creatorName}
        />

        <Fact
          icon={
            <CalendarDays className="h-4 w-4" />
          }
          label="Release"
          value={formatDate(
            show.expectedReleaseDate,
          )}
        />

      </div>

      {/* ===================================================
          MAIN GRID
      =================================================== */}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6">

        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <div className="space-y-6">

          {/* =================================================
              AI PREDICTION
          ================================================= */}

          {canGenerateAI && (
            <Card className="overflow-hidden">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>

                  <div className="flex items-center gap-3">

                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">

                      <Sparkles className="h-5 w-5" />

                    </div>

                    <div>

                      <h2 className="text-lg font-semibold">
                        AI Prediction
                      </h2>

                      <p className="text-xs text-muted-foreground mt-1">
                        AI-assisted show potential analysis
                      </p>

                    </div>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    handleGeneratePrediction
                  }
                  disabled={
                    aiLoading
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {aiLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analysing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Prediction
                    </>
                  )}

                </button>

              </div>

              {aiError && (
                <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {aiError}
                </div>
              )}

              {!aiAnalysis &&
                !aiLoading &&
                !aiError && (
                  <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-center">

                    <Sparkles className="h-8 w-8 mx-auto text-primary/50" />

                    <div className="mt-3 text-sm font-medium">
                      Ready to analyse this show
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                      Generate an AI-assisted prediction
                      using the show's story, audience,
                      budget and release information.
                    </p>

                  </div>
                )}

              {aiLoading && (
                <div className="mt-6 rounded-xl border border-border p-6">

                  <div className="flex items-center justify-center gap-3">

                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />

                    <span className="text-sm text-muted-foreground">
                      Analysing show data...
                    </span>

                  </div>

                </div>
              )}

              {aiAnalysis && (
                <div className="mt-6 space-y-5">

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                    <AIScore
                      icon={
                        <Sparkles className="h-4 w-4" />
                      }
                      label="Originality"
                      value={
                        aiAnalysis.originalityScore
                      }
                    />

                    <AIScore
                      icon={
                        <TrendingUp className="h-4 w-4" />
                      }
                      label="Market Potential"
                      value={
                        aiAnalysis.marketPotentialScore
                      }
                    />

                    <AIScore
                      icon={
                        <Target className="h-4 w-4" />
                      }
                      label="Success Rate"
                      value={
                        aiAnalysis.predictedSuccessRate
                      }
                    />

                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">

                    <div className="rounded-xl border border-border p-4">

                      <div className="text-xs uppercase tracking-widest text-muted-foreground">
                        Predicted genre
                      </div>

                      <div className="mt-2 text-base font-semibold">
                        {aiAnalysis.predictedGenre ||
                          "Not available"}
                      </div>

                    </div>

                    <div className="rounded-xl border border-border p-4">

                      <div className="text-xs uppercase tracking-widest text-muted-foreground">
                        Target audience
                      </div>

                      <div className="mt-2 text-base font-semibold">
                        {aiAnalysis.targetAudience ||
                          "Not available"}
                      </div>

                    </div>

                  </div>

                  {aiAnalysis.summary && (
                    <div className="rounded-xl border border-border p-4">

                      <div className="flex items-center gap-2 text-sm font-semibold">

                        <Sparkles className="h-4 w-4 text-primary" />

                        AI Insight

                      </div>

                      <p className="mt-3 text-sm text-muted-foreground leading-7">
                        {aiAnalysis.summary}
                      </p>

                    </div>
                  )}

                  {aiAnalysis.recommendations && (
                    <div className="rounded-xl border border-border p-4">

                      <div className="flex items-center gap-2 text-sm font-semibold">

                        <Lightbulb className="h-4 w-4 text-primary" />

                        Recommendations

                      </div>

                      <p className="mt-3 text-sm text-muted-foreground leading-7 whitespace-pre-line">
                        {aiAnalysis.recommendations}
                      </p>

                    </div>
                  )}

                </div>
              )}

            </Card>
          )}

          {/* =================================================
              AI FUTURE PLANNER
          ================================================= */}

          <Card className="overflow-hidden">

            {/* HEADER */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>

                <div className="flex items-center gap-3">

                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">

                    <CalendarRange className="h-5 w-5" />

                  </div>

                  <div>

                    <h2 className="text-lg font-semibold">
                      AI Future Planner
                    </h2>

                    <p className="text-xs text-muted-foreground mt-1">
                      Six-month demand, seasonality and value outlook
                    </p>

                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  handleGenerateFutureForecast
                }
                disabled={
                  futureLoading
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {futureLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Forecasting...
                  </>
                ) : (
                  <>
                    <CalendarRange className="h-4 w-4" />
                    Generate Forecast
                  </>
                )}

              </button>

            </div>

            {/* ERROR */}

            {futureError && (
              <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {futureError}
              </div>
            )}

            {/* EMPTY STATE */}

            {!futureForecast &&
              !futureLoading &&
              !futureError && (
                <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-center">

                  <CalendarRange className="h-8 w-8 mx-auto text-primary/50" />

                  <div className="mt-3 text-sm font-medium">
                    Plan the show's future
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                    Generate a six-month forecast for
                    demand, seasonality and content value.
                  </p>

                </div>
              )}

            {/* LOADING */}

            {futureLoading && (
              <div className="mt-6 rounded-xl border border-border p-6">

                <div className="flex items-center justify-center gap-3">

                  <RefreshCw className="h-5 w-5 animate-spin text-primary" />

                  <span className="text-sm text-muted-foreground">
                    Analysing future trends...
                  </span>

                </div>

              </div>
            )}

            {/* RESULT */}

            {futureForecast && (
              <div className="mt-6 space-y-6">

                {/* TOP METRICS */}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                  <PlannerMetric
                    icon={
                      <Activity className="h-4 w-4" />
                    }
                    label="Current Demand"
                    value={`${Math.round(
                      futureForecast.currentDemandScore,
                    )}%`}
                  />

                  <PlannerMetric
                    icon={
                      <TrendingUp className="h-4 w-4" />
                    }
                    label="6-Month Demand"
                    value={`${Math.round(
                      futureForecast.projectedDemandScore,
                    )}%`}
                  />

                  <PlannerMetric
                    icon={
                      <ArrowUpRight className="h-4 w-4" />
                    }
                    label="Value Outlook"
                    value={`${futureForecast.priceChangePercent >= 0 ? "+" : ""}${Math.round(
                      futureForecast.priceChangePercent,
                    )}%`}
                  />

                  <PlannerMetric
                    icon={
                      <Target className="h-4 w-4" />
                    }
                    label="Confidence"
                    value={`${Math.round(
                      futureForecast.confidenceScore,
                    )}%`}
                  />

                </div>

                {/* OUTLOOK SUMMARY */}

                <div className="grid sm:grid-cols-2 gap-4">

                  <div className="rounded-xl border border-border p-4">

                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      Price / Value Outlook
                    </div>

                    <div className="mt-2 flex items-center gap-2">

                      <span className="text-xl font-semibold">
                        {
                          futureForecast.priceOutlook
                        }
                      </span>

                      {futureForecast.priceChangePercent >=
                        0 ? (
                        <ArrowUpRight className="h-5 w-5 text-primary" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-muted-foreground rotate-180" />
                      )}

                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Derived content-value outlook based
                      on forecast demand and existing AI
                      signals.
                    </p>

                  </div>

                  <div className="rounded-xl border border-border p-4">

                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      Projected Peak
                    </div>

                    <div className="mt-2 text-xl font-semibold">
                      {futureForecast.peakMonth ||
                        "No clear peak"}
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Highest projected demand period in
                      the next six months.
                    </p>

                  </div>

                </div>

                {/* DEMAND FORECAST */}

                <div className="rounded-xl border border-border p-4">

                  <div className="flex items-center gap-2">

                    <BarChart3 className="h-4 w-4 text-primary" />

                    <div>

                      <div className="text-sm font-semibold">
                        Demand Forecast
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        Projected demand over the next six months
                      </div>

                    </div>

                  </div>

                  <div className="mt-6 space-y-4">

                    {futureForecast.forecast.map(
                      (point) => (
                        <div
                          key={point.month}
                          className="grid grid-cols-[80px_minmax(0,1fr)_45px] items-center gap-3"
                        >

                          <span className="text-xs text-muted-foreground">
                            {point.month}
                          </span>

                          <div className="h-3 rounded-full bg-muted overflow-hidden">

                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    point.demandScore,
                                  ),
                                )}%`,
                              }}
                            />

                          </div>

                          <span className="text-xs font-semibold text-right">
                            {Math.round(
                              point.demandScore,
                            )}
                          </span>

                        </div>
                      ),
                    )}

                  </div>

                </div>

                {/* SEASONALITY */}

                <div className="rounded-xl border border-border p-4">

                  <div className="flex items-center gap-2">

                    <CalendarDays className="h-4 w-4 text-primary" />

                    <div>

                      <div className="text-sm font-semibold">
                        Seasonality Outlook
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        Projected seasonal audience strength
                      </div>

                    </div>

                  </div>

                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

                    {futureForecast.forecast.map(
                      (point) => (
                        <div
                          key={`season-${point.month}`}
                          className="rounded-xl border border-border p-3"
                        >

                          <div className="text-xs text-muted-foreground truncate">
                            {point.month}
                          </div>

                          <div className="mt-2 text-lg font-bold">
                            {Math.round(
                              point.seasonalityIndex,
                            )}
                          </div>

                          <div className="text-[10px] text-muted-foreground">
                            seasonality
                          </div>

                          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">

                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    point.seasonalityIndex,
                                  ),
                                )}%`,
                              }}
                            />

                          </div>

                        </div>
                      ),
                    )}

                  </div>

                </div>

                {/* AI RECOMMENDATION */}

                <div className="rounded-xl border border-border p-4">

                  <div className="flex items-center gap-2 text-sm font-semibold">

                    <Lightbulb className="h-4 w-4 text-primary" />

                    AI Planning Recommendation

                  </div>

                  <p className="mt-3 text-sm text-muted-foreground leading-7">
                    {
                      futureForecast.recommendation
                    }
                  </p>

                </div>

              </div>
            )}

          </Card>

          {/* =================================================
              SYNOPSIS
          ================================================= */}

          <Card>

            <h2 className="text-lg font-semibold mb-2">
              Synopsis
            </h2>

            <p className="text-sm text-muted-foreground leading-7 whitespace-pre-wrap">
              {show.synopsis ||
                show.description ||
                "No synopsis has been added yet."}
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-6">

              <Fact
                icon={
                  <Coins className="h-4 w-4" />
                }
                label="Estimated budget"
                value={formatCurrency(
                  show.estimatedBudget,
                )}
              />

              <Fact
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
                label="Expected release"
                value={formatDate(
                  show.expectedReleaseDate,
                )}
              />

              <Fact
                icon={
                  <Users2 className="h-4 w-4" />
                }
                label="Creator"
                value={creatorName}
              />

              <Fact
                icon={
                  <Film className="h-4 w-4" />
                }
                label="Language"
                value={
                  show.language ||
                  "Not specified"
                }
              />

            </div>

          </Card>

          {/* =================================================
              SHOW STATUS
          ================================================= */}

          <Card>

            <h2 className="text-lg font-semibold mb-5">
              Show status
            </h2>

            <div className="space-y-4">

              <div>

                <div className="flex justify-between text-xs mb-2">

                  <span className="text-muted-foreground">
                    Current workflow progress
                  </span>

                  <span className="font-medium">
                    {progress}%
                  </span>

                </div>

                <Progress
                  value={
                    progress
                  }
                />

              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border p-4">

                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">

                  <RefreshCw className="h-5 w-5" />

                </div>

                <div>

                  <div className="text-sm font-medium">
                    {statusLabel(
                      show.status,
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground mt-1">
                    Current workflow status
                  </div>

                </div>

              </div>

            </div>

          </Card>

          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <Card>

            <h2 className="text-lg font-semibold mb-4">
              Description
            </h2>

            <p className="text-sm text-muted-foreground leading-7 whitespace-pre-wrap">
              {show.description ||
                "No description has been added for this show."}
            </p>

          </Card>

          {/* =================================================
              SHOW INFORMATION
          ================================================= */}

          <Card>

            <h2 className="text-lg font-semibold mb-4">
              Show information
            </h2>

            <div className="space-y-3 text-sm">

              <InfoRow
                label="Show ID"
                value={`SH-${show.showId}`}
              />

              <InfoRow
                label="Status"
                value={statusLabel(
                  show.status,
                )}
              />

              <InfoRow
                label="Genre"
                value={genreNames}
              />

              <InfoRow
                label="Language"
                value={
                  show.language ||
                  "Not specified"
                }
              />

              <InfoRow
                label="Target audience"
                value={
                  show.targetAudience ||
                  "Not specified"
                }
              />

              <InfoRow
                label="Episodes"
                value={
                  show.episodeCount !==
                    null &&
                  show.episodeCount !==
                    undefined
                    ? String(
                        show.episodeCount,
                      )
                    : "Not specified"
                }
              />

              <InfoRow
                label="Expected release"
                value={formatDate(
                  show.expectedReleaseDate,
                )}
              />

            </div>

          </Card>

        </div>

        {/* ===================================================
            RIGHT COLUMN
        =================================================== */}

        <div className="space-y-6">

          {/* =================================================
              BUDGET
          ================================================= */}

          <Card>

            <div className="flex items-center gap-2 text-sm font-semibold mb-4">

              <Gauge className="h-4 w-4 text-primary" />

              Budget overview

            </div>

            <div className="text-3xl font-bold">
              {formatCurrency(
                show.estimatedBudget,
              )}
            </div>

            <div className="text-xs text-muted-foreground mt-1">
              Estimated production budget
            </div>

            <div className="mt-5">

              <div className="flex justify-between text-xs mb-2">

                <span className="text-muted-foreground">
                  Workflow progress
                </span>

                <span className="font-medium">
                  {progress}%
                </span>

              </div>

              <Progress
                value={
                  progress
                }
              />

            </div>

          </Card>

          {/* =================================================
              CREATOR
          ================================================= */}

          <Card>

            <div className="flex items-center gap-2 text-sm font-semibold mb-4">

              <Clapperboard className="h-4 w-4 text-primary" />

              Creator

            </div>

            <div className="flex items-center gap-3">

              <div className="h-11 w-11 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">

                <Users2 className="h-5 w-5" />

              </div>

              <div className="min-w-0">

                <div className="text-sm font-medium truncate">
                  {creatorName}
                </div>

                <div className="text-xs text-muted-foreground truncate mt-1">
                  {creatorEmail}
                </div>

              </div>

            </div>

          </Card>

          {/* =================================================
              GENRE
          ================================================= */}

          <Card>

            <div className="flex items-center gap-2 text-sm font-semibold mb-4">

              <Film className="h-4 w-4 text-primary" />

              Genre

            </div>

            <p className="text-sm text-muted-foreground leading-6">
              {genreNames}
            </p>

          </Card>

          {/* =================================================
              TARGET AUDIENCE
          ================================================= */}

          <Card>

            <div className="flex items-center gap-2 text-sm font-semibold mb-4">

              <Users2 className="h-4 w-4 text-primary" />

              Target audience

            </div>

            <p className="text-sm text-muted-foreground leading-6">
              {show.targetAudience ||
                "Not specified"}
            </p>

          </Card>

          {/* =================================================
              RELEASE TIMELINE
          ================================================= */}

          <Card>

            <div className="flex items-center gap-2 text-sm font-semibold mb-4">

              <CalendarDays className="h-4 w-4 text-primary" />

              Release timeline

            </div>

            <div className="rounded-xl border border-border p-4">

              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Expected release
              </div>

              <div className="mt-2 text-lg font-semibold">
                {formatDate(
                  show.expectedReleaseDate,
                )}
              </div>

            </div>

          </Card>

        </div>

      </div>

    </DashboardLayout>
  );
}

/* =========================================================
   FACT COMPONENT
========================================================= */

function Fact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4">

      <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-widest">

        {icon}

        {label}

      </div>

      <div className="mt-1.5 text-lg font-bold truncate">
        {value}
      </div>

    </div>
  );
}

/* =========================================================
   AI SCORE COMPONENT
========================================================= */

function AIScore({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: number | null;
}) {
  const score =
    value == null
      ? null
      : Number(value);

  const validScore =
    score !== null &&
    Number.isFinite(score);

  const displayScore =
    validScore
      ? Math.round(score)
      : null;

  return (
    <div className="rounded-xl border border-border p-4">

      <div className="flex items-center gap-2 text-xs text-muted-foreground">

        <span className="text-primary">
          {icon}
        </span>

        {label}

      </div>

      <div className="mt-2 flex items-end gap-1">

        <span className="text-3xl font-bold">
          {displayScore ??
            "—"}
        </span>

        {validScore ? (
          <span className="text-xs text-muted-foreground mb-1.5">
            /100
          </span>
        ) : null}

      </div>

      {validScore ? (
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">

          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  score,
                ),
              )}%`,
            }}
          />

        </div>
      ) : null}

    </div>
  );
}

/* =========================================================
   FUTURE PLANNER METRIC
========================================================= */

function PlannerMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4">

      <div className="flex items-center gap-2 text-xs text-muted-foreground">

        <span className="text-primary">
          {icon}
        </span>

        {label}

      </div>

      <div className="mt-2 text-2xl font-bold">
        {value}
      </div>

    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-5">

      <span className="text-muted-foreground shrink-0">
        {label}
      </span>

      <span className="font-medium text-right break-words">
        {value}
      </span>

    </div>
  );
}
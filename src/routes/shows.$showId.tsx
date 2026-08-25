import {
  createFileRoute,
  Link,
  notFound,
} from "@tanstack/react-router";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, Chip, Progress } from "@/components/ui-kit";

import {
  getShowById,
  type ShowResponse,
} from "@/api/shows";

import {
  ArrowLeft,
  CalendarDays,
  Clapperboard,
  Coins,
  Film,
  Users2,
  Gauge,
  CheckCircle2,
  Circle,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute(
  "/shows/$showId"
)({
  loader: async ({ params }) => {
    try {
      const show = await getShowById(
        Number(params.showId)
      );

      return { show };
    } catch {
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

    const { show } = loaderData;

    return {
      meta: [
        {
          title: `${show.title} — Netflix Show Manager`,
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

function normalizeStatus(status?: string | null) {
  if (!status) return "PENDING";

  return status.toUpperCase();
}

function statusLabel(status?: string | null) {
  switch (normalizeStatus(status)) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "UNDER_REVIEW":
      return "Under Review";
    case "IN_PRODUCTION":
      return "In Production";
    default:
      return "Pending";
  }
}

function statusVariant(
  status?: string | null
): "success" | "warning" | "danger" | "info" | "primary" {
  switch (normalizeStatus(status)) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "danger";
    case "UNDER_REVIEW":
      return "warning";
    case "IN_PRODUCTION":
      return "primary";
    default:
      return "info";
  }
}

function formatCurrency(
  value?: number | null
) {
  if (value == null) return "—";

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }

  return `$${value.toLocaleString()}`;
}

function formatDate(
  value?: string | null
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function getStatusProgress(
  status?: string | null
) {
  switch (normalizeStatus(status)) {
    case "APPROVED":
      return 100;
    case "IN_PRODUCTION":
      return 75;
    case "UNDER_REVIEW":
      return 50;
    case "REJECTED":
      return 100;
    default:
      return 20;
  }
}

function ShowDetail() {
  const { show } = Route.useLoaderData();

  const creatorName =
    show.creator?.fullName ||
    show.creator?.username ||
    "Unknown creator";

  const creatorEmail =
    show.creator?.email || "No email available";

  return (
    <DashboardLayout>
      <Link
        to="/shows"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shows
      </Link>

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
                  show.status
                )}
              >
                {statusLabel(show.status)}
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
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {show.title}
            </h1>

            <p className="text-sm text-muted-foreground mt-2">
              SH-{show.showId} · created by{" "}
              {creatorName}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold mb-2">
              Synopsis
            </h2>

            <p className="text-sm text-muted-foreground leading-6">
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
                  show.estimatedBudget
                )}
              />

              <Fact
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
                label="Expected release"
                value={formatDate(
                  show.expectedReleaseDate
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
                value={show.language || "—"}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-5">
              Show status
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">
                    Current progress
                  </span>

                  <span className="font-medium">
                    {getStatusProgress(
                      show.status
                    )}
                    %
                  </span>
                </div>

                <Progress
                  value={getStatusProgress(
                    show.status
                  )}
                />
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border p-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <RefreshCw className="h-5 w-5" />
                </div>

                <div>
                  <div className="text-sm font-medium">
                    {statusLabel(show.status)}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Current workflow status
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-5">
              Description
            </h2>

            <p className="text-sm text-muted-foreground leading-6">
              {show.description ||
                "No description has been added for this show."}
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold mb-4">
              <Gauge className="h-4 w-4 text-primary" />
              Budget overview
            </div>

            <div className="text-3xl font-bold">
              {formatCurrency(
                show.estimatedBudget
              )}
            </div>

            <div className="text-xs text-muted-foreground mt-1">
              Estimated production budget
            </div>

            <div className="mt-5">
              <Progress
                value={getStatusProgress(
                  show.status
                )}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold mb-4">
              <Clapperboard className="h-4 w-4 text-primary" />
              Creator
            </div>

            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-primary/10 text-primary grid place-items-center">
                <Users2 className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {creatorName}
                </div>

                <div className="text-xs text-muted-foreground truncate">
                  {creatorEmail}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold mb-3">
              Show information
            </div>

            <div className="space-y-3 text-sm">
              <InfoRow
                label="Show ID"
                value={`SH-${show.showId}`}
              />

              <InfoRow
                label="Status"
                value={statusLabel(
                  show.status
                )}
              />

              <InfoRow
                label="Language"
                value={
                  show.language || "Not specified"
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
                label="Release"
                value={formatDate(
                  show.expectedReleaseDate
                )}
              />
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">
        {label}
      </span>

      <span className="font-medium text-right">
        {value}
      </span>
    </div>
  );
}
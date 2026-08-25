import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, Chip, Progress } from "@/components/ui-kit";
import {
  Filter,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Film,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  deleteShow,
  getAllShows,
  type ShowResponse,
  type ShowStatus,
} from "@/api/shows";

export const Route = createFileRoute("/shows/")({
  head: () => ({
    meta: [
      { title: "Shows — Netflix Show Manager" },
      {
        name: "description",
        content:
          "Browse and manage all submitted Netflix originals.",
      },
    ],
  }),
  component: ShowsPage,
});

function normalizeStatus(
  status?: string | null
): ShowStatus {
  if (!status) return "PENDING";

  const value = status.toUpperCase();

  if (value === "APPROVED") return "APPROVED";
  if (value === "REJECTED") return "REJECTED";
  if (value === "UNDER_REVIEW") return "UNDER_REVIEW";
  if (value === "IN_PRODUCTION") return "IN_PRODUCTION";

  return "PENDING";
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
): string {
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
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function getProgress(status?: string | null) {
  switch (normalizeStatus(status)) {
    case "APPROVED":
      return 100;
    case "IN_PRODUCTION":
      return 70;
    case "UNDER_REVIEW":
      return 45;
    case "REJECTED":
      return 100;
    default:
      return 20;
  }
}

function ShowsPage() {
  const [shows, setShows] = useState<ShowResponse[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadShows() {
    try {
      setLoading(true);
      setError("");

      const data = await getAllShows();

      setShows(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load shows"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShows();
  }, []);

  const filtered = useMemo(() => {
    const search = query.toLowerCase().trim();

    if (!search) {
      return shows;
    }

    return shows.filter((show) => {
      return (
        show.title?.toLowerCase().includes(search) ||
        show.creator?.fullName
          ?.toLowerCase()
          .includes(search) ||
        show.language
          ?.toLowerCase()
          .includes(search) ||
        show.targetAudience
          ?.toLowerCase()
          .includes(search)
      );
    });
  }, [shows, query]);

  async function handleDelete(showId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this show?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(showId);
      setError("");

      await deleteShow(showId);

      setShows((current) =>
        current.filter(
          (show) => show.showId !== showId
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete show"
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Shows"
        description="All submitted, approved and in-production originals."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadShows}
              disabled={loading}
              className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>

            <Link
              to="/shows/new"
              className="inline-flex h-10 px-4 items-center rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition shadow-[var(--shadow-glow)]"
            >
              + New Show
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <input
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              placeholder="Search by title, creator, language..."
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button className="h-10 px-3 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition">
              <Filter className="h-4 w-4" />
              Status
            </button>

            <button className="h-10 px-3 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition">
              <SlidersHorizontal className="h-4 w-4" />
              Sort
            </button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <Card
                key={index}
                className="h-80 animate-pulse"
              />
            )
          )}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
            <Film className="h-7 w-7" />
          </div>

          <h3 className="text-lg font-semibold">
            No shows found
          </h3>

          <p className="text-sm text-muted-foreground mt-2">
            {query
              ? "Try a different search."
              : "No shows have been submitted yet."}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {filtered.slice(0, 6).map((show) => (
              <Card
                key={show.showId}
                className="card-hover overflow-hidden !p-0"
              >
                <div className="relative h-40">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-background to-background" />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <Film className="h-12 w-12 text-primary/30" />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                  <div className="absolute top-3 left-3 flex gap-2">
                    <Chip
                      variant={statusVariant(
                        show.status
                      )}
                    >
                      {statusLabel(show.status)}
                    </Chip>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="text-lg font-bold truncate">
                      {show.title}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      by{" "}
                      {show.creator?.fullName ||
                        show.creator?.username ||
                        "Unknown creator"}
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Budget
                    </span>

                    <span className="font-semibold">
                      {formatCurrency(
                        show.estimatedBudget
                      )}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">
                        Status
                      </span>

                      <span className="font-medium">
                        {statusLabel(show.status)}
                      </span>
                    </div>

                    <Progress
                      value={getProgress(
                        show.status
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/shows/$showId"
                      params={{
                        showId: String(show.showId),
                      }}
                      className="flex-1 h-9 rounded-lg border border-border text-xs hover:bg-accent transition inline-flex items-center justify-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Link>

                    <button
                      onClick={() =>
                        handleDelete(show.showId)
                      }
                      disabled={
                        deletingId === show.showId
                      }
                      className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-destructive/20 hover:text-destructive transition disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="!p-0 overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="text-sm font-semibold">
                All shows
              </div>

              <div className="text-xs text-muted-foreground">
                {filtered.length} results
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-surface-elevated/40">
                  <tr>
                    <th className="p-4">Show</th>
                    <th className="p-4">Language</th>
                    <th className="p-4">Budget</th>
                    <th className="p-4">Creator</th>
                    <th className="p-4">Release</th>
                    <th className="p-4">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((show) => (
                    <tr
                      key={show.showId}
                      className="border-t border-border hover:bg-accent/40 transition"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                            <Film className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {show.title}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              SH-{show.showId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        {show.language || "—"}
                      </td>

                      <td className="p-4">
                        {formatCurrency(
                          show.estimatedBudget
                        )}
                      </td>

                      <td className="p-4">
                        {show.creator?.fullName ||
                          show.creator?.username ||
                          "—"}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        {formatDate(
                          show.expectedReleaseDate
                        )}
                      </td>

                      <td className="p-4">
                        <Chip
                          variant={statusVariant(
                            show.status
                          )}
                        >
                          {statusLabel(show.status)}
                        </Chip>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Link
                            to="/shows/$showId"
                            params={{
                              showId: String(
                                show.showId
                              ),
                            }}
                            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent transition"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          <button
                            onClick={() =>
                              handleDelete(
                                show.showId
                              )
                            }
                            disabled={
                              deletingId ===
                              show.showId
                            }
                            className="h-8 w-8 grid place-items-center rounded-lg hover:bg-destructive/20 hover:text-destructive transition disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <button className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent transition">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
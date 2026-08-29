import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DashboardLayout,
  PageHeader,
} from "@/components/layout/DashboardLayout";

import { apiRequest } from "@/lib/api";

/* =========================================================
   ROUTE
========================================================= */

export const Route = createFileRoute("/production")({
  component: Production,
  head: () => ({
    meta: [
      {
        title: "Production - Netflix Show Manager",
      },
      {
        name: "description",
        content: "Track productions from planning to release.",
      },
    ],
  }),
});

/* =========================================================
   TYPES
========================================================= */

type ProductionStatus =
  | "PLANNING"
  | "PRE_PRODUCTION"
  | "SHOOTING"
  | "POST_PRODUCTION"
  | "COMPLETED";

type Priority = "low" | "medium" | "high" | "critical";

interface RoleResponse {
  roleId?: number;
  roleName?: string;
  description?: string;
}

interface UserResponse {
  userId: number;
  fullName: string;
  username: string;
  email?: string;
  role?: RoleResponse | null;
}

interface ShowResponse {
  showId: number;
  title: string;
  description?: string | null;
  synopsis?: string | null;
  estimatedBudget?: number | string | null;
  expectedReleaseDate?: string | null;
  status?: string | null;
  creator?: UserResponse | null;
}

interface ProductionResponse {
  productionId: number;
  showId: number;
  producerId: number;
  productionStatus: ProductionStatus | string;
  allocatedBudget?: number | string | null;
  actualBudget?: number | string | null;
  startDate?: string | null;
  expectedEndDate?: string | null;
  completionDate?: string | null;
  notes?: string | null;
}

interface ProductionCard {
  productionId: number;
  showId: number;
  producerId: number;
  title: string;
  creator: string;
  status: ProductionStatus;
  allocatedBudget: number;
  actualBudget: number;
  progress: number;
  priority: Priority;
  startDate: string | null;
  expectedEndDate: string | null;
  completionDate: string | null;
  notes: string | null;
}

/* =========================================================
   CONSTANTS
========================================================= */

const columns: {
  id: ProductionStatus;
  label: string;
  dot: string;
}[] = [
  {
    id: "PLANNING",
    label: "Planning",
    dot: "bg-sky-500",
  },
  {
    id: "PRE_PRODUCTION",
    label: "Pre-Production",
    dot: "bg-yellow-400",
  },
  {
    id: "SHOOTING",
    label: "Production",
    dot: "bg-red-500",
  },
  {
    id: "POST_PRODUCTION",
    label: "Post-Production",
    dot: "bg-purple-500",
  },
  {
    id: "COMPLETED",
    label: "Completed",
    dot: "bg-emerald-500",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function normalizeStatus(value: unknown): ProductionStatus {
  const status = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[-\s]/g, "_");

  if (status === "PRE_PRODUCTION") {
    return "PRE_PRODUCTION";
  }

  if (status === "SHOOTING" || status === "PRODUCTION") {
    return "SHOOTING";
  }

  if (status === "POST_PRODUCTION") {
    return "POST_PRODUCTION";
  }

  if (status === "COMPLETED") {
    return "COMPLETED";
  }

  return "PLANNING";
}

function statusLabel(status: ProductionStatus): string {
  switch (status) {
    case "PLANNING":
      return "Planning";
    case "PRE_PRODUCTION":
      return "Pre-Production";
    case "SHOOTING":
      return "Production";
    case "POST_PRODUCTION":
      return "Post-Production";
    case "COMPLETED":
      return "Completed";
  }
}

function progressForStatus(status: ProductionStatus): number {
  switch (status) {
    case "PLANNING":
      return 15;
    case "PRE_PRODUCTION":
      return 30;
    case "SHOOTING":
      return 55;
    case "POST_PRODUCTION":
      return 80;
    case "COMPLETED":
      return 100;
  }
}

function numberValue(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value: unknown): string {
  const amount = numberValue(value);

  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }

  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }

  return `$${amount.toLocaleString("en-IN")}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function creatorName(show?: ShowResponse): string {
  return (
    show?.creator?.fullName ||
    show?.creator?.username ||
    "Unknown creator"
  );
}

function priorityForShow(show?: ShowResponse): Priority {
  const value = String(show?.status ?? "")
    .toUpperCase()
    .replace(/[-\s]/g, "_");

  if (value === "REJECTED") {
    return "critical";
  }

  if (value === "UNDER_REVIEW") {
    return "high";
  }

  if (value === "APPROVED") {
    return "medium";
  }

  return "low";
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error) {
    return error;
  }

  return fallback;
}

/*
 * apiRequest normally returns the JSON body directly.
 * These helpers also tolerate common {data: ...} / {content: ...}
 * wrappers so the page does not silently become empty.
 */
function unwrapArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as { data: unknown }).data)
  ) {
    return (value as { data: T[] }).data;
  }

  if (
    value &&
    typeof value === "object" &&
    "content" in value &&
    Array.isArray((value as { content: unknown }).content)
  ) {
    return (value as { content: T[] }).content;
  }

  return [];
}

/* =========================================================
   PAGE
========================================================= */

function Production() {
  const [shows, setShows] = useState<ShowResponse[]>([]);
  const [productions, setProductions] = useState<ProductionResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [priority, setPriority] = useState<"all" | Priority>("all");

  const [selected, setSelected] = useState<ProductionCard | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  /* -------------------------------------------------------
     GET SHOWS
  ------------------------------------------------------- */

  const fetchShows = useCallback(async () => {
    const response = await apiRequest<unknown>("/api/shows");
    return unwrapArray<ShowResponse>(response);
  }, []);

  /* -------------------------------------------------------
     GET PRODUCTIONS

     IMPORTANT:
     We first get the REAL show IDs from /api/shows.
     We never generate 1006/1007/1008/etc ourselves.
  ------------------------------------------------------- */

  const fetchProductions = useCallback(
    async (showList: ShowResponse[]) => {
      if (showList.length === 0) {
        setProductions([]);
        return;
      }

      const requests = await Promise.allSettled(
        showList.map(async (show) => {
          const response = await apiRequest<unknown>(
            `/api/productions/show/${show.showId}`,
          );

          return unwrapArray<ProductionResponse>(response);
        }),
      );

      const result: ProductionResponse[] = [];

      for (const request of requests) {
        if (request.status === "fulfilled") {
          result.push(...request.value);
        } else {
          console.error(
            "Could not load productions for a show:",
            request.reason,
          );
        }
      }

      const unique = Array.from(
        new Map(
          result.map((item) => [item.productionId, item]),
        ).values(),
      );

      setProductions(unique);
    },
    [],
  );

  /* -------------------------------------------------------
     LOAD DATA
  ------------------------------------------------------- */

  const loadData = useCallback(
    async (initial = false) => {
      if (initial) {
        setLoading(true);
      }

      setError("");

      try {
        const showList = await fetchShows();

        setShows(showList);

        await fetchProductions(showList);
      } catch (err) {
        console.error("Production page error:", err);

        setError(
          errorMessage(
            err,
            "Unable to load production data.",
          ),
        );

        setShows([]);
        setProductions([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchShows, fetchProductions],
  );

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccess("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [success]);

  /* -------------------------------------------------------
     CARDS
  ------------------------------------------------------- */

  const cards = useMemo<ProductionCard[]>(() => {
    const showMap = new Map<number, ShowResponse>();

    for (const show of shows) {
      showMap.set(show.showId, show);
    }

    return productions.map((production) => {
      const show = showMap.get(production.showId);
      const status = normalizeStatus(production.productionStatus);

      return {
        productionId: production.productionId,
        showId: production.showId,
        producerId: production.producerId,

        title: show?.title || `Show #${production.showId}`,
        creator: creatorName(show),

        status,

        allocatedBudget: numberValue(
          production.allocatedBudget,
        ),

        actualBudget: numberValue(
          production.actualBudget,
        ),

        progress: progressForStatus(status),

        priority: priorityForShow(show),

        startDate: production.startDate ?? null,
        expectedEndDate: production.expectedEndDate ?? null,
        completionDate: production.completionDate ?? null,

        notes: production.notes ?? null,
      };
    });
  }, [shows, productions]);

  const filteredCards = useMemo(() => {
    if (priority === "all") {
      return cards;
    }

    return cards.filter((card) => card.priority === priority);
  }, [cards, priority]);

  /* -------------------------------------------------------
     REFRESH
  ------------------------------------------------------- */

  const refresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    setSuccess("");
    await loadData(false);
  };

  /* -------------------------------------------------------
     DELETE
  ------------------------------------------------------- */

  const deleteProduction = async (id: number) => {
    const confirmed = window.confirm(
      `Delete production #${id}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await apiRequest(`/api/productions/${id}`, {
        method: "DELETE",
      });

      setSelected(null);
      setEditOpen(false);

      setSuccess("Production deleted successfully!");

      await loadData(false);
    } catch (err) {
      console.error("Delete production error:", err);

      setError(
        errorMessage(
          err,
          "Unable to delete production.",
        ),
      );
    }
  };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <DashboardLayout>
      <PageHeader
        title="Production Board"
        description="Track productions from planning to release."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPriority("all")}
              className="h-10 rounded-xl border border-border px-3 text-sm inline-flex items-center gap-2 hover:bg-accent"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>

            <button
              type="button"
              onClick={refresh}
              disabled={refreshing || loading}
              className="h-10 rounded-xl border border-border px-3 text-sm inline-flex items-center gap-2 hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setCreateOpen(true);
              }}
              className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Production
            </button>
          </div>
        }
      />

      {success && (
        <div className="mb-4 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <span className="mr-2 text-sm font-semibold">
          Priority
        </span>

        {(
          ["all", "low", "medium", "high", "critical"] as const
        ).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setPriority(item)}
            className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
              priority === item
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-accent"
            }`}
          >
            {item === "all"
              ? "All"
              : item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-60 items-center justify-center text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading productions...
          </div>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="text-lg font-semibold">
            No productions found
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {shows.length === 0
              ? "No shows were returned by /api/shows."
              : "No productions are associated with the available shows."}
          </p>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-5 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Production
          </button>
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-6">
          {columns.map((column) => {
            const items = filteredCards.filter(
              (card) => card.status === column.id,
            );

            return (
              <div
                key={column.id}
                className="w-80 shrink-0"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${column.dot}`}
                    />

                    <span className="text-sm font-semibold">
                      {column.label}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {items.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="grid h-7 w-7 place-items-center rounded-lg hover:bg-accent"
                    title="Add production"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((card) => (
                    <ProductionCardView
                      key={card.productionId}
                      card={card}
                      onClick={() => {
                        setError("");
                        setSelected(card);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && !editOpen && (
        <DetailsModal
          card={selected}
          onClose={() => setSelected(null)}
          onEdit={() => setEditOpen(true)}
          onDelete={deleteProduction}
        />
      )}

      {createOpen && (
        <CreateModal
          shows={shows}
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false);
            setSuccess("Production created successfully!");
            await loadData(false);
          }}
        />
      )}

      {selected && editOpen && (
        <EditModal
          card={selected}
          onClose={() => setEditOpen(false)}
          onUpdated={async () => {
            setEditOpen(false);
            setSelected(null);
            setSuccess("Production updated successfully!");
            await loadData(false);
          }}
        />
      )}
    </DashboardLayout>
  );
}

/* =========================================================
   CARD
========================================================= */

function ProductionCardView({
  card,
  onClick,
}: {
  card: ProductionCard;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:-translate-y-0.5 hover:border-primary/50"
    >
      <div className="relative h-28 bg-accent">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-black text-muted-foreground/20">
            SF
          </span>
        </div>

        <div className="absolute left-2 top-2">
          <span className="rounded-full bg-background/80 px-2 py-1 text-[10px] font-medium">
            {card.priority}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-8">
          <div className="truncate text-sm font-bold">
            {card.title}
          </div>

          <div className="truncate text-[11px] text-white/60">
            {card.creator}
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Status
          </span>

          <span className="rounded-lg bg-accent px-2 py-1 text-[10px]">
            {statusLabel(card.status)}
          </span>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[11px]">
            <span className="text-muted-foreground">
              Progress
            </span>
            <span>{card.progress}%</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${card.progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            Team not assigned
          </span>

          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(card.expectedEndDate)}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-xs text-muted-foreground">
            Budget
          </span>

          <span className="text-xs font-semibold">
            {formatCurrency(card.allocatedBudget)}
          </span>
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   DETAILS MODAL
========================================================= */

function DetailsModal({
  card,
  onClose,
  onEdit,
  onDelete,
}: {
  card: ProductionCard;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <ModalShell
      title={card.title}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Detail
            label="Status"
            value={statusLabel(card.status)}
          />
          <Detail
            label="Priority"
            value={card.priority}
          />
          <Detail
            label="Production ID"
            value={String(card.productionId)}
          />
          <Detail
            label="Show ID"
            value={String(card.showId)}
          />
          <Detail
            label="Producer ID"
            value={String(card.producerId)}
          />
          <Detail
            label="Allocated Budget"
            value={formatCurrency(card.allocatedBudget)}
          />
          <Detail
            label="Actual Budget"
            value={formatCurrency(card.actualBudget)}
          />
          <Detail
            label="Start Date"
            value={formatDate(card.startDate)}
          />
          <Detail
            label="Expected End"
            value={formatDate(card.expectedEndDate)}
          />
          <Detail
            label="Completion Date"
            value={formatDate(card.completionDate)}
          />
          <Detail
            label="Progress"
            value={`${card.progress}%`}
          />
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Production Progress
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${card.progress}%` }}
            />
          </div>
        </div>

        {card.notes && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Production Notes
            </div>

            <div className="rounded-xl border border-border p-4 text-sm whitespace-pre-wrap text-muted-foreground">
              {card.notes}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => onDelete(card.productionId)}
            className="h-10 rounded-xl border border-red-500/40 px-4 text-red-400 inline-flex items-center gap-2 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="h-10 rounded-xl bg-primary px-4 font-semibold text-primary-foreground inline-flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Edit Production
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-border px-4 hover:bg-accent"
          >
            Close
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* =========================================================
   CREATE MODAL
========================================================= */

function CreateModal({
  shows,
  onClose,
  onCreated,
}: {
  shows: ShowResponse[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [showId, setShowId] = useState("");
  const [producerId, setProducerId] = useState("");
  const [status, setStatus] =
    useState<ProductionStatus>("PLANNING");

  const [allocatedBudget, setAllocatedBudget] = useState("");
  const [actualBudget, setActualBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (shows.length > 0 && !showId) {
      setShowId(String(shows[0].showId));
    }
  }, [shows, showId]);

  const submit = async () => {
    const parsedShowId = Number(showId);
    const parsedProducerId = Number(producerId);

    if (!Number.isInteger(parsedShowId) || parsedShowId <= 0) {
      setError("Please select a valid show.");
      return;
    }

    if (
      !Number.isInteger(parsedProducerId) ||
      parsedProducerId <= 0
    ) {
      setError("Producer ID must be a valid positive number.");
      return;
    }

    if (
      startDate &&
      expectedEndDate &&
      expectedEndDate < startDate
    ) {
      setError("Expected end date cannot be before start date.");
      return;
    }

    if (
      startDate &&
      completionDate &&
      completionDate < startDate
    ) {
      setError("Completion date cannot be before start date.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await apiRequest("/api/productions", {
        method: "POST",
        body: JSON.stringify({
          showId: parsedShowId,
          producerId: parsedProducerId,
          productionStatus: status,
          allocatedBudget:
            allocatedBudget.trim() === ""
              ? null
              : Number(allocatedBudget),
          actualBudget:
            actualBudget.trim() === ""
              ? null
              : Number(actualBudget),
          startDate: startDate || null,
          expectedEndDate: expectedEndDate || null,
          completionDate: completionDate || null,
          notes: notes.trim() || null,
        }),
      });

      await onCreated();
    } catch (err) {
      console.error("Create production error:", err);
      setError(
        errorMessage(
          err,
          "Unable to create production.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Create Production"
      onClose={onClose}
      wide
    >
      {error && <FormError message={error} />}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Show *">
          <select
            value={showId}
            onChange={(event) => setShowId(event.target.value)}
            className="input-field"
            disabled={saving}
          >
            <option value="">Select show</option>

            {shows.map((show) => (
              <option
                key={show.showId}
                value={show.showId}
              >
                {show.title} - ID {show.showId}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Producer ID *">
          <input
            value={producerId}
            onChange={(event) =>
              setProducerId(event.target.value)
            }
            type="number"
            min="1"
            step="1"
            placeholder="Example: 3"
            className="input-field"
            disabled={saving}
          />
        </Field>

        <Field label="Production Status *">
          <StatusSelect
            value={status}
            onChange={setStatus}
            disabled={saving}
          />
        </Field>

        <Field label="Allocated Budget">
          <input
            value={allocatedBudget}
            onChange={(event) =>
              setAllocatedBudget(event.target.value)
            }
            type="number"
            min="0"
            step="0.01"
            placeholder="12000000"
            className="input-field"
            disabled={saving}
          />
        </Field>

        <Field label="Actual Budget">
          <input
            value={actualBudget}
            onChange={(event) =>
              setActualBudget(event.target.value)
            }
            type="number"
            min="0"
            step="0.01"
            placeholder="8000000"
            className="input-field"
            disabled={saving}
          />
        </Field>

        <Field label="Start Date">
          <input
            value={startDate}
            onChange={(event) =>
              setStartDate(event.target.value)
            }
            type="date"
            className="input-field"
            disabled={saving}
          />
        </Field>

        <Field label="Expected End Date">
          <input
            value={expectedEndDate}
            onChange={(event) =>
              setExpectedEndDate(event.target.value)
            }
            type="date"
            className="input-field"
            disabled={saving}
          />
        </Field>

        <Field label="Completion Date">
          <input
            value={completionDate}
            onChange={(event) =>
              setCompletionDate(event.target.value)
            }
            type="date"
            className="input-field"
            disabled={saving}
          />
        </Field>
      </div>

      <Field label="Production Notes">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Production notes..."
          className="input-field resize-none"
          disabled={saving}
        />
      </Field>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="h-10 rounded-xl border border-border px-4 hover:bg-accent disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={saving || shows.length === 0}
          className="h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground inline-flex items-center gap-2 disabled:opacity-50"
        >
          {saving && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {saving ? "Creating..." : "Create Production"}
        </button>
      </div>
    </ModalShell>
  );
}

/* =========================================================
   EDIT MODAL
========================================================= */

function EditModal({
  card,
  onClose,
  onUpdated,
}: {
  card: ProductionCard;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [status, setStatus] =
    useState<ProductionStatus>(card.status);

  const [allocatedBudget, setAllocatedBudget] = useState(
    card.allocatedBudget ? String(card.allocatedBudget) : "",
  );

  const [actualBudget, setActualBudget] = useState(
    card.actualBudget ? String(card.actualBudget) : "",
  );

  const [startDate, setStartDate] = useState(
    dateInputValue(card.startDate),
  );

  const [expectedEndDate, setExpectedEndDate] = useState(
    dateInputValue(card.expectedEndDate),
  );

  const [completionDate, setCompletionDate] = useState(
    dateInputValue(card.completionDate),
  );

  const [notes, setNotes] = useState(card.notes ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (
      startDate &&
      expectedEndDate &&
      expectedEndDate < startDate
    ) {
      setError("Expected end date cannot be before start date.");
      return;
    }

    if (
      startDate &&
      completionDate &&
      completionDate < startDate
    ) {
      setError("Completion date cannot be before start date.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await apiRequest(
        `/api/productions/${card.productionId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            /*
             * Your backend ProductionRequest contains these two
             * fields even during update, so send the existing IDs.
             */
            showId: card.showId,
            producerId: card.producerId,

            productionStatus: status,

            allocatedBudget:
              allocatedBudget.trim() === ""
                ? null
                : Number(allocatedBudget),

            actualBudget:
              actualBudget.trim() === ""
                ? null
                : Number(actualBudget),

            startDate: startDate || null,
            expectedEndDate: expectedEndDate || null,
            completionDate: completionDate || null,
            notes: notes.trim() || null,
          }),
        },
      );

      await onUpdated();
    } catch (err) {
      console.error("Update production error:", err);
      setError(
        errorMessage(
          err,
          "Unable to update production.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={`Edit Production - ${card.title}`}
      onClose={onClose}
      wide
    >
      {error && <FormError message={error} />}

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Detail
          label="Production ID"
          value={String(card.productionId)}
        />
        <Detail
          label="Show ID"
          value={String(card.showId)}
        />
        <Detail
          label="Producer ID"
          value={String(card.producerId)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Production Status">
          <StatusSelect
            value={status}
            onChange={setStatus}
            disabled={saving}
          />
        </Field>

        <Field label="Allocated Budget">
          <input
            value={allocatedBudget}
            onChange={(event) =>
              setAllocatedBudget(event.target.value)
            }
            type="number"
            min="0"
            step="0.01"
            className="input-field"
            disabled={saving}
          />
        </Field>

        <Field label="Actual Budget">
          <input
            value={actualBudget}
            onChange={(event) =>
              setActualBudget(event.target.value)
            }
            type="number"
            min="0"
            step="0.01"
            className="input-field"
            disabled={saving}
          />
        </Field>

        <Field label="Start Date">
          <input
            value={startDate}
            onChange={(event) =>
              setStartDate(event.target.value)
            }
            type="date"
            className="input-field"
            disabled={saving}
          />
        </Field>

        <Field label="Expected End Date">
          <input
            value={expectedEndDate}
            onChange={(event) =>
              setExpectedEndDate(event.target.value)
            }
            type="date"
            className="input-field"
            disabled={saving}
          />
        </Field>

        <Field label="Completion Date">
          <input
            value={completionDate}
            onChange={(event) =>
              setCompletionDate(event.target.value)
            }
            type="date"
            className="input-field"
            disabled={saving}
          />
        </Field>
      </div>

      <Field label="Production Notes">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={2000}
          rows={5}
          className="input-field resize-none"
          disabled={saving}
        />
      </Field>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="h-10 rounded-xl border border-border px-4 hover:bg-accent disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground inline-flex items-center gap-2 disabled:opacity-50"
        >
          {saving && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </ModalShell>
  );
}

/* =========================================================
   STATUS SELECT
========================================================= */

function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: ProductionStatus;
  onChange: (value: ProductionStatus) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value as ProductionStatus,
        )
      }
      className="input-field"
      disabled={disabled}
    >
      <option value="PLANNING">Planning</option>
      <option value="PRE_PRODUCTION">
        Pre-Production
      </option>
      <option value="SHOOTING">Shooting</option>
      <option value="POST_PRODUCTION">
        Post-Production
      </option>
      <option value="COMPLETED">Completed</option>
    </select>
  );
}

/* =========================================================
   MODAL
========================================================= */

function ModalShell({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${
          wide ? "max-w-3xl" : "max-w-2xl"
        } max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h2 className="text-lg font-bold">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg hover:bg-accent"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold">
        {value}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-xs font-medium text-muted-foreground">
        {label}
      </label>

      {children}
    </div>
  );
}

function FormError({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
      {message}
    </div>
  );
}

function dateInputValue(
  value: string | null | undefined,
): string {
  if (!value) {
    return "";
  }

  return value.substring(0, 10);
}

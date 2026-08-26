import { createFileRoute } from "@tanstack/react-router";
import {
  DashboardLayout,
  PageHeader,
} from "@/components/layout/DashboardLayout";
import {
  Card,
  Chip,
  Progress,
} from "@/components/ui-kit";
import {
  shows,
  formatCurrency,
  apiRequest,
} from "@/lib/mock-data";
import {
  Calendar,
  Users,
  Plus,
  Filter,
  X,
  Save,
  Trash2,
  UserPlus,
  Loader2,
  RefreshCw,
  Clapperboard,
  Edit3,
  ChevronDown,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Link } from "@tanstack/react-router";
export const Route = createFileRoute("/production")({
  head: () => ({
    meta: [
      {
        title: "Production — Netflix Show Manager",
      },
      {
        name: "description",
        content:
          "Kanban board tracking productions from planning to release.",
      },
    ],
  }),
  component: Production,
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

type ProductionStage =
  | "planning"
  | "pre-production"
  | "production"
  | "post-production"
  | "completed";

interface ProductionResponse {
  productionId: number;
  productionStatus: ProductionStatus;
  allocatedBudget: number | string | null;
  actualBudget: number | string | null;
  notes: string | null;
}

interface ProductionRequest {
  showId: number;
  producerId: number;
  productionStatus: ProductionStatus;
  allocatedBudget: number | null;
  actualBudget: number | null;
  startDate: string | null;
  expectedEndDate: string | null;
  completionDate: string | null;
  notes: string;
}

interface ProductionTeamResponse {
  teamId: number;
  role: string;
  productionId: number;
  userId: number;
}

type ShowItem = (typeof shows)[number];

/* =========================================================
   KANBAN COLUMNS
========================================================= */

const columns: {
  id: ProductionStage;
  label: string;
  accent: string;
}[] = [
  {
    id: "planning",
    label: "Planning",
    accent: "bg-info",
  },
  {
    id: "pre-production",
    label: "Pre-Production",
    accent: "bg-warning",
  },
  {
    id: "production",
    label: "Production",
    accent: "bg-primary",
  },
  {
    id: "post-production",
    label: "Post-Production",
    accent: "bg-chart-4",
  },
  {
    id: "completed",
    label: "Completed",
    accent: "bg-success",
  },
];

/* =========================================================
   STATUS HELPERS
========================================================= */

const statusToStage: Record<
  ProductionStatus,
  ProductionStage
> = {
  PLANNING: "planning",
  PRE_PRODUCTION: "pre-production",
  SHOOTING: "production",
  POST_PRODUCTION: "post-production",
  COMPLETED: "completed",
};

const statusLabels: Record<
  ProductionStatus,
  string
> = {
  PLANNING: "Planning",
  PRE_PRODUCTION: "Pre-Production",
  SHOOTING: "Shooting",
  POST_PRODUCTION: "Post-Production",
  COMPLETED: "Completed",
};

const priorityVariant = {
  low: "info",
  medium: "default",
  high: "warning",
  critical: "danger",
} as const;

function getStatusProgress(
  status: ProductionStatus,
): number {
  switch (status) {
    case "PLANNING":
      return 20;

    case "PRE_PRODUCTION":
      return 40;

    case "SHOOTING":
      return 60;

    case "POST_PRODUCTION":
      return 80;

    case "COMPLETED":
      return 100;

    default:
      return 0;
  }
}

/* =========================================================
   BACKEND SHOW ID
========================================================= */

/*
 * Current mock-data IDs are:
 *
 * SH-1000
 * SH-1001
 * ...
 *
 * Backend expects Long IDs.
 *
 * Therefore:
 *
 * SH-1000 -> 1000
 *
 * When you later use ShowResponse directly from backend,
 * you can replace this with show.showId.
 */
function getBackendShowId(
  showId: string,
): number | null {
  const numeric = Number(
    showId.replace(/\D/g, ""),
  );

  if (
    !Number.isInteger(numeric) ||
    numeric <= 0
  ) {
    return null;
  }

  return numeric;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

function Production() {
  const [productionMap, setProductionMap] =
    useState<
      Record<number, ProductionResponse>
    >({});

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [selectedShow, setSelectedShow] =
    useState<ShowItem | null>(null);

  const [
    selectedProduction,
    setSelectedProduction,
  ] = useState<ProductionResponse | null>(
    null,
  );

  const [
    showCreateModal,
    setShowCreateModal,
  ] = useState(false);

  const [showFilter, setShowFilter] =
    useState(false);

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState<
    "all" | "low" | "medium" | "high" | "critical"
  >("all");

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showTeamModal, setShowTeamModal] =
    useState(false);

  /* =======================================================
     LOAD PRODUCTIONS
  ======================================================= */

  const loadProductions =
    async (): Promise<void> => {
      setError(null);

      try {
        const results =
          await Promise.allSettled(
            shows.map(async (show) => {
              const backendShowId =
                getBackendShowId(show.id);

              if (!backendShowId) {
                return null;
              }

              try {
                const response =
                  await apiRequest<
                    ProductionResponse[]
                  >(
                    `/api/productions/show/${backendShowId}`,
                  );

                if (
                  !response ||
                  response.length === 0
                ) {
                  return null;
                }

                return {
                  showId: backendShowId,
                  production:
                    response[
                      response.length - 1
                    ],
                };
              } catch {
                /*
                 * One show failing should NOT break
                 * the entire production board.
                 */
                return null;
              }
            }),
          );

        const map: Record<
          number,
          ProductionResponse
        > = {};

        results.forEach((result) => {
          if (
            result.status ===
              "fulfilled" &&
            result.value
          ) {
            map[result.value.showId] =
              result.value.production;
          }
        });

        setProductionMap(map);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load productions.",
        );
      }
    };

  /* =======================================================
     REFRESH
  ======================================================= */

  const refreshProductions =
    async (): Promise<void> => {
      setRefreshing(true);

      try {
        await loadProductions();
      } finally {
        setRefreshing(false);
      }
    };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;

      setLoading(true);

      try {
        await loadProductions();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredShows = useMemo(() => {
    if (selectedFilter === "all") {
      return shows;
    }

    return shows.filter(
      (show) =>
        show.priority === selectedFilter,
    );
  }, [selectedFilter]);

  /* =======================================================
     OPEN PRODUCTION
  ======================================================= */

  const openProduction = async (
    show: ShowItem,
  ): Promise<void> => {
    setSelectedShow(show);

    const backendShowId =
      getBackendShowId(show.id);

    if (!backendShowId) {
      setSelectedProduction(null);
      return;
    }

    const existing =
      productionMap[backendShowId];

    if (existing) {
      setSelectedProduction(existing);
      return;
    }

    try {
      const response =
        await apiRequest<
          ProductionResponse[]
        >(
          `/api/productions/show/${backendShowId}`,
        );

      if (
        response &&
        response.length > 0
      ) {
        setSelectedProduction(
          response[response.length - 1],
        );
      } else {
        setSelectedProduction(null);
      }
    } catch {
      setSelectedProduction(null);
    }
  };

  /* =======================================================
     DELETE PRODUCTION
  ======================================================= */

  const deleteProduction =
    async (): Promise<void> => {
      if (!selectedProduction) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete production #${selectedProduction.productionId}?`,
        );

      if (!confirmed) {
        return;
      }

      try {
        await apiRequest(
          `/api/productions/${selectedProduction.productionId}`,
          {
            method: "DELETE",
          },
        );

        setSelectedProduction(null);
        setShowEditModal(false);

        await refreshProductions();
      } catch (err) {
        alert(
          err instanceof Error
            ? err.message
            : "Failed to delete production.",
        );
      }
    };

  return (
    <DashboardLayout>
      <PageHeader
        title="Production Board"
        description="Track productions from planning to release."
        actions={
          <>
            {/* FILTER */}

            <button
              type="button"
              onClick={() =>
                setShowFilter(
                  (value) => !value,
                )
              }
              className={`h-10 px-3 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition ${
                showFilter
                  ? "bg-accent"
                  : ""
              }`}
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>

            {/* REFRESH */}

            <button
              type="button"
              onClick={
                refreshProductions
              }
              disabled={refreshing}
              className="h-10 px-3 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition disabled:opacity-50"
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

            {/* ADD */}

            <button
              type="button"
              onClick={() =>
                setShowCreateModal(
                  true,
                )
              }
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition shadow-[var(--shadow-glow)]"
            >
              <Plus className="h-4 w-4" />
              Add Production
            </button>
          </>
        }
      />

      {/* =====================================================
          FILTER PANEL
      ===================================================== */}

      {showFilter && (
        <Card className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium mr-2">
              Priority
            </span>

            {(
              [
                "all",
                "low",
                "medium",
                "high",
                "critical",
              ] as const
            ).map((priority) => (
              <button
                type="button"
                key={priority}
                onClick={() =>
                  setSelectedFilter(
                    priority,
                  )
                }
                className={`h-8 px-3 rounded-lg text-xs capitalize border transition ${
                  selectedFilter ===
                  priority
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div className="min-h-[500px] grid place-items-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />

            <p className="mt-3 text-sm text-muted-foreground">
              Loading productions...
            </p>
          </div>
        </div>
      ) : (
        /* ===================================================
           KANBAN BOARD
        =================================================== */

        <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-4 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
          {columns.map((col) => {
            const items =
              filteredShows.filter(
                (show) => {
                  const backendShowId =
                    getBackendShowId(
                      show.id,
                    );

                  const production =
                    backendShowId
                      ? productionMap[
                          backendShowId
                        ]
                      : undefined;

                  const stage =
                    production
                      ? statusToStage[
                          production
                            .productionStatus
                        ]
                      : show.stage;

                  return (
                    stage === col.id
                  );
                },
              );

            return (
              <div
                key={col.id}
                className="w-80 shrink-0"
              >
                {/* COLUMN HEADER */}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${col.accent}`}
                    />

                    <div className="text-sm font-semibold">
                      {col.label}
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {items.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowCreateModal(
                        true,
                      )
                    }
                    className="h-7 w-7 grid place-items-center rounded-lg hover:bg-accent transition text-muted-foreground"
                    title={`Add ${col.label}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* CARDS */}

                <div className="space-y-3">
                  {items.map((show) => {
                    const backendShowId =
                      getBackendShowId(
                        show.id,
                      );

                    const production =
                      backendShowId
                        ? productionMap[
                            backendShowId
                          ]
                        : undefined;

                    const progress =
                      production
                        ? getStatusProgress(
                            production.productionStatus,
                          )
                        : show.progress;

                    /*
                     * IMPORTANT:
                     *
                     * Do NOT put onClick directly
                     * on <Card>.
                     *
                     * Card does not accept onClick.
                     *
                     * The wrapper div handles
                     * the click.
                     */

                    return (
                      <div
                        key={show.id}
                        onClick={() =>
                          void openProduction(
                            show,
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                              "Enter" ||
                            event.key ===
                              " "
                          ) {
                            event.preventDefault();

                            void openProduction(
                              show,
                            );
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer"
                      >
                        <Card className="card-hover !p-0 overflow-hidden">
                          {/* POSTER */}

                          <div className="relative h-28">
                            <img
                              src={show.poster}
                              alt={show.title}
                              className="absolute inset-0 h-full w-full object-cover"
                            />

                            <div
                              className="absolute inset-0"
                              style={{
                                background:
                                  "linear-gradient(180deg, transparent 40%, oklch(0.14 0 0 / 0.9))",
                              }}
                            />

                            {/* PRIORITY */}

                            <div className="absolute top-2 left-2">
                              <Chip
                                variant={
                                  priorityVariant[
                                    show.priority
                                  ]
                                }
                              >
                                {
                                  show.priority
                                }
                              </Chip>
                            </div>

                            {/* API */}

                            {production && (
                              <div className="absolute top-2 right-2">
                                <Chip variant="success">
                                  API
                                </Chip>
                              </div>
                            )}

                            {/* TITLE */}

                            <div className="absolute bottom-2 left-3 right-3">
                              <div className="text-sm font-bold truncate">
                                {show.title}
                              </div>

                              <div className="text-[11px] text-muted-foreground truncate">
                                {show.creator}
                              </div>
                            </div>
                          </div>

                          {/* CARD BODY */}

                          <div className="p-4 space-y-3">
                            {/* STATUS */}

                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-muted-foreground">
                                Status
                              </span>

                              <Chip
                                variant={
                                  production
                                    ? "primary"
                                    : "default"
                                }
                              >
                                {production
                                  ? statusLabels[
                                      production
                                        .productionStatus
                                    ]
                                  : col.label}
                              </Chip>
                            </div>

                            {/* PROGRESS */}

                            <div>
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="text-muted-foreground">
                                  Progress
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

                            {/* TEAM + DEADLINE */}

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {show.team} crew
                              </div>

                              <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                                <Calendar className="h-3 w-3" />

                                {new Date(
                                  show.deadline,
                                ).toLocaleDateString(
                                  "en",
                                  {
                                    month:
                                      "short",
                                    day: "numeric",
                                  },
                                )}
                              </div>
                            </div>

                            {/* BUDGET */}

                            <div className="flex items-center justify-between pt-2 border-t border-border">
                              <div className="text-xs text-muted-foreground">
                                Budget
                              </div>

                              <div className="text-xs font-semibold">
                                {production
                                  ? formatCurrency(
                                      Number(
                                        production.allocatedBudget ??
                                          0,
                                      ),
                                    )
                                  : formatCurrency(
                                      show.budget,
                                    )}
                              </div>
                            </div>

                            {/* PRODUCTION ID */}

                            {production && (
                              <div className="text-[10px] text-muted-foreground">
                                Production #
                                {
                                  production.productionId
                                }
                              </div>
                            )}
                          </div>
                        </Card>
                      </div>
                    );
                  })}

                  {/* EMPTY */}

                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center">
                      <Clapperboard className="h-6 w-6 mx-auto text-muted-foreground mb-2" />

                      <div className="text-xs text-muted-foreground">
                        No productions here
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================
          CREATE MODAL
      ===================================================== */}

      {showCreateModal && (
        <CreateProductionModal
          onClose={() =>
            setShowCreateModal(
              false,
            )
          }
          onCreated={async () => {
            setShowCreateModal(false);
            await refreshProductions();
          }}
        />
      )}

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedShow && (
        <ProductionDetailsModal
          show={selectedShow}
          production={selectedProduction}
          onClose={() => {
            setSelectedShow(null);
            setSelectedProduction(
              null,
            );
          }}
          onEdit={() =>
            setShowEditModal(true)
          }
          onTeam={() =>
            setShowTeamModal(true)
          }
          onDelete={
            deleteProduction
          }
        />
      )}

      {/* =====================================================
          EDIT MODAL
      ===================================================== */}

      {showEditModal &&
        selectedProduction && (
          <EditProductionModal
            production={
              selectedProduction
            }
            show={selectedShow}
            onClose={() =>
              setShowEditModal(false)
            }
            onUpdated={async () => {
              setShowEditModal(false);

              await refreshProductions();

              if (selectedShow) {
                await openProduction(
                  selectedShow,
                );
              }
            }}
          />
        )}

      {/* =====================================================
          TEAM MODAL
      ===================================================== */}

      {showTeamModal &&
        selectedProduction && (
          <TeamModal
            productionId={
              selectedProduction.productionId
            }
            onClose={() =>
              setShowTeamModal(false)
            }
          />
        )}
    </DashboardLayout>
  );
}

/* =========================================================
   CREATE PRODUCTION MODAL
========================================================= */

function CreateProductionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] =
    useState<ProductionRequest>({
      showId: 0,
      producerId: 0,
      productionStatus: "PLANNING",
      allocatedBudget: null,
      actualBudget: null,
      startDate: null,
      expectedEndDate: null,
      completionDate: null,
      notes: "",
    });

  const [saving, setSaving] =
    useState(false);

  const submit = async () => {
    if (
      form.showId <= 0 ||
      form.producerId <= 0
    ) {
      alert(
        "Show ID and Producer ID are required.",
      );
      return;
    }

    setSaving(true);

    try {
      await apiRequest(
        "/api/productions",
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );

      await onCreated();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to create production.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create Production"
      onClose={onClose}
    >
      <ProductionForm
        form={form}
        setForm={setForm}
      />

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-4 rounded-xl border border-border text-sm hover:bg-accent transition"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          Create Production
        </button>
      </div>
    </Modal>
  );
}

/* =========================================================
   EDIT PRODUCTION MODAL
========================================================= */

function EditProductionModal({
  production,
  show,
  onClose,
  onUpdated,
}: {
  production: ProductionResponse;
  show: ShowItem | null;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const showId =
    show
      ? getBackendShowId(show.id)
      : null;

  const [form, setForm] =
    useState<ProductionRequest>({
      showId: showId ?? 0,

      /*
       * Backend ProductionRequest currently requires
       * producerId. Since ProductionResponse does not
       * expose producerId, keep this editable.
       */
      producerId: 0,

      productionStatus:
        production.productionStatus,

      allocatedBudget:
        production.allocatedBudget !== null
          ? Number(
              production.allocatedBudget,
            )
          : null,

      actualBudget:
        production.actualBudget !== null
          ? Number(
              production.actualBudget,
            )
          : null,

      startDate: null,
      expectedEndDate: null,
      completionDate: null,

      notes:
        production.notes ?? "",
    });

  const [saving, setSaving] =
    useState(false);

  const submit = async () => {
    if (
      form.showId <= 0 ||
      form.producerId <= 0
    ) {
      alert(
        "Show ID and Producer ID are required.",
      );
      return;
    }

    setSaving(true);

    try {
      await apiRequest(
        `/api/productions/${production.productionId}`,
        {
          method: "PUT",
          body: JSON.stringify(form),
        },
      );

      await onUpdated();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to update production.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Edit Production #${production.productionId}`}
      onClose={onClose}
    >
      <ProductionForm
        form={form}
        setForm={setForm}
      />

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-4 rounded-xl border border-border text-sm hover:bg-accent transition"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          Update Production
        </button>
      </div>
    </Modal>
  );
}

/* =========================================================
   PRODUCTION DETAILS MODAL
========================================================= */

function ProductionDetailsModal({
  show,
  production,
  onClose,
  onEdit,
  onTeam,
  onDelete,
}: {
  show: ShowItem;
  production: ProductionResponse | null;
  onClose: () => void;
  onEdit: () => void;
  onTeam: () => void;
  onDelete: () => Promise<void>;
}) {
  const progress = production
    ? getStatusProgress(
        production.productionStatus,
      )
    : show.progress;

  return (
    <Modal
      title={show.title}
      onClose={onClose}
      wide
    >
      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-6">
        {/* POSTER */}

        <div>
          <img
            src={show.poster}
            alt={show.title}
            className="w-full aspect-[2/3] object-cover rounded-xl"
          />
        </div>

        {/* DETAILS */}

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip
              variant={
                production
                  ? "primary"
                  : "default"
              }
            >
              {production
                ? statusLabels[
                    production
                      .productionStatus
                  ]
                : "Not Created"}
            </Chip>

            <Chip>
              {show.genre}
            </Chip>

            <Chip>
              {show.language}
            </Chip>
          </div>

          <h2 className="text-2xl font-bold mt-4">
            {show.title}
          </h2>

          <p className="text-sm text-muted-foreground mt-2">
            {show.description}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <InfoBox
              label="Creator"
              value={show.creator}
            />

            <InfoBox
              label="Episodes"
              value={String(
                show.episodes,
              )}
            />

            <InfoBox
              label="Budget"
              value={
                production
                  ? formatCurrency(
                      Number(
                        production.allocatedBudget ??
                          0,
                      ),
                    )
                  : formatCurrency(
                      show.budget,
                    )
              }
            />

            <InfoBox
              label="Production"
              value={
                production
                  ? `#${production.productionId}`
                  : "Not created"
              }
            />
          </div>

          {/* PROGRESS */}

          <div className="mt-6">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-muted-foreground">
                Production progress
              </span>

              <span className="font-semibold">
                {progress}%
              </span>
            </div>

            <Progress value={progress} />
          </div>

          {/* NOTES */}

          {production?.notes && (
            <div className="mt-5 rounded-xl border border-border p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Production Notes
              </div>

              <p className="text-sm mt-2 whitespace-pre-wrap">
                {production.notes}
              </p>
            </div>
          )}

          {/* ACTIONS */}

          <div className="mt-6 flex flex-wrap gap-2">
            {production ? (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={onTeam}
                  className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition"
                >
                  <Users className="h-4 w-4" />
                  Manage Team
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void onDelete()
                  }
                  className="h-10 px-4 rounded-xl border border-destructive/30 text-destructive text-sm inline-flex items-center gap-2 hover:bg-destructive/10 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition"
              >
                <Plus className="h-4 w-4" />
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* =========================================================
   TEAM MODAL
========================================================= */

function TeamModal({
  productionId,
  onClose,
}: {
  productionId: number;
  onClose: () => void;
}) {
  const [team, setTeam] =
    useState<ProductionTeamResponse[]>(
      [],
    );

  const [userId, setUserId] =
    useState("");

  const [role, setRole] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const loadTeam = async () => {
    setLoading(true);

    try {
      const response =
        await apiRequest<
          ProductionTeamResponse[]
        >(
          `/api/production-team/${productionId}`,
        );

      setTeam(response ?? []);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to load team.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTeam();
  }, [productionId]);

  const assign = async () => {
    const numericUserId =
      Number(userId);

    if (
      !Number.isInteger(
        numericUserId,
      ) ||
      numericUserId <= 0
    ) {
      alert("Enter a valid user ID.");
      return;
    }

    if (!role.trim()) {
      alert("Enter a role.");
      return;
    }

    setSaving(true);

    try {
      await apiRequest(
        `/api/production-team/${productionId}/assign/${numericUserId}?role=${encodeURIComponent(
          role.trim(),
        )}`,
        {
          method: "POST",
        },
      );

      setUserId("");
      setRole("");

      await loadTeam();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to assign member.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (
    teamId: number,
  ) => {
    const confirmed =
      window.confirm(
        "Remove this member?",
      );

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(
        `/api/production-team/${teamId}`,
        {
          method: "DELETE",
        },
      );

      await loadTeam();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to remove member.",
      );
    }
  };

  return (
    <Modal
      title={`Production Team #${productionId}`}
      onClose={onClose}
    >
      {/* ADD MEMBER */}

      <div className="grid md:grid-cols-[160px_1fr_auto] gap-2 mb-5">
        <input
          type="number"
          min="1"
          value={userId}
          onChange={(e) =>
            setUserId(e.target.value)
          }
          placeholder="User ID"
          className="input-style"
        />

        <input
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
          placeholder="Role e.g. Director"
          className="input-style"
        />

        <button
          type="button"
          onClick={assign}
          disabled={saving}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}

          Assign
        </button>
      </div>

      {/* TEAM */}

      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      ) : team.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Users className="h-7 w-7 mx-auto text-muted-foreground" />

          <p className="text-sm mt-2">
            No team members assigned.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {team.map((member) => (
            <div
              key={member.teamId}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center">
                <Users className="h-4 w-4" />
              </div>

              <div className="flex-1">
                <div className="text-sm font-medium">
                  User #{member.userId}
                </div>

                <div className="text-xs text-muted-foreground">
                  {member.role}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void remove(
                    member.teamId,
                  )
                }
                className="h-8 w-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Remove member"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* =========================================================
   PRODUCTION FORM
========================================================= */

function ProductionForm({
  form,
  setForm,
}: {
  form: ProductionRequest;
  setForm: Dispatch<
    SetStateAction<ProductionRequest>
  >;
}) {
  const update = (
    changes: Partial<ProductionRequest>,
  ) => {
    setForm((previous) => ({
      ...previous,
      ...changes,
    }));
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* SHOW ID */}

      <FormField
        label="Show ID"
        required
      >
        <input
          type="number"
          min="1"
          value={
            form.showId || ""
          }
          onChange={(e) =>
            update({
              showId: Number(
                e.target.value,
              ),
            })
          }
          placeholder="Show ID"
          className="input-style"
        />
      </FormField>

      {/* PRODUCER ID */}

      <FormField
        label="Producer ID"
        required
      >
        <input
          type="number"
          min="1"
          value={
            form.producerId || ""
          }
          onChange={(e) =>
            update({
              producerId: Number(
                e.target.value,
              ),
            })
          }
          placeholder="Producer ID"
          className="input-style"
        />
      </FormField>

      {/* STATUS */}

      <FormField
        label="Production Status"
        required
      >
        <div className="relative">
          <select
            value={
              form.productionStatus
            }
            onChange={(e) =>
              update({
                productionStatus:
                  e.target.value as ProductionStatus,
              })
            }
            className="input-style appearance-none pr-10"
          >
            <option value="PLANNING">
              Planning
            </option>

            <option value="PRE_PRODUCTION">
              Pre-Production
            </option>

            <option value="SHOOTING">
              Shooting
            </option>

            <option value="POST_PRODUCTION">
              Post-Production
            </option>

            <option value="COMPLETED">
              Completed
            </option>
          </select>

          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </FormField>

      {/* ALLOCATED */}

      <FormField label="Allocated Budget">
        <input
          type="number"
          min="0"
          step="0.01"
          value={
            form.allocatedBudget ??
            ""
          }
          onChange={(e) =>
            update({
              allocatedBudget:
                e.target.value
                  ? Number(
                      e.target.value,
                    )
                  : null,
            })
          }
          placeholder="12000000"
          className="input-style"
        />
      </FormField>

      {/* ACTUAL */}

      <FormField label="Actual Budget">
        <input
          type="number"
          min="0"
          step="0.01"
          value={
            form.actualBudget ??
            ""
          }
          onChange={(e) =>
            update({
              actualBudget:
                e.target.value
                  ? Number(
                      e.target.value,
                    )
                  : null,
            })
          }
          placeholder="8000000"
          className="input-style"
        />
      </FormField>

      {/* START */}

      <FormField label="Start Date">
        <input
          type="date"
          value={
            form.startDate ?? ""
          }
          onChange={(e) =>
            update({
              startDate:
                e.target.value ||
                null,
            })
          }
          className="input-style"
        />
      </FormField>

      {/* END */}

      <FormField label="Expected End Date">
        <input
          type="date"
          value={
            form.expectedEndDate ??
            ""
          }
          onChange={(e) =>
            update({
              expectedEndDate:
                e.target.value ||
                null,
            })
          }
          className="input-style"
        />
      </FormField>

      {/* COMPLETION */}

      <FormField label="Completion Date">
        <input
          type="date"
          value={
            form.completionDate ??
            ""
          }
          onChange={(e) =>
            update({
              completionDate:
                e.target.value ||
                null,
            })
          }
          className="input-style"
        />
      </FormField>

      {/* NOTES */}

      <div className="md:col-span-2">
        <FormField label="Production Notes">
          <textarea
            rows={4}
            maxLength={2000}
            value={form.notes}
            onChange={(e) =>
              update({
                notes: e.target.value,
              })
            }
            placeholder="Production notes..."
            className="input-style h-auto py-3 resize-y"
          />

          <div className="text-right text-[10px] text-muted-foreground mt-1">
            {form.notes.length}/2000
          </div>
        </FormField>
      </div>
    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
        {label}

        {required && (
          <span className="text-destructive ml-1">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold truncate">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* BACKDROP */}

      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close modal"
      />

      {/* MODAL */}

      <div
        className={`relative w-full ${
          wide
            ? "max-w-5xl"
            : "max-w-3xl"
        } max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl`}
      >
        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur">
          <h2 className="text-lg font-semibold">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-lg grid place-items-center hover:bg-accent transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* CONTENT */}

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
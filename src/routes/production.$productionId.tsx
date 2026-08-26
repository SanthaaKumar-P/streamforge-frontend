import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clapperboard,
  Coins,
  Loader2,
  Pencil,
  Save,
  Trash2,
  UserPlus,
  Users,
  X,
  UserRound,
} from "lucide-react";

import { DashboardLayout, PageHeader } from "@/components/layout/DashboardLayout";
import { Card, Chip, Progress } from "@/components/ui-kit";
import { apiRequest } from "@/lib/mock-data";

type ProductionStatus =
  | "PLANNING"
  | "PRE_PRODUCTION"
  | "SHOOTING"
  | "POST_PRODUCTION"
  | "COMPLETED";

interface ProductionResponse {
  productionId: number;
  showId: number;
  producerId: number;
  productionStatus: ProductionStatus;
  allocatedBudget: number | string | null;
  actualBudget: number | string | null;
  startDate: string | null;
  expectedEndDate: string | null;
  completionDate: string | null;
  notes: string | null;
}

interface ShowResponse {
  showId: number;
  title: string;
  description: string | null;
  synopsis: string | null;
  language: string | null;
  targetAudience: string | null;
  estimatedBudget: number | string | null;
  expectedReleaseDate: string | null;
  status: string;
  creator?: {
    userId?: number;
    fullName?: string;
    username?: string;
    name?: string;
  } | null;
}

interface ProductionTeamResponse {
  teamId: number;
  role: string;
  productionId: number;
  userId: number;
}

interface UserResponse {
  userId: number;
  fullName?: string;
  username?: string;
  name?: string;
}

const statusLabels: Record<ProductionStatus, string> = {
  PLANNING: "Planning",
  PRE_PRODUCTION: "Pre-Production",
  SHOOTING: "Shooting",
  POST_PRODUCTION: "Post-Production",
  COMPLETED: "Completed",
};

const statusVariant: Record<
  ProductionStatus,
  "info" | "warning" | "primary" | "success"
> = {
  PLANNING: "info",
  PRE_PRODUCTION: "warning",
  SHOOTING: "primary",
  POST_PRODUCTION: "primary",
  COMPLETED: "success",
};

const statusProgress: Record<ProductionStatus, number> = {
  PLANNING: 15,
  PRE_PRODUCTION: 35,
  SHOOTING: 60,
  POST_PRODUCTION: 85,
  COMPLETED: 100,
};

export const Route = createFileRoute("/production/$productionId")({
  loader: async ({ params }) => {
    const productionId = Number(params.productionId);

    if (!Number.isFinite(productionId)) {
      throw notFound();
    }

    return { productionId };
  },

  head: () => ({
    meta: [
      {
        title: "Production Details — Netflix Show Manager",
      },
      {
        name: "description",
        content:
          "View and manage production details, budget, status and production team.",
      },
    ],
  }),

  component: ProductionDetails,
});

function getUserName(user?: UserResponse | null) {
  if (!user) return "Unknown user";

  return (
    user.fullName ??
    user.name ??
    user.username ??
    `User #${user.userId}`
  );
}

function getCreatorName(show?: ShowResponse | null) {
  if (!show?.creator) return "Unknown creator";

  return (
    show.creator.fullName ??
    show.creator.name ??
    show.creator.username ??
    "Unknown creator"
  );
}

function getBudget(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "$0";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0";
  }

  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }

  if (amount >= 1_000) {
    return `$${Math.round(amount / 1_000)}K`;
  }

  return `$${amount.toLocaleString()}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function ProductionDetails() {
  const { productionId } = Route.useLoaderData();
  const navigate = useNavigate();

  const [production, setProduction] =
    useState<ProductionResponse | null>(null);

  const [show, setShow] =
    useState<ShowResponse | null>(null);

  const [team, setTeam] =
    useState<ProductionTeamResponse[]>([]);

  const [users, setUsers] =
    useState<UserResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(false);

  const [status, setStatus] =
    useState<ProductionStatus>("PLANNING");

  const [allocatedBudget, setAllocatedBudget] =
    useState("");

  const [actualBudget, setActualBudget] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [expectedEndDate, setExpectedEndDate] =
    useState("");

  const [completionDate, setCompletionDate] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [selectedUserId, setSelectedUserId] =
    useState("");

  const [teamRole, setTeamRole] =
    useState("");

  const [assigning, setAssigning] =
    useState(false);

  const [removingTeamId, setRemovingTeamId] =
    useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const productionData =
          await apiRequest<ProductionResponse>(
            `/api/productions/${productionId}`
          );

        if (!mounted) return;

        setProduction(productionData);

        setStatus(productionData.productionStatus);
        setAllocatedBudget(
          productionData.allocatedBudget?.toString() ?? ""
        );
        setActualBudget(
          productionData.actualBudget?.toString() ?? ""
        );
        setStartDate(productionData.startDate ?? "");
        setExpectedEndDate(
          productionData.expectedEndDate ?? ""
        );
        setCompletionDate(
          productionData.completionDate ?? ""
        );
        setNotes(productionData.notes ?? "");

        const [showData, teamData] =
          await Promise.all([
            apiRequest<ShowResponse>(
              `/api/shows/${productionData.showId}`
            ),
            apiRequest<ProductionTeamResponse[]>(
              `/api/production-team/${productionId}`
            ),
          ]);

        if (!mounted) return;

        setShow(showData);
        setTeam(teamData);
      } catch (err) {
        if (!mounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load production."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [productionId]);

  const progress = useMemo(() => {
    if (!production) return 0;

    return statusProgress[production.productionStatus] ?? 0;
  }, [production]);

  async function saveProduction() {
    if (!production) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        showId: production.showId,
        producerId: production.producerId,
        productionStatus: status,
        allocatedBudget:
          allocatedBudget === ""
            ? null
            : Number(allocatedBudget),
        actualBudget:
          actualBudget === ""
            ? null
            : Number(actualBudget),
        startDate: startDate || null,
        expectedEndDate: expectedEndDate || null,
        completionDate: completionDate || null,
        notes: notes.trim() || null,
      };

      const updated =
        await apiRequest<ProductionResponse>(
          `/api/productions/${productionId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

      setProduction(updated);
      setStatus(updated.productionStatus);

      setAllocatedBudget(
        updated.allocatedBudget?.toString() ?? ""
      );

      setActualBudget(
        updated.actualBudget?.toString() ?? ""
      );

      setStartDate(updated.startDate ?? "");
      setExpectedEndDate(updated.expectedEndDate ?? "");
      setCompletionDate(updated.completionDate ?? "");
      setNotes(updated.notes ?? "");

      setEditing(false);
      setSuccess("Production updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update production."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduction() {
    if (!production) return;

    const confirmed = window.confirm(
      `Delete this production permanently?`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      await apiRequest(
        `/api/productions/${productionId}`,
        {
          method: "DELETE",
        }
      );

      navigate({
        to: "/production",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete production."
      );
      setDeleting(false);
    }
  }

  async function assignMember() {
    if (!selectedUserId || !teamRole.trim()) {
      setError("Select a user and enter a role.");
      return;
    }

    try {
      setAssigning(true);
      setError("");
      setSuccess("");

      const created =
        await apiRequest<ProductionTeamResponse>(
          `/api/production-team/${productionId}/assign/${selectedUserId}?role=${encodeURIComponent(
            teamRole.trim()
          )}`,
          {
            method: "POST",
          }
        );

      setTeam((current) => [...current, created]);

      setSelectedUserId("");
      setTeamRole("");

      setSuccess("Team member assigned successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to assign team member."
      );
    } finally {
      setAssigning(false);
    }
  }

  async function removeMember(teamId: number) {
    const confirmed = window.confirm(
      "Remove this member from the production team?"
    );

    if (!confirmed) return;

    try {
      setRemovingTeamId(teamId);
      setError("");
      setSuccess("");

      await apiRequest(
        `/api/production-team/${teamId}`,
        {
          method: "DELETE",
        }
      );

      setTeam((current) =>
        current.filter((member) => member.teamId !== teamId)
      );

      setSuccess("Team member removed successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove team member."
      );
    } finally {
      setRemovingTeamId(null);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading production...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!production) {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-lg font-semibold">
            Production not found
          </div>

          <button
            onClick={() =>
              navigate({
                to: "/production",
              })
            }
            className="mt-4 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Back to production
          </button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link
            to="/production"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to production
          </Link>

          <PageHeader
            title={show?.title ?? `Production #${productionId}`}
            description="View and manage production progress, budget and team."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                )}

                <button
                  onClick={deleteProduction}
                  disabled={deleting}
                  className="h-10 px-4 rounded-xl border border-destructive/40 text-destructive text-sm inline-flex items-center gap-2 hover:bg-destructive/10 transition disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>
              </div>
            }
          />
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-success/40 bg-success/10 text-success px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* Production overview */}
        <Card className="!p-0 overflow-hidden">
          <div className="relative overflow-hidden p-6 md:p-8">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 80% 20%, oklch(0.30 0.12 25 / 0.28), transparent 45%)",
              }}
            />

            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Chip
                  variant={
                    statusVariant[production.productionStatus]
                  }
                >
                  {
                    statusLabels[
                      production.productionStatus
                    ]
                  }
                </Chip>

                {show?.language && (
                  <Chip>{show.language}</Chip>
                )}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold">
                {show?.title ?? `Production #${productionId}`}
              </h2>

              <p className="text-sm text-muted-foreground mt-1">
                Production ID: #{production.productionId}
              </p>

              {show?.synopsis && (
                <p className="mt-5 max-w-3xl text-sm text-muted-foreground">
                  {show.synopsis}
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-4 border-t border-border">
            <InfoBox
              icon={<UserRound className="h-4 w-4" />}
              label="Creator"
              value={getCreatorName(show)}
            />

            <InfoBox
              icon={<Clapperboard className="h-4 w-4" />}
              label="Producer ID"
              value={`#${production.producerId}`}
            />

            <InfoBox
              icon={<CalendarDays className="h-4 w-4" />}
              label="Expected End"
              value={formatDate(production.expectedEndDate)}
            />

            <InfoBox
              icon={<Coins className="h-4 w-4" />}
              label="Allocated Budget"
              value={getBudget(production.allocatedBudget)}
            />
          </div>
        </Card>

        {/* Progress */}
        <Card>
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <div className="text-sm font-semibold">
                Production progress
              </div>

              <div className="text-xs text-muted-foreground mt-1">
                Current stage:{" "}
                {statusLabels[production.productionStatus]}
              </div>
            </div>

            <div className="text-2xl font-bold">
              {progress}%
            </div>
          </div>

          <Progress value={progress} />
        </Card>

        {/* Edit form */}
        {editing && (
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Pencil className="h-4 w-4 text-primary" />
              <div className="text-lg font-semibold">
                Edit production
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Production status">
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as ProductionStatus
                    )
                  }
                  className="input"
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
              </Field>

              <Field label="Allocated budget">
                <input
                  type="number"
                  min="0"
                  value={allocatedBudget}
                  onChange={(e) =>
                    setAllocatedBudget(e.target.value)
                  }
                  className="input"
                  placeholder="10000000"
                />
              </Field>

              <Field label="Actual budget">
                <input
                  type="number"
                  min="0"
                  value={actualBudget}
                  onChange={(e) =>
                    setActualBudget(e.target.value)
                  }
                  className="input"
                  placeholder="5000000"
                />
              </Field>

              <Field label="Start date">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) =>
                    setStartDate(e.target.value)
                  }
                  className="input"
                />
              </Field>

              <Field label="Expected end date">
                <input
                  type="date"
                  value={expectedEndDate}
                  onChange={(e) =>
                    setExpectedEndDate(e.target.value)
                  }
                  className="input"
                />
              </Field>

              <Field label="Completion date">
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) =>
                    setCompletionDate(e.target.value)
                  }
                  className="input"
                />
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Production notes">
                <textarea
                  rows={5}
                  value={notes}
                  maxLength={2000}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  className="input resize-none"
                  placeholder="Add production notes..."
                />

                <div className="text-right text-xs text-muted-foreground mt-1">
                  {notes.length}/2000
                </div>
              </Field>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={saveProduction}
                disabled={saving}
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
          {/* Budget */}
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold mb-5">
              <Coins className="h-4 w-4 text-primary" />
              Budget overview
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Metric
                label="Allocated"
                value={getBudget(
                  production.allocatedBudget
                )}
              />

              <Metric
                label="Actual"
                value={getBudget(
                  production.actualBudget
                )}
              />

              <Metric
                label="Remaining"
                value={getBudget(
                  Number(
                    production.allocatedBudget ?? 0
                  ) -
                    Number(
                      production.actualBudget ?? 0
                    )
                )}
              />
            </div>
          </Card>

          {/* Dates */}
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold mb-5">
              <CalendarDays className="h-4 w-4 text-primary" />
              Production dates
            </div>

            <div className="space-y-4">
              <DateRow
                label="Start date"
                value={formatDate(production.startDate)}
              />

              <DateRow
                label="Expected end"
                value={formatDate(
                  production.expectedEndDate
                )}
              />

              <DateRow
                label="Completion"
                value={formatDate(
                  production.completionDate
                )}
              />
            </div>
          </Card>
        </div>

        {/* Team */}
        <Card>
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5 text-primary" />
                Production team
              </div>

              <div className="text-xs text-muted-foreground mt-1">
                {team.length} assigned member
                {team.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_1fr_auto] gap-3 mb-6">
            <input
              value={selectedUserId}
              onChange={(e) =>
                setSelectedUserId(e.target.value)
              }
              placeholder="User ID"
              className="input"
            />

            <input
              value={teamRole}
              onChange={(e) =>
                setTeamRole(e.target.value)
              }
              placeholder="Role — Director, Editor..."
              className="input"
            />

            <button
              onClick={assignMember}
              disabled={assigning}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {assigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Assign
            </button>
          </div>

          {team.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No team members assigned yet.
            </div>
          ) : (
            <div className="space-y-2">
              {team.map((member) => (
                <div
                  key={member.teamId}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center">
                      <UserRound className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        User #{member.userId}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {member.role}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      removeMember(member.teamId)
                    }
                    disabled={
                      removingTeamId === member.teamId
                    }
                    className="h-9 w-9 shrink-0 grid place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition disabled:opacity-50"
                    title="Remove member"
                  >
                    {removingTeamId === member.teamId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notes */}
        {production.notes && (
          <Card>
            <div className="text-sm font-semibold mb-3">
              Production notes
            </div>

            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {production.notes}
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function InfoBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-5 border-r border-border last:border-r-0">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>

      <div className="mt-2 text-sm font-semibold truncate">
        {value}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="text-xs text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 text-xl font-bold">
        {value}
      </div>
    </div>
  );
}

function DateRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </div>

      {children}
    </label>
  );
}
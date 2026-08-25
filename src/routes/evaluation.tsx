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
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Languages,
  Loader2,
  MessageSquare,
  RotateCcw,
  Save,
  Star,
  User,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiRequest } from "@/lib/mock-data";

/* =========================================================
   TYPES
========================================================= */

type EvaluationDecision =
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUIRED";

type UserResponse = {
  userId?: number;
  id?: number;
  username?: string;
  fullName?: string;
  name?: string;
  email?: string;
};

type ShowResponse = {
  showId: number;
  title: string;
  description?: string | null;
  synopsis?: string | null;
  language?: string | null;
  targetAudience?: string | null;
  estimatedBudget?: number | string | null;
  expectedReleaseDate?: string | null;
  status?: string | null;
  creator?: UserResponse | null;
};

type EvaluationResponse = {
  evaluationId: number;
  originalityScore: number;
  creativityScore: number;
  marketPotentialScore: number;
  feasibilityScore: number;
  overallScore: number;
  decision: EvaluationDecision;
  remarks?: string | null;
};

type EvaluationScores = {
  originality: number;
  creativity: number;
  marketPotential: number;
  feasibility: number;
};

type CriterionKey = keyof EvaluationScores;

type CurrentUser = {
  userId?: number;
  id?: number;
  username?: string;
  fullName?: string;
  name?: string;
  email?: string;
};

/* =========================================================
   ROUTE
========================================================= */

export const Route = createFileRoute("/evaluation")({
  head: () => ({
    meta: [
      {
        title: "Evaluation — Netflix Show Manager",
      },
      {
        name: "description",
        content:
          "Evaluate submitted shows across originality, creativity, market potential and feasibility.",
      },
    ],
  }),

  component: Evaluation,
});

/* =========================================================
   CRITERIA
========================================================= */

const criteria: {
  key: CriterionKey;
  label: string;
  description: string;
}[] = [
  {
    key: "originality",
    label: "Originality",
    description:
      "Uniqueness and freshness of the concept.",
  },
  {
    key: "creativity",
    label: "Creativity",
    description:
      "Creative strength and storytelling potential.",
  },
  {
    key: "marketPotential",
    label: "Market Potential",
    description:
      "Audience demand and commercial potential.",
  },
  {
    key: "feasibility",
    label: "Production Feasibility",
    description:
      "Practicality of producing the proposed show.",
  },
];

/* =========================================================
   STATUS HELPERS
========================================================= */

function formatStatus(
  status?: string | null,
): string {
  if (!status) {
    return "Unknown";
  }

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

function getStatusVariant(
  status?: string | null,
):
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "primary" {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "success";

    case "REJECTED":
      return "danger";

    case "PRODUCTION":
    case "IN_PRODUCTION":
      return "primary";

    case "REVIEW":
    case "UNDER_REVIEW":
    case "PENDING":
      return "warning";

    case "DRAFT":
      return "info";

    default:
      return "default";
  }
}

function formatDecision(
  decision?: EvaluationDecision | null,
): string {
  switch (decision) {
    case "APPROVED":
      return "Approved";

    case "REJECTED":
      return "Rejected";

    case "REVISION_REQUIRED":
      return "Revision required";

    default:
      return "Not decided";
  }
}

/* =========================================================
   CREATOR
========================================================= */

function getCreatorName(
  creator?: UserResponse | null,
): string {
  if (!creator) {
    return "Unknown creator";
  }

  return (
    creator.fullName ??
    creator.name ??
    creator.username ??
    creator.email ??
    "Unknown creator"
  );
}

/* =========================================================
   BUDGET
========================================================= */

function getBudget(
  budget?: number | string | null,
): string {
  if (
    budget === null ||
    budget === undefined ||
    budget === ""
  ) {
    return "Not specified";
  }

  const value = Number(budget);

  if (Number.isNaN(value)) {
    return String(budget);
  }

  if (value >= 1_000_000) {
    return `$${(
      value / 1_000_000
    ).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `$${(
      value / 1_000
    ).toFixed(0)}K`;
  }

  return `$${value.toLocaleString()}`;
}

/* =========================================================
   DATE
========================================================= */

function formatReleaseDate(
  date?: string | null,
): string {
  if (!date) {
    return "Not specified";
  }

  const parts = date.split("-");

  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      Number.isInteger(day)
    ) {
      return new Date(
        year,
        month - 1,
        day,
      ).toLocaleDateString();
    }
  }

  return date;
}

/* =========================================================
   CURRENT USER
========================================================= */

function getCurrentUser(): CurrentUser | null {
  try {
    const possibleKeys = [
      "streamforge_user",
      "currentUser",
      "user",
      "authUser",
    ];

    for (const key of possibleKeys) {
      const stored =
        localStorage.getItem(key);

      if (!stored) {
        continue;
      }

      try {
        const parsed =
          JSON.parse(stored);

        if (
          parsed &&
          typeof parsed === "object"
        ) {
          return parsed as CurrentUser;
        }
      } catch {
        // Try next key
      }
    }

    return null;
  } catch {
    return null;
  }
}

/* =========================================================
   COMPONENT
========================================================= */

function Evaluation() {
  /* =======================================================
     SHOWS
  ======================================================= */

  const [shows, setShows] =
    useState<ShowResponse[]>([]);

  const [
    selectedShow,
    setSelectedShow,
  ] = useState<ShowResponse | null>(
    null,
  );

  const [
    loadingShows,
    setLoadingShows,
  ] = useState(true);

  /* =======================================================
     EXISTING EVALUATION
  ======================================================= */

  const [
    existingEvaluation,
    setExistingEvaluation,
  ] = useState<EvaluationResponse | null>(
    null,
  );

  const [
    loadingEvaluation,
    setLoadingEvaluation,
  ] = useState(false);

  /* =======================================================
     SCORES
  ======================================================= */

  const [scores, setScores] =
    useState<EvaluationScores>({
      originality: 0,
      creativity: 0,
      marketPotential: 0,
      feasibility: 0,
    });

  /* =======================================================
     DECISION
  ======================================================= */

  const [
    selectedDecision,
    setSelectedDecision,
  ] = useState<EvaluationDecision | null>(
    null,
  );

  /* =======================================================
     REMARKS
  ======================================================= */

  const [remarks, setRemarks] =
    useState("");

  const remarksRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    );

  /* =======================================================
     UI
  ======================================================= */

  const [saving, setSaving] =
    useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /* =======================================================
     DISCUSSION
  ======================================================= */

  const [
    discussionOpen,
    setDiscussionOpen,
  ] = useState(false);

  /* =======================================================
     LOAD SHOWS
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadShows() {
      try {
        setLoadingShows(true);
        setErrorMessage("");
        setSuccessMessage("");

        const response =
          await apiRequest<ShowResponse[]>(
            "/api/shows",
          );

        if (!mounted) {
          return;
        }

        const loadedShows =
          Array.isArray(response)
            ? response
            : [];

        setShows(loadedShows);

        if (loadedShows.length > 0) {
          setSelectedShow(
            loadedShows[0],
          );
        } else {
          setSelectedShow(null);
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        console.error(
          "Failed to load shows:",
          error,
        );

        setShows([]);
        setSelectedShow(null);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load shows.",
        );
      } finally {
        if (mounted) {
          setLoadingShows(false);
        }
      }
    }

    loadShows();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     LOAD EVALUATION
     
     IMPORTANT:
     Capture showId BEFORE async function.
     This fixes:
     
     "selectedShow is possibly null"
  ======================================================= */

  useEffect(() => {
    if (!selectedShow) {
      return;
    }

    /*
     * DO NOT use selectedShow.showId
     * inside the nested async function.
     *
     * Capture it here.
     */
    const showId =
      selectedShow.showId;

    let mounted = true;

    async function loadEvaluation() {
      try {
        setLoadingEvaluation(true);
        setErrorMessage("");
        setSuccessMessage("");

        const response =
          await apiRequest<
            EvaluationResponse |
            EvaluationResponse[]
          >(
            `/api/evaluations/show/${showId}`,
          );

        if (!mounted) {
          return;
        }

        let evaluation:
          | EvaluationResponse
          | null = null;

        /*
         * Supports both:
         *
         * EvaluationResponse
         *
         * and
         *
         * EvaluationResponse[]
         */
        if (Array.isArray(response)) {
          if (response.length > 0) {
            evaluation =
              response[
                response.length - 1
              ];
          }
        } else if (response) {
          evaluation = response;
        }

        setExistingEvaluation(
          evaluation,
        );

        if (evaluation) {
          setScores({
            originality: Number(
              evaluation.originalityScore ?? 0,
            ),

            creativity: Number(
              evaluation.creativityScore ?? 0,
            ),

            marketPotential: Number(
              evaluation.marketPotentialScore ?? 0,
            ),

            feasibility: Number(
              evaluation.feasibilityScore ?? 0,
            ),
          });

          setSelectedDecision(
            evaluation.decision,
          );

          setRemarks(
            evaluation.remarks ?? "",
          );
        } else {
          setExistingEvaluation(null);

          setScores({
            originality: 0,
            creativity: 0,
            marketPotential: 0,
            feasibility: 0,
          });

          setSelectedDecision(null);
          setRemarks("");
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        console.error(
          "Failed to load evaluation:",
          error,
        );

        /*
         * No evaluation yet = create mode.
         */
        setExistingEvaluation(null);

        setScores({
          originality: 0,
          creativity: 0,
          marketPotential: 0,
          feasibility: 0,
        });

        setSelectedDecision(null);
        setRemarks("");

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load evaluation.";

        const lower =
          message.toLowerCase();

        /*
         * A missing evaluation is not
         * treated as a fatal UI error.
         */
        if (
          !lower.includes("404") &&
          !lower.includes("not found")
        ) {
          setErrorMessage(message);
        }
      } finally {
        if (mounted) {
          setLoadingEvaluation(false);
        }
      }
    }

    loadEvaluation();

    return () => {
      mounted = false;
    };
  }, [selectedShow]);

  /* =======================================================
     WEIGHTED SCORE
     
     Four backend criteria.
     Equal weight = 25% each.
  ======================================================= */

  const weightedScore = useMemo(() => {
    const total =
      scores.originality +
      scores.creativity +
      scores.marketPotential +
      scores.feasibility;

    return total / 4;
  }, [scores]);

  /* =======================================================
     SCORE UPDATE
  ======================================================= */

  function updateScore(
    key: CriterionKey,
    value: number,
  ) {
    if (
      saving ||
      loadingEvaluation
    ) {
      return;
    }

    const safeValue = Math.min(
      10,
      Math.max(0, value),
    );

    setScores(
      (previous) => ({
        ...previous,
        [key]: safeValue,
      }),
    );

    setSelectedDecision(null);
    setSuccessMessage("");
    setErrorMessage("");
  }

  /* =======================================================
     SELECT SHOW
  ======================================================= */

  function handleSelectShow(
    show: ShowResponse,
  ) {
    if (saving) {
      return;
    }

    setSelectedShow(show);

    setSuccessMessage("");
    setErrorMessage("");
    setDiscussionOpen(false);
  }

  /* =======================================================
     SUBMIT EVALUATION
  ======================================================= */

  async function submitEvaluation(
    decision: EvaluationDecision,
  ) {
    if (!selectedShow) {
      setErrorMessage(
        "Please select a show first.",
      );
      return;
    }

    /*
     * EvaluationRequest requires evaluatorId.
     */
    const currentUser =
      getCurrentUser();

    const evaluatorId =
      currentUser?.userId ??
      currentUser?.id;

    if (!evaluatorId) {
      setErrorMessage(
        "Unable to identify the evaluator. Please login again.",
      );
      return;
    }

    /*
     * Validate all four scores.
     */
    const scoreValues = [
      scores.originality,
      scores.creativity,
      scores.marketPotential,
      scores.feasibility,
    ];

    const invalidScore =
      scoreValues.some(
        (score) =>
          !Number.isFinite(score) ||
          score < 0 ||
          score > 10,
      );

    if (invalidScore) {
      setErrorMessage(
        "All scores must be between 0 and 10.",
      );
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      /*
       * IMPORTANT BACKEND ENUM MAPPING
       *
       * Approve:
       * APPROVED
       *
       * Reject:
       * REJECTED
       *
       * Request changes:
       * REVISION_REQUIRED
       *
       * Your backend DOES NOT accept:
       * REQUEST_CHANGES
       * PENDING
       */
      const payload = {
        showId:
          selectedShow.showId,

        evaluatorId,

        originalityScore:
          scores.originality,

        creativityScore:
          scores.creativity,

        marketPotentialScore:
          scores.marketPotential,

        feasibilityScore:
          scores.feasibility,

        overallScore: Number(
          weightedScore.toFixed(2),
        ),

        decision,

        remarks:
          remarks.trim() || null,
      };

      console.log(
        "Evaluation payload:",
        payload,
      );

      /* =================================================
         UPDATE
      ================================================= */

      if (existingEvaluation) {
        const updated =
          await apiRequest<EvaluationResponse>(
            `/api/evaluations/${existingEvaluation.evaluationId}`,
            {
              method: "PUT",
              body: JSON.stringify(
                payload,
              ),
            },
          );

        setExistingEvaluation(
          updated,
        );

        setSelectedDecision(
          updated.decision,
        );

        setScores({
          originality: Number(
            updated.originalityScore ?? 0,
          ),

          creativity: Number(
            updated.creativityScore ?? 0,
          ),

          marketPotential: Number(
            updated.marketPotentialScore ?? 0,
          ),

          feasibility: Number(
            updated.feasibilityScore ?? 0,
          ),
        });

        setRemarks(
          updated.remarks ?? "",
        );

        setSuccessMessage(
          "Evaluation updated successfully.",
        );
      }

      /* =================================================
         CREATE
      ================================================= */

      else {
        const created =
          await apiRequest<EvaluationResponse>(
            "/api/evaluations",
            {
              method: "POST",
              body: JSON.stringify(
                payload,
              ),
            },
          );

        setExistingEvaluation(
          created,
        );

        setSelectedDecision(
          created.decision,
        );

        setScores({
          originality: Number(
            created.originalityScore ?? 0,
          ),

          creativity: Number(
            created.creativityScore ?? 0,
          ),

          marketPotential: Number(
            created.marketPotentialScore ?? 0,
          ),

          feasibility: Number(
            created.feasibilityScore ?? 0,
          ),
        });

        setRemarks(
          created.remarks ?? "",
        );

        setSuccessMessage(
          "Evaluation submitted successfully.",
        );
      }
    } catch (error) {
      console.error(
        "Evaluation request failed:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to save evaluation.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     SAVE EVALUATION
  ======================================================= */

  async function handleSaveEvaluation() {
    if (!selectedDecision) {
      setErrorMessage(
        "Please choose Approve, Reject, or Request changes before saving.",
      );
      return;
    }

    await submitEvaluation(
      selectedDecision,
    );
  }

  /* =======================================================
     DISCUSS BUTTON
  ======================================================= */

  function handleDiscuss() {
    setDiscussionOpen(
      (previous) => {
        const next = !previous;

        /*
         * When opening discussion,
         * focus the remarks field.
         */
        if (next) {
          setTimeout(() => {
            remarksRef.current?.focus();
          }, 50);
        }

        return next;
      },
    );

    setErrorMessage("");
    setSuccessMessage("");
  }

  /* =======================================================
     LOADING SHOWS
  ======================================================= */

  if (loadingShows) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Content Evaluation"
          description="Score submissions and route them to production."
        />

        <div className="min-h-[400px] flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading shows...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* =======================================================
     NO SHOWS
  ======================================================= */

  if (
    !selectedShow ||
    shows.length === 0
  ) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Content Evaluation"
          description="Score submissions and route them to production."
        />

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <Card>
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-muted grid place-items-center">
              <AlertCircle className="h-7 w-7 text-muted-foreground" />
            </div>

            <h2 className="text-lg font-semibold">
              No shows available
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Create or submit a show before
              starting an evaluation.
            </p>
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
        title="Content Evaluation"
        description="Score submissions and route them to production."
      />

      {/* =================================================
          SUCCESS
      ================================================= */}

      {successMessage && (
        <div className="mb-4 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-success flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />

          <span>
            {successMessage}
          </span>
        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />

          <span>
            {errorMessage}
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-6">
        {/* =================================================
            QUEUE
        ================================================= */}

        <Card className="!p-0 h-fit overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="text-sm font-semibold">
              Evaluation Queue
            </div>

            <div className="text-xs text-muted-foreground mt-1">
              {shows.length} shows
            </div>
          </div>

          <ul className="max-h-[70vh] overflow-y-auto scrollbar-thin">
            {shows.map((show) => {
              const isSelected =
                selectedShow.showId ===
                show.showId;

              return (
                <li
                  key={show.showId}
                >
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      handleSelectShow(
                        show,
                      )
                    }
                    className={`w-full text-left p-4 border-b border-border transition flex items-center gap-3 ${
                      isSelected
                        ? "bg-primary/5 border-l-2 border-l-primary"
                        : "hover:bg-accent/40"
                    } ${
                      saving
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                  >
                    {/* INITIAL */}
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 font-semibold">
                      {show.title
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "S"}
                    </div>

                    {/* DETAILS */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">
                        {show.title}
                      </div>

                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {getCreatorName(
                          show.creator,
                        )}
                      </div>
                    </div>

                    {/* STATUS */}
                    <Chip
                      variant={getStatusVariant(
                        show.status,
                      )}
                    >
                      {formatStatus(
                        show.status,
                      )}
                    </Chip>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="space-y-4 min-w-0">
          {/* ===============================================
              SHOW INFORMATION
          =============================================== */}

          <Card className="!p-0 overflow-hidden">
            <div className="relative h-52 overflow-hidden">
              {/* BACKGROUND */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 80% 20%, oklch(0.30 0.12 25 / 0.35), transparent 55%), linear-gradient(135deg, oklch(0.12 0 0), oklch(0.09 0 0))",
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

              {/* TITLE */}
              <div className="absolute bottom-5 left-6 right-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Chip
                    variant={getStatusVariant(
                      selectedShow.status,
                    )}
                  >
                    {formatStatus(
                      selectedShow.status,
                    )}
                  </Chip>

                  {selectedShow.language && (
                    <Chip variant="info">
                      {selectedShow.language}
                    </Chip>
                  )}

                  {selectedShow.targetAudience && (
                    <Chip>
                      {
                        selectedShow.targetAudience
                      }
                    </Chip>
                  )}
                </div>

                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {selectedShow.title}
                </h2>

                <div className="text-sm text-muted-foreground mt-1">
                  by{" "}
                  {getCreatorName(
                    selectedShow.creator,
                  )}{" "}
                  ·{" "}
                  {getBudget(
                    selectedShow.estimatedBudget,
                  )}
                </div>
              </div>
            </div>

            {/* SHOW FACTS */}
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-3">
                {/* CREATOR */}
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Creator
                  </div>

                  <div className="mt-1.5 text-sm font-semibold truncate">
                    {getCreatorName(
                      selectedShow.creator,
                    )}
                  </div>
                </div>

                {/* LANGUAGE */}
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <Languages className="h-3.5 w-3.5" />
                    Language
                  </div>

                  <div className="mt-1.5 text-sm font-semibold">
                    {selectedShow.language ||
                      "Not specified"}
                  </div>
                </div>

                {/* RELEASE */}
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Release
                  </div>

                  <div className="mt-1.5 text-sm font-semibold">
                    {formatReleaseDate(
                      selectedShow.expectedReleaseDate,
                    )}
                  </div>
                </div>
              </div>

              {/* SYNOPSIS */}
              <div className="mt-5">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Synopsis
                </div>

                <p className="text-sm text-muted-foreground leading-6">
                  {selectedShow.synopsis ||
                    selectedShow.description ||
                    "No synopsis available for this show."}
                </p>
              </div>
            </div>
          </Card>

          {/* ===============================================
              EXISTING EVALUATION
          =============================================== */}

          {existingEvaluation && (
            <div className="rounded-xl border border-info/40 bg-info/5 px-4 py-3 text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-info shrink-0" />

              <span>
                Existing evaluation ·{" "}
                <strong>
                  {formatDecision(
                    existingEvaluation.decision,
                  )}
                </strong>
              </span>
            </div>
          )}

          {/* ===============================================
              SCORECARD
          =============================================== */}

          <Card>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-7">
              <div>
                <div className="text-sm font-semibold">
                  Evaluation scorecard
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                  Rate each criterion from 0
                  to 10
                </div>
              </div>

              <div className="text-left md:text-right">
                <div className="text-3xl font-bold gradient-text">
                  {weightedScore.toFixed(
                    2,
                  )}{" "}
                  / 10
                </div>

                <div className="text-xs text-muted-foreground">
                  Weighted overall score
                </div>
              </div>
            </div>

            {/* CRITERIA */}
            <div className="space-y-7">
              {criteria.map(
                (criterion) => {
                  const value =
                    scores[
                      criterion.key
                    ];

                  return (
                    <div
                      key={
                        criterion.key
                      }
                    >
                      {/* LABEL */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold">
                            {
                              criterion.label
                            }
                          </div>

                          <div className="text-xs text-muted-foreground mt-0.5">
                            {
                              criterion.description
                            }
                          </div>
                        </div>

                        <div className="text-sm font-semibold shrink-0">
                          {value}/10
                        </div>
                      </div>

                      {/* STARS */}
                      <div className="mt-3 flex items-center gap-1 flex-wrap">
                        {Array.from(
                          {
                            length: 10,
                          },
                        ).map(
                          (
                            _,
                            index,
                          ) => {
                            const starValue =
                              index + 1;

                            const active =
                              starValue <=
                              value;

                            return (
                              <button
                                key={
                                  starValue
                                }
                                type="button"
                                disabled={
                                  saving ||
                                  loadingEvaluation
                                }
                                onClick={() =>
                                  updateScore(
                                    criterion.key,
                                    starValue,
                                  )
                                }
                                aria-label={`Set ${criterion.label} to ${starValue} out of 10`}
                                className="p-0.5 rounded-md transition hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    active
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </button>
                            );
                          },
                        )}
                      </div>

                      {/* PROGRESS */}
                      <div className="mt-2">
                        <Progress
                          value={
                            (value /
                              10) *
                            100
                          }
                        />
                      </div>

                      {/* SCALE */}
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>0</span>
                        <span>5</span>
                        <span>10</span>
                      </div>
                    </div>
                  );
                },
              )}
            </div>

            {/* =============================================
                REMARKS
            ============================================= */}

            <div className="mt-8">
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Reviewer remarks
              </div>

              <textarea
                ref={remarksRef}
                rows={5}
                value={remarks}
                onChange={(event) => {
                  setRemarks(
                    event.target.value,
                  );

                  setSuccessMessage("");
                  setErrorMessage("");
                }}
                maxLength={2000}
                disabled={saving}
                placeholder="Add your evaluation remarks..."
                className="w-full rounded-xl bg-surface border border-border p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />

              <div className="text-right text-xs text-muted-foreground mt-1">
                {remarks.length}/2000
              </div>
            </div>

            {/* =============================================
                DISCUSS PANEL
            ============================================= */}

            {discussionOpen && (
              <div className="mt-5 rounded-xl border border-info/30 bg-info/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-info" />

                  <div>
                    <div className="text-sm font-semibold">
                      Discussion
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Add discussion notes to the
                      evaluation.
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Use the reviewer remarks field
                  above for notes that should be
                  submitted with the evaluation.
                </p>
              </div>
            )}

            {/* =============================================
                ACTIONS
            ============================================= */}

            <div className="mt-7 flex flex-wrap items-center gap-2">
              {/* APPROVE */}
              <button
                type="button"
                disabled={
                  saving ||
                  loadingEvaluation
                }
                onClick={() =>
                  submitEvaluation(
                    "APPROVED",
                  )
                }
                className="h-10 px-5 rounded-xl bg-success text-success-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving &&
                selectedDecision ===
                  "APPROVED" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}

                {saving &&
                selectedDecision ===
                  "APPROVED"
                  ? "Saving..."
                  : "Approve"}
              </button>

              {/* REJECT */}
              <button
                type="button"
                disabled={
                  saving ||
                  loadingEvaluation
                }
                onClick={() =>
                  submitEvaluation(
                    "REJECTED",
                  )
                }
                className="h-10 px-5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving &&
                selectedDecision ===
                  "REJECTED" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}

                {saving &&
                selectedDecision ===
                  "REJECTED"
                  ? "Saving..."
                  : "Reject"}
              </button>

              {/* REQUEST CHANGES */}
              <button
                type="button"
                disabled={
                  saving ||
                  loadingEvaluation
                }
                onClick={() =>
                  submitEvaluation(
                    "REVISION_REQUIRED",
                  )
                }
                className={`h-10 px-5 rounded-xl border text-sm inline-flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedDecision ===
                  "REVISION_REQUIRED"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                {saving &&
                selectedDecision ===
                  "REVISION_REQUIRED" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}

                {saving &&
                selectedDecision ===
                  "REVISION_REQUIRED"
                  ? "Saving..."
                  : "Request changes"}
              </button>

              {/* SAVE */}
              <button
                type="button"
                disabled={
                  saving ||
                  loadingEvaluation
                }
                onClick={
                  handleSaveEvaluation
                }
                className="h-10 px-5 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed md:ml-auto"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving
                  ? "Saving..."
                  : "Save evaluation"}
              </button>

              {/* DISCUSS */}
              <button
                type="button"
                onClick={
                  handleDiscuss
                }
                className={`h-10 px-5 rounded-xl border text-sm inline-flex items-center gap-2 transition ${
                  discussionOpen
                    ? "border-info bg-info/10 text-info"
                    : "border-border hover:bg-accent"
                }`}
              >
                <MessageSquare className="h-4 w-4" />

                {discussionOpen
                  ? "Close discussion"
                  : "Discuss"}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
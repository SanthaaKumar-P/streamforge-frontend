import { createFileRoute } from "@tanstack/react-router";

import {
  DashboardLayout,
  PageHeader,
} from "@/components/layout/DashboardLayout";

import { Card, Chip } from "@/components/ui-kit";

import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Star,
  MessageSquare,
  Send,
} from "lucide-react";

import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";

import { cn } from "@/lib/utils";

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
          "Evaluate submitted shows and manage evaluation decisions.",
      },
      {
        property: "og:title",
        content:
          "Evaluation — Netflix Show Manager",
      },
      {
        property: "og:description",
        content:
          "Evaluate submitted shows and manage content evaluation decisions.",
      },
    ],
  }),

  component: EvaluationPage,
});

/* =========================================================
   CONSTANTS
========================================================= */

const DECISIONS = [
  {
    value: "APPROVED",
    label: "Approved",
  },
  {
    value: "REJECTED",
    label: "Rejected",
  },
  {
    value: "REVISION_REQUIRED",
    label: "Revision Required",
  },
] as const;

/* =========================================================
   TYPES
========================================================= */

type EvaluationDecision =
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUIRED";

interface Evaluation {
  evaluationId: number;
  originalityScore: number;
  creativityScore: number;
  marketPotentialScore: number;
  feasibilityScore: number;
  overallScore: number;
  decision: EvaluationDecision;
  remarks: string | null;
}

interface EvaluationRequest {
  showId: number;
  evaluatorId: number;
  originalityScore: number;
  creativityScore: number;
  marketPotentialScore: number;
  feasibilityScore: number;
  overallScore: number;
  decision: EvaluationDecision | "";
  remarks: string;
}

interface EvaluationComment {
  commentId: number;
  comment: string;
  userId: number;
  evaluationId: number;
}

interface EvaluationCommentRequest {
  evaluationId: number;
  userId: number;
  comment: string;
}

/* =========================================================
   DELETE API HELPER
   IMPORTANT:
   Backend DELETE returns plain text.
========================================================= */

async function deleteRequest(
  endpoint: string
): Promise<void> {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8080";

  const token =
    localStorage.getItem(
      "streamforge_token"
    );

  if (!token) {
    window.location.href = "/login";

    throw new Error(
      "You are not logged in."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      method: "DELETE",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  /* =======================================================
     SESSION EXPIRED
  ======================================================= */

  if (response.status === 401) {
    localStorage.removeItem(
      "streamforge_token"
    );

    localStorage.removeItem(
      "streamforge_user"
    );

    window.location.href =
      "/login";

    throw new Error(
      "Session expired"
    );
  }

  /* =======================================================
     ACCESS DENIED
  ======================================================= */

  if (response.status === 403) {
    throw new Error(
      "Access denied"
    );
  }

  /* =======================================================
     OTHER ERROR
  ======================================================= */

  if (!response.ok) {
    let message =
      "Delete operation failed.";

    try {
      const contentType =
        response.headers.get(
          "content-type"
        );

      if (
        contentType?.includes(
          "application/json"
        )
      ) {
        const error =
          await response.json();

        message =
          error.message ||
          error.error ||
          message;
      } else {
        const text =
          await response.text();

        if (text.trim()) {
          message = text;
        }
      }
    } catch {
      // Ignore error parsing failure
    }

    throw new Error(message);
  }

  /*
   * IMPORTANT:
   *
   * Do NOT call response.json()
   *
   * Backend returns:
   *
   * "Evaluation deleted successfully"
   *
   * or:
   *
   * "Evaluation comment deleted successfully"
   *
   * which is plain text.
   */

  await response.text();
}

/* =========================================================
   AUTH HELPERS
========================================================= */

function getLoggedInUserId(): number | null {
  try {
    const storedUser =
      localStorage.getItem(
        "streamforge_user"
      );

    if (storedUser) {
      const user = JSON.parse(
        storedUser
      );

      const possibleIds = [
        user?.userId,
        user?.id,
        user?.user?.userId,
        user?.user?.id,
        user?.data?.userId,
        user?.data?.id,
      ];

      for (const value of possibleIds) {
        const id = Number(value);

        if (
          Number.isInteger(id) &&
          id > 0
        ) {
          return id;
        }
      }
    }

    /* JWT FALLBACK */

    const token =
      localStorage.getItem(
        "streamforge_token"
      );

    if (!token) {
      return null;
    }

    const parts =
      token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    try {
      const base64Payload =
        parts[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/");

      const payload =
        JSON.parse(
          atob(base64Payload)
        );

      const possibleIds = [
        payload?.userId,
        payload?.id,
        payload?.uid,
        payload?.sub,
        payload?.user?.userId,
        payload?.user?.id,
      ];

      for (const value of possibleIds) {
        const id = Number(value);

        if (
          Number.isInteger(id) &&
          id > 0
        ) {
          return id;
        }
      }
    } catch {
      // Ignore invalid JWT
    }

    return null;
  } catch {
    return null;
  }
}

/* =========================================================
   USERNAME
========================================================= */

function getLoggedInUsername(): string {
  try {
    const storedUser =
      localStorage.getItem(
        "streamforge_user"
      );

    if (!storedUser) {
      return "Unknown user";
    }

    const user =
      JSON.parse(storedUser);

    return (
      user?.username ||
      user?.user?.username ||
      user?.data?.username ||
      user?.email ||
      user?.user?.email ||
      user?.data?.email ||
      "Unknown user"
    );
  } catch {
    return "Unknown user";
  }
}

/* =========================================================
   ROLE EXTRACTION
========================================================= */

function normalizeRole(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .replace(/^ROLE_/i, "")
    .trim()
    .toUpperCase();
}

function extractRole(
  value: unknown
): string {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return normalizeRole(
      value
    );
  }

  if (
    Array.isArray(value)
  ) {
    for (const item of value) {
      const role =
        extractRole(item);

      if (role) {
        return role;
      }
    }

    return "";
  }

  if (
    typeof value === "object"
  ) {
    const object =
      value as Record<
        string,
        unknown
      >;

    const directValues = [
      object.role,
      object.authority,
      object.name,
      object.roleName,
    ];

    for (
      const candidate of directValues
    ) {
      const role =
        normalizeRole(
          candidate
        );

      if (role) {
        return role;
      }
    }

    const nestedValues = [
      object.roles,
      object.authorities,
      object.user,
      object.data,
    ];

    for (
      const nested of nestedValues
    ) {
      const role =
        extractRole(nested);

      if (role) {
        return role;
      }
    }
  }

  return "";
}

/* =========================================================
   LOGGED-IN ROLE
========================================================= */

function getLoggedInRole(): string {
  try {
    const storedUser =
      localStorage.getItem(
        "streamforge_user"
      );

    if (storedUser) {
      try {
        const user =
          JSON.parse(
            storedUser
          );

        const role =
          extractRole(user);

        if (role) {
          return role;
        }
      } catch {
        // Continue to JWT
      }
    }

    const token =
      localStorage.getItem(
        "streamforge_token"
      );

    if (!token) {
      return "";
    }

    const parts =
      token.split(".");

    if (parts.length !== 3) {
      return "";
    }

    try {
      const payload =
        JSON.parse(
          atob(
            parts[1]
              .replace(/-/g, "+")
              .replace(/_/g, "/")
          )
        );

      return extractRole(
        payload
      );
    } catch {
      return "";
    }
  } catch {
    return "";
  }
}

/* =========================================================
   DECISION STYLE
========================================================= */

function getDecisionClass(
  decision: string
) {
  switch (
    decision?.toUpperCase()
  ) {
    case "APPROVED":
      return "bg-success/15 text-success border-success/30";

    case "REJECTED":
      return "bg-destructive/15 text-destructive border-destructive/30";

    case "REVISION_REQUIRED":
      return "bg-warning/15 text-warning border-warning/30";

    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

/* =========================================================
   SCORE STYLE
========================================================= */

function getScoreClass(
  score: number
) {
  if (score >= 8) {
    return "text-success";
  }

  if (score >= 5) {
    return "text-warning";
  }

  return "text-destructive";
}

/* =========================================================
   MAIN PAGE
========================================================= */

function EvaluationPage() {
  /* =======================================================
     BASIC STATE
  ======================================================= */

  const [
    showId,
    setShowId,
  ] = useState("");

  const [
    evaluations,
    setEvaluations,
  ] = useState<Evaluation[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /* =======================================================
     MODALS
  ======================================================= */

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingEvaluation,
    setEditingEvaluation,
  ] = useState<Evaluation | null>(
    null
  );

  const [
    viewingEvaluation,
    setViewingEvaluation,
  ] = useState<Evaluation | null>(
    null
  );

  /* =======================================================
     DELETE STATE
  ======================================================= */

  const [
    deletingId,
    setDeletingId,
  ] = useState<number | null>(
    null
  );

  /* =======================================================
     USER
  ======================================================= */

  const [
    evaluatorId,
    setEvaluatorId,
  ] = useState<number | null>(
    null
  );

  const [
    username,
    setUsername,
  ] = useState(
    "Unknown user"
  );

  const [
    role,
    setRole,
  ] = useState("");

  /* =======================================================
     COMMENT STATE
  ======================================================= */

  const [
    comments,
    setComments,
  ] = useState<
    EvaluationComment[]
  >([]);

  const [
    commentsLoading,
    setCommentsLoading,
  ] = useState(false);

  const [
    commentSaving,
    setCommentSaving,
  ] = useState(false);

  const [
    commentDeletingId,
    setCommentDeletingId,
  ] = useState<number | null>(
    null
  );

  const [
    commentText,
    setCommentText,
  ] = useState("");

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [
    form,
    setForm,
  ] = useState<EvaluationRequest>({
    showId: 0,
    evaluatorId: 0,
    originalityScore: 0,
    creativityScore: 0,
    marketPotentialScore: 0,
    feasibilityScore: 0,
    overallScore: 0,
    decision: "",
    remarks: "",
  });

  /* =======================================================
     PERMISSIONS
  ======================================================= */

  const canManageEvaluations =
    role === "ADMIN" ||
    role === "CONTENT_MANAGER";

  const canDeleteEvaluations =
    role === "ADMIN";

  const canManageComments =
    role === "ADMIN" ||
    role === "CONTENT_MANAGER";

  const canDeleteComments =
    role === "ADMIN";

  /* =======================================================
     INITIAL USER LOAD
  ======================================================= */

  useEffect(() => {
    const id =
      getLoggedInUserId();

    const name =
      getLoggedInUsername();

    const currentRole =
      getLoggedInRole();

    setEvaluatorId(id);
    setUsername(name);
    setRole(currentRole);

    if (!id) {
      setError(
        "Unable to determine the logged-in user's ID."
      );
    }
  }, []);

  /* =======================================================
     LOAD EVALUATIONS
  ======================================================= */

  const loadEvaluations = async (
    requestedShowId?: string
  ) => {
    setError("");

    const id =
      requestedShowId ??
      showId;

    const numericShowId =
      Number(id);

    if (
      !id ||
      !Number.isInteger(
        numericShowId
      ) ||
      numericShowId <= 0
    ) {
      setError(
        "Please enter a valid Show ID."
      );

      return;
    }

    setLoading(true);

    try {
      const data =
        await apiRequest<
          Evaluation[]
        >(
          `/api/evaluations/show/${numericShowId}`
        );

      setEvaluations(
        Array.isArray(data)
          ? data
          : []
      );

      setShowId(
        String(numericShowId)
      );
    } catch (err) {
      setEvaluations([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load evaluations."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD COMMENTS
  ======================================================= */

  const loadComments = async (
    evaluationId: number
  ) => {
    setCommentsLoading(true);
    setComments([]);
    setError("");

    try {
      const data =
        await apiRequest<
          EvaluationComment[]
        >(
          `/api/evaluation-comments/evaluation/${evaluationId}`
        );

      setComments(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setComments([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load evaluation comments."
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  /* =======================================================
     OPEN VIEW
  ======================================================= */

  const openView = async (
    evaluation: Evaluation
  ) => {
    setViewingEvaluation(
      evaluation
    );

    setCommentText("");

    setSuccess("");

    await loadComments(
      evaluation.evaluationId
    );
  };

  /* =======================================================
     ADD COMMENT
  ======================================================= */

  const addComment = async () => {
    setError("");
    setSuccess("");

    if (!viewingEvaluation) {
      return;
    }

    if (!canManageComments) {
      setError(
        "You are not authorized to add comments."
      );

      return;
    }

    if (!evaluatorId) {
      setError(
        "Unable to determine the logged-in user's ID."
      );

      return;
    }

    const trimmedComment =
      commentText.trim();

    if (!trimmedComment) {
      setError(
        "Please enter a comment."
      );

      return;
    }

    if (
      trimmedComment.length >
      2000
    ) {
      setError(
        "Comment cannot exceed 2000 characters."
      );

      return;
    }

    setCommentSaving(true);

    const request:
      EvaluationCommentRequest = {
      evaluationId:
        viewingEvaluation.evaluationId,

      userId:
        evaluatorId,

      comment:
        trimmedComment,
    };

    try {
      const created =
        await apiRequest<
          EvaluationComment
        >(
          "/api/evaluation-comments",
          {
            method: "POST",
            body: JSON.stringify(
              request
            ),
          }
        );

      setComments(
        (previous) => [
          ...previous,
          created,
        ]
      );

      setCommentText("");

      setSuccess(
        "Comment added successfully!"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add comment."
      );
    } finally {
      setCommentSaving(false);
    }
  };

  /* =======================================================
     DELETE COMMENT
     FIXED:
     Uses deleteRequest() because backend returns String.
  ======================================================= */

  const deleteComment = async (
    commentId: number
  ) => {
    setError("");
    setSuccess("");

    if (!canDeleteComments) {
      setError(
        "Only administrators can delete comments."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this comment?"
      );

    if (!confirmed) {
      return;
    }

    setCommentDeletingId(
      commentId
    );

    try {
      await deleteRequest(
        `/api/evaluation-comments/${commentId}`
      );

      setComments(
        (previous) =>
          previous.filter(
            (comment) =>
              comment.commentId !==
              commentId
          )
      );

      setSuccess(
        "Comment deleted successfully!"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete comment."
      );
    } finally {
      setCommentDeletingId(null);
    }
  };

  /* =======================================================
     CREATE EVALUATION
  ======================================================= */

  const openCreate = () => {
    setError("");
    setSuccess("");

    const numericShowId =
      Number(showId);

    if (
      !Number.isInteger(
        numericShowId
      ) ||
      numericShowId <= 0
    ) {
      setError(
        "Enter a valid Show ID before creating an evaluation."
      );

      return;
    }

    if (!evaluatorId) {
      setError(
        "Unable to determine the logged-in user's ID."
      );

      return;
    }

    if (!canManageEvaluations) {
      setError(
        "You are not authorized to create evaluations."
      );

      return;
    }

    setEditingEvaluation(
      null
    );

    setForm({
      showId:
        numericShowId,

      evaluatorId:
        evaluatorId,

      originalityScore: 0,

      creativityScore: 0,

      marketPotentialScore: 0,

      feasibilityScore: 0,

      overallScore: 0,

      decision: "",

      remarks: "",
    });

    setShowForm(true);
  };

  /* =======================================================
     EDIT EVALUATION
  ======================================================= */

  const openEdit = (
    evaluation: Evaluation
  ) => {
    setError("");
    setSuccess("");

    if (!canManageEvaluations) {
      setError(
        "You are not authorized to edit evaluations."
      );

      return;
    }

    setEditingEvaluation(
      evaluation
    );

    setForm({
      showId:
        Number(showId),

      evaluatorId:
        evaluatorId ?? 0,

      originalityScore:
        evaluation.originalityScore ??
        0,

      creativityScore:
        evaluation.creativityScore ??
        0,

      marketPotentialScore:
        evaluation.marketPotentialScore ??
        0,

      feasibilityScore:
        evaluation.feasibilityScore ??
        0,

      overallScore:
        Number(
          evaluation.overallScore ??
            0
        ),

      decision:
        evaluation.decision ??
        "",

      remarks:
        evaluation.remarks ??
        "",
    });

    setShowForm(true);
  };

  /* =======================================================
     INTEGER SCORE UPDATE
  ======================================================= */

  const updateIntegerScore = (
    field:
      | "originalityScore"
      | "creativityScore"
      | "marketPotentialScore"
      | "feasibilityScore",
    value: string
  ) => {
    if (value === "") {
      setForm(
        (previous) => ({
          ...previous,
          [field]: 0,
        })
      );

      return;
    }

    let number =
      Number(value);

    if (
      Number.isNaN(number)
    ) {
      number = 0;
    }

    number =
      Math.round(number);

    if (number < 0) {
      number = 0;
    }

    if (number > 10) {
      number = 10;
    }

    setForm(
      (previous) => ({
        ...previous,
        [field]: number,
      })
    );
  };

  /* =======================================================
     OVERALL SCORE UPDATE
  ======================================================= */

  const updateOverallScore = (
    value: string
  ) => {
    if (value === "") {
      setForm(
        (previous) => ({
          ...previous,
          overallScore: 0,
        })
      );

      return;
    }

    let number =
      Number(value);

    if (
      Number.isNaN(number)
    ) {
      number = 0;
    }

    if (number < 0) {
      number = 0;
    }

    if (number > 10) {
      number = 10;
    }

    setForm(
      (previous) => ({
        ...previous,
        overallScore: number,
      })
    );
  };

  /* =======================================================
     SAVE EVALUATION
  ======================================================= */

  const saveEvaluation =
    async () => {
      setError("");
      setSuccess("");

      if (!canManageEvaluations) {
        setError(
          "You are not authorized to manage evaluations."
        );

        return;
      }

      if (
        !form.showId ||
        form.showId <= 0
      ) {
        setError(
          "Show ID is required."
        );

        return;
      }

      if (
        !form.evaluatorId ||
        form.evaluatorId <= 0
      ) {
        setError(
          "Evaluator ID is required."
        );

        return;
      }

      if (!form.decision) {
        setError(
          "Please select an evaluation decision."
        );

        return;
      }

      const integerScores = [
        form.originalityScore,
        form.creativityScore,
        form.marketPotentialScore,
        form.feasibilityScore,
      ];

      const invalidIntegerScore =
        integerScores.some(
          (score) =>
            !Number.isInteger(
              score
            ) ||
            score < 0 ||
            score > 10
        );

      if (
        invalidIntegerScore
      ) {
        setError(
          "Originality, Creativity, Market Potential and Feasibility scores must be whole numbers from 0 to 10."
        );

        return;
      }

      if (
        form.overallScore < 0 ||
        form.overallScore > 10
      ) {
        setError(
          "Overall score must be between 0 and 10."
        );

        return;
      }

      setSaving(true);

      try {
        if (editingEvaluation) {
          await apiRequest<Evaluation>(
            `/api/evaluations/${editingEvaluation.evaluationId}`,
            {
              method: "PUT",
              body: JSON.stringify(
                form
              ),
            }
          );

          setSuccess(
            "Evaluation updated successfully!"
          );
        } else {
          await apiRequest<Evaluation>(
            "/api/evaluations",
            {
              method: "POST",
              body: JSON.stringify(
                form
              ),
            }
          );

          setSuccess(
            "Evaluation created successfully!"
          );
        }

        const savedShowId =
          form.showId;

        setShowForm(false);

        setEditingEvaluation(
          null
        );

        await loadEvaluations(
          String(savedShowId)
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to save evaluation."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     DELETE EVALUATION
     FIXED:
     Uses deleteRequest() because backend returns String.
  ======================================================= */

  const deleteEvaluation =
    async (
      evaluationId: number
    ) => {
      setError("");
      setSuccess("");

      if (!canDeleteEvaluations) {
        setError(
          "Only administrators can delete evaluations."
        );

        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this evaluation?"
        );

      if (!confirmed) {
        return;
      }

      setDeletingId(
        evaluationId
      );

      try {
        await deleteRequest(
          `/api/evaluations/${evaluationId}`
        );

        /*
         * Immediately remove from UI.
         */
        setEvaluations(
          (previous) =>
            previous.filter(
              (evaluation) =>
                evaluation.evaluationId !==
                evaluationId
            )
        );

        /*
         * If currently viewing the deleted
         * evaluation, close the modal.
         */
        if (
          viewingEvaluation?.evaluationId ===
          evaluationId
        ) {
          setViewingEvaluation(
            null
          );

          setComments([]);

          setCommentText("");
        }

        setSuccess(
          "Evaluation deleted successfully!"
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to delete evaluation."
        );
      } finally {
        setDeletingId(null);
      }
    };

  /* =======================================================
     CLOSE FORM
  ======================================================= */

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);

    setEditingEvaluation(
      null
    );
  };

  /* =======================================================
     CLOSE VIEW
  ======================================================= */

  const closeView = () => {
    setViewingEvaluation(
      null
    );

    setComments([]);

    setCommentText("");

    setCommentsLoading(false);
  };

  /* =======================================================
     AVERAGE SCORE
  ======================================================= */

  const averageScore =
    evaluations.length > 0
      ? (
          evaluations.reduce(
            (
              total,
              evaluation
            ) =>
              total +
              Number(
                evaluation.overallScore ??
                  0
              ),
            0
          ) /
          evaluations.length
        ).toFixed(1)
      : "—";

  /* =======================================================
     UI
  ======================================================= */

  return (
    <DashboardLayout>

      <PageHeader
        title="Evaluation"
        description="Evaluate submitted shows and manage evaluation decisions."
      />

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="mb-5 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 flex items-center gap-3 text-sm text-destructive">

          <AlertCircle className="h-4 w-4 shrink-0" />

          <span className="flex-1">
            {error}
          </span>

          <button
            onClick={() =>
              setError("")
            }
            className="opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      )}

      {/* ===================================================
          SUCCESS
      =================================================== */}

      {success && (
        <div className="mb-5 rounded-xl border border-success/40 bg-success/10 px-4 py-3 flex items-center gap-3 text-sm text-success">

          <CheckCircle2 className="h-4 w-4 shrink-0" />

          <span className="flex-1">
            {success}
          </span>

          <button
            onClick={() =>
              setSuccess("")
            }
            className="opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      )}

      {/* ===================================================
          LOGGED-IN USER
      =================================================== */}

      <Card className="mb-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Logged-in evaluator
            </div>

            <div className="mt-1 text-lg font-semibold">
              @{username}
            </div>

            <div className="text-xs text-muted-foreground mt-1">
              User ID:{" "}
              {evaluatorId ??
                "Unavailable"}
            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              {role ||
                "Unknown role"}
            </div>

            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Star className="h-5 w-5" />
            </div>

          </div>

        </div>

      </Card>

      {/* ===================================================
          SHOW SEARCH
      =================================================== */}

      <Card className="mb-6">

        <div className="flex flex-col lg:flex-row lg:items-end gap-4">

          <div className="flex-1">

            <label className="block">

              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Show ID
              </div>

              <input
                type="number"
                min="1"
                value={showId}
                onChange={(event) =>
                  setShowId(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    loadEvaluations();
                  }
                }}
                placeholder="Enter Show ID"
                className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />

            </label>

          </div>

          <button
            onClick={() =>
              loadEvaluations()
            }
            disabled={
              loading ||
              !showId
            }
            className="h-11 px-5 rounded-xl border border-border hover:bg-accent text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >

            <RefreshCw
              className={cn(
                "h-4 w-4",
                loading &&
                  "animate-spin"
              )}
            />

            {loading
              ? "Loading..."
              : "Load Evaluations"}

          </button>

          {canManageEvaluations && (
            <button
              onClick={openCreate}
              disabled={
                !showId ||
                !evaluatorId
              }
              className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-[var(--shadow-glow)]"
            >

              <Plus className="h-4 w-4" />

              Add Evaluation

            </button>
          )}

        </div>

      </Card>

      {/* ===================================================
          SUMMARY
      =================================================== */}

      <div className="grid md:grid-cols-3 gap-4 mb-6">

        <Metric
          label="Show ID"
          value={
            showId || "—"
          }
        />

        <Metric
          label="Total Evaluations"
          value={String(
            evaluations.length
          )}
        />

        <Metric
          label="Average Overall Score"
          value={
            averageScore ===
            "—"
              ? "—"
              : `${averageScore}/10`
          }
        />

      </div>

      {/* ===================================================
          EVALUATIONS
      =================================================== */}

      <Card className="!p-0 overflow-hidden">

        <div className="p-5 border-b border-border flex items-center justify-between">

          <div>

            <div className="text-sm font-semibold">
              Evaluations
            </div>

            <div className="text-xs text-muted-foreground mt-1">
              Evaluations for Show{" "}
              {showId || "—"}
            </div>

          </div>

          <Chip variant="info">

            {evaluations.length}{" "}
            {evaluations.length ===
            1
              ? "evaluation"
              : "evaluations"}

          </Chip>

        </div>

        {loading ? (

          <div className="py-20 text-center">

            <RefreshCw className="h-7 w-7 mx-auto animate-spin text-primary" />

            <p className="mt-3 text-sm text-muted-foreground">
              Loading evaluations...
            </p>

          </div>

        ) : evaluations.length ===
          0 ? (

          <div className="py-20 text-center">

            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary grid place-items-center">

              <Star className="h-7 w-7" />

            </div>

            <h3 className="mt-5 text-lg font-semibold">
              No evaluations found
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Enter a Show ID and
              load its evaluations,
              or create the first
              evaluation.
            </p>

            {showId &&
              canManageEvaluations && (
                <button
                  onClick={
                    openCreate
                  }
                  disabled={
                    !evaluatorId
                  }
                  className="mt-5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                >

                  <Plus className="h-4 w-4" />

                  Create Evaluation

                </button>
              )}

          </div>

        ) : (

          <div className="divide-y divide-border">

            {evaluations.map(
              (
                evaluation
              ) => (

                <div
                  key={
                    evaluation.evaluationId
                  }
                  className="p-5 hover:bg-accent/30 transition"
                >

                  <div className="flex flex-col xl:flex-row xl:items-center gap-5">

                    <div className="xl:w-24 shrink-0">

                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Evaluation
                      </div>

                      <div className="mt-1 font-bold">
                        #
                        {
                          evaluation.evaluationId
                        }
                      </div>

                    </div>

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">

                      <Score
                        label="Originality"
                        value={
                          evaluation.originalityScore
                        }
                      />

                      <Score
                        label="Creativity"
                        value={
                          evaluation.creativityScore
                        }
                      />

                      <Score
                        label="Market"
                        value={
                          evaluation.marketPotentialScore
                        }
                      />

                      <Score
                        label="Feasibility"
                        value={
                          evaluation.feasibilityScore
                        }
                      />

                      <Score
                        label="Overall"
                        value={Number(
                          evaluation.overallScore
                        )}
                        highlight
                      />

                    </div>

                    <div className="xl:w-40 shrink-0">

                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                        Decision
                      </div>

                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                          getDecisionClass(
                            evaluation.decision
                          )
                        )}
                      >
                        {
                          evaluation.decision ===
                          "REVISION_REQUIRED"
                            ? "REVISION REQUIRED"
                            : evaluation.decision
                        }
                      </span>

                    </div>

                    <div className="flex items-center gap-2">

                      <button
                        title="View evaluation"
                        onClick={() =>
                          openView(
                            evaluation
                          )
                        }
                        className="h-9 w-9 rounded-lg border border-border grid place-items-center hover:bg-accent"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {canManageEvaluations && (
                        <button
                          title="Edit evaluation"
                          onClick={() =>
                            openEdit(
                              evaluation
                            )
                          }
                          className="h-9 w-9 rounded-lg border border-border grid place-items-center hover:bg-accent"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}

                      {canDeleteEvaluations && (
                        <button
                          title="Delete evaluation"
                          onClick={() =>
                            deleteEvaluation(
                              evaluation.evaluationId
                            )
                          }
                          disabled={
                            deletingId ===
                            evaluation.evaluationId
                          }
                          className="h-9 w-9 rounded-lg border border-destructive/30 text-destructive grid place-items-center hover:bg-destructive/10 disabled:opacity-50"
                        >

                          {deletingId ===
                          evaluation.evaluationId ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}

                        </button>
                      )}

                    </div>

                  </div>

                  {evaluation.remarks && (
                    <div className="mt-4 rounded-xl bg-surface border border-border px-4 py-3">

                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Remarks
                      </div>

                      <p className="text-sm mt-1 text-muted-foreground">
                        {
                          evaluation.remarks
                        }
                      </p>

                    </div>
                  )}

                </div>
              )
            )}

          </div>
        )}

      </Card>

      {/* ===================================================
          CREATE / EDIT MODAL
      =================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">

            <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-5 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-bold">
                  {editingEvaluation
                    ? "Edit Evaluation"
                    : "Create Evaluation"}
                </h2>

                <p className="text-xs text-muted-foreground mt-1">
                  Show ID:{" "}
                  {form.showId}
                  {" • "}
                  Evaluator ID:{" "}
                  {form.evaluatorId}
                </p>

              </div>

              <button
                onClick={
                  closeForm
                }
                disabled={saving}
                className="h-9 w-9 rounded-lg hover:bg-accent grid place-items-center"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="p-6 space-y-6">

              <div className="grid md:grid-cols-2 gap-4">

                <Field
                  label="Show ID"
                  value={String(
                    form.showId
                  )}
                />

                <Field
                  label="Evaluator ID"
                  value={String(
                    form.evaluatorId
                  )}
                />

              </div>

              <div>

                <div className="text-sm font-semibold mb-4">
                  Evaluation Scores
                </div>

                <div className="grid sm:grid-cols-2 gap-4">

                  <ScoreInput
                    label="Originality"
                    value={
                      form.originalityScore
                    }
                    onChange={(
                      value
                    ) =>
                      updateIntegerScore(
                        "originalityScore",
                        value
                      )
                    }
                  />

                  <ScoreInput
                    label="Creativity"
                    value={
                      form.creativityScore
                    }
                    onChange={(
                      value
                    ) =>
                      updateIntegerScore(
                        "creativityScore",
                        value
                      )
                    }
                  />

                  <ScoreInput
                    label="Market Potential"
                    value={
                      form.marketPotentialScore
                    }
                    onChange={(
                      value
                    ) =>
                      updateIntegerScore(
                        "marketPotentialScore",
                        value
                      )
                    }
                  />

                  <ScoreInput
                    label="Feasibility"
                    value={
                      form.feasibilityScore
                    }
                    onChange={(
                      value
                    ) =>
                      updateIntegerScore(
                        "feasibilityScore",
                        value
                      )
                    }
                  />

                  <ScoreInput
                    label="Overall Score"
                    value={
                      form.overallScore
                    }
                    onChange={
                      updateOverallScore
                    }
                    highlight
                    decimal
                  />

                </div>

              </div>

              <div>

                <label className="block">

                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Decision *
                  </div>

                  <select
                    value={
                      form.decision
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          decision:
                            event
                              .target
                              .value as EvaluationDecision,
                        })
                      )
                    }
                    className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >

                    <option value="">
                      Select decision
                    </option>

                    {DECISIONS.map(
                      (
                        decision
                      ) => (
                        <option
                          key={
                            decision.value
                          }
                          value={
                            decision.value
                          }
                        >
                          {
                            decision.label
                          }
                        </option>
                      )
                    )}

                  </select>

                </label>

              </div>

              <div>

                <label className="block">

                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Remarks
                  </div>

                  <textarea
                    value={
                      form.remarks
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          remarks:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    maxLength={2000}
                    rows={5}
                    placeholder="Enter evaluation remarks..."
                    className="w-full px-3.5 py-3 rounded-xl bg-surface border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />

                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {
                      form.remarks
                        .length
                    }
                    /2000
                  </div>

                </label>

              </div>

            </div>

            <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex justify-end gap-3">

              <button
                onClick={
                  closeForm
                }
                disabled={saving}
                className="h-10 px-5 rounded-xl border border-border hover:bg-accent text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={
                  saveEvaluation
                }
                disabled={
                  saving ||
                  !form.decision
                }
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
              >

                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving
                  ? "Saving..."
                  : editingEvaluation
                    ? "Update Evaluation"
                    : "Create Evaluation"}

              </button>

            </div>

          </div>

        </div>
      )}

      {/* ===================================================
          VIEW EVALUATION + COMMENTS
      =================================================== */}

      {viewingEvaluation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-20 bg-background px-6 py-5 border-b border-border flex items-center justify-between">

              <div>

                <h2 className="text-lg font-bold">
                  Evaluation Details
                </h2>

                <p className="text-xs text-muted-foreground mt-1">
                  Evaluation #
                  {
                    viewingEvaluation.evaluationId
                  }
                </p>

              </div>

              <button
                onClick={
                  closeView
                }
                className="h-9 w-9 rounded-lg hover:bg-accent grid place-items-center"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* BODY */}

            <div className="p-6 space-y-6">

              {/* DETAILS */}

              <div className="grid sm:grid-cols-2 gap-4">

                <Detail
                  label="Evaluation ID"
                  value={String(
                    viewingEvaluation.evaluationId
                  )}
                />

                <Detail
                  label="Decision"
                  value={
                    viewingEvaluation.decision
                  }
                  badge
                />

                <Detail
                  label="Originality"
                  value={`${viewingEvaluation.originalityScore}/10`}
                  score
                />

                <Detail
                  label="Creativity"
                  value={`${viewingEvaluation.creativityScore}/10`}
                  score
                />

                <Detail
                  label="Market Potential"
                  value={`${viewingEvaluation.marketPotentialScore}/10`}
                  score
                />

                <Detail
                  label="Feasibility"
                  value={`${viewingEvaluation.feasibilityScore}/10`}
                  score
                />

                <Detail
                  label="Overall Score"
                  value={`${viewingEvaluation.overallScore}/10`}
                  score
                />

              </div>

              {/* REMARKS */}

              <div className="rounded-xl border border-border p-4">

                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Remarks
                </div>

                <p className="mt-2 text-sm leading-6">
                  {viewingEvaluation.remarks ||
                    "No remarks provided."}
                </p>

              </div>

              {/* =================================================
                  COMMENTS
              ================================================= */}

              <div className="rounded-2xl border border-border overflow-hidden">

                {/* HEADER */}

                <div className="px-5 py-4 border-b border-border flex items-center justify-between">

                  <div>

                    <div className="flex items-center gap-2">

                      <MessageSquare className="h-4 w-4 text-primary" />

                      <span className="text-sm font-semibold">
                        Evaluation Comments
                      </span>

                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      Discussion and feedback for this evaluation.
                    </p>

                  </div>

                  <Chip variant="info">

                    {comments.length}{" "}
                    {comments.length ===
                    1
                      ? "comment"
                      : "comments"}

                  </Chip>

                </div>

                {/* BODY */}

                <div className="p-5 space-y-4">

                  {commentsLoading ? (

                    <div className="py-8 text-center">

                      <RefreshCw className="h-6 w-6 mx-auto animate-spin text-primary" />

                      <p className="mt-2 text-xs text-muted-foreground">
                        Loading comments...
                      </p>

                    </div>

                  ) : comments.length ===
                    0 ? (

                    <div className="py-8 text-center">

                      <div className="mx-auto h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">

                        <MessageSquare className="h-5 w-5" />

                      </div>

                      <p className="mt-3 text-sm font-medium">
                        No comments yet
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Add the first comment for this evaluation.
                      </p>

                    </div>

                  ) : (

                    <div className="space-y-3">

                      {comments.map(
                        (
                          comment
                        ) => (

                          <div
                            key={
                              comment.commentId
                            }
                            className="rounded-xl border border-border bg-surface p-4"
                          >

                            <div className="flex items-start justify-between gap-4">

                              <div className="flex items-center gap-2">

                                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center text-xs font-bold">
                                  {comment.userId}
                                </div>

                                <div>

                                  <div className="text-xs font-semibold">
                                    User #
                                    {
                                      comment.userId
                                    }
                                  </div>

                                  <div className="text-[10px] text-muted-foreground">
                                    Comment #
                                    {
                                      comment.commentId
                                    }
                                  </div>

                                </div>

                              </div>

                              {canDeleteComments && (
                                <button
                                  title="Delete comment"
                                  onClick={() =>
                                    deleteComment(
                                      comment.commentId
                                    )
                                  }
                                  disabled={
                                    commentDeletingId ===
                                    comment.commentId
                                  }
                                  className="h-8 w-8 rounded-lg border border-destructive/30 text-destructive grid place-items-center hover:bg-destructive/10 disabled:opacity-50"
                                >

                                  {commentDeletingId ===
                                  comment.commentId ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}

                                </button>
                              )}

                            </div>

                            <p className="mt-3 text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
                              {
                                comment.comment
                              }
                            </p>

                          </div>

                        )
                      )}

                    </div>
                  )}

                  {/* =================================================
                      ADD COMMENT
                  ================================================= */}

                  {canManageComments && (
                    <div className="pt-4 border-t border-border">

                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                        Add Comment
                      </div>

                      <textarea
                        value={
                          commentText
                        }
                        onChange={(
                          event
                        ) =>
                          setCommentText(
                            event.target.value
                          )
                        }
                        maxLength={2000}
                        rows={4}
                        placeholder="Write your evaluation comment..."
                        className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      />

                      <div className="flex items-center justify-between mt-2">

                        <span className="text-[11px] text-muted-foreground">
                          {
                            commentText.length
                          }
                          /2000
                        </span>

                        <button
                          onClick={
                            addComment
                          }
                          disabled={
                            commentSaving ||
                            !commentText.trim() ||
                            !evaluatorId
                          }
                          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                        >

                          {commentSaving ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}

                          {commentSaving
                            ? "Adding..."
                            : "Add Comment"}

                        </button>

                      </div>

                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="px-6 py-4 border-t border-border flex justify-end">

              <button
                onClick={
                  closeView
                }
                className="h-10 px-5 rounded-xl border border-border hover:bg-accent text-sm font-semibold"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </DashboardLayout>
  );
}

/* =========================================================
   METRIC
========================================================= */

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card>

      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold">
        {value}
      </div>

    </Card>
  );
}

/* =========================================================
   SCORE
========================================================= */

function Score({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const numericValue =
    Number(value ?? 0);

  return (
    <div className="rounded-xl border border-border p-3">

      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>

      <div
        className={cn(
          "mt-1 text-lg font-bold",
          getScoreClass(
            numericValue
          ),
          highlight &&
            "text-xl"
        )}
      >

        {numericValue.toFixed(
          highlight ? 1 : 0
        )}

        <span className="text-xs text-muted-foreground font-normal">
          /10
        </span>

      </div>

    </div>
  );
}

/* =========================================================
   SCORE INPUT
========================================================= */

function ScoreInput({
  label,
  value,
  onChange,
  highlight = false,
  decimal = false,
}: {
  label: string;
  value: number;
  onChange: (
    value: string
  ) => void;
  highlight?: boolean;
  decimal?: boolean;
}) {
  return (
    <label className="block">

      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>

      <div className="relative">

        <input
          type="number"
          min="0"
          max="10"
          step={
            decimal
              ? "0.1"
              : "1"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className={cn(
            "w-full h-11 px-3.5 pr-12 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring",
            highlight &&
              "border-primary/50"
          )}
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          /10
        </span>

      </div>

    </label>
  );
}

/* =========================================================
   READ ONLY FIELD
========================================================= */

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <label className="block">

      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>

      <input
        type="text"
        value={value}
        disabled
        readOnly
        className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border text-sm opacity-70"
      />

    </label>
  );
}

/* =========================================================
   DETAIL
========================================================= */

function Detail({
  label,
  value,
  badge = false,
  score = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
  score?: boolean;
}) {
  const numericScore =
    Number(
      value.replace(
        "/10",
        ""
      )
    );

  return (
    <div className="rounded-xl border border-border p-4">

      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>

      {badge ? (

        <div className="mt-2">

          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
              getDecisionClass(
                value
              )
            )}
          >

            {value ===
            "REVISION_REQUIRED"
              ? "REVISION REQUIRED"
              : value}

          </span>

        </div>

      ) : (

        <div
          className={cn(
            "mt-2 font-semibold",
            score &&
              getScoreClass(
                numericScore
              )
          )}
        >
          {value}
        </div>

      )}

    </div>
  );
}

export default EvaluationPage;
import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  DashboardLayout,
  PageHeader,
} from "@/components/layout/DashboardLayout";

import { Card } from "@/components/ui-kit";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clapperboard,
  DollarSign,
  FileText,
  PartyPopper,
  Send,
} from "lucide-react";

import { useState } from "react";

import {
  createShow,
  type ShowRequest,
} from "@/api/shows";

export const Route = createFileRoute(
  "/shows/new"
)({
  head: () => ({
    meta: [
      {
        title:
          "Submit a Show — Netflix Show Manager",
      },
      {
        name: "description",
        content:
          "Submit a new original show for evaluation and production.",
      },
    ],
  }),

  component: NewShow,
});

const steps = [
  {
    id: 1,
    label: "Basic Info",
  },
  {
    id: 2,
    label: "Budget & Release",
  },
  {
    id: 3,
    label: "Review",
  },
];

interface FormState {
  title: string;
  description: string;
  synopsis: string;
  language: string;
  targetAudience: string;
  estimatedBudget: string;
  expectedReleaseDate: string;
}

function getCurrentUserId(): number | null {
  try {
    const stored =
      localStorage.getItem(
        "streamforge_user"
      );

    if (!stored) return null;

    const user = JSON.parse(stored);

    return (
      Number(
        user.userId ??
          user.id ??
          user.user_id
      ) || null
    );
  } catch {
    return null;
  }
}

function NewShow() {
  const [step, setStep] = useState(1);

  const [submitted, setSubmitted] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState<FormState>({
      title: "",
      description: "",
      synopsis: "",
      language: "",
      targetAudience: "",
      estimatedBudget: "",
      expectedReleaseDate: "",
    });

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateStep() {
    setError("");

    if (step === 1) {
      if (!form.title.trim()) {
        setError(
          "Show title is required."
        );
        return false;
      }

      if (form.title.trim().length < 2) {
        setError(
          "Show title must contain at least 2 characters."
        );
        return false;
      }
    }

    if (step === 2) {
      if (
        form.estimatedBudget &&
        Number(form.estimatedBudget) < 0
      ) {
        setError(
          "Estimated budget cannot be negative."
        );
        return false;
      }

      if (form.expectedReleaseDate) {
        const selected =
          new Date(
            `${form.expectedReleaseDate}T00:00:00`
          );

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        if (selected < today) {
          setError(
            "Expected release date cannot be in the past."
          );
          return false;
        }
      }
    }

    return true;
  }

  function nextStep() {
    if (!validateStep()) return;

    setStep((current) =>
      Math.min(
        steps.length,
        current + 1
      )
    );
  }

  function previousStep() {
    setError("");

    setStep((current) =>
      Math.max(1, current - 1)
    );
  }

  async function submitShow() {
    setError("");

    const creatorId =
      getCurrentUserId();

    if (!creatorId) {
      setError(
        "Unable to identify the logged-in user. Please sign in again."
      );
      return;
    }

    if (!form.title.trim()) {
      setError(
        "Show title is required."
      );
      setStep(1);
      return;
    }

    try {
      setLoading(true);

      const request: ShowRequest = {
        title: form.title.trim(),

        description:
          form.description.trim() || undefined,

        synopsis:
          form.synopsis.trim() || undefined,

        language:
          form.language.trim() || undefined,

        targetAudience:
          form.targetAudience.trim() ||
          undefined,

        estimatedBudget:
          form.estimatedBudget
            ? Number(form.estimatedBudget)
            : undefined,

        expectedReleaseDate:
          form.expectedReleaseDate ||
          undefined,

        status: "PENDING",

        creatorId,
      };

      await createShow(request);

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit show."
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <Card className="max-w-lg text-center py-12">
            <div className="mx-auto h-16 w-16 grid place-items-center rounded-2xl bg-success/15 text-success mb-6 animate-pulse-glow">
              <PartyPopper className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-bold">
              Show submitted successfully!
            </h2>

            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Your show has been submitted to the
              evaluation workflow.
            </p>

            <div className="mt-8 flex justify-center gap-2">
              <Link
                to="/shows"
                className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center hover:bg-accent transition"
              >
                Back to shows
              </Link>

              <Link
                to="/dashboard"
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center hover:opacity-90 transition"
              >
                Dashboard
              </Link>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Submit a Show"
        description="Share your vision. Your submission will be routed to the content team for evaluation."
      />

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
        <Card className="h-fit lg:sticky lg:top-24">
          <ol className="space-y-5">
            {steps.map((item) => {
              const active =
                item.id === step;

              const complete =
                item.id < step;

              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`h-9 w-9 rounded-full grid place-items-center text-xs font-bold shrink-0 ${
                      complete
                        ? "bg-success text-success-foreground"
                        : active
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {complete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      item.id
                    )}
                  </div>

                  <div>
                    <div
                      className={`text-sm font-medium ${
                        active
                          ? ""
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </div>

                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Step {item.id}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card>
          {error && (
            <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <Step1
              form={form}
              updateField={updateField}
            />
          )}

          {step === 2 && (
            <Step2
              form={form}
              updateField={updateField}
            />
          )}

          {step === 3 && (
            <Step3 form={form} />
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={previousStep}
              disabled={step === 1 || loading}
              className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {step < steps.length ? (
              <button
                onClick={nextStep}
                disabled={loading}
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition shadow-[var(--shadow-glow)] disabled:opacity-50"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={submitShow}
                disabled={loading}
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition shadow-[var(--shadow-glow)] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit for review
                  </>
                )}
              </button>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Step1({
  form,
  updateField,
}: {
  form: FormState;
  updateField: (
    field: keyof FormState,
    value: string
  ) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <Clapperboard className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold">
            Basic Information
          </h3>

          <p className="text-xs text-muted-foreground">
            Tell us about your original.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Fld label="Show title *">
          <input
            value={form.title}
            onChange={(e) =>
              updateField(
                "title",
                e.target.value
              )
            }
            placeholder="Enter show title"
            className={inputCls}
          />
        </Fld>

        <Fld label="Language">
          <input
            value={form.language}
            onChange={(e) =>
              updateField(
                "language",
                e.target.value
              )
            }
            placeholder="English"
            className={inputCls}
          />
        </Fld>

        <Fld label="Target audience">
          <input
            value={form.targetAudience}
            onChange={(e) =>
              updateField(
                "targetAudience",
                e.target.value
              )
            }
            placeholder="18-49"
            className={inputCls}
          />
        </Fld>
      </div>

      <Fld label="Synopsis">
        <textarea
          rows={5}
          value={form.synopsis}
          onChange={(e) =>
            updateField(
              "synopsis",
              e.target.value
            )
          }
          placeholder="Give us the story synopsis..."
          className={textareaCls}
        />
      </Fld>

      <Fld label="Description">
        <textarea
          rows={5}
          value={form.description}
          onChange={(e) =>
            updateField(
              "description",
              e.target.value
            )
          }
          placeholder="Describe the show, concept, characters and vision..."
          className={textareaCls}
        />
      </Fld>
    </div>
  );
}

function Step2({
  form,
  updateField,
}: {
  form: FormState;
  updateField: (
    field: keyof FormState,
    value: string
  ) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <DollarSign className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold">
            Budget & Release
          </h3>

          <p className="text-xs text-muted-foreground">
            Provide the expected production budget
            and release date.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Fld label="Estimated budget (USD)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.estimatedBudget}
            onChange={(e) =>
              updateField(
                "estimatedBudget",
                e.target.value
              )
            }
            placeholder="12500000"
            className={inputCls}
          />
        </Fld>

        <Fld label="Expected release date">
          <input
            type="date"
            value={form.expectedReleaseDate}
            onChange={(e) =>
              updateField(
                "expectedReleaseDate",
                e.target.value
              )
            }
            className={inputCls}
          />
        </Fld>
      </div>

      <div className="rounded-xl border border-border bg-surface/50 p-4">
        <div className="text-sm font-medium">
          Submission status
        </div>

        <div className="text-xs text-muted-foreground mt-1">
          New submissions will be created with
          <span className="text-primary font-semibold">
            {" "}
            PENDING
          </span>{" "}
          status and routed through your evaluation
          workflow.
        </div>
      </div>
    </div>
  );
}

function Step3({
  form,
}: {
  form: FormState;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <FileText className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold">
            Review Submission
          </h3>

          <p className="text-xs text-muted-foreground">
            Check everything before submitting.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border divide-y divide-border">
        <ReviewRow
          label="Title"
          value={form.title || "—"}
        />

        <ReviewRow
          label="Language"
          value={form.language || "—"}
        />

        <ReviewRow
          label="Target audience"
          value={
            form.targetAudience || "—"
          }
        />

        <ReviewRow
          label="Estimated budget"
          value={
            form.estimatedBudget
              ? `$${Number(
                  form.estimatedBudget
                ).toLocaleString()}`
              : "—"
          }
        />

        <ReviewRow
          label="Expected release"
          value={
            form.expectedReleaseDate ||
            "—"
          }
        />
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Synopsis
        </div>

        <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground leading-6">
          {form.synopsis || "No synopsis provided."}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Description
        </div>

        <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground leading-6">
          {form.description ||
            "No description provided."}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        By submitting, you confirm that the information
        is accurate. The show will be created under
        your logged-in account and submitted with
        PENDING status.
      </p>
    </div>
  );
}

function Fld({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>

      {children}
    </label>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 text-sm">
      <span className="text-muted-foreground">
        {label}
      </span>

      <span className="font-medium text-right">
        {value}
      </span>
    </div>
  );
}

const inputCls =
  "w-full h-11 px-3.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition";

const textareaCls =
  "w-full min-h-32 px-3.5 py-3 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition resize-y";
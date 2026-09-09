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
  Loader2,
  PartyPopper,
  Send,
} from "lucide-react";

import { useEffect, useState } from "react";

import {
  createShow,
  type ShowRequest,
} from "@/api/shows";

import { apiRequest } from "@/api/client";

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

interface Genre {
  genreId: number;
  genreName: string;
  description?: string;
}

interface FormState {
  title: string;
  description: string;
  synopsis: string;
  language: string;
  targetAudience: string;
  episodeCount: string;
  genreIds: number[];
  estimatedBudget: string;
  expectedReleaseDate: string;
}

function getCurrentUserId(): number | null {
  try {
    const storages = [
      localStorage,
      sessionStorage,
    ];

    for (const storage of storages) {
      const stored =
        storage.getItem(
          "streamforge_user"
        );

      if (!stored) {
        continue;
      }

      const user = JSON.parse(stored);

      const id = Number(
        user?.userId ??
          user?.id ??
          user?.user_id
      );

      if (
        Number.isInteger(id) &&
        id > 0
      ) {
        return id;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function NewShow() {
  const [step, setStep] =
    useState(1);

  const [submitted, setSubmitted] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [loadingGenres, setLoadingGenres] =
    useState(true);

  const [error, setError] =
    useState("");

  const [genres, setGenres] =
    useState<Genre[]>([]);

  const [form, setForm] =
    useState<FormState>({
      title: "",
      description: "",
      synopsis: "",
      language: "",
      targetAudience: "",
      episodeCount: "",
      genreIds: [],
      estimatedBudget: "",
      expectedReleaseDate: "",
    });

  /*
   * Load genres from the actual backend.
   */
  useEffect(() => {
    let mounted = true;

    async function loadGenres() {
      try {
        setLoadingGenres(true);
        setError("");

        const response =
          await apiRequest<Genre[]>(
            "/api/genres"
          );

        if (!mounted) {
          return;
        }

        setGenres(
          Array.isArray(response)
            ? response
            : []
        );
      } catch (err) {
        if (!mounted) {
          return;
        }

        setGenres([]);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load genres."
        );
      } finally {
        if (mounted) {
          setLoadingGenres(false);
        }
      }
    }

    void loadGenres();

    return () => {
      mounted = false;
    };
  }, []);

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function toggleGenre(
    genreId: number
  ) {
    setForm((current) => {
      const exists =
        current.genreIds.includes(
          genreId
        );

      return {
        ...current,
        genreIds: exists
          ? current.genreIds.filter(
              (id) =>
                id !== genreId
            )
          : [
              ...current.genreIds,
              genreId,
            ],
      };
    });

    setError("");
  }

  function validateStep() {
    setError("");

    /*
     * STEP 1
     */
    if (step === 1) {
      const title =
        form.title.trim();

      if (!title) {
        setError(
          "Show title is required."
        );
        return false;
      }

      if (title.length < 2) {
        setError(
          "Show title must contain at least 2 characters."
        );
        return false;
      }

      if (title.length > 200) {
        setError(
          "Show title cannot exceed 200 characters."
        );
        return false;
      }

      if (!form.targetAudience.trim()) {
        setError(
          "Target audience is required."
        );
        return false;
      }

      const episodeCount =
        Number(form.episodeCount);

      if (
        !form.episodeCount ||
        !Number.isInteger(
          episodeCount
        ) ||
        episodeCount <= 0
      ) {
        setError(
          "Episode count must be a whole number greater than zero."
        );
        return false;
      }

      if (
        form.genreIds.length === 0
      ) {
        setError(
          "Please select at least one genre."
        );
        return false;
      }
    }

    /*
     * STEP 2
     */
    if (step === 2) {
      if (
        form.estimatedBudget &&
        (
          !Number.isFinite(
            Number(
              form.estimatedBudget
            )
          ) ||
          Number(
            form.estimatedBudget
          ) < 0
        )
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

        const today =
          new Date();

        today.setHours(
          0,
          0,
          0,
          0
        );

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
    if (!validateStep()) {
      return;
    }

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
      Math.max(
        1,
        current - 1
      )
    );
  }

  async function submitShow() {
    setError("");

    /*
     * Final validation before API call.
     */
    const previousStepValue =
      step;

    setStep(1);

    if (!validateAll()) {
      setStep(
        previousStepValue
      );
      return;
    }

    const creatorId =
      getCurrentUserId();

    if (!creatorId) {
      setError(
        "Unable to identify the logged-in user. Please sign in again."
      );
      return;
    }

    try {
      setLoading(true);

      const request: ShowRequest = {
        title:
          form.title.trim(),

        description:
          form.description.trim() ||
          undefined,

        synopsis:
          form.synopsis.trim() ||
          undefined,

        language:
          form.language.trim() ||
          undefined,

        targetAudience:
          form.targetAudience.trim(),

        episodeCount:
          Number(
            form.episodeCount
          ),

        genreIds:
          form.genreIds,

        estimatedBudget:
          form.estimatedBudget
            ? Number(
                form.estimatedBudget
              )
            : undefined,

        expectedReleaseDate:
          form.expectedReleaseDate ||
          undefined,

        /*
         * Backend now controls the
         * initial workflow status.
         */
        creatorId,
      };

      await createShow(
        request
      );

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

  function validateAll() {
    /*
     * Title
     */
    const title =
      form.title.trim();

    if (!title) {
      setError(
        "Show title is required."
      );
      return false;
    }

    if (
      title.length < 2 ||
      title.length > 200
    ) {
      setError(
        "Show title must be between 2 and 200 characters."
      );
      return false;
    }

    /*
     * Target audience
     */
    if (!form.targetAudience.trim()) {
      setError(
        "Target audience is required."
      );
      return false;
    }

    /*
     * Episodes
     */
    const episodeCount =
      Number(form.episodeCount);

    if (
      !Number.isInteger(
        episodeCount
      ) ||
      episodeCount <= 0
    ) {
      setError(
        "Episode count must be a whole number greater than zero."
      );
      return false;
    }

    /*
     * Genres
     */
    if (
      form.genreIds.length === 0
    ) {
      setError(
        "Please select at least one genre."
      );
      return false;
    }

    /*
     * Budget
     */
    if (
      form.estimatedBudget &&
      (
        !Number.isFinite(
          Number(
            form.estimatedBudget
          )
        ) ||
        Number(
          form.estimatedBudget
        ) < 0
      )
    ) {
      setError(
        "Estimated budget cannot be negative."
      );
      return false;
    }

    /*
     * Release date
     */
    if (form.expectedReleaseDate) {
      const selected =
        new Date(
          `${form.expectedReleaseDate}T00:00:00`
        );

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      if (selected < today) {
        setError(
          "Expected release date cannot be in the past."
        );
        return false;
      }
    }

    return true;
  }

  function getGenreNames() {
    return form.genreIds
      .map(
        (id) =>
          genres.find(
            (genre) =>
              genre.genreId === id
          )?.genreName
      )
      .filter(
        Boolean
      )
      .join(", ");
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
              Your show has been submitted
              to the evaluation workflow.
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
        <Card className="h-fit sticky top-24">
          <ol className="space-y-4">
            {steps.map((s) => {
              const active =
                s.id === step;

              const complete =
                s.id < step;

              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`h-8 w-8 rounded-full grid place-items-center text-xs font-bold shrink-0 ${
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
                      s.id
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
                      {s.label}
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      {s.id === 1 &&
                        "Tell us about your concept"}

                      {s.id === 2 &&
                        "Plan your release"}

                      {s.id === 3 &&
                        "Confirm submission"}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card>
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {step === 1 && (
            <Step1
              form={form}
              genres={genres}
              loadingGenres={
                loadingGenres
              }
              updateField={
                updateField
              }
              toggleGenre={
                toggleGenre
              }
            />
          )}

          {step === 2 && (
            <Step2
              form={form}
              updateField={
                updateField
              }
            />
          )}

          {step === 3 && (
            <Step3
              form={form}
              genreNames={
                getGenreNames()
              }
            />
          )}

          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={
                  previousStep
                }
                disabled={loading}
                className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <Link
                to="/shows"
                className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-accent transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Link>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  submitShow
                }
                disabled={loading}
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Show
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

/* =========================================================
   STEP 1
========================================================= */

function Step1({
  form,
  genres,
  loadingGenres,
  updateField,
  toggleGenre,
}: {
  form: FormState;
  genres: Genre[];
  loadingGenres: boolean;
  updateField: (
    field: keyof FormState,
    value: string
  ) => void;
  toggleGenre: (
    genreId: number
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <Clapperboard className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold">
            Basic Information
          </h3>

          <p className="text-xs text-muted-foreground">
            Define the core details of your show.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Fld label="Show title *">
          <input
            value={form.title}
            onChange={(e) =>
              updateField(
                "title",
                e.target.value
              )
            }
            placeholder="Enter your show title"
            maxLength={200}
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
            placeholder="e.g. English"
            maxLength={50}
            className={inputCls}
          />
        </Fld>

        <Fld label="Target audience *">
          <input
            value={
              form.targetAudience
            }
            onChange={(e) =>
              updateField(
                "targetAudience",
                e.target.value
              )
            }
            placeholder="e.g. Young Adults"
            maxLength={100}
            className={inputCls}
          />
        </Fld>

        <Fld label="Episode count *">
          <input
            type="number"
            min={1}
            step={1}
            value={
              form.episodeCount
            }
            onChange={(e) =>
              updateField(
                "episodeCount",
                e.target.value
              )
            }
            placeholder="e.g. 10"
            className={inputCls}
          />
        </Fld>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">
          Genres *
        </div>

        <div className="text-xs text-muted-foreground mb-3">
          Select one or more genres.
        </div>

        {loadingGenres ? (
          <div className="rounded-xl border border-border p-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading available genres...
          </div>
        ) : genres.length === 0 ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
            No genres are available from
            the backend.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {genres.map(
              (genre) => {
                const selected =
                  form.genreIds.includes(
                    genre.genreId
                  );

                return (
                  <button
                    key={
                      genre.genreId
                    }
                    type="button"
                    onClick={() =>
                      toggleGenre(
                        genre.genreId
                      )
                    }
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-accent"
                    }`}
                    title={
                      genre.description ??
                      genre.genreName
                    }
                  >
                    {selected && (
                      <Check className="inline h-3.5 w-3.5 mr-1" />
                    )}

                    {
                      genre.genreName
                    }
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>

      <Fld label="Synopsis">
        <textarea
          value={form.synopsis}
          onChange={(e) =>
            updateField(
              "synopsis",
              e.target.value
            )
          }
          placeholder="Describe the story and creative vision..."
          rows={5}
          maxLength={2000}
          className={`${inputCls} resize-none`}
        />
      </Fld>

      <Fld label="Description">
        <textarea
          value={form.description}
          onChange={(e) =>
            updateField(
              "description",
              e.target.value
            )
          }
          placeholder="Additional information about the show..."
          rows={4}
          maxLength={2000}
          className={`${inputCls} resize-none`}
        />
      </Fld>
    </div>
  );
}

/* =========================================================
   STEP 2
========================================================= */

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <DollarSign className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold">
            Budget & Release
          </h3>

          <p className="text-xs text-muted-foreground">
            Provide planning information for the submission.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Fld label="Estimated budget">
          <input
            type="number"
            min={0}
            step="0.01"
            value={
              form.estimatedBudget
            }
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
            min={
              new Date()
                .toISOString()
                .split("T")[0]
            }
            value={
              form.expectedReleaseDate
            }
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
          Submission workflow
        </div>

        <div className="text-xs text-muted-foreground mt-1">
          Your show will be created as{" "}
          <span className="text-primary font-semibold">
            SUBMITTED
          </span>{" "}
          and routed through the evaluation
          workflow.
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STEP 3
========================================================= */

function Step3({
  form,
  genreNames,
}: {
  form: FormState;
  genreNames: string;
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
          value={
            form.title ||
            "—"
          }
        />

        <ReviewRow
          label="Genres"
          value={
            genreNames ||
            "—"
          }
        />

        <ReviewRow
          label="Language"
          value={
            form.language ||
            "—"
          }
        />

        <ReviewRow
          label="Target audience"
          value={
            form.targetAudience ||
            "—"
          }
        />

        <ReviewRow
          label="Episode count"
          value={
            form.episodeCount ||
            "—"
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
          {form.synopsis ||
            "No synopsis provided."}
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
        By submitting, you confirm that the
        information is accurate. The show will
        be created under your logged-in account
        and routed into the evaluation workflow.
      </p>
    </div>
  );
}

/* =========================================================
   SMALL UI HELPERS
========================================================= */

function Fld({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-2">
        {label}
      </label>

      {children}
    </div>
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>

      <span className="text-sm font-medium sm:text-right">
        {value}
      </span>
    </div>
  );
}

const inputCls =
  "w-full h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
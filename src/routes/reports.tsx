import { createFileRoute } from "@tanstack/react-router";

import {
  DashboardLayout,
  PageHeader,
} from "@/components/layout/DashboardLayout";

import { Card } from "@/components/ui-kit";

import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Lock,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { cn } from "@/lib/utils";

import { useRole } from "@/lib/roles";

import {
  apiRequest,
  downloadFile,
} from "@/lib/api";


// ============================================================
// ROUTE
// ============================================================

export const Route = createFileRoute(
  "/reports"
)({
  head: () => ({
    meta: [
      {
        title:
          "Reports — Netflix Show Manager",
      },
      {
        name: "description",
        content:
          "Generate and manage reports across the content lifecycle.",
      },
    ],
  }),

  component: ReportsPage,
});


// ============================================================
// TYPES
// ============================================================

type ReportFormat =
  | "PDF"
  | "CSV"
  | "XLSX";


interface Report {
  reportId: number;

  reportName: string;

  reportType: string;

  filePath?: string | null;

  format?: string | null;
}


interface StoredUser {
  userId?: number;

  id?: number;

  user_id?: number;

  fullName?: string;

  username?: string;

  email?: string;
}


// ============================================================
// REPORT TEMPLATES
// ============================================================

const REPORT_TEMPLATES = [
  {
    id: "content",

    name:
      "Content Pipeline Report",

    type:
      "CONTENT",

    description:
      "Submissions, approvals and rejection analysis.",

    icon:
      FileBarChart,
  },

  {
    id: "budget",

    name:
      "Budget Utilisation Report",

    type:
      "BUDGET",

    description:
      "Allocated and actual production budget analysis.",

    icon:
      FileSpreadsheet,
  },

  {
    id: "production",

    name:
      "Production Health Report",

    type:
      "PRODUCTION",

    description:
      "Production status and workflow analysis.",

    icon:
      FileText,
  },

  {
    id: "roi",

    name:
      "ROI & Forecast Report",

    type:
      "ROI",

    description:
      "Business performance and forecast analysis.",

    icon:
      Sparkles,
  },
];


// ============================================================
// GET STORED USER
// ============================================================

function getStoredUser():
  StoredUser | null {

  try {

    const raw =
      localStorage.getItem(
        "streamforge_user"
      ) ??
      sessionStorage.getItem(
        "streamforge_user"
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(
      raw
    ) as StoredUser;

  } catch (error) {

    console.error(
      "Unable to read stored user:",
      error
    );

    return null;
  }
}


// ============================================================
// GET USER ID
// ============================================================

function getUserId(
  user: StoredUser | null
): number | null {

  if (!user) {
    return null;
  }

  const rawId =
    user.userId ??
    user.id ??
    user.user_id;

  if (
    rawId === undefined ||
    rawId === null
  ) {
    return null;
  }

  const id =
    Number(rawId);

  if (
    !Number.isFinite(id) ||
    id <= 0
  ) {
    return null;
  }

  return id;
}


// ============================================================
// FORMAT
// ============================================================

function getFormat(
  report: Report
): string {

  if (report.format) {

    return report.format
      .toUpperCase();
  }

  const path =
    report.filePath ??
    "";

  const lower =
    path.toLowerCase();

  if (
    lower.endsWith(".pdf")
  ) {
    return "PDF";
  }

  if (
    lower.endsWith(".csv")
  ) {
    return "CSV";
  }

  if (
    lower.endsWith(".xlsx")
  ) {
    return "XLSX";
  }

  return "FILE";
}


// ============================================================
// ROUTE PAGE
// ============================================================

function ReportsPage() {

  /*
   * IMPORTANT:
   *
   * Do NOT destructure profile here.
   *
   * Reports only needs the permission checker.
   */
  const {
    can,
  } = useRole();


  // ==========================================================
  // STATE
  // ==========================================================

  const [
    selectedTemplate,
    setSelectedTemplate,
  ] = useState(
    REPORT_TEMPLATES[0]
  );


  const [
    selectedFormat,
    setSelectedFormat,
  ] = useState<ReportFormat>(
    "PDF"
  );


  const [
    reports,
    setReports,
  ] = useState<Report[]>(
    []
  );


  const [
    loading,
    setLoading,
  ] = useState(
    true
  );


  const [
    generating,
    setGenerating,
  ] = useState(
    false
  );


  const [
    downloadingId,
    setDownloadingId,
  ] = useState<
    number | null
  >(null);


  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);


  const [
    success,
    setSuccess,
  ] = useState<
    string | null
  >(null);


  const [
    selectedReport,
    setSelectedReport,
  ] = useState<
    Report | null
  >(null);


  const [
    user,
    setUser,
  ] = useState<
    StoredUser | null
  >(null);


  // ==========================================================
  // USER ID
  // ==========================================================

  const userId =
    useMemo(
      () =>
        getUserId(user),
      [user]
    );


  // ==========================================================
  // INITIAL USER LOAD
  // ==========================================================

  useEffect(() => {

    setUser(
      getStoredUser()
    );

  }, []);


  // ==========================================================
  // LOAD REPORTS
  // ==========================================================

  const loadReports =
    useCallback(
      async () => {

        setLoading(
          true
        );

        setError(
          null
        );


        try {

          const storedUser =
            getStoredUser();

          setUser(
            storedUser
          );


          const id =
            getUserId(
              storedUser
            );


          if (!id) {

            setReports(
              []
            );

            setError(
              "Unable to identify the logged-in user. Please login again."
            );

            return;
          }


          const data =
            await apiRequest<
              Report[]
            >(
              `/api/reports/user/${id}`,
              {
                method:
                  "GET",
              }
            );


          setReports(
            Array.isArray(data)
              ? data
              : []
          );

        } catch (err) {

          console.error(
            "Failed to load reports:",
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : "Failed to load reports."
          );

        } finally {

          setLoading(
            false
          );
        }

      },
      []
    );


  useEffect(() => {

    void loadReports();

  }, [loadReports]);


  // ==========================================================
  // GENERATE REPORT
  // ==========================================================

  async function handleGenerateReport() {

    setError(
      null
    );

    setSuccess(
      null
    );


    const currentUser =
      getStoredUser();


    const currentUserId =
      getUserId(
        currentUser
      );


    if (!currentUserId) {

      setError(
        "Unable to identify the logged-in user. Please login again."
      );

      return;
    }


    setGenerating(
      true
    );


    try {

      const payload = {

        userId:
          currentUserId,

        reportName:
          selectedTemplate.name,

        reportType:
          selectedTemplate.type,

        format:
          selectedFormat,
      };


      console.log(
        "Generating StreamForge report:",
        payload
      );


      await apiRequest<Report>(
        "/api/reports/generate",
        {
          method:
            "POST",

          body:
            JSON.stringify(
              payload
            ),
        }
      );


      setSuccess(
        `${selectedTemplate.name} generated successfully.`
      );


      /*
       * Reload directly from database.
       *
       * This guarantees that the new
       * filePath returned by backend is used.
       */
      await loadReports();

    } catch (err) {

      console.error(
        "Report generation failed:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate report."
      );

    } finally {

      setGenerating(
        false
      );
    }
  }


  // ==========================================================
  // DOWNLOAD
  // ==========================================================

  async function handleDownload(
    report: Report
  ) {

    setError(
      null
    );

    setSuccess(
      null
    );


    if (
      !report.filePath ||
      !report.filePath.trim()
    ) {

      setError(
        "This report does not have a generated file."
      );

      return;
    }


    setDownloadingId(
      report.reportId
    );


    try {

      await downloadFile(
        report.filePath
      );


      setSuccess(
        `${report.reportName} downloaded successfully.`
      );

    } catch (err) {

      console.error(
        "Report download failed:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Failed to download report."
      );

    } finally {

      setDownloadingId(
        null
      );
    }
  }


  // ==========================================================
  // CLEAR MESSAGES
  // ==========================================================

  function clearMessages() {

    setError(
      null
    );

    setSuccess(
      null
    );
  }


  // ==========================================================
  // ACCESS CONTROL
  // ==========================================================

  if (
    !can(
      "generate_reports"
    )
  ) {

    return (

      <DashboardLayout>

        <div className="
          min-h-[60vh]
          grid
          place-items-center
          p-6
        ">

          <Card className="
            max-w-md
            text-center
            p-10
          ">

            <div className="
              mx-auto
              h-14
              w-14
              rounded-2xl
              bg-destructive/10
              text-destructive
              grid
              place-items-center
            ">

              <Lock className="h-7 w-7" />

            </div>


            <h2 className="
              mt-5
              text-xl
              font-bold
            ">

              Reporting locked

            </h2>


            <p className="
              mt-2
              text-sm
              text-muted-foreground
            ">

              You do not have permission
              to generate reports.

            </p>

          </Card>

        </div>

      </DashboardLayout>
    );
  }


  // ==========================================================
  // PAGE UI
  // ==========================================================

  return (

    <DashboardLayout>

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="
        flex
        flex-col
        md:flex-row
        md:items-start
        md:justify-between
        gap-4
      ">

        <PageHeader
          title="Reports"
          description="Generate and manage reports across the content lifecycle."
        />


        <div className="
          flex
          items-center
          gap-2
        ">

          <button
            type="button"
            onClick={() => {

              clearMessages();

              void loadReports();

            }}
            disabled={
              loading
            }
            className="
              h-10
              px-4
              rounded-xl
              border
              border-border
              text-sm
              font-medium
              inline-flex
              items-center
              gap-2
              hover:bg-accent
              transition
              disabled:opacity-50
            "
          >

            <RefreshCw
              className={cn(
                "h-4 w-4",
                loading &&
                  "animate-spin"
              )}
            />

            Refresh

          </button>


          <button
            type="button"
            onClick={
              handleGenerateReport
            }
            disabled={
              generating ||
              !userId
            }
            className="
              h-10
              px-5
              rounded-xl
              bg-primary
              text-primary-foreground
              text-sm
              font-semibold
              inline-flex
              items-center
              gap-2
              hover:opacity-90
              transition
              disabled:opacity-50
            "
          >

            {generating ? (

              <RefreshCw className="
                h-4 w-4
                animate-spin
              " />

            ) : (

              <Download className="
                h-4 w-4
              " />

            )}

            {generating
              ? "Generating..."
              : "Generate Report"}

          </button>

        </div>

      </div>


      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (

        <div className="
          mt-5
          rounded-xl
          border
          border-destructive/50
          bg-destructive/10
          px-4
          py-3
          flex
          items-start
          gap-3
          text-sm
          text-destructive
        ">

          <AlertCircle className="
            h-4 w-4
            mt-0.5
            shrink-0
          " />

          <div className="flex-1">

            {error}

          </div>


          <button
            type="button"
            onClick={() =>
              setError(null)
            }
          >

            <X className="
              h-4 w-4
            " />

          </button>

        </div>
      )}


      {/* ======================================================
          SUCCESS
      ======================================================= */}

      {success && (

        <div className="
          mt-5
          rounded-xl
          border
          border-emerald-500/40
          bg-emerald-500/10
          px-4
          py-3
          flex
          items-start
          gap-3
          text-sm
          text-emerald-400
        ">

          <CheckCircle2 className="
            h-4 w-4
            mt-0.5
            shrink-0
          " />

          <div className="flex-1">

            {success}

          </div>


          <button
            type="button"
            onClick={() =>
              setSuccess(null)
            }
          >

            <X className="
              h-4 w-4
            " />

          </button>

        </div>
      )}


      {/* ======================================================
          USER INFO
      ======================================================= */}

      <Card className="
        mt-5
        p-5
      ">

        <div className="
          flex
          items-center
          gap-3
        ">

          <div className="
            h-10
            w-10
            rounded-full
            bg-primary/15
            text-primary
            grid
            place-items-center
            font-bold
          ">

            {(
              user?.fullName ||
              user?.username ||
              "U"
            )
              .charAt(0)
              .toUpperCase()}

          </div>


          <div>

            <div className="
              text-sm
              font-semibold
            ">

              {user?.fullName ||
                user?.username ||
                "Logged-in user"}

            </div>


            <div className="
              text-xs
              text-muted-foreground
              mt-0.5
            ">

              @{user?.username || "user"}

              {" • "}

              User ID:{" "}
              {userId ?? "—"}

            </div>

          </div>

        </div>

      </Card>


      {/* ======================================================
          TEMPLATES
      ======================================================= */}

      <section className="
        mt-6
      ">

        <div className="
          mb-3
        ">

          <h2 className="
            text-sm
            font-semibold
          ">

            Report templates

          </h2>


          <p className="
            mt-1
            text-xs
            text-muted-foreground
          ">

            Choose the type of report
            you want to generate.

          </p>

        </div>


        <div className="
          grid
          md:grid-cols-2
          xl:grid-cols-4
          gap-4
        ">

          {REPORT_TEMPLATES.map(
            template => {

              const Icon =
                template.icon;

              const active =
                selectedTemplate.id ===
                template.id;


              return (

                <button
                  key={
                    template.id
                  }
                  type="button"
                  onClick={() => {

                    setSelectedTemplate(
                      template
                    );

                    clearMessages();

                  }}
                  className={cn(
                    `
                    rounded-2xl
                    border
                    p-5
                    text-left
                    transition
                    hover:border-primary/50
                    hover:bg-accent/30
                    `,
                    active &&
                      `
                      border-primary
                      bg-primary/5
                      `
                  )}
                >

                  <div className="
                    flex
                    items-start
                    gap-3
                  ">

                    <div className="
                      h-10
                      w-10
                      rounded-xl
                      bg-primary/10
                      text-primary
                      grid
                      place-items-center
                      shrink-0
                    ">

                      <Icon className="
                        h-5 w-5
                      " />

                    </div>


                    <div className="
                      min-w-0
                    ">

                      <div className="
                        text-sm
                        font-semibold
                      ">

                        {template.name}

                      </div>


                      <div className="
                        mt-1
                        text-xs
                        text-muted-foreground
                        leading-5
                      ">

                        {
                          template.description
                        }

                      </div>

                    </div>

                  </div>

                </button>
              );
            }
          )}

        </div>

      </section>


      {/* ======================================================
          SUMMARY
      ======================================================= */}

      <div className="
        mt-6
        grid
        md:grid-cols-3
        gap-4
      ">

        <SummaryCard
          label="Total reports"
          value={
            String(
              reports.length
            )
          }
        />


        <SummaryCard
          label="Selected template"
          value={
            selectedTemplate.name
          }
        />


        <SummaryCard
          label="Format"
          value={
            selectedFormat
          }
        />

      </div>


      {/* ======================================================
          FORMAT
      ======================================================= */}

      <Card className="
        mt-6
        p-5
      ">

        <div className="
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between
          gap-4
        ">

          <div>

            <div className="
              text-sm
              font-semibold
            ">

              Export format

            </div>


            <div className="
              mt-1
              text-xs
              text-muted-foreground
            ">

              Select PDF, CSV or Excel
              for the generated report.

            </div>

          </div>


          <div className="
            flex
            gap-2
          ">

            {(
              [
                "PDF",
                "CSV",
                "XLSX",
              ] as ReportFormat[]
            ).map(
              item => (

                <button
                  key={item}
                  type="button"
                  onClick={() => {

                    setSelectedFormat(
                      item
                    );

                    clearMessages();

                  }}
                  className={cn(
                    `
                    h-10
                    px-5
                    rounded-xl
                    border
                    text-xs
                    font-semibold
                    transition
                    `,
                    selectedFormat ===
                      item
                      ? `
                        border-primary
                        bg-primary/10
                        text-primary
                        `
                      : `
                        border-border
                        hover:bg-accent
                        `
                  )}
                >

                  {item === "XLSX"
                    ? "Excel"
                    : item}

                </button>

              )
            )}

          </div>

        </div>

      </Card>


      {/* ======================================================
          GENERATED REPORTS
      ======================================================= */}

      <Card className="
        mt-6
        p-0
        overflow-hidden
      ">

        <div className="
          p-5
          border-b
          border-border
          flex
          items-center
          justify-between
          gap-3
        ">

          <div>

            <div className="
              text-sm
              font-semibold
            ">

              Generated reports

            </div>


            <div className="
              mt-1
              text-xs
              text-muted-foreground
            ">

              Reports generated by
              your account.

            </div>

          </div>


          <div className="
            rounded-full
            bg-primary/10
            text-primary
            px-3
            py-1
            text-xs
            font-semibold
          ">

            {reports.length}{" "}
            {reports.length === 1
              ? "report"
              : "reports"}

          </div>

        </div>


        {loading ? (

          <div className="
            min-h-[280px]
            grid
            place-items-center
          ">

            <div className="
              flex
              items-center
              gap-2
              text-sm
              text-muted-foreground
            ">

              <RefreshCw className="
                h-5 w-5
                animate-spin
              " />

              Loading reports...

            </div>

          </div>

        ) : reports.length === 0 ? (

          <div className="
            min-h-[280px]
            grid
            place-items-center
            text-center
            p-8
          ">

            <div>

              <div className="
                mx-auto
                h-14
                w-14
                rounded-2xl
                bg-primary/10
                text-primary
                grid
                place-items-center
              ">

                <BarChart3 className="
                  h-7 w-7
                " />

              </div>


              <div className="
                mt-4
                text-base
                font-semibold
              ">

                No reports generated yet

              </div>


              <p className="
                mt-1
                text-sm
                text-muted-foreground
              ">

                Choose a template and
                click Generate Report.

              </p>

            </div>

          </div>

        ) : (

          <div className="
            divide-y
            divide-border
          ">

            {reports.map(
              report => {

                const format =
                  getFormat(
                    report
                  );

                const hasFile =
                  Boolean(
                    report.filePath
                  );

                const downloading =
                  downloadingId ===
                  report.reportId;


                return (

                  <div
                    key={
                      report.reportId
                    }
                    className="
                      p-5
                      flex
                      flex-col
                      lg:flex-row
                      lg:items-center
                      lg:justify-between
                      gap-4
                      hover:bg-accent/20
                      transition
                    "
                  >

                    <div className="
                      flex
                      items-center
                      gap-4
                      min-w-0
                    ">

                      <div className="
                        h-11
                        w-11
                        rounded-xl
                        bg-primary/10
                        text-primary
                        grid
                        place-items-center
                        shrink-0
                      ">

                        <FileText className="
                          h-5 w-5
                        " />

                      </div>


                      <div className="
                        min-w-0
                      ">

                        <div className="
                          text-sm
                          font-semibold
                          truncate
                        ">

                          {
                            report.reportName
                          }

                        </div>


                        <div className="
                          mt-1
                          flex
                          flex-wrap
                          items-center
                          gap-2
                        ">

                          <span className="
                            rounded-full
                            bg-muted
                            px-2.5
                            py-1
                            text-[10px]
                            font-medium
                          ">

                            {
                              report.reportType
                            }

                          </span>


                          <span className="
                            rounded-full
                            bg-primary/10
                            text-primary
                            px-2.5
                            py-1
                            text-[10px]
                            font-medium
                          ">

                            {format}

                          </span>


                          <span className="
                            text-[11px]
                            text-muted-foreground
                          ">

                            Report #
                            {
                              report.reportId
                            }

                          </span>

                        </div>

                      </div>

                    </div>


                    <div className="
                      flex
                      items-center
                      gap-2
                      shrink-0
                    ">

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedReport(
                            report
                          )
                        }
                        className="
                          h-9
                          px-3
                          rounded-xl
                          border
                          border-border
                          text-xs
                          font-medium
                          inline-flex
                          items-center
                          gap-2
                          hover:bg-accent
                          transition
                        "
                      >

                        <Eye className="
                          h-4 w-4
                        " />

                        View

                      </button>


                      <button
                        type="button"
                        disabled={
                          downloading ||
                          !hasFile
                        }
                        onClick={() =>
                          void handleDownload(
                            report
                          )
                        }
                        className="
                          h-9
                          px-4
                          rounded-xl
                          bg-primary
                          text-primary-foreground
                          text-xs
                          font-semibold
                          inline-flex
                          items-center
                          gap-2
                          hover:opacity-90
                          transition
                          disabled:opacity-50
                        "
                      >

                        {downloading ? (

                          <RefreshCw className="
                            h-4 w-4
                            animate-spin
                          " />

                        ) : (

                          <Download className="
                            h-4 w-4
                          " />

                        )}

                        {downloading
                          ? "Downloading..."
                          : hasFile
                            ? "Download"
                            : "No File"}

                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </Card>


      {/* ======================================================
          REPORT MODAL
      ======================================================= */}

      {selectedReport && (

        <div className="
          fixed
          inset-0
          z-50
          bg-black/70
          backdrop-blur-sm
          flex
          items-center
          justify-center
          p-4
        ">

          <div className="
            w-full
            max-w-xl
            rounded-2xl
            border
            border-border
            bg-background
            shadow-2xl
            overflow-hidden
          ">

            <div className="
              p-5
              border-b
              border-border
              flex
              items-center
              justify-between
            ">

              <div>

                <h2 className="
                  text-lg
                  font-bold
                ">

                  Report Details

                </h2>


                <p className="
                  mt-1
                  text-xs
                  text-muted-foreground
                ">

                  Report #
                  {
                    selectedReport.reportId
                  }

                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedReport(
                    null
                  )
                }
                className="
                  h-9
                  w-9
                  rounded-xl
                  grid
                  place-items-center
                  hover:bg-accent
                "
              >

                <X className="
                  h-5 w-5
                " />

              </button>

            </div>


            <div className="
              p-5
              space-y-3
            ">

              <DetailRow
                label="Report Name"
                value={
                  selectedReport.reportName
                }
              />


              <DetailRow
                label="Report Type"
                value={
                  selectedReport.reportType
                }
              />


              <DetailRow
                label="Format"
                value={
                  getFormat(
                    selectedReport
                  )
                }
              />


              <DetailRow
                label="Generated File"
                value={
                  selectedReport.filePath ||
                  "No file available"
                }
              />

            </div>


            <div className="
              p-5
              border-t
              border-border
              flex
              justify-end
              gap-2
            ">

              <button
                type="button"
                onClick={() =>
                  setSelectedReport(
                    null
                  )
                }
                className="
                  h-10
                  px-4
                  rounded-xl
                  border
                  border-border
                  text-sm
                  font-medium
                  hover:bg-accent
                "
              >

                Close

              </button>


              <button
                type="button"
                disabled={
                  !selectedReport.filePath ||
                  downloadingId ===
                    selectedReport.reportId
                }
                onClick={() =>
                  void handleDownload(
                    selectedReport
                  )
                }
                className="
                  h-10
                  px-4
                  rounded-xl
                  bg-primary
                  text-primary-foreground
                  text-sm
                  font-semibold
                  inline-flex
                  items-center
                  gap-2
                  disabled:opacity-50
                "
              >

                {downloadingId ===
                selectedReport.reportId ? (

                  <RefreshCw className="
                    h-4 w-4
                    animate-spin
                  " />

                ) : (

                  <Download className="
                    h-4 w-4
                  " />

                )}

                Download

              </button>

            </div>

          </div>

        </div>
      )}

    </DashboardLayout>
  );
}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="
      rounded-2xl
      border
      border-border
      bg-surface
      p-5
    ">

      <div className="
        text-[10px]
        uppercase
        tracking-widest
        text-muted-foreground
      ">

        {label}

      </div>


      <div className="
        mt-2
        text-lg
        font-bold
        truncate
      ">

        {value}

      </div>

    </div>
  );
}


// ============================================================
// DETAIL ROW
// ============================================================

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="
      rounded-xl
      border
      border-border
      p-4
    ">

      <div className="
        text-[10px]
        uppercase
        tracking-widest
        text-muted-foreground
      ">

        {label}

      </div>


      <div className="
        mt-1
        text-sm
        font-semibold
        break-all
      ">

        {value}

      </div>

    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";

import {
  DashboardLayout,
  PageHeader,
} from "@/components/layout/DashboardLayout";

import {
  Card,
  Chip,
} from "@/components/ui-kit";

import { useRole } from "@/lib/roles";

import {
  apiRequest,
  downloadFile,
} from "@/lib/api";

import {
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Lock,
  RefreshCw,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { cn } from "@/lib/utils";


// ============================================================
// ROUTE
// ============================================================

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      {
        title: "Reports — Netflix Show Manager",
      },
      {
        name: "description",
        content:
          "Generate and manage reports across the content lifecycle.",
      },
      {
        property: "og:title",
        content:
          "Reports — Netflix Show Manager",
      },
      {
        property: "og:description",
        content:
          "Generate and manage studio reports.",
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


interface LoggedInUser {
  userId?: number;

  id?: number;

  fullName?: string;

  username?: string;

  email?: string;

  role?: {
    roleName?: string;

    name?: string;
  };

  roleName?: string;
}


// ============================================================
// REPORT TEMPLATES
// ============================================================

const templates = [
  {
    id: "content",
    name: "Content Pipeline Report",
    type: "CONTENT",
    desc:
      "Submissions, approvals and rejection analysis.",
    icon: FileBarChart,
  },

  {
    id: "budget",
    name: "Budget Utilisation Report",
    type: "BUDGET",
    desc:
      "Allocated and actual production budget analysis.",
    icon: FileSpreadsheet,
  },

  {
    id: "production",
    name: "Production Health Report",
    type: "PRODUCTION",
    desc:
      "Production status and workflow analysis.",
    icon: FileText,
  },

  {
    id: "roi",
    name: "ROI & Forecast Report",
    type: "ROI",
    desc:
      "Business performance and forecast analysis.",
    icon: Sparkles,
  },
];


// ============================================================
// HELPER - GET LOGGED IN USER
// ============================================================

function getLoggedInUser(): LoggedInUser | null {

  try {

    const raw =
      localStorage.getItem(
        "streamforge_user"
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);

  } catch (error) {

    console.error(
      "Unable to read logged-in user:",
      error
    );

    return null;
  }
}


// ============================================================
// HELPER - GET USER ID
// ============================================================

function getUserId(
  user: LoggedInUser | null
): number | null {

  if (!user) {
    return null;
  }


  const possibleId =
    user.userId ??
    user.id;


  if (
    possibleId === undefined ||
    possibleId === null
  ) {
    return null;
  }


  const numericId =
    Number(possibleId);


  if (
    Number.isNaN(numericId) ||
    numericId <= 0
  ) {
    return null;
  }


  return numericId;
}


// ============================================================
// HELPER - FORMAT
// ============================================================

function getReportFormat(
  report: Report
): ReportFormat | string {

  if (report.format) {

    return report.format.toUpperCase();
  }


  const filePath =
    report.filePath || "";


  const lower =
    filePath.toLowerCase();


  if (lower.endsWith(".pdf")) {
    return "PDF";
  }


  if (lower.endsWith(".csv")) {
    return "CSV";
  }


  if (lower.endsWith(".xlsx")) {
    return "XLSX";
  }


  return "FILE";
}


// ============================================================
// PAGE
// ============================================================

function ReportsPage() {

  const {
    can,
    profile,
  } = useRole();


  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [
    selectedTemplate,
    setSelectedTemplate,
  ] = useState(
    templates[0]
  );


  const [
    format,
    setFormat,
  ] = useState<ReportFormat>(
    "PDF"
  );


  const [
    reports,
    setReports,
  ] = useState<Report[]>([]);


  const [
    user,
    setUser,
  ] = useState<LoggedInUser | null>(
    null
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    generating,
    setGenerating,
  ] = useState(false);


  const [
    downloadingId,
    setDownloadingId,
  ] = useState<number | null>(
    null
  );


  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  const [
    success,
    setSuccess,
  ] = useState<string | null>(
    null
  );


  const [
    selectedReport,
    setSelectedReport,
  ] = useState<Report | null>(
    null
  );


  // ----------------------------------------------------------
  // USER ID
  // ----------------------------------------------------------

  const userId =
    useMemo(
      () => getUserId(user),
      [user]
    );


  // ==========================================================
  // LOAD USER
  // ==========================================================

  useEffect(() => {

    const loggedInUser =
      getLoggedInUser();

    setUser(loggedInUser);

  }, []);


  // ==========================================================
  // LOAD REPORTS
  // ==========================================================

  const loadReports =
    useCallback(
      async () => {

        setLoading(true);

        setError(null);


        try {

          const loggedInUser =
            getLoggedInUser();


          setUser(
            loggedInUser
          );


          const id =
            getUserId(
              loggedInUser
            );


          if (!id) {

            setReports([]);

            setError(
              "Unable to determine the logged-in user's ID."
            );

            return;
          }


          const data =
            await apiRequest<
              Report[]
            >(
              `/api/reports/user/${id}`,
              {
                method: "GET",
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

          setLoading(false);
        }

      },
      []
    );


  useEffect(() => {

    loadReports();

  }, [loadReports]);


  // ==========================================================
  // GENERATE REPORT
  // ==========================================================

  const generateReport =
    async () => {

      setError(null);

      setSuccess(null);


      if (!userId) {

        setError(
          "Unable to determine the logged-in user's ID."
        );

        return;
      }


      setGenerating(true);


      try {

        /*
         * IMPORTANT:
         *
         * Your backend now expects:
         *
         * @RequestBody ReportGenerateRequest
         *
         * Therefore we send JSON.
         */

        const requestBody = {

          userId: userId,

          reportName:
            selectedTemplate.name,

          reportType:
            selectedTemplate.type,

          format: format,
        };


        console.log(
          "Generating report:",
          requestBody
        );


        const createdReport =
          await apiRequest<Report>(
            "/api/reports/generate",
            {
              method: "POST",

              body:
                JSON.stringify(
                  requestBody
                ),
            }
          );


        /*
         * Add newly generated report
         * immediately to UI.
         */

        if (createdReport) {

          setReports(
            (previous) => [
              createdReport,
              ...previous,
            ]
          );
        }


        setSuccess(
          `${selectedTemplate.name} generated successfully.`
        );


        /*
         * Refresh from database to make
         * absolutely sure UI matches backend.
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

        setGenerating(false);
      }
    };


  // ==========================================================
  // DOWNLOAD REPORT
  // ==========================================================

  const handleDownload =
    async (
      report: Report
    ) => {

      setError(null);

      setSuccess(null);


      if (!report.filePath) {

        setError(
          "This report does not have a generated file attached."
        );

        return;
      }


      setDownloadingId(
        report.reportId
      );


      try {

        /*
         * IMPORTANT:
         *
         * Do NOT use window.open().
         *
         * downloadFile() sends:
         *
         * Authorization:
         * Bearer <JWT>
         *
         * so Spring Security allows
         * the file request.
         */

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
    };


  // ==========================================================
  // CLEAR MESSAGE
  // ==========================================================

  const clearMessages =
    () => {

      setError(null);

      setSuccess(null);
    };


  // ==========================================================
  // ACCESS CHECK
  // ==========================================================

  if (
    !can("generate_reports")
  ) {

    return (

      <DashboardLayout>

        <div className="min-h-[60vh] grid place-items-center">

          <Card className="max-w-md text-center py-12">

            <div className="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-destructive/15 text-destructive mb-5">

              <Lock className="h-7 w-7" />

            </div>


            <h2 className="text-xl font-bold">

              Reporting locked

            </h2>


            <p className="text-sm text-muted-foreground mt-2">

              Report generation is available
              to Directors, Producers,
              Content Managers and Admins.

              <br />

              Current role:{" "}

              {profile?.label ||
                "Unknown"}

            </p>

          </Card>

        </div>

      </DashboardLayout>
    );
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <DashboardLayout>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-start justify-between gap-4">

        <PageHeader
          title="Reports"
          description="Generate and manage reports across the content lifecycle."
        />


        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() => {
              clearMessages();
              loadReports();
            }}
            disabled={loading}
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
              justify-center
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
            onClick={generateReport}
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
              justify-center
              gap-2
              hover:opacity-90
              transition
              shadow-[var(--shadow-glow)]
              disabled:opacity-50
            "
          >

            <Download className="h-4 w-4" />

            {generating
              ? "Generating..."
              : "Generate Report"}

          </button>

        </div>

      </div>


      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="
          mt-4
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

          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />

          <div className="flex-1">

            {error}

          </div>


          <button
            type="button"
            onClick={() =>
              setError(null)
            }
            className="opacity-70 hover:opacity-100"
          >

            <X className="h-4 w-4" />

          </button>

        </div>
      )}


      {/* =====================================================
          SUCCESS
      ====================================================== */}

      {success && (

        <div className="
          mt-4
          rounded-xl
          border
          border-green-500/40
          bg-green-500/10
          px-4
          py-3
          flex
          items-start
          gap-3
          text-sm
          text-green-400
        ">

          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />

          <div className="flex-1">

            {success}

          </div>


          <button
            type="button"
            onClick={() =>
              setSuccess(null)
            }
            className="opacity-70 hover:opacity-100"
          >

            <X className="h-4 w-4" />

          </button>

        </div>
      )}


      {/* =====================================================
          USER INFO
      ====================================================== */}

      {user && userId && (

        <div className="
          mt-4
          rounded-xl
          border
          border-border
          bg-surface
          px-4
          py-3
          flex
          items-center
          gap-3
        ">

          <div className="
            h-9
            w-9
            rounded-full
            bg-primary/15
            text-primary
            grid
            place-items-center
            text-sm
            font-bold
          ">

            {(user.fullName ||
              user.username ||
              "U")
              .charAt(0)
              .toUpperCase()}

          </div>


          <div>

            <div className="text-sm font-semibold">

              {user.fullName ||
                user.username ||
                "User"}

            </div>


            <div className="text-xs text-muted-foreground">

              @{user.username || "user"}

              {" • "}

              User ID: {userId}

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          TEMPLATE SECTION
      ====================================================== */}

      <section className="mt-6">

        <div className="mb-3">

          <h2 className="text-sm font-semibold">

            Report templates

          </h2>


          <p className="text-xs text-muted-foreground mt-1">

            Choose the type of report you want to generate.

          </p>

        </div>


        <div className="
          grid
          xl:grid-cols-4
          md:grid-cols-2
          gap-4
        ">

          {templates.map(
            (template) => {

              const Icon =
                template.icon;


              const active =
                selectedTemplate.id ===
                template.id;


              return (

                <button
                  key={template.id}
                  type="button"
                  onClick={() => {

                    setSelectedTemplate(
                      template
                    );

                    clearMessages();
                  }}
                  className={cn(
                    `
                    text-left
                    rounded-2xl
                    border
                    p-5
                    transition
                    card-hover
                    `,
                    active
                      ? `
                        border-primary
                        bg-primary/5
                      `
                      : `
                        border-border
                        hover:border-primary/40
                      `
                  )}
                >

                  <div className="flex items-start gap-3">

                    <span className="
                      h-10
                      w-10
                      grid
                      place-items-center
                      rounded-xl
                      bg-primary/10
                      text-primary
                      shrink-0
                    ">

                      <Icon className="h-5 w-5" />

                    </span>


                    <span className="min-w-0">

                      <span className="
                        block
                        text-sm
                        font-semibold
                      ">

                        {template.name}

                      </span>


                      <span className="
                        block
                        text-xs
                        text-muted-foreground
                        mt-1
                      ">

                        {template.desc}

                      </span>

                    </span>

                  </div>

                </button>
              );
            }
          )}

        </div>

      </section>


      {/* =====================================================
          SUMMARY
      ====================================================== */}

      <div className="
        grid
        lg:grid-cols-3
        gap-4
        mt-6
      ">

        <SummaryCard
          label="Total reports"
          value={String(
            reports.length
          )}
        />


        <SummaryCard
          label="Selected template"
          value={
            selectedTemplate.name
          }
        />


        <SummaryCard
          label="Logged-in user"
          value={
            user?.username ||
            "Loading..."
          }
        />

      </div>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="mt-6">

        <Card className="!p-0 overflow-hidden">

          {/* HEADER */}

          <div className="
            p-5
            border-b
            border-border
            flex
            items-center
            justify-between
            gap-4
          ">

            <div>

              <div className="text-sm font-semibold">

                Generated reports

              </div>


              <div className="
                text-xs
                text-muted-foreground
                mt-1
              ">

                Reports generated by your account.

              </div>

            </div>


            <Chip variant="info">

              {reports.length}{" "}

              {reports.length === 1
                ? "report"
                : "reports"}

            </Chip>

          </div>


          {/* BODY */}

          {loading ? (

            <div className="
              min-h-[300px]
              grid
              place-items-center
            ">

              <div className="
                flex
                items-center
                gap-3
                text-sm
                text-muted-foreground
              ">

                <RefreshCw className="
                  h-5
                  w-5
                  animate-spin
                " />

                Loading reports...

              </div>

            </div>

          ) : reports.length === 0 ? (

            <EmptyReports
              onGenerate={
                generateReport
              }
              disabled={
                generating ||
                !userId
              }
            />

          ) : (

            <div className="divide-y divide-border">

              {reports.map(
                (report) => (

                  <ReportRow
                    key={
                      report.reportId
                    }
                    report={report}
                    downloading={
                      downloadingId ===
                      report.reportId
                    }
                    onView={() =>
                      setSelectedReport(
                        report
                      )
                    }
                    onDownload={() =>
                      handleDownload(
                        report
                      )
                    }
                  />

                )
              )}

            </div>

          )}

        </Card>

      </div>


      {/* =====================================================
          CONFIGURATION
      ====================================================== */}

      <div className="
        mt-6
        grid
        lg:grid-cols-[minmax(0,1fr)_360px]
        gap-6
      ">

        <Card>

          <div className="
            text-sm
            font-semibold
            mb-4
          ">

            Selected report

          </div>


          <div className="
            rounded-xl
            border
            border-border
            p-5
          ">

            <div className="
              text-xs
              uppercase
              tracking-wider
              text-muted-foreground
            ">

              Template

            </div>


            <div className="
              text-lg
              font-bold
              mt-1
            ">

              {selectedTemplate.name}

            </div>


            <div className="
              text-sm
              text-muted-foreground
              mt-2
            ">

              {selectedTemplate.desc}

            </div>


            <div className="
              flex
              items-center
              gap-2
              mt-4
            ">

              <Chip variant="info">

                {selectedTemplate.type}

              </Chip>


              <Chip variant="default">

                {format}

              </Chip>

            </div>

          </div>

        </Card>


        <Card className="h-fit">

          <div className="
            text-sm
            font-semibold
            mb-5
          ">

            Report configuration

          </div>


          {/* FORMAT */}

          <div>

            <div className="
              mb-2
              text-xs
              font-medium
              uppercase
              tracking-wider
              text-muted-foreground
            ">

              Format

            </div>


            <div className="
              grid
              grid-cols-3
              gap-2
            ">

              {(
                [
                  "PDF",
                  "CSV",
                  "XLSX",
                ] as ReportFormat[]
              ).map(
                (item) => (

                  <button
                    key={item}
                    type="button"
                    onClick={() => {

                      setFormat(
                        item
                      );

                      clearMessages();
                    }}
                    className={cn(
                      `
                      h-10
                      rounded-xl
                      border
                      text-xs
                      font-medium
                      transition
                      `,
                      format === item
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

                    {item}

                  </button>

                )
              )}

            </div>

          </div>


          {/* GENERATE */}

          <button
            type="button"
            onClick={
              generateReport
            }
            disabled={
              generating ||
              !userId
            }
            className="
              mt-5
              w-full
              h-11
              rounded-xl
              bg-primary
              text-primary-foreground
              text-sm
              font-semibold
              inline-flex
              items-center
              justify-center
              gap-2
              hover:opacity-90
              transition
              shadow-[var(--shadow-glow)]
              disabled:opacity-50
            "
          >

            {generating ? (

              <>

                <RefreshCw className="
                  h-4
                  w-4
                  animate-spin
                " />

                Generating...

              </>

            ) : (

              <>

                <Download className="h-4 w-4" />

                Generate Report

              </>

            )}

          </button>

        </Card>

      </div>


      {/* =====================================================
          REPORT DETAILS MODAL
      ====================================================== */}

      {selectedReport && (

        <ReportDetailsModal
          report={
            selectedReport
          }
          onClose={() =>
            setSelectedReport(
              null
            )
          }
          onDownload={() =>
            handleDownload(
              selectedReport
            )
          }
          downloading={
            downloadingId ===
            selectedReport.reportId
          }
        />

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
      ">

        {value}

      </div>

    </div>
  );
}


// ============================================================
// EMPTY REPORTS
// ============================================================

function EmptyReports({
  onGenerate,
  disabled,
}: {
  onGenerate: () => void;
  disabled: boolean;
}) {

  return (

    <div className="
      min-h-[330px]
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

          <FileText className="h-7 w-7" />

        </div>


        <h3 className="
          text-base
          font-semibold
          mt-4
        ">

          No reports yet

        </h3>


        <p className="
          text-sm
          text-muted-foreground
          mt-1
        ">

          Select a template and
          generate your first report.

        </p>


        <button
          type="button"
          onClick={
            onGenerate
          }
          disabled={disabled}
          className="
            mt-5
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

          <Download className="h-4 w-4" />

          Generate your first report

        </button>

      </div>

    </div>
  );
}


// ============================================================
// REPORT ROW
// ============================================================

function ReportRow({
  report,
  downloading,
  onView,
  onDownload,
}: {
  report: Report;
  downloading: boolean;
  onView: () => void;
  onDownload: () => void;
}) {

  const reportFormat =
    getReportFormat(
      report
    );


  return (

    <div className="
      p-5
      flex
      items-center
      justify-between
      gap-4
      hover:bg-accent/30
      transition
    ">

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

          <FileText className="h-5 w-5" />

        </div>


        <div className="min-w-0">

          <div className="
            text-sm
            font-semibold
            truncate
          ">

            {report.reportName}

          </div>


          <div className="
            flex
            items-center
            gap-2
            mt-1
            flex-wrap
          ">

            <Chip variant="default">

              {report.reportType}

            </Chip>


            <Chip variant="info">

              {reportFormat}

            </Chip>


            <span className="
              text-xs
              text-muted-foreground
            ">

              Report #{report.reportId}

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
          onClick={
            onView
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

          <Eye className="h-4 w-4" />

          View

        </button>


        <button
          type="button"
          onClick={
            onDownload
          }
          disabled={
            downloading ||
            !report.filePath
          }
          className="
            h-9
            px-3
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
              h-4
              w-4
              animate-spin
            " />

          ) : (

            <Download className="h-4 w-4" />

          )}

          {downloading
            ? "Downloading..."
            : "Download"}

        </button>

      </div>

    </div>
  );
}


// ============================================================
// REPORT DETAILS MODAL
// ============================================================

function ReportDetailsModal({
  report,
  onClose,
  onDownload,
  downloading,
}: {
  report: Report;
  onClose: () => void;
  onDownload: () => void;
  downloading: boolean;
}) {

  const format =
    getReportFormat(
      report
    );


  return (

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

        {/* HEADER */}

        <div className="
          px-6
          py-5
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
              text-xs
              text-muted-foreground
              mt-1
            ">

              Report #{report.reportId}

            </p>

          </div>


          <button
            type="button"
            onClick={
              onClose
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

            <X className="h-5 w-5" />

          </button>

        </div>


        {/* BODY */}

        <div className="
          p-6
          space-y-4
        ">

          <DetailField
            label="Report name"
            value={
              report.reportName
            }
          />


          <DetailField
            label="Report type"
            value={
              report.reportType
            }
          />


          <DetailField
            label="Report ID"
            value={
              String(
                report.reportId
              )
            }
          />


          <DetailField
            label="Format"
            value={
              format
            }
          />


          <DetailField
            label="File path"
            value={
              report.filePath ||
              "No file attached"
            }
          />

        </div>


        {/* FOOTER */}

        <div className="
          px-6
          py-4
          border-t
          border-border
          flex
          justify-end
          gap-2
        ">

          <button
            type="button"
            onClick={
              onClose
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
            onClick={
              onDownload
            }
            disabled={
              downloading ||
              !report.filePath
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
              hover:opacity-90
              disabled:opacity-50
            "
          >

            {downloading ? (

              <RefreshCw className="
                h-4
                w-4
                animate-spin
              " />

            ) : (

              <Download className="h-4 w-4" />

            )}

            {downloading
              ? "Downloading..."
              : "Download"}

          </button>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// DETAIL FIELD
// ============================================================

function DetailField({
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
        text-sm
        font-semibold
        mt-1
        break-all
      ">

        {value}

      </div>

    </div>
  );
}
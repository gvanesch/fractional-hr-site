import { notFound, redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import {
  buildClientDiagnosticReport,
  type ClientDiagnosticReport,
} from "@/lib/client-diagnostic/build-client-diagnostic-report";
import { BuildProjectSummaryError } from "@/lib/client-diagnostic/build-project-summary";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export const runtime = "edge";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function getReport(projectId: string): Promise<ClientDiagnosticReport> {
  return buildClientDiagnosticReport(projectId);
}

export default async function AdvisorReportPage({ params }: PageProps) {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  const { projectId } = await params;

  if (!isUuid(projectId)) {
    notFound();
  }

  let report: ClientDiagnosticReport;

try {
  report = await getReport(projectId);
} catch (error) {
  console.error("REPORT BUILD ERROR:", error);

  return (
    <main style={{ padding: "40px" }}>
      <h1>Report failed</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(error, null, 2)}
      </pre>
    </main>
  );
}

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Advisor workspace</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              Diagnostic report
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6">
              {report.project.companyName}
            </p>
          </div>
        </div>
      </section>

      <div className="brand-container space-y-10 py-10">
        <section className="brand-surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Executive summary
          </h2>

          <p className="mt-4 leading-7 text-slate-700">
            {report.executiveSummary.overview}
          </p>
        </section>

        <section className="brand-surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Key metrics
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Metric
              label="Overall score"
              value={formatMetricValue(report.analytics.overallScore)}
            />
            <Metric
              label="Alignment score"
              value={formatMetricValue(report.analytics.alignmentScore)}
            />
            <Metric
              label="Confidence"
              value={report.analytics.confidenceLevel}
            />
          </div>
        </section>

        <section className="brand-surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Priority areas
          </h2>

          <div className="mt-4 space-y-4">
            {report.analytics.priorityAreas.map((area) => (
              <div key={area.dimensionKey} className="rounded-lg border p-4">
                <p className="font-semibold text-slate-900">
                  {area.dimensionLabel}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Score: {formatMetricValue(area.overallAverage)} | Gap:{" "}
                  {formatMetricValue(area.gap)}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Issue type: {area.issueType}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatMetricValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  return String(value);
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
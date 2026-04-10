"use client";

import type {
  ClientDiagnosticReport,
  ReportPriorityArea,
} from "@/lib/client-diagnostic/build-client-diagnostic-report";

type AdvisorReportClientProps = {
  report: ClientDiagnosticReport;
};

export default function AdvisorReportClient({
  report,
}: AdvisorReportClientProps) {
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
            {report.analytics.priorityAreas.length > 0 ? (
              report.analytics.priorityAreas.map((area) => (
                <PriorityAreaCard key={area.dimensionKey} area={area} />
              ))
            ) : (
              <div className="rounded-lg border p-4">
                <p className="text-sm text-slate-600">
                  No priority areas could be identified from the current scored
                  data set.
                </p>
              </div>
            )}
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

function PriorityAreaCard({
  area,
}: {
  area: ReportPriorityArea;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="font-semibold text-slate-900">{area.dimensionLabel}</p>

      <p className="mt-1 text-sm text-slate-600">
        Score: {formatMetricValue(area.overallAverage)} | Gap:{" "}
        {formatMetricValue(area.gap)}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        Issue type: {area.issueType}
      </p>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

type AdvisorReportClientProps = {
  projectId: string;
};

type ReportIssueType =
  | "structural"
  | "behavioural"
  | "fragile"
  | "optimisation"
  | "insufficient-data";

type ReportPriorityArea = {
  dimensionKey: string;
  dimensionLabel: string;
  overallAverage: number | null;
  gap: number | null;
  priorityScore: number;
  issueType: ReportIssueType;
};

type ClientDiagnosticReport = {
  project: {
    projectId: string;
    companyName: string;
    primaryContactName: string;
    projectStatus: string;
  };
  executiveSummary: {
    overview: string;
    completionPercentage: number;
    completedRespondentGroups: number;
    totalRespondentGroups: number;
  };
  analytics: {
    overallScore: number | null;
    alignmentScore: number | null;
    confidenceLevel: "low" | "medium" | "high";
    priorityAreas: ReportPriorityArea[];
  };
};

type ReportApiResponse =
  | {
      success: true;
      report: ClientDiagnosticReport;
    }
  | {
      success: false;
      error: string;
    };

export default function AdvisorReportClient({
  projectId,
}: AdvisorReportClientProps) {
  const [report, setReport] = useState<ClientDiagnosticReport | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadReport() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          `/api/client-diagnostic-report?projectId=${encodeURIComponent(projectId)}`,
          {
            cache: "no-store",
            credentials: "same-origin",
          },
        );

        const result = (await response.json()) as ReportApiResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            "error" in result ? result.error : "Failed to load report.",
          );
        }

        if (!isCancelled) {
          setReport(result.report);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load report.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadReport();

    return () => {
      isCancelled = true;
    };
  }, [projectId]);

  if (isLoading) {
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
                Loading report...
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !report) {
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
                Unable to load report.
              </p>
            </div>
          </div>
        </section>

        <div className="brand-container py-10">
          <section className="brand-surface-card p-6">
            <h2 className="text-lg font-semibold text-slate-900">Error</h2>
            <p className="mt-4 leading-7 text-slate-700">
              {error || "Unknown error."}
            </p>
          </section>
        </div>
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
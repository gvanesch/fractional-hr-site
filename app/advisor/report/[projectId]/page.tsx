import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value);
}

async function getReport(projectId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/client-diagnostic-report?projectId=${projectId}`,
    {
      cache: "no-store",
    },
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error("Failed to load report");
  }

  return data.report;
}

export default async function AdvisorReportPage({ params }: PageProps) {
  const { projectId } = await params;

  if (!isUuid(projectId)) {
    notFound();
  }

  const report = await getReport(projectId);

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

      <div className="brand-container py-10 space-y-10">
        {/* Executive Summary */}
        <section className="brand-surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Executive summary
          </h2>

          <p className="mt-4 text-slate-700 leading-7">
            {report.executiveSummary.overview}
          </p>
        </section>

        {/* Analytics */}
        <section className="brand-surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Key metrics
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Metric label="Overall score" value={report.analytics.overallScore} />
            <Metric label="Alignment score" value={report.analytics.alignmentScore} />
            <Metric label="Confidence" value={report.analytics.confidenceLevel} />
          </div>
        </section>

        {/* Priority Areas */}
        <section className="brand-surface-card p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Priority areas
          </h2>

          <div className="mt-4 space-y-4">
            {report.analytics.priorityAreas.map((area: any) => (
              <div
                key={area.dimensionKey}
                className="rounded-lg border p-4"
              >
                <p className="font-semibold">{area.dimensionLabel}</p>
                <p className="text-sm text-slate-600">
                  Score: {area.overallAverage ?? "-"} | Gap: {area.gap ?? "-"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border p-4 bg-white">
      <p className="text-xs text-slate-500 uppercase">{label}</p>
      <p className="text-lg font-semibold mt-1">
        {value ?? "-"}
      </p>
    </div>
  );
}
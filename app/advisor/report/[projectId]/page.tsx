import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import AdvisorReportClient from "@/app/components/advisor/AdvisorReportClient";
import { buildClientDiagnosticReport } from "@/lib/client-diagnostic/build-client-diagnostic-report";
import { BuildProjectSummaryError } from "@/lib/client-diagnostic/build-project-summary";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export const dynamic = "force-dynamic";

export default async function AdvisorReportPage({ params }: PageProps) {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  const { projectId } = await params;

  if (!isUuid(projectId)) {
    notFound();
  }

  try {
    const report = await buildClientDiagnosticReport(projectId);

    return (
      <>
        <div className="border-b border-slate-200 bg-white">
          <div className="brand-container flex flex-wrap items-center justify-between gap-3 py-3">
            <Link
              href={`/advisor/project/${projectId}`}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              ← Back to project workspace
            </Link>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/advisor/explore/${projectId}`}
                className="inline-flex items-center justify-center rounded-xl bg-[#1E6FD9] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1859ad]"
              >
                Open Explorer
              </Link>
            </div>
          </div>
        </div>

        <AdvisorReportClient report={report} />
      </>
    );
  } catch (error) {
    if (error instanceof BuildProjectSummaryError && error.status === 404) {
      notFound();
    }

    console.error("[advisor-report-page] failed to build report", {
      projectId,
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}

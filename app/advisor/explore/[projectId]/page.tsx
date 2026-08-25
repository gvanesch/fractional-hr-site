import { notFound, redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import AdvisorDiagnosticExplorerClient from "@/app/components/advisor/AdvisorDiagnosticExplorerClient";
import {
  buildProjectSummary,
  BuildProjectSummaryError,
} from "@/lib/client-diagnostic/build-project-summary";

export const metadata = {
  title: "Diagnostic Explorer | Van Esch Advisory",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

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

export default async function AdvisorDiagnosticExplorerPage({
  params,
}: PageProps) {
  const advisorUser = await requireAdvisorUser();

  if (!advisorUser) {
    redirect("/advisor/login");
  }

  const { projectId } = await params;

  if (!isUuid(projectId)) {
    notFound();
  }

  let summary;

  try {
    summary = await buildProjectSummary(projectId);
  } catch (error) {
    if (error instanceof BuildProjectSummaryError && error.status === 404) {
      notFound();
    }

    console.error("[advisor-diagnostic-explorer-page] failed to build summary", {
      projectId,
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }

  return <AdvisorDiagnosticExplorerClient summary={summary} />;
}

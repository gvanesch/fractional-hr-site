import { notFound, redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import AdvisorDiagnosticExplorerClient from "@/app/components/advisor/AdvisorDiagnosticExplorerClient";
import {
  buildProjectSummary,
  BuildProjectSummaryError,
} from "@/lib/client-diagnostic/build-project-summary";
import { buildExplorerSegmentSelection } from "@/lib/client-diagnostic/explorer-segment-selection";

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
  searchParams: Promise<{
    viewBy?: string | string[];
    segment?: string | string[];
  }>;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function firstQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function queryValues(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

export default async function AdvisorDiagnosticExplorerPage({
  params,
  searchParams,
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

  const resolvedSearchParams = await searchParams;
  const requestedViewBy = firstQueryValue(resolvedSearchParams.viewBy);
  const selectedKey = summary.segmentation.availableKeys.find(
    (item) => item.key === requestedViewBy,
  );
  const initialViewBy = selectedKey?.key ?? "overall";

  const requestedSegmentValues = queryValues(resolvedSearchParams.segment);
  const validSegmentValues = selectedKey
    ? requestedSegmentValues.filter((value) => selectedKey.values.includes(value))
    : [];
  const initialSegmentValues = selectedKey
    ? validSegmentValues.length > 0
      ? Array.from(new Set(validSegmentValues))
      : selectedKey.values.slice(0, 1)
    : [];

  const segmentSelection = selectedKey
    ? buildExplorerSegmentSelection({
        segmentation: summary.segmentation,
        key: selectedKey.key,
        values: initialSegmentValues,
        reportingMinN: summary.reportingPolicy.segmentReportingMinN,
      })
    : null;

  return (
    <AdvisorDiagnosticExplorerClient
      summary={summary}
      initialViewBy={initialViewBy}
      initialSegmentValues={initialSegmentValues}
      segmentSelection={segmentSelection}
    />
  );
}

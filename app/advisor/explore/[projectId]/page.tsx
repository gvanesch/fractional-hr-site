import { notFound, redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import AdvisorDiagnosticExplorerClient from "@/app/components/advisor/AdvisorDiagnosticExplorerClient";
import {
  buildProjectSummary,
  BuildProjectSummaryError,
} from "@/lib/client-diagnostic/build-project-summary";
import { buildExplorerCohort } from "@/lib/client-diagnostic/build-explorer-cohort";

export const metadata = {
  title: "Diagnostic Explorer | Van Esch Advisory",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<SearchParams>;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function queryValues(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

function firstQueryValue(value: string | string[] | undefined): string | null {
  return queryValues(value)[0] ?? null;
}

function parseRequestedFilters(searchParams: SearchParams): Record<string, string[]> {
  const filters: Record<string, string[]> = {};

  for (const [key, rawValue] of Object.entries(searchParams)) {
    if (!key.startsWith("segment.")) {
      continue;
    }

    const segmentationKey = key.slice("segment.".length);
    if (!segmentationKey) {
      continue;
    }

    filters[segmentationKey] = queryValues(rawValue);
  }

  if (Object.keys(filters).length > 0) {
    return filters;
  }

  // Backward compatibility for Explorer links created before multidimensional
  // filtering. New navigation uses segment.<dimension>=<value> query keys.
  const legacyViewBy = firstQueryValue(searchParams.viewBy);
  const legacyValues = queryValues(searchParams.segment);

  if (legacyViewBy && legacyViewBy !== "overall" && legacyValues.length > 0) {
    filters[legacyViewBy] = legacyValues;
  }

  return filters;
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

  const resolvedSearchParams = await searchParams;
  const requestedFilters = parseRequestedFilters(resolvedSearchParams);

  let summary;
  let explorerCohort;

  try {
    summary = await buildProjectSummary(projectId);
    explorerCohort = await buildExplorerCohort({
      projectId,
      requestedFilters,
      availableKeys: summary.segmentation.availableKeys,
      reportingMinN: summary.reportingPolicy.segmentReportingMinN,
    });
  } catch (error) {
    if (error instanceof BuildProjectSummaryError && error.status === 404) {
      notFound();
    }

    console.error("[advisor-diagnostic-explorer-page] failed to build explorer", {
      projectId,
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }

  return (
    <AdvisorDiagnosticExplorerClient
      summary={summary}
      explorerCohort={explorerCohort}
    />
  );
}

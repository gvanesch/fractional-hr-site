import Link from "next/link";
import { notFound } from "next/navigation";

export const runtime = "edge";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type ScoredQuestionnaireType = "hr" | "manager" | "leadership";
type QuestionnaireType =
  | "hr"
  | "manager"
  | "leadership"
  | "client_fact_pack";

type DimensionInsight = {
  dimensionKey: string;
  dimensionLabel: string;
  status: "strong" | "moderate" | "weak";
  alignment: "aligned" | "emerging_gap" | "significant_gap";
  completeness: "sufficient" | "partial" | "insufficient";
  averageScore: number | null;
  gap: number | null;
};

type DimensionNarrative = {
  dimensionKey: string;
  dimensionLabel: string;
  observation: string;
  implication: string;
  recommendedNextStep: string;
  confidence: "high" | "medium" | "low";
};

type DimensionAnalysisPattern = {
  code: string;
  label: string;
  description: string;
  severity: string;
};

type DimensionAnalysis = {
  dimensionKey: string;
  dimensionLabel: string;
  dimensionDescription: string;
  averageScore: number | null;
  scores: {
    hr: number | null;
    manager: number | null;
    leadership: number | null;
  };
  gap: number | null;
  alignment: DimensionInsight["alignment"];
  strength: DimensionInsight["status"];
  completeness: DimensionInsight["completeness"];
  confidence: "high" | "medium" | "low";
  gapPattern: string;
  primaryPattern: DimensionAnalysisPattern | null;
  secondaryPattern: DimensionAnalysisPattern | null;
  flags: string[];
};

type ClientSafeDimensionSummary = {
  dimensionKey: string;
  dimensionLabel: string;
  dimensionDescription: string;
  scores: Partial<Record<ScoredQuestionnaireType, number>>;
  completedQuestionnaireTypes: ScoredQuestionnaireType[];
  missingQuestionnaireTypes: ScoredQuestionnaireType[];
  maxScore: number | null;
  minScore: number | null;
  gap: number | null;
};

type QualitativeThemeSummary = {
  key: string;
  label: string;
  count: number;
};

type DimensionQualitativeSummary = {
  dimensionKey: string;
  dimensionLabel: string;
  commentCount: number;
  respondentGroupsWithComments: ScoredQuestionnaireType[];
  keyThemes: QualitativeThemeSummary[];
  advisoryRead: string | null;
  illustrativeSignals: string[];
  confidence: "high" | "medium" | "low";
};

type OverallQualitativeSummary = {
  totalCommentCount: number;
  respondentGroupsWithComments: ScoredQuestionnaireType[];
  crossCuttingThemes: QualitativeThemeSummary[];
  summary: string | null;
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

type ReportAnalyticsDimension = {
  dimensionKey: string;
  dimensionLabel: string;
  overallAverage: number | null;
  hrScore: number | null;
  managerScore: number | null;
  leadershipScore: number | null;
  gap: number | null;
  priorityScore: number;
  issueType: ReportIssueType;
};

type ClientDiagnosticReportResponse = {
  success: true;
  report: {
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
    insightSummary: {
      status: {
        strong: number;
        moderate: number;
        weak: number;
      };
      alignment: {
        aligned: number;
        emergingGap: number;
        significantGap: number;
      };
      completeness: {
        sufficient: number;
        partial: number;
        insufficient: number;
      };
    };
    analytics: {
      overallScore: number | null;
      alignmentScore: number | null;
      confidenceLevel: "low" | "medium" | "high";
      dimensions: ReportAnalyticsDimension[];
      priorityAreas: ReportPriorityArea[];
      priorityClusters: {
        structural: ReportPriorityArea[];
        behavioural: ReportPriorityArea[];
        fragile: ReportPriorityArea[];
        optimisation: ReportPriorityArea[];
      };
    };
    priorityDimensions: {
      strengths: ClientSafeDimensionSummary[];
      gaps: ClientSafeDimensionSummary[];
    };
    dimensions: ClientSafeDimensionSummary[];
    insights: {
      dimensions: DimensionInsight[];
    };
    analyses: {
      dimensions: DimensionAnalysis[];
    };
    narratives: {
      dimensions: DimensionNarrative[];
    };
    qualitative: {
      overall: OverallQualitativeSummary;
      dimensions: DimensionQualitativeSummary[];
    };
    methodology: {
      scoredQuestionnaireTypes: ScoredQuestionnaireType[];
      contextualQuestionnaireTypesExcluded: QuestionnaireType[];
      note: string;
    };
  };
};

type ErrorResponse = {
  success: false;
  error: string;
};

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

function formatQuestionnaireTypeLabel(
  questionnaireType: ScoredQuestionnaireType,
): string {
  switch (questionnaireType) {
    case "hr":
      return "HR";
    case "manager":
      return "Manager";
    case "leadership":
      return "Leadership";
    default:
      return questionnaireType;
  }
}

function formatScore(value: number | null | undefined): string {
  if (typeof value !== "number") {
    return "—";
  }

  return value.toFixed(1);
}

function formatGap(value: number | null): string {
  if (typeof value !== "number") {
    return "—";
  }

  return value.toFixed(2);
}

function formatIssueType(issueType: ReportIssueType): string {
  switch (issueType) {
    case "structural":
      return "Structural";
    case "behavioural":
      return "Behavioural inconsistency";
    case "fragile":
      return "Fragile / uneven";
    case "optimisation":
      return "Optimisation";
    case "insufficient-data":
      return "Insufficient data";
    default:
      return issueType;
  }
}

function formatAlignmentLabel(
  alignment: DimensionInsight["alignment"],
): string {
  switch (alignment) {
    case "aligned":
      return "Aligned";
    case "emerging_gap":
      return "Emerging gap";
    case "significant_gap":
      return "Significant gap";
    default:
      return alignment;
  }
}

function formatStatusLabel(status: DimensionInsight["status"]): string {
  switch (status) {
    case "strong":
      return "Strong";
    case "moderate":
      return "Moderate";
    case "weak":
      return "Weak";
    default:
      return status;
  }
}

function formatConfidenceLabel(
  confidence: "high" | "medium" | "low",
): string {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    case "low":
      return "Low confidence";
    default:
      return confidence;
  }
}

function formatCompletenessLabel(
  completeness: DimensionInsight["completeness"],
): string {
  switch (completeness) {
    case "sufficient":
      return "Sufficient";
    case "partial":
      return "Partial";
    case "insufficient":
      return "Insufficient";
    default:
      return completeness;
  }
}

function formatGapPatternLabel(value: string): string {
  switch (value) {
    case "none":
      return "None";
    case "hr_lower_than_leadership":
      return "HR lower than Leadership";
    case "manager_lower_than_others":
      return "Manager lower than others";
    case "leadership_lower_than_others":
      return "Leadership lower than others";
    case "general_spread":
      return "General spread";
    default:
      return value.replace(/_/g, " ");
  }
}

function getBaseUrl(): string {
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

async function fetchClientDiagnosticReport(
  projectId: string,
): Promise<ClientDiagnosticReportResponse["report"]> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/client-diagnostic-report?projectId=${encodeURIComponent(
    projectId,
  )}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(
      `Expected JSON from report API but received ${contentType || "unknown content type"} from ${url}. Response started with: ${text.slice(
        0,
        120,
      )}`,
    );
  }

  const json = (await response.json()) as
    | ClientDiagnosticReportResponse
    | ErrorResponse;

  if (!response.ok || !json.success) {
    throw new Error(
      json.success === false
        ? json.error
        : "Unable to load client diagnostic report.",
    );
  }

  return json.report;
}

function buildPriorityNarrative(params: {
  area: ReportPriorityArea;
  narrative?: DimensionNarrative;
  qualitative?: DimensionQualitativeSummary;
}): string {
  const { area, narrative, qualitative } = params;

  if (qualitative?.advisoryRead) {
    return qualitative.advisoryRead;
  }

  if (narrative?.implication) {
    return narrative.implication;
  }

  return `${area.dimensionLabel} is showing enough weakness or cross-group variation to justify closer follow-up.`;
}

function getVariationDriver(
  dimension: ClientSafeDimensionSummary,
): string | null {
  const entries = (
    [
      ["hr", dimension.scores.hr],
      ["manager", dimension.scores.manager],
      ["leadership", dimension.scores.leadership],
    ] as const
  ).filter((entry): entry is [ScoredQuestionnaireType, number] => {
    return typeof entry[1] === "number";
  });

  if (entries.length < 2) {
    return null;
  }

  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  if (highest[0] === lowest[0]) {
    return null;
  }

  return `${formatQuestionnaireTypeLabel(highest[0])} is rating this higher than ${formatQuestionnaireTypeLabel(
    lowest[0],
  )}`;
}

function getAlignmentCallout(params: {
  dimension: ClientSafeDimensionSummary;
  insight?: DimensionInsight;
}): string | null {
  const { dimension, insight } = params;

  if (!insight || insight.alignment === "aligned") {
    return null;
  }

  const driver = getVariationDriver(dimension);

  if (!driver) {
    return `This area shows a cross-group spread of ${formatGap(
      dimension.gap,
    )}, suggesting the operating experience is not landing evenly across the scored groups.`;
  }

  return `${driver}. The current spread of ${formatGap(
    dimension.gap,
  )} suggests the model is being experienced differently in practice depending on where you sit.`;
}

function buildDimensionBriefingBlock(params: {
  dimension: ClientSafeDimensionSummary;
  analytics?: ReportAnalyticsDimension;
  insight?: DimensionInsight;
  analysis?: DimensionAnalysis;
  narrative?: DimensionNarrative;
  qualitative?: DimensionQualitativeSummary;
}): string {
  const { dimension, analytics, insight, analysis, narrative, qualitative } =
    params;

  const lines = [
    `Dimension: ${dimension.dimensionLabel}`,
    `Description: ${dimension.dimensionDescription}`,
    `HR score: ${formatScore(dimension.scores.hr)}`,
    `Manager score: ${formatScore(dimension.scores.manager)}`,
    `Leadership score: ${formatScore(dimension.scores.leadership)}`,
    `Overall average: ${formatScore(analytics?.overallAverage)}`,
    `Gap: ${formatGap(dimension.gap)}`,
    `Issue type: ${formatIssueType(
      analytics?.issueType ?? "insufficient-data",
    )}`,
    `Priority score: ${
      typeof analytics?.priorityScore === "number"
        ? analytics.priorityScore.toFixed(2)
        : "—"
    }`,
    `Status: ${insight ? formatStatusLabel(insight.status) : "—"}`,
    `Alignment: ${insight ? formatAlignmentLabel(insight.alignment) : "—"}`,
    `Completeness: ${
      insight ? formatCompletenessLabel(insight.completeness) : "—"
    }`,
    `Analysis confidence: ${
      analysis ? formatConfidenceLabel(analysis.confidence) : "—"
    }`,
    `Gap pattern: ${
      analysis ? formatGapPatternLabel(analysis.gapPattern) : "—"
    }`,
    `Primary pattern: ${analysis?.primaryPattern?.label ?? "—"}`,
    `Primary pattern description: ${
      analysis?.primaryPattern?.description ?? "—"
    }`,
    `Secondary pattern: ${analysis?.secondaryPattern?.label ?? "—"}`,
    `Flags: ${
      analysis && analysis.flags.length > 0 ? analysis.flags.join(", ") : "—"
    }`,
    `Observation: ${narrative?.observation ?? "—"}`,
    `Implication: ${narrative?.implication ?? "—"}`,
    `Recommended next step: ${narrative?.recommendedNextStep ?? "—"}`,
    `Qualitative advisory read: ${qualitative?.advisoryRead ?? "—"}`,
    `Qualitative themes: ${
      qualitative && qualitative.keyThemes.length > 0
        ? qualitative.keyThemes
            .map((theme) => `${theme.label} (${theme.count})`)
            .join(", ")
        : "—"
    }`,
    `Illustrative signals: ${
      qualitative && qualitative.illustrativeSignals.length > 0
        ? qualitative.illustrativeSignals.join(" | ")
        : "—"
    }`,
  ];

  return lines.join("\n");
}

function ThemePill({ theme }: { theme: QualitativeThemeSummary }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
      {theme.label}
      <span className="ml-2 text-slate-400">({theme.count})</span>
    </span>
  );
}

function AnalysisBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export default async function ClientDiagnosticReportPage({
  params,
}: PageProps) {
  const { projectId } = await params;

  if (!isUuid(projectId)) {
    notFound();
  }

  let report: ClientDiagnosticReportResponse["report"];

  try {
    report = await fetchClientDiagnosticReport(projectId);
  } catch (error) {
    console.error("Unable to render client diagnostic report page.", error);
    notFound();
  }

  const insightMap = new Map(
    report.insights.dimensions.map((insight) => [insight.dimensionKey, insight]),
  );

  const analysisMap = new Map(
    report.analyses.dimensions.map((analysis) => [
      analysis.dimensionKey,
      analysis,
    ]),
  );

  const narrativeMap = new Map(
    report.narratives.dimensions.map((narrative) => [
      narrative.dimensionKey,
      narrative,
    ]),
  );

  const qualitativeMap = new Map(
    report.qualitative.dimensions.map((dimension) => [
      dimension.dimensionKey,
      dimension,
    ]),
  );

  const analyticsMap = new Map(
    report.analytics.dimensions.map((dimension) => [
      dimension.dimensionKey,
      dimension,
    ]),
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Internal diagnostic working view
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {report.project.companyName}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
                  This page is designed as a structured internal working output.
                  It is intended for review, copy/paste into an LLM, and
                  conversion into a polished executive summary, presentation, or
                  client-ready narrative.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Executive summary
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {report.executiveSummary.overview}
                </p>
              </div>
            </div>

            <div className="grid min-w-[320px] gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Overall score
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {formatScore(report.analytics.overallScore)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Alignment score
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {formatScore(report.analytics.alignmentScore)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Confidence level
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {report.analytics.confidenceLevel.charAt(0).toUpperCase() +
                    report.analytics.confidenceLevel.slice(1)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Completion
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {report.executiveSummary.completionPercentage}% ·{" "}
                  {report.executiveSummary.completedRespondentGroups} /{" "}
                  {report.executiveSummary.totalRespondentGroups} groups
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href={`/advisor/client-diagnostic/${report.project.projectId}`}
              className="brand-button-primary px-6 py-3 text-base font-medium"
            >
              Back to Advisor Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Priority areas
            </p>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              Top dimensions to follow up
            </h2>

            <div className="mt-5 space-y-4">
              {report.analytics.priorityAreas.length > 0 ? (
                report.analytics.priorityAreas.map((area) => {
                  const narrative = narrativeMap.get(area.dimensionKey);
                  const qualitative = qualitativeMap.get(area.dimensionKey);

                  return (
                    <div
                      key={`priority-${area.dimensionKey}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-950">
                            {area.dimensionLabel}
                          </h3>
                          <p className="mt-3 text-sm leading-7 text-slate-700">
                            {buildPriorityNarrative({
                              area,
                              narrative,
                              qualitative,
                            })}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                            Avg: {formatScore(area.overallAverage)}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                            Gap: {formatGap(area.gap)}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                            {formatIssueType(area.issueType)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                  No priority areas are available yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Qualitative summary
            </p>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              Cross-cutting written signals
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-700">
              {report.qualitative.overall.summary ||
                "No overall qualitative summary is available yet."}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {report.qualitative.overall.crossCuttingThemes.length > 0 ? (
                report.qualitative.overall.crossCuttingThemes.map((theme) => (
                  <ThemePill key={`cross-theme-${theme.key}`} theme={theme} />
                ))
              ) : (
                <p className="text-sm text-slate-600">
                  No cross-cutting written themes are available yet.
                </p>
              )}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Strong
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {report.insightSummary.status.strong}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Moderate
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {report.insightSummary.status.moderate}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Weak
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {report.insightSummary.status.weak}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Full dimension table
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            Scored dimensions and cross-group pattern
          </h2>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-3 pr-4 font-semibold">Dimension</th>
                  <th className="py-3 pr-4 font-semibold">HR</th>
                  <th className="py-3 pr-4 font-semibold">Manager</th>
                  <th className="py-3 pr-4 font-semibold">Leadership</th>
                  <th className="py-3 pr-4 font-semibold">Avg</th>
                  <th className="py-3 pr-4 font-semibold">Gap</th>
                  <th className="py-3 pr-4 font-semibold">Issue type</th>
                  <th className="py-3 pr-4 font-semibold">Alignment</th>
                  <th className="py-3 font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody>
                {report.analytics.dimensions.map((dimension) => {
                  const insight = insightMap.get(dimension.dimensionKey);

                  return (
                    <tr
                      key={`table-${dimension.dimensionKey}`}
                      className="border-b border-slate-100 align-top"
                    >
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {dimension.dimensionLabel}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {formatScore(dimension.hrScore)}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {formatScore(dimension.managerScore)}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {formatScore(dimension.leadershipScore)}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {formatScore(dimension.overallAverage)}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {formatGap(dimension.gap)}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {formatIssueType(dimension.issueType)}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {insight ? formatAlignmentLabel(insight.alignment) : "—"}
                      </td>
                      <td className="py-3 text-slate-700">
                        {dimension.priorityScore.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Priority clusters
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            Issue-type grouping
          </h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {(
              [
                ["Structural", report.analytics.priorityClusters.structural],
                [
                  "Behavioural inconsistency",
                  report.analytics.priorityClusters.behavioural,
                ],
                ["Fragile / uneven", report.analytics.priorityClusters.fragile],
                ["Optimisation", report.analytics.priorityClusters.optimisation],
              ] as const
            ).map(([label, areas]) => (
              <div
                key={`cluster-${label}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <h3 className="text-base font-semibold text-slate-950">
                  {label}
                </h3>

                {areas.length > 0 ? (
                  <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
                    {areas.map((area) => (
                      <li key={`cluster-item-${area.dimensionKey}`}>
                        {area.dimensionLabel}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-slate-500">
                    None currently surfaced in the top priority set.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {report.dimensions.map((dimension) => {
            const insight = insightMap.get(dimension.dimensionKey);
            const analysis = analysisMap.get(dimension.dimensionKey);
            const narrative = narrativeMap.get(dimension.dimensionKey);
            const qualitative = qualitativeMap.get(dimension.dimensionKey);
            const analytics = analyticsMap.get(dimension.dimensionKey);
            const alignmentCallout = getAlignmentCallout({
              dimension,
              insight,
            });
            const briefingBlock = buildDimensionBriefingBlock({
              dimension,
              analytics,
              insight,
              analysis,
              narrative,
              qualitative,
            });

            return (
              <article
                key={dimension.dimensionKey}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      {dimension.dimensionLabel}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-700">
                      {dimension.dimensionDescription}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        HR
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {formatScore(dimension.scores.hr)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Manager
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {formatScore(dimension.scores.manager)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Leadership
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {formatScore(dimension.scores.leadership)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Average
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {formatScore(analytics?.overallAverage)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Gap
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {formatGap(dimension.gap)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Issue type
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {formatIssueType(
                          analytics?.issueType ?? "insufficient-data",
                        )}
                      </p>
                    </div>
                  </div>

                  {alignmentCallout ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                        Cross-group variation
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        {alignmentCallout}
                      </p>
                    </div>
                  ) : null}

                  {analysis ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Analysis signals
                          </p>
                          <p className="mt-3 text-sm leading-7 text-slate-700">
                            Structured diagnostic patterns surfaced by the
                            analysis engine. This section is designed to give a
                            clearer underlying read than prose alone.
                          </p>
                        </div>

                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                          {formatConfidenceLabel(analysis.confidence)}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <AnalysisBadge
                          label="Primary pattern"
                          value={analysis.primaryPattern?.label ?? "None"}
                        />
                        <AnalysisBadge
                          label="Secondary pattern"
                          value={analysis.secondaryPattern?.label ?? "None"}
                        />
                        <AnalysisBadge
                          label="Gap pattern"
                          value={formatGapPatternLabel(analysis.gapPattern)}
                        />
                        <AnalysisBadge
                          label="Flags"
                          value={
                            analysis.flags.length > 0
                              ? analysis.flags.join(", ")
                              : "None"
                          }
                        />
                      </div>

                      {analysis.primaryPattern ? (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Primary pattern description
                          </p>
                          <p className="mt-3 text-sm leading-7 text-slate-700">
                            {analysis.primaryPattern.description}
                          </p>
                        </div>
                      ) : null}

                      {analysis.secondaryPattern ? (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Secondary pattern description
                          </p>
                          <p className="mt-3 text-sm leading-7 text-slate-700">
                            {analysis.secondaryPattern.description}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Observation
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        {narrative?.observation ||
                          "No observation is available for this dimension yet."}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Implication
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        {narrative?.implication ||
                          "No implication is available for this dimension yet."}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Recommended next step
                        </p>
                        {narrative ? (
                          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                            {formatConfidenceLabel(narrative.confidence)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        {narrative?.recommendedNextStep ||
                          "No recommended next step is available for this dimension yet."}
                      </p>
                    </div>
                  </div>

                  {qualitative ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-4xl">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Qualitative evidence
                          </p>
                          <p className="mt-3 text-sm leading-7 text-slate-700">
                            {qualitative.advisoryRead ||
                              "No qualitative advisory read is available for this dimension yet."}
                          </p>
                        </div>

                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                          {formatConfidenceLabel(qualitative.confidence)}
                        </div>
                      </div>

                      {qualitative.keyThemes.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {qualitative.keyThemes.map((theme) => (
                            <ThemePill
                              key={`${dimension.dimensionKey}-${theme.key}`}
                              theme={theme}
                            />
                          ))}
                        </div>
                      ) : null}

                      {qualitative.illustrativeSignals.length > 0 ? (
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Illustrative signals
                          </p>
                          <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                            {qualitative.illustrativeSignals
                              .slice(0, 3)
                              .map((signal) => (
                                <li
                                  key={`${dimension.dimensionKey}-${signal}`}
                                  className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                                >
                                  {signal}
                                </li>
                              ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-slate-900 bg-slate-950 p-5 text-slate-100">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                          LLM briefing block
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-300">
                          This is a compact structured block designed for manual
                          copy and paste into an LLM when you want a richer
                          narrative, executive summary, or slide content.
                        </p>
                      </div>
                    </div>

                    <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-slate-700 bg-slate-900 p-4 text-xs leading-6 text-slate-100">
                      {briefingBlock}
                    </pre>
                  </div>

                  {insight ? (
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                      <span>Status: {formatStatusLabel(insight.status)}</span>
                      <span>·</span>
                      <span>Alignment: {formatAlignmentLabel(insight.alignment)}</span>
                      <span>·</span>
                      <span>
                        Confidence:{" "}
                        {formatConfidenceLabel(
                          analysis?.confidence ??
                            qualitative?.confidence ??
                            narrative?.confidence ??
                            "medium",
                        )}
                      </span>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Methodology
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            Construction notes
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-700">
            {report.methodology.note}
          </p>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Included respondent groups
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              {report.methodology.scoredQuestionnaireTypes
                .map(formatQuestionnaireTypeLabel)
                .join(", ")}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
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
    priorityDimensions: {
      strengths: ClientSafeDimensionSummary[];
      gaps: ClientSafeDimensionSummary[];
    };
    dimensions: ClientSafeDimensionSummary[];
    insights: {
      dimensions: DimensionInsight[];
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

type PriorityArea = {
  dimensionKey: string;
  dimensionLabel: string;
  summary: string;
};

type AlignmentCallout = {
  title: string;
  body: string;
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

function formatConfidenceLabel(
  confidence: DimensionNarrative["confidence"],
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

function getStatusBadgeClasses(status: DimensionInsight["status"]): string {
  switch (status) {
    case "strong":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "moderate":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "weak":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getAlignmentBadgeClasses(
  alignment: DimensionInsight["alignment"],
): string {
  switch (alignment) {
    case "aligned":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "emerging_gap":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "significant_gap":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getCompletenessBadgeClasses(
  completeness: DimensionInsight["completeness"],
): string {
  switch (completeness) {
    case "sufficient":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "partial":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "insufficient":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getConfidenceBadgeClasses(
  confidence: DimensionNarrative["confidence"],
): string {
  switch (confidence) {
    case "high":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "low":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
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

function ThemePill({ theme }: { theme: QualitativeThemeSummary }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
      {theme.label}
      <span className="ml-2 text-slate-400">({theme.count})</span>
    </span>
  );
}

function getOverallAverageScore(dimensions: ClientSafeDimensionSummary[]): number | null {
  const averageScores = dimensions
    .map((dimension) => {
      const values = Object.values(dimension.scores).filter(
        (value): value is number => typeof value === "number",
      );

      if (values.length === 0) {
        return null;
      }

      const total = values.reduce((sum, value) => sum + value, 0);
      return total / values.length;
    })
    .filter((value): value is number => typeof value === "number");

  if (averageScores.length === 0) {
    return null;
  }

  const total = averageScores.reduce((sum, value) => sum + value, 0);
  return Number((total / averageScores.length).toFixed(2));
}

function getOverallMaturityLabel(score: number | null): string {
  if (score === null) {
    return "Insufficient evidence";
  }

  if (score >= 4.0) {
    return "Operationally strong";
  }

  if (score >= 3.2) {
    return "Broadly stable";
  }

  if (score >= 2.8) {
    return "Developing but uneven";
  }

  return "Operationally fragile";
}

function getOverallMaturitySummary(score: number | null): string {
  if (score === null) {
    return "There is not yet enough scored evidence to form a reliable overall maturity view.";
  }

  if (score >= 4.0) {
    return "The operating model appears mature and comparatively well embedded. The main opportunity is likely to be refinement rather than structural correction.";
  }

  if (score >= 3.2) {
    return "The operating model appears broadly stable, with enough structure in place to support day-to-day delivery. The main opportunity is to strengthen the weaker parts of the model so they stop creating unnecessary drag.";
  }

  if (score >= 2.8) {
    return "The operating model appears usable but uneven. Core structures are present, although there is still enough friction in the system to affect reliability, confidence, and efficiency.";
  }

  return "The operating model appears structurally fragile. The current pattern suggests broad operational weakness rather than a few isolated issues.";
}

function getDimensionAverageScore(
  dimension: ClientSafeDimensionSummary,
): number | null {
  const values = Object.values(dimension.scores).filter(
    (value): value is number => typeof value === "number",
  );

  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

function getLowestScoringDimensions(
  dimensions: ClientSafeDimensionSummary[],
  count: number,
): ClientSafeDimensionSummary[] {
  return [...dimensions]
    .sort((a, b) => {
      const aScore = getDimensionAverageScore(a) ?? -1;
      const bScore = getDimensionAverageScore(b) ?? -1;
      return aScore - bScore;
    })
    .slice(0, count);
}

function getPriorityAreaSummary(params: {
  dimension: ClientSafeDimensionSummary;
  narrative?: DimensionNarrative;
  qualitative?: DimensionQualitativeSummary;
}): string {
  const { dimension, narrative, qualitative } = params;

  if (qualitative?.advisoryRead) {
    return qualitative.advisoryRead;
  }

  if (narrative?.implication) {
    return narrative.implication;
  }

  return `${dimension.dimensionLabel} is showing enough weakness or operating friction to justify closer follow-up.`;
}

function getStrengthSummary(params: {
  dimension: ClientSafeDimensionSummary;
  narrative?: DimensionNarrative;
}): string {
  const { dimension, narrative } = params;

  if (narrative?.observation) {
    return narrative.observation;
  }

  return `${dimension.dimensionLabel} appears to be one of the more stable areas in the current response set and can be treated as part of the base to build from.`;
}

function buildImmediatePriorities(params: {
  priorityDimensions: ClientSafeDimensionSummary[];
  narrativeMap: Map<string, DimensionNarrative>;
  qualitativeMap: Map<string, DimensionQualitativeSummary>;
}): PriorityArea[] {
  const { priorityDimensions, narrativeMap, qualitativeMap } = params;

  return priorityDimensions.slice(0, 4).map((dimension) => ({
    dimensionKey: dimension.dimensionKey,
    dimensionLabel: dimension.dimensionLabel,
    summary: getPriorityAreaSummary({
      dimension,
      narrative: narrativeMap.get(dimension.dimensionKey),
      qualitative: qualitativeMap.get(dimension.dimensionKey),
    }),
  }));
}

function getScoreValue(
  dimension: ClientSafeDimensionSummary,
  questionnaireType: ScoredQuestionnaireType,
): number | null {
  const value = dimension.scores[questionnaireType];
  return typeof value === "number" ? value : null;
}

function getHighestAndLowestGroups(
  dimension: ClientSafeDimensionSummary,
): {
  highestGroups: ScoredQuestionnaireType[];
  lowestGroups: ScoredQuestionnaireType[];
  highestScore: number | null;
  lowestScore: number | null;
} {
  const entries = (["hr", "manager", "leadership"] as const)
    .map((group) => ({
      group,
      score: getScoreValue(dimension, group),
    }))
    .filter(
      (
        entry,
      ): entry is {
        group: ScoredQuestionnaireType;
        score: number;
      } => typeof entry.score === "number",
    );

  if (entries.length === 0) {
    return {
      highestGroups: [],
      lowestGroups: [],
      highestScore: null,
      lowestScore: null,
    };
  }

  const highestScore = Math.max(...entries.map((entry) => entry.score));
  const lowestScore = Math.min(...entries.map((entry) => entry.score));

  return {
    highestGroups: entries
      .filter((entry) => entry.score === highestScore)
      .map((entry) => entry.group),
    lowestGroups: entries
      .filter((entry) => entry.score === lowestScore)
      .map((entry) => entry.group),
    highestScore,
    lowestScore,
  };
}

function formatGroupList(groups: ScoredQuestionnaireType[]): string {
  const labels = groups.map(formatQuestionnaireTypeLabel);

  if (labels.length === 0) {
    return "No respondent group";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function buildAlignmentCallout(params: {
  dimension: ClientSafeDimensionSummary;
  insight?: DimensionInsight;
}): AlignmentCallout | null {
  const { dimension, insight } = params;

  if (!insight || insight.alignment === "aligned") {
    return null;
  }

  const { highestGroups, lowestGroups, highestScore, lowestScore } =
    getHighestAndLowestGroups(dimension);

  const gapText = formatGap(dimension.gap);
  const highestText = formatGroupList(highestGroups);
  const lowestText = formatGroupList(lowestGroups);

  if (
    lowestGroups.length === 1 &&
    lowestGroups[0] === "hr" &&
    highestGroups.includes("leadership")
  ) {
    return {
      title: "Perception gap between delivery and leadership",
      body: `This is one of the clearer cross-group gaps in the response set. HR is scoring this area lower than the rest of the organisation, while leadership is scoring it more positively. A gap of ${gapText} often suggests the friction is being felt most directly at delivery level and is not yet fully visible upward.`,
    };
  }

  if (
    lowestGroups.length === 1 &&
    lowestGroups[0] === "manager" &&
    highestGroups.includes("hr") &&
    highestGroups.includes("leadership")
  ) {
    return {
      title: "Manager experience is lagging the designed model",
      body: `Managers are rating this dimension lower than both HR and leadership, with a spread of ${gapText}. That pattern often suggests the model looks clearer in design and governance than it does at the point of day-to-day use. In practice, managers are usually the group most exposed to ambiguity in handoffs, ownership, or application.`,
    };
  }

  if (
    lowestGroups.length === 1 &&
    lowestGroups[0] === "leadership" &&
    highestGroups.length >= 1
  ) {
    return {
      title: "Leadership concern is sharper than local experience",
      body: `Leadership is rating this area below the other respondent groups, with a spread of ${gapText}. That can indicate senior concern about resilience or sustainability that is not yet as visible in day-to-day experience. It can also suggest leadership is evaluating the area against a higher future-state standard.`,
    };
  }

  if (
    highestScore !== null &&
    lowestScore !== null &&
    highestGroups.length === 1 &&
    lowestGroups.length === 1
  ) {
    return {
      title: "Meaningful cross-group spread",
      body: `${highestText} is scoring this area at ${formatScore(
        highestScore,
      )}, while ${lowestText} is scoring it at ${formatScore(
        lowestScore,
      )}. A spread of ${gapText} suggests the operating experience is not landing consistently across respondent groups, which is often as important as the average score itself.`,
    };
  }

  return {
    title: "Cross-group variation needs interpretation",
    body: `The spread on this dimension is ${gapText}, which suggests the experience is not landing evenly across the scored respondent groups. That does not automatically mean one group is right and another is wrong, but it does indicate a meaningful difference in how the model is being experienced.`,
  };
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

  const overallAverageScore = getOverallAverageScore(report.dimensions);
  const overallMaturityLabel = getOverallMaturityLabel(overallAverageScore);
  const overallMaturitySummary = getOverallMaturitySummary(overallAverageScore);

  const weakestDimensions = getLowestScoringDimensions(report.dimensions, 3);
  const immediatePriorities = buildImmediatePriorities({
    priorityDimensions:
      report.priorityDimensions.gaps.length > 0
        ? report.priorityDimensions.gaps
        : weakestDimensions,
    narrativeMap,
    qualitativeMap,
  });

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-5xl">
            <p className="brand-kicker">Client diagnostic report</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              {report.project.companyName}
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This report provides a structured view of current HR operating
              maturity, the degree of alignment across scored respondent groups,
              and the areas most likely to benefit from focused follow-up.
            </p>

            <div className="brand-card-dark mt-8 max-w-4xl p-6 sm:p-7">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                    Executive overview
                  </p>

                  <p className="text-base leading-7 text-slate-200">
                    {report.executiveSummary.overview}
                  </p>

                  <p className="text-base leading-7 text-slate-300">
                    {overallMaturitySummary}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8AAAC8]">
                      Maturity read
                    </p>
                    <p className="mt-2 text-base font-medium text-white">
                      {overallMaturityLabel}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8AAAC8]">
                      Overall average
                    </p>
                    <p className="mt-2 text-base font-medium text-white">
                      {formatScore(overallAverageScore)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8AAAC8]">
                      Completion
                    </p>
                    <p className="mt-2 text-base font-medium text-white">
                      {report.executiveSummary.completionPercentage}%
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8AAAC8]">
                      Respondent groups complete
                    </p>
                    <p className="mt-2 text-base font-medium text-white">
                      {report.executiveSummary.completedRespondentGroups} /{" "}
                      {report.executiveSummary.totalRespondentGroups}
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

                <Link
                  href={`/client-diagnostic-report/${report.project.projectId}/export`}
                  target="_blank"
                  className="brand-button-dark px-6 py-3 text-base font-medium"
                >
                  Export / Print
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="brand-container py-8">
          <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-[#F4F6FA] p-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="brand-surface rounded-xl px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Strong
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {report.insightSummary.status.strong}
              </p>
            </div>

            <div className="brand-surface rounded-xl px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Moderate
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {report.insightSummary.status.moderate}
              </p>
            </div>

            <div className="brand-surface rounded-xl px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Weak
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {report.insightSummary.status.weak}
              </p>
            </div>

            <div className="brand-surface rounded-xl px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Overall average
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {formatScore(overallAverageScore)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="brand-surface-card p-8">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">Overall snapshot</p>
                <h2 className="brand-heading-md text-slate-950">
                  What the response pattern is saying overall
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Operating read
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">
                    {overallMaturityLabel}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {overallMaturitySummary}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Coverage
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">
                    {report.executiveSummary.completedRespondentGroups} of{" "}
                    {report.executiveSummary.totalRespondentGroups} groups complete
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    The scored analysis is based on HR, manager, and leadership
                    input only. Contextual fact pack information is not used in
                    statistical comparison.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Strongest relative areas
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                    {report.priorityDimensions.strengths.length > 0 ? (
                      report.priorityDimensions.strengths.map((dimension) => (
                        <li key={`snapshot-strength-${dimension.dimensionKey}`}>
                          <span className="font-semibold text-slate-900">
                            {dimension.dimensionLabel}:
                          </span>{" "}
                          {getStrengthSummary({
                            dimension,
                            narrative: narrativeMap.get(dimension.dimensionKey),
                          })}
                        </li>
                      ))
                    ) : (
                      <li>No relative strengths are available yet.</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Priority areas
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                    {immediatePriorities.length > 0 ? (
                      immediatePriorities.map((area) => (
                        <li key={`snapshot-priority-${area.dimensionKey}`}>
                          <span className="font-semibold text-slate-900">
                            {area.dimensionLabel}:
                          </span>{" "}
                          {area.summary}
                        </li>
                      ))
                    ) : (
                      <li>No priority areas are available yet.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="brand-surface-card mt-6 p-8">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">Insight summary</p>
                <h2 className="brand-heading-md text-slate-950">
                  Alignment and evidence quality
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Alignment
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                      Aligned: {report.insightSummary.alignment.aligned}
                    </span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                      Emerging gap:{" "}
                      {report.insightSummary.alignment.emergingGap}
                    </span>
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700">
                      Significant gap:{" "}
                      {report.insightSummary.alignment.significantGap}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-700">
                    This reflects how consistently the operating experience is
                    being seen across the scored respondent groups.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Completeness
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                      Sufficient:{" "}
                      {report.insightSummary.completeness.sufficient}
                    </span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                      Partial: {report.insightSummary.completeness.partial}
                    </span>
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700">
                      Insufficient:{" "}
                      {report.insightSummary.completeness.insufficient}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-700">
                    Completeness is based on the presence of scored input from
                    HR, managers, and leadership only.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Relative spread of results
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    The current response set shows{" "}
                    {report.priorityDimensions.gaps.length} highlighted area
                    {report.priorityDimensions.gaps.length === 1 ? "" : "s"}{" "}
                    of notable cross-group variation. That means the current
                    picture is defined more by broad operating strength and
                    weakness than by major disagreement between respondent groups.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="brand-surface-card mt-6 p-8">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">Cross-cutting themes</p>
                <h2 className="brand-heading-md text-slate-950">
                  What respondents are saying behind the scores
                </h2>
                <p className="brand-body max-w-4xl">
                  This section highlights the written signals that recur across
                  the response set. It helps distinguish structural operating
                  issues from isolated local frustrations.
                </p>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-xl bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Overall qualitative read
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                        {report.qualitative.overall.totalCommentCount} written
                        comments
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {report.qualitative.overall.respondentGroupsWithComments.map(
                        (group) => (
                          <span
                            key={`qual-group-${group}`}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700"
                          >
                            {formatQuestionnaireTypeLabel(group)}
                          </span>
                        ),
                      )}
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-700">
                    {report.qualitative.overall.summary ||
                      "No overall qualitative summary is available yet."}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    Cross-cutting themes
                  </p>

                  {report.qualitative.overall.crossCuttingThemes.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {report.qualitative.overall.crossCuttingThemes.map(
                        (theme) => (
                          <ThemePill
                            key={`cross-theme-${theme.key}`}
                            theme={theme}
                          />
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      No cross-cutting written themes are available yet.
                    </p>
                  )}

                  <p className="mt-4 text-sm leading-7 text-slate-700">
                    These themes do not replace the scores. They help explain how
                    the operating model is being experienced in practice.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="brand-surface-card mt-6 p-8">
            <div className="brand-stack-md">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">Immediate priorities</p>
                <h2 className="brand-heading-md text-slate-950">
                  Areas most likely to justify focused follow-up
                </h2>
                <p className="brand-body max-w-4xl">
                  These are the areas most likely to be creating visible
                  operational friction, either because the score pattern is weak,
                  the themes are recurring, or the practical consequences appear
                  disproportionate to the score itself.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {immediatePriorities.map((area) => (
                  <div
                    key={`priority-${area.dimensionKey}`}
                    className="rounded-xl bg-slate-50 p-5"
                  >
                    <h3 className="text-lg font-semibold text-slate-950">
                      {area.dimensionLabel}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {area.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="brand-container brand-section">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="brand-surface-card p-8">
              <div className="brand-stack-md">
                <div className="brand-stack-sm">
                  <p className="brand-section-kicker">Relative strengths</p>
                  <h2 className="brand-heading-md text-slate-950">
                    Areas that look more stable in the current response set
                  </h2>
                </div>

                <div className="space-y-4">
                  {report.priorityDimensions.strengths.length > 0 ? (
                    report.priorityDimensions.strengths.map((dimension) => (
                      <div
                        key={`strength-${dimension.dimensionKey}`}
                        className="rounded-xl bg-slate-50 p-5"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-950">
                              {dimension.dimensionLabel}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {getStrengthSummary({
                                dimension,
                                narrative: narrativeMap.get(dimension.dimensionKey),
                              })}
                            </p>
                          </div>

                          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                            Gap: {formatGap(dimension.gap)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                      No relative strengths are available yet from the current
                      scored response set.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="brand-surface-soft p-8">
              <div className="brand-stack-sm">
                <p className="brand-section-kicker">Methodology</p>
                <h2 className="brand-heading-md text-slate-950">
                  How this report has been constructed
                </h2>
                <p className="brand-body">{report.methodology.note}</p>

                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Included respondent groups
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.methodology.scoredQuestionnaireTypes.map((type) => (
                      <span
                        key={`included-${type}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700"
                      >
                        {formatQuestionnaireTypeLabel(type)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Excluded from scored comparison
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.methodology.contextualQuestionnaireTypesExcluded.map(
                      (type) => (
                        <span
                          key={`excluded-${type}`}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700"
                        >
                          {type === "client_fact_pack"
                            ? "Client Fact Pack"
                            : type.replace(/_/g, " ")}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="brand-container brand-section">
          <div className="brand-stack-sm max-w-4xl">
            <p className="brand-section-kicker">Dimension breakdown</p>
            <h2 className="brand-heading-lg text-slate-950">
              Detailed view by assessed dimension
            </h2>
            <p className="brand-subheading text-slate-700">
              Each dimension below shows scored input from HR, managers, and
              leadership, together with the current interpretation, qualitative
              signal, and recommended next step.
            </p>
          </div>

          <div className="mt-10 grid gap-6">
            {report.dimensions.map((dimension) => {
              const insight = insightMap.get(dimension.dimensionKey);
              const narrative = narrativeMap.get(dimension.dimensionKey);
              const qualitative = qualitativeMap.get(dimension.dimensionKey);
              const alignmentCallout = buildAlignmentCallout({
                dimension,
                insight,
              });

              return (
                <article
                  key={dimension.dimensionKey}
                  className="brand-surface-card p-8"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <h3 className="brand-heading-md text-slate-950">
                        {dimension.dimensionLabel}
                      </h3>
                      <p className="mt-3 text-base leading-7 text-slate-700">
                        {dimension.dimensionDescription}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {insight ? (
                        <>
                          <span
                            className={`rounded-full border px-3 py-1 text-sm font-medium ${getStatusBadgeClasses(
                              insight.status,
                            )}`}
                          >
                            {formatStatusLabel(insight.status)}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-sm font-medium ${getAlignmentBadgeClasses(
                              insight.alignment,
                            )}`}
                          >
                            {formatAlignmentLabel(insight.alignment)}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-sm font-medium ${getCompletenessBadgeClasses(
                              insight.completeness,
                            )}`}
                          >
                            {formatCompletenessLabel(insight.completeness)}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-[#F8FAFC]">
                    <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-4 md:divide-x md:divide-y-0">
                      {(["hr", "manager", "leadership"] as const).map(
                        (questionnaireType) => (
                          <div
                            key={`${dimension.dimensionKey}-${questionnaireType}`}
                            className="p-5"
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              {formatQuestionnaireTypeLabel(questionnaireType)}
                            </p>
                            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                              {formatScore(dimension.scores[questionnaireType])}
                            </p>
                          </div>
                        ),
                      )}

                      <div className="p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Gap
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                          {formatGap(dimension.gap)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {alignmentCallout ? (
                    <div className="mt-6 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                        Alignment call-out
                      </p>
                      <h4 className="mt-3 text-lg font-semibold text-slate-950">
                        {alignmentCallout.title}
                      </h4>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        {alignmentCallout.body}
                      </p>
                    </div>
                  ) : null}

                  {qualitative ? (
                    <div className="mt-6 rounded-[1.25rem] border border-slate-200 bg-[#F8FAFC] p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Qualitative signal
                          </p>
                          <p className="mt-3 text-sm leading-7 text-slate-700">
                            {qualitative.advisoryRead ||
                              "No written qualitative summary is available for this dimension yet."}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                            {qualitative.commentCount} comment
                            {qualitative.commentCount === 1 ? "" : "s"}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-sm font-medium ${getConfidenceBadgeClasses(
                              qualitative.confidence,
                            )}`}
                          >
                            {formatConfidenceLabel(qualitative.confidence)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                        <div className="rounded-xl bg-white p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Key themes
                          </p>

                          {qualitative.keyThemes.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {qualitative.keyThemes.map((theme) => (
                                <ThemePill
                                  key={`${dimension.dimensionKey}-${theme.key}`}
                                  theme={theme}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="mt-4 text-sm leading-7 text-slate-600">
                              No specific written themes have been grouped for
                              this dimension yet.
                            </p>
                          )}

                          <div className="mt-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Respondent groups represented
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {qualitative.respondentGroupsWithComments.map(
                                (group) => (
                                  <span
                                    key={`${dimension.dimensionKey}-${group}`}
                                    className="rounded-full border border-slate-200 bg-[#F8FAFC] px-3 py-1 text-sm font-medium text-slate-700"
                                  >
                                    {formatQuestionnaireTypeLabel(group)}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl bg-white p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Illustrative signals
                          </p>

                          {qualitative.illustrativeSignals.length > 0 ? (
                            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                              {qualitative.illustrativeSignals
                                .slice(0, 3)
                                .map((signal) => (
                                  <li
                                    key={`${dimension.dimensionKey}-${signal}`}
                                    className="rounded-lg border border-slate-200 bg-[#F8FAFC] px-4 py-3"
                                  >
                                    {signal}
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <p className="mt-4 text-sm leading-7 text-slate-600">
                              No illustrative written signals are available for
                              this dimension yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {narrative ? (
                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Observation
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-700">
                          {narrative.observation}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Implication
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-700">
                          {narrative.implication}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Recommended next step
                          </p>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getConfidenceBadgeClasses(
                              narrative.confidence,
                            )}`}
                          >
                            {formatConfidenceLabel(narrative.confidence)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">
                          {narrative.recommendedNextStep}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
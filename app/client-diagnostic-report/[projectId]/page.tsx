import Link from "next/link";
import { notFound } from "next/navigation";

export const runtime = "edge";

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
              maturity, the level of alignment across key respondent groups, and
              the most important areas for follow-up discussion.
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
                    The analysis is based on scored input from HR, managers, and
                    leadership. It is intended to surface where current people
                    operations feel strong, where experience varies across
                    groups, and where deeper discussion is likely to be most
                    valuable.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8AAAC8]">
                      Status
                    </p>
                    <p className="mt-2 text-base font-medium capitalize text-white">
                      {report.project.projectStatus.replace(/_/g, " ")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8AAAC8]">
                      Primary contact
                    </p>
                    <p className="mt-2 text-base font-medium text-white">
                      {report.project.primaryContactName}
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
                Priority gaps
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {report.priorityDimensions.gaps.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F6FA]">
        <div className="brand-container brand-section">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="brand-surface-card p-8">
              <div className="brand-stack-md">
                <div className="brand-stack-sm">
                  <p className="brand-section-kicker">Key strengths</p>
                  <h2 className="brand-heading-md text-slate-950">
                    Relative strengths in the current response set
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
                              {dimension.dimensionDescription}
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

            <div className="brand-surface-card p-8">
              <div className="brand-stack-md">
                <div className="brand-stack-sm">
                  <p className="brand-section-kicker">Insight summary</p>
                  <h2 className="brand-heading-md text-slate-950">
                    Alignment and completeness
                  </h2>
                </div>

                <div className="space-y-4">
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
                  </div>

                  <div className="rounded-xl bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">
                      Priority gaps highlighted
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {report.priorityDimensions.gaps.length} area
                      {report.priorityDimensions.gaps.length === 1 ? "" : "s"}{" "}
                      of notable cross-group variation are currently highlighted
                      for deeper review.
                    </p>
                  </div>
                </div>
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
                  <p className="brand-section-kicker">Priority gaps</p>
                  <h2 className="brand-heading-md text-slate-950">
                    Areas of greatest cross-group variation
                  </h2>
                </div>

                <div className="space-y-4">
                  {report.priorityDimensions.gaps.length > 0 ? (
                    report.priorityDimensions.gaps.map((dimension) => (
                      <div
                        key={`gap-${dimension.dimensionKey}`}
                        className="rounded-xl bg-slate-50 p-5"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-950">
                              {dimension.dimensionLabel}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {dimension.dimensionDescription}
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
                      No priority gaps are available yet from the current
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
              leadership, together with the current interpretation and
              recommended next step.
            </p>
          </div>

          <div className="mt-10 grid gap-6">
            {report.dimensions.map((dimension) => {
              const insight = insightMap.get(dimension.dimensionKey);
              const narrative = narrativeMap.get(dimension.dimensionKey);

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
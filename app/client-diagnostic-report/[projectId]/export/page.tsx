import { notFound } from "next/navigation";
import PrintActions from "./PrintActions";

export const runtime = "edge";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
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

type QualitativeTheme = {
  key: string;
  label: string;
  count: number;
};

type QualitativeDimensionSummary = {
  dimensionKey: string;
  dimensionLabel: string;
  commentCount: number;
  respondentGroupsWithComments: ScoredQuestionnaireType[];
  keyThemes: QualitativeTheme[];
  advisoryRead: string;
  illustrativeSignals: string[];
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
    qualitative?: {
      overall: {
        totalCommentCount: number;
        respondentGroupsWithComments: ScoredQuestionnaireType[];
        crossCuttingThemes: QualitativeTheme[];
        summary: string;
      };
      dimensions: QualitativeDimensionSummary[];
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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
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

function formatConfidenceLabel(
  confidence: DimensionNarrative["confidence"] | QualitativeDimensionSummary["confidence"],
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

export default async function ClientDiagnosticReportExportPage({
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
    console.error("Unable to render export report page.", error);
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
    (report.qualitative?.dimensions ?? []).map((dimension) => [
      dimension.dimensionKey,
      dimension,
    ]),
  );

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10 print:px-0 print:py-0">
        <PrintActions />

        <article className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <header className="border-b border-slate-200 pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Van Esch Advisory Ltd
            </p>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              {report.project.companyName}
            </h1>

            <p className="mt-2 text-base text-slate-600">
              HR Operations Diagnostic Report
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Project status
                </p>
                <p className="mt-2 text-base font-medium text-slate-900 capitalize">
                  {report.project.projectStatus.replace(/_/g, " ")}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Primary contact
                </p>
                <p className="mt-2 text-base font-medium text-slate-900">
                  {report.project.primaryContactName}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Completion
                </p>
                <p className="mt-2 text-base font-medium text-slate-900">
                  {report.executiveSummary.completionPercentage}%
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Respondent groups complete
                </p>
                <p className="mt-2 text-base font-medium text-slate-900">
                  {report.executiveSummary.completedRespondentGroups} /{" "}
                  {report.executiveSummary.totalRespondentGroups}
                </p>
              </div>
            </div>
          </header>

          <section className="mt-10">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Executive Summary
            </h2>

            <p className="mt-4 text-base leading-8 text-slate-700">
              {report.executiveSummary.overview}
            </p>
          </section>

          <section className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-950">
                Relative strengths
              </h2>

              <div className="mt-4 space-y-4">
                {report.priorityDimensions.strengths.map((dimension) => (
                  <div
                    key={`strength-${dimension.dimensionKey}`}
                    className="rounded-xl bg-white p-4"
                  >
                    <h3 className="font-semibold text-slate-900">
                      {dimension.dimensionLabel}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {dimension.dimensionDescription}
                    </p>
                    <p className="mt-3 text-sm font-medium text-slate-900">
                      Gap: {formatGap(dimension.gap)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-950">
                Priority gaps
              </h2>

              <div className="mt-4 space-y-4">
                {report.priorityDimensions.gaps.map((dimension) => (
                  <div
                    key={`gap-${dimension.dimensionKey}`}
                    className="rounded-xl bg-white p-4"
                  >
                    <h3 className="font-semibold text-slate-900">
                      {dimension.dimensionLabel}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {dimension.dimensionDescription}
                    </p>
                    <p className="mt-3 text-sm font-medium text-slate-900">
                      Gap: {formatGap(dimension.gap)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {report.qualitative ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Qualitative Summary
              </h2>

              <p className="mt-4 text-base leading-8 text-slate-700">
                {report.qualitative.overall.summary}
              </p>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-900">
                  Cross-cutting themes
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {report.qualitative.overall.crossCuttingThemes.map((theme) => (
                    <span
                      key={theme.key}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                    >
                      {theme.label} ({theme.count})
                    </span>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <section className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Dimension Detail
            </h2>

            <div className="mt-8 space-y-8">
              {report.dimensions.map((dimension) => {
                const insight = insightMap.get(dimension.dimensionKey);
                const narrative = narrativeMap.get(dimension.dimensionKey);
                const qualitative = qualitativeMap.get(dimension.dimensionKey);

                return (
                  <section
                    key={dimension.dimensionKey}
                    className="rounded-2xl border border-slate-200 p-6"
                  >
                    <h3 className="text-xl font-semibold text-slate-950">
                      {dimension.dimensionLabel}
                    </h3>

                    <p className="mt-3 text-base leading-7 text-slate-700">
                      {dimension.dimensionDescription}
                    </p>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                      <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">
                        <div className="p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            HR
                          </p>
                          <p className="mt-2 text-xl font-semibold text-slate-950">
                            {formatScore(dimension.scores.hr)}
                          </p>
                        </div>

                        <div className="p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Manager
                          </p>
                          <p className="mt-2 text-xl font-semibold text-slate-950">
                            {formatScore(dimension.scores.manager)}
                          </p>
                        </div>

                        <div className="p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Leadership
                          </p>
                          <p className="mt-2 text-xl font-semibold text-slate-950">
                            {formatScore(dimension.scores.leadership)}
                          </p>
                        </div>

                        <div className="p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Gap
                          </p>
                          <p className="mt-2 text-xl font-semibold text-slate-950">
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
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Recommended next step
                          </p>
                          <p className="mt-3 text-sm leading-7 text-slate-700">
                            {narrative.recommendedNextStep}
                          </p>
                          <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                            {formatConfidenceLabel(narrative.confidence)}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {qualitative ? (
                      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                        <h4 className="text-base font-semibold text-slate-950">
                          Qualitative evidence
                        </h4>

                        <p className="mt-3 text-sm leading-7 text-slate-700">
                          {qualitative.advisoryRead}
                        </p>

                        {qualitative.keyThemes.length > 0 ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {qualitative.keyThemes.map((theme) => (
                              <span
                                key={theme.key}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                              >
                                {theme.label} ({theme.count})
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {qualitative.illustrativeSignals.length > 0 ? (
                          <div className="mt-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Illustrative signals
                            </p>

                            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                              {qualitative.illustrativeSignals.map((signal) => (
                                <li key={signal}>• {signal}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                          {formatConfidenceLabel(qualitative.confidence)}
                        </p>
                      </div>
                    ) : null}

                    {insight ? (
                      <div className="mt-5 text-xs uppercase tracking-[0.14em] text-slate-500">
                        Status: {insight.status} · Alignment: {insight.alignment} ·
                        Completeness: {insight.completeness}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </section>

          <section className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Methodology
            </h2>

            <p className="mt-4 text-base leading-8 text-slate-700">
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
          </section>
        </article>
      </div>
    </main>
  );
}
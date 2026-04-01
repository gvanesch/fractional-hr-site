export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const runtime = "edge";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

type QuestionnaireType = "hr" | "manager" | "leadership" | "client_fact_pack";
type ScoredQuestionnaireType = "hr" | "manager" | "leadership";

type DimensionSummary = {
  dimensionKey: string;
  dimensionLabel: string;
  dimensionDescription: string;
  scores: Partial<Record<QuestionnaireType, number>>;
  completedQuestionnaireTypes: QuestionnaireType[];
  missingQuestionnaireTypes: QuestionnaireType[];
  maxScore: number | null;
  minScore: number | null;
  gap: number | null;
};

type RespondentGroupSummary = {
  questionnaireType: QuestionnaireType;
  label: string;
  totalInvited: number;
  outstanding: number;
  completed: number;
  outstandingParticipants: Array<{
    participantId: string;
    roleLabel: string;
    participantStatus: string;
    startedAt: string | null;
    completedAt: string | null;
    updatedAt: string;
  }>;
};

type ProjectSummaryResponse = {
  success: true;
  project: {
    projectId: string;
    companyName: string;
    primaryContactName: string;
    primaryContactEmail: string;
    projectStatus: string;
    notes: string | null;
  };
  completion: {
    totalInvited: number;
    outstanding: number;
    completed: number;
    completionPercentage: number;
    participants: Array<{
      participantId: string;
      questionnaireType: QuestionnaireType;
      roleLabel: string;
      participantStatus: string;
      startedAt: string | null;
      completedAt: string | null;
      updatedAt: string;
    }>;
    respondentGroups: RespondentGroupSummary[];
  };
  dimensions: DimensionSummary[];
  strongestAlignment: DimensionSummary[];
  biggestGaps: DimensionSummary[];
};

type ErrorResponse = {
  success: false;
  error: string;
};

const QUESTIONNAIRE_TYPES: QuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
  "client_fact_pack",
];

const SCORED_QUESTIONNAIRE_TYPES: ScoredQuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
];

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function formatQuestionnaireType(questionnaireType: QuestionnaireType): string {
  switch (questionnaireType) {
    case "hr":
      return "HR";
    case "manager":
      return "Manager";
    case "leadership":
      return "Leadership";
    case "client_fact_pack":
      return "Fact Pack";
    default:
      return questionnaireType;
  }
}

function formatParticipantStatus(status: string): string {
  if (status === "completed") {
    return "Submitted";
  }

  if (status === "invited") {
    return "Not yet submitted";
  }

  if (status === "in_progress") {
    return "Not yet submitted";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatScore(value: number | null | undefined): string {
  if (typeof value !== "number") {
    return "—";
  }

  return value.toFixed(2);
}

function formatGap(value: number | null | undefined): string {
  if (typeof value !== "number") {
    return "—";
  }

  return value.toFixed(2);
}

function getStatusPillClasses(status: string): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

function getGapToneClasses(gap: number | null): string {
  if (gap === null) {
    return "text-slate-500";
  }

  if (gap >= 1.5) {
    return "text-rose-700";
  }

  if (gap >= 0.75) {
    return "text-amber-700";
  }

  return "text-emerald-700";
}

function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

function average(values: number[]): number | null {
  if (!values.length) {
    return null;
  }

  return roundToTwo(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getScoredGroupCompletionCount(
  respondentGroups: RespondentGroupSummary[],
): number {
  return respondentGroups.filter(
    (group) =>
      SCORED_QUESTIONNAIRE_TYPES.includes(
        group.questionnaireType as ScoredQuestionnaireType,
      ) && group.completed > 0,
  ).length;
}

function getReportingReadiness(
  respondentGroups: RespondentGroupSummary[],
): {
  label: string;
  summary: string;
  tone: "slate" | "amber" | "emerald";
} {
  const completedScoredGroups = getScoredGroupCompletionCount(respondentGroups);

  if (completedScoredGroups < 2) {
    return {
      label: "Not ready",
      summary:
        "Fewer than two scored respondent groups have submitted. Reporting at this point would be too partial to rely on.",
      tone: "slate",
    };
  }

  if (completedScoredGroups < 3) {
    return {
      label: "Directional only",
      summary:
        "Two scored respondent groups have submitted. Early patterns can be reviewed, but the report should still be treated as directional.",
      tone: "amber",
    };
  }

  return {
    label: "Ready for reporting",
    summary:
      "All three scored respondent groups are represented. The project is ready for fuller reporting and interpretation.",
    tone: "emerald",
  };
}

function getOverallAverageScore(dimensions: DimensionSummary[]): number | null {
  const averages = dimensions
    .map((dimension) => {
      const values = [
        dimension.scores.hr,
        dimension.scores.manager,
        dimension.scores.leadership,
      ].filter((value): value is number => typeof value === "number");

      return average(values);
    })
    .filter((value): value is number => typeof value === "number");

  return average(averages);
}

function getAverageGap(dimensions: DimensionSummary[]): number | null {
  const gaps = dimensions
    .map((dimension) => dimension.gap)
    .filter((value): value is number => typeof value === "number");

  return average(gaps);
}

function getFullyPopulatedDimensionCount(dimensions: DimensionSummary[]): number {
  return dimensions.filter((dimension) =>
    SCORED_QUESTIONNAIRE_TYPES.every(
      (type) => typeof dimension.scores[type] === "number",
    ),
  ).length;
}

function getLowestAverageDimensions(
  dimensions: DimensionSummary[],
  count: number,
): Array<{ dimensionLabel: string; average: number | null }> {
  return dimensions
    .map((dimension) => {
      const values = [
        dimension.scores.hr,
        dimension.scores.manager,
        dimension.scores.leadership,
      ].filter((value): value is number => typeof value === "number");

      return {
        dimensionLabel: dimension.dimensionLabel,
        average: average(values),
      };
    })
    .filter((item) => item.average !== null)
    .sort((a, b) => (a.average ?? 999) - (b.average ?? 999))
    .slice(0, count);
}

function getLargestGapDimensions(
  dimensions: DimensionSummary[],
  count: number,
): Array<{ dimensionLabel: string; gap: number | null }> {
  return dimensions
    .filter((dimension) => dimension.gap !== null)
    .sort((a, b) => (b.gap ?? -1) - (a.gap ?? -1))
    .slice(0, count)
    .map((dimension) => ({
      dimensionLabel: dimension.dimensionLabel,
      gap: dimension.gap,
    }));
}

function getLowestGroupSignals(dimensions: DimensionSummary[]): string[] {
  const signals: string[] = [];

  for (const dimension of dimensions) {
    const rawEntries = [
      ["HR", dimension.scores.hr],
      ["Manager", dimension.scores.manager],
      ["Leadership", dimension.scores.leadership],
    ] as const;

    const entries = rawEntries.filter(
      (
        entry,
      ): entry is readonly ["HR" | "Manager" | "Leadership", number] =>
        typeof entry[1] === "number",
    );

    if (entries.length < 2) {
      continue;
    }

    const sorted = [...entries].sort((a, b) => a[1] - b[1]);
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];

    if (lowest[0] !== highest[0]) {
      signals.push(
        `${dimension.dimensionLabel}: ${lowest[0]} currently lowest at ${lowest[1].toFixed(
          2,
        )}, versus ${highest[0]} at ${highest[1].toFixed(2)}.`,
      );
    }
  }

  return signals.slice(0, 4);
}

async function getBaseUrl(): Promise<string> {
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (envSiteUrl) {
    return envSiteUrl.replace(/\/$/, "");
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");

  if (!host) {
    throw new Error("Unable to determine site host.");
  }

  const protocol =
    host.includes("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https";

  return `${protocol}://${host}`;
}

async function getProjectSummary(
  projectId: string,
): Promise<ProjectSummaryResponse> {
  const baseUrl = await getBaseUrl();

  const response = await fetch(
    `${baseUrl}/api/client-diagnostic-project-summary?projectId=${encodeURIComponent(
      projectId,
    )}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    notFound();
  }

  const data = (await response.json()) as
    | ProjectSummaryResponse
    | ErrorResponse;

  if (!response.ok || !data.success) {
    throw new Error("Unable to load client diagnostic project summary.");
  }

  return data;
}

export default async function ClientDiagnosticProjectDashboardPage({
  params,
}: PageProps) {
  const { projectId } = await params;

  if (!isUuid(projectId)) {
    notFound();
  }

  const summary = await getProjectSummary(projectId);

  const project = summary.project;
  const respondentGroups = summary.completion.respondentGroups;
  const dimensionSummaries = summary.dimensions;

  const participantRows = [...summary.completion.participants].sort((a, b) => {
    if (a.questionnaireType !== b.questionnaireType) {
      return a.questionnaireType.localeCompare(b.questionnaireType);
    }

    return a.roleLabel.localeCompare(b.roleLabel);
  });

  const completedParticipants = summary.completion.completed;
  const totalInvitedParticipants = summary.completion.totalInvited;
  const outstandingParticipants = summary.completion.outstanding;
  const completionPercentage = summary.completion.completionPercentage;

  const reportingReadiness = getReportingReadiness(respondentGroups);
  const overallAverageScore = getOverallAverageScore(dimensionSummaries);
  const averageGap = getAverageGap(dimensionSummaries);
  const fullyPopulatedDimensions =
    getFullyPopulatedDimensionCount(dimensionSummaries);

  const lowestAverageDimensions = getLowestAverageDimensions(
    dimensionSummaries,
    3,
  );
  const largestGapDimensions = getLargestGapDimensions(dimensionSummaries, 3);
  const lowestGroupSignals = getLowestGroupSignals(dimensionSummaries);

  return (
    <main className="brand-light-section min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Advisor dashboard
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {project.companyName}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
                Practical internal view for submission tracking, follow-up, data
                coverage, and reporting readiness. This page is operational only.
                Interpretation belongs in the report view.
              </p>
            </div>

            <div className="grid min-w-[320px] gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <SummaryStat label="Project status" value={project.projectStatus} />
              <SummaryStat
                label="Completion"
                value={`${completionPercentage}%`}
              />
              <SummaryStat
                label="Submitted"
                value={`${completedParticipants} / ${totalInvitedParticipants}`}
              />
              <SummaryStat
                label="Outstanding"
                value={String(outstandingParticipants)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Project overview
            </p>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              Submission status and contact overview
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoCard
                label="Primary contact"
                value={project.primaryContactName}
                secondary={project.primaryContactEmail}
              />
              <InfoCard
                label="Total invited"
                value={String(totalInvitedParticipants)}
                secondary={`${completedParticipants} submitted · ${outstandingParticipants} outstanding`}
              />
              <InfoCard
                label="Completed submissions"
                value={String(completedParticipants)}
                secondary={`${completionPercentage}% complete`}
              />
              <InfoCard
                label="Reporting readiness"
                value={reportingReadiness.label}
                secondary={reportingReadiness.summary}
              />
            </div>

            {project.notes ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Project notes
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  {project.notes}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Data quality and readiness
            </p>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              Current evidence base
            </h2>

            <div className="mt-5 space-y-4">
              <StageSummaryRow
                label="Scored groups represented"
                value={`${getScoredGroupCompletionCount(respondentGroups)} / 3`}
                tone={reportingReadiness.tone}
              />
              <StageSummaryRow
                label="Fully populated dimensions"
                value={`${fullyPopulatedDimensions} / ${dimensionSummaries.length}`}
                tone="slate"
              />
              <StageSummaryRow
                label="Overall average score"
                value={formatScore(overallAverageScore)}
                tone="slate"
              />
              <StageSummaryRow
                label="Average gap"
                value={formatGap(averageGap)}
                tone={
                  averageGap !== null && averageGap >= 0.75 ? "amber" : "emerald"
                }
              />
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[var(--brand-accent)]"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This dashboard only reflects invited versus submitted responses.
              It does not track live questionnaire progress before submission.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Respondent group coverage
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            Invitation and submission coverage by group
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {respondentGroups.map((group) => (
              <RespondentSummaryCard key={group.questionnaireType} group={group} />
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Outstanding follow-up
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            Requested participants still awaiting submission
          </h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {respondentGroups.map((group) => (
              <OutstandingGroupCard key={group.questionnaireType} group={group} />
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Early signal monitor
            </p>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              Lowest current average scores
            </h2>

            <div className="mt-5 space-y-3">
              {lowestAverageDimensions.length > 0 ? (
                lowestAverageDimensions.map((dimension) => (
                  <SignalCard
                    key={`lowest-${dimension.dimensionLabel}`}
                    title={dimension.dimensionLabel}
                    value={formatScore(dimension.average)}
                    secondary="Current average across submitted scored groups"
                  />
                ))
              ) : (
                <EmptyStateCard message="Not enough submitted scored data yet to surface low-average dimensions." />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Early signal monitor
            </p>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              Largest current score gaps
            </h2>

            <div className="mt-5 space-y-3">
              {largestGapDimensions.length > 0 ? (
                largestGapDimensions.map((dimension) => (
                  <SignalCard
                    key={`gap-${dimension.dimensionLabel}`}
                    title={dimension.dimensionLabel}
                    value={formatGap(dimension.gap)}
                    secondary="Current max spread across submitted scored groups"
                  />
                ))
              ) : (
                <EmptyStateCard message="Gap monitoring will appear once more than one scored group has submitted." />
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Cross-group signals
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            Current role-to-role differences
          </h2>

          <div className="mt-5 space-y-3">
            {lowestGroupSignals.length > 0 ? (
              lowestGroupSignals.map((signal) => (
                <div
                  key={signal}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700"
                >
                  {signal}
                </div>
              ))
            ) : (
              <EmptyStateCard message="Cross-group difference signals will appear once enough scored submissions exist." />
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Participant table
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            Invitation and submission register
          </h2>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Role
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Questionnaire
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Submission status
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Completed
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Last updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {participantRows.map((participant) => (
                  <tr key={participant.participantId}>
                    <td className="border-b border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900">
                      {participant.roleLabel}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-700">
                      {formatQuestionnaireType(participant.questionnaireType)}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusPillClasses(
                          participant.participantStatus,
                        )}`}
                      >
                        {formatParticipantStatus(participant.participantStatus)}
                      </span>
                    </td>
                    <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-700">
                      {formatDateTime(participant.completedAt)}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-700">
                      {formatDateTime(participant.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Current scored evidence
          </p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            Dimension coverage and score table
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
            This table is factual only. It shows current submitted scores,
            missing scored groups, and score spread. Interpretation should be
            done in the report page once sufficient evidence exists.
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Dimension
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    HR
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Manager
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Leadership
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Fact Pack
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Gap
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Coverage
                  </th>
                </tr>
              </thead>
              <tbody>
                {dimensionSummaries.map((dimension) => (
                  <tr key={dimension.dimensionKey}>
                    <td className="border-b border-slate-200 px-4 py-4 align-top">
                      <p className="text-sm font-semibold text-slate-900">
                        {dimension.dimensionLabel}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {dimension.dimensionDescription}
                      </p>
                    </td>
                    <ScoreCell value={dimension.scores.hr} />
                    <ScoreCell value={dimension.scores.manager} />
                    <ScoreCell value={dimension.scores.leadership} />
                    <ScoreCell value={dimension.scores.client_fact_pack} />
                    <td className="border-b border-slate-200 px-4 py-4 align-top">
                      <p
                        className={`text-sm font-semibold ${getGapToneClasses(
                          dimension.gap,
                        )}`}
                      >
                        {dimension.gap !== null
                          ? dimension.gap.toFixed(2)
                          : "—"}
                      </p>
                    </td>
                    <td className="border-b border-slate-200 px-4 py-4 align-top">
                      <p className="text-sm font-semibold text-slate-900">
                        {dimension.completedQuestionnaireTypes.length} /{" "}
                        {QUESTIONNAIRE_TYPES.length}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {dimension.missingQuestionnaireTypes.length > 0
                          ? `Missing: ${dimension.missingQuestionnaireTypes
                              .map(formatQuestionnaireType)
                              .join(", ")}`
                          : "All requested groups submitted"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-base font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{secondary}</p>
    </div>
  );
}

function StageSummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber" | "slate";
}) {
  const toneClasses =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-slate-700";

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className={`text-sm font-semibold ${toneClasses}`}>{value}</span>
    </div>
  );
}

function RespondentSummaryCard({
  group,
}: {
  group: RespondentGroupSummary;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {group.label}
      </p>

      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-slate-900">
            {group.completed}/{group.totalInvited}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            submitted responses
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold text-amber-700">
            {group.outstanding} outstanding
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {group.totalInvited} invited
          </p>
        </div>
      </div>
    </div>
  );
}

function OutstandingGroupCard({
  group,
}: {
  group: RespondentGroupSummary;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-slate-900">{group.label}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {group.totalInvited} invited · {group.outstanding} outstanding ·{" "}
            {group.completed} submitted
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-900">
          {group.outstanding} outstanding
        </div>
      </div>

      <div className="mt-4">
        {group.outstandingParticipants.length > 0 ? (
          <div className="space-y-3">
            {group.outstandingParticipants.map((participant) => (
              <div
                key={participant.participantId}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {participant.roleLabel}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Last updated {formatDateTime(participant.updatedAt)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getStatusPillClasses(
                      participant.participantStatus,
                    )}`}
                  >
                    {formatParticipantStatus(participant.participantStatus)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateCard message="All requested participants in this group have submitted." />
        )}
      </div>
    </div>
  );
}

function SignalCard({
  title,
  value,
  secondary,
}: {
  title: string;
  value: string;
  secondary: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{secondary}</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-900">
          {value}
        </div>
      </div>
    </div>
  );
}

function EmptyStateCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
      <p className="text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}

function ScoreCell({ value }: { value?: number }) {
  return (
    <td className="border-b border-slate-200 px-4 py-4 align-top">
      <p className="text-sm font-semibold text-slate-900">
        {typeof value === "number" ? value.toFixed(2) : "—"}
      </p>
    </td>
  );
}
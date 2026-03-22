import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  buildDimensionInsights,
  type DimensionInsight,
} from "@/lib/client-diagnostic/insight-engine";
import {
  buildDimensionNarratives,
  type DimensionNarrative,
} from "@/lib/client-diagnostic/narrative-engine";
import {
  dimensionDefinitions,
  questionnaireTypes,
  type QuestionnaireType,
} from "@/lib/client-diagnostic/question-bank";

export const runtime = "edge";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

type ParticipantRow = {
  participant_id: string;
  questionnaire_type: QuestionnaireType;
  role_label: string;
  participant_status: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

type DimensionScoreRow = {
  score_id: string;
  project_id: string;
  questionnaire_type: QuestionnaireType;
  dimension_key: string;
  average_score: number;
  response_count: number;
  updated_at: string;
};

type ProjectRow = {
  project_id: string;
  company_name: string;
  primary_contact_name: string;
  primary_contact_email: string;
  project_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type QuestionnaireTypeScores = Partial<Record<QuestionnaireType, number>>;

type DimensionSummary = {
  dimensionKey: string;
  dimensionLabel: string;
  dimensionDescription: string;
  scores: QuestionnaireTypeScores;
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

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function buildDimensionSummaries(
  scoreRows: DimensionScoreRow[],
): DimensionSummary[] {
  return dimensionDefinitions.map((dimension) => {
    const matchingRows = scoreRows.filter(
      (row) => row.dimension_key === dimension.key,
    );

    const scores: QuestionnaireTypeScores = {};
    const completedQuestionnaireTypes: QuestionnaireType[] = [];
    const missingQuestionnaireTypes: QuestionnaireType[] = [];

    for (const questionnaireType of questionnaireTypes) {
      const match = matchingRows.find(
        (row) => row.questionnaire_type === questionnaireType,
      );

      if (match) {
        scores[questionnaireType] = Number(match.average_score);
        completedQuestionnaireTypes.push(questionnaireType);
      } else {
        missingQuestionnaireTypes.push(questionnaireType);
      }
    }

    const numericScores = Object.values(scores).filter(
      (value): value is number => typeof value === "number",
    );

    const maxScore =
      numericScores.length > 0 ? Math.max(...numericScores) : null;
    const minScore =
      numericScores.length > 0 ? Math.min(...numericScores) : null;
    const gap =
      maxScore !== null && minScore !== null
        ? Number((maxScore - minScore).toFixed(2))
        : null;

    return {
      dimensionKey: dimension.key,
      dimensionLabel: dimension.label,
      dimensionDescription: dimension.description,
      scores,
      completedQuestionnaireTypes,
      missingQuestionnaireTypes,
      maxScore,
      minScore,
      gap,
    };
  });
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
  if (status === "in_progress") {
    return "In progress";
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

function getStatusPillClasses(status: string): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "invited":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
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

function getInsightStatusTone(status: DimensionInsight["status"]) {
  switch (status) {
    case "strong":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "moderate":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "weak":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getInsightAlignmentTone(alignment: DimensionInsight["alignment"]) {
  switch (alignment) {
    case "aligned":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "emerging_gap":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "significant_gap":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getInsightCompletenessTone(
  completeness: DimensionInsight["completeness"],
) {
  switch (completeness) {
    case "sufficient":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "partial":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "insufficient":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getNarrativeConfidenceTone(
  confidence: DimensionNarrative["confidence"],
) {
  switch (confidence) {
    case "high":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "low":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatInsightStatus(status: DimensionInsight["status"]): string {
  switch (status) {
    case "strong":
      return "Strong";
    case "moderate":
      return "Moderate";
    case "weak":
      return "Weak";
    default:
      return "—";
  }
}

function formatAlignment(alignment: DimensionInsight["alignment"]): string {
  switch (alignment) {
    case "aligned":
      return "Aligned";
    case "emerging_gap":
      return "Emerging gap";
    case "significant_gap":
      return "Significant gap";
    default:
      return "—";
  }
}

function formatCompleteness(
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
      return "—";
  }
}

function formatConfidence(confidence: DimensionNarrative["confidence"]): string {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    case "low":
      return "Low confidence";
    default:
      return "—";
  }
}

function buildRespondentGroups(
  participantRows: ParticipantRow[],
): RespondentGroupSummary[] {
  return questionnaireTypes.map((questionnaireType) => {
    const matchingParticipants = participantRows.filter(
      (participant) => participant.questionnaire_type === questionnaireType,
    );

    const completed = matchingParticipants.filter(
      (participant) => participant.participant_status === "completed",
    ).length;

    const totalInvited = matchingParticipants.length;
    const outstanding = Math.max(totalInvited - completed, 0);

    const outstandingParticipants = matchingParticipants
      .filter((participant) => participant.participant_status !== "completed")
      .map((participant) => ({
        participantId: participant.participant_id,
        roleLabel: participant.role_label,
        participantStatus: participant.participant_status,
        startedAt: participant.started_at,
        completedAt: participant.completed_at,
        updatedAt: participant.updated_at,
      }));

    return {
      questionnaireType,
      label: formatQuestionnaireType(questionnaireType),
      totalInvited,
      outstanding,
      completed,
      outstandingParticipants,
    };
  });
}

function buildInsightSummary(dimensionInsights: DimensionInsight[]) {
  return {
    status: {
      strong: dimensionInsights.filter((insight) => insight.status === "strong")
        .length,
      moderate: dimensionInsights.filter(
        (insight) => insight.status === "moderate",
      ).length,
      weak: dimensionInsights.filter((insight) => insight.status === "weak")
        .length,
    },
    alignment: {
      aligned: dimensionInsights.filter(
        (insight) => insight.alignment === "aligned",
      ).length,
      emergingGap: dimensionInsights.filter(
        (insight) => insight.alignment === "emerging_gap",
      ).length,
      significantGap: dimensionInsights.filter(
        (insight) => insight.alignment === "significant_gap",
      ).length,
    },
    completeness: {
      sufficient: dimensionInsights.filter(
        (insight) => insight.completeness === "sufficient",
      ).length,
      partial: dimensionInsights.filter(
        (insight) => insight.completeness === "partial",
      ).length,
      insufficient: dimensionInsights.filter(
        (insight) => insight.completeness === "insufficient",
      ).length,
    },
  };
}

function getPriorityDimensions(
  dimensionInsights: DimensionInsight[],
): DimensionInsight[] {
  return [...dimensionInsights]
    .sort((a, b) => {
      const statusWeight = (status: DimensionInsight["status"]) => {
        if (status === "weak") return 0;
        if (status === "moderate") return 1;
        if (status === "strong") return 2;
        return 3;
      };

      const completenessWeight = (
        completeness: DimensionInsight["completeness"],
      ) => {
        if (completeness === "sufficient") return 0;
        if (completeness === "partial") return 1;
        return 2;
      };

      const alignmentWeight = (alignment: DimensionInsight["alignment"]) => {
        if (alignment === "significant_gap") return 0;
        if (alignment === "emerging_gap") return 1;
        if (alignment === "aligned") return 2;
        return 3;
      };

      const statusDiff = statusWeight(a.status) - statusWeight(b.status);

      if (statusDiff !== 0) {
        return statusDiff;
      }

      const alignmentDiff =
        alignmentWeight(a.alignment) - alignmentWeight(b.alignment);

      if (alignmentDiff !== 0) {
        return alignmentDiff;
      }

      const completenessDiff =
        completenessWeight(a.completeness) -
        completenessWeight(b.completeness);

      if (completenessDiff !== 0) {
        return completenessDiff;
      }

      const averageA = a.averageScore ?? 999;
      const averageB = b.averageScore ?? 999;

      return averageA - averageB;
    })
    .slice(0, 5);
}

function getPriorityNarratives(
  dimensionInsights: DimensionInsight[],
  dimensionNarratives: DimensionNarrative[],
): Array<{
  insight: DimensionInsight;
  narrative: DimensionNarrative | undefined;
}> {
  const priorityInsights = getPriorityDimensions(dimensionInsights);

  return priorityInsights.map((insight) => ({
    insight,
    narrative: dimensionNarratives.find(
      (narrative) => narrative.dimensionKey === insight.dimensionKey,
    ),
  }));
}

export default async function ClientDiagnosticProjectDashboardPage({
  params,
}: PageProps) {
  const { projectId } = await params;

  if (!isUuid(projectId)) {
    notFound();
  }

  const supabase = getSupabaseAdminClient();

  const [
    { data: project, error: projectError },
    { data: participants, error: participantsError },
    { data: dimensionScores, error: dimensionScoresError },
  ] = await Promise.all([
    supabase
      .from("client_projects")
      .select(
        "project_id, company_name, primary_contact_name, primary_contact_email, project_status, notes, created_at, updated_at",
      )
      .eq("project_id", projectId)
      .single<ProjectRow>(),
    supabase
      .from("client_participants")
      .select(
        "participant_id, questionnaire_type, role_label, participant_status, started_at, completed_at, updated_at",
      )
      .eq("project_id", projectId)
      .returns<ParticipantRow[]>(),
    supabase
      .from("client_dimension_scores")
      .select(
        "score_id, project_id, questionnaire_type, dimension_key, average_score, response_count, updated_at",
      )
      .eq("project_id", projectId)
      .returns<DimensionScoreRow[]>(),
  ]);

  if (projectError || !project) {
    notFound();
  }

  if (participantsError) {
    throw new Error("Unable to load project participants.");
  }

  if (dimensionScoresError) {
    throw new Error("Unable to load project dimension scores.");
  }

  const participantRows = (participants ?? []).sort((a, b) => {
    if (a.questionnaire_type !== b.questionnaire_type) {
      return a.questionnaire_type.localeCompare(b.questionnaire_type);
    }

    return a.role_label.localeCompare(b.role_label);
  });

  const dimensionScoreRows = dimensionScores ?? [];
  const dimensionSummaries = buildDimensionSummaries(dimensionScoreRows);
  const dimensionInsights = buildDimensionInsights(dimensionSummaries);
  const dimensionNarratives = buildDimensionNarratives(dimensionInsights);
  const priorityDimensions = getPriorityDimensions(dimensionInsights);
  const priorityNarratives = getPriorityNarratives(
    dimensionInsights,
    dimensionNarratives,
  );
  const insightSummary = buildInsightSummary(dimensionInsights);
  const respondentGroups = buildRespondentGroups(participantRows);

  const completedParticipants = participantRows.filter(
    (participant) => participant.participant_status === "completed",
  ).length;

  const totalInvitedParticipants = participantRows.length;
  const outstandingParticipants = Math.max(
    totalInvitedParticipants - completedParticipants,
    0,
  );

  const completionPercentage =
    totalInvitedParticipants === 0
      ? 0
      : Math.round((completedParticipants / totalInvitedParticipants) * 100);

  const strongestAlignment = [...dimensionSummaries]
    .filter((dimension) => dimension.gap !== null)
    .sort((a, b) => (a.gap ?? 999) - (b.gap ?? 999))
    .slice(0, 3);

  const biggestGaps = [...dimensionSummaries]
    .filter((dimension) => dimension.gap !== null)
    .sort((a, b) => (b.gap ?? -1) - (a.gap ?? -1))
    .slice(0, 3);

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-5xl">
            <p className="brand-kicker">Client diagnostic dashboard</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              {project.company_name}
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              Internal project view showing submission progress, participant
              stage tracking, and cross-role dimension scoring.
            </p>

            <div className="brand-card-dark mt-8 grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardHeroStat
                label="Project status"
                value={project.project_status}
              />
              <DashboardHeroStat
                label="Participants requested"
                value={String(totalInvitedParticipants)}
              />
              <DashboardHeroStat
                label="Submissions completed"
                value={String(completedParticipants)}
              />
              <DashboardHeroStat
                label="Completion"
                value={`${completionPercentage}%`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container py-10 sm:py-12">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Project overview</p>

              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Submission progress and contact overview
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  label="Primary contact"
                  value={project.primary_contact_name}
                  secondary={project.primary_contact_email}
                />
                <InfoCard
                  label="Project status"
                  value={project.project_status}
                  secondary={`Last updated ${formatDateTime(project.updated_at)}`}
                />
                <InfoCard
                  label="Completed submissions"
                  value={`${completedParticipants} of ${totalInvitedParticipants}`}
                  secondary={`${completionPercentage}% complete`}
                />
                <InfoCard
                  label="Outstanding responses"
                  value={String(outstandingParticipants)}
                  secondary={`${totalInvitedParticipants} invited · ${completedParticipants} completed`}
                />
              </div>

              {project.notes ? (
                <div className="brand-surface-soft mt-6 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                    Project notes
                  </p>

                  <p className="brand-body-sm mt-3">{project.notes}</p>
                </div>
              ) : null}
            </div>

            <div className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Daily oversight</p>

              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Participation summary
              </h2>

              <div className="mt-6 space-y-4">
                <StageSummaryRow
                  label="Completed"
                  value={completedParticipants}
                  tone="emerald"
                />
                <StageSummaryRow
                  label="Outstanding"
                  value={outstandingParticipants}
                  tone="amber"
                />
                <StageSummaryRow
                  label="Total invited"
                  value={totalInvitedParticipants}
                  tone="slate"
                />
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[var(--brand-accent)]"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              <p className="mt-3 text-sm leading-6 text-[var(--brand-text-muted)]">
                This view is intended to support follow-up and completion
                tracking. Interpretation should be based on a sufficiently
                complete response set rather than early partial returns.
              </p>
            </div>
          </div>

          <div className="brand-surface-card mt-8 p-6 sm:p-8">
            <p className="brand-section-kicker">Insight summary</p>

            <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
              Structured diagnostic interpretation
            </h2>

            <p className="brand-body-sm mt-4 max-w-3xl">
              This section applies deterministic rules to the current dimension
              scores to classify status, alignment, and data completeness. It is
              intended as an internal interpretation layer before narrative
              reporting is introduced.
            </p>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <InsightSummaryPanel
                title="Dimension status"
                items={[
                  {
                    label: "Strong",
                    value: insightSummary.status.strong,
                    tone: "emerald",
                  },
                  {
                    label: "Moderate",
                    value: insightSummary.status.moderate,
                    tone: "amber",
                  },
                  {
                    label: "Weak",
                    value: insightSummary.status.weak,
                    tone: "rose",
                  },
                ]}
              />

              <InsightSummaryPanel
                title="Role alignment"
                items={[
                  {
                    label: "Aligned",
                    value: insightSummary.alignment.aligned,
                    tone: "emerald",
                  },
                  {
                    label: "Emerging gap",
                    value: insightSummary.alignment.emergingGap,
                    tone: "amber",
                  },
                  {
                    label: "Significant gap",
                    value: insightSummary.alignment.significantGap,
                    tone: "rose",
                  },
                ]}
              />

              <InsightSummaryPanel
                title="Data completeness"
                items={[
                  {
                    label: "Sufficient",
                    value: insightSummary.completeness.sufficient,
                    tone: "emerald",
                  },
                  {
                    label: "Partial",
                    value: insightSummary.completeness.partial,
                    tone: "amber",
                  },
                  {
                    label: "Insufficient",
                    value: insightSummary.completeness.insufficient,
                    tone: "slate",
                  },
                ]}
              />
            </div>
          </div>

          <div className="brand-surface-card mt-8 p-6 sm:p-8">
            <p className="brand-section-kicker">Priority dimensions</p>

            <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
              Weakest and least mature areas first
            </h2>

            <p className="brand-body-sm mt-4 max-w-3xl">
              These dimensions are prioritised using the current rules-based
              model, weighting weaker scores first, then larger alignment gaps,
              then lower completeness.
            </p>

            <div className="mt-6 space-y-4">
              {priorityDimensions.map((dimension) => (
                <PriorityDimensionCard
                  key={dimension.dimensionKey}
                  dimension={dimension}
                />
              ))}
            </div>
          </div>

          <div className="brand-surface-card mt-8 p-6 sm:p-8">
            <p className="brand-section-kicker">Advisory narrative</p>

            <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
              Structured observations and recommended next steps
            </h2>

            <p className="brand-body-sm mt-4 max-w-3xl">
              These narrative outputs are generated from the current
              rules-based insight model. They are designed to support internal
              advisory preparation before a client-facing reporting layer is
              introduced.
            </p>

            <div className="mt-6 space-y-4">
              {priorityNarratives.map(({ insight, narrative }) =>
                narrative ? (
                  <NarrativeCard
                    key={narrative.dimensionKey}
                    insight={insight}
                    narrative={narrative}
                  />
                ) : null,
              )}
            </div>
          </div>

          <div className="brand-surface-card mt-8 p-6 sm:p-8">
            <p className="brand-section-kicker">Outstanding responses</p>

            <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
              Follow-up by respondent group
            </h2>

            <p className="brand-body-sm mt-4 max-w-3xl">
              Use this section to see which respondent groups still have
              outstanding responses and who specifically may need follow-up.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {respondentGroups.map((group) => (
                <OutstandingGroupCard
                  key={group.questionnaireType}
                  group={group}
                />
              ))}
            </div>
          </div>

          <div className="brand-surface-card mt-8 p-6 sm:p-8">
            <p className="brand-section-kicker">Participant tracking</p>

            <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
              Requested participant stages
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {respondentGroups.map((group) => (
                <RespondentSummaryCard
                  key={group.questionnaireType}
                  group={group}
                />
              ))}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="border-b border-[var(--brand-border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                      Role
                    </th>
                    <th className="border-b border-[var(--brand-border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                      Questionnaire
                    </th>
                    <th className="border-b border-[var(--brand-border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                      Status
                    </th>
                    <th className="border-b border-[var(--brand-border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                      Started
                    </th>
                    <th className="border-b border-[var(--brand-border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {participantRows.map((participant) => (
                    <tr key={participant.participant_id}>
                      <td className="border-b border-[var(--brand-border)] px-4 py-4 text-sm font-semibold text-slate-900">
                        {participant.role_label}
                      </td>
                      <td className="border-b border-[var(--brand-border)] px-4 py-4 text-sm text-slate-700">
                        {formatQuestionnaireType(participant.questionnaire_type)}
                      </td>
                      <td className="border-b border-[var(--brand-border)] px-4 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusPillClasses(
                            participant.participant_status,
                          )}`}
                        >
                          {formatParticipantStatus(
                            participant.participant_status,
                          )}
                        </span>
                      </td>
                      <td className="border-b border-[var(--brand-border)] px-4 py-4 text-sm text-slate-700">
                        {formatDateTime(participant.started_at)}
                      </td>
                      <td className="border-b border-[var(--brand-border)] px-4 py-4 text-sm text-slate-700">
                        {formatDateTime(participant.completed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Strongest alignment</p>

              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Lowest role-to-role variation
              </h2>

              <div className="mt-6 space-y-4">
                {strongestAlignment.map((dimension) => (
                  <GapSummaryCard
                    key={dimension.dimensionKey}
                    title={dimension.dimensionLabel}
                    description={dimension.dimensionDescription}
                    gap={dimension.gap}
                  />
                ))}

                {strongestAlignment.length === 0 ? (
                  <EmptyStateCard message="Alignment insight will appear once more than one respondent group has completed the diagnostic." />
                ) : null}
              </div>
            </div>

            <div className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Biggest gaps</p>

              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Highest role-to-role variation
              </h2>

              <div className="mt-6 space-y-4">
                {biggestGaps.map((dimension) => (
                  <GapSummaryCard
                    key={dimension.dimensionKey}
                    title={dimension.dimensionLabel}
                    description={dimension.dimensionDescription}
                    gap={dimension.gap}
                  />
                ))}

                {biggestGaps.length === 0 ? (
                  <EmptyStateCard message="Gap insight will appear once more than one respondent group has completed the diagnostic." />
                ) : null}
              </div>
            </div>
          </div>

          <div className="brand-surface-card mt-8 p-6 sm:p-8">
            <p className="brand-section-kicker">Dimension comparison</p>

            <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
              Cross-role scoring overview
            </h2>

            <p className="brand-body-sm mt-4 max-w-3xl">
              This table shows current average scores by role for each
              dimension. Missing groups indicate questionnaires that have not
              yet been completed.
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="border-b border-[var(--brand-border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                      Dimension
                    </th>
                    <th className="border-b border-[var(--brand-border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                      HR
                    </th>
                    <th className="border-b border-[var(--brand-border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                      Manager
                    </th>
                    <th className="border-b border-[var(--brand-border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                      Leadership
                    </th>
                    <th className="border-b border-[var(--brand-border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                      Fact Pack
                    </th>
                    <th className="border-b border-[var(--brand-border)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                      Gap
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dimensionSummaries.map((dimension) => (
                    <tr key={dimension.dimensionKey}>
                      <td className="border-b border-[var(--brand-border)] px-4 py-4 align-top">
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
                      <td className="border-b border-[var(--brand-border)] px-4 py-4 align-top">
                        <p
                          className={`text-sm font-semibold ${getGapToneClasses(
                            dimension.gap,
                          )}`}
                        >
                          {dimension.gap !== null
                            ? dimension.gap.toFixed(2)
                            : "—"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {dimension.missingQuestionnaireTypes.length > 0
                            ? `Missing: ${dimension.missingQuestionnaireTypes
                                .map(formatQuestionnaireType)
                                .join(", ")}`
                            : "All requested groups complete"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardHeroStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8AAAC8]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
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
    <div className="brand-surface-soft p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        {label}
      </p>
      <p className="mt-3 text-base font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{secondary}</p>
    </div>
  );
}

function StageSummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "slate";
}) {
  const toneClasses =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-slate-700";

  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className={`text-sm font-semibold ${toneClasses}`}>{value}</span>
    </div>
  );
}

function InsightSummaryPanel({
  title,
  items,
}: {
  title: string;
  items: Array<{
    label: string;
    value: number;
    tone: "emerald" | "amber" | "rose" | "slate";
  }>;
}) {
  return (
    <div className="brand-surface-soft p-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const toneClasses =
            item.tone === "emerald"
              ? "text-emerald-700"
              : item.tone === "amber"
                ? "text-amber-700"
                : item.tone === "rose"
                  ? "text-rose-700"
                  : "text-slate-700";

          return (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-[var(--brand-border)] bg-white px-4 py-3"
            >
              <span className="text-sm font-medium text-slate-700">
                {item.label}
              </span>
              <span className={`text-sm font-semibold ${toneClasses}`}>
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PriorityDimensionCard({
  dimension,
}: {
  dimension: DimensionInsight;
}) {
  return (
    <div className="brand-surface-soft p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-base font-semibold text-slate-900">
            {dimension.dimensionLabel}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {dimension.dimensionDescription}
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-900">
          {dimension.averageScore !== null
            ? dimension.averageScore.toFixed(2)
            : "—"}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getInsightStatusTone(
            dimension.status,
          )}`}
        >
          {formatInsightStatus(dimension.status)}
        </span>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getInsightAlignmentTone(
            dimension.alignment,
          )}`}
        >
          {formatAlignment(dimension.alignment)}
        </span>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getInsightCompletenessTone(
            dimension.completeness,
          )}`}
        >
          {formatCompleteness(dimension.completeness)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MetricMiniCard
          label="Average score"
          value={
            dimension.averageScore !== null
              ? dimension.averageScore.toFixed(2)
              : "—"
          }
        />
        <MetricMiniCard
          label="Gap"
          value={dimension.gap !== null ? dimension.gap.toFixed(2) : "—"}
        />
        <MetricMiniCard
          label="Coverage"
          value={`${dimension.completedQuestionnaireTypes.length}/${questionnaireTypes.length}`}
        />
      </div>
    </div>
  );
}

function NarrativeCard({
  insight,
  narrative,
}: {
  insight: DimensionInsight;
  narrative: DimensionNarrative;
}) {
  return (
    <div className="brand-surface-soft p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-base font-semibold text-slate-900">
            {narrative.dimensionLabel}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {insight.dimensionDescription}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getNarrativeConfidenceTone(
              narrative.confidence,
            )}`}
          >
            {formatConfidence(narrative.confidence)}
          </span>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getInsightStatusTone(
              insight.status,
            )}`}
          >
            {formatInsightStatus(insight.status)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <NarrativeBlock
          title="Observation"
          body={narrative.observation}
        />
        <NarrativeBlock
          title="Implication"
          body={narrative.implication}
        />
        <NarrativeBlock
          title="Recommended next step"
          body={narrative.recommendedNextStep}
        />
      </div>
    </div>
  );
}

function NarrativeBlock({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--brand-border)] bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        {title}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-700">{body}</p>
    </div>
  );
}

function MetricMiniCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--brand-border)] bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function RespondentSummaryCard({
  group,
}: {
  group: RespondentGroupSummary;
}) {
  return (
    <div className="brand-surface-soft p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        {group.label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-slate-900">
            {group.completed}/{group.totalInvited}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            completed responses
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
    <div className="brand-surface-soft p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-slate-900">{group.label}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {group.totalInvited} invited · {group.outstanding} outstanding ·{" "}
            {group.completed} completed
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
                className="rounded-xl border border-[var(--brand-border)] bg-white px-4 py-3"
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
          <EmptyStateCard message="All requested participants in this group have completed their response." />
        )}
      </div>
    </div>
  );
}

function GapSummaryCard({
  title,
  description,
  gap,
}: {
  title: string;
  description: string;
  gap: number | null;
}) {
  return (
    <div className="brand-surface-soft p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-slate-900">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-900">
          {gap !== null ? gap.toFixed(2) : "—"}
        </div>
      </div>
    </div>
  );
}

function EmptyStateCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--brand-border)] bg-white p-5">
      <p className="text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}

function ScoreCell({ value }: { value?: number }) {
  return (
    <td className="border-b border-[var(--brand-border)] px-4 py-4 align-top">
      <p className="text-sm font-semibold text-slate-900">
        {typeof value === "number" ? value.toFixed(2) : "—"}
      </p>
    </td>
  );
}
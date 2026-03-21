import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
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

  const participantRows = participants ?? [];
  const dimensionScoreRows = dimensionScores ?? [];
  const dimensionSummaries = buildDimensionSummaries(dimensionScoreRows);

  const completedParticipants = participantRows.filter(
    (participant) => participant.participant_status === "completed",
  ).length;

  const invitedParticipants = participantRows.filter(
    (participant) => participant.participant_status === "invited",
  ).length;

  const inProgressParticipants = participantRows.filter(
    (participant) =>
      participant.participant_status !== "completed" &&
      participant.participant_status !== "invited",
  ).length;

  const completionPercentage =
    participantRows.length === 0
      ? 0
      : Math.round((completedParticipants / participantRows.length) * 100);

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
                value={String(participantRows.length)}
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
                  value={`${completedParticipants} of ${participantRows.length}`}
                  secondary={`${completionPercentage}% complete`}
                />
                <InfoCard
                  label="Outstanding responses"
                  value={String(invitedParticipants + inProgressParticipants)}
                  secondary={`${invitedParticipants} invited · ${inProgressParticipants} in progress`}
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
                Participant stage summary
              </h2>

              <div className="mt-6 space-y-4">
                <StageSummaryRow
                  label="Completed"
                  value={completedParticipants}
                  tone="emerald"
                />
                <StageSummaryRow
                  label="Invited"
                  value={invitedParticipants}
                  tone="amber"
                />
                <StageSummaryRow
                  label="In progress"
                  value={inProgressParticipants}
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
                This dashboard is the right base for a daily email summary. Once
                you are happy with the view and language here, we can send this
                same snapshot to you automatically each day for active projects.
              </p>
            </div>
          </div>

          <div className="brand-surface-card mt-8 p-6 sm:p-8">
            <p className="brand-section-kicker">Participant tracking</p>

            <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
              Requested participant stages
            </h2>

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
                          {formatParticipantStatus(participant.participant_status)}
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

          <div className="grid gap-6 mt-8 xl:grid-cols-2">
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
              This table shows current average scores by role for each dimension.
              Missing groups indicate questionnaires that have not yet been
              completed.
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
                          {dimension.gap !== null ? dimension.gap.toFixed(2) : "—"}
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
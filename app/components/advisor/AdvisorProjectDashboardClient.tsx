"use client";

import { useEffect, useMemo, useState } from "react";

type QuestionnaireType = "hr" | "manager" | "leadership" | "client_fact_pack";

type ParticipantSummary = {
  participantId: string;
  questionnaireType: QuestionnaireType;
  roleLabel: string;
  participantStatus: string;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
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
    participants: ParticipantSummary[];
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

type ProjectStatusResponse = {
  success: true;
  projectId: string;
  projectStatus: string;
};

type AdvisorProjectDashboardClientProps = {
  projectId: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatScore(value: number | null | undefined): string {
  if (typeof value !== "number") {
    return "—";
  }

  return value.toFixed(2);
}

function getStatusTone(status: string): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "active":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "closed":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "invited":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function AdvisorProjectDashboardClient({
  projectId,
}: AdvisorProjectDashboardClientProps) {
  const [data, setData] = useState<ProjectSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionState, setActionState] = useState<"idle" | "saving">("idle");
  const [actionMessage, setActionMessage] = useState("");

  async function loadProject() {
    if (!isUuid(projectId)) {
      setLoadError("projectId must be a valid UUID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch(
        `/api/client-diagnostic-project-summary?projectId=${encodeURIComponent(projectId)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result = (await response.json()) as
        | ProjectSummaryResponse
        | ErrorResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          "error" in result ? result.error : "Unable to load project summary.",
        );
      }

      setData(result);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load project summary.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProject();
  }, [projectId]);

  async function updateProjectStatus(nextStatus: "active" | "closed") {
    if (!isUuid(projectId)) {
      setActionMessage("projectId must be a valid UUID.");
      return;
    }

    setActionState("saving");
    setActionMessage("");

    try {
      const response = await fetch("/api/client-diagnostic-project-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          projectStatus: nextStatus,
        }),
      });

      const result = (await response.json()) as
        | ProjectStatusResponse
        | ErrorResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          "error" in result ? result.error : "Unable to update project status.",
        );
      }

      setActionMessage(
        nextStatus === "closed"
          ? "Project closed successfully."
          : "Project reopened successfully.",
      );

      await loadProject();
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unable to update project status.",
      );
    } finally {
      setActionState("idle");
    }
  }

  const scoredGroupsComplete = useMemo(() => {
    if (!data) {
      return false;
    }

    const relevantGroups = data.completion.respondentGroups.filter(
      (group) =>
        group.questionnaireType === "hr" ||
        group.questionnaireType === "manager" ||
        group.questionnaireType === "leadership",
    );

    if (relevantGroups.length === 0) {
      return false;
    }

    return relevantGroups.every(
      (group) => group.totalInvited > 0 && group.outstanding === 0,
    );
  }, [data]);

  if (loading) {
    return (
      <section className="brand-light-section">
        <div className="brand-container py-10 sm:py-12">
          <div className="brand-surface-card p-6 sm:p-8">
            <p className="text-sm text-slate-600">Loading project dashboard...</p>
          </div>
        </div>
      </section>
    );
  }

  if (loadError || !data) {
    return (
      <section className="brand-light-section">
        <div className="brand-container py-10 sm:py-12">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {loadError || "Unable to load project dashboard."}
          </div>
        </div>
      </section>
    );
  }

  const { project, completion, respondentGroups, participants, biggestGaps, strongestAlignment } =
    {
      project: data.project,
      completion: data.completion,
      respondentGroups: data.completion.respondentGroups,
      participants: data.completion.participants,
      biggestGaps: data.biggestGaps,
      strongestAlignment: data.strongestAlignment,
    };

  return (
    <section className="brand-light-section">
      <div className="brand-container py-10 sm:py-12">
        <div className="space-y-10">
          <section className="brand-surface-card p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="brand-section-kicker">Project overview</p>
                <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                  {project.companyName}
                </h2>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Project status"
                    value={project.projectStatus}
                  />
                  <MetricCard
                    label="Completion"
                    value={`${completion.completionPercentage}%`}
                  />
                  <MetricCard
                    label="Completed"
                    value={`${completion.completed} / ${completion.totalInvited}`}
                  />
                  <MetricCard
                    label="Outstanding"
                    value={`${completion.outstanding}`}
                  />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <InfoCard
                    label="Primary contact"
                    value={project.primaryContactName}
                    secondary={project.primaryContactEmail}
                  />
                  <InfoCard
                    label="Project ID"
                    value={project.projectId}
                    secondary={project.notes || "No project notes recorded."}
                  />
                </div>
              </div>

              <div className="w-full max-w-md rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] p-5">
                <p className="text-sm font-semibold text-slate-900">
                  Project controls
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Close the project once diagnostic collection is complete and you
                  have moved into the next phase.
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  {project.projectStatus === "closed" ? (
                    <button
                      type="button"
                      onClick={() => void updateProjectStatus("active")}
                      disabled={actionState === "saving"}
                      className="brand-button-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionState === "saving" ? "Saving..." : "Reopen project"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void updateProjectStatus("closed")}
                      disabled={actionState === "saving"}
                      className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {actionState === "saving" ? "Saving..." : "Close project"}
                    </button>
                  )}
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  {scoredGroupsComplete
                    ? "All scored respondent groups are complete."
                    : "There are still outstanding respondent groups or participants."}
                </div>

                {actionMessage ? (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    {actionMessage}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="brand-surface-card p-6 sm:p-8">
            <p className="brand-section-kicker">Respondent groups</p>
            <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
              Completion by respondent type
            </h2>

            <div className="mt-8 grid gap-4 xl:grid-cols-3">
              {respondentGroups.map((group) => (
                <div
                  key={group.questionnaireType}
                  className="rounded-2xl border border-[var(--brand-border)] bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                        {group.label}
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-slate-900">
                        {group.completed} / {group.totalInvited}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusTone(
                        group.outstanding === 0 && group.totalInvited > 0
                          ? "completed"
                          : group.totalInvited === 0
                            ? "closed"
                            : "invited",
                      )}`}
                    >
                      {group.outstanding === 0 && group.totalInvited > 0
                        ? "Complete"
                        : group.totalInvited === 0
                          ? "No invites"
                          : `${group.outstanding} outstanding`}
                    </span>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[var(--brand-accent)]"
                      style={{
                        width:
                          group.totalInvited === 0
                            ? "0%"
                            : `${Math.round(
                                (group.completed / group.totalInvited) * 100,
                              )}%`,
                      }}
                    />
                  </div>

                  {group.outstandingParticipants.length > 0 ? (
                    <div className="mt-5 space-y-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Outstanding participants
                      </p>

                      {group.outstandingParticipants.map((participant) => (
                        <div
                          key={participant.participantId}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <p className="text-sm font-medium text-slate-900">
                            {participant.roleLabel}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            Status: {participant.participantStatus}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            Started: {formatDateTime(participant.startedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-slate-600">
                      No outstanding participants in this group.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="brand-surface-card p-6 sm:p-8">
            <p className="brand-section-kicker">Participants</p>
            <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
              Participant register
            </h2>

            <div className="mt-8 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                    <th className="px-4">Role</th>
                    <th className="px-4">Questionnaire</th>
                    <th className="px-4">Status</th>
                    <th className="px-4">Started</th>
                    <th className="px-4">Completed</th>
                    <th className="px-4">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant) => (
                    <tr
                      key={participant.participantId}
                      className="rounded-2xl border border-[var(--brand-border)] bg-white text-sm text-slate-700"
                    >
                      <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">
                        {participant.roleLabel}
                      </td>
                      <td className="px-4 py-4 capitalize">
                        {participant.questionnaireType}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusTone(
                            participant.participantStatus,
                          )}`}
                        >
                          {participant.participantStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">{formatDateTime(participant.startedAt)}</td>
                      <td className="px-4 py-4">{formatDateTime(participant.completedAt)}</td>
                      <td className="rounded-r-2xl px-4 py-4">
                        {formatDateTime(participant.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Biggest gaps</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Highest cross-group variation
              </h2>

              <div className="mt-8 space-y-4">
                {biggestGaps.map((dimension) => (
                  <DimensionRow key={dimension.dimensionKey} dimension={dimension} />
                ))}
              </div>
            </div>

            <div className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Strongest alignment</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Lowest cross-group variation
              </h2>

              <div className="mt-8 space-y-4">
                {strongestAlignment.map((dimension) => (
                  <DimensionRow key={dimension.dimensionKey} dimension={dimension} />
                ))}
              </div>
            </div>
          </section>

          <section className="brand-surface-card p-6 sm:p-8">
            <p className="brand-section-kicker">Next actions</p>
            <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
              Suggested operator actions
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <ActionCard
                title="Review outstanding participants"
                description="Use respondent group completion to identify who still needs to respond before analysis is finalised."
              />
              <ActionCard
                title="Close project when collection ends"
                description="Once the diagnostic phase is complete, close the project to signal that collection has moved into analysis or delivery."
              />
              <ActionCard
                title="Open report and advisor views"
                description="Use the existing report and advisor views to interpret scored patterns, gaps, and qualitative themes."
              />
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
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
  secondary?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
      {secondary ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{secondary}</p>
      ) : null}
    </div>
  );
}

function DimensionRow({
  dimension,
}: {
  dimension: DimensionSummary;
}) {
  return (
    <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {dimension.dimensionLabel}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {dimension.dimensionDescription}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Gap: {formatScore(dimension.gap)}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ScoreCard label="HR" value={dimension.scores.hr} />
        <ScoreCard label="Manager" value={dimension.scores.manager} />
        <ScoreCard label="Leadership" value={dimension.scores.leadership} />
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
}: {
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900">
        {formatScore(value)}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
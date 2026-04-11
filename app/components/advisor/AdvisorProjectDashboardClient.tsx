"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AddParticipantForm from "@/app/components/advisor/AddParticipantForm";

type QuestionnaireType = "hr" | "manager" | "leadership" | "client_fact_pack";

type SegmentationValues = Record<string, string | null | undefined>;

type ParticipantSummary = {
  participantId: string;
  questionnaireType: QuestionnaireType;
  roleLabel: string;
  name: string;
  email: string;
  segmentationValues: SegmentationValues | null;
  participantStatus: string;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
  invitedAt?: string | null;
  inviteExpiresAt?: string | null;
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
    name: string;
    email: string;
    segmentationValues: SegmentationValues | null;
    participantStatus: string;
    startedAt: string | null;
    completedAt: string | null;
    updatedAt: string;
    invitedAt?: string | null;
    inviteExpiresAt?: string | null;
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

type CompletionSummary = {
  totalInvited: number;
  outstanding: number;
  completed: number;
  completionPercentage: number;
  respondentGroups: RespondentGroupSummary[];
};

type FactPackSummary = {
  invited: boolean;
  participantId: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  participantStatus: string | null;
  factPackStatus: "not_invited" | "not_started" | "in_progress" | "completed";
  hasSavedResponse: boolean;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string | null;
  submittedAt: string | null;
};

type ProjectSummaryResponse = {
  success: true;
  project: {
    projectId: string;
    companyName: string;
    primaryContactName: string;
    primaryContactEmail: string;
    billingContactName: string | null;
    billingContactEmail: string | null;
    companyWebsite: string | null;
    purchaseOrderNumber: string | null;
    msaStatus: string | null;
    dpaStatus: string | null;
    projectStatus: string;
    notes: string | null;
  };
  completion: CompletionSummary & {
    participants: ParticipantSummary[];
  };
  scoredCompletion: CompletionSummary & {
    analysisReady: boolean;
  };
  factPack: FactPackSummary;
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

type ProjectUpdateResponse =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

type ParticipantUpdateResponse =
  | {
      success: true;
      participant: {
        participantId: string;
        projectId: string;
        questionnaireType: QuestionnaireType;
        roleLabel: string;
        name: string;
        email: string;
        segmentationValues: SegmentationValues | null;
        participantStatus: string;
        completedAt: string | null;
      };
    }
  | {
      success: false;
      error: string;
    };

type ExtendInviteResponse =
  | {
      success: true;
      participant: {
        participant_id: string;
        email: string;
        questionnaire_type: QuestionnaireType;
        participant_status: string;
        invite_expires_at: string | null;
        invite_revoked_at: string | null;
      };
      extendedByDays: number;
    }
  | {
      success: false;
      error: string;
    };

type AdvisorProjectDashboardClientProps = {
  projectId: string;
};

type ProjectDetailsFormState = {
  billingContactName: string;
  billingContactEmail: string;
  companyWebsite: string;
  purchaseOrderNumber: string;
  msaStatus: string;
  dpaStatus: string;
  notes: string;
};

type ParticipantEditFormState = {
  name: string;
  email: string;
  roleLabel: string;
  questionnaireType: QuestionnaireType;
  segmentationValues: {
    function: string;
    location: string;
    level: string;
  };
};

const EXTEND_OPTIONS = [7, 14, 21, 30] as const;
const MSA_OPTIONS = ["", "not_started", "in_review", "signed"] as const;
const DPA_OPTIONS = ["", "not_required", "required", "signed"] as const;
const SCORED_QUESTIONNAIRE_OPTIONS: QuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
];
const ALL_QUESTIONNAIRE_OPTIONS: QuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
  "client_fact_pack",
];

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function formatDateTime(value: string | null | undefined): string {
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
    return "Not available";
  }

  return value.toFixed(2);
}

function formatQuestionnaireType(value: QuestionnaireType): string {
  switch (value) {
    case "hr":
      return "HR";
    case "manager":
      return "Manager";
    case "leadership":
      return "Leadership";
    case "client_fact_pack":
      return "Client Fact Pack";
    default:
      return value;
  }
}

function humaniseSegmentationKey(key: string): string {
  switch (key) {
    case "function":
      return "Function";
    case "location":
      return "Location";
    case "level":
      return "Level";
    default:
      return key;
  }
}

function formatSegmentationValues(
  segmentationValues: SegmentationValues | null,
): string {
  if (!segmentationValues) {
    return "Not set";
  }

  const entries = Object.entries(segmentationValues).filter(
    ([, value]) => typeof value === "string" && value.trim().length > 0,
  );

  if (entries.length === 0) {
    return "Not set";
  }

  return entries
    .map(([key, value]) => `${humaniseSegmentationKey(key)}: ${value}`)
    .join(" • ");
}

function formatProjectStatus(value: string): string {
  switch (value) {
    case "active":
      return "Open";
    case "closed":
      return "Closed";
    case "archived":
      return "Archived";
    default:
      return value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

function formatStatusValue(value: string | null | undefined): string {
  if (!value) {
    return "Not set";
  }

  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getProjectStatusTone(status: string): string {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "closed":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "archived":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
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
    case "in_progress":
    case "started":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "removed":
    case "archived":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getFactPackTone(status: FactPackSummary["factPackStatus"]): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "in_progress":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "not_started":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "not_invited":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getFactPackStatusLabel(status: FactPackSummary["factPackStatus"]): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "Draft saved";
    case "not_started":
      return "Not started";
    case "not_invited":
      return "Not invited";
    default:
      return status;
  }
}

function canExtendInvite(participant: ParticipantSummary): boolean {
  if (participant.participantStatus === "completed") {
    return false;
  }

  if (participant.participantStatus === "archived") {
    return false;
  }

  return true;
}

function isCompletedParticipant(participant: ParticipantSummary): boolean {
  return (
    participant.participantStatus === "completed" ||
    participant.completedAt !== null
  );
}

function createProjectDetailsFormState(
  project: ProjectSummaryResponse["project"],
): ProjectDetailsFormState {
  return {
    billingContactName: project.billingContactName ?? "",
    billingContactEmail: project.billingContactEmail ?? "",
    companyWebsite: project.companyWebsite ?? "",
    purchaseOrderNumber: project.purchaseOrderNumber ?? "",
    msaStatus: project.msaStatus ?? "",
    dpaStatus: project.dpaStatus ?? "",
    notes: project.notes ?? "",
  };
}

function createParticipantEditFormState(
  participant: ParticipantSummary,
): ParticipantEditFormState {
  return {
    name: participant.name,
    email: participant.email,
    roleLabel: participant.roleLabel,
    questionnaireType: participant.questionnaireType,
    segmentationValues: {
      function:
        typeof participant.segmentationValues?.function === "string"
          ? participant.segmentationValues.function
          : "",
      location:
        typeof participant.segmentationValues?.location === "string"
          ? participant.segmentationValues.location
          : "",
      level:
        typeof participant.segmentationValues?.level === "string"
          ? participant.segmentationValues.level
          : "",
    },
  };
}

export default function AdvisorProjectDashboardClient({
  projectId,
}: AdvisorProjectDashboardClientProps) {
  const [data, setData] = useState<ProjectSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionState, setActionState] = useState<"idle" | "saving">("idle");
  const [actionMessage, setActionMessage] = useState("");
  const [inviteActionMessage, setInviteActionMessage] = useState("");
  const [inviteActionError, setInviteActionError] = useState("");
  const [inviteActionParticipantId, setInviteActionParticipantId] = useState("");
  const [extendDaysByParticipantId, setExtendDaysByParticipantId] = useState<
    Record<string, number>
  >({});
  const [isEditingProjectDetails, setIsEditingProjectDetails] = useState(false);
  const [projectDetailsForm, setProjectDetailsForm] = useState<ProjectDetailsFormState>({
    billingContactName: "",
    billingContactEmail: "",
    companyWebsite: "",
    purchaseOrderNumber: "",
    msaStatus: "",
    dpaStatus: "",
    notes: "",
  });
  const [editingParticipantId, setEditingParticipantId] = useState("");
  const [participantEditForm, setParticipantEditForm] =
    useState<ParticipantEditFormState | null>(null);
  const [participantActionState, setParticipantActionState] = useState<
    "idle" | "saving"
  >("idle");
  const [participantActionMessage, setParticipantActionMessage] = useState("");
  const [participantActionError, setParticipantActionError] = useState("");

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
      setProjectDetailsForm(createProjectDetailsFormState(result.project));
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

  async function saveProjectDetails() {
    if (!isUuid(projectId)) {
      setActionMessage("projectId must be a valid UUID.");
      return;
    }

    setActionState("saving");
    setActionMessage("");

    try {
      const response = await fetch("/api/client-diagnostic-project-update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          billingContactName:
            projectDetailsForm.billingContactName.trim() || null,
          billingContactEmail:
            projectDetailsForm.billingContactEmail.trim() || null,
          companyWebsite: projectDetailsForm.companyWebsite.trim() || null,
          purchaseOrderNumber:
            projectDetailsForm.purchaseOrderNumber.trim() || null,
          msaStatus: projectDetailsForm.msaStatus || null,
          dpaStatus: projectDetailsForm.dpaStatus || null,
          notes: projectDetailsForm.notes.trim() || null,
        }),
      });

      const result = (await response.json()) as ProjectUpdateResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          "error" in result ? result.error : "Unable to update project details.",
        );
      }

      setActionMessage("Project details updated successfully.");
      setIsEditingProjectDetails(false);
      await loadProject();
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unable to update project details.",
      );
    } finally {
      setActionState("idle");
    }
  }

  async function extendInvite(participantId: string) {
    const days = extendDaysByParticipantId[participantId] ?? 21;

    setInviteActionParticipantId(participantId);
    setInviteActionMessage("");
    setInviteActionError("");

    try {
      const response = await fetch("/api/advisor-extend-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId,
          days,
        }),
      });

      const result = (await response.json()) as ExtendInviteResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          "error" in result ? result.error : "Unable to extend invite.",
        );
      }

      setInviteActionMessage(
        `Invite extended by ${result.extendedByDays} days successfully.`,
      );

      await loadProject();
    } catch (error) {
      setInviteActionError(
        error instanceof Error ? error.message : "Unable to extend invite.",
      );
    } finally {
      setInviteActionParticipantId("");
    }
  }

  function beginParticipantEdit(participant: ParticipantSummary) {
    setEditingParticipantId(participant.participantId);
    setParticipantEditForm(createParticipantEditFormState(participant));
    setParticipantActionMessage("");
    setParticipantActionError("");
  }

  function cancelParticipantEdit() {
    setEditingParticipantId("");
    setParticipantEditForm(null);
    setParticipantActionMessage("");
    setParticipantActionError("");
  }

  async function saveParticipantEdit() {
    if (!editingParticipantId || !participantEditForm) {
      setParticipantActionError("No participant is selected for editing.");
      return;
    }

    setParticipantActionState("saving");
    setParticipantActionMessage("");
    setParticipantActionError("");

    try {
      const payload: {
        participantId: string;
        name: string;
        email: string;
        roleLabel: string;
        questionnaireType: QuestionnaireType;
        segmentationValues: SegmentationValues | null;
      } = {
        participantId: editingParticipantId,
        name: participantEditForm.name.trim(),
        email: participantEditForm.email.trim(),
        roleLabel: participantEditForm.roleLabel.trim(),
        questionnaireType: participantEditForm.questionnaireType,
        segmentationValues:
          participantEditForm.questionnaireType === "client_fact_pack"
            ? null
            : {
                function:
                  participantEditForm.segmentationValues.function.trim() || null,
                location:
                  participantEditForm.segmentationValues.location.trim() || null,
                level:
                  participantEditForm.segmentationValues.level.trim() || null,
              },
      };

      const response = await fetch("/api/advisor-update-participant", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as ParticipantUpdateResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          "error" in result ? result.error : "Unable to update participant.",
        );
      }

      setParticipantActionMessage("Participant updated successfully.");
      setEditingParticipantId("");
      setParticipantEditForm(null);
      await loadProject();
    } catch (error) {
      setParticipantActionError(
        error instanceof Error ? error.message : "Unable to update participant.",
      );
    } finally {
      setParticipantActionState("idle");
    }
  }

  if (loading) {
    return (
      <section className="brand-light-section min-h-screen">
        <div className="brand-container py-10 sm:py-12">
          <div className="brand-surface-card p-6 sm:p-8">
            <p className="text-sm text-slate-600">Loading project workspace...</p>
          </div>
        </div>
      </section>
    );
  }

  if (loadError || !data) {
    return (
      <section className="brand-light-section min-h-screen">
        <div className="brand-container py-10 sm:py-12">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {loadError || "Unable to load project workspace."}
          </div>
        </div>
      </section>
    );
  }

  const project = data.project;
  const completion = data.completion;
  const scoredCompletion = data.scoredCompletion;
  const factPack = data.factPack;
  const respondentGroups = data.completion.respondentGroups;
  const participants = data.completion.participants;
  const biggestGaps = data.biggestGaps;
  const strongestAlignment = data.strongestAlignment;

  const scoredRespondentGroups = respondentGroups.filter(
    (group) =>
      group.questionnaireType === "hr" ||
      group.questionnaireType === "manager" ||
      group.questionnaireType === "leadership",
  );

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Advisor workspace</p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h1 className="brand-heading-lg text-white">{project.companyName}</h1>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getProjectStatusTone(
                  project.projectStatus,
                )}`}
              >
                {formatProjectStatus(project.projectStatus)}
              </span>
            </div>

            <p className="brand-subheading brand-body-on-dark mt-5 max-w-3xl">
              Central project workspace for participant tracking, operational control,
              completion monitoring, and reporting access.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/advisor/projects"
                className="brand-button-dark text-center"
              >
                All projects
              </Link>

              <Link
                href={`/advisor/report/${projectId}`}
                className="brand-button-dark text-center"
              >
                View report
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="brand-light-section">
        <div className="brand-container py-8 sm:py-10">
          <div className="space-y-8">
            <section className="brand-surface-card p-6 sm:p-8">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="brand-section-kicker">Project overview</p>
                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    Overview and controls
                  </h2>
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                  <MetricCard
                    label="Project status"
                    value={formatProjectStatus(project.projectStatus)}
                  />
                  <MetricCard
                    label="Overall completion"
                    value={`${completion.completionPercentage}%`}
                  />
                  <MetricCard
                    label="Scored readiness"
                    value={scoredCompletion.analysisReady ? "Ready" : "In progress"}
                  />
                  <MetricCard
                    label="Outstanding"
                    value={`${completion.outstanding}`}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <InfoCard
                    label="Primary contact"
                    value={project.primaryContactName}
                    secondary={project.primaryContactEmail}
                  />
                  <InfoCard label="Project ID" value={project.projectId} />
                </div>

                <ControlCard
                  projectStatus={project.projectStatus}
                  actionState={actionState}
                  actionMessage={actionMessage}
                  analysisReady={scoredCompletion.analysisReady}
                  onUpdateProjectStatus={updateProjectStatus}
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="brand-section-kicker mt-2">Company & engagement</p>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">
                      Delivery and commercial context
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingProjectDetails) {
                        setProjectDetailsForm(createProjectDetailsFormState(project));
                        setIsEditingProjectDetails(false);
                        return;
                      }

                      setProjectDetailsForm(createProjectDetailsFormState(project));
                      setIsEditingProjectDetails(true);
                    }}
                    className="brand-button-dark"
                  >
                    {isEditingProjectDetails ? "Cancel edit" : "Edit project details"}
                  </button>
                </div>

                {isEditingProjectDetails ? (
                  <ProjectDetailsEditor
                    formState={projectDetailsForm}
                    actionState={actionState}
                    onChange={setProjectDetailsForm}
                    onSave={() => void saveProjectDetails()}
                  />
                ) : (
                  <>
                    <div className="grid gap-4 lg:grid-cols-3">
                      <InfoCard
                        label="Billing contact"
                        value={project.billingContactName || "Not set"}
                        secondary={
                          project.billingContactEmail || "No billing email recorded"
                        }
                      />
                      <InfoCard
                        label="Company website"
                        value={project.companyWebsite || "Not set"}
                        secondary={
                          project.companyWebsite
                            ? "Reference website for project context."
                            : undefined
                        }
                      />
                      <InfoCard
                        label="Purchase order"
                        value={project.purchaseOrderNumber || "Not set"}
                      />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <InfoCard
                        label="MSA status"
                        value={formatStatusValue(project.msaStatus)}
                        secondary="Master services agreement status for this engagement."
                      />
                      <InfoCard
                        label="DPA status"
                        value={formatStatusValue(project.dpaStatus)}
                        secondary="Data processing agreement status where applicable."
                      />
                    </div>

                    <NotesCard notes={project.notes} />
                  </>
                )}
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="brand-section-kicker">Scored respondent groups</p>
                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    Completion by respondent type
                  </h2>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  {scoredRespondentGroups.map((group) => (
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
                                {participant.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-600">
                                {participant.email}
                              </p>
                              <p className="mt-1 text-xs text-slate-600">
                                Role: {participant.roleLabel}
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
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="brand-section-kicker">Participants</p>
                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    Participant register
                  </h2>
                </div>

                <div className="text-sm text-slate-600">
                  Includes scored diagnostic participants and fact pack delivery.
                </div>
              </div>

              <div className="mt-6">
                <AddParticipantForm projectId={projectId} />
              </div>

              {inviteActionMessage ? (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {inviteActionMessage}
                </div>
              ) : null}

              {inviteActionError ? (
                <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {inviteActionError}
                </div>
              ) : null}

              {participantActionMessage ? (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {participantActionMessage}
                </div>
              ) : null}

              {participantActionError ? (
                <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {participantActionError}
                </div>
              ) : null}

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                      <th className="px-4">Participant</th>
                      <th className="px-4">Role</th>
                      <th className="px-4">Questionnaire</th>
                      <th className="px-4">Segmentation</th>
                      <th className="px-4">Status</th>
                      <th className="px-4">Invited</th>
                      <th className="px-4">Expires</th>
                      <th className="px-4">Started</th>
                      <th className="px-4">Completed</th>
                      <th className="px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant) => {
                      const selectedDays =
                        extendDaysByParticipantId[participant.participantId] ?? 21;
                      const isExtending =
                        inviteActionParticipantId === participant.participantId;
                      const extendDisabled =
                        !canExtendInvite(participant) ||
                        project.projectStatus !== "active";
                      const isEditing =
                        editingParticipantId === participant.participantId &&
                        participantEditForm !== null;
                      const participantCompleted = isCompletedParticipant(participant);

                      if (isEditing && participantEditForm) {
                        return (
                          <tr
                            key={participant.participantId}
                            className="rounded-2xl border border-[var(--brand-border)] bg-white text-sm text-slate-700"
                          >
                            <td
                              className="rounded-2xl px-4 py-4"
                              colSpan={10}
                            >
                              <div className="space-y-4">
                                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                  <EditableField label="Name">
                                    <input
                                      type="text"
                                      value={participantEditForm.name}
                                      onChange={(event) =>
                                        setParticipantEditForm((current) =>
                                          current
                                            ? {
                                                ...current,
                                                name: event.target.value,
                                              }
                                            : current,
                                        )
                                      }
                                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                                    />
                                  </EditableField>

                                  <EditableField label="Email">
                                    <input
                                      type="email"
                                      value={participantEditForm.email}
                                      onChange={(event) =>
                                        setParticipantEditForm((current) =>
                                          current
                                            ? {
                                                ...current,
                                                email: event.target.value,
                                              }
                                            : current,
                                        )
                                      }
                                      disabled={participantCompleted}
                                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                  </EditableField>

                                  <EditableField label="Role">
                                    <input
                                      type="text"
                                      value={participantEditForm.roleLabel}
                                      onChange={(event) =>
                                        setParticipantEditForm((current) =>
                                          current
                                            ? {
                                                ...current,
                                                roleLabel: event.target.value,
                                              }
                                            : current,
                                        )
                                      }
                                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                                    />
                                  </EditableField>

                                  <EditableField label="Questionnaire">
                                    <select
                                      value={participantEditForm.questionnaireType}
                                      onChange={(event) =>
                                        setParticipantEditForm((current) =>
                                          current
                                            ? {
                                                ...current,
                                                questionnaireType:
                                                  event.target
                                                    .value as QuestionnaireType,
                                                segmentationValues:
                                                  event.target.value ===
                                                  "client_fact_pack"
                                                    ? {
                                                        function: "",
                                                        location: "",
                                                        level: "",
                                                      }
                                                    : current.segmentationValues,
                                              }
                                            : current,
                                        )
                                      }
                                      disabled={participantCompleted}
                                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    >
                                      {(participantCompleted
                                        ? ALL_QUESTIONNAIRE_OPTIONS
                                        : ALL_QUESTIONNAIRE_OPTIONS
                                      ).map((option) => (
                                        <option key={option} value={option}>
                                          {formatQuestionnaireType(option)}
                                        </option>
                                      ))}
                                    </select>
                                  </EditableField>

                                  {participantEditForm.questionnaireType !==
                                  "client_fact_pack" ? (
                                    <>
                                      <EditableField label="Function">
                                        <input
                                          type="text"
                                          value={
                                            participantEditForm.segmentationValues
                                              .function
                                          }
                                          onChange={(event) =>
                                            setParticipantEditForm((current) =>
                                              current
                                                ? {
                                                    ...current,
                                                    segmentationValues: {
                                                      ...current.segmentationValues,
                                                      function: event.target.value,
                                                    },
                                                  }
                                                : current,
                                            )
                                          }
                                          className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                                        />
                                      </EditableField>

                                      <EditableField label="Location">
                                        <input
                                          type="text"
                                          value={
                                            participantEditForm.segmentationValues
                                              .location
                                          }
                                          onChange={(event) =>
                                            setParticipantEditForm((current) =>
                                              current
                                                ? {
                                                    ...current,
                                                    segmentationValues: {
                                                      ...current.segmentationValues,
                                                      location: event.target.value,
                                                    },
                                                  }
                                                : current,
                                            )
                                          }
                                          className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                                        />
                                      </EditableField>

                                      <EditableField label="Level">
                                        <input
                                          type="text"
                                          value={
                                            participantEditForm.segmentationValues
                                              .level
                                          }
                                          onChange={(event) =>
                                            setParticipantEditForm((current) =>
                                              current
                                                ? {
                                                    ...current,
                                                    segmentationValues: {
                                                      ...current.segmentationValues,
                                                      level: event.target.value,
                                                    },
                                                  }
                                                : current,
                                            )
                                          }
                                          className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                                        />
                                      </EditableField>
                                    </>
                                  ) : (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:col-span-2 xl:col-span-3">
                                      Client Fact Pack participants do not use scored
                                      segmentation fields.
                                    </div>
                                  )}
                                </div>

                                {participantCompleted ? (
                                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    Completed participants cannot have email or
                                    questionnaire type changed.
                                  </div>
                                ) : null}

                                <div className="flex flex-wrap gap-3">
                                  <button
                                    type="button"
                                    onClick={() => void saveParticipantEdit()}
                                    disabled={participantActionState === "saving"}
                                    className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {participantActionState === "saving"
                                      ? "Saving..."
                                      : "Save participant"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={cancelParticipantEdit}
                                    disabled={participantActionState === "saving"}
                                    className="brand-button-dark disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={participant.participantId}
                          className="rounded-2xl border border-[var(--brand-border)] bg-white text-sm text-slate-700"
                        >
                          <td className="rounded-l-2xl px-4 py-4">
                            <p className="font-medium text-slate-900">
                              {participant.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              {participant.email}
                            </p>
                          </td>
                          <td className="px-4 py-4">{participant.roleLabel}</td>
                          <td className="px-4 py-4">
                            {formatQuestionnaireType(participant.questionnaireType)}
                          </td>
                          <td className="px-4 py-4 text-xs leading-6 text-slate-600">
                            {formatSegmentationValues(participant.segmentationValues)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusTone(
                                participant.participantStatus,
                              )}`}
                            >
                              {participant.participantStatus.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {formatDateTime(participant.invitedAt)}
                          </td>
                          <td className="px-4 py-4">
                            {formatDateTime(participant.inviteExpiresAt)}
                          </td>
                          <td className="px-4 py-4">
                            {formatDateTime(participant.startedAt)}
                          </td>
                          <td className="px-4 py-4">
                            {formatDateTime(participant.completedAt)}
                          </td>
                          <td className="rounded-r-2xl px-4 py-4">
                            <div className="flex min-w-[200px] flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => beginParticipantEdit(participant)}
                                disabled={participantActionState === "saving"}
                                className="brand-button-dark disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Edit participant
                              </button>

                              <select
                                value={selectedDays}
                                onChange={(event) =>
                                  setExtendDaysByParticipantId((current) => ({
                                    ...current,
                                    [participant.participantId]: Number(
                                      event.target.value,
                                    ),
                                  }))
                                }
                                disabled={extendDisabled || isExtending}
                                className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {EXTEND_OPTIONS.map((days) => (
                                  <option key={days} value={days}>
                                    Extend by {days} days
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => void extendInvite(participant.participantId)}
                                disabled={extendDisabled || isExtending}
                                className="brand-button-dark disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isExtending ? "Extending..." : "Extend invite"}
                              </button>

                              {extendDisabled ? (
                                <p className="text-xs text-slate-500">
                                  Invite extension is only available for open,
                                  incomplete participants in an open project.
                                </p>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="brand-section-kicker">Reporting context</p>
                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    Fact pack and diagnostic pattern signals
                  </h2>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  <FactPackCard factPack={factPack} />

                  <SignalSectionCard
                    title="Biggest gaps"
                    description="Highest cross-group variation"
                    dimensions={biggestGaps}
                  />

                  <SignalSectionCard
                    title="Strongest alignment"
                    description="Lowest cross-group variation"
                    dimensions={strongestAlignment}
                  />
                </div>
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="brand-section-kicker">Next actions</p>
                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    Suggested operator actions
                  </h2>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <ActionCard
                    title="Review outstanding scored participants"
                    description="Use respondent-group completion to identify who still needs to respond before analysis is finalised."
                  />
                  <ActionCard
                    title="Confirm fact pack completion"
                    description="Ensure the client fact pack is completed before final reporting so system, tooling, and infrastructure context is available."
                  />
                  <ActionCard
                    title="Close project when collection ends"
                    description="Once collection is complete, close the project to signal that the work has moved into analysis or delivery."
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
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
      <p className="mt-2 break-words text-base font-semibold text-slate-900">
        {value}
      </p>
      {secondary ? (
        <p className="mt-2 break-words text-sm leading-6 text-slate-600">
          {secondary}
        </p>
      ) : null}
    </div>
  );
}

function NotesCard({
  notes,
}: {
  notes: string | null;
}) {
  return (
    <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        Advisor notes
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
        {notes && notes.trim().length > 0
          ? notes
          : "No advisor notes recorded yet."}
      </p>
    </div>
  );
}

function ControlCard({
  projectStatus,
  actionState,
  actionMessage,
  analysisReady,
  onUpdateProjectStatus,
}: {
  projectStatus: string;
  actionState: "idle" | "saving";
  actionMessage: string;
  analysisReady: boolean;
  onUpdateProjectStatus: (nextStatus: "active" | "closed") => Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface-soft)] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        Project controls
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Close the project once collection is complete and the work has moved into
        analysis or delivery.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {projectStatus === "closed" ? (
          <button
            type="button"
            onClick={() => void onUpdateProjectStatus("active")}
            disabled={actionState === "saving"}
            className="brand-button-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionState === "saving" ? "Saving..." : "Reopen project"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onUpdateProjectStatus("closed")}
            disabled={actionState === "saving"}
            className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionState === "saving" ? "Saving..." : "Close project"}
          </button>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        {analysisReady
          ? "All scored respondent groups are complete and analysis can proceed."
          : "Scored diagnostic collection is still in progress."}
      </div>

      {actionMessage ? (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {actionMessage}
        </div>
      ) : null}
    </div>
  );
}

function ProjectDetailsEditor({
  formState,
  actionState,
  onChange,
  onSave,
}: {
  formState: ProjectDetailsFormState;
  actionState: "idle" | "saving";
  onChange: React.Dispatch<React.SetStateAction<ProjectDetailsFormState>>;
  onSave: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--brand-border)] bg-white p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <FieldGroup label="Billing contact name">
          <input
            type="text"
            value={formState.billingContactName}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                billingContactName: event.target.value,
              }))
            }
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
        </FieldGroup>

        <FieldGroup label="Billing contact email">
          <input
            type="email"
            value={formState.billingContactEmail}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                billingContactEmail: event.target.value,
              }))
            }
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
        </FieldGroup>

        <FieldGroup label="Company website">
          <input
            type="url"
            value={formState.companyWebsite}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                companyWebsite: event.target.value,
              }))
            }
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
        </FieldGroup>

        <FieldGroup label="Purchase order number">
          <input
            type="text"
            value={formState.purchaseOrderNumber}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                purchaseOrderNumber: event.target.value,
              }))
            }
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
        </FieldGroup>

        <FieldGroup label="MSA status">
          <select
            value={formState.msaStatus}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                msaStatus: event.target.value,
              }))
            }
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            <option value="">Not set</option>
            {MSA_OPTIONS.filter((option) => option !== "").map((option) => (
              <option key={option} value={option}>
                {formatStatusValue(option)}
              </option>
            ))}
          </select>
        </FieldGroup>

        <FieldGroup label="DPA status">
          <select
            value={formState.dpaStatus}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                dpaStatus: event.target.value,
              }))
            }
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            <option value="">Not set</option>
            {DPA_OPTIONS.filter((option) => option !== "").map((option) => (
              <option key={option} value={option}>
                {formatStatusValue(option)}
              </option>
            ))}
          </select>
        </FieldGroup>
      </div>

      <div className="mt-4">
        <FieldGroup label="Advisor notes">
          <textarea
            value={formState.notes}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            rows={6}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
        </FieldGroup>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={onSave}
          disabled={actionState === "saving"}
          className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionState === "saving" ? "Saving..." : "Save project details"}
        </button>
      </div>
    </div>
  );
}

function EditableField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function FactPackCard({
  factPack,
}: {
  factPack: FactPackSummary;
}) {
  return (
    <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Client Fact Pack</p>
          <p className="mt-1 text-sm text-slate-600">
            Operational input for final reporting
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getFactPackTone(
            factPack.factPackStatus,
          )}`}
        >
          {getFactPackStatusLabel(factPack.factPackStatus)}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Recipient
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {factPack.recipientName || "Not assigned"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {factPack.recipientEmail || "No email recorded"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Timing
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Updated: {formatDateTime(factPack.updatedAt)}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Submitted: {formatDateTime(factPack.submittedAt)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          The Client Fact Pack is tracked as a project deliverable and input to
          final reporting. It is not included in scored comparison, insight
          generation, narrative engines, or qualitative pattern analysis.
        </div>
      </div>
    </div>
  );
}

function SignalSectionCard({
  title,
  description,
  dimensions,
}: {
  title: string;
  description: string;
  dimensions: DimensionSummary[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>

      <div className="mt-5 space-y-4">
        {dimensions.map((dimension) => (
          <div
            key={dimension.dimensionKey}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {dimension.dimensionLabel}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {dimension.dimensionDescription}
                </p>
              </div>

              <div className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                Gap: {formatScore(dimension.gap)}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ScoreCard label="HR" value={dimension.scores.hr} />
              <ScoreCard label="Manager" value={dimension.scores.manager} />
              <ScoreCard label="Leadership" value={dimension.scores.leadership} />
            </div>
          </div>
        ))}
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
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
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
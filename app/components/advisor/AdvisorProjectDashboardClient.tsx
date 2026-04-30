"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import AddParticipantForm from "@/app/components/advisor/AddParticipantForm";
import type {
  SegmentationFieldKey,
  SegmentationSchema,
} from "@/lib/client-diagnostic/segmentation";

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

type FunctionalSignalSummary = {
  signalRequestId: string;
  moduleType: string;
  moduleLabel: string | null;
  recipientName: string;
  recipientEmail: string;
  signalStatus: string;
  invitedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  submittedAt: string | null;
  updatedAt: string;
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
    segmentationSchema: SegmentationSchema | null;
  };
  completion: CompletionSummary & {
    participants: ParticipantSummary[];
  };
  scoredCompletion: CompletionSummary & {
    analysisReady: boolean;
  };
  factPack: FactPackSummary;
  functionalSignals: FunctionalSignalSummary[];
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

type WithdrawParticipantResponse =
  | {
    success: true;
    participant: {
      participantId: string;
      projectId: string;
      participantStatus: string;
      completedAt: string | null;
    };
  }
  | {
    success: false;
    error: string;
  };

type ReinstateParticipantResponse =
  | {
    success: true;
    participant: {
      participantId: string;
      projectId: string;
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

type ParticipantEditPermissions = {
  canEditAnyField: boolean;
  canEditName: boolean;
  canEditEmail: boolean;
  canEditRole: boolean;
  canEditQuestionnaire: boolean;
  canEditSegmentation: boolean;
};

type WithdrawReason =
  | "wrong_details"
  | "duplicate_participant"
  | "added_in_error"
  | "contact_left_organisation"
  | "company_withdrew_participant"
  | "declined_to_participate"
  | "no_longer_in_scope"
  | "other";

type WithdrawFormState = {
  reason: WithdrawReason | "";
  note: string;
};

type ReinstateReason =
  | "withdrawn_in_error"
  | "duplicate_resolved"
  | "client_requested_reinstatement"
  | "participant_now_in_scope"
  | "other";

type ReinstateFormState = {
  reason: ReinstateReason | "";
  note: string;
};

const EXTEND_OPTIONS = [7, 14, 21, 30] as const;
const MSA_OPTIONS = ["", "not_started", "in_review", "signed"] as const;
const DPA_OPTIONS = ["", "not_required", "required", "signed"] as const;
const ALL_QUESTIONNAIRE_OPTIONS: QuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
  "client_fact_pack",
];

const WITHDRAW_REASON_OPTIONS: Array<{
  value: WithdrawReason;
  label: string;
}> = [
    { value: "wrong_details", label: "Wrong details entered" },
    { value: "duplicate_participant", label: "Duplicate participant" },
    { value: "added_in_error", label: "Added in error" },
    { value: "contact_left_organisation", label: "Contact left organisation" },
    {
      value: "company_withdrew_participant",
      label: "Company withdrew participant",
    },
    { value: "declined_to_participate", label: "Declined to participate" },
    { value: "no_longer_in_scope", label: "No longer in scope" },
    { value: "other", label: "Other" },
  ];

const REINSTATE_REASON_OPTIONS: Array<{
  value: ReinstateReason;
  label: string;
}> = [
    { value: "withdrawn_in_error", label: "Withdrawn in error" },
    { value: "duplicate_resolved", label: "Duplicate resolved" },
    {
      value: "client_requested_reinstatement",
      label: "Client requested reinstatement",
    },
    { value: "participant_now_in_scope", label: "Participant now in scope" },
    { value: "other", label: "Other" },
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

function formatFunctionalSignalModuleType(value: string): string {
  switch (value) {
    case "it":
      return "IT / Systems";
    case "payroll":
      return "Payroll";
    case "finance":
      return "Finance";
    case "other":
      return "Other";
    default:
      return value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
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

function getDisplayParticipantStatus(status: string): string {
  if (status === "archived") {
    return "Withdrawn";
  }

  return formatStatusValue(status);
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

function getFunctionalSignalTone(status: string): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "started":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "invited":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "archived":
      return "border-slate-200 bg-slate-100 text-slate-600";
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

function getFunctionalSignalStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "started":
      return "Started";
    case "invited":
      return "Invited";
    case "archived":
      return "Archived";
    default:
      return formatStatusValue(status);
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

function canArchiveParticipant(participant: ParticipantSummary): boolean {
  if (participant.participantStatus === "archived") {
    return false;
  }

  if (participant.participantStatus === "completed" || participant.completedAt) {
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

function isStartedParticipant(participant: ParticipantSummary): boolean {
  return participant.participantStatus === "started";
}

function isArchivedParticipant(participant: ParticipantSummary): boolean {
  return participant.participantStatus === "archived";
}

function getParticipantEditPermissions(
  participant: ParticipantSummary,
): ParticipantEditPermissions {
  if (isArchivedParticipant(participant)) {
    return {
      canEditAnyField: false,
      canEditName: false,
      canEditEmail: false,
      canEditRole: false,
      canEditQuestionnaire: false,
      canEditSegmentation: false,
    };
  }

  if (isStartedParticipant(participant) || isCompletedParticipant(participant)) {
    return {
      canEditAnyField: true,
      canEditName: true,
      canEditEmail: false,
      canEditRole: false,
      canEditQuestionnaire: false,
      canEditSegmentation: false,
    };
  }

  return {
    canEditAnyField: true,
    canEditName: true,
    canEditEmail: true,
    canEditRole: true,
    canEditQuestionnaire: true,
    canEditSegmentation: true,
  };
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

function getInitialWithdrawFormState(): WithdrawFormState {
  return {
    reason: "",
    note: "",
  };
}

function getInitialReinstateFormState(): ReinstateFormState {
  return {
    reason: "",
    note: "",
  };
}

function getSegmentationField(
  segmentationSchema: SegmentationSchema | null | undefined,
  fieldKey: SegmentationFieldKey,
) {
  return (
    segmentationSchema?.fields.find((field) => field.fieldKey === fieldKey) ?? null
  );
}

function getSegmentationOptionLabel(
  segmentationSchema: SegmentationSchema | null | undefined,
  fieldKey: SegmentationFieldKey,
  optionKey: string | null | undefined,
): string {
  if (!optionKey) {
    return "Not set";
  }

  const field = getSegmentationField(segmentationSchema, fieldKey);

  if (!field) {
    return optionKey;
  }

  const option = field.options.find((candidate) => candidate.optionKey === optionKey);

  return option?.optionLabel ?? optionKey;
}

function getSegmentationDisplayItems(
  participant: ParticipantSummary,
  segmentationSchema: SegmentationSchema | null | undefined,
): Array<{ label: string; value: string }> {
  return [
    {
      label: "Role",
      value: participant.roleLabel || "Not set",
    },
    {
      label: "Function",
      value: getSegmentationOptionLabel(
        segmentationSchema,
        "function",
        typeof participant.segmentationValues?.function === "string"
          ? participant.segmentationValues.function
          : null,
      ),
    },
    {
      label: "Location",
      value: getSegmentationOptionLabel(
        segmentationSchema,
        "location",
        typeof participant.segmentationValues?.location === "string"
          ? participant.segmentationValues.location
          : null,
      ),
    },
    {
      label: "Level",
      value: getSegmentationOptionLabel(
        segmentationSchema,
        "level",
        typeof participant.segmentationValues?.level === "string"
          ? participant.segmentationValues.level
          : null,
      ),
    },
  ];
}

function getParticipantEditGuidance(
  participant: ParticipantSummary,
): string | null {
  if (isArchivedParticipant(participant)) {
    return "Withdrawn participants are locked. Reinstate the participant first if this was done in error.";
  }

  if (isStartedParticipant(participant)) {
    return "This participant has started. Only the name can be changed now. Email, role, questionnaire, and segmentation are locked to protect analysis integrity.";
  }

  if (isCompletedParticipant(participant)) {
    return "This participant has completed. Only the name can be changed now. Email, role, questionnaire, and segmentation are locked to protect analysis integrity.";
  }

  return null;
}

function getLockedFieldClassName(isLocked: boolean): string {
  return [
    "h-10 w-full rounded-xl border px-3 text-sm outline-none transition",
    isLocked
      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
      : "border-slate-300 bg-white text-slate-900 focus:border-slate-500",
  ].join(" ");
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
  const [projectDetailsForm, setProjectDetailsForm] =
    useState<ProjectDetailsFormState>({
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
  const [archivingParticipantId, setArchivingParticipantId] = useState("");
  const [withdrawingParticipantId, setWithdrawingParticipantId] = useState("");
  const [withdrawFormByParticipantId, setWithdrawFormByParticipantId] = useState<
    Record<string, WithdrawFormState>
  >({});
  const [reinstatingParticipantId, setReinstatingParticipantId] = useState("");
  const [reinstateFlowParticipantId, setReinstateFlowParticipantId] = useState("");
  const [reinstateFormByParticipantId, setReinstateFormByParticipantId] = useState<
    Record<string, ReinstateFormState>
  >({});

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
    if (isArchivedParticipant(participant)) {
      return;
    }

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

  function beginParticipantWithdraw(participantId: string) {
    setWithdrawingParticipantId(participantId);
    setWithdrawFormByParticipantId((current) => ({
      ...current,
      [participantId]: current[participantId] ?? getInitialWithdrawFormState(),
    }));
    setParticipantActionMessage("");
    setParticipantActionError("");
  }

  function cancelParticipantWithdraw(participantId: string) {
    setWithdrawingParticipantId((current) =>
      current === participantId ? "" : current,
    );
    setWithdrawFormByParticipantId((current) => {
      const next = { ...current };
      delete next[participantId];
      return next;
    });
    setParticipantActionMessage("");
    setParticipantActionError("");
  }

  function beginParticipantReinstate(participantId: string) {
    setReinstateFlowParticipantId(participantId);
    setReinstateFormByParticipantId((current) => ({
      ...current,
      [participantId]: current[participantId] ?? getInitialReinstateFormState(),
    }));
    setParticipantActionMessage("");
    setParticipantActionError("");
  }

  function cancelParticipantReinstate(participantId: string) {
    setReinstateFlowParticipantId((current) =>
      current === participantId ? "" : current,
    );
    setReinstateFormByParticipantId((current) => {
      const next = { ...current };
      delete next[participantId];
      return next;
    });
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

  async function archiveParticipant(participantId: string) {
    const withdrawForm = withdrawFormByParticipantId[participantId];

    if (!withdrawForm?.reason) {
      setParticipantActionError("Please select a withdraw reason.");
      return;
    }

    setArchivingParticipantId(participantId);
    setParticipantActionMessage("");
    setParticipantActionError("");

    try {
      const response = await fetch("/api/advisor-withdraw-participant", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId,
          withdrawReason: withdrawForm.reason,
          withdrawNote: withdrawForm.note.trim() || null,
        }),
      });

      const result = (await response.json()) as WithdrawParticipantResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          "error" in result ? result.error : "Unable to withdraw participant.",
        );
      }

      if (editingParticipantId === participantId) {
        setEditingParticipantId("");
        setParticipantEditForm(null);
      }

      cancelParticipantWithdraw(participantId);
      setParticipantActionMessage("Participant withdrawn successfully.");
      await loadProject();
    } catch (error) {
      setParticipantActionError(
        error instanceof Error ? error.message : "Unable to withdraw participant.",
      );
    } finally {
      setArchivingParticipantId("");
    }
  }

  async function reinstateParticipant(participantId: string) {
    const reinstateForm = reinstateFormByParticipantId[participantId];

    if (!reinstateForm?.reason) {
      setParticipantActionError("Please select a reinstate reason.");
      return;
    }

    setReinstatingParticipantId(participantId);
    setParticipantActionMessage("");
    setParticipantActionError("");

    try {
      const response = await fetch("/api/advisor-reinstate-participant", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId,
          reinstateReason: reinstateForm.reason,
          reinstateNote: reinstateForm.note.trim() || null,
        }),
      });

      const result = (await response.json()) as ReinstateParticipantResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          "error" in result ? result.error : "Unable to reinstate participant.",
        );
      }

      cancelParticipantReinstate(participantId);
      setParticipantActionMessage("Participant reinstated successfully.");
      await loadProject();
    } catch (error) {
      setParticipantActionError(
        error instanceof Error ? error.message : "Unable to reinstate participant.",
      );
    } finally {
      setReinstatingParticipantId("");
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
  const functionalSignals = data.functionalSignals;
  const respondentGroups = data.completion.respondentGroups;
  const participants = data.completion.participants;
  const biggestGaps = data.biggestGaps;
  const strongestAlignment = data.strongestAlignment;
  const segmentationSchema = project.segmentationSchema;

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
              <Link href="/advisor/projects" className="brand-button-dark text-center">
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
                                Status:{" "}
                                {getDisplayParticipantStatus(
                                  participant.participantStatus,
                                )}
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
                <AddParticipantForm
                  projectId={projectId}
                  segmentationSchema={segmentationSchema}
                />
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

              <div className="mt-6 space-y-4">
                {participants.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    No participants recorded for this project yet.
                  </div>
                ) : (
                  participants.map((participant) => {
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
                    const isArchiving =
                      archivingParticipantId === participant.participantId;
                    const isWithdrawing =
                      withdrawingParticipantId === participant.participantId;
                    const isReinstating =
                      reinstatingParticipantId === participant.participantId;
                    const isReinstateFlowOpen =
                      reinstateFlowParticipantId === participant.participantId;
                    const archiveDisabled =
                      !canArchiveParticipant(participant) ||
                      project.projectStatus !== "active" ||
                      participantActionState === "saving" ||
                      isArchiving ||
                      isWithdrawing ||
                      isReinstating ||
                      isReinstateFlowOpen;

                    if (isEditing && participantEditForm) {
                      const permissions = getParticipantEditPermissions(participant);
                      const editGuidance = getParticipantEditGuidance(participant);
                      const functionField = getSegmentationField(
                        segmentationSchema,
                        "function",
                      );
                      const locationField = getSegmentationField(
                        segmentationSchema,
                        "location",
                      );
                      const levelField = getSegmentationField(
                        segmentationSchema,
                        "level",
                      );

                      return (
                        <div
                          key={participant.participantId}
                          className="rounded-2xl border border-[var(--brand-border)] bg-white p-5 shadow-sm"
                        >
                          <div className="mb-4 flex flex-wrap items-center gap-3">
                            <p className="text-base font-semibold text-slate-900">
                              Editing participant
                            </p>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusTone(
                                participant.participantStatus,
                              )}`}
                            >
                              {getDisplayParticipantStatus(
                                participant.participantStatus,
                              )}
                            </span>
                          </div>

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
                                disabled={!permissions.canEditName}
                                className={getLockedFieldClassName(
                                  !permissions.canEditName,
                                )}
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
                                disabled={!permissions.canEditEmail}
                                className={getLockedFieldClassName(
                                  !permissions.canEditEmail,
                                )}
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
                                disabled={!permissions.canEditRole}
                                className={getLockedFieldClassName(
                                  !permissions.canEditRole,
                                )}
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
                                          event.target.value as QuestionnaireType,
                                      }
                                      : current,
                                  )
                                }
                                disabled={!permissions.canEditQuestionnaire}
                                className={getLockedFieldClassName(
                                  !permissions.canEditQuestionnaire,
                                )}
                              >
                                {ALL_QUESTIONNAIRE_OPTIONS.map((option) => (
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
                                  <select
                                    value={
                                      participantEditForm.segmentationValues.function
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
                                    disabled={
                                      !permissions.canEditSegmentation ||
                                      !functionField
                                    }
                                    className={getLockedFieldClassName(
                                      !permissions.canEditSegmentation ||
                                      !functionField,
                                    )}
                                  >
                                    <option value="">Select function</option>
                                    {(functionField?.options ?? []).map((option) => (
                                      <option
                                        key={option.optionKey}
                                        value={option.optionKey}
                                      >
                                        {option.optionLabel}
                                      </option>
                                    ))}
                                  </select>
                                </EditableField>

                                <EditableField label="Location">
                                  <select
                                    value={
                                      participantEditForm.segmentationValues.location
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
                                    disabled={
                                      !permissions.canEditSegmentation ||
                                      !locationField
                                    }
                                    className={getLockedFieldClassName(
                                      !permissions.canEditSegmentation ||
                                      !locationField,
                                    )}
                                  >
                                    <option value="">Select location</option>
                                    {(locationField?.options ?? []).map((option) => (
                                      <option
                                        key={option.optionKey}
                                        value={option.optionKey}
                                      >
                                        {option.optionLabel}
                                      </option>
                                    ))}
                                  </select>
                                </EditableField>

                                <EditableField label="Level">
                                  <select
                                    value={
                                      participantEditForm.segmentationValues.level
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
                                    disabled={
                                      !permissions.canEditSegmentation || !levelField
                                    }
                                    className={getLockedFieldClassName(
                                      !permissions.canEditSegmentation ||
                                      !levelField,
                                    )}
                                  >
                                    <option value="">Select level</option>
                                    {(levelField?.options ?? []).map((option) => (
                                      <option
                                        key={option.optionKey}
                                        value={option.optionKey}
                                      >
                                        {option.optionLabel}
                                      </option>
                                    ))}
                                  </select>
                                </EditableField>
                              </>
                            ) : (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:col-span-2 xl:col-span-3">
                                Client Fact Pack participants do not use scored
                                segmentation fields.
                              </div>
                            )}
                          </div>

                          {editGuidance ? (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                              {editGuidance}
                            </div>
                          ) : null}

                          {!segmentationSchema ? (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                              Project segmentation options are unavailable, so
                              controlled dropdown values cannot be shown.
                            </div>
                          ) : null}

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => void saveParticipantEdit()}
                              disabled={
                                participantActionState === "saving" ||
                                !permissions.canEditAnyField
                              }
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
                      );
                    }

                    const editDisabled =
                      isArchivedParticipant(participant) ||
                      project.projectStatus !== "active" ||
                      isArchiving ||
                      isWithdrawing ||
                      isReinstating ||
                      isReinstateFlowOpen;

                    const withdrawForm =
                      withdrawFormByParticipantId[participant.participantId] ??
                      getInitialWithdrawFormState();

                    const reinstateForm =
                      reinstateFormByParticipantId[participant.participantId] ??
                      getInitialReinstateFormState();

                    return (
                      <ParticipantCard
                        key={participant.participantId}
                        participant={participant}
                        projectStatus={project.projectStatus}
                        segmentationSchema={segmentationSchema}
                        selectedDays={selectedDays}
                        isExtending={isExtending}
                        extendDisabled={extendDisabled}
                        isArchiving={isArchiving}
                        isWithdrawing={isWithdrawing}
                        isReinstating={isReinstating}
                        isReinstateFlowOpen={isReinstateFlowOpen}
                        archiveDisabled={archiveDisabled}
                        editDisabled={editDisabled}
                        withdrawForm={withdrawForm}
                        reinstateForm={reinstateForm}
                        onEdit={() => beginParticipantEdit(participant)}
                        onArchive={() =>
                          beginParticipantWithdraw(participant.participantId)
                        }
                        onCancelArchive={() =>
                          cancelParticipantWithdraw(participant.participantId)
                        }
                        onWithdrawFormChange={(nextForm) =>
                          setWithdrawFormByParticipantId((current) => ({
                            ...current,
                            [participant.participantId]: nextForm,
                          }))
                        }
                        onConfirmArchive={() =>
                          void archiveParticipant(participant.participantId)
                        }
                        onBeginReinstate={() =>
                          beginParticipantReinstate(participant.participantId)
                        }
                        onCancelReinstate={() =>
                          cancelParticipantReinstate(participant.participantId)
                        }
                        onReinstateFormChange={(nextForm) =>
                          setReinstateFormByParticipantId((current) => ({
                            ...current,
                            [participant.participantId]: nextForm,
                          }))
                        }
                        onConfirmReinstate={() =>
                          void reinstateParticipant(participant.participantId)
                        }
                        onExtendDaysChange={(days) =>
                          setExtendDaysByParticipantId((current) => ({
                            ...current,
                            [participant.participantId]: days,
                          }))
                        }
                        onExtendInvite={() =>
                          void extendInvite(participant.participantId)
                        }
                      />
                    );
                  })
                )}
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="brand-section-kicker">Reporting context</p>
                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    Fact pack, functional signals, and diagnostic pattern signals
                  </h2>
                </div>

                <div className="grid gap-4 xl:grid-cols-4">
                  <FactPackCard factPack={factPack} />

                  <FunctionalSignalsCard functionalSignals={functionalSignals} />

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

function MetricCard({ label, value }: { label: string; value: string }) {
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

function NotesCard({ notes }: { notes: string | null }) {
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
  onChange: Dispatch<SetStateAction<ProjectDetailsFormState>>;
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

function ParticipantCard({
  participant,
  projectStatus,
  segmentationSchema,
  selectedDays,
  isExtending,
  extendDisabled,
  isArchiving,
  isWithdrawing,
  isReinstating,
  isReinstateFlowOpen,
  archiveDisabled,
  editDisabled,
  withdrawForm,
  reinstateForm,
  onEdit,
  onArchive,
  onCancelArchive,
  onWithdrawFormChange,
  onConfirmArchive,
  onBeginReinstate,
  onCancelReinstate,
  onReinstateFormChange,
  onConfirmReinstate,
  onExtendDaysChange,
  onExtendInvite,
}: {
  participant: ParticipantSummary;
  projectStatus: string;
  segmentationSchema: SegmentationSchema | null;
  selectedDays: number;
  isExtending: boolean;
  extendDisabled: boolean;
  isArchiving: boolean;
  isWithdrawing: boolean;
  isReinstating: boolean;
  isReinstateFlowOpen: boolean;
  archiveDisabled: boolean;
  editDisabled: boolean;
  withdrawForm: WithdrawFormState;
  reinstateForm: ReinstateFormState;
  onEdit: () => void;
  onArchive: () => void;
  onCancelArchive: () => void;
  onWithdrawFormChange: (nextForm: WithdrawFormState) => void;
  onConfirmArchive: () => void;
  onBeginReinstate: () => void;
  onCancelReinstate: () => void;
  onReinstateFormChange: (nextForm: ReinstateFormState) => void;
  onConfirmReinstate: () => void;
  onExtendDaysChange: (days: number) => void;
  onExtendInvite: () => void;
}) {
  const segmentationDisplayItems = useMemo(
    () => getSegmentationDisplayItems(participant, segmentationSchema),
    [participant, segmentationSchema],
  );

  return (
    <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {participant.name}
            </h3>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusTone(
                participant.participantStatus,
              )}`}
            >
              {getDisplayParticipantStatus(participant.participantStatus)}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {formatQuestionnaireType(participant.questionnaireType)}
            </span>
          </div>

          <p className="mt-2 break-words text-sm text-slate-600">
            {participant.email}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {segmentationDisplayItems.map((item) => (
              <AttributeCard
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetaChip label="Invited" value={formatDateTime(participant.invitedAt)} />
            <MetaChip
              label="Expires"
              value={formatDateTime(participant.inviteExpiresAt)}
            />
            <MetaChip label="Started" value={formatDateTime(participant.startedAt)} />
            <MetaChip
              label="Completed"
              value={formatDateTime(participant.completedAt)}
            />
          </div>

          {projectStatus !== "active" ? (
            <p className="mt-4 text-xs text-slate-500">
              This project is closed. Participant actions are restricted.
            </p>
          ) : null}

          {isArchivedParticipant(participant) ? (
            <p className="mt-4 text-xs text-slate-500">
              This participant has been withdrawn. Editing is disabled until the
              participant is reinstated.
            </p>
          ) : null}
        </div>

        <div className="w-full xl:w-[300px]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Actions
            </p>

            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={onEdit}
                disabled={editDisabled}
                className="brand-button-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                Edit participant
              </button>

              {isArchivedParticipant(participant) ? (
                isReinstateFlowOpen ? (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                    <p className="text-sm font-semibold text-sky-900">
                      Reinstate participant
                    </p>
                    <p className="mt-2 text-sm leading-6 text-sky-800">
                      This will return the participant to active collection and
                      include them in analysis again.
                    </p>

                    <div className="mt-4 space-y-3">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-sky-900">
                          Reason
                        </span>
                        <select
                          value={reinstateForm.reason}
                          onChange={(event) =>
                            onReinstateFormChange({
                              ...reinstateForm,
                              reason: event.target.value as ReinstateReason | "",
                            })
                          }
                          disabled={isReinstating}
                          className="h-10 w-full rounded-xl border border-sky-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">Select reason</option>
                          {REINSTATE_REASON_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-sky-900">
                          Note (optional)
                        </span>
                        <textarea
                          value={reinstateForm.note}
                          onChange={(event) =>
                            onReinstateFormChange({
                              ...reinstateForm,
                              note: event.target.value,
                            })
                          }
                          disabled={isReinstating}
                          rows={3}
                          className="w-full rounded-xl border border-sky-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                          placeholder="Add any useful context for future review"
                        />
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={onConfirmReinstate}
                          disabled={isReinstating || !reinstateForm.reason}
                          className="rounded-xl border border-sky-300 bg-sky-100 px-4 py-2.5 text-sm font-medium text-sky-900 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isReinstating ? "Reinstating..." : "Confirm reinstate"}
                        </button>

                        <button
                          type="button"
                          onClick={onCancelReinstate}
                          disabled={isReinstating}
                          className="brand-button-dark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onBeginReinstate}
                    disabled={
                      projectStatus !== "active" || isReinstating || isWithdrawing
                    }
                    className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-medium text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reinstate participant
                  </button>
                )
              ) : isWithdrawing ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Withdraw participant
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    This will remove the participant from active collection and
                    exclude them from analysis while preserving the audit trail.
                  </p>

                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-amber-900">
                        Reason
                      </span>
                      <select
                        value={withdrawForm.reason}
                        onChange={(event) =>
                          onWithdrawFormChange({
                            ...withdrawForm,
                            reason: event.target.value as WithdrawReason | "",
                          })
                        }
                        disabled={isArchiving}
                        className="h-10 w-full rounded-xl border border-amber-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Select reason</option>
                        {WITHDRAW_REASON_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-amber-900">
                        Note (optional)
                      </span>
                      <textarea
                        value={withdrawForm.note}
                        onChange={(event) =>
                          onWithdrawFormChange({
                            ...withdrawForm,
                            note: event.target.value,
                          })
                        }
                        disabled={isArchiving}
                        rows={3}
                        className="w-full rounded-xl border border-amber-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="Add any useful context for future review"
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={onConfirmArchive}
                        disabled={isArchiving || !withdrawForm.reason}
                        className="rounded-xl border border-amber-300 bg-amber-100 px-4 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isArchiving ? "Withdrawing..." : "Confirm withdrawal"}
                      </button>

                      <button
                        type="button"
                        onClick={onCancelArchive}
                        disabled={isArchiving}
                        className="brand-button-dark disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onArchive}
                  disabled={archiveDisabled}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Withdraw participant
                </button>
              )}

              <select
                value={selectedDays}
                onChange={(event) => onExtendDaysChange(Number(event.target.value))}
                disabled={
                  extendDisabled ||
                  isExtending ||
                  isWithdrawing ||
                  isReinstating ||
                  isReinstateFlowOpen
                }
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
                onClick={onExtendInvite}
                disabled={
                  extendDisabled ||
                  isExtending ||
                  isWithdrawing ||
                  isReinstating ||
                  isReinstateFlowOpen
                }
                className="brand-button-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isExtending ? "Extending..." : "Extend invite"}
              </button>
            </div>

            {extendDisabled ? (
              <p className="mt-3 text-xs text-slate-500">
                Invite extension is only available for open, incomplete participants
                in an open project.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AttributeCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-slate-700">{value}</p>
    </div>
  );
}

function EditableField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
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
  children: ReactNode;
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

function FactPackCard({ factPack }: { factPack: FactPackSummary }) {
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

function FunctionalSignalsCard({
  functionalSignals,
}: {
  functionalSignals: FunctionalSignalSummary[];
}) {
  const completedCount = functionalSignals.filter(
    (signal) => signal.signalStatus === "completed",
  ).length;

  return (
    <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Functional signals
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Non-scored cross-functional input
          </p>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
          {completedCount} / {functionalSignals.length}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {functionalSignals.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
            No functional signal modules have been added yet. These will sit
            outside the scored diagnostic model.
          </div>
        ) : (
          functionalSignals.map((signal) => (
            <div
              key={signal.signalRequestId}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {signal.moduleLabel ||
                      formatFunctionalSignalModuleType(signal.moduleType)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {signal.recipientName}
                  </p>
                  <p className="mt-1 break-words text-xs text-slate-500">
                    {signal.recipientEmail}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getFunctionalSignalTone(
                    signal.signalStatus,
                  )}`}
                >
                  {getFunctionalSignalStatusLabel(signal.signalStatus)}
                </span>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <p>Invited: {formatDateTime(signal.invitedAt)}</p>
                <p>Completed: {formatDateTime(signal.completedAt)}</p>
              </div>
            </div>
          ))
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          Functional signals are contextual only. They do not affect scored
          completion, dimension scores, cross-group gaps, or qualitative analysis.
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
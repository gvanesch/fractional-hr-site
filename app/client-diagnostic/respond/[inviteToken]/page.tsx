import { redirect, notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  questionnaireTypes,
  type QuestionnaireType,
} from "@/lib/client-diagnostic/question-bank";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type ProjectQuestionnaireType = QuestionnaireType | "client_fact_pack";

type PageProps = {
  params: Promise<{
    inviteToken: string;
  }>;
};

type ParticipantInviteLookupRow = {
  participant_id: string;
  project_id: string;
  questionnaire_type: string;
  participant_status: string;
  completed_at: string | null;
  invite_expires_at: string | null;
  invite_revoked_at: string | null;
  client_projects:
    | {
        project_status: string;
      }
    | {
        project_status: string;
      }[]
    | null;
};

type ResolvedParticipantInvite = {
  participant_id: string;
  project_id: string;
  questionnaire_type: ProjectQuestionnaireType;
  participant_status: string;
  completed_at: string | null;
  invite_expires_at: string | null;
  invite_revoked_at: string | null;
  project_status: string;
};

function logAndNotFound(reason: string, details?: Record<string, unknown>): never {
  console.info(
    JSON.stringify({
      event: "client_diagnostic_respond_not_found",
      reason,
      ...(details ?? {}),
    }),
  );
  notFound();
}

function isScoredQuestionnaireType(value: string): value is QuestionnaireType {
  return questionnaireTypes.includes(value as QuestionnaireType);
}

function isProjectQuestionnaireType(
  value: string,
): value is ProjectQuestionnaireType {
  return isScoredQuestionnaireType(value) || value === "client_fact_pack";
}

function isReasonableInviteToken(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length >= 16;
}

function isUuid(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isInviteExpired(inviteExpiresAt: string | null): boolean {
  if (!inviteExpiresAt) {
    return false;
  }

  const expiresAt = new Date(inviteExpiresAt);
  return Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now();
}

function isParticipantStateAllowed(params: {
  participantStatus: string;
  completedAt: string | null;
  questionnaireType: ProjectQuestionnaireType;
}): boolean {
  const { participantStatus, completedAt, questionnaireType } = params;

  if (participantStatus === "archived") {
    return false;
  }

  if (questionnaireType === "client_fact_pack") {
    return participantStatus === "invited" || participantStatus === "started";
  }

  if (completedAt) {
    return false;
  }

  return participantStatus === "invited" || participantStatus === "started";
}

function getProjectStatus(
  clientProjects: ParticipantInviteLookupRow["client_projects"],
): string | null {
  if (!clientProjects) {
    return null;
  }

  if (Array.isArray(clientProjects)) {
    return clientProjects[0]?.project_status ?? null;
  }

  return clientProjects.project_status ?? null;
}

export default async function ClientDiagnosticRespondPage({
  params,
}: PageProps) {
  const { inviteToken } = await params;

  if (!isReasonableInviteToken(inviteToken)) {
    logAndNotFound("invalid_invite_token_format", { inviteToken });
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("client_participants")
    .select(
      `
        participant_id,
        project_id,
        questionnaire_type,
        participant_status,
        completed_at,
        invite_expires_at,
        invite_revoked_at,
        client_projects!client_participants_project_fk!inner(project_status)
      `,
    )
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (error || !data) {
    logAndNotFound("participant_lookup_failed", {
      inviteToken,
      error: error?.message ?? null,
      hasData: Boolean(data),
    });
  }

  const participant = data as ParticipantInviteLookupRow;
  const projectStatus = getProjectStatus(participant.client_projects);

  if (!isUuid(participant.participant_id) || !isUuid(participant.project_id)) {
    logAndNotFound("invalid_participant_or_project_uuid", {
      inviteToken,
      participantId: participant.participant_id,
      projectId: participant.project_id,
    });
  }

  if (!isProjectQuestionnaireType(participant.questionnaire_type)) {
    logAndNotFound("invalid_questionnaire_type", {
      inviteToken,
      questionnaireType: participant.questionnaire_type,
    });
  }

  if (!projectStatus) {
    logAndNotFound("missing_project_status", {
      inviteToken,
      clientProjects: participant.client_projects,
    });
  }

  const resolvedParticipant: ResolvedParticipantInvite = {
    participant_id: participant.participant_id,
    project_id: participant.project_id,
    questionnaire_type: participant.questionnaire_type,
    participant_status: participant.participant_status,
    completed_at: participant.completed_at,
    invite_expires_at: participant.invite_expires_at,
    invite_revoked_at: participant.invite_revoked_at,
    project_status: projectStatus,
  };

  if (resolvedParticipant.project_status !== "active") {
    logAndNotFound("project_not_active", {
      inviteToken,
      projectStatus: resolvedParticipant.project_status,
    });
  }

  if (resolvedParticipant.invite_revoked_at) {
    logAndNotFound("invite_revoked", {
      inviteToken,
      inviteRevokedAt: resolvedParticipant.invite_revoked_at,
    });
  }

  if (isInviteExpired(resolvedParticipant.invite_expires_at)) {
    logAndNotFound("invite_expired", {
      inviteToken,
      inviteExpiresAt: resolvedParticipant.invite_expires_at,
      now: new Date().toISOString(),
    });
  }

  if (
    !isParticipantStateAllowed({
      participantStatus: resolvedParticipant.participant_status,
      completedAt: resolvedParticipant.completed_at,
      questionnaireType: resolvedParticipant.questionnaire_type,
    })
  ) {
    logAndNotFound("participant_state_not_allowed", {
      inviteToken,
      participantStatus: resolvedParticipant.participant_status,
      completedAt: resolvedParticipant.completed_at,
      questionnaireType: resolvedParticipant.questionnaire_type,
    });
  }

  const targetUrl =
    resolvedParticipant.questionnaire_type === "client_fact_pack"
      ? `/client-diagnostic/client-fact-pack` +
        `?projectId=${encodeURIComponent(resolvedParticipant.project_id)}` +
        `&participantId=${encodeURIComponent(resolvedParticipant.participant_id)}` +
        `&inviteToken=${encodeURIComponent(inviteToken)}`
      : `/client-diagnostic/${resolvedParticipant.questionnaire_type}` +
        `?projectId=${encodeURIComponent(resolvedParticipant.project_id)}` +
        `&participantId=${encodeURIComponent(resolvedParticipant.participant_id)}` +
        `&inviteToken=${encodeURIComponent(inviteToken)}`;

  console.info(
    JSON.stringify({
      event: "client_diagnostic_respond_redirect",
      inviteToken,
      questionnaireType: resolvedParticipant.questionnaire_type,
      targetUrl,
    }),
  );

  redirect(targetUrl);
}
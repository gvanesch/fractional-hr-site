import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendParticipantEventEmail } from "@/lib/client-diagnostic/participant-email";

const ALLOWED_REINSTATE_REASONS = [
  "withdrawn_in_error",
  "duplicate_resolved",
  "client_requested_reinstatement",
  "participant_now_in_scope",
  "other",
] as const;

const DEFAULT_REINSTATE_EXPIRY_DAYS = 21;

type ReinstateReason = (typeof ALLOWED_REINSTATE_REASONS)[number];

type ParticipantRow = {
  participant_id: string;
  project_id: string;
  name: string | null;
  email: string;
  questionnaire_type: "hr" | "manager" | "leadership" | "client_fact_pack";
  participant_status: string;
  completed_at: string | null;
  invite_token: string | null;
  invite_expires_at: string | null;
  invite_revoked_at: string | null;
  client_projects:
    | {
        project_id: string;
        project_status: string;
        project_name: string | null;
        company_name: string | null;
      }
    | Array<{
        project_id: string;
        project_status: string;
        project_name: string | null;
        company_name: string | null;
      }>;
};

type UpdatedParticipantRow = {
  participant_id: string;
  project_id: string;
  name: string | null;
  email: string;
  questionnaire_type: "hr" | "manager" | "leadership" | "client_fact_pack";
  participant_status: string;
  completed_at: string | null;
  invite_token: string | null;
  invite_expires_at: string | null;
  invite_revoked_at: string | null;
};

type ReinstateParticipantRequestBody = {
  participantId?: string;
  reinstateReason?: string;
  reinstateNote?: string;
};

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidReinstateReason(value: string): value is ReinstateReason {
  return ALLOWED_REINSTATE_REASONS.includes(value as ReinstateReason);
}

function getParticipantDisplayName(name: string | null, email: string): string {
  const cleanName = typeof name === "string" ? name.trim() : "";
  return cleanName || email;
}

function getReinstateReasonLabel(reason: ReinstateReason): string {
  switch (reason) {
    case "withdrawn_in_error":
      return "Withdrawn in error";
    case "duplicate_resolved":
      return "Duplicate resolved";
    case "client_requested_reinstatement":
      return "Client requested reinstatement";
    case "participant_now_in_scope":
      return "Participant now in scope";
    case "other":
      return "Other";
    default:
      return reason;
  }
}

function isFutureDate(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() > Date.now();
}

function getFreshInviteExpiry(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_REINSTATE_EXPIRY_DAYS);
  return expiresAt.toISOString();
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const advisorUser = await requireAdvisorUser();

    if (!advisorUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as ReinstateParticipantRequestBody;
    const participantId = cleanString(body.participantId);
    const reinstateReason = cleanString(body.reinstateReason);
    const reinstateNote = cleanString(body.reinstateNote);

    if (!participantId || !isUuid(participantId)) {
      return NextResponse.json(
        { success: false, error: "A valid participantId is required." },
        { status: 400 },
      );
    }

    if (!reinstateReason || !isValidReinstateReason(reinstateReason)) {
      return NextResponse.json(
        {
          success: false,
          error: `A valid reinstateReason is required. Allowed values: ${ALLOWED_REINSTATE_REASONS.join(", ")}.`,
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: participant, error: participantError } = await supabase
      .from("client_participants")
      .select(
        `
          participant_id,
          project_id,
          name,
          email,
          questionnaire_type,
          participant_status,
          completed_at,
          invite_token,
          invite_expires_at,
          invite_revoked_at,
          client_projects!inner(project_id, project_status, project_name, company_name)
        `,
      )
      .eq("participant_id", participantId)
      .single<ParticipantRow>();

    if (participantError || !participant) {
      return NextResponse.json(
        { success: false, error: "Participant not found." },
        { status: 404 },
      );
    }

    const project = Array.isArray(participant.client_projects)
      ? participant.client_projects[0]
      : participant.client_projects;

    if (!project || project.project_status !== "active") {
      return NextResponse.json(
        { success: false, error: "Project is not active." },
        { status: 409 },
      );
    }

    if (participant.participant_status !== "archived") {
      return NextResponse.json(
        {
          success: false,
          error: "Only withdrawn participants can be reinstated.",
        },
        { status: 409 },
      );
    }

    if (participant.completed_at !== null) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Completed participants cannot be reinstated through this route.",
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const restoredInviteToken = participant.invite_token ?? randomUUID();
    const restoredInviteExpiresAt = isFutureDate(participant.invite_expires_at)
      ? participant.invite_expires_at
      : getFreshInviteExpiry();

    const { data: updatedParticipant, error: updateError } = await supabase
      .from("client_participants")
      .update({
        participant_status: "invited",
        invite_token: restoredInviteToken,
        invite_expires_at: restoredInviteExpiresAt,
        invite_revoked_at: null,
        reinstate_reason: reinstateReason,
        reinstate_note: reinstateNote || null,
        reinstated_at: now,
        updated_at: now,
      })
      .eq("participant_id", participantId)
      .select(
        "participant_id, project_id, name, email, questionnaire_type, participant_status, completed_at, invite_token, invite_expires_at, invite_revoked_at",
      )
      .single<UpdatedParticipantRow>();

    if (updateError || !updatedParticipant) {
      console.error("Participant reinstate failed", {
        participantId,
        error: updateError,
      });

      return NextResponse.json(
        { success: false, error: "Unable to reinstate participant." },
        { status: 500 },
      );
    }

    let emailWarning: string | null = null;

    try {
      const resend = new Resend(getEnv("RESEND_API_KEY"));
      const siteUrl = getEnv("NEXT_PUBLIC_SITE_URL").replace(/\/+$/, "");
      const fromEmail = getEnv("CONTACT_FROM_EMAIL");
      const replyToEmail = getEnv("CONTACT_TO_EMAIL");

      const emailResult = await sendParticipantEventEmail({
        resend,
        fromEmail,
        replyToEmail,
        siteUrl,
        projectName: project.project_name?.trim() || project.company_name || "Project",
        companyName: project.company_name,
        eventType: "participant_reinstated",
        participant: {
          name: getParticipantDisplayName(
            updatedParticipant.name,
            updatedParticipant.email,
          ),
          email: updatedParticipant.email,
          questionnaireType: updatedParticipant.questionnaire_type,
          inviteToken: updatedParticipant.invite_token,
          inviteExpiresAt: updatedParticipant.invite_expires_at,
        },
        metadata: {
          updatedInviteExpiresAt: updatedParticipant.invite_expires_at,
          reinstateReasonLabel: getReinstateReasonLabel(reinstateReason),
          reinstateNote: reinstateNote || null,
        },
      });

      if (!emailResult.success) {
        emailWarning =
          "Participant was reinstated, but the confirmation email could not be sent.";

        console.error("Reinstate participant email failed", {
          participantId: updatedParticipant.participant_id,
          email: updatedParticipant.email,
          error: emailResult.error,
        });
      }
    } catch (emailError) {
      emailWarning =
        "Participant was reinstated, but the confirmation email could not be sent.";

      console.error("Unexpected error sending reinstate participant email", {
        participantId: updatedParticipant.participant_id,
        error: emailError,
      });
    }

    console.info(
      JSON.stringify({
        event: "participant_reinstated",
        participantId: updatedParticipant.participant_id,
        projectId: updatedParticipant.project_id,
        participantStatusBefore: participant.participant_status,
        participantStatusAfter: updatedParticipant.participant_status,
        completedAt: updatedParticipant.completed_at,
        inviteRevokedAtBefore: participant.invite_revoked_at,
        inviteRevokedAtAfter: updatedParticipant.invite_revoked_at,
        inviteExpiresAtBefore: participant.invite_expires_at,
        inviteExpiresAtAfter: updatedParticipant.invite_expires_at,
        reinstateReason,
        reinstatedAt: now,
      }),
    );

    return NextResponse.json({
      success: true,
      participant: {
        participantId: updatedParticipant.participant_id,
        projectId: updatedParticipant.project_id,
        participantStatus: updatedParticipant.participant_status,
        completedAt: updatedParticipant.completed_at,
      },
      emailWarning,
    });
  } catch (error) {
    console.error("Unexpected error reinstating participant", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendParticipantEventEmail } from "@/lib/client-diagnostic/participant-email";

const ALLOWED_WITHDRAW_REASONS = [
  "wrong_details",
  "duplicate_participant",
  "added_in_error",
  "contact_left_organisation",
  "company_withdrew_participant",
  "declined_to_participate",
  "no_longer_in_scope",
  "other",
] as const;

type WithdrawReason = (typeof ALLOWED_WITHDRAW_REASONS)[number];

type ParticipantRow = {
  participant_id: string;
  project_id: string;
  name: string | null;
  email: string;
  questionnaire_type: "hr" | "manager" | "leadership" | "client_fact_pack";
  participant_status: string;
  completed_at: string | null;
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
  invite_revoked_at: string | null;
};

type WithdrawParticipantRequestBody = {
  participantId?: string;
  withdrawReason?: string;
  withdrawNote?: string;
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

function isValidWithdrawReason(value: string): value is WithdrawReason {
  return ALLOWED_WITHDRAW_REASONS.includes(value as WithdrawReason);
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getParticipantDisplayName(name: string | null, email: string): string {
  const cleanName = typeof name === "string" ? name.trim() : "";
  return cleanName || email;
}

function getWithdrawReasonLabel(reason: WithdrawReason): string {
  switch (reason) {
    case "wrong_details":
      return "Wrong details entered";
    case "duplicate_participant":
      return "Duplicate participant";
    case "added_in_error":
      return "Added in error";
    case "contact_left_organisation":
      return "Contact left organisation";
    case "company_withdrew_participant":
      return "Company withdrew participant";
    case "declined_to_participate":
      return "Declined to participate";
    case "no_longer_in_scope":
      return "No longer in scope";
    case "other":
      return "Other";
    default:
      return reason;
  }
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

    const body = (await request.json()) as WithdrawParticipantRequestBody;

    const participantId = cleanString(body.participantId);
    const withdrawReason = cleanString(body.withdrawReason);
    const withdrawNote = cleanString(body.withdrawNote);

    if (!participantId || !isUuid(participantId)) {
      return NextResponse.json(
        { success: false, error: "A valid participantId is required." },
        { status: 400 },
      );
    }

    if (!withdrawReason || !isValidWithdrawReason(withdrawReason)) {
      return NextResponse.json(
        {
          success: false,
          error: `A valid withdrawReason is required. Allowed values: ${ALLOWED_WITHDRAW_REASONS.join(", ")}.`,
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

    if (participant.participant_status === "archived") {
      return NextResponse.json(
        { success: false, error: "Participant is already withdrawn." },
        { status: 409 },
      );
    }

    if (
      participant.participant_status === "completed" ||
      participant.completed_at !== null
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Completed participants cannot be withdrawn. Completed participation must remain intact for reporting and future comparison.",
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();

    const { data: updatedParticipant, error: updateError } = await supabase
      .from("client_participants")
      .update({
        participant_status: "archived",
        invite_revoked_at: participant.invite_revoked_at ?? now,
        withdraw_reason: withdrawReason,
        withdraw_note: withdrawNote || null,
        withdrawn_at: now,
        updated_at: now,
      })
      .eq("participant_id", participantId)
      .select(
        "participant_id, project_id, name, email, questionnaire_type, participant_status, completed_at, invite_revoked_at",
      )
      .single<UpdatedParticipantRow>();

    if (updateError || !updatedParticipant) {
      console.error("Participant withdraw failed", {
        participantId,
        error: updateError,
      });

      return NextResponse.json(
        { success: false, error: "Unable to withdraw participant." },
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
        eventType: "participant_withdrawn",
        participant: {
          name: getParticipantDisplayName(
            updatedParticipant.name,
            updatedParticipant.email,
          ),
          email: updatedParticipant.email,
          questionnaireType: updatedParticipant.questionnaire_type,
        },
        metadata: {
          withdrawReasonLabel: getWithdrawReasonLabel(withdrawReason),
          withdrawNote: withdrawNote || null,
        },
      });

      if (!emailResult.success) {
        emailWarning =
          "Participant was withdrawn, but the confirmation email could not be sent.";

        console.error("Withdraw participant email failed", {
          participantId: updatedParticipant.participant_id,
          email: updatedParticipant.email,
          error: emailResult.error,
        });
      }
    } catch (emailError) {
      emailWarning =
        "Participant was withdrawn, but the confirmation email could not be sent.";

      console.error("Unexpected error sending withdraw participant email", {
        participantId: updatedParticipant.participant_id,
        error: emailError,
      });
    }

    console.info(
      JSON.stringify({
        event: "participant_withdrawn",
        participantId: updatedParticipant.participant_id,
        projectId: updatedParticipant.project_id,
        participantStatusBefore: participant.participant_status,
        participantStatusAfter: updatedParticipant.participant_status,
        completedAt: updatedParticipant.completed_at,
        inviteRevokedAt: updatedParticipant.invite_revoked_at,
        withdrawReason,
        withdrawnAt: now,
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
    console.error("Unexpected error withdrawing participant", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendParticipantEventEmail } from "@/lib/client-diagnostic/participant-email";

export const dynamic = "force-dynamic";

type ExtendInviteRequestBody = {
  participantId?: string;
  days?: number;
};

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
  name: string | null;
  email: string;
  questionnaire_type: "hr" | "manager" | "leadership" | "client_fact_pack";
  participant_status: string;
  invite_token: string | null;
  invite_expires_at: string | null;
  invite_revoked_at: string | null;
};

const ALLOWED_EXTENSION_DAYS = [7, 14, 21, 30] as const;

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

function isAllowedExtensionDays(
  value: number,
): value is (typeof ALLOWED_EXTENSION_DAYS)[number] {
  return ALLOWED_EXTENSION_DAYS.includes(
    value as (typeof ALLOWED_EXTENSION_DAYS)[number],
  );
}

function getExtensionBaseDate(currentInviteExpiresAt: string | null): Date {
  if (!currentInviteExpiresAt) {
    return new Date();
  }

  const currentExpiry = new Date(currentInviteExpiresAt);

  if (Number.isNaN(currentExpiry.getTime())) {
    return new Date();
  }

  return currentExpiry;
}

function getExtendedInviteExpiry(
  currentInviteExpiresAt: string | null,
  days: number,
): string {
  const baseDate = getExtensionBaseDate(currentInviteExpiresAt);
  const expiresAt = new Date(baseDate);
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

function getParticipantDisplayName(name: string | null, email: string): string {
  const cleanName = typeof name === "string" ? name.trim() : "";
  return cleanName || email;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const advisorUser = await requireAdvisorUser();

    if (!advisorUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as ExtendInviteRequestBody;

    const participantId = body.participantId?.trim() ?? "";
    const days = typeof body.days === "number" ? body.days : 21;

    if (!participantId || !isUuid(participantId)) {
      return NextResponse.json(
        { success: false, error: "A valid participantId is required." },
        { status: 400 },
      );
    }

    if (!Number.isInteger(days) || !isAllowedExtensionDays(days)) {
      return NextResponse.json(
        {
          success: false,
          error: `days must be one of: ${ALLOWED_EXTENSION_DAYS.join(", ")}.`,
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

    if (!participant.invite_token) {
      return NextResponse.json(
        {
          success: false,
          error: "Participant does not have an active invite token.",
        },
        { status: 409 },
      );
    }

    if (
      participant.participant_status === "completed" ||
      participant.completed_at
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Completed participants cannot have invite expiry extended.",
        },
        { status: 409 },
      );
    }

    if (participant.participant_status === "archived") {
      return NextResponse.json(
        {
          success: false,
          error: "Archived participants cannot have invite expiry extended.",
        },
        { status: 409 },
      );
    }

    const previousInviteExpiresAt = participant.invite_expires_at;
    const inviteExpiresAt = getExtendedInviteExpiry(
      participant.invite_expires_at,
      days,
    );

    const { data: updatedParticipant, error: updateError } = await supabase
      .from("client_participants")
      .update({
        invite_expires_at: inviteExpiresAt,
        invite_revoked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("participant_id", participantId)
      .select(
        "participant_id, name, email, questionnaire_type, participant_status, invite_token, invite_expires_at, invite_revoked_at",
      )
      .single<UpdatedParticipantRow>();

    if (updateError || !updatedParticipant) {
      console.error("Invite extension failed", updateError);

      return NextResponse.json(
        { success: false, error: "Unable to extend invite expiry." },
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
        eventType: "invite_extended",
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
          previousInviteExpiresAt,
          updatedInviteExpiresAt: updatedParticipant.invite_expires_at,
        },
      });

      if (!emailResult.success) {
        emailWarning = "Invite expiry was updated, but the confirmation email could not be sent.";

        console.error("Invite extension email failed", {
          participantId: updatedParticipant.participant_id,
          email: updatedParticipant.email,
          error: emailResult.error,
        });
      }
    } catch (emailError) {
      emailWarning =
        "Invite expiry was updated, but the confirmation email could not be sent.";

      console.error("Unexpected error sending invite extension email", {
        participantId: updatedParticipant.participant_id,
        error: emailError,
      });
    }

    return NextResponse.json({
      success: true,
      participant: updatedParticipant,
      extendedByDays: days,
      emailWarning,
    });
  } catch (error) {
    console.error("Unexpected error extending invite", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
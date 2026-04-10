import { NextResponse } from "next/server";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ExtendInviteRequestBody = {
  participantId?: string;
  days?: number;
};

const ALLOWED_EXTENSION_DAYS = [7, 14, 21, 30] as const;

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

function getExtendedInviteExpiry(days: number): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
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
          email,
          questionnaire_type,
          participant_status,
          completed_at,
          invite_token,
          invite_expires_at,
          invite_revoked_at,
          client_projects!inner(project_id, project_status)
        `,
      )
      .eq("participant_id", participantId)
      .single();

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

    const inviteExpiresAt = getExtendedInviteExpiry(days);

    const { data: updatedParticipant, error: updateError } = await supabase
      .from("client_participants")
      .update({
        invite_expires_at: inviteExpiresAt,
        invite_revoked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("participant_id", participantId)
      .select(
        "participant_id, email, questionnaire_type, participant_status, invite_expires_at, invite_revoked_at",
      )
      .single();

    if (updateError || !updatedParticipant) {
      console.error("Invite extension failed", updateError);

      return NextResponse.json(
        { success: false, error: "Unable to extend invite expiry." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      participant: updatedParticipant,
      extendedByDays: days,
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
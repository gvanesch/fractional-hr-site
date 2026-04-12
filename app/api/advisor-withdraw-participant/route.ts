import { NextResponse } from "next/server";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
  participant_status: string;
  completed_at: string | null;
  invite_revoked_at: string | null;
};

type ArchiveParticipantRequestBody = {
  participantId?: string;
  withdrawReason?: string;
  withdrawNote?: string;
};

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

export async function PATCH(request: Request): Promise<Response> {
  try {
    const advisorUser = await requireAdvisorUser();

    if (!advisorUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as ArchiveParticipantRequestBody;

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
        "participant_id, project_id, participant_status, completed_at, invite_revoked_at",
      )
      .eq("participant_id", participantId)
      .single<ParticipantRow>();

    if (participantError || !participant) {
      return NextResponse.json(
        { success: false, error: "Participant not found." },
        { status: 404 },
      );
    }

    if (participant.participant_status === "archived") {
      return NextResponse.json(
        { success: false, error: "Participant is already archived." },
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
            "Completed participants cannot be archived. Completed participation must remain intact for reporting and future comparison.",
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
        "participant_id, project_id, participant_status, completed_at, invite_revoked_at",
      )
      .single<ParticipantRow>();

    if (updateError || !updatedParticipant) {
      console.error("Participant archive failed", {
        participantId,
        error: updateError,
      });

      return NextResponse.json(
        { success: false, error: "Unable to withdraw participant." },
        { status: 500 },
      );
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
    });
  } catch (error) {
    console.error("Unexpected error archiving participant", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
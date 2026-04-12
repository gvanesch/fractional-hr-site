import { NextResponse } from "next/server";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_REINSTATE_REASONS = [
  "withdrawn_in_error",
  "duplicate_resolved",
  "client_requested_reinstatement",
  "participant_now_in_scope",
  "other",
] as const;

type ReinstateReason = (typeof ALLOWED_REINSTATE_REASONS)[number];

type ParticipantRow = {
  participant_id: string;
  project_id: string;
  participant_status: string;
  completed_at: string | null;
  invite_revoked_at: string | null;
};

type ReinstateParticipantRequestBody = {
  participantId?: string;
  reinstateReason?: string;
  reinstateNote?: string;
};

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

    const { data: updatedParticipant, error: updateError } = await supabase
      .from("client_participants")
      .update({
        participant_status: "invited",
        invite_revoked_at: null,
        reinstate_reason: reinstateReason,
        reinstate_note: reinstateNote || null,
        reinstated_at: now,
        updated_at: now,
      })
      .eq("participant_id", participantId)
      .select(
        "participant_id, project_id, participant_status, completed_at, invite_revoked_at",
      )
      .single<ParticipantRow>();

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
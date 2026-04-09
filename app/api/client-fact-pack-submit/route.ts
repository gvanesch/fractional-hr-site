import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

type FactPackSubmitRequest = {
  projectId: string;
  participantId: string;
  inviteToken: string;
  responseJson: Record<string, unknown>;
  mode: "draft" | "submit";
};

type ParticipantLookupRow = {
  participant_id: string;
  project_id: string;
  questionnaire_type: string;
  participant_status: string;
  completed_at: string | null;
  invite_token: string | null;
  started_at: string | null;
};

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getSupabaseAdminClient() {
  return createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function isUuid(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isReasonableInviteToken(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length >= 16;
}

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateRequestBody(
  body: unknown,
):
  | { isValid: true; data: FactPackSubmitRequest }
  | { isValid: false; message: string } {
  if (!isPlainObject(body)) {
    return {
      isValid: false,
      message: "Request body must be a JSON object.",
    };
  }

  const candidate = body as Partial<FactPackSubmitRequest>;

  if (!isUuid(candidate.projectId)) {
    return {
      isValid: false,
      message: "projectId must be a valid UUID.",
    };
  }

  if (!isUuid(candidate.participantId)) {
    return {
      isValid: false,
      message: "participantId must be a valid UUID.",
    };
  }

  if (!isReasonableInviteToken(candidate.inviteToken)) {
    return {
      isValid: false,
      message: "inviteToken is invalid.",
    };
  }

  if (!isPlainObject(candidate.responseJson)) {
    return {
      isValid: false,
      message: "responseJson must be an object.",
    };
  }

  if (candidate.mode !== "draft" && candidate.mode !== "submit") {
    return {
      isValid: false,
      message: "mode must be draft or submit.",
    };
  }

  return {
    isValid: true,
    data: {
      projectId: candidate.projectId,
      participantId: candidate.participantId,
      inviteToken: candidate.inviteToken,
      responseJson: candidate.responseJson,
      mode: candidate.mode,
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateRequestBody(body);

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.message },
        { status: 400 },
      );
    }

    const { projectId, participantId, inviteToken, responseJson, mode } =
      validation.data;

    const supabase = getSupabaseAdminClient();

    const { data: participant, error: participantError } = await supabase
      .from("client_participants")
      .select(
        "participant_id, project_id, questionnaire_type, participant_status, completed_at, invite_token, started_at",
      )
      .eq("participant_id", participantId)
      .eq("project_id", projectId)
      .single<ParticipantLookupRow>();

    if (participantError || !participant) {
      return NextResponse.json(
        { success: false, error: "Participant record not found for this project." },
        { status: 404 },
      );
    }

    if (participant.questionnaire_type !== "client_fact_pack") {
      return NextResponse.json(
        { success: false, error: "Participant is not a client fact pack recipient." },
        { status: 400 },
      );
    }

    if (!participant.invite_token || participant.invite_token !== inviteToken) {
      return NextResponse.json(
        { success: false, error: "Invite token does not match this participant." },
        { status: 403 },
      );
    }

    if (
      mode === "submit" &&
      (participant.participant_status === "completed" ||
        participant.completed_at !== null)
    ) {
      return NextResponse.json(
        { success: false, error: "This fact pack has already been submitted." },
        { status: 409 },
      );
    }

    const nowIso = new Date().toISOString();
    const nextStatus = mode === "submit" ? "completed" : "in_progress";

    const { error: upsertFactPackError } = await supabase
      .from("client_fact_packs")
      .upsert(
        {
          project_id: projectId,
          participant_id: participantId,
          invite_token: inviteToken,
          response_json: responseJson,
          status: nextStatus,
          submitted_at: mode === "submit" ? nowIso : null,
          updated_at: nowIso,
        },
        {
          onConflict: "participant_id",
        },
      );

    if (upsertFactPackError) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to save fact pack.",
          details: upsertFactPackError.message,
        },
        { status: 500 },
      );
    }

    const participantUpdate: Record<string, string | null> = {
      updated_at: nowIso,
    };

    if (!participant.started_at) {
      participantUpdate.started_at = nowIso;
    }

    if (mode === "submit") {
      participantUpdate.participant_status = "completed";
      participantUpdate.completed_at = nowIso;
    }

    const { error: participantUpdateError } = await supabase
      .from("client_participants")
      .update(participantUpdate)
      .eq("participant_id", participantId)
      .eq("project_id", projectId);

    if (participantUpdateError) {
      return NextResponse.json(
        {
          success: false,
          error: "Fact pack was saved, but participant status could not be updated.",
          details: participantUpdateError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      mode,
      status: nextStatus,
      message:
        mode === "submit"
          ? "Client fact pack submitted successfully."
          : "Client fact pack draft saved successfully.",
    });
  } catch (error) {
    console.error("Client fact pack save failed.", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error while saving client fact pack.",
      },
      { status: 500 },
    );
  }
}
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


function isUuid(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value);
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get("projectId");
    const participantId = searchParams.get("participantId");
    const inviteToken = searchParams.get("inviteToken");

    if (!projectId || !participantId || !inviteToken) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters." },
        { status: 400 },
      );
    }

    if (!isUuid(projectId) || !isUuid(participantId) || !isUuid(inviteToken)) {
      return NextResponse.json(
        { success: false, error: "Invalid identifiers." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: participant, error: participantError } = await supabase
      .from("client_participants")
      .select("participant_id, project_id, invite_token, questionnaire_type")
      .eq("participant_id", participantId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (participantError || !participant) {
      return NextResponse.json(
        { success: false, error: "Participant not found." },
        { status: 404 },
      );
    }

    if (participant.questionnaire_type !== "client_fact_pack") {
      return NextResponse.json(
        { success: false, error: "Participant is not a client fact pack recipient." },
        { status: 400 },
      );
    }

    if (participant.invite_token !== inviteToken) {
      return NextResponse.json(
        { success: false, error: "Invalid access." },
        { status: 403 },
      );
    }

    const { data: factPack, error: factPackError } = await supabase
      .from("client_fact_packs")
      .select("response_json, status")
      .eq("project_id", projectId)
      .eq("participant_id", participantId)
      .maybeSingle();

    if (factPackError) {
      return NextResponse.json(
        { success: false, error: "Failed to load fact pack." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: factPack?.response_json ?? null,
      status: factPack?.status ?? "not_started",
    });
  } catch (error) {
    console.error("Failed to load fact pack draft.", error);

    return NextResponse.json(
      { success: false, error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
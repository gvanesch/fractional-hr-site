import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getVerifiedSessionCookieName,
  validateParticipantVerifiedSession,
} from "@/lib/security/client-participant-otp";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getD1ClientFactPack } from "@/lib/d1/client-diagnostic";
import { isD1ClientDiagnosticEnabled } from "@/lib/d1/database";

function isUuid(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value);
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

    const useD1 = isD1ClientDiagnosticEnabled();
    let d1FactPack: Awaited<ReturnType<typeof getD1ClientFactPack>> | null = null;
    let supabase: ReturnType<typeof createSupabaseAdminClient> | null = null;

    if (useD1) {
      d1FactPack = await getD1ClientFactPack({
        projectId,
        participantId,
        inviteToken,
      });

      if (!d1FactPack.found) {
        return NextResponse.json(
          { success: false, error: "Participant not found." },
          { status: 404 },
        );
      }

      if (d1FactPack.questionnaireType !== "client_fact_pack") {
        return NextResponse.json(
          { success: false, error: "Participant is not a client fact pack recipient." },
          { status: 400 },
        );
      }

      if (!d1FactPack.inviteTokenMatches) {
        return NextResponse.json(
          { success: false, error: "Invalid access." },
          { status: 403 },
        );
      }
    } else {
      supabase = createSupabaseAdminClient();
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
    }

    const cookieStore = await cookies();
    const verifiedSessionToken = cookieStore.get(
      getVerifiedSessionCookieName(),
    )?.value;

    if (!verifiedSessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Verified participant access is required.",
        },
        { status: 403 },
      );
    }

    const verifiedSession = await validateParticipantVerifiedSession({
      participantId,
      projectId,
      inviteToken,
      sessionToken: verifiedSessionToken,
    });

    if (!verifiedSession.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Verified participant access is required.",
        },
        { status: 403 },
      );
    }

    if (useD1 && d1FactPack?.found) {
      return NextResponse.json({
        success: true,
        data: d1FactPack.responseJson,
        status: d1FactPack.status,
      });
    }

    const { data: factPack, error: factPackError } = await supabase!
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

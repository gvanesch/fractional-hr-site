import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getVerifiedSessionCookieMaxAgeSeconds,
  getVerifiedSessionCookieName,
  verifyParticipantOtp,
} from "@/lib/security/client-participant-otp";

type OtpVerifyBody = {
  inviteToken?: string;
  challengeId?: string;
  otpCode?: string;
};

type ParticipantRow = {
  participant_id: string;
  project_id: string;
  invite_token: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as OtpVerifyBody;

    const inviteToken = body.inviteToken?.trim() ?? "";
    const challengeId = body.challengeId?.trim() ?? "";
    const otpCode = body.otpCode?.trim() ?? "";

    if (
      !isUuid(inviteToken) ||
      !isUuid(challengeId) ||
      !/^\d{6}$/.test(otpCode)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "The verification code could not be validated.",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("client_participants")
      .select("participant_id, project_id, invite_token")
      .eq("invite_token", inviteToken)
      .maybeSingle();

    if (error) {
      console.error("Participant OTP verification lookup failed", {
        error: error.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: "The verification code could not be validated.",
        },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "The verification code could not be validated.",
        },
        { status: 400 },
      );
    }

    const participant = data as ParticipantRow;

    const verifyResult = await verifyParticipantOtp({
      challengeId,
      participantId: participant.participant_id,
      projectId: participant.project_id,
      inviteToken: participant.invite_token,
      otpCode,
    });

    if (!verifyResult.success) {
      if (verifyResult.reason === "invalid_code") {
        return NextResponse.json(
          {
            success: false,
            error: "The verification code is incorrect.",
            attemptsRemaining: verifyResult.attemptsRemaining,
          },
          { status: 400 },
        );
      }

      if (verifyResult.reason === "too_many_attempts") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Too many incorrect attempts. Please request a new verification code.",
            attemptsRemaining: 0,
          },
          { status: 429 },
        );
      }

      if (verifyResult.reason === "challenge_expired") {
        return NextResponse.json(
          {
            success: false,
            error:
              "This verification code has expired. Please request a new code.",
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error:
            "This verification code is no longer valid. Please request a new code.",
        },
        { status: 400 },
      );
    }

    const response = NextResponse.json({
      success: true,
      expiresAt: verifyResult.expiresAt,
    });

    const isHttps = new URL(request.url).protocol === "https:";

    response.cookies.set({
      name: getVerifiedSessionCookieName(),
      value: verifyResult.sessionToken,
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: getVerifiedSessionCookieMaxAgeSeconds(),
    });

    console.info("Participant email verification completed", {
      participantId: participant.participant_id,
      projectId: participant.project_id,
      sessionId: verifyResult.sessionId,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown OTP verification error.";

    console.error("Participant OTP verification failed", {
      error: message,
    });

    return NextResponse.json(
      {
        success: false,
        error: "The verification code could not be validated.",
      },
      { status: 500 },
    );
  }
}

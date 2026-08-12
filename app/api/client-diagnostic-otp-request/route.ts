import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { issueParticipantOtp } from "@/lib/security/client-participant-otp";
import { sendParticipantOtpEmail } from "@/lib/client-diagnostic/participant-email";

type OtpRequestBody = {
  inviteToken?: string;
};

type ParticipantRow = {
  participant_id: string;
  project_id: string;
  invite_token: string;
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

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as OtpRequestBody;
    const inviteToken = body.inviteToken?.trim();

    if (!inviteToken || !isUuid(inviteToken)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to issue verification code.",
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
      console.error("Participant OTP lookup failed", {
        error: error.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Unable to issue verification code.",
        },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to issue verification code.",
        },
        { status: 400 },
      );
    }

    const participant = data as ParticipantRow;

    const issueResult = await issueParticipantOtp({
      participantId: participant.participant_id,
      projectId: participant.project_id,
      inviteToken: participant.invite_token,
    });

    if (!issueResult.success) {
      if (issueResult.reason === "resend_too_soon") {
        return NextResponse.json(
          {
            success: false,
            error: "Please wait before requesting another code.",
            retryAfterSeconds: issueResult.retryAfterSeconds ?? 60,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(
                issueResult.retryAfterSeconds ?? 60,
              ),
            },
          },
        );
      }

      if (issueResult.reason === "hourly_send_limit") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Too many verification codes have been requested. Please try again later.",
            retryAfterSeconds: issueResult.retryAfterSeconds ?? 3600,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(
                issueResult.retryAfterSeconds ?? 3600,
              ),
            },
          },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Unable to issue verification code.",
        },
        { status: 400 },
      );
    }

    const resend = new Resend(getEnv("RESEND_API_KEY"));

    const emailResult = await sendParticipantOtpEmail({
      resend,
      fromEmail: getEnv("CONTACT_FROM_EMAIL"),
      replyToEmail: getEnv("CONTACT_TO_EMAIL"),
      participantName: issueResult.name,
      participantEmail: issueResult.email,
      otpCode: issueResult.otpCode,
      expiresInMinutes: 10,
    });

    if (!emailResult.success) {
      console.error("Participant OTP email could not be sent", {
        challengeId: issueResult.challengeId,
        error: emailResult.error,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Unable to send verification code.",
        },
        { status: 502 },
      );
    }

    console.info("Participant OTP challenge issued", {
      challengeId: issueResult.challengeId,
      participantId: participant.participant_id,
      projectId: participant.project_id,
    });

    return NextResponse.json({
      success: true,
      challengeId: issueResult.challengeId,
      expiresAt: issueResult.expiresAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown OTP request error.";

    console.error("Participant OTP request failed", {
      error: message,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Unable to issue verification code.",
      },
      { status: 500 },
    );
  }
}

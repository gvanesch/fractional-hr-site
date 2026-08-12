import { randomInt, randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const OTP_EXPIRY_MINUTES = 10;
const VERIFIED_SESSION_HOURS = 12;
const VERIFIED_SESSION_COOKIE_NAME = "client_diagnostic_verified_session";

type IssueOtpResult =
  | {
      success: true;
      challengeId: string;
      email: string;
      name: string;
      otpCode: string;
      expiresAt: string;
    }
  | {
      success: false;
      reason: string;
      retryAfterSeconds?: number;
    };

type VerifyOtpResult =
  | {
      success: true;
      sessionToken: string;
      sessionId: string;
      expiresAt: string;
    }
  | {
      success: false;
      reason: string;
      attemptsRemaining?: number;
    };

type ValidateSessionResult =
  | {
      valid: true;
      sessionId: string;
      expiresAt: string;
    }
  | {
      valid: false;
      reason: string;
    };

function getOtpHashSecret(): string {
  const secret = process.env.CLIENT_DIAGNOSTIC_OTP_SECRET?.trim();

  if (!secret) {
    throw new Error("CLIENT_DIAGNOSTIC_OTP_SECRET is not configured.");
  }

  return secret;
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashOtp(params: {
  challengeContext: string;
  otpCode: string;
}): Promise<string> {
  const { challengeContext, otpCode } = params;

  return sha256Hex(
    `${getOtpHashSecret()}:otp:${challengeContext}:${otpCode}`,
  );
}

async function hashSessionToken(sessionToken: string): Promise<string> {
  return sha256Hex(
    `${getOtpHashSecret()}:session:${sessionToken}`,
  );
}

function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function generateSessionToken(): string {
  return `${randomUUID()}${randomUUID().replaceAll("-", "")}`;
}

export function getVerifiedSessionCookieName(): string {
  return VERIFIED_SESSION_COOKIE_NAME;
}

export function getVerifiedSessionCookieMaxAgeSeconds(): number {
  return VERIFIED_SESSION_HOURS * 60 * 60;
}

export async function issueParticipantOtp(params: {
  participantId: string;
  projectId: string;
  inviteToken: string;
}): Promise<IssueOtpResult> {
  const { participantId, projectId, inviteToken } = params;

  const supabase = createSupabaseAdminClient();

  const otpCode = generateOtpCode();
  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
  ).toISOString();

  const challengeContext = `${participantId}:${projectId}:${inviteToken}:${expiresAt}`;

  const otpHash = await hashOtp({
    challengeContext,
    otpCode,
  });

  const { data, error } = await supabase.rpc(
    "issue_client_participant_otp_challenge",
    {
      p_participant_id: participantId,
      p_project_id: projectId,
      p_invite_token: inviteToken,
      p_otp_hash: otpHash,
      p_expires_at: expiresAt,
    },
  );

  if (error) {
    console.error("Failed to issue participant OTP challenge", {
      error: error.message,
    });

    throw new Error("Unable to issue participant verification challenge.");
  }

  const result = data as
    | {
        success?: boolean;
        reason?: string;
        retryAfterSeconds?: number;
        challengeId?: string;
        email?: string;
        name?: string;
        expiresAt?: string;
      }
    | null;

  if (!result?.success) {
    return {
      success: false,
      reason: result?.reason ?? "challenge_not_issued",
      retryAfterSeconds: result?.retryAfterSeconds,
    };
  }

  if (
    !result.challengeId ||
    !result.email ||
    !result.expiresAt
  ) {
    throw new Error("OTP challenge response was incomplete.");
  }

  /*
   * Re-hash using the actual challenge ID so verification can reproduce
   * the same value without ever storing the plaintext OTP.
   */
  const finalOtpHash = await hashOtp({
    challengeContext: result.challengeId,
    otpCode,
  });

  const { error: updateError } = await supabase
    .from("client_participant_otp_challenges")
    .update({
      otp_hash: finalOtpHash,
      updated_at: new Date().toISOString(),
    })
    .eq("challenge_id", result.challengeId);

  if (updateError) {
    console.error("Failed to finalise participant OTP hash", {
      error: updateError.message,
    });

    throw new Error("Unable to finalise participant verification challenge.");
  }

  return {
    success: true,
    challengeId: result.challengeId,
    email: result.email,
    name: result.name ?? "",
    otpCode,
    expiresAt: result.expiresAt,
  };
}

export async function verifyParticipantOtp(params: {
  challengeId: string;
  participantId: string;
  projectId: string;
  inviteToken: string;
  otpCode: string;
}): Promise<VerifyOtpResult> {
  const {
    challengeId,
    participantId,
    projectId,
    inviteToken,
    otpCode,
  } = params;

  const supabase = createSupabaseAdminClient();

  const otpHash = await hashOtp({
    challengeContext: challengeId,
    otpCode,
  });

  const sessionToken = generateSessionToken();
  const sessionTokenHash = await hashSessionToken(sessionToken);

  const sessionExpiresAt = new Date(
    Date.now() + VERIFIED_SESSION_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase.rpc(
    "verify_client_participant_otp_challenge",
    {
      p_challenge_id: challengeId,
      p_participant_id: participantId,
      p_project_id: projectId,
      p_invite_token: inviteToken,
      p_otp_hash: otpHash,
      p_session_token_hash: sessionTokenHash,
      p_session_expires_at: sessionExpiresAt,
    },
  );

  if (error) {
    console.error("Failed to verify participant OTP challenge", {
      error: error.message,
    });

    throw new Error("Unable to verify participant code.");
  }

  const result = data as
    | {
        success?: boolean;
        reason?: string;
        attemptsRemaining?: number;
        sessionId?: string;
        expiresAt?: string;
      }
    | null;

  if (!result?.success) {
    return {
      success: false,
      reason: result?.reason ?? "verification_failed",
      attemptsRemaining: result?.attemptsRemaining,
    };
  }

  if (!result.sessionId || !result.expiresAt) {
    throw new Error("Verified session response was incomplete.");
  }

  return {
    success: true,
    sessionToken,
    sessionId: result.sessionId,
    expiresAt: result.expiresAt,
  };
}

export async function validateParticipantVerifiedSession(params: {
  participantId: string;
  projectId: string;
  inviteToken: string;
  sessionToken: string;
}): Promise<ValidateSessionResult> {
  const {
    participantId,
    projectId,
    inviteToken,
    sessionToken,
  } = params;

  const supabase = createSupabaseAdminClient();
  const sessionTokenHash = await hashSessionToken(sessionToken);

  const { data, error } = await supabase.rpc(
    "validate_client_participant_verified_session",
    {
      p_participant_id: participantId,
      p_project_id: projectId,
      p_invite_token: inviteToken,
      p_session_token_hash: sessionTokenHash,
    },
  );

  if (error) {
    console.error("Failed to validate participant verified session", {
      error: error.message,
    });

    return {
      valid: false,
      reason: "session_validation_failed",
    };
  }

  const result = data as
    | {
        valid?: boolean;
        reason?: string;
        sessionId?: string;
        expiresAt?: string;
      }
    | null;

  if (!result?.valid) {
    return {
      valid: false,
      reason: result?.reason ?? "invalid_session",
    };
  }

  if (!result.sessionId || !result.expiresAt) {
    return {
      valid: false,
      reason: "invalid_session_response",
    };
  }

  return {
    valid: true,
    sessionId: result.sessionId,
    expiresAt: result.expiresAt,
  };
}

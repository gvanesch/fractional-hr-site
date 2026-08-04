import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type InviteRateLimitRpcResult = {
  blocked: boolean;
  retryAfterSeconds: number;
};

export type ClientDiagnosticInviteRateLimitResult = {
  blocked: boolean;
  retryAfterSeconds: number;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getClientIp(requestHeaders: Headers): string {
  const cloudflareIp = requestHeaders.get("cf-connecting-ip")?.trim();

  if (cloudflareIp) {
    return cloudflareIp;
  }

  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor
    ?.split(",")
    .map((value) => value.trim())
    .find(Boolean);

  if (firstForwardedIp) {
    return firstForwardedIp;
  }

  const realIp = requestHeaders.get("x-real-ip")?.trim();

  if (realIp) {
    return realIp;
  }

  /*
   * Use one shared fallback bucket when no client IP is available.
   * This is safer than silently bypassing throttling.
   */
  return "unknown-client-ip";
}

async function hashClientIp(clientIp: string): Promise<string> {
  const salt = getRequiredEnv("INVITE_RATE_LIMIT_SALT");
  const input = new TextEncoder().encode(`${salt}:${clientIp}`);
  const digest = await crypto.subtle.digest("SHA-256", input);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function parseRpcResult(value: unknown): InviteRateLimitRpcResult {
  if (!value || typeof value !== "object") {
    throw new Error("Invite rate-limit RPC returned an invalid response.");
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.blocked !== "boolean" ||
    typeof candidate.retryAfterSeconds !== "number" ||
    !Number.isFinite(candidate.retryAfterSeconds)
  ) {
    throw new Error("Invite rate-limit RPC returned an invalid response.");
  }

  return {
    blocked: candidate.blocked,
    retryAfterSeconds: Math.max(
      0,
      Math.ceil(candidate.retryAfterSeconds),
    ),
  };
}

export async function checkClientDiagnosticInviteRateLimit(params: {
  requestHeaders: Headers;
  inviteToken: string;
}): Promise<ClientDiagnosticInviteRateLimitResult> {
  const { requestHeaders, inviteToken } = params;

  const clientIp = getClientIp(requestHeaders);
  const ipHash = await hashClientIp(clientIp);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc(
    "check_client_diagnostic_invite_rate_limit",
    {
      p_ip_hash: ipHash,
      p_invite_token: inviteToken,
    },
  );

  if (error) {
    throw new Error(
      `Unable to check client diagnostic invite rate limit: ${error.message}`,
    );
  }

  return parseRpcResult(data);
}

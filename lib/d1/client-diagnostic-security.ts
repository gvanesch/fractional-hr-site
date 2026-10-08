import { getD1Database } from "./database";

const INVITE_WINDOW_MS = 5 * 60 * 1000;
const INVITE_BLOCK_MS = 5 * 60 * 1000;
const INVITE_MAX_ATTEMPTS = 10;
const OTP_RESEND_MS = 60 * 1000;
const OTP_HOURLY_LIMIT = 5;

type ActiveInvitation = {
  email: string | null;
  name: string | null;
};

type ChallengeRow = {
  consumed_at: string | null;
  invalidated_at: string | null;
  expires_at: string;
  failed_attempts: number;
  max_attempts: number;
};

type SessionRow = {
  session_id: string;
  expires_at: string;
  revoked_at: string | null;
};

function activeInvitationSql(): string {
  return `SELECT participant.email, participant.name
    FROM client_participants participant
    JOIN client_projects project
      ON project.project_id = participant.project_id
    WHERE participant.participant_id = ?
      AND participant.project_id = ?
      AND participant.invite_token = ?
      AND project.project_status = 'active'
      AND participant.invite_revoked_at IS NULL
      AND (
        participant.invite_expires_at IS NULL
        OR participant.invite_expires_at >= ?
      )
      AND participant.completed_at IS NULL
      AND participant.participant_status IN ('invited', 'started')`;
}

export async function checkD1ClientDiagnosticInviteRateLimit(params: {
  ipHash: string;
  inviteToken: string;
  now?: Date;
}): Promise<{ blocked: boolean; retryAfterSeconds: number }> {
  const now = params.now ?? new Date();
  const nowIso = now.toISOString();
  const windowCutoff = new Date(now.getTime() - INVITE_WINDOW_MS).toISOString();
  const blockedUntil = new Date(now.getTime() + INVITE_BLOCK_MS).toISOString();
  const db = getD1Database();
  const result = await db
    .prepare(
      `INSERT INTO client_diagnostic_invite_rate_limits (
        ip_hash,
        window_started_at,
        failed_attempts,
        blocked_until,
        updated_at
      )
      SELECT ?, ?, 1, NULL, ?
      WHERE
        NOT EXISTS (
          SELECT 1
          FROM client_participants participant
          JOIN client_projects project
            ON project.project_id = participant.project_id
          WHERE participant.invite_token = ?
            AND project.project_status = 'active'
            AND participant.invite_revoked_at IS NULL
            AND (
              participant.invite_expires_at IS NULL
              OR participant.invite_expires_at >= ?
            )
            AND participant.completed_at IS NULL
            AND participant.participant_status IN ('invited', 'started')
        )
        OR EXISTS (
          SELECT 1
          FROM client_diagnostic_invite_rate_limits
          WHERE ip_hash = ?
            AND blocked_until > ?
        )
      ON CONFLICT(ip_hash) DO UPDATE SET
        window_started_at = CASE
          WHEN client_diagnostic_invite_rate_limits.blocked_until > ?
            THEN client_diagnostic_invite_rate_limits.window_started_at
          WHEN client_diagnostic_invite_rate_limits.window_started_at <= ?
            THEN excluded.window_started_at
          ELSE client_diagnostic_invite_rate_limits.window_started_at
        END,
        failed_attempts = CASE
          WHEN client_diagnostic_invite_rate_limits.blocked_until > ?
            THEN client_diagnostic_invite_rate_limits.failed_attempts
          WHEN client_diagnostic_invite_rate_limits.window_started_at <= ?
            THEN 1
          ELSE client_diagnostic_invite_rate_limits.failed_attempts + 1
        END,
        blocked_until = CASE
          WHEN client_diagnostic_invite_rate_limits.blocked_until > ?
            THEN client_diagnostic_invite_rate_limits.blocked_until
          WHEN (
            CASE
              WHEN client_diagnostic_invite_rate_limits.window_started_at <= ?
                THEN 1
              ELSE client_diagnostic_invite_rate_limits.failed_attempts + 1
            END
          ) >= ? THEN ?
          ELSE NULL
        END,
        updated_at = CASE
          WHEN client_diagnostic_invite_rate_limits.blocked_until > ?
            THEN client_diagnostic_invite_rate_limits.updated_at
          ELSE excluded.updated_at
        END
      RETURNING blocked_until`,
    )
    .bind(
      params.ipHash,
      nowIso,
      nowIso,
      params.inviteToken.trim(),
      nowIso,
      params.ipHash,
      nowIso,
      nowIso,
      windowCutoff,
      nowIso,
      windowCutoff,
      nowIso,
      windowCutoff,
      INVITE_MAX_ATTEMPTS,
      blockedUntil,
      nowIso,
    )
    .run<{ blocked_until: string | null }>();

  if (!result.success) {
    throw new Error("D1 invite rate-limit update failed.");
  }

  const currentBlockedUntil = result.results[0]?.blocked_until ?? null;
  if (!currentBlockedUntil || currentBlockedUntil <= nowIso) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  return {
    blocked: true,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil(
        (new Date(currentBlockedUntil).getTime() - now.getTime()) / 1000,
      ),
    ),
  };
}

export async function issueD1ParticipantOtpChallenge(params: {
  challengeId: string;
  participantId: string;
  projectId: string;
  inviteToken: string;
  otpHash: string;
  expiresAt: string;
  now?: Date;
}): Promise<
  | {
      success: true;
      challengeId: string;
      email: string;
      name: string;
      expiresAt: string;
    }
  | { success: false; reason: string; retryAfterSeconds?: number }
> {
  const now = params.now ?? new Date();
  const nowIso = now.toISOString();
  const resendCutoff = new Date(now.getTime() - OTP_RESEND_MS).toISOString();
  const hourlyCutoff = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const db = getD1Database();
  const statements = [
    db
      .prepare(
        `INSERT INTO client_participant_otp_challenges (
          challenge_id,
          participant_id,
          project_id,
          invite_token,
          otp_hash,
          expires_at,
          failed_attempts,
          max_attempts,
          send_count,
          last_sent_at,
          created_at,
          updated_at
        )
        SELECT ?, ?, ?, ?, ?, ?, 0, 5, 1, ?, ?, ?
        WHERE EXISTS (${activeInvitationSql()})
          AND EXISTS (
            SELECT 1
            FROM client_participants
            WHERE participant_id = ?
              AND email IS NOT NULL
              AND length(trim(email)) > 0
          )
          AND NOT EXISTS (
            SELECT 1
            FROM client_participant_otp_challenges
            WHERE participant_id = ?
              AND created_at > ?
          )
          AND (
            SELECT count(*)
            FROM client_participant_otp_challenges
            WHERE participant_id = ?
              AND created_at > ?
          ) < ?`,
      )
      .bind(
        params.challengeId,
        params.participantId,
        params.projectId,
        params.inviteToken,
        params.otpHash,
        params.expiresAt,
        nowIso,
        nowIso,
        nowIso,
        params.participantId,
        params.projectId,
        params.inviteToken,
        nowIso,
        params.participantId,
        params.participantId,
        resendCutoff,
        params.participantId,
        hourlyCutoff,
        OTP_HOURLY_LIMIT,
      ),
    db
      .prepare(
        `UPDATE client_participant_otp_challenges
        SET invalidated_at = ?, updated_at = ?
        WHERE participant_id = ?
          AND challenge_id <> ?
          AND consumed_at IS NULL
          AND invalidated_at IS NULL
          AND expires_at > ?
          AND EXISTS (
            SELECT 1
            FROM client_participant_otp_challenges
            WHERE challenge_id = ?
          )`,
      )
      .bind(
        nowIso,
        nowIso,
        params.participantId,
        params.challengeId,
        nowIso,
        params.challengeId,
      ),
  ];
  const results = await db.batch(statements);

  if (results.length !== statements.length || results.some((result) => !result.success)) {
    throw new Error("D1 OTP challenge issuance failed.");
  }

  if (results[0].meta.changes === 1) {
    const invitation = await db
      .prepare(activeInvitationSql())
      .bind(
        params.participantId,
        params.projectId,
        params.inviteToken,
        nowIso,
      )
      .first<ActiveInvitation>();

    if (!invitation?.email) {
      throw new Error("D1 OTP challenge invitation lookup failed.");
    }

    return {
      success: true,
      challengeId: params.challengeId,
      email: invitation.email.trim().toLowerCase(),
      name: invitation.name ?? "",
      expiresAt: params.expiresAt,
    };
  }

  const invitation = await db
    .prepare(activeInvitationSql())
    .bind(
      params.participantId,
      params.projectId,
      params.inviteToken,
      nowIso,
    )
    .first<ActiveInvitation>();

  if (!invitation) {
    return { success: false, reason: "invalid_invitation" };
  }
  if (!invitation.email?.trim()) {
    return { success: false, reason: "missing_email" };
  }

  const latest = await db
    .prepare(
      `SELECT created_at
      FROM client_participant_otp_challenges
      WHERE participant_id = ?
      ORDER BY created_at DESC
      LIMIT 1`,
    )
    .bind(params.participantId)
    .first<{ created_at: string }>();

  if (latest && latest.created_at > resendCutoff) {
    return {
      success: false,
      reason: "resend_too_soon",
      retryAfterSeconds: Math.max(
        1,
        Math.ceil(
          (new Date(latest.created_at).getTime() + OTP_RESEND_MS - now.getTime()) /
            1000,
        ),
      ),
    };
  }

  return {
    success: false,
    reason: "hourly_send_limit",
    retryAfterSeconds: 3600,
  };
}

export async function verifyD1ParticipantOtpChallenge(params: {
  challengeId: string;
  participantId: string;
  projectId: string;
  inviteToken: string;
  otpHash: string;
  sessionId: string;
  sessionTokenHash: string;
  sessionExpiresAt: string;
  now?: Date;
}): Promise<
  | { success: true; sessionId: string; expiresAt: string }
  | { success: false; reason: string; attemptsRemaining?: number }
> {
  const nowIso = (params.now ?? new Date()).toISOString();
  const db = getD1Database();
  const identityWhere = `challenge_id = ?
    AND participant_id = ?
    AND project_id = ?
    AND invite_token = ?`;
  const invitationExists = `EXISTS (${activeInvitationSql()})`;
  const identityBindings = [
    params.challengeId,
    params.participantId,
    params.projectId,
    params.inviteToken,
  ];
  const invitationBindings = [
    params.participantId,
    params.projectId,
    params.inviteToken,
    nowIso,
  ];
  const statements = [
    db
      .prepare(
        `UPDATE client_participant_otp_challenges
        SET invalidated_at = ?, updated_at = ?
        WHERE ${identityWhere}
          AND consumed_at IS NULL
          AND invalidated_at IS NULL
          AND expires_at > ?
          AND failed_attempts < max_attempts
          AND NOT ${invitationExists}`,
      )
      .bind(
        nowIso,
        nowIso,
        ...identityBindings,
        nowIso,
        ...invitationBindings,
      ),
    db
      .prepare(
        `UPDATE client_participant_otp_challenges
        SET
          failed_attempts = failed_attempts + 1,
          invalidated_at = CASE
            WHEN failed_attempts + 1 >= max_attempts THEN ?
            ELSE invalidated_at
          END,
          updated_at = ?
        WHERE ${identityWhere}
          AND consumed_at IS NULL
          AND invalidated_at IS NULL
          AND expires_at > ?
          AND failed_attempts < max_attempts
          AND otp_hash <> ?
          AND ${invitationExists}`,
      )
      .bind(
        nowIso,
        nowIso,
        ...identityBindings,
        nowIso,
        params.otpHash,
        ...invitationBindings,
      ),
    db
      .prepare(
        `UPDATE client_participant_otp_challenges
        SET consumed_at = ?, updated_at = ?
        WHERE ${identityWhere}
          AND consumed_at IS NULL
          AND invalidated_at IS NULL
          AND expires_at > ?
          AND failed_attempts < max_attempts
          AND otp_hash = ?
          AND ${invitationExists}`,
      )
      .bind(
        nowIso,
        nowIso,
        ...identityBindings,
        nowIso,
        params.otpHash,
        ...invitationBindings,
      ),
    db
      .prepare(
        `UPDATE client_participant_verified_sessions
        SET revoked_at = ?
        WHERE participant_id = ?
          AND project_id = ?
          AND invite_token = ?
          AND revoked_at IS NULL
          AND expires_at > ?
          AND EXISTS (
            SELECT 1
            FROM client_participant_otp_challenges
            WHERE ${identityWhere}
              AND consumed_at = ?
              AND otp_hash = ?
          )`,
      )
      .bind(
        nowIso,
        params.participantId,
        params.projectId,
        params.inviteToken,
        nowIso,
        ...identityBindings,
        nowIso,
        params.otpHash,
      ),
    db
      .prepare(
        `INSERT INTO client_participant_verified_sessions (
          session_id,
          participant_id,
          project_id,
          invite_token,
          session_token_hash,
          verification_method,
          verified_at,
          expires_at,
          last_used_at,
          revoked_at,
          created_at
        )
        SELECT ?, ?, ?, ?, ?, 'email_otp', ?, ?, ?, NULL, ?
        WHERE EXISTS (
          SELECT 1
          FROM client_participant_otp_challenges
          WHERE ${identityWhere}
            AND consumed_at = ?
            AND otp_hash = ?
        )`,
      )
      .bind(
        params.sessionId,
        params.participantId,
        params.projectId,
        params.inviteToken,
        params.sessionTokenHash,
        nowIso,
        params.sessionExpiresAt,
        nowIso,
        nowIso,
        ...identityBindings,
        nowIso,
        params.otpHash,
      ),
  ];
  const results = await db.batch(statements);

  if (results.length !== statements.length || results.some((result) => !result.success)) {
    throw new Error("D1 OTP challenge verification failed.");
  }

  if (results[4].meta.changes === 1) {
    return {
      success: true,
      sessionId: params.sessionId,
      expiresAt: params.sessionExpiresAt,
    };
  }
  if (results[0].meta.changes === 1) {
    return { success: false, reason: "invalid_invitation" };
  }
  if (results[1].meta.changes === 1) {
    const challenge = await db
      .prepare(
        `SELECT failed_attempts, max_attempts
        FROM client_participant_otp_challenges
        WHERE ${identityWhere}`,
      )
      .bind(...identityBindings)
      .first<{ failed_attempts: number; max_attempts: number }>();
    const attemptsRemaining = Math.max(
      0,
      (challenge?.max_attempts ?? 0) - (challenge?.failed_attempts ?? 0),
    );

    return {
      success: false,
      reason: attemptsRemaining === 0 ? "too_many_attempts" : "invalid_code",
      attemptsRemaining,
    };
  }

  const challenge = await db
    .prepare(
      `SELECT consumed_at, invalidated_at, expires_at, failed_attempts, max_attempts
      FROM client_participant_otp_challenges
      WHERE ${identityWhere}`,
    )
    .bind(...identityBindings)
    .first<ChallengeRow>();

  if (!challenge) return { success: false, reason: "invalid_challenge" };
  if (challenge.consumed_at) return { success: false, reason: "challenge_already_used" };
  if (challenge.invalidated_at) return { success: false, reason: "challenge_invalidated" };
  if (challenge.expires_at <= nowIso) return { success: false, reason: "challenge_expired" };
  if (challenge.failed_attempts >= challenge.max_attempts) {
    return { success: false, reason: "too_many_attempts" };
  }

  throw new Error("D1 OTP verification reached an inconsistent state.");
}

export async function validateD1ParticipantVerifiedSession(params: {
  participantId: string;
  projectId: string;
  inviteToken: string;
  sessionTokenHash: string;
  now?: Date;
}): Promise<
  | { valid: true; sessionId: string; expiresAt: string }
  | { valid: false; reason: string }
> {
  const nowIso = (params.now ?? new Date()).toISOString();
  const db = getD1Database();
  const sessionWhere = `participant_id = ?
    AND project_id = ?
    AND invite_token = ?
    AND session_token_hash = ?`;
  const sessionBindings = [
    params.participantId,
    params.projectId,
    params.inviteToken,
    params.sessionTokenHash,
  ];
  const invitationBindings = [
    params.participantId,
    params.projectId,
    params.inviteToken,
    nowIso,
  ];
  const statements = [
    db
      .prepare(
        `UPDATE client_participant_verified_sessions
        SET revoked_at = ?
        WHERE ${sessionWhere}
          AND revoked_at IS NULL
          AND expires_at > ?
          AND NOT EXISTS (${activeInvitationSql()})`,
      )
      .bind(
        nowIso,
        ...sessionBindings,
        nowIso,
        ...invitationBindings,
      ),
    db
      .prepare(
        `UPDATE client_participant_verified_sessions
        SET last_used_at = ?
        WHERE ${sessionWhere}
          AND revoked_at IS NULL
          AND expires_at > ?
          AND EXISTS (${activeInvitationSql()})`,
      )
      .bind(
        nowIso,
        ...sessionBindings,
        nowIso,
        ...invitationBindings,
      ),
  ];
  const results = await db.batch(statements);

  if (results.length !== statements.length || results.some((result) => !result.success)) {
    return { valid: false, reason: "session_validation_failed" };
  }

  if (results[1].meta.changes === 1) {
    const session = await db
      .prepare(
        `SELECT session_id, expires_at, revoked_at
        FROM client_participant_verified_sessions
        WHERE ${sessionWhere}`,
      )
      .bind(...sessionBindings)
      .first<SessionRow>();

    if (session) {
      return {
        valid: true,
        sessionId: session.session_id,
        expiresAt: session.expires_at,
      };
    }
  }

  if (results[0].meta.changes === 1) {
    return { valid: false, reason: "invalid_invitation" };
  }

  const session = await db
    .prepare(
      `SELECT session_id, expires_at, revoked_at
      FROM client_participant_verified_sessions
      WHERE ${sessionWhere}`,
    )
    .bind(...sessionBindings)
    .first<SessionRow>();

  if (!session) return { valid: false, reason: "session_not_found" };
  if (session.revoked_at) return { valid: false, reason: "session_revoked" };
  if (session.expires_at <= nowIso) return { valid: false, reason: "session_expired" };

  return { valid: false, reason: "invalid_invitation" };
}

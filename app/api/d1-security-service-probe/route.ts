import { NextResponse } from "next/server";
import {
  checkD1ClientDiagnosticInviteRateLimit,
  issueD1ParticipantOtpChallenge,
  validateD1ParticipantVerifiedSession,
  verifyD1ParticipantOtpChallenge,
} from "@/lib/d1/client-diagnostic-security";
import { getD1Database } from "@/lib/d1/database";

function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;

  return (
    hostname === "127.0.0.1" ||
    hostname === "localhost" ||
    hostname === "::1"
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function POST(request: Request) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const db = getD1Database();
  const probeId = crypto.randomUUID();
  const projectId = `d1-security-runtime-project-${probeId}`;
  const participantId = `d1-security-runtime-participant-${probeId}`;
  const inviteToken = `d1-security-runtime-invite-${probeId}`;
  const validIpHash = `valid-${probeId}`.padEnd(64, "0");
  const invalidIpHash = `invalid-${probeId}`.padEnd(64, "0");
  const startedAt = new Date();
  const isoAfter = (milliseconds: number) =>
    new Date(startedAt.getTime() + milliseconds).toISOString();

  try {
    const seedResults = await db.batch([
      db
        .prepare(
          `INSERT INTO client_projects (
            project_id,
            company_name,
            primary_contact_name,
            primary_contact_email,
            project_status
          ) VALUES (?, ?, ?, ?, 'active')`,
        )
        .bind(
          projectId,
          "D1 Security Runtime Probe Ltd",
          "Probe Contact",
          "probe@example.invalid",
        ),
      db
        .prepare(
          `INSERT INTO client_participants (
            participant_id,
            project_id,
            questionnaire_type,
            role_label,
            invite_token,
            participant_status,
            name,
            email,
            invite_expires_at
          ) VALUES (?, ?, 'hr', ?, ?, 'invited', ?, ?, ?)`,
        )
        .bind(
          participantId,
          projectId,
          "HR lead",
          inviteToken,
          "Probe Participant",
          "participant@example.invalid",
          isoAfter(24 * 60 * 60 * 1000),
        ),
    ]);

    assert(
      seedResults.length === 2 &&
        seedResults.every(
          (result) => result.success && result.meta.changes === 1,
        ),
      "D1 security runtime seed failed.",
    );

    const validInvite = await checkD1ClientDiagnosticInviteRateLimit({
      ipHash: validIpHash,
      inviteToken,
      now: startedAt,
    });
    assert(
      !validInvite.blocked && validInvite.retryAfterSeconds === 0,
      "A valid invitation was incorrectly rate limited.",
    );

    let invalidAttempt = { blocked: false, retryAfterSeconds: 0 };
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      invalidAttempt = await checkD1ClientDiagnosticInviteRateLimit({
        ipHash: invalidIpHash,
        inviteToken: `invalid-${probeId}`,
        now: new Date(startedAt.getTime() + attempt * 100),
      });

      if (attempt < 10) {
        assert(
          !invalidAttempt.blocked,
          `Invalid invite attempt ${attempt} blocked too early.`,
        );
      }
    }
    assert(
      invalidAttempt.blocked && invalidAttempt.retryAfterSeconds > 0,
      "The tenth invalid invitation attempt did not block.",
    );

    const challengeOneId = crypto.randomUUID();
    const challengeOne = await issueD1ParticipantOtpChallenge({
      challengeId: challengeOneId,
      participantId,
      projectId,
      inviteToken,
      otpHash: `otp-one-${probeId}`,
      expiresAt: isoAfter(10 * 60 * 1000),
      now: startedAt,
    });
    assert(
      challengeOne.success &&
        challengeOne.email === "participant@example.invalid",
      "The first OTP challenge was not issued.",
    );

    const resend = await issueD1ParticipantOtpChallenge({
      challengeId: crypto.randomUUID(),
      participantId,
      projectId,
      inviteToken,
      otpHash: `otp-resend-${probeId}`,
      expiresAt: isoAfter(10 * 60 * 1000 + 30_000),
      now: new Date(startedAt.getTime() + 30_000),
    });
    assert(
      !resend.success &&
        resend.reason === "resend_too_soon" &&
        (resend.retryAfterSeconds ?? 0) > 0,
      "The OTP resend delay was not enforced.",
    );

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const invalidCode = await verifyD1ParticipantOtpChallenge({
        challengeId: challengeOneId,
        participantId,
        projectId,
        inviteToken,
        otpHash: `wrong-${probeId}`,
        sessionId: crypto.randomUUID(),
        sessionTokenHash: `unused-session-${probeId}-${attempt}`,
        sessionExpiresAt: isoAfter(12 * 60 * 60 * 1000),
        now: new Date(startedAt.getTime() + 31_000 + attempt * 100),
      });

      assert(!invalidCode.success, "An incorrect OTP was accepted.");
      assert(
        invalidCode.attemptsRemaining === 5 - attempt,
        "The OTP attempt counter was incorrect.",
      );
      assert(
        invalidCode.reason ===
          (attempt === 5 ? "too_many_attempts" : "invalid_code"),
        "The OTP failure reason was incorrect.",
      );
    }

    const secondIssueTime = new Date(startedAt.getTime() + 61_000);
    const challengeTwoId = crypto.randomUUID();
    const challengeTwoHash = `otp-two-${probeId}`;
    const challengeTwo = await issueD1ParticipantOtpChallenge({
      challengeId: challengeTwoId,
      participantId,
      projectId,
      inviteToken,
      otpHash: challengeTwoHash,
      expiresAt: new Date(
        secondIssueTime.getTime() + 10 * 60 * 1000,
      ).toISOString(),
      now: secondIssueTime,
    });
    assert(challengeTwo.success, "A valid second OTP challenge was not issued.");

    const sessionId = crypto.randomUUID();
    const sessionTokenHash = `session-${probeId}`;
    const sessionExpiresAt = isoAfter(12 * 60 * 60 * 1000);
    const verified = await verifyD1ParticipantOtpChallenge({
      challengeId: challengeTwoId,
      participantId,
      projectId,
      inviteToken,
      otpHash: challengeTwoHash,
      sessionId,
      sessionTokenHash,
      sessionExpiresAt,
      now: new Date(startedAt.getTime() + 62_000),
    });
    assert(
      verified.success && verified.sessionId === sessionId,
      "A correct OTP did not create a verified session.",
    );

    const reusedChallenge = await verifyD1ParticipantOtpChallenge({
      challengeId: challengeTwoId,
      participantId,
      projectId,
      inviteToken,
      otpHash: challengeTwoHash,
      sessionId: crypto.randomUUID(),
      sessionTokenHash: `second-session-${probeId}`,
      sessionExpiresAt,
      now: new Date(startedAt.getTime() + 62_500),
    });
    assert(
      !reusedChallenge.success &&
        reusedChallenge.reason === "challenge_already_used",
      "A consumed OTP challenge was reusable.",
    );

    const validSession = await validateD1ParticipantVerifiedSession({
      participantId,
      projectId,
      inviteToken,
      sessionTokenHash,
      now: new Date(startedAt.getTime() + 63_000),
    });
    assert(
      validSession.valid && validSession.sessionId === sessionId,
      "The verified session did not validate.",
    );

    const revokeResult = await db
      .prepare(
        `UPDATE client_participants
        SET invite_revoked_at = ?, updated_at = ?
        WHERE participant_id = ?`,
      )
      .bind(isoAfter(64_000), isoAfter(64_000), participantId)
      .run();
    assert(
      revokeResult.success && revokeResult.meta.changes === 1,
      "The probe invitation could not be revoked.",
    );

    const revokedSession = await validateD1ParticipantVerifiedSession({
      participantId,
      projectId,
      inviteToken,
      sessionTokenHash,
      now: new Date(startedAt.getTime() + 65_000),
    });
    assert(
      !revokedSession.valid && revokedSession.reason === "invalid_invitation",
      "Revoking the invitation did not revoke the verified session.",
    );

    await db.batch([
      db
        .prepare("DELETE FROM client_projects WHERE project_id = ?")
        .bind(projectId),
      db
        .prepare(
          `DELETE FROM client_diagnostic_invite_rate_limits
          WHERE ip_hash IN (?, ?)`,
        )
        .bind(validIpHash, invalidIpHash),
    ]);

    const remaining = await db
      .prepare(
        `SELECT
          (SELECT count(*) FROM client_projects WHERE project_id = ?)
          + (SELECT count(*) FROM client_participants WHERE participant_id = ?)
          + (SELECT count(*) FROM client_participant_otp_challenges
              WHERE participant_id = ?)
          + (SELECT count(*) FROM client_participant_verified_sessions
              WHERE participant_id = ?)
          + (SELECT count(*) FROM client_diagnostic_invite_rate_limits
              WHERE ip_hash IN (?, ?)) AS count`,
      )
      .bind(
        projectId,
        participantId,
        participantId,
        participantId,
        validIpHash,
        invalidIpHash,
      )
      .first<{ count: number }>();
    assert(remaining?.count === 0, "D1 security runtime cleanup failed.");

    return NextResponse.json({
      status: "ok",
      d1: {
        inviteRateLimit: "passed",
        otpIssuance: "passed",
        resendControls: "passed",
        attemptLimit: "passed",
        sessionCreation: "passed",
        singleUseChallenge: "passed",
        invitationRevalidation: "passed",
        cleanup: "passed",
      },
    });
  } catch (error) {
    try {
      await db.batch([
        db
          .prepare("DELETE FROM client_projects WHERE project_id = ?")
          .bind(projectId),
        db
          .prepare(
            `DELETE FROM client_diagnostic_invite_rate_limits
            WHERE ip_hash IN (?, ?)`,
          )
          .bind(validIpHash, invalidIpHash),
      ]);
    } catch {
      // Best-effort cleanup after a failed local-only probe.
    }

    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        cleanup: "attempted",
      },
      { status: 500 },
    );
  }
}

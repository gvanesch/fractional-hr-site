-- Smoke test for D1 client diagnostic security-state tables.
-- This verifies constraints, uniqueness and cascade cleanup only.
-- Atomic OTP/rate-limit behaviour is tested separately in the service layer.

PRAGMA foreign_keys = ON;

INSERT INTO client_projects (
  project_id,
  company_name,
  primary_contact_name,
  primary_contact_email
) VALUES (
  'd1-security-probe-project',
  'D1 Security Probe Ltd',
  'Probe Contact',
  'probe@example.invalid'
);

INSERT INTO client_participants (
  participant_id,
  project_id,
  questionnaire_type,
  role_label,
  invite_token
) VALUES (
  'd1-security-probe-participant',
  'd1-security-probe-project',
  'hr',
  'HR lead',
  'd1-security-probe-invite'
);

INSERT INTO client_diagnostic_invite_rate_limits (
  ip_hash,
  failed_attempts,
  blocked_until
) VALUES (
  'd1-security-probe-ip-hash',
  3,
  '2099-01-01T00:00:00.000Z'
);

INSERT INTO client_participant_otp_challenges (
  challenge_id,
  participant_id,
  project_id,
  invite_token,
  otp_hash,
  expires_at
) VALUES (
  'd1-security-probe-challenge',
  'd1-security-probe-participant',
  'd1-security-probe-project',
  'd1-security-probe-invite',
  'd1-security-probe-otp-hash',
  '2099-01-01T00:00:00.000Z'
);

INSERT INTO client_participant_verified_sessions (
  session_id,
  participant_id,
  project_id,
  invite_token,
  session_token_hash,
  expires_at
) VALUES (
  'd1-security-probe-session',
  'd1-security-probe-participant',
  'd1-security-probe-project',
  'd1-security-probe-invite',
  'd1-security-probe-session-hash',
  '2099-01-01T00:00:00.000Z'
);

SELECT
  (SELECT count(*) FROM client_diagnostic_invite_rate_limits
    WHERE ip_hash = 'd1-security-probe-ip-hash') AS rate_limit_rows,
  (SELECT count(*) FROM client_participant_otp_challenges
    WHERE challenge_id = 'd1-security-probe-challenge') AS challenge_rows,
  (SELECT count(*) FROM client_participant_verified_sessions
    WHERE session_id = 'd1-security-probe-session') AS session_rows;

INSERT OR IGNORE INTO client_diagnostic_invite_rate_limits (
  ip_hash,
  failed_attempts
) VALUES (
  'd1-security-probe-invalid-rate-limit',
  -1
);

INSERT OR IGNORE INTO client_participant_otp_challenges (
  challenge_id,
  participant_id,
  project_id,
  invite_token,
  otp_hash,
  expires_at,
  max_attempts,
  send_count
) VALUES (
  'd1-security-probe-invalid-challenge',
  'd1-security-probe-participant',
  'd1-security-probe-project',
  'd1-security-probe-invite',
  'd1-security-probe-invalid-otp-hash',
  '2099-01-01T00:00:00.000Z',
  0,
  0
);

INSERT OR IGNORE INTO client_participant_verified_sessions (
  session_id,
  participant_id,
  project_id,
  invite_token,
  session_token_hash,
  verification_method,
  expires_at
) VALUES (
  'd1-security-probe-invalid-session',
  'd1-security-probe-participant',
  'd1-security-probe-project',
  'd1-security-probe-invite',
  'd1-security-probe-invalid-session-hash',
  'invalid',
  '2099-01-01T00:00:00.000Z'
);

INSERT OR IGNORE INTO client_participant_verified_sessions (
  session_id,
  participant_id,
  project_id,
  invite_token,
  session_token_hash,
  expires_at
) VALUES (
  'd1-security-probe-duplicate-session',
  'd1-security-probe-participant',
  'd1-security-probe-project',
  'd1-security-probe-invite',
  'd1-security-probe-session-hash',
  '2099-01-01T00:00:00.000Z'
);

SELECT
  (
    (SELECT count(*) FROM client_diagnostic_invite_rate_limits
      WHERE ip_hash = 'd1-security-probe-invalid-rate-limit')
    + (SELECT count(*) FROM client_participant_otp_challenges
      WHERE challenge_id = 'd1-security-probe-invalid-challenge')
    + (SELECT count(*) FROM client_participant_verified_sessions
      WHERE session_id IN (
        'd1-security-probe-invalid-session',
        'd1-security-probe-duplicate-session'
      ))
  ) AS invalid_rows_accepted;

DELETE FROM client_projects
WHERE project_id = 'd1-security-probe-project';

SELECT
  (SELECT count(*) FROM client_participant_otp_challenges
    WHERE challenge_id LIKE 'd1-security-probe-%')
  + (SELECT count(*) FROM client_participant_verified_sessions
    WHERE session_id LIKE 'd1-security-probe-%')
  AS cascade_rows_remaining;

DELETE FROM client_diagnostic_invite_rate_limits
WHERE ip_hash LIKE 'd1-security-probe-%';

SELECT
  (SELECT count(*) FROM client_diagnostic_invite_rate_limits
    WHERE ip_hash LIKE 'd1-security-probe-%')
  + (SELECT count(*) FROM client_projects
    WHERE project_id LIKE 'd1-security-probe-%')
  + (SELECT count(*) FROM client_participants
    WHERE participant_id LIKE 'd1-security-probe-%')
  + (SELECT count(*) FROM client_participant_otp_challenges
    WHERE challenge_id LIKE 'd1-security-probe-%')
  + (SELECT count(*) FROM client_participant_verified_sessions
    WHERE session_id LIKE 'd1-security-probe-%')
  AS remaining_probe_rows;

PRAGMA quick_check;

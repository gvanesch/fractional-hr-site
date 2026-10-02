-- Behavioural smoke test for the D1 client diagnostic security service.
-- Fixed probe rows are deleted before completion.

PRAGMA foreign_keys = ON;

INSERT INTO client_projects (
  project_id,
  company_name,
  primary_contact_name,
  primary_contact_email,
  project_status
) VALUES (
  'd1-security-service-project',
  'D1 Security Service Probe Ltd',
  'Probe Contact',
  'probe@example.invalid',
  'active'
);

INSERT INTO client_participants (
  participant_id,
  project_id,
  questionnaire_type,
  role_label,
  invite_token,
  participant_status,
  name,
  email,
  invite_expires_at
) VALUES (
  'd1-security-service-participant',
  'd1-security-service-project',
  'hr',
  'HR lead',
  'd1-security-service-valid-invite',
  'invited',
  'Probe Participant',
  'participant@example.invalid',
  '2099-01-02T00:00:00.000Z'
);

-- A valid invite must not create a failed-attempt bucket.
INSERT INTO client_diagnostic_invite_rate_limits (
  ip_hash,
  window_started_at,
  failed_attempts,
  blocked_until,
  updated_at
)
SELECT
  'd1-security-service-valid-ip',
  '2099-01-01T00:00:00.000Z',
  1,
  NULL,
  '2099-01-01T00:00:00.000Z'
WHERE NOT EXISTS (
  SELECT 1
  FROM client_participants participant
  JOIN client_projects project
    ON project.project_id = participant.project_id
  WHERE participant.invite_token = 'd1-security-service-valid-invite'
    AND project.project_status = 'active'
    AND participant.invite_revoked_at IS NULL
    AND participant.invite_expires_at >= '2099-01-01T00:00:00.000Z'
    AND participant.completed_at IS NULL
    AND participant.participant_status IN ('invited', 'started')
);

-- Ten invalid attempts within one window must block the IP hash.
INSERT INTO client_diagnostic_invite_rate_limits (
  ip_hash, window_started_at, failed_attempts, blocked_until, updated_at
) VALUES (
  'd1-security-service-invalid-ip',
  '2099-01-01T00:00:00.000Z',
  1,
  NULL,
  '2099-01-01T00:00:00.000Z'
);

INSERT INTO client_diagnostic_invite_rate_limits (
  ip_hash, window_started_at, failed_attempts, blocked_until, updated_at
) VALUES (
  'd1-security-service-invalid-ip',
  '2099-01-01T00:00:00.000Z',
  1,
  NULL,
  '2099-01-01T00:00:00.000Z'
)
ON CONFLICT(ip_hash) DO UPDATE SET
  failed_attempts = client_diagnostic_invite_rate_limits.failed_attempts + 1;

INSERT INTO client_diagnostic_invite_rate_limits (
  ip_hash, window_started_at, failed_attempts, blocked_until, updated_at
) VALUES
  ('d1-security-service-invalid-ip', '2099-01-01T00:00:00.000Z', 1, NULL, '2099-01-01T00:00:00.000Z')
ON CONFLICT(ip_hash) DO UPDATE SET failed_attempts = failed_attempts + 1;
INSERT INTO client_diagnostic_invite_rate_limits (
  ip_hash, window_started_at, failed_attempts, blocked_until, updated_at
) VALUES
  ('d1-security-service-invalid-ip', '2099-01-01T00:00:00.000Z', 1, NULL, '2099-01-01T00:00:00.000Z')
ON CONFLICT(ip_hash) DO UPDATE SET failed_attempts = failed_attempts + 1;
INSERT INTO client_diagnostic_invite_rate_limits (
  ip_hash, window_started_at, failed_attempts, blocked_until, updated_at
) VALUES
  ('d1-security-service-invalid-ip', '2099-01-01T00:00:00.000Z', 1, NULL, '2099-01-01T00:00:00.000Z')
ON CONFLICT(ip_hash) DO UPDATE SET failed_attempts = failed_attempts + 1;
INSERT INTO client_diagnostic_invite_rate_limits (
  ip_hash, window_started_at, failed_attempts, blocked_until, updated_at
) VALUES
  ('d1-security-service-invalid-ip', '2099-01-01T00:00:00.000Z', 1, NULL, '2099-01-01T00:00:00.000Z')
ON CONFLICT(ip_hash) DO UPDATE SET failed_attempts = failed_attempts + 1;
INSERT INTO client_diagnostic_invite_rate_limits (
  ip_hash, window_started_at, failed_attempts, blocked_until, updated_at
) VALUES
  ('d1-security-service-invalid-ip', '2099-01-01T00:00:00.000Z', 1, NULL, '2099-01-01T00:00:00.000Z')
ON CONFLICT(ip_hash) DO UPDATE SET failed_attempts = failed_attempts + 1;
INSERT INTO client_diagnostic_invite_rate_limits (
  ip_hash, window_started_at, failed_attempts, blocked_until, updated_at
) VALUES
  ('d1-security-service-invalid-ip', '2099-01-01T00:00:00.000Z', 1, NULL, '2099-01-01T00:00:00.000Z')
ON CONFLICT(ip_hash) DO UPDATE SET failed_attempts = failed_attempts + 1;
INSERT INTO client_diagnostic_invite_rate_limits (
  ip_hash, window_started_at, failed_attempts, blocked_until, updated_at
) VALUES
  ('d1-security-service-invalid-ip', '2099-01-01T00:00:00.000Z', 1, NULL, '2099-01-01T00:00:00.000Z')
ON CONFLICT(ip_hash) DO UPDATE SET failed_attempts = failed_attempts + 1;
INSERT INTO client_diagnostic_invite_rate_limits (
  ip_hash, window_started_at, failed_attempts, blocked_until, updated_at
) VALUES
  ('d1-security-service-invalid-ip', '2099-01-01T00:00:00.000Z', 1, NULL, '2099-01-01T00:00:00.000Z')
ON CONFLICT(ip_hash) DO UPDATE SET
  failed_attempts = failed_attempts + 1,
  blocked_until = '2099-01-01T00:05:00.000Z';

-- First challenge succeeds. A second send inside 60 seconds is rejected.
INSERT INTO client_participant_otp_challenges (
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
) VALUES (
  'd1-security-service-challenge-invalid',
  'd1-security-service-participant',
  'd1-security-service-project',
  'd1-security-service-valid-invite',
  'd1-security-service-correct-otp-hash-0000000000000000000000000000',
  '2099-01-01T00:10:00.000Z',
  0,
  5,
  1,
  '2099-01-01T00:00:00.000Z',
  '2099-01-01T00:00:00.000Z',
  '2099-01-01T00:00:00.000Z'
);

INSERT INTO client_participant_otp_challenges (
  challenge_id,
  participant_id,
  project_id,
  invite_token,
  otp_hash,
  expires_at,
  created_at,
  updated_at
)
SELECT
  'd1-security-service-challenge-too-soon',
  'd1-security-service-participant',
  'd1-security-service-project',
  'd1-security-service-valid-invite',
  'd1-security-service-another-otp-hash-000000000000000000000000000',
  '2099-01-01T00:10:30.000Z',
  '2099-01-01T00:00:30.000Z',
  '2099-01-01T00:00:30.000Z'
WHERE NOT EXISTS (
  SELECT 1
  FROM client_participant_otp_challenges
  WHERE participant_id = 'd1-security-service-participant'
    AND created_at > '2098-12-31T23:59:30.000Z'
);

-- Five incorrect codes consume the attempt budget and invalidate the challenge.
UPDATE client_participant_otp_challenges
SET failed_attempts = failed_attempts + 1,
    invalidated_at = CASE WHEN failed_attempts + 1 >= max_attempts
      THEN '2099-01-01T00:01:00.000Z' ELSE invalidated_at END,
    updated_at = '2099-01-01T00:01:00.000Z'
WHERE challenge_id = 'd1-security-service-challenge-invalid';
UPDATE client_participant_otp_challenges
SET failed_attempts = failed_attempts + 1,
    invalidated_at = CASE WHEN failed_attempts + 1 >= max_attempts
      THEN '2099-01-01T00:01:01.000Z' ELSE invalidated_at END
WHERE challenge_id = 'd1-security-service-challenge-invalid';
UPDATE client_participant_otp_challenges
SET failed_attempts = failed_attempts + 1,
    invalidated_at = CASE WHEN failed_attempts + 1 >= max_attempts
      THEN '2099-01-01T00:01:02.000Z' ELSE invalidated_at END
WHERE challenge_id = 'd1-security-service-challenge-invalid';
UPDATE client_participant_otp_challenges
SET failed_attempts = failed_attempts + 1,
    invalidated_at = CASE WHEN failed_attempts + 1 >= max_attempts
      THEN '2099-01-01T00:01:03.000Z' ELSE invalidated_at END
WHERE challenge_id = 'd1-security-service-challenge-invalid';
UPDATE client_participant_otp_challenges
SET failed_attempts = failed_attempts + 1,
    invalidated_at = CASE WHEN failed_attempts + 1 >= max_attempts
      THEN '2099-01-01T00:01:04.000Z' ELSE invalidated_at END
WHERE challenge_id = 'd1-security-service-challenge-invalid';

-- A fresh correct challenge creates one verified session.
INSERT INTO client_participant_otp_challenges (
  challenge_id,
  participant_id,
  project_id,
  invite_token,
  otp_hash,
  expires_at,
  consumed_at,
  created_at,
  updated_at
) VALUES (
  'd1-security-service-challenge-valid',
  'd1-security-service-participant',
  'd1-security-service-project',
  'd1-security-service-valid-invite',
  'd1-security-service-valid-otp-hash-000000000000000000000000000000',
  '2099-01-01T00:15:00.000Z',
  '2099-01-01T00:05:00.000Z',
  '2099-01-01T00:04:00.000Z',
  '2099-01-01T00:05:00.000Z'
);

INSERT INTO client_participant_verified_sessions (
  session_id,
  participant_id,
  project_id,
  invite_token,
  session_token_hash,
  verification_method,
  verified_at,
  expires_at,
  last_used_at,
  created_at
) VALUES (
  'd1-security-service-session',
  'd1-security-service-participant',
  'd1-security-service-project',
  'd1-security-service-valid-invite',
  'd1-security-service-session-token-hash-00000000000000000000000000',
  'email_otp',
  '2099-01-01T00:05:00.000Z',
  '2099-01-01T12:05:00.000Z',
  '2099-01-01T00:05:00.000Z',
  '2099-01-01T00:05:00.000Z'
);

UPDATE client_participant_verified_sessions
SET last_used_at = '2099-01-01T00:06:00.000Z'
WHERE session_id = 'd1-security-service-session'
  AND revoked_at IS NULL
  AND expires_at > '2099-01-01T00:06:00.000Z'
  AND EXISTS (
    SELECT 1
    FROM client_participants participant
    JOIN client_projects project
      ON project.project_id = participant.project_id
    WHERE participant.participant_id = 'd1-security-service-participant'
      AND participant.invite_token = 'd1-security-service-valid-invite'
      AND project.project_status = 'active'
      AND participant.invite_revoked_at IS NULL
  );

SELECT CASE WHEN (
  (SELECT count(*) FROM client_diagnostic_invite_rate_limits
    WHERE ip_hash = 'd1-security-service-valid-ip') = 0
  AND (SELECT failed_attempts FROM client_diagnostic_invite_rate_limits
    WHERE ip_hash = 'd1-security-service-invalid-ip') = 10
  AND (SELECT blocked_until FROM client_diagnostic_invite_rate_limits
    WHERE ip_hash = 'd1-security-service-invalid-ip') = '2099-01-01T00:05:00.000Z'
  AND (SELECT count(*) FROM client_participant_otp_challenges
    WHERE challenge_id = 'd1-security-service-challenge-too-soon') = 0
  AND (SELECT failed_attempts FROM client_participant_otp_challenges
    WHERE challenge_id = 'd1-security-service-challenge-invalid') = 5
  AND (SELECT invalidated_at FROM client_participant_otp_challenges
    WHERE challenge_id = 'd1-security-service-challenge-invalid') IS NOT NULL
  AND (SELECT last_used_at FROM client_participant_verified_sessions
    WHERE session_id = 'd1-security-service-session') = '2099-01-01T00:06:00.000Z'
) THEN 'passed'
ELSE json_extract('security service assertion failed', '$')
END AS security_service_behaviour;

UPDATE client_participants
SET invite_revoked_at = '2099-01-01T00:07:00.000Z'
WHERE participant_id = 'd1-security-service-participant';

UPDATE client_participant_verified_sessions
SET revoked_at = '2099-01-01T00:07:00.000Z'
WHERE session_id = 'd1-security-service-session'
  AND revoked_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM client_participants participant
    JOIN client_projects project
      ON project.project_id = participant.project_id
    WHERE participant.participant_id = 'd1-security-service-participant'
      AND participant.invite_token = 'd1-security-service-valid-invite'
      AND project.project_status = 'active'
      AND participant.invite_revoked_at IS NULL
  );

SELECT CASE WHEN (
  SELECT revoked_at
  FROM client_participant_verified_sessions
  WHERE session_id = 'd1-security-service-session'
) = '2099-01-01T00:07:00.000Z'
THEN 'passed'
ELSE json_extract('session revocation assertion failed', '$')
END AS invitation_revalidation;

DELETE FROM client_projects
WHERE project_id = 'd1-security-service-project';

DELETE FROM client_diagnostic_invite_rate_limits
WHERE ip_hash LIKE 'd1-security-service-%';

SELECT CASE WHEN (
  (SELECT count(*) FROM client_projects
    WHERE project_id LIKE 'd1-security-service-%')
  + (SELECT count(*) FROM client_participants
    WHERE participant_id LIKE 'd1-security-service-%')
  + (SELECT count(*) FROM client_participant_otp_challenges
    WHERE challenge_id LIKE 'd1-security-service-%')
  + (SELECT count(*) FROM client_participant_verified_sessions
    WHERE session_id LIKE 'd1-security-service-%')
  + (SELECT count(*) FROM client_diagnostic_invite_rate_limits
    WHERE ip_hash LIKE 'd1-security-service-%')
) = 0
THEN 'passed'
ELSE json_extract('security service cleanup failed', '$')
END AS security_service_cleanup;

PRAGMA quick_check;

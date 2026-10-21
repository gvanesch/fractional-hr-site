-- D1 schema for client diagnostic abuse controls and participant verification state.
-- The application service layer owns atomic state transitions and expiry checks.
-- Application code generates UUIDs and cryptographic hashes.
-- Timestamps are stored as UTC ISO-8601 text.

CREATE TABLE client_diagnostic_invite_rate_limits (
  ip_hash TEXT PRIMARY KEY NOT NULL,
  window_started_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  failed_attempts INTEGER NOT NULL DEFAULT 0
    CHECK (failed_attempts >= 0),
  blocked_until TEXT,
  updated_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  )
);

CREATE TABLE client_participant_otp_challenges (
  challenge_id TEXT PRIMARY KEY NOT NULL,
  participant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  invite_token TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0
    CHECK (failed_attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5
    CHECK (max_attempts > 0),
  send_count INTEGER NOT NULL DEFAULT 1
    CHECK (send_count > 0),
  last_sent_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  consumed_at TEXT,
  invalidated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  updated_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  FOREIGN KEY (participant_id)
    REFERENCES client_participants (participant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (project_id)
    REFERENCES client_projects (project_id)
    ON DELETE CASCADE
);

CREATE TABLE client_participant_verified_sessions (
  session_id TEXT PRIMARY KEY NOT NULL,
  participant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  invite_token TEXT NOT NULL,
  session_token_hash TEXT NOT NULL UNIQUE,
  verification_method TEXT NOT NULL DEFAULT 'email_otp'
    CHECK (verification_method = 'email_otp'),
  verified_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  expires_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  FOREIGN KEY (participant_id)
    REFERENCES client_participants (participant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (project_id)
    REFERENCES client_projects (project_id)
    ON DELETE CASCADE
);

CREATE INDEX client_participant_otp_challenges_expiry_idx
  ON client_participant_otp_challenges (expires_at);
CREATE INDEX client_participant_otp_challenges_participant_idx
  ON client_participant_otp_challenges (participant_id, created_at DESC);

CREATE INDEX client_participant_verified_sessions_expiry_idx
  ON client_participant_verified_sessions (expires_at);
CREATE INDEX client_participant_verified_sessions_participant_idx
  ON client_participant_verified_sessions (participant_id, expires_at DESC);

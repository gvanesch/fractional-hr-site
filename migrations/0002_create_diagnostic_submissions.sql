-- D1 schema for public Health Check and website contact submissions.
-- Application code generates UUIDs with crypto.randomUUID().
-- Timestamps are stored as UTC ISO-8601 text.
-- JSON values are stored as text and validated on write.

CREATE TABLE diagnostic_submissions (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  company_size TEXT,
  industry TEXT,
  role TEXT,
  country_region TEXT,
  email TEXT,
  score INTEGER
    CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  band TEXT,
  process_clarity_score INTEGER
    CHECK (
      process_clarity_score IS NULL
      OR process_clarity_score BETWEEN 1 AND 5
    ),
  consistency_score INTEGER
    CHECK (
      consistency_score IS NULL
      OR consistency_score BETWEEN 1 AND 5
    ),
  service_access_score INTEGER
    CHECK (
      service_access_score IS NULL
      OR service_access_score BETWEEN 1 AND 5
    ),
  ownership_score INTEGER
    CHECK (
      ownership_score IS NULL
      OR ownership_score BETWEEN 1 AND 5
    ),
  onboarding_score INTEGER
    CHECK (
      onboarding_score IS NULL
      OR onboarding_score BETWEEN 1 AND 5
    ),
  technology_alignment_score INTEGER
    CHECK (
      technology_alignment_score IS NULL
      OR technology_alignment_score BETWEEN 1 AND 5
    ),
  knowledge_self_service_score INTEGER
    CHECK (
      knowledge_self_service_score IS NULL
      OR knowledge_self_service_score BETWEEN 1 AND 5
    ),
  operational_capacity_score INTEGER
    CHECK (
      operational_capacity_score IS NULL
      OR operational_capacity_score BETWEEN 1 AND 5
    ),
  data_handoffs_score INTEGER
    CHECK (
      data_handoffs_score IS NULL
      OR data_handoffs_score BETWEEN 1 AND 5
    ),
  change_resilience_score INTEGER
    CHECK (
      change_resilience_score IS NULL
      OR change_resilience_score BETWEEN 1 AND 5
    ),
  answers TEXT
    CHECK (answers IS NULL OR json_valid(answers)),
  abuse_token TEXT,
  submission_id TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_company TEXT,
  contact_topic TEXT,
  contact_message TEXT,
  contact_source TEXT,
  advisor_brief TEXT
    CHECK (advisor_brief IS NULL OR json_valid(advisor_brief)),
  contact_submitted_at TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (
      status IN ('new', 'contacted', 'booked', 'closed', 'archived')
    ),
  last_contacted_at TEXT,
  notes TEXT,
  completed_at TEXT,
  submission_source TEXT,
  completion_version TEXT,
  public_token TEXT
);

CREATE UNIQUE INDEX diagnostic_submissions_submission_id_idx
  ON diagnostic_submissions (submission_id);

CREATE UNIQUE INDEX diagnostic_submissions_public_token_idx
  ON diagnostic_submissions (public_token);

CREATE INDEX diagnostic_submissions_contact_submitted_at_idx
  ON diagnostic_submissions (contact_submitted_at DESC);

CREATE INDEX diagnostic_submissions_status_idx
  ON diagnostic_submissions (status);

CREATE INDEX diagnostic_submissions_completed_at_idx
  ON diagnostic_submissions (completed_at DESC);

CREATE INDEX diagnostic_submissions_submission_source_idx
  ON diagnostic_submissions (submission_source);

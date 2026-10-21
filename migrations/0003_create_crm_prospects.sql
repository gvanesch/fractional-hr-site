
-- D1 schema for advisor and Health Check prospect management.
-- Application code generates UUIDs with crypto.randomUUID().
-- Dates and UTC ISO-8601 timestamps are stored as text.
-- PostgreSQL arrays are stored as JSON text and validated on write.

CREATE TABLE advisor_prospects (
  prospect_id TEXT PRIMARY KEY NOT NULL,
  name TEXT,
  company TEXT,
  role TEXT,
  source TEXT NOT NULL DEFAULT 'linkedin'
    CHECK (source IN ('linkedin', 'referral', 'website', 'saas', 'other')),
  segment TEXT
    CHECK (segment IS NULL OR segment IN ('smb', 'mid', 'enterprise')),
  diagnostic_status TEXT NOT NULL DEFAULT 'not_invited'
    CHECK (
      diagnostic_status IN (
        'not_invited',
        'invited',
        'started',
        'completed',
        'assessment_candidate',
        'in_conversation',
        'converted'
      )
    ),
  last_contact_date TEXT,
  next_action_date TEXT,
  observed_signals TEXT
    CHECK (observed_signals IS NULL OR json_valid(observed_signals)),
  notes TEXT,
  linked_submission_id TEXT,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  updated_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  relationship_strength TEXT NOT NULL DEFAULT 'unknown'
    CHECK (relationship_strength IN ('unknown', 'weak', 'medium', 'strong')),
  deal_stage TEXT NOT NULL DEFAULT 'new'
    CHECK (
      deal_stage IN (
        'new',
        'contacted',
        'replied',
        'meeting_booked',
        'in_conversation',
        'health_check_completed',
        'diagnostic_assessment_candidate',
        'proposal_discussed',
        'converted',
        'lost',
        'nurture'
      )
    ),
  lead_temperature TEXT NOT NULL DEFAULT 'warm'
    CHECK (lead_temperature IN ('cold', 'warm', 'hot')),
  next_step TEXT,
  lost_reason TEXT,
  contact_email TEXT
    CHECK (contact_email IS NULL OR length(contact_email) <= 320),
  contact_phone TEXT
    CHECK (contact_phone IS NULL OR length(contact_phone) <= 80),
  company_website TEXT
    CHECK (company_website IS NULL OR length(company_website) <= 500),
  billing_contact_name TEXT,
  billing_contact_email TEXT
    CHECK (
      billing_contact_email IS NULL
      OR length(billing_contact_email) <= 320
    ),
  linkedin_url TEXT
    CHECK (linkedin_url IS NULL OR length(linkedin_url) <= 500),
  FOREIGN KEY (linked_submission_id)
    REFERENCES diagnostic_submissions (submission_id)
    ON DELETE SET NULL
);

CREATE TABLE advisor_prospect_activity (
  activity_id TEXT PRIMARY KEY NOT NULL,
  prospect_id TEXT NOT NULL,
  linked_submission_id TEXT,
  activity_type TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  changed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  note_type TEXT
    CHECK (
      note_type IS NULL
      OR note_type IN ('call', 'meeting', 'email', 'linkedin', 'internal')
    ),
  FOREIGN KEY (prospect_id)
    REFERENCES advisor_prospects (prospect_id)
    ON DELETE CASCADE,
  FOREIGN KEY (linked_submission_id)
    REFERENCES diagnostic_submissions (submission_id)
    ON DELETE SET NULL
);

CREATE TABLE health_check_prospects (
  prospect_id TEXT PRIMARY KEY NOT NULL,
  submission_id TEXT NOT NULL UNIQUE,
  name TEXT,
  company TEXT,
  relationship TEXT NOT NULL DEFAULT 'weak'
    CHECK (relationship IN ('weak', 'medium', 'strong')),
  status TEXT NOT NULL DEFAULT 'not_contacted'
    CHECK (
      status IN (
        'not_contacted',
        'contacted',
        'replied',
        'call_booked',
        'opportunity',
        'won',
        'lost'
      )
    ),
  last_contact_date TEXT,
  next_action_date TEXT,
  source TEXT NOT NULL DEFAULT 'website'
    CHECK (source IN ('network', 'referral', 'website', 'other')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  updated_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  FOREIGN KEY (submission_id)
    REFERENCES diagnostic_submissions (submission_id)
    ON DELETE CASCADE
);

CREATE TABLE health_check_prospect_activity (
  activity_id TEXT PRIMARY KEY NOT NULL,
  prospect_id TEXT NOT NULL,
  submission_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  changed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  FOREIGN KEY (prospect_id)
    REFERENCES health_check_prospects (prospect_id)
    ON DELETE CASCADE,
  FOREIGN KEY (submission_id)
    REFERENCES diagnostic_submissions (submission_id)
    ON DELETE CASCADE
);

CREATE INDEX health_check_prospects_next_action_date_idx
  ON health_check_prospects (next_action_date);

CREATE INDEX health_check_prospects_source_idx
  ON health_check_prospects (source);

CREATE INDEX health_check_prospects_status_idx
  ON health_check_prospects (status);

CREATE INDEX health_check_prospect_activity_created_at_idx
  ON health_check_prospect_activity (created_at DESC);

CREATE INDEX health_check_prospect_activity_prospect_id_idx
  ON health_check_prospect_activity (prospect_id);

CREATE INDEX health_check_prospect_activity_submission_id_idx
  ON health_check_prospect_activity (submission_id);

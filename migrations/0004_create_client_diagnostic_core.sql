-- D1 schema for client diagnostic projects, participants and response data.
-- Security state (rate limiting, OTP challenges and verified sessions) is isolated
-- in a later migration so it can be reviewed and tested independently.
-- Application code generates UUIDs with crypto.randomUUID().
-- Timestamps are stored as UTC ISO-8601 text.
-- JSON values and PostgreSQL text arrays are stored as validated JSON text.

CREATE TABLE client_projects (
  project_id TEXT PRIMARY KEY NOT NULL,
  company_name TEXT NOT NULL,
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  project_status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  updated_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  project_name TEXT,
  status TEXT DEFAULT 'draft',
  segmentation_schema TEXT
    CHECK (segmentation_schema IS NULL OR json_valid(segmentation_schema)),
  billing_contact_name TEXT,
  billing_contact_email TEXT,
  company_website TEXT,
  purchase_order_number TEXT,
  msa_status TEXT
    CHECK (
      msa_status IS NULL
      OR msa_status IN ('not_started', 'in_review', 'signed')
    ),
  dpa_status TEXT
    CHECK (
      dpa_status IS NULL
      OR dpa_status IN ('not_required', 'required', 'signed')
    )
);

CREATE TABLE client_participants (
  participant_id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  questionnaire_type TEXT NOT NULL
    CHECK (
      questionnaire_type IN (
        'hr',
        'manager',
        'leadership',
        'client_fact_pack',
        'payroll'
      )
    ),
  role_label TEXT NOT NULL,
  invite_token TEXT NOT NULL UNIQUE,
  participant_status TEXT NOT NULL DEFAULT 'invited'
    CHECK (
      participant_status IN ('invited', 'started', 'completed', 'archived')
    ),
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  updated_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  name TEXT,
  email TEXT,
  status TEXT DEFAULT 'invited',
  invited_at TEXT DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  segmentation_values TEXT
    CHECK (segmentation_values IS NULL OR json_valid(segmentation_values)),
  invite_expires_at TEXT,
  invite_revoked_at TEXT,
  invite_last_used_at TEXT,
  withdraw_reason TEXT,
  withdraw_note TEXT,
  withdrawn_at TEXT,
  reinstate_reason TEXT,
  reinstate_note TEXT,
  reinstated_at TEXT,
  FOREIGN KEY (project_id)
    REFERENCES client_projects (project_id)
    ON DELETE CASCADE
);

CREATE TABLE client_responses (
  response_id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  questionnaire_type TEXT NOT NULL
    CHECK (
      questionnaire_type IN ('hr', 'manager', 'leadership', 'payroll')
    ),
  dimension_key TEXT NOT NULL,
  question_key TEXT NOT NULL,
  answer_value INTEGER
    CHECK (answer_value IS NULL OR answer_value BETWEEN 1 AND 5),
  comment_text TEXT,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  updated_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  responses TEXT
    CHECK (responses IS NULL OR json_valid(responses)),
  submitted_at TEXT DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  UNIQUE (participant_id, question_key),
  FOREIGN KEY (project_id)
    REFERENCES client_projects (project_id)
    ON DELETE CASCADE,
  FOREIGN KEY (participant_id)
    REFERENCES client_participants (participant_id)
    ON DELETE CASCADE
);

CREATE TABLE client_dimension_scores (
  score_id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  questionnaire_type TEXT NOT NULL
    CHECK (
      questionnaire_type IN ('hr', 'manager', 'leadership', 'payroll')
    ),
  dimension_key TEXT NOT NULL,
  average_score REAL NOT NULL,
  response_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  participant_id TEXT,
  score REAL,
  UNIQUE (
    project_id,
    participant_id,
    questionnaire_type,
    dimension_key
  ),
  FOREIGN KEY (project_id)
    REFERENCES client_projects (project_id)
    ON DELETE CASCADE
);

CREATE TABLE client_fact_packs (
  fact_pack_id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  participant_id TEXT NOT NULL UNIQUE,
  invite_token TEXT,
  response_json TEXT NOT NULL DEFAULT '{}'
    CHECK (json_valid(response_json)),
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  submitted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  updated_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  FOREIGN KEY (project_id)
    REFERENCES client_projects (project_id)
    ON DELETE CASCADE,
  FOREIGN KEY (participant_id)
    REFERENCES client_participants (participant_id)
    ON DELETE CASCADE
);

CREATE TABLE client_functional_signal_requests (
  signal_request_id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  module_type TEXT NOT NULL
    CHECK (module_type IN ('it', 'payroll', 'finance', 'other')),
  module_label TEXT
    CHECK (module_label IS NULL OR length(module_label) <= 120),
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL
    CHECK (length(recipient_email) <= 320),
  invite_token TEXT NOT NULL UNIQUE,
  signal_status TEXT NOT NULL DEFAULT 'invited'
    CHECK (
      signal_status IN ('invited', 'started', 'completed', 'archived')
    ),
  response_data TEXT
    CHECK (response_data IS NULL OR json_valid(response_data)),
  invited_at TEXT DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  invite_expires_at TEXT,
  invite_last_used_at TEXT,
  started_at TEXT,
  submitted_at TEXT,
  completed_at TEXT,
  archived_at TEXT,
  archive_reason TEXT,
  archive_note TEXT,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  updated_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  FOREIGN KEY (project_id)
    REFERENCES client_projects (project_id)
    ON DELETE CASCADE
);

CREATE TABLE client_service_access_context (
  context_id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  participant_id TEXT NOT NULL UNIQUE,
  questionnaire_type TEXT NOT NULL
    CHECK (questionnaire_type IN ('hr', 'manager')),
  routes_used TEXT NOT NULL DEFAULT '[]'
    CHECK (json_valid(routes_used) AND json_type(routes_used) = 'array'),
  usual_route TEXT,
  usual_route_effectiveness INTEGER
    CHECK (
      usual_route_effectiveness IS NULL
      OR usual_route_effectiveness BETWEEN 1 AND 5
    ),
  intended_primary_route TEXT,
  specific_route_detail TEXT,
  created_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  updated_at TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  intended_access_model TEXT,
  FOREIGN KEY (project_id)
    REFERENCES client_projects (project_id)
    ON DELETE CASCADE,
  FOREIGN KEY (participant_id)
    REFERENCES client_participants (participant_id)
    ON DELETE CASCADE
);

CREATE INDEX client_projects_company_name_idx
  ON client_projects (company_name);
CREATE INDEX client_projects_primary_contact_email_idx
  ON client_projects (primary_contact_email);

CREATE INDEX client_participants_project_id_idx
  ON client_participants (project_id);
CREATE INDEX client_participants_questionnaire_type_idx
  ON client_participants (questionnaire_type);
CREATE INDEX client_participants_status_idx
  ON client_participants (participant_status);

CREATE INDEX client_responses_project_id_idx
  ON client_responses (project_id);
CREATE INDEX client_responses_participant_id_idx
  ON client_responses (participant_id);
CREATE INDEX client_responses_questionnaire_type_idx
  ON client_responses (questionnaire_type);
CREATE INDEX client_responses_dimension_key_idx
  ON client_responses (dimension_key);
CREATE INDEX client_responses_question_key_idx
  ON client_responses (question_key);

CREATE INDEX client_dimension_scores_project_id_idx
  ON client_dimension_scores (project_id);
CREATE INDEX client_dimension_scores_questionnaire_type_idx
  ON client_dimension_scores (questionnaire_type);
CREATE INDEX client_dimension_scores_dimension_key_idx
  ON client_dimension_scores (dimension_key);
CREATE INDEX client_dimension_scores_participant_idx
  ON client_dimension_scores (
    project_id,
    participant_id,
    questionnaire_type
  );

CREATE INDEX client_fact_packs_project_id_idx
  ON client_fact_packs (project_id);

CREATE INDEX client_functional_signal_requests_project_id_idx
  ON client_functional_signal_requests (project_id);
CREATE INDEX client_functional_signal_requests_status_idx
  ON client_functional_signal_requests (signal_status);

CREATE INDEX client_service_access_context_project_idx
  ON client_service_access_context (project_id);

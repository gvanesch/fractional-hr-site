-- Smoke test for the D1 client diagnostic core schema.
-- Probe rows use fixed IDs and are removed before the script completes.

PRAGMA foreign_keys = ON;

INSERT INTO client_projects (
  project_id,
  company_name,
  primary_contact_name,
  primary_contact_email,
  segmentation_schema,
  msa_status,
  dpa_status
) VALUES (
  'd1-core-probe-project',
  'D1 Core Probe Ltd',
  'Probe Contact',
  'probe@example.invalid',
  '{"dimensions":["department"]}',
  'signed',
  'required'
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
  segmentation_values
) VALUES
(
  'd1-core-probe-participant-hr',
  'd1-core-probe-project',
  'hr',
  'HR lead',
  'd1-core-probe-invite-hr',
  'started',
  'HR Probe',
  'hr-probe@example.invalid',
  '{"department":"People"}'
),
(
  'd1-core-probe-participant-fact-pack',
  'd1-core-probe-project',
  'client_fact_pack',
  'Fact pack owner',
  'd1-core-probe-invite-fact-pack',
  'invited',
  'Fact Pack Probe',
  'fact-pack-probe@example.invalid',
  NULL
);

INSERT INTO client_responses (
  response_id,
  project_id,
  participant_id,
  questionnaire_type,
  dimension_key,
  question_key,
  answer_value,
  responses
) VALUES (
  'd1-core-probe-response',
  'd1-core-probe-project',
  'd1-core-probe-participant-hr',
  'hr',
  'service_access',
  'service_access_1',
  4,
  '{"answer":4}'
);

INSERT INTO client_dimension_scores (
  score_id,
  project_id,
  participant_id,
  questionnaire_type,
  dimension_key,
  average_score,
  response_count,
  score
) VALUES (
  'd1-core-probe-score',
  'd1-core-probe-project',
  'd1-core-probe-participant-hr',
  'hr',
  'service_access',
  4.0,
  1,
  4.0
);

INSERT INTO client_fact_packs (
  fact_pack_id,
  project_id,
  participant_id,
  invite_token,
  response_json
) VALUES (
  'd1-core-probe-fact-pack',
  'd1-core-probe-project',
  'd1-core-probe-participant-fact-pack',
  'd1-core-probe-invite-fact-pack',
  '{"employee_count":42}'
);

INSERT INTO client_functional_signal_requests (
  signal_request_id,
  project_id,
  module_type,
  module_label,
  recipient_name,
  recipient_email,
  invite_token,
  response_data
) VALUES (
  'd1-core-probe-signal',
  'd1-core-probe-project',
  'it',
  'IT',
  'IT Probe',
  'it-probe@example.invalid',
  'd1-core-probe-signal-invite',
  '{"signal":"manual_work"}'
);

INSERT INTO client_service_access_context (
  context_id,
  project_id,
  participant_id,
  questionnaire_type,
  routes_used,
  usual_route,
  usual_route_effectiveness
) VALUES (
  'd1-core-probe-context',
  'd1-core-probe-project',
  'd1-core-probe-participant-hr',
  'hr',
  '["email","portal"]',
  'email',
  3
);

SELECT
  (SELECT count(*) FROM client_projects
    WHERE project_id = 'd1-core-probe-project') AS project_rows,
  (SELECT count(*) FROM client_participants
    WHERE project_id = 'd1-core-probe-project') AS participant_rows,
  (SELECT count(*) FROM client_responses
    WHERE project_id = 'd1-core-probe-project') AS response_rows,
  (SELECT count(*) FROM client_dimension_scores
    WHERE project_id = 'd1-core-probe-project') AS score_rows,
  (SELECT count(*) FROM client_fact_packs
    WHERE project_id = 'd1-core-probe-project') AS fact_pack_rows,
  (SELECT count(*) FROM client_functional_signal_requests
    WHERE project_id = 'd1-core-probe-project') AS signal_rows,
  (SELECT count(*) FROM client_service_access_context
    WHERE project_id = 'd1-core-probe-project') AS context_rows,
  (SELECT json_extract(response_json, '$.employee_count')
    FROM client_fact_packs
    WHERE fact_pack_id = 'd1-core-probe-fact-pack') AS employee_count,
  (SELECT json_array_length(routes_used)
    FROM client_service_access_context
    WHERE context_id = 'd1-core-probe-context') AS route_count;

INSERT OR IGNORE INTO client_projects (
  project_id,
  company_name,
  primary_contact_name,
  primary_contact_email,
  msa_status
) VALUES (
  'd1-core-probe-invalid-project',
  'Invalid',
  'Invalid',
  'invalid@example.invalid',
  'invalid'
);

INSERT OR IGNORE INTO client_participants (
  participant_id,
  project_id,
  questionnaire_type,
  role_label,
  invite_token,
  participant_status
) VALUES (
  'd1-core-probe-invalid-participant',
  'd1-core-probe-project',
  'invalid',
  'Invalid',
  'd1-core-probe-invalid-invite',
  'invalid'
);

INSERT OR IGNORE INTO client_responses (
  response_id,
  project_id,
  participant_id,
  questionnaire_type,
  dimension_key,
  question_key,
  answer_value
) VALUES (
  'd1-core-probe-invalid-response',
  'd1-core-probe-project',
  'd1-core-probe-participant-hr',
  'hr',
  'service_access',
  'invalid',
  9
);

INSERT OR IGNORE INTO client_fact_packs (
  fact_pack_id,
  project_id,
  participant_id,
  response_json,
  status
) VALUES (
  'd1-core-probe-invalid-fact-pack',
  'd1-core-probe-project',
  'd1-core-probe-participant-hr',
  '{}',
  'invalid'
);

INSERT OR IGNORE INTO client_functional_signal_requests (
  signal_request_id,
  project_id,
  module_type,
  recipient_name,
  recipient_email,
  invite_token
) VALUES (
  'd1-core-probe-invalid-signal',
  'd1-core-probe-project',
  'invalid',
  'Invalid',
  'invalid@example.invalid',
  'd1-core-probe-invalid-signal-invite'
);

INSERT OR IGNORE INTO client_service_access_context (
  context_id,
  project_id,
  participant_id,
  questionnaire_type,
  routes_used,
  usual_route_effectiveness
) VALUES (
  'd1-core-probe-invalid-context',
  'd1-core-probe-project',
  'd1-core-probe-participant-fact-pack',
  'manager',
  'not-json',
  9
);

SELECT
  (
    (SELECT count(*) FROM client_projects
      WHERE project_id = 'd1-core-probe-invalid-project')
    + (SELECT count(*) FROM client_participants
      WHERE participant_id = 'd1-core-probe-invalid-participant')
    + (SELECT count(*) FROM client_responses
      WHERE response_id = 'd1-core-probe-invalid-response')
    + (SELECT count(*) FROM client_fact_packs
      WHERE fact_pack_id = 'd1-core-probe-invalid-fact-pack')
    + (SELECT count(*) FROM client_functional_signal_requests
      WHERE signal_request_id = 'd1-core-probe-invalid-signal')
    + (SELECT count(*) FROM client_service_access_context
      WHERE context_id = 'd1-core-probe-invalid-context')
  ) AS invalid_rows_accepted;

DELETE FROM client_projects
WHERE project_id = 'd1-core-probe-project';

SELECT
  (
    (SELECT count(*) FROM client_projects
      WHERE project_id LIKE 'd1-core-probe-%')
    + (SELECT count(*) FROM client_participants
      WHERE participant_id LIKE 'd1-core-probe-%')
    + (SELECT count(*) FROM client_responses
      WHERE response_id LIKE 'd1-core-probe-%')
    + (SELECT count(*) FROM client_dimension_scores
      WHERE score_id LIKE 'd1-core-probe-%')
    + (SELECT count(*) FROM client_fact_packs
      WHERE fact_pack_id LIKE 'd1-core-probe-%')
    + (SELECT count(*) FROM client_functional_signal_requests
      WHERE signal_request_id LIKE 'd1-core-probe-%')
    + (SELECT count(*) FROM client_service_access_context
      WHERE context_id LIKE 'd1-core-probe-%')
  ) AS remaining_probe_rows;

PRAGMA quick_check;

-- Smoke test for migrations/0003_create_crm_prospects.sql.
-- Uses reserved deterministic UUIDs and removes every probe row.

PRAGMA foreign_keys = ON;

INSERT INTO diagnostic_submissions (
  id,
  submission_id,
  submission_source
) VALUES (
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000302',
  'd1_crm_smoke_test'
);

INSERT INTO advisor_prospects (
  prospect_id,
  name,
  company,
  source,
  segment,
  observed_signals,
  linked_submission_id,
  relationship_strength,
  deal_stage,
  lead_temperature,
  contact_email
) VALUES (
  '00000000-0000-4000-8000-000000000303',
  'D1 advisor probe',
  'Van Esch QA',
  'website',
  'smb',
  '["manual-work","unclear-ownership"]',
  '00000000-0000-4000-8000-000000000302',
  'medium',
  'contacted',
  'warm',
  'd1-advisor-probe@example.invalid'
);

INSERT INTO advisor_prospect_activity (
  activity_id,
  prospect_id,
  linked_submission_id,
  activity_type,
  note_type,
  note
) VALUES (
  '00000000-0000-4000-8000-000000000304',
  '00000000-0000-4000-8000-000000000303',
  '00000000-0000-4000-8000-000000000302',
  'note_added',
  'internal',
  'D1 CRM smoke test'
);

INSERT INTO health_check_prospects (
  prospect_id,
  submission_id,
  name,
  company,
  relationship,
  status,
  source
) VALUES (
  '00000000-0000-4000-8000-000000000305',
  '00000000-0000-4000-8000-000000000302',
  'D1 Health Check probe',
  'Van Esch QA',
  'weak',
  'not_contacted',
  'website'
);

INSERT INTO health_check_prospect_activity (
  activity_id,
  prospect_id,
  submission_id,
  activity_type,
  note
) VALUES (
  '00000000-0000-4000-8000-000000000306',
  '00000000-0000-4000-8000-000000000305',
  '00000000-0000-4000-8000-000000000302',
  'created',
  'D1 CRM smoke test'
);

SELECT
  (SELECT count(*) FROM advisor_prospects
    WHERE prospect_id = '00000000-0000-4000-8000-000000000303')
    AS advisor_prospect_rows,
  (SELECT count(*) FROM advisor_prospect_activity
    WHERE activity_id = '00000000-0000-4000-8000-000000000304')
    AS advisor_activity_rows,
  (SELECT count(*) FROM health_check_prospects
    WHERE prospect_id = '00000000-0000-4000-8000-000000000305')
    AS health_check_prospect_rows,
  (SELECT count(*) FROM health_check_prospect_activity
    WHERE activity_id = '00000000-0000-4000-8000-000000000306')
    AS health_check_activity_rows,
  json_extract(observed_signals, '$[0]') AS first_signal
FROM advisor_prospects
WHERE prospect_id = '00000000-0000-4000-8000-000000000303';

INSERT OR IGNORE INTO advisor_prospects (
  prospect_id,
  source,
  observed_signals
) VALUES (
  '00000000-0000-4000-8000-000000000307',
  'invalid-source',
  'not-json'
);

INSERT OR IGNORE INTO health_check_prospects (
  prospect_id,
  submission_id,
  relationship,
  status,
  source
) VALUES (
  '00000000-0000-4000-8000-000000000308',
  '00000000-0000-4000-8000-000000000302',
  'invalid-relationship',
  'invalid-status',
  'invalid-source'
);

SELECT
  (SELECT count(*) FROM advisor_prospects
    WHERE prospect_id = '00000000-0000-4000-8000-000000000307')
  +
  (SELECT count(*) FROM health_check_prospects
    WHERE prospect_id = '00000000-0000-4000-8000-000000000308')
  AS invalid_rows_accepted;

DELETE FROM diagnostic_submissions
WHERE submission_id = '00000000-0000-4000-8000-000000000302';

SELECT
  (SELECT count(*) FROM advisor_prospects
    WHERE prospect_id = '00000000-0000-4000-8000-000000000303'
      AND linked_submission_id IS NULL)
    AS advisor_set_null_rows,
  (SELECT count(*) FROM advisor_prospect_activity
    WHERE activity_id = '00000000-0000-4000-8000-000000000304'
      AND linked_submission_id IS NULL)
    AS advisor_activity_set_null_rows,
  (SELECT count(*) FROM health_check_prospects
    WHERE prospect_id = '00000000-0000-4000-8000-000000000305')
    AS health_check_rows_after_cascade,
  (SELECT count(*) FROM health_check_prospect_activity
    WHERE activity_id = '00000000-0000-4000-8000-000000000306')
    AS health_check_activity_rows_after_cascade;

DELETE FROM advisor_prospects
WHERE prospect_id = '00000000-0000-4000-8000-000000000303';

SELECT
  (SELECT count(*) FROM advisor_prospects
    WHERE prospect_id = '00000000-0000-4000-8000-000000000303')
    AS remaining_advisor_prospect_rows,
  (SELECT count(*) FROM advisor_prospect_activity
    WHERE activity_id = '00000000-0000-4000-8000-000000000304')
    AS remaining_advisor_activity_rows,
  (SELECT count(*) FROM diagnostic_submissions
    WHERE submission_id = '00000000-0000-4000-8000-000000000302')
    AS remaining_submission_rows;

PRAGMA foreign_key_check;
PRAGMA quick_check;

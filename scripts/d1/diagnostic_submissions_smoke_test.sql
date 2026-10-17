-- Repeatable smoke test for the diagnostic_submissions D1 schema.
-- All rows use reserved synthetic IDs and are removed before completion.

DELETE FROM diagnostic_submissions
WHERE id IN (
  '00000000-0000-4000-8000-000000000100',
  '00000000-0000-4000-8000-000000000101'
)
OR id LIKE 'd1-probe-invalid-%';

INSERT INTO diagnostic_submissions (
  id,
  submission_id,
  public_token,
  completed_at,
  submission_source,
  completion_version,
  company_size,
  industry,
  role,
  country_region,
  email,
  score,
  band,
  process_clarity_score,
  consistency_score,
  service_access_score,
  ownership_score,
  onboarding_score,
  technology_alignment_score,
  knowledge_self_service_score,
  operational_capacity_score,
  data_handoffs_score,
  change_resilience_score,
  answers,
  advisor_brief
) VALUES (
  '00000000-0000-4000-8000-000000000100',
  '00000000-0000-4000-8000-000000000200',
  'd1-probe-public-token',
  '2026-09-16T10:00:00.000Z',
  'health-check',
  'v1',
  '51-200',
  'Professional services',
  'HR leader',
  'United Kingdom',
  'probe@example.invalid',
  50,
  'Developing Structure',
  3,
  3,
  2,
  3,
  4,
  3,
  3,
  2,
  3,
  3,
  '{"1":3,"2":3,"3":2,"4":3,"5":4,"6":3,"7":3,"8":2,"9":3,"10":3}',
  '{"headline":"Synthetic D1 smoke test"}'
);

INSERT INTO diagnostic_submissions (
  id,
  submission_id,
  contact_name,
  contact_email,
  contact_company,
  contact_topic,
  contact_message,
  contact_source,
  contact_submitted_at,
  submission_source
) VALUES (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000201',
  'D1 Probe',
  'probe@example.invalid',
  'Synthetic Company',
  'Smoke test',
  'Synthetic contact record for D1 schema validation.',
  'website',
  '2026-09-16T10:00:00.000Z',
  'website-contact'
);

SELECT
  COUNT(*) AS valid_rows,
  SUM(submission_source = 'health-check') AS health_check_rows,
  SUM(submission_source = 'website-contact') AS contact_rows,
  SUM(status = 'new') AS default_status_rows,
  json_extract(
    MAX(CASE WHEN submission_source = 'health-check' THEN answers END),
    '$."1"'
  ) AS answer_one
FROM diagnostic_submissions
WHERE id IN (
  '00000000-0000-4000-8000-000000000100',
  '00000000-0000-4000-8000-000000000101'
);

INSERT OR IGNORE INTO diagnostic_submissions (
  id,
  submission_id,
  status
) VALUES (
  'd1-probe-invalid-status',
  '00000000-0000-4000-8000-000000000300',
  'invalid'
);

INSERT OR IGNORE INTO diagnostic_submissions (
  id,
  submission_id,
  score
) VALUES (
  'd1-probe-invalid-score',
  '00000000-0000-4000-8000-000000000301',
  101
);

INSERT OR IGNORE INTO diagnostic_submissions (
  id,
  submission_id,
  process_clarity_score
) VALUES (
  'd1-probe-invalid-dimension',
  '00000000-0000-4000-8000-000000000302',
  6
);

INSERT OR IGNORE INTO diagnostic_submissions (
  id,
  submission_id,
  answers
) VALUES (
  'd1-probe-invalid-answers',
  '00000000-0000-4000-8000-000000000303',
  'not-json'
);

INSERT OR IGNORE INTO diagnostic_submissions (
  id,
  submission_id,
  advisor_brief
) VALUES (
  'd1-probe-invalid-advisor-brief',
  '00000000-0000-4000-8000-000000000304',
  'not-json'
);

INSERT OR IGNORE INTO diagnostic_submissions (
  id,
  submission_id
) VALUES (
  'd1-probe-invalid-duplicate-submission',
  '00000000-0000-4000-8000-000000000200'
);

INSERT OR IGNORE INTO diagnostic_submissions (
  id,
  submission_id,
  public_token
) VALUES (
  'd1-probe-invalid-duplicate-token',
  '00000000-0000-4000-8000-000000000305',
  'd1-probe-public-token'
);

SELECT COUNT(*) AS invalid_rows_accepted
FROM diagnostic_submissions
WHERE id LIKE 'd1-probe-invalid-%';

SELECT
  COUNT(*) AS unique_submission_id_rows
FROM diagnostic_submissions
WHERE submission_id = '00000000-0000-4000-8000-000000000200';

SELECT
  COUNT(*) AS unique_public_token_rows
FROM diagnostic_submissions
WHERE public_token = 'd1-probe-public-token';

DELETE FROM diagnostic_submissions
WHERE id IN (
  '00000000-0000-4000-8000-000000000100',
  '00000000-0000-4000-8000-000000000101'
)
OR id LIKE 'd1-probe-invalid-%';

SELECT COUNT(*) AS remaining_probe_rows
FROM diagnostic_submissions
WHERE id IN (
  '00000000-0000-4000-8000-000000000100',
  '00000000-0000-4000-8000-000000000101'
)
OR id LIKE 'd1-probe-invalid-%';

PRAGMA quick_check;

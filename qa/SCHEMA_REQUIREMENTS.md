# Diagnostic QA database schema requirements register

## Purpose

This register defines the database objects that the Van Esch Advisory Client Diagnostic QA environment must reproduce so that synthetic organisations can be seeded and analysed using the same application code as production.

It is intentionally based only on repository evidence. It does not attempt to recreate unknown Supabase constraints, triggers, policies or function bodies from inference.

The QA environment must contain synthetic data only. Production respondent data must never be copied into it.

## Environment isolation

The QA tooling should use dedicated environment variables:

- `QA_SUPABASE_URL`
- `QA_SUPABASE_SERVICE_ROLE_KEY`
- `QA_ALLOW_DESTRUCTIVE_TESTS=true`

QA scripts should refuse destructive operations unless the explicit QA flag is present. Cleanup should target reserved QA projects only, never truncate shared tables.

## Core tables required for analytical QA

### `client_projects`

Required by project summary, Explorer and project administration.

Repository-confirmed columns used by the current diagnostic path:

- `project_id`
- `project_name`
- `company_name`
- `primary_contact_name`
- `primary_contact_email`
- `project_status`
- `notes`
- `segmentation_schema`
- `created_at`
- `updated_at`

Other project administration columns are used elsewhere in the application, including billing/contact and commercial metadata. They are not required for the first analytical QA harness unless the QA scope expands to full project-management workflow testing.

Known write behaviour:

- project creation inserts `project_name`, `company_name`, `primary_contact_name`, `primary_contact_email`, `project_status`, and `segmentation_schema`.

### `client_participants`

Required for respondent population, perspective counts, segmentation, participation status, invitation state and all filtered cohort logic.

Repository-confirmed columns used by current diagnostic flows:

- `participant_id`
- `project_id`
- `questionnaire_type`
- `role_label`
- `name`
- `email`
- `segmentation_values`
- `participant_status`
- `invite_token`
- `invited_at`
- `invite_expires_at`
- `started_at`
- `completed_at`
- `updated_at`

Scored questionnaire types currently used by the analytical engine:

- `hr`
- `manager`
- `leadership`

Additional non-scored participant type used by the Fact Pack workflow:

- `client_fact_pack`

Known write behaviour:

- project creation inserts participant rows with questionnaire type, role label, name, email, segmentation values, invitation status and dates.
- the database appears to supply or manage `participant_id` and `invite_token`; the exact defaults/triggers must be copied from the real schema rather than guessed.

### `client_responses`

Required for item-level scored evidence and qualitative evidence.

Repository-confirmed columns used by current analytical code:

- `project_id`
- `participant_id`
- `questionnaire_type`
- `dimension_key`
- `question_key`
- `answer_value`
- `comment_text`
- `updated_at`

Scored rows use `answer_value` and a null comment. Probe rows use `comment_text` and a null score.

The project summary reads item-level scored responses independently from `client_dimension_scores`; both therefore need to be seeded consistently for QA.

### `client_dimension_scores`

Required for dimension-level analysis, segmentation analytics and Explorer cohort calculations.

Repository-confirmed columns:

- `score_id`
- `project_id`
- `participant_id`
- `questionnaire_type`
- `dimension_key`
- `average_score`
- `response_count`
- `updated_at`

Current submission logic calculates a dimension average from scored questionnaire items and rounds it to two decimal places before persistence.

For QA, expected-result fixtures should independently define the source item answers and expected dimension averages so that an incorrect aggregation implementation cannot validate itself.

### `client_fact_packs`

Required for organisational context / Fact Pack testing.

Repository-confirmed columns used by the diagnostic:

- `project_id`
- `participant_id`
- `status`
- `submitted_at`
- `updated_at`
- `response_json`

The application reads Fact Pack data as contextual evidence. It must not alter scored evidence.

### `client_service_access_context`

Required for contextual Service Access testing and contradictory-context scenarios.

Repository-confirmed columns:

- `project_id`
- `participant_id`
- `questionnaire_type`
- `routes_used`
- `usual_route`
- `usual_route_effectiveness`
- `intended_access_model`
- `intended_primary_route`
- `specific_route_detail`

Current product behaviour supports this context for HR and Manager questionnaires, not Leadership.

## Database functions / RPCs required for full submission-path QA

### `submit_client_diagnostic`

Called by the questionnaire submission route.

Repository-confirmed arguments:

- `p_project_id`
- `p_participant_id`
- `p_invite_token`
- `p_questionnaire_type`
- `p_response_rows`
- `p_dimension_score_rows`
- `p_service_access_context`

The function is responsible for transactional submission behaviour and therefore should be replicated if QA is intended to validate the actual participant submission workflow, state transitions, duplicate-submission protection and persistence logic.

For the first analytical QA phase, direct synthetic seeding of the resulting tables may be preferable because it allows precisely engineered edge cases. A later QA track should exercise the RPC itself.

### `save_client_fact_pack`

Called by the Fact Pack submission route.

Repository-confirmed arguments:

- `p_project_id`
- `p_participant_id`
- `p_invite_token`
- `p_response_json`
- `p_mode`

This function should be replicated before testing the full Fact Pack submission path. Directly seeded Fact Pack rows are sufficient for the first interpretation QA phase.

## Application logic that must remain shared with production

The QA harness should invoke the same production analysis functions rather than duplicate their logic, including:

- `buildProjectSummary`
- `buildExplorerCohort`
- analysis / insight / narrative engines called by the project summary
- client-reporting projection and anti-differencing logic where applicable

Expected results must live separately as fixture assertions.

## Schema details that remain unconfirmed from repository code

The following must be exported from Supabase or recovered from authoritative migration history. They should not be inferred from TypeScript usage:

- exact PostgreSQL data types
- primary keys
- foreign keys and cascade behaviour
- unique constraints
- check constraints
- default values
- generated columns
- indexes
- triggers
- RLS enablement and policies
- grants
- sequence/default UUID generation
- functions and function bodies
- function security mode (`SECURITY DEFINER` / `SECURITY INVOKER`)
- table ownership / schema placement
- any additional tables written indirectly by triggers or RPCs

## Minimum first-phase QA schema

To run the synthetic methodology, weighting, confidentiality and Explorer QA programme, the initial QA database needs at minimum:

1. `client_projects`
2. `client_participants`
3. `client_responses`
4. `client_dimension_scores`
5. `client_fact_packs`
6. `client_service_access_context`

The two RPCs can be added immediately if the schema export includes them, but the first deterministic analytical fixtures can be seeded directly without using the end-user submission workflow.

## Recommended schema replication method

Use Supabase/PostgreSQL schema export from the existing project and apply the schema-only output to a new isolated Supabase QA project.

Requirements:

- schema only, never production table data
- include functions, constraints, triggers and policies needed by the diagnostic
- review the export before applying it to QA
- do not copy production auth users or respondent records
- keep QA credentials separate from production credentials

Once the schema-only clone exists, GitHub Actions can be given `QA_SUPABASE_URL` and `QA_SUPABASE_SERVICE_ROLE_KEY` as environment secrets. The test harness never needs to expose the secret values.

## First validation checkpoint after schema replication

Before seeding Northstar, the QA harness should run a schema smoke test that confirms:

- all six required tables are reachable
- required columns can be selected
- a reserved QA project can be inserted and deleted
- participant rows can be inserted with synthetic segmentation JSON
- score and response rows can be inserted and read back
- Fact Pack and Service Access context can be inserted and read back
- cleanup removes only the reserved QA project and its dependent synthetic records

Only after that smoke test passes should the Northstar fixture be loaded.

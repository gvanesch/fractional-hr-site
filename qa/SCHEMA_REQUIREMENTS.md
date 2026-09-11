# Diagnostic QA database schema requirements register

## Purpose

This register defines the database objects that the Van Esch Advisory Client Diagnostic QA environment must reproduce so that synthetic organisations can be seeded and analysed using the same application code as production.

The schema metadata in this file has now been cross-checked directly against the active Supabase project's PostgreSQL metadata. No respondent rows or secret values were queried.

The QA environment must contain synthetic data only. Production respondent data must never be copied into it.

## Environment isolation

The QA tooling should use dedicated environment variables:

- `QA_SUPABASE_URL`
- `QA_SUPABASE_SERVICE_ROLE_KEY`
- `QA_ALLOW_DESTRUCTIVE_TESTS=true`

QA scripts should refuse destructive operations unless the explicit QA flag is present. Cleanup should target reserved QA projects only, never truncate shared tables.

## Confirmed database enum types

### `client_questionnaire_type`

Current values:

- `hr`
- `manager`
- `leadership`
- `client_fact_pack`
- `payroll`

The current Client Diagnostic analytical path uses HR, Manager and Leadership as scored perspectives. `client_fact_pack` is contextual. `payroll` exists in the database enum but is not currently part of the three-perspective Client Diagnostic methodology and should not be silently included in diagnostic QA calculations.

### `client_participant_status`

Current values:

- `invited`
- `started`
- `completed`
- `archived`

## Core tables required for analytical QA

### `client_projects`

Confirmed columns and relevant defaults:

- `project_id uuid not null default gen_random_uuid()`
- `company_name text not null`
- `primary_contact_name text not null`
- `primary_contact_email text not null`
- `project_status text not null default 'active'`
- `notes text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `project_name text null`
- `status text null default 'draft'`
- `segmentation_schema jsonb null`
- `billing_contact_name text null`
- `billing_contact_email text null`
- `company_website text null`
- `purchase_order_number text null`
- `msa_status text null`
- `dpa_status text null`

Confirmed constraints:

- primary key: `project_id`
- `msa_status` is null or one of `not_started`, `in_review`, `signed`
- `dpa_status` is null or one of `not_required`, `required`, `signed`

Confirmed indexes include:

- primary key on `project_id`
- index on `company_name`
- index on `primary_contact_email`

Confirmed trigger:

- `BEFORE UPDATE` -> `set_updated_at()`

RLS is enabled. A deny-all public policy is present: `no_access_client_projects`.

### `client_participants`

Confirmed columns and relevant defaults:

- `participant_id uuid not null default gen_random_uuid()`
- `project_id uuid not null`
- `questionnaire_type client_questionnaire_type not null`
- `role_label text not null`
- `invite_token uuid not null default gen_random_uuid()`
- `participant_status client_participant_status not null default 'invited'`
- `started_at timestamptz null`
- `completed_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `name text null`
- `email text null`
- `status text null default 'invited'`
- `invited_at timestamptz null default now()`
- `segmentation_values jsonb null`
- `invite_expires_at timestamptz null`
- `invite_revoked_at timestamptz null`
- `invite_last_used_at timestamptz null`
- `withdraw_reason text null`
- `withdraw_note text null`
- `withdrawn_at timestamptz null`
- `reinstate_reason text null`
- `reinstate_note text null`
- `reinstated_at timestamptz null`

Confirmed constraints:

- primary key: `participant_id`
- foreign key `project_id -> client_projects(project_id) ON DELETE CASCADE`
- unique `invite_token`

Confirmed indexes include project, questionnaire type, participant status and invite token indexes. There are currently duplicate project and token indexes in addition to the unique invite-token index; QA should reproduce schema behaviour, but performance cleanup is a separate concern.

Confirmed trigger:

- `BEFORE UPDATE` -> `set_updated_at()`

RLS is enabled. A deny-all public policy is present: `no_access_client_participants`.

### `client_responses`

Confirmed columns and relevant defaults:

- `response_id uuid not null default gen_random_uuid()`
- `project_id uuid not null`
- `participant_id uuid not null`
- `questionnaire_type client_questionnaire_type not null`
- `dimension_key text not null`
- `question_key text not null`
- `answer_value integer null`
- `comment_text text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `responses jsonb null`
- `submitted_at timestamptz null default now()`

Confirmed constraints:

- primary key: `response_id`
- `answer_value` must be null or between 1 and 5
- questionnaire type is restricted to `hr`, `manager`, `leadership` or `payroll`
- foreign keys to project and participant with `ON DELETE CASCADE`
- unique `(participant_id, question_key)`

The database currently contains two foreign-key constraints from `participant_id` to `client_participants(participant_id)`. This duplication should be preserved for schema fidelity in the first QA branch, then reviewed separately as schema hygiene.

Confirmed indexes include project, participant, questionnaire type, dimension and question-key indexes.

Confirmed trigger:

- `BEFORE UPDATE` -> `set_updated_at()`

RLS is enabled. A deny-all public policy is present: `no_access_client_responses`.

### `client_dimension_scores`

Confirmed columns and relevant defaults:

- `score_id uuid not null default gen_random_uuid()`
- `project_id uuid not null`
- `questionnaire_type client_questionnaire_type not null`
- `dimension_key text not null`
- `average_score numeric not null`
- `response_count integer not null default 0`
- `updated_at timestamptz not null default now()`
- `participant_id uuid null`
- `score numeric null`

Confirmed constraints:

- primary key: `score_id`
- questionnaire type restricted to `hr`, `manager`, `leadership` or `payroll`
- foreign key `project_id -> client_projects(project_id) ON DELETE CASCADE`
- unique `(project_id, participant_id, questionnaire_type, dimension_key)`

Notably, the metadata does not currently show a foreign key from `participant_id` to `client_participants`. The QA schema should reproduce this accurately rather than assuming one exists.

Confirmed indexes include project, participant/questionnaire grouping, questionnaire type and dimension key.

Confirmed trigger:

- `BEFORE UPDATE` -> `set_updated_at()`

RLS is enabled. A deny-all public policy is present: `no_access_client_dimension_scores`.

### `client_fact_packs`

Confirmed columns and relevant defaults:

- `fact_pack_id uuid not null default gen_random_uuid()`
- `project_id uuid not null`
- `participant_id uuid not null`
- `invite_token text null`
- `response_json jsonb not null default '{}'`
- `status text not null default 'in_progress'`
- `submitted_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Confirmed constraints:

- primary key: `fact_pack_id`
- status is one of `in_progress`, `completed`
- foreign keys to project and participant with `ON DELETE CASCADE`
- unique `participant_id`

RLS is enabled. A deny-all public policy is present: `no_access_client_fact_packs`.

### `client_service_access_context`

Confirmed columns and relevant defaults:

- `context_id uuid not null default gen_random_uuid()`
- `project_id uuid not null`
- `participant_id uuid not null`
- `questionnaire_type text not null`
- `routes_used text[] not null default '{}'`
- `usual_route text null`
- `usual_route_effectiveness smallint null`
- `intended_primary_route text null`
- `specific_route_detail text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `intended_access_model text null`

Confirmed constraints:

- primary key: `context_id`
- questionnaire type limited to `hr` or `manager`
- usual-route effectiveness null or between 1 and 5
- foreign keys to project and participant with `ON DELETE CASCADE`
- unique `participant_id`

Confirmed indexes:

- unique participant index
- project index

RLS is enabled. No explicit policy was returned for this table in the metadata query. That means we should explicitly verify role/grant behaviour in the isolated QA branch rather than infer it from the other five tables.

## Database functions / RPCs

### `submit_client_diagnostic`

Two overloads currently exist in `public`.

#### Current application path, seven arguments

Arguments:

- `p_project_id uuid`
- `p_participant_id uuid`
- `p_invite_token uuid`
- `p_questionnaire_type client_questionnaire_type`
- `p_response_rows jsonb`
- `p_dimension_score_rows jsonb`
- `p_service_access_context jsonb`

Returns `jsonb`.

Confirmed properties:

- PL/pgSQL
- `SECURITY DEFINER`
- `search_path` fixed to `public`
- validates project state, participant state, token, expiry and questionnaire type
- rejects service-access context for Leadership
- replaces the participant's existing response and dimension-score rows transactionally
- optionally upserts Service Access context
- marks the participant completed

This is the function invoked by the current questionnaire submission route.

#### Legacy-compatible six-argument overload

The same function name also exists without `p_service_access_context`. It performs the same core submission flow but does not persist Service Access context.

QA should reproduce both overloads initially because they exist in the authoritative schema. A later schema-hygiene review can determine whether the older overload is still required.

### `save_client_fact_pack`

Arguments:

- `p_project_id uuid`
- `p_participant_id uuid`
- `p_invite_token uuid`
- `p_response_json jsonb`
- `p_mode text`

Returns `jsonb`.

Confirmed properties:

- PL/pgSQL
- `SECURITY DEFINER`
- `search_path` fixed to `public`
- mode must be `draft` or `submit`
- validates project state, participant identity/type, token, expiry and archive/completion state
- upserts one Fact Pack row per participant
- changes participant status to started or completed as appropriate

## Application logic that must remain shared with production

The QA harness should invoke the same production analysis functions rather than duplicate their logic, including:

- `buildProjectSummary`
- `buildExplorerCohort`
- analysis / insight / narrative engines called by the project summary
- client-reporting projection and anti-differencing logic where applicable

Expected results must live separately as fixture assertions.

## Confirmed security posture relevant to QA

All six core tables currently have Row Level Security enabled.

Five return an explicit deny-all public policy:

- `client_projects`
- `client_participants`
- `client_responses`
- `client_dimension_scores`
- `client_fact_packs`

`client_service_access_context` has RLS enabled but no policy returned by `pg_policies` in the metadata inspection. Service-role access bypasses RLS, but the QA environment should reproduce the production schema exactly before we independently review whether this is intentional.

## Minimum first-phase QA schema

The isolated QA database needs at minimum:

1. `client_projects`
2. `client_participants`
3. `client_responses`
4. `client_dimension_scores`
5. `client_fact_packs`
6. `client_service_access_context`
7. enum types `client_questionnaire_type` and `client_participant_status`
8. `set_updated_at()` trigger function and the confirmed table triggers
9. both current `submit_client_diagnostic` overloads
10. `save_client_fact_pack`
11. current constraints, indexes and RLS configuration

## Recommended replication method

Now that Supabase is connected, a Supabase development branch is preferable to manually reconstructing the schema. Supabase branching creates a fresh branch database from the main project's migrations without carrying over production table data.

This provides stronger isolation while preserving authoritative schema behaviour. Synthetic QA data can then be created and destroyed on that branch without touching live respondent data.

Before creating a branch we must confirm its Supabase cost and obtain explicit approval because the connector treats branch creation as a billable operation.

## First validation checkpoint after branch creation

Before seeding Northstar, the QA harness should run a schema smoke test that confirms:

- all six required tables are reachable
- enum values match expected values
- current function overloads exist
- required columns can be selected
- a reserved QA project can be inserted and deleted
- participant rows can be inserted with synthetic segmentation JSON
- score and response rows can be inserted and read back
- Fact Pack and Service Access context can be inserted and read back
- cleanup removes only the reserved QA project and its dependent synthetic records
- no production rows exist in the branch

Only after that smoke test passes should the Northstar fixture be loaded.

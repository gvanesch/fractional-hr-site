# Supabase to Cloudflare D1 migration

## Goal

Migrate the Van Esch Advisory website and advisor/client diagnostic platform from Supabase to Cloudflare D1 without reducing security, data protection, auditability, availability, or functional behaviour.

The migration should simplify the platform around the existing Cloudflare Workers/OpenNext deployment and remove the recurring Supabase dependency once all production workloads and data have been safely cut over.

## Non-negotiable controls

1. Production must remain recoverable throughout the migration.
2. Supabase remains authoritative until an explicit production cutover gate is passed.
3. No production respondent data may be copied into the QA database. QA remains synthetic-only.
4. Security behaviour must not be weakened to make the migration easier.
5. Advisor routes and advisor management APIs must remain protected.
6. Client diagnostic invitations, OTP verification, session validation, expiry, revocation, brute-force controls and fail-closed behaviour must be preserved.
7. Database writes that are currently transactional must remain atomic after migration.
8. Production and QA must use separate D1 databases.
9. D1 databases containing production/QA client data must be created with the EU jurisdiction at creation time.
10. Supabase must not be removed from the privacy/subprocessor disclosures until it has stopped processing or storing live personal data for the service.
11. After cutover, all website, privacy policy, subprocessor, documentation, monitoring and operational references to Supabase must be reviewed and either removed or retained explicitly as historical documentation.
12. OpenNext to vinext migration is out of scope for this project. The existing OpenNext deployment remains in place while the database migration is completed.

## Current platform position

The application is already deployed as a Next.js/OpenNext Cloudflare Worker. Supabase is primarily providing:

- PostgreSQL persistence
- advisor authentication/session handling
- PostgREST/database access
- database RPC functions containing transactional/security logic
- limited Edge Function functionality

Supabase Storage is not currently used for application objects.

### Current live data footprint at migration discovery

The production database is currently very small:

- advisor prospects: 4
- advisor prospect activity: 31
- diagnostic submissions: 3
- health-check prospects: 1
- health-check prospect activity: 0
- system events: 33
- client projects: 0
- client participants: 0
- client responses: 0
- client dimension scores: 0
- client fact packs: 0
- client functional signal requests: 0
- client participant OTP challenges: 0
- client participant verified sessions: 0
- Supabase Auth users: 1
- Supabase Storage objects: 0

This makes the current period preferable to a later migration after real client diagnostic data has accumulated.

## Migration architecture

Target application path:

```text
Browser
  -> Next.js / OpenNext on Cloudflare Workers
      -> application data/service layer
          -> Cloudflare D1 binding
```

Advisor authentication target:

```text
/advisor and protected advisor APIs
  -> Cloudflare Access
      -> application authorization check
          -> D1
```

Client diagnostic participant authentication remains separate from advisor authentication:

```text
invitation token
  + email OTP
  + short-lived verified session
  -> server-side application checks
  -> D1
```

## D1 database model principles

Do not mechanically reproduce PostgreSQL-specific implementation details when D1-native equivalents are clearer.

Expected type translations:

- PostgreSQL `uuid` -> D1 `TEXT`, generated in application code with `crypto.randomUUID()`
- `timestamptz` -> ISO-8601 `TEXT`
- PostgreSQL enums -> `TEXT` plus `CHECK` constraints
- `jsonb` -> JSON serialized as `TEXT`
- `text[]` -> JSON array serialized as `TEXT`
- integer/smallint -> `INTEGER`
- numeric scores -> `REAL` where decimal values are required

Preserve:

- primary keys
- required uniqueness constraints
- foreign-key relationships
- cascade behaviour where intentional
- important check constraints
- indexes required by application access paths

Do not deliberately reproduce known duplicate constraints/indexes unless testing shows they are required for behaviour.

## Confirmed Supabase-dependent areas

### Infrastructure / database clients

- `lib/supabase/admin.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/environment.ts`
- `package.json` Supabase dependencies
- Supabase environment variables and deployment configuration

### Authentication and middleware

- `middleware.ts`
- `lib/advisor-auth.ts`
- `app/advisor/login/AdvisorLoginForm.tsx`
- `app/api/advisor-logout/route.ts`
- advisor management API routes that currently validate Supabase sessions

### Public Health Check / contact path

- `app/api/diagnostic-complete/route.ts`
- `app/api/contact/route.ts`
- public diagnostic result retrieval
- CRM/prospect linking and advisor review paths

The public routes already execute through the application server layer, so these are good early migration candidates.

### Advisor / CRM data paths

Supabase is used by advisor dashboard reads and prospect/project CRUD, including:

- advisor dashboard aggregation
- advisor prospects and activity
- Health Check prospects and activity
- client diagnostic projects
- project/participant administration
- project status and metadata

### Client diagnostic transactional/security paths

These are the highest-risk migration area and must not be converted as ordinary CRUD:

- invite rate limiting
- OTP challenge issuance
- OTP verification and failed-attempt handling
- verified session creation/validation/revocation
- diagnostic submission
- dimension score persistence
- Service Access context persistence
- Client Fact Pack draft/save/submit
- participant status transitions
- invite expiry/revocation/completion checks

Current PostgreSQL RPCs include transactional/security behaviour that must be reimplemented deliberately in the TypeScript service layer with D1 atomic operations/batches as appropriate.

### Existing Supabase database-side logic

Material functions currently include:

- `check_client_diagnostic_invite_rate_limit`
- `issue_client_participant_otp_challenge`
- `verify_client_participant_otp_challenge`
- `validate_client_participant_verified_session`
- `submit_client_diagnostic`
- `save_client_fact_pack`
- `set_updated_at`
- legacy diagnostic-notification trigger/function

The current database notification function/Edge Function appears to overlap with newer application-level Resend notification behaviour. It should be treated as a legacy candidate and tested before removal rather than automatically ported.

## Privacy and subprocessor register

`app/privacy/page.tsx` currently lists:

- Supabase for database, authentication, verification and data storage
- Cloudflare for hosting, delivery, performance and security services

This disclosure must be changed as part of final production cutover, not during early parallel operation.

Expected post-cutover review should consider wording along the lines of:

- Cloudflare for hosting, application delivery, security and database/data storage services

The final wording must reflect the actual live configuration at cutover and any retained Supabase processing. Supabase should only be removed once no live service data, authentication, verification or production processing remains there.

The wider privacy policy, DPA/subprocessor material, operational documentation and any client-facing security descriptions must also be searched for Supabase references before closure.

## Migration phases

### Phase 0 - Discovery and freeze

Status: COMPLETE

- establish this migration record
- preserve existing production behaviour
- map all Supabase code/config/database dependencies
- record current production schema, functions, constraints, indexes, triggers and data counts
- identify legacy components that should not be ported
- define cutover and rollback gates

Exit gate:

- dependency map is complete enough that no known live path can be accidentally orphaned

### Phase 1 - D1 foundations

Status: COMPLETE

- create `vanesch-prod` D1 with EU jurisdiction
- create `vanesch-qa` D1 with EU jurisdiction
- add D1 bindings/configuration without removing Supabase
- generate Cloudflare binding types
- create source-controlled D1 migrations
- create an application database/service abstraction
- prove local/QA D1 connectivity

Exit gate:

- application can reach QA D1 through the same Worker/OpenNext runtime model as production
- no existing production feature has changed

### Phase 2 - Low-risk persistence paths

Status: IN PROGRESS

Completed foundations and shadow-write coverage:

- system events schema, backfill and exact reconciliation
- public Health Check/contact submission schema and exact reconciliation
- advisor CRM schema, backfill and exact reconciliation
- guarded CRM mutation shadow writes
- guarded public contact and Health Check shadow writes
- application-level D1 write and transaction probes

Remaining in this phase:

- switch eligible reads to D1 after QA reconciliation
- public result lookup cutover testing
- advisor read-only dashboard cutover testing

Original scope:

- system events
- public Health Check submissions
- contact/enquiry persistence
- public diagnostic result lookup
- advisor CRM prospects/activity
- advisor read-only dashboard paths

Supabase remains available for rollback during this phase.

Exit gate:

- D1 behaviour matches existing production behaviour for migrated paths
- duplicate-write/reconciliation testing is complete where used

### Phase 3 - Advisor authentication and authorization

Status: NOT STARTED

- define Cloudflare Access policy for advisor access
- inventory all protected advisor pages and management APIs
- ensure every advisor management endpoint is behind a consistent authorization boundary
- replace Supabase Auth/session dependencies
- remove browser-side Supabase login dependency only after Access is proven

Exit gate:

- unauthorized requests fail closed
- authorized advisor access works for pages and APIs
- direct API attempts cannot bypass advisor protection

### Phase 4 - Client diagnostic security and transactions

Status: IN PROGRESS

Schema prepared on `migration/d1`:

- client diagnostic core tables in `0004_create_client_diagnostic_core.sql`
- rate-limit, OTP challenge and verified-session tables in `0005_create_client_diagnostic_security.sql`
- constraint, uniqueness, JSON and cascade smoke-test scripts for both schema slices

The migrations are source-controlled and build-verified but are not yet applied to the remote D1 databases. Runtime security behaviour remains Supabase-authoritative until the D1 service layer and adversarial tests are complete.

Reimplement and adversarially test:

- invitation validation
- IP-hash rate limiting
- OTP issuance and resend controls
- OTP attempt limits
- OTP invalidation/consumption
- verified session creation and revocation
- session expiry and invitation revalidation
- diagnostic atomic submission
- Fact Pack draft/save/submit
- participant lifecycle transitions

Exit gate:

- security test suite passes
- concurrent/replayed requests do not bypass intended controls
- partial writes cannot leave inconsistent diagnostic state

### Phase 5 - Production data migration and cutover

Status: NOT STARTED

- take final Supabase export/backup
- migrate live production records to D1
- reconcile counts and key relationships
- switch application reads/writes to D1
- deploy with explicit rollback plan
- monitor health, application errors, database writes and email flows
- keep Supabase intact during soak period

Exit gate:

- production flows are stable
- data reconciliation is clean
- rollback is no longer required for normal operation

### Phase 6 - Supabase retirement and compliance update

Status: NOT STARTED

Only after cutover is proven:

- remove Supabase runtime dependencies
- remove unused Supabase environment variables/secrets
- remove obsolete middleware/environment validation
- remove obsolete Edge Functions/triggers from active architecture
- archive final Supabase schema/data export
- pause/downgrade/cancel Supabase as appropriate
- update privacy policy/subprocessor register
- update DPA/security/operational documentation
- update health monitoring and QA documentation
- search repository and website for remaining live Supabase references

Exit gate:

- no production runtime dependency remains
- compliance disclosures match the actual processor/subprocessor chain
- archival documentation is clearly marked historical where Supabase is retained as a reference

## Rollback principle

Until Phase 5 has completed its soak/reconciliation gate, Supabase remains the rollback platform. No destructive Supabase cleanup should occur while production rollback could still be required.

## Progress snapshot: 17 September 2026

- EU-jurisdiction production and QA D1 databases exist and are bound as `DB`.
- Migrations `0001` through `0003` are applied to both databases.
- Production low-risk data was backfilled and reconciled exactly: 3 diagnostic submissions, 33 system events and 36 CRM records.
- CRM mutation routes and public submission routes have guarded D1 shadow-write paths while Supabase remains authoritative.
- GitHub Actions builds every push to `migration/d1`.
- Client diagnostic migrations `0004` and `0005` are committed and build-verified, pending application and smoke testing against QA D1.
- No client diagnostic runtime path has been switched to D1.
- Production D1 feature flags remain off.

## Immediate next work

1. Apply `0004` and `0005` to QA D1 and execute both smoke-test scripts.
2. Add the client diagnostic D1 service layer behind an off-by-default migration flag.
3. Mirror the lower-risk project and participant management writes in QA before porting OTP, session and final-submission transactions.
4. Reconcile QA behavior before any production schema application or runtime cutover.

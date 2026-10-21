# D1 runtime audit — 28 September 2026

Base: `3a59373b96e00d2132b3d48d3e87b51beb589433` on `migration/d1`.
This is a source audit and local test record, not approval or evidence of a production cutover.

## Findings corrected

1. Contact persisted its submission to D1 but always upserted its Health Check CRM record through Supabase. Added the CRM-gated D1 upsert, preserving the existing conflict-update fields and identity.
2. Both scheduled email routes still read Supabase exclusively. Added independently gated D1 reads for projects, participants, prospects and contact submissions; retained shared filtering and email composition. Contact/prospect matching is chunked below D1's parameter limit.
3. The legacy advisor-submission endpoint still required a Supabase session and queried Supabase. It now uses the shared advisor authorization boundary and a diagnostic-submission-gated D1 read with JSON decoding.
4. Project creation and all three OTP helper entry points instantiated Supabase before choosing D1. Moved that construction into the fallback paths.
5. Health status always required Supabase and could report success with unavailable primary D1. Fully migrated data/auth mode now checks D1 alone; partially migrated mode requires both primary backends. In fallback-only mode D1 remains informational.
6. Public submission middleware read a process environment flag rather than the Cloudflare binding used by the routes. It now uses the same feature gate.
7. The broad advisor Access middleware also caught the scheduled advisor digest. The digest retains its separate mandatory cron bearer-secret check; interactive advisor APIs still fail closed through Access. Cloudflare Access application path configuration must make the same distinction.
8. The QA workflow did not trigger for most application/service changes. It now includes app, lib, middleware, tests, package and Wrangler configuration changes, and runs the new D1 regression suite.

## Runtime dependency map

| Surface | D1 implementation / switch | Intentional Supabase remainder |
| --- | --- | --- |
| Health Check completion, public result/email, advisor Health Check lists/detail and legacy API | `D1_DIAGNOSTIC_SUBMISSIONS_MODE=d1`; `lib/d1/diagnostic-submissions.ts` and guarded route/page SQL | Disabled-flag branches only |
| Contact submission and linked Health Check prospect | Diagnostic submission flag plus `D1_CRM_PROSPECTS_MODE=d1` | Disabled-flag writes and explicit shadow replication |
| CRM creation/edit/link/unlink/notes and advisor prospects | CRM flag; guarded route/page SQL and `lib/d1/crm-prospects.ts` | Disabled-flag reads/writes; explicit shadow serializers |
| Advisor dashboard | Each section selects its own data flag in `lib/advisor-dashboard.ts` | Disabled-flag section reads |
| Project creation/update/status/list, participant add/edit/archive/withdraw/reinstate/extend | `D1_CLIENT_DIAGNOSTIC_MODE=d1`; guarded routes, project snapshot writer and participant-admin service | Disabled-flag branches and post-Supabase shadow snapshots |
| Invitations, questionnaire and Fact Pack pages, submission transactions | Client diagnostic flag; D1 read/mutation services | Disabled-flag branches |
| OTP issue/verify/session validation, invitation rate limiting | `D1_CLIENT_DIAGNOSTIC_SECURITY_MODE=d1`; D1 security service | Disabled-flag branches |
| Project summary, report, explorer | Client diagnostic flag in both summary builders and explorer cohort builder | Disabled-flag reads |
| Client daily summary | Client diagnostic flag | Disabled-flag project/participant reads |
| Advisor daily action digest | CRM, diagnostic submission and client diagnostic flags independently | Disabled-flag reads |
| Advisor login/logout/pages/APIs | `ADVISOR_AUTH_MODE=cloudflare_access`; shared JWT/allowlist validation | Supabase login component and server sessions while Access mode is disabled |
| System events | `D1_SYSTEM_EVENTS_MODE=d1` | Off/shadow writes |
| Health endpoint | All five D1 flags and Access mode determine whether Supabase is still required | Required during partial cutover/fallback |

The remaining `lib/supabase/*`, Supabase packages, environment validation and browser login code are deliberately retained for fallback. `lib/d1/client-diagnostic-shadow.ts` reads Supabase only for explicit shadow synchronization; its atomic D1 project writer has no Supabase read dependency. `scripts/d1/export-*.mjs` are migration utilities, not application entry points. Privacy disclosures remain accurate for parallel operation and are unchanged.

Static inspection finds a D1 branch for each identified runtime data/auth surface after these corrections. This does **not** establish deployed end-to-end parity, email delivery, provider configuration, concurrency behavior or a production reconciliation result.

## Verification

`npm run test:d1` uses the real migrations in isolated in-memory SQLite databases and executes the actual TypeScript route/service code. Cloudflare context, advisor identity and email transport are substituted. External network access and Supabase client construction are rejected. No emails are sent.

Seven passing tests cover:

- participant creation, case-insensitive duplicate rejection, editing, invite extension, withdrawal, reinstatement, archive, completed-record protection, closed-project rejection and unauthorized creation;
- daily summary/digest counts, converted-prospect filtering, closed-project exclusion, more than 100 linked-contact candidates, both project summary builders and explorer reads;
- D1 health outage, authorized/unauthorized/missing legacy submission reads;
- OTP issuance, verification and verified-session validation without Supabase configuration;
- contact submission plus its linked CRM record;
- project creation and invitation composition without Supabase configuration;
- fail-closed Access middleware, the separate cron boundary, public contact middleware, and the existing valid/wrong-audience/expired/tampered JWT probe.

Next.js production build, OpenNext Worker bundling, TypeScript checking and lint of changed application files pass.

All three existing probes also passed against the locally bundled Worker and local D1: eight security-service assertions, twelve mutation/read/rollback/cleanup assertions, and four Access JWT assertions. Local migrations 0001–0005 were applied only to disposable local D1. The sandbox required explicit preview ports and running the HTTP probes in the same shell as the Worker process. No remote database was modified. These checks do not establish hosted QA browser behavior or real email delivery.

Remote continuation is blocked in this session: GitHub cloning works, but a push dry run fails because no GitHub username/credential is available. No Cloudflare API token or Supabase export credentials are provisioned. The GitHub integration has been suggested but its connection is not confirmed. No new CI result, remote QA deployment, delta export or reconciliation is claimed.

## QA configuration and outstanding gates

The five D1 flags and `ADVISOR_AUTH_MODE=cloudflare_access` are prepared **only under `env.qa`** in `wrangler.jsonc`. No remote deployment or flag change has been performed by this work. Production flags remain `off`. Before deploying QA, supply/verify the QA Access audience, team domain, allowed advisor emails, OTP/rate-limit secrets and QA-safe mail configuration. QA uses synthetic data only.

Cloudflare Access must protect advisor pages and interactive advisor APIs; it must not intercept the two separately cron-authenticated summary endpoints. Test rejected/missing/tampered JWTs and non-allowlisted users on direct API requests as well as pages. Missing Access values fail closed.

Remaining required sequence:

1. Push these fixes and verify both GitHub workflows at the new commit.
2. Deploy the QA configuration to `fractional-hr-site-qa` / `vanesch-qa` only after validating QA environment values and Access policy. Complete the user's full browser/end-to-end matrix, including email delivery and lifecycle/session invalidation.
3. Fresh production Supabase export and exact D1 reconciliation. Existing export scripts contain discovery-time count assertions (for example 33 events); review these against fresh source evidence rather than assuming the old counts still hold. Do not place production records in QA or commit data/credentials.
4. Request approval for production migrations 0004/0005 only after the earlier gates pass.
5. Configure production Access/environment values, then separately request cutover approval. Keep dependent data/security flags coordinated; CRM links require their diagnostic records in the selected D1 database.
6. Production smoke tests, exact reconciliation and a monitored soak with Supabase retained. Do not claim flag rollback alone recovers writes made only to D1; reconcile those writes before reverting authority.
7. Request retirement approval after soak; only then remove runtime fallback and secrets and update disclosures once Supabase no longer processes or retains production data.

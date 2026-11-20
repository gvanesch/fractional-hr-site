# Supabase retirement — execution record (20 November 2026)

## Scope and current authority
Complete the existing Cloudflare D1 migration. Greg confirmed on 20 November 2026 that **all Supabase application records are test data and none need migration, reconciliation or archival**. The previous record-retention prerequisites below are superseded by this clarification. Preserve the existing D1 databases and the live questionnaires.

Greg has asked for independent implementation now, with notification at genuine decision points, challenges or questions. Verification and implementation proceed without another planning approval. Production changes must follow successful verification of the affected services; do not infer that disposable Supabase records make its still-active authentication safe to turn off.

## Verified starting evidence
- `docs/PRODUCTION_BASELINE_2026-10-16.md`: all five D1 application-data flags enabled, baseline data in dedicated D1 tables; Supabase advisor password authentication and historical recovery retained. This is an October checkpoint, not proof of current live settings.
- `lib/advisor-auth.ts`: existing `ADVISOR_AUTH_MODE=cloudflare_access` branch calls `verifyCloudflareAdvisorAccess`; default branch uses Supabase Auth.
- `lib/cloudflare-access.ts`: existing Access JWT validation with JWKS, issuer, audience and advisor email allowlist; `app/api/cloudflare-access-probe/route.ts` supplies a localhost-only crypto test.
- Supabase `public.diagnostic_submissions` has the legacy `diagnostic_notify` trigger and `diagnostic-notification` Edge Function. **The application D1 Health Check route already sends the advisor email directly through Resend**; no replacement Supabase trigger is needed. Test the D1 path and isolate email failures from the successful database write.
- Supabase project still has 16 public application tables and two active functions (`swift-handler`, `diagnostic-notification`). Their presence is not proof of live use.
- Legacy `SECURITY DEFINER` RPCs remain callable by `anon`/`authenticated`, but inspect real callers before revoking. Existing `docs/security-legacy-rpc-restriction-DRAFT.sql` is not approved for production.

## Work packages
### A. Dependency inventory
- [x] Confirm October D1 production checkpoint and auth code paths.
- [x] Confirm remaining Supabase tables and Edge Functions.
- [x] Trace legacy notification trigger and HTTP call.
- [ ] Inventory all repository Supabase imports, env keys, workflows, runtime fallbacks, scheduled jobs, auth/logout paths and public APIs.
- [ ] Verify actual Cloudflare production environment bindings, Access policies and live deployment through the existing read-only CI credentials.
- [ ] Identify live use of `swift-handler` and notification function, including legacy external callers.

### B. Authentication
- [ ] Review Cloudflare Access policy (protect advisor routes, not public questionnaire endpoints) and allowed identities.
- [ ] Test Cloudflare JWT validation, denied access, permissions, logout, session expiry and advisor UI in QA.
- [ ] Review any Supabase-specific logout and login routes; adapt only as needed.
- [ ] Confirm the deployed Access application protects advisor paths, permits the intended advisor identities and leaves public/participant endpoints usable.

### C. Notifications and legacy APIs
- [x] Trace diagnostic submission and email flows: the D1 path writes its own record and sends its own advisor notification.
- [x] Verify notification error handling and D1-backed event logging using mocked email transport. A saved Health Check now remains successful if the advisor email provider fails; the error is recorded and the participant email is still attempted.
- [ ] Verify all public diagnostic, fact pack, client diagnostic, baseline and CRM paths are D1-authoritative.
- [ ] Prepare permission removal for obsolete RPCs only after caller audit.

### D. D1 acceptance tests
- [x] Local HR Health Check integration: submit synthetic answers, verify the stored SQLite/D1-schema row, result retrieval, CRM linkage and mocked advisor notification.
- [x] Local advisor and CRM integration: actual server pages and authenticated mutations work with Supabase constructors blocked and credentials absent.
- [x] Local project integration: project/participant administration, invitations, OTP, questionnaire save/submit, Fact Packs and reporting work through the D1 data helpers.
- [x] Existing baseline workflow/export regression tests pass; no live questionnaire or D1 record was changed.
- [x] Local notifications, system events and scheduled digest integration uses D1 and the appropriate authorization, with email delivery mocked.
- [x] Next.js and OpenNext Cloudflare Worker builds succeed without Supabase credentials after the Next.js 16.4.5 security patch.
- [ ] Hosted QA and a bounded production smoke test confirm behavior beyond local simulation.

There is no Supabase row-count/checksum parity gate or historical archive requirement. Existing D1 recovery remains relevant to normal operations; it is not evidence that Supabase test data must be retained.

### E. Controlled retirement
- [ ] Complete local and hosted verification, resolve any actual configuration/access blocker and prepare the production candidate.
- [ ] Activate the verified non-Supabase advisor authentication and deploy required fixes; recheck the live workflows.
- [ ] Confirm health reports Supabase is not required and that required journeys produce no Supabase calls.
- [ ] Remove obsolete Supabase configuration from active deployment paths and disable the unused services.
- [ ] Verify shutdown and billing outcome. Distinguish a reversible pause from permanent project deletion.

## Current evidence and challenges
- A read-only GET on 20 November 2026 followed `https://vanesch.uk/api/health` to `https://www.vanesch.uk/api/health` and returned HTTP 200 with `{"status":"ok","supabase":"connected","d1":"connected"}`. D1 connectivity is live; this does not establish that every feature uses D1 or that Supabase can already be paused.
- The new auth integration tests exercise real JWT signature validation, middleware, advisor helpers and login/logout without any Supabase credentials. External Cloudflare Access policy and an actual hosted advisor login still need verification.
- [Read-only CI run 44709422115](https://github.com/gvanesch/fractional-hr-site/actions/runs/44709422115) verified the expected live D1 binding, all five D1 modes and all required tables in both production and QA. Production has not enabled Access authentication and lacks the Access audience/team-domain bindings. QA reports Supabase is not required and has its Access bindings.
- The QA advisor browser check reached the existing Cloudflare email-code login at `gregvanesch.cloudflareaccess.com`. There is no authenticated advisor session in this test browser. Complete that login before claiming hosted advisor/CRM/project UI verification.
- The initial complete regression run after the application fix and security patch passed 144 tests. The audit was then extended with additional parser/safety coverage; see the latest CI run for the final test count.
- Next.js 16.4.2 triggered a security build failure. The candidate now uses the same-minor [16.4.5 security release](https://github.com/vercel/next.js/releases/tag/v16.4.5); React and OpenNext versions are unchanged. Both the Next build and the complete OpenNext Worker bundle passed locally with Supabase URL and keys absent.
- Existing historical release scripts deliberately pin the previous Supabase-auth checkpoint. They are not suitable as a new retirement release procedure.
- Notify Greg only when a concrete unresolved decision, access requirement or failed acceptance test needs his input. Do not send obsolete data-reconciliation tasks.

## Definition of done
D1 is the sole production application-data authority; advisor authentication, notifications, participant access and jobs work without Supabase; the Health Check, advisor, CRM and project workflows have passed meaningful local and hosted checks; Supabase is shut down and its billing outcome is verified. Existing D1 data remains intact. No migration or retention of Supabase test records is required.

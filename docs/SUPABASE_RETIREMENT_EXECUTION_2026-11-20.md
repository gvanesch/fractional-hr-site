# Supabase retirement — execution record (20 November 2026)

## Scope and constraints
Complete the existing Cloudflare D1 migration; do not restart D1 data cutover. Work independently on read-only discovery, code, QA and draft PRs. **No production deployment, data deletion, secret rotation or Supabase project shutdown without an explicit approval gate.** Do not change the live team.blue baseline questionnaire or its data.

## Verified starting evidence
- `docs/PRODUCTION_BASELINE_2026-10-16.md`: all five D1 application-data flags enabled, baseline data in dedicated D1 tables; Supabase advisor password authentication and historical recovery retained. This is an October checkpoint, not proof of current live settings.
- `lib/advisor-auth.ts`: existing `ADVISOR_AUTH_MODE=cloudflare_access` branch calls `verifyCloudflareAdvisorAccess`; default branch uses Supabase Auth.
- `lib/cloudflare-access.ts`: existing Access JWT validation with JWKS, issuer, audience and advisor email allowlist; `app/api/cloudflare-access-probe/route.ts` supplies a localhost-only crypto test.
- Supabase `public.diagnostic_submissions` has `diagnostic_notify` AFTER INSERT trigger calling `public.call_diagnostic_notification()`; that function POSTs to `diagnostic-notification` without Authorization header. Edge Function currently `verify_jwt=false`. Disabling it before dependency replacement may break notifications.
- Supabase project still has 16 public application tables and two active functions (`swift-handler`, `diagnostic-notification`). Their presence is not proof of live use.
- Legacy `SECURITY DEFINER` RPCs remain callable by `anon`/`authenticated`, but inspect real callers before revoking. Existing `docs/security-legacy-rpc-restriction-DRAFT.sql` is not approved for production.

## Work packages
### A. Dependency inventory — underway
- [x] Confirm October D1 production checkpoint and auth code paths.
- [x] Confirm remaining Supabase tables and Edge Functions.
- [x] Trace legacy notification trigger and HTTP call.
- [ ] Inventory all repository Supabase imports, env keys, workflows, runtime fallbacks, scheduled jobs, auth/logout paths and public APIs.
- [ ] Verify actual Cloudflare production environment bindings, Access policies and live deployment; requires Cloudflare account access or an approved read-only CI audit.
- [ ] Identify live use of `swift-handler` and notification function, including legacy external callers.

### B. Authentication
- [ ] Review Cloudflare Access policy (protect advisor routes, not public questionnaire endpoints) and allowed identities.
- [ ] Test Cloudflare JWT validation, denied access, permissions, logout, session expiry and advisor UI in QA.
- [ ] Review any Supabase-specific logout and login routes; adapt only as needed.
- [ ] Approve production auth mode and Access policy change.

### C. Notifications and legacy APIs
- [ ] Trace diagnostic submission and email flows in D1 and identify whether Supabase trigger is obsolete.
- [ ] Implement any missing Cloudflare-native notification delivery in QA, with authentication, deduplication and error handling.
- [ ] Verify all public diagnostic, fact pack, client diagnostic, baseline and CRM paths are D1-authoritative.
- [ ] Prepare permission removal for obsolete RPCs only after caller audit.

### D. Reconciliation, archive and recovery
- [ ] Read-only row counts/checksums and latest timestamps for Supabase and D1; verify no post-cutover Supabase-only writes.
- [ ] Confirm D1 backup/restore, recovery ownership and encryption/retention for historical Supabase archive.
- [ ] Test restore to an isolated environment without exposing real respondent data.

### E. Controlled retirement
- [ ] QA signoff and production cutover approval.
- [ ] Deploy auth/notification changes; verify all advisor and questionnaire workflows and monitor logs.
- [ ] Demonstrate no Supabase runtime traffic for an agreed observation period.
- [ ] Confirm archive/recovery and obtain separate approval to delete the Supabase project and cancel billing.

## Decision gates / challenges
1. **Cloudflare account access**: repository evidence alone cannot verify Access application policies, live Worker secrets, D1 runtime logs or production configuration. Request authenticated read-only access or approved CI audit if necessary.
2. **Advisor login**: choose Cloudflare Access for the advisor workspace, subject to confirming the exact advisor user experience and any non-advisor paths sharing the hostname.
3. **Historical records**: agree retention, archive owner and recovery mechanism before deleting Supabase. No implicit deletion of questionnaire or personal data.
4. **Production authority**: explicit approval required for changing auth, email triggers, data routing or removing Supabase services.

## Definition of done
D1 is sole production application-data authority; Cloudflare Access (or another approved non-Supabase provider) authenticates advisors; notifications and jobs no longer use Supabase; every required record is reconciled and recoverable; no Supabase runtime requests/secrets remain; project deletion and billing cancellation separately approved and verified.

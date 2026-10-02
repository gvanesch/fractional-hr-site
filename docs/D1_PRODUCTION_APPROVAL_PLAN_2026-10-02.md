# Production approval plan — 2 October 2026

This is a preparation record, not approval to run commands. Production remains on Supabase. No production schema, Worker, Access policy, scheduler, or feature flag has been changed by this continuation.

## Evidence required before requesting approval

- Hosted QA: Greg confirmed project creation, invitation receipt, participant access, questionnaire submission, Completed status, report/evidence export, and Fact Pack submission using the same email as the scored participant. The updated evidence pack contains the completed Fact Pack and full response. Questionnaire score remains 75. Do not infer an explicit OTP expiry/revocation exercise from the participant-login confirmation.
- Participant sharing fix: one mailbox may have one scored assignment plus a Fact Pack within a project; duplicate scored assignments and duplicate Fact Packs for that mailbox are rejected. Create/edit and Supabase fallback regressions passed. Commit `4dd1821363697f7909b8248d271e01e74f80c5da`; build, QA migrations, and QA deployment passed.
- Scheduler route: `/api/cron/advisor-daily-action-digest` shares the existing handler and still requires `CRON_SECRET`. It sits outside the QA `/api/advisor-*` interactive Access application. Existing advisor Access paths are unchanged. Authenticated `dryRun=true` generates the email in memory and returns only aggregate counts; it sends no email. The original route remains for compatibility. Production's scheduled workflow still uses its original URL until coordinated cutover approval.
- Hosted QA scheduler verification [passed](https://github.com/gvanesch/fractional-hr-site/actions/runs/36995773332): missing/wrong bearer rejected; authenticated dry runs of advisor digest and client diagnostic summary succeed. QA cron secret is rotated for this smoke and again afterwards. The smoke refuses QA Worker cron schedules and checks the exact QA DB plus D1 flags before rotating anything. No recurring schedule is enabled. This proves generation and authentication, not actual digest inbox delivery.
- Fresh Supabase snapshot: six existing tables have 33 system events, 3 diagnostic submissions, 4 advisor prospects, 1 Health Check prospect, 31 advisor activity rows and 0 Health Check activity rows. Source manifests contain only schema, counts and aggregate hashes. Production D1 [matched full-row hashes across two reads](https://github.com/gvanesch/fractional-hr-site/actions/runs/36996025142). A repeat Supabase snapshot after that comparison was unchanged for all sixteen source tables.
- New client core tables have no source rows. Two invite rate-limit rows are ephemeral security state; do not import them as client records. OTP challenges and verified sessions have no source rows. Recheck immediately before cutover.

The live production Worker currently has **no DB binding**; all five D1 flags are off (or absent, which defaults to off). The read-only inspection confirmed this. Adding the production DB binding is part of Approval B, not an unapproved correction now.

## Approval A: additive production schema only

Target: Cloudflare account `73221f18acc676e4992c89fcbf2b2a8f`, EU D1 `vanesch-prod`, database `b81b99d7-4b10-4f7e-a0c1-ada3adf596fc`. QA DB is `b25d59da-5f93-4301-9996-7be0c9708789` and must never be substituted.

Review exact SQL in:
- [`migrations/0004_create_client_diagnostic_core.sql`](../migrations/0004_create_client_diagnostic_core.sql)
- [`migrations/0005_create_client_diagnostic_security.sql`](../migrations/0005_create_client_diagnostic_security.sql)

0004 creates client projects, participants, responses, dimension scores, Fact Packs, functional signal requests and service-access context, with constraints and indexes. 0005 adds invite rate limits, OTP challenges and verified sessions. Both have passed QA migration/application tests. They add schema; they do not enable production D1 application paths.

The reviewed executor is [`scripts/d1/apply-approved-production-schema.mjs`](../scripts/d1/apply-approved-production-schema.mjs), with the inert [`d1-prod-approved-schema.yml`](../.github/workflows/d1-prod-approved-schema.yml) workflow. No `production-schema-approval.json` exists and no production mutation job has run. Only after Greg explicitly approves scope A will a timestamped marker with the exact DB/account and both reviewed SQL hashes be committed. The executor rejects stale approval, changed SQL, wrong branch/account/DB, mismatched source hashes and a missing recovery bookmark. It copies only 0004/0005 to a private migration directory before the explicit remote apply, so future files cannot slip into this approval.

Before execution: re-fetch the reviewed branch head, rerun read-only source/target reconciliation, confirm migration history is exactly 0001–0003, inspect pending migration list, and take/verify a current D1 recovery point. Apply only 0004 and 0005 to the explicit remote production DB through a narrowly scoped approved job. Never rely on Wrangler's local default. Capture applied migration names and schema checks, not row data or secret values.

If either migration fails: stop, inspect actual migration history/schema and logs, keep all flags off and production on Supabase. Do not blindly rerun, drop tables, or restore over production. Additive empty tables can remain while a forward fix is reviewed. Any destructive restore needs separate approval.

After success: all flags remain off. There is no production deployment, Access change, import, or cutover under Approval A.

## Approval B: coordinated production deployment and cutover

Prepare and review separately after Approval A:

1. Fresh source snapshot and reconciliation. Generate a private delta only if needed. Confirm the current source remains stable; any newly created production client records require a reviewed import before switching those paths.
2. Production Access application/AUD and allowed advisor identities, secrets by name, D1 binding, and scheduler configuration. QA audience/host/secrets must not be copied into production. Never expose values. Advisor interactive routes retain Access plus fail-closed JWT verification. Cron routes retain their separate bearer boundary.
3. Reviewed release/merge into `main`, production deployment target and flags to switch. No merge or production deploy has yet been authorized. Update advisor scheduler URL to canonical `https://vanesch.uk/api/cron/advisor-daily-action-digest` only with the corresponding deployed route and approved production Access/config. Use the existing production scheduler secret through configured secrets, not chat.
4. A short write-controlled cutover window: final delta, flags changed coherently, advisor auth/public contact/Health Check/client diagnostic/Fact Pack/report checks, and one expressly approved production email test if needed. Check active sessions/invitations and preserve rollback.
5. Monitor database errors, submissions, advisor access, emails and scheduled summaries. Keep Supabase available during the agreed soak period.

Rollback: first contain writes and establish which system holds each new record. Reconcile D1-only writes back into Supabase before directing those paths to Supabase again. Do not simply toggle flags after new D1 records exist. Keep additive D1 schema and recovery points. Restores or destructive cleanup require separate approval.

Supabase retirement, removal of fallback code, and final processing/privacy disclosure changes are a later, separate approval after the monitored soak and data reconciliation.

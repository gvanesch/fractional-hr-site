# D1 migration readiness — updated 2 October 2026

## Verified

- Hosted QA D1 flags and Cloudflare Access advisor login/logout against EU `vanesch-qa`.
- Greg confirmed project creation, invitation receipt, participant access, questionnaire submission, Completed status, report/evidence export and Fact Pack submission. Fact Pack response appears in the evidence pack and the scored result remains 75. This does not separately prove OTP expiry/revocation or every participant-administration path in the hosted browser.
- Shared-email Fact Pack fix `4dd1821`: create/edit checks permit one scored assignment plus a Fact Pack, retain distinct participant IDs/invites and reject duplicate assignments. D1 and Supabase fallback regression tests passed.
- [QA scheduler dry runs passed](https://github.com/gvanesch/fractional-hr-site/actions/runs/36995773332). Missing/wrong bearer rejected; authorized advisor digest and client diagnostic summary generate without email. The new advisor scheduler alias is outside the interactive Access wildcard and still uses the same cron-secret check. No QA recurring schedule enabled; QA cron secret rotated afterwards.
- [Production read-only row reconciliation passed](https://github.com/gvanesch/fractional-hr-site/actions/runs/36996025142): complete normalized rows in all six existing D1 tables match the fresh Supabase snapshot across two target reads. A repeat source read was unchanged. Counts: system events 33, diagnostic submissions 3, advisor prospects 4, Health Check prospects 1, advisor activity 31, Health Check activity 0.
- Greg approved schema-only production migrations 0004/0005; [the application job passed](https://github.com/gvanesch/fractional-hr-site/actions/runs/37000420302) and migration history is now 0001–0005. New source client core tables are empty; two rate-limit rows are ephemeral. Production Worker DB binding is absent and all D1 flags are off or absent (default off). Only the approved additive schema was changed; no production deployment, flags, Access policy or data import changed.

## Remaining approvals and checks

1. Finish post-application read-only schema, index, foreign-key and full-row checks for the approved production schema. See [the production approval record](D1_PRODUCTION_APPROVAL_PLAN_2026-10-02.md).
2. Production Access/bindings/secrets, further targeted auth/lifecycle checks and coordinated deployment/cutover plan. Adding the missing production DB binding, changing scheduler URL, merging into main or enabling flags are not covered by schema-only approval.
3. Fresh source reconciliation immediately before each production operation. Keep Supabase available during cutover and monitored soak. Reconcile any D1-only writes before rollback. Retirement requires separate approval.

Historical source/runtime coverage remains in D1_RUNTIME_AUDIT.md; use this file and the 2 October approval plan for current gates.

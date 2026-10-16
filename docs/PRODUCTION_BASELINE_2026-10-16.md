# Production D1 and baseline checkpoint — 16 October 2026

Greg authorised production deployment and a 30–50 participant synthetic backend test. The chosen batch contains 40 participants. Greg confirmed existing Supabase and Cloudflare data is synthetic and instructed that no invitation email be sent until timing is agreed.

## Storage and authentication

| Component | Current authority |
| --- | --- |
| Existing application data, including diagnostics and CRM | Cloudflare D1 production (`vanesch-prod`) |
| Baseline campaigns, questionnaire versions, participants and responses | Dedicated `tb_baseline_*` tables in production D1 |
| QA questionnaire and QA records | Separate QA D1 (`vanesch-qa`) |
| Production advisor password login | Existing Supabase authentication |
| Historical Supabase application records | Retained for recovery; no longer the active application-data source |

All five production D1 data flags are enabled. Supabase retirement and Cloudflare Access authentication migration were not performed. There was no main-branch merge, cron change or invitation sending.

## Release evidence

- [Immutable production build and read-only readiness](https://github.com/gvanesch/fractional-hr-site/actions/runs/38958649337): passed. Reviewed application commit `8ba8d479829225349d96358aea6f8c209a53b9b7`; immutable bundle artifact `12071632194`.
- [Guarded data cutover](https://github.com/gvanesch/fractional-hr-site/actions/runs/38958966917): passed. All five flags became `d1`, existing password login and unrelated settings were preserved, public pages and login JavaScript checks passed. A connector snapshot immediately afterwards confirmed the Supabase source was unchanged. Recovery identifiers and a D1 bookmark were retained in the workflow artifact.
- The source reconciliation ran database-side and returned only counts/hashes. A comparison-order discrepancy for numbered answer keys was resolved before deployment; the six source table hashes then matched the original copied data and the live D1 checks across two reads. No record repair/import was needed.
- [Production baseline deployment](https://github.com/gvanesch/fractional-hr-site/actions/runs/38959412492): applied the four dedicated baseline migrations and deployed production version `c58bfff0-9fb1-48b9-8a02-716b1a18ef14`. Email mode is `preview`. Its first HTTP assertion stopped on the existing apex-to-www redirect after deployment; subsequent verification uses the canonical www host. Deployment itself and preservation of unrelated bindings had succeeded.
- [Canonical-domain production verification](https://github.com/gvanesch/fractional-hr-site/actions/runs/38959725710): verified the deployed version, migration history, anonymous API boundary and participant entry. The batch stopped after 20 completed records when the existing bad-session limiter correctly returned HTTP 429 after logout. The test runner was adjusted to accept either HTTP 401 or rate-limited HTTP 429 as access denial. Security settings were not relaxed and completed records were preserved.
- [Final production synthetic verification](https://github.com/gvanesch/fractional-hr-site/actions/runs/38960175562): PASSED. All 83 automated tests passed. The existing production version, all four baseline migrations and canonical-domain entry/API boundary passed verification. The production batch finished at 20:12 UTC with exactly 40 participants: 32 completed, 6 in progress and 2 not started. Save/resume, stale-update rejection, locked submissions and logout checks passed. No email was sent and no answer-copy outbox record was created. The retry preserved existing completed responses and did not redeploy the application.

## Synthetic dataset

Reserved campaign: `55000040-2026-4016-8040-000000000040`, named **[SYNTHETIC TEST] Production backend — 40 participants**. The verified final status mix is 32 completed, 6 in progress and 2 not started, covering all seven work types and eight managers. Profiles and work narratives explicitly identify the data as synthetic; email addresses use `example.invalid`. Exclude the entire campaign from programme reporting.

The runner uses production participant HTTP endpoints for save, resume and submit, tests stale revision rejection and locked submissions, then logs out, verifies denied access, removes its sessions and revokes its private synthetic invitations. Answer-copy preferences remain false. Existing participant responses are never overwritten on retry.

[Open the production test campaign](https://www.vanesch.uk/advisor/baseline/project/55000040-2026-4016-8040-000000000040) using the existing advisor login. Production administrator browser interaction/export download and real inbox delivery have not been tested in this run.

## Email timing

Baseline invitation and answer-copy sending remain disabled. No real-person test invitation or sign-in code was generated or sent. Actual email recipients and timing will be confirmed before changing mail mode. New invitation links are capped at 30 days or the campaign closing date; separately issued sign-in codes expire after ten minutes.

## Recovery

Keep Supabase operational. After D1 accepts writes, reverting flags alone would hide the new D1 writes from the active application; stop writes and reconcile the delta before returning authority. No automatic rollback was performed. The synthetic batch is a separately identified campaign; no deletion was performed. Retention is recorded, while automatic deletion is not implemented.

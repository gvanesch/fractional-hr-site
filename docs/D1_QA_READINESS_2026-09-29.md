# D1 migration readiness — 29 September 2026

This is the current QA and production gate record. The earlier runtime audit documents code coverage and local tests, but its remote-blocker section is historical.

## Verified without production changes

- Isolated QA Worker `fractional-hr-site-qa` runs all five D1 flags and Cloudflare Access advisor auth against EU `vanesch-qa`. The QA build, migrations 0001–0005, security binding bootstrap, deployment and hosted binding preflight passed on `migration/d1`.
- Greg signed in to the QA advisor page and confirmed logout returns to Cloudflare Access without the earlier wildcard 404. Unauthenticated hosted probes confirm Access challenges advisor pages and APIs.
- QA contact submitted a synthetic Greg-only record to D1 and Resend acknowledged the email handoff in [the QA email smoke run](https://github.com/gvanesch/fractional-hr-site/actions/runs/36567363042). Inbox delivery and advisor invitation/OTP flows have **not** been confirmed end to end.
- QA email and digest binding names are present. The digest was **not** sent or scheduled in QA. The current Cloudflare Access application includes `/api/advisor-*`, so it also intercepts `/api/advisor-daily-action-digest` before the route's own cron bearer check. Resolve this policy/route boundary before claiming scheduled QA digest coverage.
- [Read-only production D1 inspection](https://github.com/gvanesch/fractional-hr-site/actions/runs/36588986106) confirms migrations 0001–0003 applied and 0004/0005 pending. Existing D1 table counts match current Supabase source counts: system events 33, diagnostic submissions 3, advisor prospects 4, Health Check prospects 1, advisor activity 31 and Health Check activity 0. These are counts, **not** a fresh row/hash reconciliation. Supabase has no client projects, participants, responses, scores, Fact Packs, functional signal requests or service access records at this check; it has two invite rate-limit rows (ephemeral security state).

## Gates still open

1. Hosted QA browser exercise for project creation and invitation to Greg only, email receipt, OTP, questionnaire/Fact Pack lifecycle and report. Avoid real client recipients and production data in QA. The existing source tests and contact email probe do not prove this whole flow.
2. Fix or deliberately exclude the QA scheduled digest Access path, then test the cron bearer boundary without sending unapproved recurring messages.
3. Fresh read-only Supabase→production D1 row/hash reconciliation for existing tables, plus a fresh source snapshot immediately before any import. Review schema and delta SQL privately. Do not put source records or credentials in CI logs or QA D1.
4. Request explicit approval for production migrations 0004 and 0005, with the exact target, migration SQL, maintenance/rollback steps and current reconciliation attached. Do not apply them as part of QA.
5. Separately configure and verify production Access/secrets and request cutover approval before enabling any production D1 flags. Keep Supabase available for rollback and reconcile any D1-only writes before a rollback.

Production D1 flags remain off. Supabase remains production authority. No production migration or Worker deployment was performed in this QA continuation.

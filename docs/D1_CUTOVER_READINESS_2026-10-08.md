# D1 cutover readiness — 8 October 2026

## Current verified state

Greg confirmed production advisor password login works on 8 October after release of reviewed code `81ab20a2e71ec379f22c0333918ae9160b4fdda0`.
The release workflow succeeded: https://github.com/gvanesch/fractional-hr-site/actions/runs/37783745634
The independent configuration audit succeeded: https://github.com/gvanesch/fractional-hr-site/actions/runs/37318949010

Production deployment: `341b4c25-b1e8-46e3-950f-eb33faaf1d89`.
Production version: `55fca225-7c0f-47ca-80c8-de4ece3d6d81` at 100% traffic.
The Worker has the production D1 binding. Migrations 0001–0005 have already been applied.
All five D1 flags remain off; Supabase remains authoritative. This document does not authorize changes.

## Fresh source comparison

Production Supabase source: `qxddddhhpfrrxbaunwfw`.
The refreshed source manifest contains only column names, counts and aggregate hashes.
The full-row hashes for the six historical tables match the previous source snapshot.

| Table | Source rows |
| --- | ---: |
| system_events | 33 |
| diagnostic_submissions | 3 |
| advisor_prospects | 4 |
| health_check_prospects | 1 |
| advisor_prospect_activity | 31 |
| health_check_prospect_activity | 0 |

Client projects, participants, responses, dimension scores, Fact Packs, functional signal requests, service-access context, OTP challenges and verified sessions have zero production source rows.
There are two invite rate-limit records; neither is currently blocked and neither has a recent window. The latest window is 21 August 2026. They are transient expired security state, not client records. Exclusion from a future import is recommended, subject to production cutover approval.

Publishing the refreshed manifest triggers the existing GET/SELECT-only production preflight. Its live D1 schema, two-pass row-hash and flag checks must succeed before treating reconciliation as complete. No data is imported by that workflow.

## Recommended next approval scope

Separate application data storage from advisor authentication. The current code independently selects D1 data paths and Supabase or Cloudflare Access advisor authentication.

1. Prepare a guarded, reviewed activation executor before asking for production approval. Pin the current deployment, target database and reviewed commit; require a fresh successful comparison and a source recheck immediately before activation.
2. Request explicit approval to switch the five existing flags to `d1`, while preserving current password authentication, mail settings, schedules and domains. No main merge, Access policy edit, import or Supabase retirement is included.
3. After activation, verify advisor reads and explicitly approved production smoke writes and email delivery. Confirm actual authenticated access with Greg; public-page checks cannot prove it.
4. Keep Supabase operational during monitoring. A completed data cutover still leaves Supabase advisor authentication in use.
5. Plan the eventual advisor move to Cloudflare Access separately: create and validate the production application, policies, team domain and audience, test Greg's access, then approve the authentication-mode change. Retiring Supabase requires its own reconciliation and dependency review.

## Rollback conditions

Capture the pre-change deployment and version IDs and confirm a recovery bookmark before activation.
If D1 has accepted writes, reverting flags alone would lose those writes from the active view. Stop new writes and reconcile the D1 delta back to Supabase before returning authority. Never perform a blind flag rollback after live writes.
Do not remove Supabase, alter schedules, merge main, or apply any production mutation under this read-only preparation.

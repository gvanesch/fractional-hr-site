# team.blue current-work baseline — QA implementation

## Database decision and production boundary

Verified 10 October 2026 against migration/d1 `79590faa4a38db1107f0ebd58e55c493ed5dd7c1`, PR #10 and read-only production audit run 37789481684. The production DB binding exists, migrations 0001–0005 are applied, all five application-data switches remain off, and production uses Supabase data and password authentication. The new assessment uses QA D1: introducing new Supabase tables would create another near-term migration.

Existing application-data cutover: approximately 1–2 hours active work for fresh reconciliation, an explicitly approved guarded switch, and verification, plus monitoring. Freeze/coordinate writes during reconciliation; roll back flags only after reconciling any new D1 writes. Recheck current state and rebuild the reviewed bundle before approval. This estimate does not include building this assessment. Cloudflare Access migration and eventual Supabase retirement are separate changes; Supabase password authentication can remain after the application-data cutover. Do not reuse the old reviewed production artifact for this feature.

Feature branch: `feature/team-blue-baseline`, based on the current migration checkpoint. No main merge or production change is authorised. QA deploy guard requires the exact feature branch, QA Worker/DB, all five production flags off, Access-protected QA administration and preview-only invitations. Production has no BASELINE_ENABLED setting. Applying the production baseline schema, deploying it, enabling it and enabling email each require separate approval.

## Dedicated model and routes

`baseline-migrations/0001_baseline.sql` owns `tb_baseline_*` tables, separate from all client diagnostics. QA migration history uses `tb_baseline_migrations`, not the existing D1 migration history. Campaigns reference immutable questionnaire definitions. Participant responses retain the questionnaire version, revision, progress and status. Structured work rows contain activity classification, time and detail. Profile, systems, knowledge, cyclical work, friction and strengths are whitelisted JSON. Events record material administration, exports and submission without raw access tokens.

Stable work codes must not be renumbered by reordering the taxonomy. Any questionnaire change needs a new version; the server rejects changed definitions under an existing version. Stored values and labels are separate for the controlled option banks. Custom work and systems are deliberately respondent-supplied labels.

Participant: `/baseline/start#<private-token>`. The fragment is removed immediately and exchanged by POST; it is not transmitted in server URLs/referrers. Invitation and session values are independently random 256-bit opaque tokens, SHA-256 hashed at rest. Possession of the private invitation authenticates the participant; no password or additional email code is required. Keep links private. Regeneration revokes the old invitation and associated sessions. Sessions expire after at most 12 hours; invitations expire after at most 30 days or campaign close. Logout removes the server session. Same-origin POST, strict secure HttpOnly host cookie, HMAC-based request limits, bounded payloads, own-response queries and no-store/noindex/no-referrer headers protect access. No browser local storage contains answers.

Admin: `/advisor/baseline`, existing authorised-advisor authentication; every API independently verifies it. QA retains existing Cloudflare Access and advisor allowlist. Campaign create/configure, roster CSV import (200 people per batch), individual invitation/resend/revoke, status counts, country/region/work-type breakdowns and individual answers are available. Respondent CSV, activity CSV and JSON exports include progress/status/version, support scope, pillars and hand-offs; token hashes and session values are excluded. CSV fields are escaped against spreadsheet formula injection.

The eight steps use one shared model. Suggested areas depend on current work type, never job title; search/show-all crosses categories. Top three time allocations plus up to two additional important areas receive detail questions. Numeric percentages accept 98–102% with explicit guidance. Office activity and reception/facilities work types map to People Operations; mixed/other roles have no inferred primary pillar. No organisation-design recommendations are generated.

Autosave is debounced and serialized, with server compare-and-swap revisions and atomic child-row updates. Conflicting tabs are blocked rather than silently overwriting. Navigation flushes pending saves; completed answers are immutable. Disconnected users receive a retry message and unsaved-exit warning. No offline local storage is used for identifiable answers.

## QA test plan

Admin URL: https://fractional-hr-site-qa.greg-732.workers.dev/advisor/baseline

Use synthetic names and addresses only. Invitations are preview-only; no employee emails are sent.

1. Sign in using existing QA Access. Create a test campaign. Review the data-use notice and close date; open the campaign.
2. Download the roster template. Import two synthetic people, one Reception and one Business Partnering or Technology. Importing a duplicate email must reject the entire batch.
3. Generate a private test link. Open it in a separate browser/private session. Confirm prefilled details, privacy acknowledgement and relevant work choices; use search to add an activity from another category.
4. Choose work areas, enter 70% to check validation, then adjust to 100%. Finish main activity detail. Back/forward must keep answers. Enter strengths, wait for “Saved securely”, close and return using the invitation. Answers and progress must remain.
5. Repeat on a phone. Check numeric entry, readable cards, keyboard labels and no sideways scrolling. Choose no more than three incoming work channels.
6. Generate a replacement invitation. The old link/session must fail. Do not put private links in shared screenshots, chat or logs.
7. Submit once. Confirm completion and admin counts/breakdowns; the completed response must not be editable. Export both CSV datasets and JSON. Confirm office work maps to People Operations while work_type remains reception/facilities.
8. An anonymous browser cannot read participant answers or admin exports. A second participant cannot select another respondent by changing request identifiers. Closing the campaign or revoking a participant must stop further saves.

Automated coverage: Node SQLite server/API tests (branching, percentage/version validation, hashed invitations, secure cookies, expiry/replacement/logout/revocation, rate limits, save conflicts, identity isolation, duplicate import, privacy immutability, export safety); guard tests rejecting production targets/email; Chromium component journey tests with synthetic API on desktop and mobile; hosted anonymous boundary checks. Chromium tests do not replace hosted end-to-end administrator/email verification.

## Launch decisions and remaining production work

Agree the controller/data-use notice, lawful handling arrangements, authorised administrator population, retention period and deletion process before collecting real information. The 90-day QA default is a placeholder, not an approved business policy. Retention is recorded but automatic deletion is not implemented; arrange approved deletion tooling before launch. Do not collect employee cases or special-category information in free text. Access control currently follows the existing advisor allowlist, not a new team.blue-specific administrator group; review that allowlist before real data.

Invitation email delivery is implemented using existing transport but disabled in QA; sender, reply-to and delivery need a separately approved non-production email test before launch. No real roster has been imported. Accessibility/manual comprehension and actual 20–25 minute timing need representative review. No production baseline schema, activation, deployment or Supabase retirement is part of this QA release.

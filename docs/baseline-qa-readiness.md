# Baseline QA preparation checkpoint

Greg authorised immediate autonomous preparation on 13 October 2026. Production deployment, production migrations, D1 activation and main merge remain prohibited pending final QA and explicit approval.

## Current work

- Improved scoped dashboard search, status widgets and region/country/entity/team/regional-leader filters.
- Applied the existing Van Esch design tokens to the current broad questionnaire with subtle host attribution.
- Added accessible information controls and kept positive question/answer direction.
- Added a separate read-only production checkpoint workflow. No production mutation.
- Phase 1 deployed and verified: UI filters/design/help. Read-only production checkpoint confirmed migrations 0001–0005, production D1 binding, all five flags off and existing Supabase authentication.
- Phase 2 implemented locally: separate `team-blue-baseline-v3` reviewed collection, CAS autosave/resume/submission, dedicated broad work records and exports, immutable manager context, hashed bounded OTP challenges, answer-copy outbox (QA preview only), final invitation/code templates, exact-recipient Greg-only mail ledger and dedicated QA mail credential.
- Local checks: 77 tests passed. Next: full CI browser and real hosted verification, authorised once-only Greg messages, final readiness/QA report.
- Production baseline schema and application cutover are still not applied/enabled. Neither approval is implied by QA testing.

## Safety and continuity

- Feature branch: `feature/team-blue-baseline`; fetch before committing and preserve concurrent remote changes. Never force push.
- QA Worker: `fractional-hr-site-qa`; QA DB `vanesch-qa` / `b25d59da-5f93-4301-9996-7be0c9708789`.
- Preserve the 20-record demo campaign `cb21a967-99a7-4aa9-b3ae-61c7dff289b1` and old-version responses.
- Real email authorisation: one baseline test invitation and one verification-code email to the exact normalised address `greg@vanesch.uk` only. No others. General mail remains in preview mode.
- Persist a once-only QA mail ledger before any real sends. Continuation/retries must inspect it and must not send duplicate messages.
- Never log secrets, raw bearer tokens or verification codes.
- The 01:00 UK continuation task is a fallback; inspect this checkpoint and workflow runs and resume unfinished work only. Do not duplicate completed work or race an active implementation.

## Reviewed collection QA access

Create a new baseline project to use `team-blue-baseline-v3`. Old v2 projects and responses remain intact. Open the project for QA testing, add/import synthetic `.invalid` respondents, generate their private invitation, then generate a synthetic QA verification code. The private link includes the opaque challenge identifier; the code is shown only to the authenticated administrator and must be entered separately. No synthetic-recipient email is sent.

Actual Greg messages use a separate `BASELINE_QA_RESEND_API_KEY`, a `greg-only` test flag, and a once-only ledger. `BASELINE_MAIL_MODE` stays `preview`; no general sending is activated. CI must inspect the ledger and must not reset reserved/failed entries or resend automatically.

Answer-copy preferences are recorded and preview-only in QA. Production copy delivery/retries are guarded by production mail configuration and recorded in a durable outbox with the invitation email snapshot. No answer-copy messages are authorised during QA.

## Verification checkpoint after first reviewed deployment

- Commit `e8bb596` deployed to QA successfully; reviewed desktop/mobile browser flow, QA migrations, build/deploy, anonymous boundaries and old hosted contract passed.
- Mail phase stopped before any message because the repository has no `RESEND_API_KEY` secret. No mail test ledger entry was created by that stopped run.
- Follow-up reuses an existing QA Worker `RESEND_API_KEY` binding only inside the exact-Greg, once-only guard if secret-name inventory confirms it exists. No credential value is read/copied, and general mail stays preview-only.
- Added explicit save/sign-out, consistent shared dashboard styling, synthetic code/link pairing and a real hosted reviewed HTTP/D1 fixture. This fixture creates only its own synthetic QA session through the privileged QA DB connection; it does not weaken or bypass the runtime verification endpoint and sends no mail.
- Next: complete the full workflow including hosted reviewed contract, Worker credential availability and the two authorised Greg previews. If the ledger contains reserved/failed entries, stop duplicate attempts and report their status.

# Baseline QA preparation checkpoint

Greg authorised immediate autonomous preparation on 13 October 2026. Production deployment, production migrations, D1 activation and main merge remain prohibited pending final QA and explicit approval.

## Current work

- Improved scoped dashboard search, status widgets and region/country/entity/team/regional-leader filters.
- Applied the existing Van Esch design tokens to the current broad questionnaire with subtle host attribution.
- Added accessible information controls and kept positive question/answer direction.
- Added a separate read-only production checkpoint workflow. No production mutation.
- Phase 1 deployed and verified: UI filters/design/help. Read-only production checkpoint confirmed migrations 0001–0005, production D1 binding, all five flags off and existing Supabase authentication.
- Phase 2 deployed and verified on QA: separate `team-blue-baseline-v3` reviewed collection, CAS autosave/resume/submission, dedicated broad work records and exports, immutable manager context, hashed bounded OTP challenges, answer-copy outbox (QA preview only), final invitation/code templates, exact-recipient Greg-only mail ledger and dedicated QA mail credential.
- Workflow `38446233527` passed on `144a174`: 77 tests, desktop/mobile journeys, QA build/deploy, real hosted reviewed contract, existing Worker mail credential inventory and one invitation plus one code to Greg. No other real emails. Final visual/wording polish and QA notes are complete on `589cb7d` (run `38447616295`). See [baseline-final-qa.md](baseline-final-qa.md).
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
- Resolved: the full workflow, hosted reviewed contract, Worker credential inventory and two Greg previews completed. Both mail ledger entries are sent; preserve them and do not resend.

- Follow-up hosted reviewed HTTP/D1 contract passed on `d7d48a6`, including denial of unverified bearer access, synthetic-recipient mail denial, CAS save/resume, immutable submission and preview-only answer copies. Mail inventory runner had a shell heredoc indentation error and did not inspect the Worker or send messages. This is fixed by a dedicated JS helper; no credential conclusion is inferred from that syntax failure.
- Synthetic-only visual artifacts are generated for desktop/mobile admin, collection review and technology pages. They contain no real invitation tokens or verification codes.

- Commit `5e286b2` did not run: GitHub rejected the job-level `runner.temp` context. The screenshot directory now uses `GITHUB_ENV` from the installer step. No deployment or email happened from that invalid workflow.
- Email-code previews now link directly to the existing challenge. Reopening the invitation reuses that challenge without sending another message. A current-code control supports normal production expiry handling; QA remains once-only. General QA invitation sending is denied even if mail mode is misconfigured.

- Successful actual email preview on `144a174`: both ledger kinds are sent. Never reset that ledger or resend on continuation. The configured credential remains in the QA Worker and was not read or copied.

- Final display polish `7d8af86` stopped before deployment because the browser check still expected the old payroll review label. The assertion is updated to the new plain-English label; no functional failure or additional email occurred. Resolved by `589cb7d`: the complete rerun passed and QA deployed successfully.

## Reconciliation on 14 October 2026

The authoritative remote source head `589cb7dd995c709ec8df65981ae67ef1cf04473b` and draft PR #11 were re-inspected. Workflow `38447616295` completed successfully, including QA deployment (Worker version `cecba548-3700-4114-afbb-a09ad713c715`), all 77 tests, types/lint, desktop/mobile browser suites and real hosted QA D1 contracts. The plain-language review labels are committed and the final synthetic mobile review screenshot was checked again. Readiness notes and the final QA checklist are complete. No source work, schema application, deployment or email test needs to be repeated.

No production changes are authorised or performed. Remaining intervention is Greg's final QA and explicit release approval, including the data-use notice, retention/deletion process and administrator/leadership access. The direct workspace HTTP check is blocked with 403 from this execution environment; successful hosted checks through the configured GitHub Actions connection are the deployment evidence. No access policy was changed to bypass that boundary.

## 14 October payroll preview feedback

The memory-only design preview opens payroll detail directly when Pay and benefits is selected. The extra Yes/No screening question is removed. An inline benefits/salary-review-only checkbox avoids asking benefits-only respondents to describe payroll stages. Stage-specific involvement and provider/Finance questions are unchanged. Existing persisted v3 campaigns retain their versioned questionnaire; incorporate the agreed management/local-context changes together in a new collection version before rollout. No response rewrite or real email. Management percentages and a focused local-work prompt remain proposals awaiting Greg's design decision.

# Baseline final QA and release boundary

Prepared 13 October 2026. Production is unchanged. The reviewed questionnaire uses QA D1 and version `team-blue-baseline-v3`. Older v2 demo responses remain intact.

## Where to review

- Projects: https://fractional-hr-site-qa.greg-732.workers.dev/advisor/baseline
- Questionnaire design preview: https://fractional-hr-site-qa.greg-732.workers.dev/advisor/baseline/prototype
- Existing 20-record administration demo: https://fractional-hr-site-qa.greg-732.workers.dev/advisor/baseline/project/cb21a967-99a7-4aa9-b3ae-61c7dff289b1

The existing six private design links remain available until their existing expiry. They show the revised design but retain answers only in memory. Use a **new v3 QA project** for actual autosave, save-and-return, final submission and exports. The 20-record v2 campaign tests administration, not the reviewed v3 collection.

## Focused review

1. In the 20-record demo, check the top completion dashboard, status widgets, search and region/country/entity/team/regional-leader filters. Clear the filters. Check the full-roster breakdown labels.
2. Open Respondents. Edit a synthetic record, including its working fraction and hours. Check that an inconsistent edit shows its error inside the dialog and keeps the values for correction. Withdraw and reinstate a synthetic incomplete respondent. A new invitation is required after reinstatement.
3. Create a new QA project. Confirm its data-use notice and closing date before issuing invitations. Import synthetic `.invalid` respondents from the template, including one formal manager and one systems specialist. Formal manager status comes from the roster. Do not import real employee data during this QA.
4. Open that QA project, generate a private test link and its synthetic QA access code. Open the link in a separate private browser and enter the code separately. Check ordinary office/hybrid work, payroll preparation versus submission to the provider, and manager/technology branching. Check each added technology system has its own involvement question.
5. Enter an incomplete time total and leave a required answer blank. Check the summary and yellow field highlighting. Complete the answers. Wait for “Saved securely”, sign out and return using the invitation with a fresh synthetic QA code. Check that the answers and progress return.
6. On review, edit an earlier section and use Return to review. Select the optional answer-copy preference and submit. Confirm the completion screen, locked completed answers, administrator status and both CSV datasets plus JSON. QA records the copy preference but sends no answer-copy email.
7. Test on a phone and with a keyboard. Check numeric time inputs, the floating total, readable labels, and information controls using focus, touch and Escape. Confirm no horizontal scrolling.
8. Review the invitation and verification email received at `greg@vanesch.uk`: sender name, task-first content, restrained Van Esch attribution, reply-to `info@vanesch.uk`, next steps and estimated time. The emailed code expires after ten minutes. These are once-only content/delivery previews. Use synthetic QA codes for later questionnaire testing; no further real email is enabled.
9. Create separate private leadership dashboard links for a regional leader and a campaign-wide reviewer. Check that the leader sees only roster rows assigned to their work email, while campaign-wide visibility includes all respondents. Links grant completion/roster visibility, not answers, exports or administration. Keep them private and revoke them after testing.

## Changes included

- Project creation, project directory and individual workspace remain separate. Searchable Open/Closed/Draft projects; Overview, Respondents, Settings and launch, Sharing, Exports tabs.
- Completion status widgets and search/region/country/entity/team/regional-leader filters apply only to the server-permitted roster. Shared leadership views use the same visual language and scope rules.
- Existing Van Esch navy/blue colours, typography, cards and accessible focus styling. team.blue and the task remain prominent; Van Esch attribution is subtle. Private page titles and sharing metadata describe the baseline, not commercial advisory services.
- Short guidance, accessible information controls, definitions after selection, yellow missing-answer highlights, direct return to review and explicit autosave/resume/sign-out guidance.
- Fleet/company car management, mandatory/compliance training, and termination/dismissal/redundancy case management appear in their existing broad work areas. Mandatory training is distinct from learning and development wording. These are examples of broad work, not separate task percentages or proof that every example is performed.
- Payroll preparation and provider submission are separate stages with independent involvement and other-party answers. No general ledger/payment-release process audit.
- Named additional technology systems have stable separate identities and individual involvement questions. Generic day-to-day tool use remains distinct from administration.
- Completion guidance is 10–15 minutes for most people and 20–30 for broad roles; actual timing and comprehension need representative human review.
- Reviewed v3 collection persists versioned broad work, contact, payroll, scope, technology and management answers separately from other diagnostics. Hashed email-code challenges, own-response sessions, CAS autosave, resume, immutable final submission and version-aware exports are verified.
- Optional answer-copy delivery has a durable outbox and production retry mechanism. It remains preview-only in QA.

## Verified evidence

Commit `144a17476d8c942e22b082706d73d8c12bd4675a`, workflow https://github.com/gvanesch/fractional-hr-site/actions/runs/38446233527 passed:

- 77 automated tests, type checking and baseline lint.
- Desktop/mobile generic, broad, technology, management, administration and reviewed collection browser checks.
- QA migrations, build/deployment, configuration and anonymous-access boundaries.
- Real hosted QA D1 legacy and reviewed collection contracts: private sessions, CAS save/resume, rejection of unverified access, locked submission, normalized work, copy preview and logout.
- Synthetic desktop/mobile visual artifacts for administration, technology, review and email templates. Visual review completed; final display-label and metadata polish follows without changing the v3 semantic definition.
- Existing QA Worker email credential verified by secret name only. One invitation and one verification-code email accepted by the provider for the exact authorised Greg address. General mail stays preview-only; other recipients and duplicate attempts are blocked. Provider acceptance does not prove inbox receipt.

## Before production approval

The application-data cutover, baseline production schema/deployment/enablement and real invitation sending are separate approvals. The read-only production checkpoint still shows migrations 0001–0005 and the D1 binding, with all five application-data flags off. Supabase data and password authentication remain authoritative. Later authentication migration and Supabase retirement are separate work.

Confirm the final data-use notice, retention period/deletion process and authorised administrator/leadership access before collecting employee information. Retention is recorded; automatic deletion is not yet implemented. Leadership links are private bearer links that can be forwarded, not verified leader account sessions. Real employee collection must wait for Greg's final QA and explicit release approval. No real roster has been imported, and no production mutation is included here.

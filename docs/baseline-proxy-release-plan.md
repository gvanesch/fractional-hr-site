# On-behalf completion: proposed production release

Status: preparation and QA. No production deployment, project creation, setting change or Denmark invitation is authorised by this document.

## Proposed scope

Keep the tested framework batch (Next.js 16.4.2, React 19.2.9, sharp 0.35.5, Cloudflare adapter 1.20.13 and advisor return-path restriction) together with the proxy changes. The final release therefore includes the security candidate in PR #12, the proxy candidate in PR #13 and this finalisation work. The exact reviewed commit and successful QA run belong in the release PR before Greg approves deployment.

No questionnaire definitions, response schema, migrations, production bindings, production release-approval files or current campaign settings change in this candidate. Ordinary participant identities and mail recipients retain their current behaviour.

## Production isolation

`BASELINE_PROXY_CAMPAIGN_IDS` is a server-side comma-separated list of explicit project UUIDs. Empty or absent means proxy creation and access are disabled in production. Wildcards do not enable anything. The browser learns only whether the current project permits proxy records.

After a separately approved code deployment, create an empty Denmark project, record its actual UUID and obtain/execute the approved project-specific activation. Never list the live baseline project. A listed project accepts proxy records only. Imports cannot mix proxy and self-responses. Main baseline completion counts and evidence remain in their original project.

Retain Anne's and Charlotte's own record identities. Reuse the manager's confirmed delivery email in the completer field. Record the usual-role reference period and the current coverage gap. Do not send any Denmark invitation until the manager's identity/email and the two role records have been checked. No such recipient has been selected or contacted during preparation.

## Delivery and evidence checks

Use production-mode integration tests with a captured provider to verify two invitations, two independent OTPs and two Word copies all route to one completer mailbox. Verify participant names in subjects, HTML/plain-text attribution, the correct return links, independent OTP challenges, no production preview-code exposure, immutable submitted answers, and no delivery to participant record emails.

Use one synthetic QA contact message to the established test mailbox for a real provider transport probe. The probe verifies the deployed QA database/environment and exact recipient before reserving a one-time QA ledger entry. Repeated workflows do not send another message after an accepted probe. It uses no employee answers, production records or production Worker. Provider acceptance does not prove inbox receipt or spam placement. This is a transport probe, not six real role-specific messages.

CSV/JSON preserve proxy provenance on respondent and work rows. Excel's default Include in analysis flag excludes proxy responses, including all detailed evidence tables. Word answer copies and dashboard cards identify the represented participant, completer and reference period. Keep proxy capacity estimates as supplementary historical-role evidence, not current available capacity.

## Release checkpoints

Before requesting approval:

1. Pass the full unit suite, type checks, lint, desktop/mobile assessment and administration journeys, shared dashboard checks and hosted v3/v4/v5 normal and proxy contracts on the exact candidate.
2. Inspect QA screenshots and verify the delivery/provenance tests and one-time transport result.
3. Confirm the production branch is still `4544a97ad13faca60196458c1ad34bf783e53534`. Read the Worker version and recovery metadata with GET requests only. The previous expected Worker is `3570dea7-eecc-43a1-a9d7-257120822a92`; any drift blocks the existing release plan pending review.
4. Record current and 24-hour recovery-bookmark availability. The 23 October rehearsal already verified restore and undo-restore with 50 synthetic responses across 32 tables. This does not establish a full production-data restore or an independently verified retention window.
5. Present the precise commit, release scope, successful checks, controlled transport outcome and remaining inbox-verification limit to Greg. Approval must explicitly cover the combined security/proxy code deployment. Project creation and scoped activation are subsequent explicit production actions.

## Proposed deployment sequence after approval

1. Recheck the production branch, Worker version and recovery bookmarks immediately before release. Stop on drift.
2. Deploy the reviewed code with proxy production IDs still absent/empty. Do not change the live questionnaire, invitations, deadlines, authentication, saved answers or schema.
3. Check public entry, participant verification boundary, advisor login and shared-dashboard access using read-only requests. Use only approved synthetic production fixtures if a save/submission test is needed; never edit respondent records for a smoke test.
4. Create the separate draft Denmark project and verify its actual ID and roster attribution. Enable only that ID through the reviewed configuration change, then recheck isolation before sending any real invitations.

## Rollback and response preservation

Record the pre-release Worker version. If a deployment check fails, restore that code version without restoring a database snapshot. No schema rollback is required. Existing responses, including answers arriving during deployment, remain in the database.

If proxy activation fails after invitations exist, first close only the separate proxy campaign and revoke its invitations and sessions while the new code is still available. Then remove that project from the enablement list and revert the Worker if required. The old Worker does not understand the new feature flag, so removing the flag alone is insufficient before a code rollback. Retain the proxy records, saved answers and audit history. Never close the main baseline campaign or revoke its sessions as part of this rollback. Reverting code must not delete or replace any live baseline table. Investigate before any resend because invitation generation revokes prior links for that participant.

The preparation workflow does not merge, publish a production release approval or deploy to production.


## Invitation and page wording

On-behalf invitations use a dedicated template addressed to the completer. The subject, assessment heading and action name the represented participant. The body explicitly asks for that participant’s usual role and work, identifies the reference period, and explains that the completer’s own assessment remains separate. OTP and answer-copy routing stays attributed to the same represented record.

The named participant notice appears on the introduction, every questionnaire stage, review, submitted and closed views. It explains that “you” means the represented participant, shows the completer and reference period, and asks for estimates, unknowns and coverage gaps in the final comments. The questionnaire definitions and answer fields stay unchanged. Desktop/mobile journey checks assert the notice at navigation and submission.

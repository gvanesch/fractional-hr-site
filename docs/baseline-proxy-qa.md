# Completion on behalf: QA candidate

Status: preparation and QA only. Production deployment is not authorised. See baseline-proxy-release-plan.md for the scoped production candidate.

Create a separate QA project with the unchanged v5 questionnaire. In the participant editor, choose `Completed on behalf of someone else` and enter the participant's name and record email, plus the completer's name, delivery email, reference period and coverage note. Repeat for the second role with the same completer mailbox. The participant identity remains unique. There is no uniqueness restriction on the completer mailbox.

Generate separate private test links. QA does not send invitations or codes to real mailboxes. Synthetic `.invalid` completer addresses can use the existing advisor test-code preview. Never use live participant links or credentials. The invitation-preview payload includes the intended recipient, participant, completer and a subject naming the person represented.

The assessment shows an explicit on-behalf notice before starting, throughout the journey, and after submission. Questions, branching, validation, questionnaire definition and scoring remain unchanged. Record estimates, unknowns and current coverage in the existing final comments. The role described is the usual role for the recorded reference period, not available current capacity.

Controls:

- Proxy and self-responses cannot be imported into the same campaign.
- Proxy imports and access fail outside QA unless the server explicitly enables that dedicated project UUID. The enablement list is absent/empty in the current production configuration.
- Participant identity, invitation, verification challenge, session, revision and response remain independent.
- Proxy saves and submissions require the displayed participant ID to match the authenticated session. A stale tab for the other person is rejected, including when revisions match.
- Participant-supplied answer data cannot change the roster attribution.
- Attribution changes after work starts are rejected. Changing the completer before starting revokes prior invitations and sessions.
- Exports retain response_source, completer_name, completer_email, reference_period and proxy_note. Standard Include in analysis selection excludes proxy records even after completion.
- Answer-copy preferences retain the completer recipient, but QA delivery remains preview-only.

No schema migration is required. Existing participant email uniqueness is preserved. Production bindings, release approvals, campaign settings and questionnaire definitions are unchanged.

Validation combines the full existing unit suite, targeted identity and OTP isolation tests, desktop/mobile unchanged collection journeys with the on-behalf notice, advisor administration tests and a hosted synthetic QA HTTP/D1 contract. The original QA workflow is branch-restricted and has no production inspection or deployment step. The release-readiness workflow additionally records GET-only production version/recovery metadata and performs a one-time controlled synthetic QA transport probe; it never deploys production.

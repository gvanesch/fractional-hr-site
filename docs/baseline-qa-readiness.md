# Baseline QA preparation checkpoint

Greg authorised immediate autonomous preparation on 13 October 2026. Production deployment, production migrations, D1 activation and main merge remain prohibited pending final QA and explicit approval.

## Current work

- Improved scoped dashboard search, status widgets and region/country/entity/team/regional-leader filters.
- Applied the existing Van Esch design tokens to the current broad questionnaire with subtle host attribution.
- Added accessible information controls and kept positive question/answer direction.
- Added a separate read-only production checkpoint workflow. No production mutation.
- Next: reviewed versioned broad collection, server autosave/resume/submission/exports, OTP, optional answer-copy flow, restricted Greg-only invitation/code tests, complete QA verification.

## Safety and continuity

- Feature branch: `feature/team-blue-baseline`; fetch before committing and preserve concurrent remote changes. Never force push.
- QA Worker: `fractional-hr-site-qa`; QA DB `vanesch-qa` / `b25d59da-5f93-4301-9996-7be0c9708789`.
- Preserve the 20-record demo campaign `cb21a967-99a7-4aa9-b3ae-61c7dff289b1` and old-version responses.
- Real email authorisation: one baseline test invitation and one verification-code email to the exact normalised address `greg@vanesch.uk` only. No others. General mail remains in preview mode.
- Persist a once-only QA mail ledger before any real sends. Continuation/retries must inspect it and must not send duplicate messages.
- Never log secrets, raw bearer tokens or verification codes.
- The 01:00 UK continuation task is a fallback; inspect this checkpoint and workflow runs and resume unfinished work only. Do not duplicate completed work or race an active implementation.

# Production baseline email and OTP checkpoint — 17 October 2026

The controlled production mail test is deployed. Only greg@vanesch.uk in campaign 55000001-2026-4017-8040-000000000001 is eligible for baseline email. Other campaigns, bulk invitations and answer-copy delivery remain blocked. Existing D1 storage and Supabase password authentication are preserved.

## Evidence

- Reviewed source: fd164102d111edff867405c5841dfa3627308a36
- Full QA passed: https://github.com/gvanesch/fractional-hr-site/actions/runs/39038234916
- Production test passed: https://github.com/gvanesch/fractional-hr-site/actions/runs/39038555889
- Production approval: 7925e931b4ee7f403c411f9bff009fabc84273b0
- Live Worker version: e67113a7-b23f-43f2-8b2d-e46c39baa697
- Previous Worker version: f17aa8eb-c12a-403a-8b36-856ec50b7684
- 88 automated tests passed, including campaign/recipient restrictions, secure session-cookie flags, superseded code rejection and single-use codes.
- Live production rejected an expired challenge, six wrong guesses and another attempt on the locked challenge.
- One invitation was accepted by the provider on 17 October at 13:56 UTC. Provider acceptance does not prove inbox delivery.
- No OTP email was requested by automation. Greg requests it from the invitation page when ready. The OTP expires ten minutes after that request.
- A new code invalidates prior unconsumed challenges for the same invitation. OTPs and tokens are not logged.

## Remaining live acceptance

Greg must open the production invitation, request a verification code, enter it on the website and confirm the questionnaire opens. Then verify the production audit records a code request followed by participant access. The production inbox-to-code journey is not yet signed off. Do not state that launch acceptance is complete.

A read-only status workflow is prepared. Trigger it by adding or updating scripts/baseline/production-mail-status-request.json on migration/d1. It reads only the fixed test identity, aggregate audit events and response status. It sends no mail and reads no codes, token hashes or answer contents. Do not reset the production test mail ledger or repeat the invitation automatically.

## Recovery and eventual launch

The production workflow artifact baseline-production-mail-verification retains deployment recovery identifiers and the non-secret test summary for 30 days. The first production attempt stopped before deployment because the guard expected the sender address in a plain-text binding. The corrected guard recognises the existing secret-backed sender binding by presence without reading its value. That failed attempt sent no mail.

After the live test is accepted, reconcile the real launch roster, closing date and campaign readiness before enabling general production baseline sending. The synthetic 40-person campaign and this Greg test campaign must remain excluded from programme reporting. No merge to main occurred.

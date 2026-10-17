# Baseline launch: 21–30 October 2026

Owner instruction: collect from 21 to 30 October 2026 inclusive. Do not automatically delete or expire baseline data. Collection closure restricts responses, not stored data. No purge job exists. Legacy retention_days values are ignored compatibility metadata; the admin API reports retention_policy=keep and no retention deadline. No response or existing campaign is deleted or reset by this update.

New-project closing date defaults to 30 October 2026, end of day UTC. Set up the actual collection campaign and roster before launch; do not repurpose the completed Greg test or the 40-person synthetic campaign. There is no automatic opening or invitation schedule configured. The actual campaign must open on 21 October; existing test campaigns retain their settings.

Production mail remains restricted to Greg and the pinned test campaign. Enabling participant invitations and answer-copy emails for the real launch remains outstanding. No email is sent by the form-fix release workflow.

## Acceptance

Production audit confirmed one verification request, one successful verified access, and a completed Greg test response (revision 66). Evidence: https://github.com/gvanesch/fractional-hr-site/actions/runs/39042555629 .

The form update adds technology activity percentage boxes derived from the current checkbox selection on every render. New fields are blank, existing entries remain, unselected activities are excluded from totals and exports, reselecting restores the prior value, and new allocations require 98–102%. Existing run/improve/deliver percentages are retained as a separate view of the same technology time; they are not added to activity percentages. Historic responses without activity allocations remain readable; no historic percentages are inferred.

Remaining launch QA: verify final roster and capacity metadata; validate country coverage/local constraints and delivery assumptions; check representative participant timing and comprehension; enable real-campaign mail at agreed launch time and test delivery to the participant email domain, OTP/resume, final submit and optional answer copy. Test expiry, rate limits and replay protection remain part of automated QA. No launch mail is scheduled or sent by this change.

## Verified form release — 17 October 2026

QA: https://github.com/gvanesch/fractional-hr-site/actions/runs/39047173683 — 89 automated tests, TypeScript and lint, all desktop/mobile suites, deployed QA legacy/v3/v4 HTTP/D1 contracts passed. New technology allocation shares were separately verified through persisted JSON parsing and the analysis-export calculation (20% of a 50% work allocation with 40 hours produces 4 hours and 0.1 FTE). Historic drafts remain compatible.

Production: https://github.com/gvanesch/fractional-hr-site/actions/runs/39047451630 — code deployment and post-deployment binding fingerprint/protected export boundary passed. Existing D1 flags, production database, Supabase password authentication and Greg-only email restrictions preserved. No data migrations, invitation sends, response rewrites or deletions were performed.

## HRD deck review

Reviewed all 20 slides and speaker notes of People Operations HRD Operational Review — 20 October 2026. The approach is supported when the baseline is combined with census data, leader validation and process follow-up. Slides 12/14 notes overstate named country/business coverage, general hand-offs and task-level time: v4 captures broad allocation, one/several/Group support scope and payroll-stage parties. Annual peaks are optional narrative, not quantified months/effort. Slide 17 regional options require named country coverage, explicit local-language/country expertise/physical-presence constraints, and demand/availability validation. Allocated FTE is not spare capacity. Slide 16 final roles/grades need consistent authority/complexity/impact evidence and job evaluation. Slide 20 cost and service measures are future operating measures, not questionnaire outputs. Slide 15's explicit acknowledgement that the questionnaire cannot describe full processes should be carried through slides 12/14/17. Recommend two short questions on named countries served and local delivery constraints before launch; no new questionnaire fields or deck edits have been made for these recommendations.

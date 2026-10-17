# Baseline launch: 21–30 October 2026

Owner instruction: collect from 21 to 30 October 2026 inclusive. Do not automatically delete or expire baseline data. Collection closure restricts responses, not stored data. No purge job exists. Legacy retention_days values are ignored compatibility metadata; the admin API reports retention_policy=keep and no retention deadline. No response or existing campaign is deleted or reset by this update.

New-project closing date defaults to 30 October 2026, end of day UTC. Set up the actual collection campaign and roster before launch; do not repurpose the completed Greg test or the 40-person synthetic campaign. There is no automatic opening or invitation schedule configured. The actual campaign must open on 21 October; existing test campaigns retain their settings.

Production mail remains restricted to Greg and the pinned test campaign. Enabling participant invitations and answer-copy emails for the real launch remains outstanding. No email is sent by the form-fix release workflow.

## Acceptance

Production audit confirmed one verification request, one successful verified access, and a completed Greg test response (revision 66). Evidence: https://github.com/gvanesch/fractional-hr-site/actions/runs/39042555629 .

The form update adds technology activity percentage boxes derived from the current checkbox selection on every render. New fields are blank, existing entries remain, unselected activities are excluded from totals and exports, reselecting restores the prior value, and new allocations require 98–102%. Existing run/improve/deliver percentages are retained as a separate view of the same technology time; they are not added to activity percentages. Historic responses without activity allocations remain readable; no historic percentages are inferred.

Remaining launch QA: verify final roster and capacity metadata; validate country coverage/local constraints and delivery assumptions; check representative participant timing and comprehension; enable real-campaign mail at agreed launch time and test delivery to the participant email domain, OTP/resume, final submit and optional answer copy. Test expiry, rate limits and replay protection remain part of automated QA. No launch mail is scheduled or sent by this change.

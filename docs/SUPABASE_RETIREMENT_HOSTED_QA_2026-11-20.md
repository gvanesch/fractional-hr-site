# Hosted QA acceptance — Supabase retirement

## Scope

On 20 November 2026 Greg completed Cloudflare Access email-code sign-in in the shared browser. A fresh navigation to the QA advisor origin showed the command centre and `Signed in as greg@vanesch.uk`. All observations and test writes below used `fractional-hr-site-qa.greg-732.workers.dev`, with the visible QA synthetic-data banner. No production application record or participant invitation was changed.

These initial browser checks exercised the existing QA deployment, version `31410344-cdba-4b49-9d9d-88e546830083`. They supplement the candidate's automated tests; they do not by themselves prove that a new candidate has been deployed. Record candidate deployment and focused rechecks separately below.

## Verified journeys

| Journey | Hosted evidence | Outcome |
| --- | --- | --- |
| Advisor sign-in | Cloudflare Access sign-in followed by the actual authenticated command centre, account email and D1-backed summary counts. | Passed |
| HR Health Check read | Repository and detail page show synthetic submission `3074dcdd-e94e-4da9-9cd6-c76b8490eda8`, score 50 and its advisor brief. The earlier HTTP/D1 proof also verified this exact row and public result token. | Passed, with date display defect identified below |
| CRM creation | Created `QA D1 retirement 20 Nov 2026`, company `Synthetic migration verification`, with no email or phone. Record ID `6ad2bff9-8a64-4451-b64d-8e3d898775c7`. | Passed |
| CRM updates and notes | Changed stage and lead temperature, added an internal QA note, then reloaded. The stored note and system change history remained visible. | Passed |
| Health Check linking | Linked the synthetic Health Check to the synthetic prospect; the CRM showed the correct score and diagnostic link. Unlinked it afterward; the original unlinked state and system history were confirmed. | Passed |
| CRM test-record disposition | Marked the synthetic prospect Lost, keeping the evidence outside active follow-up views. The record is intentionally retained in QA, clearly labelled. No external contact was made. | Passed |
| Diagnostic project workspace | Existing synthetic project `3ab8a59f-b2ea-4f6a-a1c8-023f187847b9` fully loaded its client-fetched summary, participant register, readiness and controls. Its completed HR response and Fact Pack were visible. | Passed |
| Project details update | Saved a temporary QA advisor note, reloaded and read it back, then restored the original empty notes and verified that restoration after another reload. No participant access or email action was used. | Passed |
| Diagnostic evidence pack | Report displayed the stored scored evidence, dimension analytics, written test comments and available Fact Pack. | Passed |
| Diagnostic explorer | Explorer displayed the same project evidence; selecting Ownership updated the current analysis context. | Passed |
| Baseline directory and dashboard | Existing `QA Admin Demo — 20 synthetic respondents`, campaign `cb21a967-99a7-4aa9-b3ae-61c7dff289b1`, loaded from the directory into its completion dashboard. | Passed |
| Baseline export | Downloaded Raw respondent CSV through the authenticated UI. Parsed the downloaded file: 20 data rows, 51 columns; status counts 15 completed, 3 in progress, 2 not started, matching the dashboard. | Passed |

## Defect found and candidate fix

The Health Check list showed completion at 20 November 2026, 09:24, while the detail card showed `Submitted — Not available`. The detail page selected the optional enquiry timestamp rather than the Health Check completion timestamp. The candidate now selects `completed_at` in both existing data branches, displays `Health Check completed`, and shows a later `Enquiry submitted` date separately when present. An actual-route/SQLite/page-render regression covers completion-only, completion followed by enquiry, and ordinary enquiry-only records.

## Boundaries of this evidence

- Hosted tests used the real Cloudflare Access session and deployed D1-backed application. They are distinct from the local tests that construct signed JWTs and replace email transport.
- The existing live QA and production D1 bindings and all five data modes were separately verified by read-only CI. Hosted UI success is not a substitute for that configuration evidence.
- No new participant invitation, OTP, extension or baseline launch was sent during these browser checks. Existing automated route tests cover those paths; the earlier hosted Health Check test sent one bounded internal notification to Greg.
- No production cutover or Supabase shutdown is established by these QA observations. Production Access policy, audience, actual scheduled-workflow destination and final production smoke checks remain separate release requirements.

## Candidate deployment and rechecks

The reviewed application/mechanism commit was `3a57a73d19e63066f67bab768b6be9d824bd8aa1`. Its no-Supabase test/build/isolated-Worker job passed in [verification run 44729140283](https://github.com/gvanesch/fractional-hr-site/actions/runs/44729140283). The complete suite passed **180 tests, zero failures**.

The request-only commit `a6b05577235cb670f418bbab127010d2744d4d22` deployed that application in [QA release run 44729377399](https://github.com/gvanesch/fractional-hr-site/actions/runs/44729377399). Its 180 tests and all deployment steps passed. The live QA version is **`f6076224-8523-4761-8148-69b637e2e542`**. The release preserved QA bindings, secret names, runtime settings, routes and schedules. Production remained at `6f47c7ec-3697-486c-ad8a-a9823be99424`. Deployment itself made no database writes and sent no email. The prior QA version remains available for controlled recovery.

Authenticated browser rechecks on that deployed version established:

- The Health Check detail now shows `Health Check completed — 20 Nov 2026, 09:24`, matching its repository entry. The synthetic submission remained unlinked after the earlier linkage test.
- The synthetic CRM prospect remained Lost, its prior history was intact, and a new internal post-deployment note saved and survived a reload.
- The diagnostic workspace fully loaded its project, participants and completed Fact Pack. Its temporary test note remained cleared.
- The baseline demo reloaded with the same 20 respondents and 15/3/2 completion counts.
- The advisor command centre remained signed in as Greg and showed both synthetic Health Checks after the final HTTP proof below.
- Logout displayed Cloudflare's explicit success message. A fresh `/advisor` navigation then required sign-in, while `/diagnostic` still displayed the public Health Check form.

A fresh bounded Health Check proof then ran against the new version: [run 44729875924](https://github.com/gvanesch/fractional-hr-site/actions/runs/44729875924), request `retirement-20261120-02`, submission `86d77783-f6e9-427e-a065-212e06abad6f`. Its actual QA D1 row and public result matched; Resend accepted one internal notification to Greg and no participant email was sent. This is the second synthetic submission across the two tested versions, not a repeated send for the first request. Each retained request marker prevents duplicate sends on reruns. Provider acceptance does not establish inbox delivery.

## Remaining production access requirement

The authenticated QA acceptance is complete. The production/QA read-only audit at approximately 11:38 UTC confirmed that the CI credential receives HTTP 403 for the Zero Trust organization configuration; production Builds settings also return 403. Its empty Access application list therefore remains incomplete management visibility. Production still uses Supabase advisor authentication. The Cloudflare administration dashboard requires a separate account sign-in before the existing policies, production audience, identity rules and build integration can be reviewed. No production cutover, Supabase pause or billing change has occurred.

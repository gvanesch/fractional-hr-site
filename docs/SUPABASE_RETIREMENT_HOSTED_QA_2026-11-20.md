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
| Project details update | Saved a temporary QA advisor note, reloaded and read it back, then restored the original empty notes. No participant access or email action was used. | Passed; restoration verified before final evidence capture |
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

Pending at the time this record was created. Add the exact candidate commit, QA version, workflow run and observed post-deployment results here after successful deployment.

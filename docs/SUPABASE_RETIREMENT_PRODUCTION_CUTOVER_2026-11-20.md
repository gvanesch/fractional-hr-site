# Production advisor authentication cutover — 20 November 2026

## Current state and scope

Greg has authorized completing the D1 migration and retiring Supabase. All Supabase application records are disposable test data. Existing D1 records and questionnaires must be preserved.

Greg has updated the existing token and requested that status/reminder emails stop. The email follow-up automation is disabled; report progress and decision points in the active chat. The permission update authorizes proceeding with the reviewed cutover, subject to the live request and configuration checks below.

The hosted QA acceptance is complete: Health Check write/read/results, advisor access, CRM mutations, project spaces, reports, baseline export and logout passed on the candidate. Production now uses D1 and Cloudflare Access. [Activation run 44777994990](https://github.com/gvanesch/fractional-hr-site/actions/runs/44777994990) switched 100% of traffic to the recorded candidate `9bd890ab-41e1-4845-867c-f6d4eb85196f` and passed its public health, route protection, configuration preservation and QA-isolation checks. Supabase remains active until live functional acceptance and configuration cleanup are complete.

The new GitHub audit secret works. [Run 44744836576, attempt 2](https://github.com/gvanesch/fractional-hr-site/actions/runs/44744836576) read the correct Zero Trust organization, one existing QA application, no production Access application, and the production Worker-trigger inventory. Production and QA versions remain unchanged. An empty Worker-trigger list is limited evidence; it does not authorize pushing old application code from `main`.

## Concrete production configuration

Create one self-hosted Access application named **Van Esch production advisor [request-id]**, and one separate production policy with the same request suffix. The suffix identifies resources owned by a single attempt for read-only reconciliation. Reuse the account's existing, verified email-code identity provider. Do not change the QA application, its policy or the identity provider.

| Item | Planned value or rule |
| --- | --- |
| Hosts | `vanesch.uk` and `www.vanesch.uk` |
| Protected application area | `/advisor`, including descendants |
| Protected APIs | The 20 exact advisor/CRM/project APIs in `PROTECTED_PATHS` |
| Destinations | 42 explicit host/path combinations; no broad `/api/advisor-*` wildcard |
| Identity | The verified QA exact-email Allow rule for `greg@vanesch.uk`, with supported existing restrictions preserved |
| Login | Existing one-time email-code provider; no new provider |
| Session | Verified QA application session is 24 hours; preserve any policy-specific session restriction |
| Cookies | Preserve reviewed QA cookie settings; explicitly keep the cookie domain-scoped so `/advisor` and `/api` share the session |
| Runtime auth | `ADVISOR_AUTH_MODE=cloudflare_access` |
| Runtime audience | The new production application's own audience, verified after creation |
| Runtime team | `https://gregvanesch.cloudflareaccess.com` |

The exact path list and source/configuration fingerprints are produced by `scripts/security/production-retirement-access-plan.mjs`. Its dedicated workflow performs bounded GET requests only, validates complete inventories and emits a sanitized report. It refuses unsupported identity/security settings or pre-existing production coverage rather than silently changing them.

The public Health Check, results, participant OTP/questionnaires, baseline participation and both cron endpoints stay outside Access. In particular, the existing `/api/advisor-daily-action-digest` scheduler URL remains outside the 42 protected destinations, so the old default-branch scheduler can continue without changing `main`.

## Access supplied by Greg

Greg reported that the existing **D1 retirement audit** token has been updated for **Access: Apps and Policies — Edit** on the same account. Its GitHub secret remains `CLOUDFLARE_RETIREMENT_AUDIT_TOKEN`. Organization/identity-provider and Workers Builds permissions remain Read, with single-account scope and the 27 November expiry. The actual create response will verify the new write capability; do not infer a successful cloud mutation from the user update alone.

The Access token is supplied only to the reviewed Access reads and the guarded cutover process. It is stripped from the OpenNext/Wrangler upload child process. Application builds have neither Cloudflare credential nor Supabase configuration. Checkout credentials are not persisted. The existing Worker deployment credential remains separate and unchanged.

Do not attempt a denied mutation with broader credentials or ask Greg to repeat the rejected Cloudflare dashboard login. Never publish token values, raw private provider configuration or secret values in logs or artifacts.

## Execution and verification

1. Require a fresh, request-only commit directly above the reviewed implementation. Verify the fixed repository, branch, account, source and expected production/QA versions. Read and fingerprint the current runtime using GET requests only.
2. Run the D1 tests and build the complete production application without provider credentials or Supabase values, before any live Access mutation. Pin all generated code, assets and internal symlinks; verify that advisor authentication reads its audience, team and mode at runtime.
3. Re-read the complete QA policy/login/application inventory and compare the reviewed plan. Verify the Worker state still matches the pre-build checkpoint. Create one production reusable policy and one application with 42 destinations, with evidence recorded before and after each POST. Read back the exact identity, provider, routes, cookies and new audience. Generate production configuration with only the intended auth bindings added/changed; preserve other bindings and resources.
4. Upload an inactive production Worker version. Verify its code annotations, bindings and runtime, re-read current production/QA/Access state, and activate once only if all leases still match.
5. Verify production health reports D1 connected and Supabase not required; public pages and public/participant/cron boundaries remain reachable; anonymous advisor access reaches the correct Access team.
6. Complete a real production advisor sign-in and bounded functional acceptance. Verify the reviewed scheduler handler's no-send mode before making an authenticated dry-run request. Any production Health Check write must be explicitly synthetic and bounded, with notification behavior controlled.
7. Remove obsolete active Supabase configuration through a separately verified inactive Worker version. Preserve the accepted D1/Access version as the cleanup rollback target.
8. Confirm the full Supabase organization project inventory and whether any unrelated project requires Pro. Supabase does not allow paid projects to be paused. For this retiring organization, downgrade its subscription to Free, verify the new plan, then pause the project and repeat independence checks. If another project requires Pro, resolve that dependency before downgrading, or transfer the retiring project to a Free organization. Verify cancellation and any final usage invoice separately.

The `production-retirement-cutover.yml` workflow is now wired to `production-retirement-cutover.mjs` and the reviewed Access adapter. It is triggered only by changes to `scripts/security/production-retirement-release-request.json` on the retirement branch. A request must be the sole change above its reviewed implementation commit. No request is included in the implementation commit. It uses the same `vanesch-production-release` concurrency group as the existing production release workflows.

The release module performs an inactive upload and one activation with repeated production/QA/Access checks. The Access adapter never retries a mutation or deletes resources. Its checkpoint contains only owned IDs, timestamps, flags and fingerprints; fresh reads reconstruct the private intended configuration. The published progress artifact excludes raw policy/provider configuration and audiences. Any partial or uncertain result requires GET-only reconciliation before further action.

The read-only planning workflow also runs `production-retirement-preflight.mjs`. It checks the real production and QA runtime metadata against the proposed release mechanism before any Access application is created, using the existing deployment credential for GET requests only. Its result cannot establish production Access readiness by itself.

That live runtime eligibility check **passed** in [run 44762956134](https://github.com/gvanesch/fractional-hr-site/actions/runs/44762956134), at the unchanged production/QA versions. It verified production environment/site, D1 identity/modes, existing secret names, runtime/grouping, prior auth configuration and QA isolation. The separate Access-policy planner initially stopped on nonempty connection-rule metadata; its parser now distinguishes documented RDP settings from structurally inactive SSH metadata, preserves applicable settings and refuses active/unknown SSH rules. The source fingerprint continues to cover the original policy. See the latest planning run for its actual result.

The complete Access plan and runtime eligibility both passed in [run 44763451457](https://github.com/gvanesch/fractional-hr-site/actions/runs/44763451457). The logical plan fingerprint was `e6e55cdca65458926f5e779888e1ae002a323d1176516c598477c165f2238e42`. A fresh planning result must be checked before issuing the production request.

The application is built before Access creation. A shorter transition still exists between creating the production Access application and activating the new backend. This is recorded explicitly; it is not evidence that production cutover has already completed. On any failure, retain the exact stage and resource IDs for recovery.

## First production attempt and controlled continuation

[Run 44774079890](https://github.com/gvanesch/fractional-hr-site/actions/runs/44774079890), requested by commit `5e93e1060bc1d5e66909f43a0f65f967b032aadc`, passed all 251 tests and its build/preflight. The updated token created the separate reusable policy `f0f42710-0b34-4dd8-b44a-c63c308fa6de`. Its strict readback stopped on an extra response field before any application was created or Worker uploaded. Production and QA remained unchanged.

GET-only diagnosis in [run 44774703927](https://github.com/gvanesch/fractional-hr-site/actions/runs/44774703927) confirmed that the extra `uid` is a UUID exactly equal to the policy's `id`, the recorded request name matches, the policy is reusable and attached to zero applications, and all source/plan/runtime fingerprints remain unchanged. [Run 44775009571](https://github.com/gvanesch/fractional-hr-site/actions/runs/44775009571) also inspected QA response metadata before enabling production login.

The continuation preserves the original ownership request and evidence unchanged inside a new reviewed execution request. It must verify the unused existing policy and complete source/runtime inventories twice, then issue only one application POST. It cannot create, edit or delete a policy. Evidence from any previous application-create attempt is ineligible for this path and requires GET-only reconciliation instead. The original resource names and fingerprints are retained, while separate hashes identify the new execution and reviewed code.

The continuation [44776147049](https://github.com/gvanesch/fractional-hr-site/actions/runs/44776147049) created and verified production Access application `5a224f42-4d20-46e7-9089-c85b6c162808`, reusing the recorded policy. All 281 tests and the production build passed. It uploaded immutable Worker candidate `9bd890ab-41e1-4845-867c-f6d4eb85196f`, and verified its expected annotations, auth bindings and runtime, then stopped before activation because the settings endpoint did not match the old active version's bindings. At that point the edge Access application was live while production traffic still used the prior Worker.

The activation-only continuation retains the complete sanitized upload report, original request and original eligibility fingerprints in `production-retirement-upload-evidence.json`. Its separate request must be the only change above the reviewed activation implementation. It reads both immutable versions, verifies that settings correspond to the known latest candidate, reconstructs and checks the original active-version baseline, and rechecks Access and QA. It can activate only that recorded candidate; it cannot create policies/applications, rebuild, upload code, send mail or write D1. A fresh activation request is required after the read-only diagnosis and focused checks pass.

## Verified production activation and acceptance in progress

Request commit `c9e601d194ea59e07cb155ccf19be89d9a8ee0ab` activated the existing candidate in [run 44777994990](https://github.com/gvanesch/fractional-hr-site/actions/runs/44777994990). All 56 focused activation/Access tests passed. The final report confirms D1 connected, Supabase not required, public pages and API boundaries available, anonymous advisor access protected, existing resources/secrets/settings/routes/schedules preserved, and QA unchanged. No code rebuild/upload, database write or email was performed by this activation.

The independent production inspection and build jobs in [run 44777994810](https://github.com/gvanesch/fractional-hr-site/actions/runs/44777994810) passed. The build ran 298 tests, built the complete Worker without Supabase credentials, and passed the isolated local D1 smoke check. The separate QA inspection remains red for its known legacy cron path coverage; the production inspection has no blockers. Do not describe the overall multi-job run as wholly green.

On the live website, an existing Access session opened `/advisor` as `greg@vanesch.uk`. The dashboard loaded the production Health Checks and CRM records. A new, clearly synthetic CRM record (`583fdaea-5b5a-4c0d-bc5c-d78f1ced949a`) was created with no email, phone or follow-up date, changed to Lost/Cold, and given one internal note. A full reload confirmed persisted fields, note and audit history. No existing CRM record was changed. The production diagnostic project directory loads successfully and currently contains zero projects; full diagnostic project/report mutation acceptance was completed in QA.

The one-shot production Health Check runner is restricted to the accepted production version and a fixed synthetic request ID. Its default requires the actual configured internal notification destination to be exactly Greg. [Run 44779316999](https://github.com/gvanesch/fractional-hr-site/actions/runs/44779316999) stopped before reservation, submission or mail because production stores the destination as a secret. The last approved source configuration names `info@vanesch.uk`, which does not verify the current secret. An explicitly declared, separately reviewed opt-in can use the unchanged production notification route and reports `recipientValueVerified:false`; that choice remains pending with Greg and has not been triggered. Both modes omit participant email, reserve the single attempt durably, and verify the synthetic D1 row, insert event and public result. A reserved or uncertain attempt cannot be resubmitted or reinterpreted under another mode. The normal application notification is separate from the disabled status/reminder email automation. No production Health Check submission is claimed until its live proof and advisor readback succeed.

The production baseline directory and its existing synthetic 40-person workspace also loaded successfully, including 32 completed, six in progress, two not invited and export controls. Existing respondents and questionnaires were not edited. Production logout remains a final acceptance step after the Health Check readback.

The separate cleanup metadata probe performs GET requests only and publishes field shapes and fingerprints. It does not establish acceptance or mutate settings. Cleanup remains gated on actual code/assets/runtime metadata compatibility and completed functional acceptance.

## Recovery

Retain the exact prior production version `6f47c7ec-3697-486c-ad8a-a9823be99424`. A failed or timed-out mutation is not automatically retried. Inspect actual deployment/resource state before deciding the next action.

If reverting an activated candidate, restore the exact prior production Worker before removing the new production Access application. Remove only resources created by the reviewed request and still matching their recorded fingerprints; leave QA and unrelated resources untouched. Supabase remains active until production acceptance is complete.

## References

- [Cloudflare application path inheritance](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)
- [Cloudflare Access application/domain limits](https://developers.cloudflare.com/cloudflare-one/account-limits/)
- [Authorization cookies and domain scope](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/)
- [Create a reusable Access policy](https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/policies/methods/create/)
- [Cloudflare API token permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)
- [Supabase paid-plan pausing restriction](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Supabase subscription cancellation and downgrade](https://supabase.com/docs/guides/platform/manage-your-subscription)

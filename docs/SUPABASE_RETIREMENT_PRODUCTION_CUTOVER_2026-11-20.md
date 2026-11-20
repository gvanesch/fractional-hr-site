# Production advisor authentication cutover — 20 November 2026

## Current state and scope

Greg has authorized completing the D1 migration and retiring Supabase. All Supabase application records are disposable test data. Existing D1 records and questionnaires must be preserved.

The hosted QA acceptance is complete: Health Check write/read/results, advisor access, CRM mutations, project spaces, reports, baseline export and logout passed on the candidate. Production already uses D1 for application data but still uses Supabase advisor authentication.

The new GitHub audit secret works. [Run 44744836576, attempt 2](https://github.com/gvanesch/fractional-hr-site/actions/runs/44744836576) read the correct Zero Trust organization, one existing QA application, no production Access application, and the production Worker-trigger inventory. Production and QA versions remain unchanged. An empty Worker-trigger list is limited evidence; it does not authorize pushing old application code from `main`.

## Concrete production configuration

Create one self-hosted Access application named **Van Esch production advisor**, and one separate production policy. Reuse the account's existing, verified email-code identity provider. Do not change the QA application, its policy or the identity provider.

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

## Access required from Greg

The token named **D1 retirement audit** currently has **Access: Apps and Policies — Read**. The verified next operation is creating one production policy and application, which requires **Access: Apps and Policies — Edit** on the same account.

Edit that one permission on the existing short-lived user token. Keep the organization/identity-provider and Workers Builds permissions at Read, the same single-account scope, and the 27 November expiry. Use the existing GitHub secret if editing the token does not replace its value; if Cloudflare generates a replacement value, update only `CLOUDFLARE_RETIREMENT_AUDIT_TOKEN` directly in GitHub. Never share token values in chat, email, repository files or logs. The existing deployment credential does not need to be changed for this Access permission.

This is a required Cloudflare authorization capability, not a request to approve the migration again. Do not attempt a denied mutation with broader credentials or ask Greg to repeat the rejected shared-browser login.

## Execution and verification

1. Re-read the QA policy/login settings, complete relevant application inventory, and current production/QA deployments. Require the reviewed configuration fingerprints and source commit to match.
2. Create a separate production reusable policy using the reviewed exact identity/security criteria; read it back. Create the production application with the 42 destinations and that policy; read back its audience, routes, cookies and policy.
3. Build the reviewed application with no Supabase URL or keys. Generate production runtime configuration with only the three intended Access auth bindings added/changed; preserve D1, services, assets, other variables and secret names.
4. Upload an inactive production Worker version. Verify its code annotations, bindings and runtime, re-read current production/QA/Access state, and activate once only if all leases still match.
5. Verify production health reports D1 connected and Supabase not required; public pages and public/participant/cron boundaries remain reachable; anonymous advisor access reaches the correct Access team.
6. Complete a real production advisor sign-in and bounded functional acceptance. Verify the reviewed scheduler handler's no-send mode before making an authenticated dry-run request. Any production Health Check write must be explicitly synthetic and bounded, with notification behavior controlled.
7. Remove obsolete active Supabase configuration, pause Supabase reversibly, and repeat independence checks. Confirm the separate subscription/billing outcome; pausing a project alone is not proof that its paid subscription is cancelled.

The new `production-retirement-release.mjs` module provides the guarded inactive-upload and single-activation logic, including repeated production/QA/Access checks and sanitized recovery evidence. Its 19 focused tests passed, including configuration-file drift, unsupported runtime settings, uncertain activation and GET-only eligibility checks. It deliberately has no deployment workflow or release request file in this preparation commit. The Access creation/verification adapter and final invocation must be reviewed and wired before any production mutation.

The read-only planning workflow also runs `production-retirement-preflight.mjs`. It checks the real production and QA runtime metadata against the proposed release mechanism before any Access application is created, using the existing deployment credential for GET requests only. Its result cannot establish production Access readiness by itself.

The current module requires the Access application to exist before production preparation/build. There may therefore be a short transition during which the edge requires Access but the old backend still presents its existing login. The implementation must account for that window and preserve recovery options; do not describe the cutover as already completed.

## Recovery

Retain the exact prior production version `6f47c7ec-3697-486c-ad8a-a9823be99424`. A failed or timed-out mutation is not automatically retried. Inspect actual deployment/resource state before deciding the next action.

If reverting an activated candidate, restore the exact prior production Worker before removing the new production Access application. Remove only resources created by the reviewed request and still matching their recorded fingerprints; leave QA and unrelated resources untouched. Supabase remains active until production acceptance is complete.

## References

- [Cloudflare application path inheritance](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)
- [Cloudflare Access application/domain limits](https://developers.cloudflare.com/cloudflare-one/account-limits/)
- [Authorization cookies and domain scope](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/)
- [Create a reusable Access policy](https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/policies/methods/create/)
- [Cloudflare API token permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)

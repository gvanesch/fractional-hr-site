# Supabase retirement — execution record (20 November 2026)

## Scope and current authority
Complete the existing Cloudflare D1 migration. Greg confirmed on 20 November 2026 that **all Supabase application records are test data and none need migration, reconciliation or archival**. The previous record-retention prerequisites below are superseded by this clarification. Preserve the existing D1 databases and the live questionnaires.

Greg has asked for independent implementation now, with notification at genuine decision points, challenges or questions. Verification and implementation proceed without another planning approval. Production changes must follow successful verification of the affected services; do not infer that disposable Supabase records make its still-active authentication safe to turn off.

## Latest verified status — production cutover complete, shutdown pending

The later evidence in this section supersedes the historical starting checkpoints below. Greg's updated audit token successfully created the production Cloudflare Access policy and application. [Activation 44777994990](https://github.com/gvanesch/fractional-hr-site/actions/runs/44777994990) placed Worker version `9bd890ab-41e1-4845-867c-f6d4eb85196f` at 100% of production traffic. D1 is connected, Supabase is not required, public routes work, advisor routes are protected, and QA/configuration preservation passed.

[Verification 44777994810](https://github.com/gvanesch/fractional-hr-site/actions/runs/44777994810) passed the production inspection, 298 tests, the complete build without Supabase credentials and isolated local D1 Worker smoke. Its independent QA boundary job remains red for the known legacy cron URL; this is not a production activation failure.

Live production browser acceptance has verified:

- The advisor dashboard recognises `greg@vanesch.uk` through the existing Access session and loads the production D1 Health Check/CRM data.
- Synthetic prospect `583fdaea-5b5a-4c0d-bc5c-d78f1ced949a` was created without contact details or follow-up date, updated to Lost/Cold, and given an internal note. A full reload confirmed fields, note and audit history. Existing CRM records were not changed.
- The diagnostic project directory and Explorer directory load successfully, both with zero production diagnostic projects. Full diagnostic project write/report checks passed in QA.
- The baseline directory loads seven projects. Existing synthetic project `55000040-2026-4016-8040-000000000040` loads its 40-person roster, 32 completed, six in progress and two not invited, with 84% completion of the invited roster. Its actual CSV download contained 40 rows and 36 columns with consistent shape. No existing respondent or questionnaire was edited.

[Production cron proof 44781245925](https://github.com/gvanesch/fractional-hr-site/actions/runs/44781245925) passed both existing authenticated `dryRun=true` handlers on the exact accepted production version. The advisor digest generated its content; the client summary correctly reported zero projects. Neither path sent mail, wrote D1, changed scheduling or changed the deployment. [Cleanup metadata probe 44781191670](https://github.com/gvanesch/fractional-hr-site/actions/runs/44781191670) separately passed two stable code/runtime/asset metadata reads, with no mutation. Full bounded browser evidence is in [the partial production acceptance record](SUPABASE_RETIREMENT_PRODUCTION_ACCEPTANCE_2026-11-20.md).

The single production Health Check attempt [44779316999](https://github.com/gvanesch/fractional-hr-site/actions/runs/44779316999) stopped in read-only preflight, before a reservation, application submission or email. The existing sender and internal recipient are secret bindings, so the originally stated Greg-only recipient condition cannot be verified. The historical approved production route is `info@vanesch.uk`; that record is not evidence of the current secret value. A prepared, inert opt-in can use the unchanged production notification route for the one fixed synthetic attempt while explicitly reporting that its recipient value was not read. It must not be triggered until Greg resolves this narrow notification choice. No production mail setting has changed.

Status/reminder email automation remains disabled. Supabase still reports the organization on Pro and project `qxddddhhpfrrxbaunwfw` active. Dashboard billing is at a sign-in screen. Cleanup, the final Health Check/advisor readback, production logout, downgrade, pause and post-shutdown verification remain pending. Do not mark retirement or billing cancellation complete.

## Verified starting evidence
- `docs/PRODUCTION_BASELINE_2026-10-16.md`: all five D1 application-data flags enabled, baseline data in dedicated D1 tables; Supabase advisor password authentication and historical recovery retained. This is an October checkpoint, not proof of current live settings.
- `lib/advisor-auth.ts`: existing `ADVISOR_AUTH_MODE=cloudflare_access` branch calls `verifyCloudflareAdvisorAccess`; default branch uses Supabase Auth.
- `lib/cloudflare-access.ts`: existing Access JWT validation with JWKS, issuer, audience and advisor email allowlist; `app/api/cloudflare-access-probe/route.ts` supplies a localhost-only crypto test.
- Supabase `public.diagnostic_submissions` has the legacy `diagnostic_notify` trigger and `diagnostic-notification` Edge Function. **The application D1 Health Check route already sends the advisor email directly through Resend**; no replacement Supabase trigger is needed. Test the D1 path and isolate email failures from the successful database write.
- Supabase project still has 16 public application tables and two active functions (`swift-handler`, `diagnostic-notification`). Their presence is not proof of live use.
- Legacy `SECURITY DEFINER` RPCs remain callable by `anon`/`authenticated`, but inspect real callers before revoking. Existing `docs/security-legacy-rpc-restriction-DRAFT.sql` is not approved for production.

## Work packages
### A. Dependency inventory
- [x] Confirm October D1 production checkpoint and auth code paths.
- [x] Confirm remaining Supabase tables and Edge Functions.
- [x] Trace legacy notification trigger and HTTP call.
- [ ] Inventory all repository Supabase imports, env keys, workflows, runtime fallbacks, scheduled jobs, auth/logout paths and public APIs.
- [x] Verify actual Cloudflare production environment bindings, Access policies and live deployment through the existing read-only CI credentials.
- [ ] Identify live use of `swift-handler` and notification function, including legacy external callers.

### B. Authentication
- [x] Review Cloudflare Access policy (protect advisor routes, not public questionnaire endpoints) and allowed identities.
- [x] Test Cloudflare JWT validation, denied access, permissions, logout, session expiry and advisor UI in QA. Local crypto tests cover token rules; hosted sign-in, API-backed UI and logout were verified on the deployed candidate.
- [x] Review Supabase-specific logout and login routes. The existing Access branch passed and required no auth-code change.
- [x] Confirm the deployed Access application protects advisor paths, permits the intended advisor identities and leaves public/participant endpoints usable.

### C. Notifications and legacy APIs
- [x] Trace diagnostic submission and email flows: the D1 path writes its own record and sends its own advisor notification.
- [x] Verify notification error handling and D1-backed event logging using mocked email transport. A saved Health Check now remains successful if the advisor email provider fails; the error is recorded and the participant email is still attempted.
- [ ] Verify all public diagnostic, fact pack, client diagnostic, baseline and CRM paths are D1-authoritative.
- [ ] Prepare permission removal for obsolete RPCs only after caller audit.

### D. D1 acceptance tests
- [x] Local HR Health Check integration: submit synthetic answers, verify the stored SQLite/D1-schema row, result retrieval, CRM linkage and mocked advisor notification.
- [x] Local advisor and CRM integration: actual server pages and authenticated mutations work with Supabase constructors blocked and credentials absent.
- [x] Local project integration: project/participant administration, invitations, OTP, questionnaire save/submit, Fact Packs and reporting work through the D1 data helpers.
- [x] Existing baseline workflow/export regression tests pass; no live questionnaire or D1 record was changed.
- [x] Local notifications, system events and scheduled digest integration uses D1 and the appropriate authorization, with email delivery mocked.
- [x] Next.js and OpenNext Cloudflare Worker builds succeed without Supabase credentials after the Next.js 16.4.5 security patch.
- [x] Hosted QA Health Check proof: one labelled synthetic submission was read back from actual QA D1, the public result matched, and the notification provider accepted the Greg-only advisor email. No participant email was sent. See [run 44710395735](https://github.com/gvanesch/fractional-hr-site/actions/runs/44710395735).
- [x] Hosted signed-in advisor/CRM/project/baseline acceptance, including bounded synthetic writes, read-back, export and logout, passed on QA. The updated candidate was deployed and rechecked; the final hosted Health Check proof passed against that version.
- [ ] A bounded production smoke test confirms the production transition beyond QA.

There is no Supabase row-count/checksum parity gate or historical archive requirement. Existing D1 recovery remains relevant to normal operations; it is not evidence that Supabase test data must be retained.

### E. Controlled retirement
- [ ] Complete local and hosted verification, resolve any actual configuration/access blocker and prepare the production candidate.
- [x] Activate the verified non-Supabase advisor authentication and deploy required fixes; production public/auth boundaries and signed-in reads/CRM passed, with the remaining full acceptance described above.
- [x] Confirm health reports Supabase is not required; local integration and the full build run with Supabase constructors blocked or credentials absent. Finish the remaining hosted acceptance before shutdown.
- [ ] Remove obsolete Supabase configuration from active deployment paths and disable the unused services.
- [ ] Verify shutdown and billing outcome. Distinguish a reversible pause from permanent project deletion.

## Current evidence and challenges
- A read-only GET on 20 November 2026 followed `https://vanesch.uk/api/health` to `https://www.vanesch.uk/api/health` and returned HTTP 200 with `{"status":"ok","supabase":"connected","d1":"connected"}`. D1 connectivity is live; this does not establish that every feature uses D1 or that Supabase can already be paused.
- The new auth integration tests exercise real JWT signature validation, middleware, advisor helpers and login/logout without any Supabase credentials. Hosted QA sign-in and logout have passed; production Access policy and production sign-in remain unverified.
- [Read-only CI run 44709422115](https://github.com/gvanesch/fractional-hr-site/actions/runs/44709422115) verified the expected live D1 binding, all five D1 modes and all required tables in both production and QA. Production has not enabled Access authentication and lacks the Access audience/team-domain bindings. QA reports Supabase is not required and has its Access bindings.
- Greg completed the Cloudflare email-code sign-in on 20 November. A fresh QA advisor page recognised `greg@vanesch.uk`. Hosted advisor/CRM/project/baseline checks then passed, including synthetic CRM writes and linking, a project-details write/read/restore, and a 20-row baseline export matching the dashboard. See [hosted QA acceptance](SUPABASE_RETIREMENT_HOSTED_QA_2026-11-20.md) for scope, evidence and candidate-deployment status.
- The initial complete regression run after the application fix and security patch passed 144 tests. The audit was then extended with additional parser/safety coverage; see the latest CI run for the final test count.
- Next.js 16.4.2 triggered a security build failure. The candidate now uses the same-minor [16.4.5 security release](https://github.com/vercel/next.js/releases/tag/v16.4.5); React and OpenNext versions are unchanged. Both the Next build and the complete OpenNext Worker bundle passed locally with Supabase URL and keys absent.
- [Run 44710175252](https://github.com/gvanesch/fractional-hr-site/actions/runs/44710175252) also passed the no-Supabase tests and complete Worker build in GitHub Actions. Its overall status remains red because live retirement readiness is deliberately separate and production still uses Supabase authentication.
- The expanded Access audit received an empty application list (zero returned and zero reported) in both environments, despite the browser reaching QA's existing Access login. This is an unresolved management-visibility issue, not proof that no policy exists. [Cloudflare documents that resource-scoped roles can return filtered lists](https://developers.cloudflare.com/changelog/product/access/). Verify the account/credential's scope before creating or changing production Access applications.
- The original `/api/advisor-daily-action-digest` URL is behind QA's Access rule, while `/api/cron/advisor-daily-action-digest` is reachable for its independent bearer authorization. Preserve a working scheduler endpoint when configuring production Access.
- The initial hosted QA proof is request `retirement-20261120-01`, pinned to QA Worker version `31410344-cdba-4b49-9d9d-88e546830083`. Its synthetic row and attempt marker are retained only in QA to prevent duplicate submissions/mail on reruns.
- Existing historical release scripts deliberately pin the previous Supabase-auth checkpoint. They are not suitable as a new retirement release procedure.
- Notify Greg only when a concrete unresolved decision, access requirement or failed acceptance test needs his input. Do not send obsolete data-reconciliation tasks.
- [QA release run 44729377399](https://github.com/gvanesch/fractional-hr-site/actions/runs/44729377399) deployed version `f6076224-8523-4761-8148-69b637e2e542`, preserving existing QA configuration and leaving production unchanged. All 180 tests passed. [Post-release Health Check run 44729875924](https://github.com/gvanesch/fractional-hr-site/actions/runs/44729875924) verified a fresh D1 write, public result and Greg-only notification acceptance on the new QA version. See the hosted acceptance record for UI checks and logout.
- The expanded read-only audit returned HTTP 403 for Zero Trust organization settings and production Workers Builds settings. Greg then attempted the separate Cloudflare administration sign-in, but the dashboard returned `API Request Failed: post https://dash.cloudflare.com/api/v4/login (403)`. The sign-in was attempted; this is an access blocker, not an outstanding request to retry the same login. The cause is unverified, and neither a wrong password nor bot blocking can be inferred from that generic denial. Further automated sign-in attempts stopped.

## Limited audit access after the dashboard sign-in failure (completed setup)

The initial alternative was a separate, short-lived, user-owned API token for read-only inspection. The existing deployment credential was not edited or rotated. The candidate accepts the GitHub repository secret `CLOUDFLARE_RETIREMENT_AUDIT_TOKEN` for Access configuration reads and the documented Workers CI read endpoint. Existing Worker, D1 schema and Worker-tag inspection continues through the current credential. The updated cutover procedure below also uses the Access token for the exact reviewed production policy/application creation, while keeping it out of application builds, the Worker uploader child process and runtime.

The completed initial setup was:

1. In Cloudflare, use **My Profile > API Tokens** to create a custom user token named **D1 retirement audit**. The Builds API requires a user-owned token; an account-owned token created under **Manage Account > API Tokens** is not supported by the documented Builds API.
2. Select **Account** permissions, restricted to the website's account `73221f18acc676e4992c89fcbf2b2a8f`:

   | Permission | Access | Purpose |
   | --- | --- | --- |
   | Access: Apps and Policies | Read | Inspect advisor applications and access policies |
   | Access: Organizations, Identity Providers, and Groups | Read | Verify the Zero Trust team and identity configuration |
   | Workers CI | Read | Inspect production build triggers through the documented read endpoint |

3. Set a seven-day expiry. If a named Read option is unavailable, report the label shown rather than substituting Edit or a broader permission.
4. Save the generated value directly into **gvanesch/fractional-hr-site > Settings > Secrets and variables > Actions > New repository secret**, named exactly `CLOUDFLARE_RETIREMENT_AUDIT_TOKEN`. Do not paste it into chat, email, source files or workflow logs. The existing `CLOUDFLARE_API_TOKEN` remains as it is.
5. Notify the assistant when the secret is saved. It can then run the bounded read-only inspection and report the actual production policy/configuration. Production policy changes remain subject to the verified cutover procedure above; creation of the read token does not establish retirement readiness by itself.

The extra credential is used only for account-local GET requests to Access organization/application/policy endpoints and `/builds/workers/{tag}/triggers`. Missing, denied, malformed or partial inventories remain unknown; they do not prove that applications or build triggers are absent. A successful read does not deploy, send email, modify D1 records, change Access policies or pause Supabase.

Validation of this optional path: all **30 focused audit tests passed** (20 existing and 10 new), ESLint passed for the changed JavaScript files, and independent review found no remaining blocking issue. The new checks cover credential routing, no fallback after denial, secret isolation from build/deploy workflows, strict response envelopes, bounded pagination and sanitized output. Greg subsequently created the account-scoped token, expiring 27 November 2026, and saved it as the named GitHub secret. The dashboard's **Workers Builds Configuration — Read** option successfully authorized the documented trigger read. The deployed QA application and its prior 180-test acceptance remain unchanged.

### Audit credential verified at 15:13 London time

[Verification run 44744836576, attempt 2](https://github.com/gvanesch/fractional-hr-site/actions/runs/44744836576) successfully read the previously inaccessible Cloudflare configuration. The remaining red jobs represent genuine readiness conditions, not a rejected or missing credential:

- The account exposes the expected Zero Trust team `gregvanesch.cloudflareaccess.com`.
- The complete parsed inventory contains one application, covering QA. There is no production application matching either production hostname. QA has one readable Allow policy and no Bypass policy; its advisor paths are covered.
- Production retains all five D1 modes, the expected D1 database and required tables. Its advisor authentication remains on the Supabase branch, with production Access audience/team bindings absent. Its public pages and public/participant/cron GET boundaries passed.
- QA remains independent of Supabase. Its only read-only boundary failure is the known legacy `/api/advisor-daily-action-digest` Access redirect; the cron alias remains public and retains application bearer authentication.
- Production's documented Worker-trigger inventory is readable and empty. This does not prove every newer Preview/build integration is disabled. The stale `main` branch remains untouched.
- Production version remains `6f47c7ec-3697-486c-ad8a-a9823be99424`; QA remains `f6076224-8523-4761-8148-69b637e2e542`. No cloud mutation was performed.

The audit-secret setup action is complete. Greg subsequently reported updating **Access: Apps and Policies** to **Edit** so the reviewed production application and separate identity policy can be created. The write capability will be verified by the actual guarded operation; no additional Identity Provider or Builds write permission is needed. See [the production cutover plan](SUPABASE_RETIREMENT_PRODUCTION_CUTOVER_2026-11-20.md).

The prior unified `/builds/workers/{tag}` endpoint and its parser were checked against the current official guide and are documented. Its observed 403 occurred before parsing. The separate `/triggers` endpoint is selected for the new credential because its API reference explicitly accepts **Workers CI Read**. There is no claim that Workers Scripts Read alone authorizes Builds, nor that the dashboard's sign-in 403 and the automation credential's 403 have the same cause.

References: [Access applications](https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/applications/methods/list/), [Zero Trust organization](https://developers.cloudflare.com/api/resources/zero_trust/subresources/organizations/methods/list/), [Worker triggers and read permission](https://developers.cloudflare.com/api/resources/workers_builds/subresources/triggers/methods/list/), [Builds token requirements](https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/), [token creation and scope](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/), [GitHub repository secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

Greg requested that emails stop because he is now at his computer. The migration email follow-up automation `6aff680ee09481918a111ac80fbaf47a` was disabled successfully on 20 November. Do not send further status or reminder emails; use the active chat. Both token setup actions are complete, and the failed dashboard login must not be requested again.

### Production cutover implementation after the token update

The complete read-only Access plan and runtime eligibility passed in [run 44763451457](https://github.com/gvanesch/fractional-hr-site/actions/runs/44763451457). The production application, reusable policy and Worker activation are now wired through a separate request-only release workflow. It builds the complete application without credentials before creating Access resources, checks exact source/runtime/QA/Access fingerprints around each change, and records owned IDs for reconciliation. Its implementation commit contains no release request; a separate request-only commit is required for execution. No production or Supabase mutation is implied by preparing this workflow.

The first actual request [44774079890](https://github.com/gvanesch/fractional-hr-site/actions/runs/44774079890) subsequently created only the separate production reusable policy and stopped before application creation on an unrecognized response metadata field. The website and QA were unchanged. Bounded GET-only diagnosis confirmed `uid` is an exact alias of the policy ID and that the policy remains unused. The reviewed continuation preserves original ownership evidence, reuses that policy and permits only the remaining application creation before the guarded Worker release. See the production cutover record for the exact policy ID and diagnostic runs. No policy retry, email, D1 write or Supabase shutdown occurred.

The shutdown order has been corrected against current Supabase documentation: paid projects cannot be paused. After production acceptance and obsolete binding cleanup, confirm the complete organization inventory, downgrade the retiring organization to Free, verify the plan, then pause its project and repeat website independence checks. If an unrelated project still needs Pro, resolve that dependency before any organization-wide downgrade. Cancellation and final usage charges must be verified independently. See [pausing](https://supabase.com/docs/guides/platform/free-project-pausing) and [subscription management](https://supabase.com/docs/guides/platform/manage-your-subscription).

## QA candidate release mechanism
The dedicated `qa-retirement-release.yml` workflow is triggered only by a separate, current request file committed directly above its reviewed candidate. It verifies the fixed QA Worker/D1 account, existing bindings and secret names, runtime compatibility, Wrangler grouping tags, route/schedule fingerprints and production version before uploading. It uploads an inactive QA version, verifies inherited configuration, repeats the lease checks, and activates only that QA version. No migrations, record writes, mail, secret rotation, Access policy changes or production writes are included. Wrangler can internally retry inactive uploads; the activation request is issued once and an uncertain outcome is not retried automatically. The exact previous QA version is retained in sanitized evidence for recovery.

## Definition of done
D1 is the sole production application-data authority; advisor authentication, notifications, participant access and jobs work without Supabase; the Health Check, advisor, CRM and project workflows have passed meaningful local and hosted checks; Supabase is shut down and its billing outcome is verified. Existing D1 data remains intact. No migration or retention of Supabase test records is required.

## Scheduler boundary for the Access cutover
The advisor digest workflow now targets `/api/cron/advisor-daily-action-digest`, which re-exports the existing digest handler and retains its `CRON_SECRET` bearer authorization. This avoids the QA Access `/api/advisor-*` wildcard that currently intercepts the legacy scheduler URL. Preserve the cron alias and `/api/client-diagnostic-daily-summary` outside advisor sign-in protection when configuring production Access. The legacy URL may stay available for compatibility; it must not be the active scheduler destination if Access intercepts it.

This workflow edit is a candidate change only. Read-only GitHub metadata confirms the default branch is `main`; the latest scheduled advisor digest [run 44571013073](https://github.com/gvanesch/fractional-hr-site/actions/runs/44571013073) still used `main` commit `bef727f58cbe821094a6ea8ee8ec0521f81b665c`. Merging this candidate into `migration/d1` alone will not update that live schedule. Move the narrow scheduler fix to the active default-branch workflow, or preserve the legacy endpoint outside Access, before the production auth cutover. The successful run returned “Skipped outside 08:00 Europe/London.” at London hour 16; its green status does not prove an email was sent.

The default branch contains exactly two GitHub workflows (advisor digest and client summary), both triggered only by schedules or manual dispatch. A narrow workflow-file push has no GitHub Actions deploy/build/migration trigger. Separately verify the Cloudflare Worker's Builds/Git integration before changing `main`, because an external push-triggered deployment could run independently of GitHub Actions and publish that older branch's application code.

The production read-only audit now resolves the exact Worker's immutable tag through `GET /workers/scripts` and reads its documented `GET /builds/workers/{tag}` configuration. The `externalBuilds` evidence exposes only the production branch and match/visibility/trigger booleans, never commands, environment variables, build tokens or Worker IDs. Denied, missing, unsupported and malformed responses report an explicit sanitized failure with unknown trigger status; they do not establish that an external build is absent. Preview builds are conservatively treated as a possible trigger for a `main` push, because their commands are not executed or disclosed by the audit.

The existing client summary workflow reads its URL from `DAILY_SUMMARY_URL`; verify its destination and a no-send authorization check without printing the secret value. Both handlers in the candidate and its `20b22b6` migration base support `?dryRun=true`: their D1 paths issue SELECTs and return before Resend, without writing `system_events` or other application records. Verify the deployed version corresponds to that code before an authenticated dry-run POST; an older handler that ignores the parameter could send an email. No schedule timing, production credential or email-sending behavior was changed by this edit.

The read-only retirement audit now queries the account's Zero Trust organization as well as its application list. It emits only a normalized `auth_domain`, whether that matches the observed QA team `gregvanesch.cloudflareaccess.com`, and a sanitized error when unavailable. An empty app list with the correct team identifies an application-visibility gap; a different team identifies an account mismatch. Neither permits creating overlapping production policies blindly.

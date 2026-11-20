# Production acceptance — 20 November 2026

## Status

**Partial acceptance only. Supabase shutdown is not yet accepted.** The production Health Check submission, its advisor readback/linkage and production logout are pending. No cleanup acceptance JSON has been issued.

Production Worker: `fractional-hr-site`, version `9bd890ab-41e1-4845-867c-f6d4eb85196f`, 100% traffic. Production D1: `vanesch-prod`, `b81b99d7-4b10-4f7e-a0c1-ada3adf596fc`. QA remains `f6076224-8523-4761-8148-69b637e2e542`.

[Activation evidence](https://github.com/gvanesch/fractional-hr-site/actions/runs/44777994990) establishes D1 connected, Supabase not required, preserved resources/settings/routes/schedules, anonymous advisor protection and unchanged QA. The production inspection and no-Supabase build jobs in [verification 44777994810](https://github.com/gvanesch/fractional-hr-site/actions/runs/44777994810) passed, including 298 tests and the built-Worker local D1 smoke. The separate QA legacy-cron boundary job is not claimed green.

The latest [verification 44781245631](https://github.com/gvanesch/fractional-hr-site/actions/runs/44781245631) passed its production inspection and all **362 tests**, complete no-Supabase build and built-Worker local D1 smoke. The independent QA legacy-cron boundary condition remains unchanged.

## Browser evidence

All observations below used the actual `https://www.vanesch.uk` website on the accepted version. Existing D1 respondents, questionnaires and client records were preserved.

| Check | Observation | Result |
| --- | --- | --- |
| Advisor identity | `/advisor` opened with the existing Access session and displayed `greg@vanesch.uk`; dashboard loaded Health Check and CRM totals | Passed |
| CRM creation | Created one record labelled `SYNTHETIC — Production D1 check 20 Nov 2026`, prospect `583fdaea-5b5a-4c0d-bc5c-d78f1ced949a`; email, phone and action date blank | Passed |
| CRM update | Changed only the synthetic record to Lost/Cold; UI confirmed success and field-change history | Passed |
| CRM note/readback | Added one internal synthetic acceptance note at 16:59 UTC; full reload confirmed the fields, note, identity and audit history | Passed |
| Diagnostic projects | `/advisor/projects` loaded successfully with zero projects, consistent with the dashboard | Passed for the production directory; full project writes/report checks passed in QA |
| Explorers | `/advisor/explorers` loaded and displayed zero diagnostic projects | Passed for the production directory; full Explorer/report checks passed in QA |
| Baseline directory | Seven existing baseline projects loaded; no project was changed | Passed |
| Synthetic baseline workspace | Project `55000040-2026-4016-8040-000000000040` displayed 40 active respondents, 38 invited, 32 completed, six in progress and two not invited; completion of invited respondents 84% | Passed |
| Baseline export | Used the existing synthetic project's Raw respondent CSV control; download completed and the parsed file contained 40 rows, 36 columns, consistent column count | Passed |
| Production scheduled jobs | [No-send proof 44781245925](https://github.com/gvanesch/fractional-hr-site/actions/runs/44781245925) authenticated to both deployed handlers with `dryRun=true`; advisor digest generated content, client summary correctly reported zero projects; no email or D1 write | Passed |
| Production Health Check write/read | Fixed test request `retirement-20261120-production-healthcheck-01` stopped in preflight before reservation, submission or notification | Pending |
| New Health Check advisor readback/link | Requires the successful synthetic submission above | Pending |
| Logout and fresh protection | Deferred until the Health Check readback completes; QA logout already passed | Pending |

## Notification decision

[Health Check run 44779316999](https://github.com/gvanesch/fractional-hr-site/actions/runs/44779316999) stopped because the current internal notification recipient is stored as a secret and cannot satisfy the initial readable Greg-only condition. The 4 October source approval names `info@vanesch.uk`, but that is historical configuration rather than proof of the current secret value. No reservation or application submission occurred.

The prepared alternative uses the site's unchanged notification configuration for the one fixed synthetic attempt, leaves participant email blank, and records `recipientValueVerified:false`. It does not change production mail settings. Greg's choice is pending; the alternative has not been triggered. Status/reminder email automation is disabled and remains separate from normal website notifications.

## Retirement gates still open

1. Resolve the normal website test-notification choice and complete the one production Health Check proof.
2. Read the new result in the advisor area, verify synthetic CRM linkage, and complete production logout/protected-route checks.
3. Retain the completed authenticated no-send scheduler proof when recording final acceptance.
4. Issue acceptance evidence only after the required checks are complete, then stage and activate removal of the obsolete Supabase bindings.
5. Sign in to Supabase billing, verify the full organization inventory, downgrade the retiring Pro organization to Free when eligible, pause the retiring project, and verify website independence and billing state.

The API currently reports the Supabase organization on Pro and project `qxddddhhpfrrxbaunwfw` active. No shutdown, deletion or billing change is claimed.

## Cleanup metadata readiness

[Read-only probe 44781191670](https://github.com/gvanesch/fractional-hr-site/actions/runs/44781191670) passed against the active/latest accepted production version at 17:13 UTC. Two complete reads returned stable module bytes, code etag, runtime, beta asset configuration and complete opaque runtime asset metadata, with no unsupported fields. The complete runtime asset object includes `serve_directly`, `raw_run_worker_first` and `base_path`; it remains fingerprinted in full.

The future cleanup uses the provider's env-only merge inheritance behavior and exact base/next-version checks, with readable code/runtime/asset metadata equality. It does not claim to independently hash every deployed static asset. No cleanup mutation was performed by this probe. Real Health Check, advisor readback and logout acceptance remain required before cleanup.

The prepared cleanup runner/workflow is inert until a fresh request-only commit names a separately committed acceptance receipt. That receipt must contain the actual completed Health Check report and a hash of a completed version-specific UI record. The current partial record and absent acceptance receipt cannot enable cleanup. The runner retains sanitized recovery evidence before each mutation, performs one inactive configuration patch and separately verified activation, and does not retry unknown outcomes. Its focused caller/library/probe suite has 44 passing tests.

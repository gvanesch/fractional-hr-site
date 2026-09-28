# Final D1 readiness gate — 28 September 2026

Remote `migration/d1` head at start of this review: `a5ef9adf42e651e87659f50e707c68f2b0054137`. The Migration branch build and D1 QA migrations runs at that commit succeeded. The latter ran seven application tests, QA migrations 0001–0005, schema/integrity SQL checks and three probes against a **local** Worker. It did not deploy or exercise a hosted QA Worker.

## Remaining Supabase references

Each remaining direct application reference has been traced to one of these guarded groups. Imports alone do not instantiate a client.

| Classification | Paths / behavior |
| --- | --- |
| Intentional disabled fallback | `middleware.ts`; `lib/advisor-auth.ts`, `lib/advisor-dashboard.ts`, `lib/system-events.ts`, `lib/security/client-*.ts`; `lib/client-diagnostic/{get-project-summary,build-project-summary,build-explorer-cohort}.ts`; advisor and respondent pages; public Health Check/contact/result/email routes; CRM/project/participant/OTP/Fact Pack routes; both scheduled summary routes; `/api/health`. Each corresponding D1/Access mode selects a D1 branch before a Supabase client is created. Mixed-mode health still checks Supabase while any data or authentication feature uses it. |
| Migration/backfill utility | `scripts/d1/export-*.mjs` (discovery-time count assertions), `lib/d1/client-diagnostic-shadow.ts`, CRM shadow serializers in `lib/d1/crm-prospects.ts`. The shadow source is used only after Supabase-authoritative mutations with shadow mode enabled. |
| Temporary rollback support | `lib/supabase/{admin,client,server,environment}.ts`, `@supabase/*` packages, Supabase environment validation, advisor login component, logout fallback, and retained environment secrets. They serve the currently disabled D1 flags and production rollback. |
| Dead or legacy code/text | `/api/advisor-submission` is a legacy API but remains callable and has a D1 read with shared authorization. `structure.txt` is a generated repository listing. Historical Supabase-specific error text on the advisor dashboard was removed. |
| Unresolved live production dependency in D1 mode | None found in the audited source. This is a source-level conclusion, contingent on all five data flags and Access mode enabled with the intended binding and on a successful hosted QA run. |

`app/privacy/page.tsx` intentionally still discloses Supabase while it processes and retains production data. QA documentation retains the Supabase environment-isolation contract for fallback, with a D1 qualification. Do not remove those disclosures now.

## Hosted QA gate

`wrangler.jsonc` targets the separate `vanesch-qa` database and prepares five D1 modes plus Access auth under `env.qa`; production vars remain `off`. Source configuration alone is insufficient to assert those bindings are deployed. The read-only `D1 hosted QA preflight` workflow inspects the deployed QA Worker, compares the database ID and flag values, and reports only whether required Access, email, advisor allowlist and OTP/rate-limit binding names exist. It never prints secret values.

A green preflight establishes binding presence, not a configured Access application or valid email transport. The full hosted user journey, direct API authorization, real OTP and mail delivery, invalid/reused/expired/revoked invitation behavior, scheduled routes and synthetic record cleanup must still be observed on the QA Worker. Do not enable production modes from CI.

## Production delta gate

Run `node scripts/d1/reconcile-production.mjs` with `BACKFILL_SUPABASE_SERVICE_ROLE_KEY` (or the existing `SUPABASE_SERVICE_ROLE_KEY`) and `CLOUDFLARE_API_TOKEN` configured locally. The production Supabase URL and Cloudflare account ID are fixed defaults; optional `BACKFILL_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL` and `CLOUDFLARE_ACCOUNT_ID` overrides must match the fixed production targets. Node does not automatically load `.env.local`; operators who store these credentials there can use `node --env-file=.env.local scripts/d1/reconcile-production.mjs`. It validates the fixed production source host and `vanesch-prod` database ID, reads every table in migrations 0001–0005 with pagination, records counts, row-level missing/changed/unexpected keys and deterministic SHA-256 hashes, then rereads the source to detect writes during the snapshot. It creates a private, mode-0600 report and idempotent SQL file under `/tmp/vanesch-d1-delta-*` and prints the directory path. It never executes the SQL.

Production D1 has only migrations 0001–0003. A missing table in 0004/0005 is marked `pending`; its rows are part of the **post-schema** SQL artefact. Existing unexpected D1 rows are reported, never deleted. A stable export is still time-bound: rerun source comparison and reconcile immediately before any approved import, and stop if writes occur during the cutover window. The generated SQL is review-only until a separate production approval covers schema, delta, deployment, Access and each flag stage. Supabase must stay intact through soak and a separate retirement gate.

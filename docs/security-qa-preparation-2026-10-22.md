# Security preparation: QA only

Greg approved preparation and QA only on 22 October 2026. Production deployment, production configuration or permission changes, real email and participant-data changes are not authorised by this approval.

## Release A: framework security dependencies

- Next.js 16.4.2 and React/React DOM 19.2.9, pinned in package.json and package-lock.json.
- sharp is overridden to 0.35.5 throughout the dependency tree, including the adapter's copy.
- OpenNext adapter is pinned to 1.20.13 (Wrangler resolves to 4.152.0). The original 1.20.2 build passed but its hosted dynamic entry route returned HTTP 500. Upstream issue #1355 documents the missing Next.js 16.4 preview-props manifest; 1.20.13 includes that fix. The full hosted regression suite must pass with the corrected adapter before release.
- The prior ESLint configuration version is retained as a pinned dev dependency. Updating the lint preset introduced new rules against existing questionnaire code. No runtime questionnaire refactor or rule suppression is included in this security release.

## Release B: safe advisor login destination

The password-login and Access paths use the same return-path validator. Only same-origin /advisor destinations are allowed. Tests exercise project links, query/fragment preservation, script/external/protocol-relative destinations, backslashes, control characters and traversal.

## Candidate later changes: preparation only

1. Restrict the exact three legacy Supabase RPC signatures after checking callers. Draft SQL lives beside this note and is not in any migrations directory. Do not execute against production during QA.
2. Protect the contact-update path with a matching capability/session. Preserve the genuine Health Check follow-up journey; its client currently sends only a submission ID. Add synthetic success, wrong-token and no-token integration cases before implementation is release-ready.
3. Add old public-email send budgets and recipient-change rules. Use isolated QA storage and a mocked mail provider; never the production sender for abuse tests.
4. Validate branch protections and separate production/QA credentials with the owner. Do not apply account controls in this stage.
5. Introduce uniform headers separately, with CSP report-only and browser validation first.

These items remain recommendations/drafts, not completed fixes.

## Required regression evidence

- Existing D1/security/OTP, replay, autosave, resume, revision-conflict and submission-locking tests.
- Word copy and analysis workbook generation tests; real emails disabled.
- Detailed questionnaire desktop/mobile journeys and late checkbox allocation.
- Advisor project/participant management, launch controls and mocked invite batches.
- Shared dashboard scope, revocation, token stripping and refresh/recovery.
- QA-only Worker build/deploy and hosted synthetic v3/v4/v5 checks.
- Final source diff confirms no baseline questionnaire source, migrations, production approval JSON or production configuration changes.

## Recovery review

The previous release verified that application data uses production D1 and advisor password auth remains Supabase. Existing release workflows retain the previous Worker version and configuration fingerprint. This provides code-deployment recovery evidence, not a successful data-restore rehearsal.

Current Cloudflare D1 Time Travel window, independent backups and restore readiness cannot be certified from repository configuration or the available connector. Verify these with read-only account access before approving production deployment. Do not restore the production database to test recovery. Any later rehearsal must use a separate destination and preserve all production writes received after the selected recovery point.

The blocked npm vulnerability scan remains excluded: this approval does not explicitly permit sending the complete package tree to the npm audit service. Normal package retrieval for the authorised QA dependency preparation uses --no-audit.

## Release decision

No production release approval is generated. After QA completes, report the exact candidate commit, automated evidence, untouched production head and outstanding account/recovery checks. Obtain a new deployment decision before changing production.

## QA evidence to date

Candidate c0b65ac60824ce5630c10c8db5e16a513a0c28a5: 121 tests, types/lint, all desktop/mobile browser suites, Worker build and QA deployment passed. Hosted entry failed (HTTP 500), so hosted participant contracts did not run. Run: https://github.com/gvanesch/fractional-hr-site/actions/runs/39825521028. This candidate is not release-ready.

The GET-only recovery inspection confirmed the original production Worker version and storage/auth/mail configuration, and availability of current and 24-hour-old D1 Time Travel bookmarks. No restore was performed; the full backup window and independent backup arrangements remain unverified. Production writes: none; emails sent: none.

# Baseline Excel export production checkpoint — 17 October 2026

The approved Excel export is live at https://www.vanesch.uk/advisor/baseline, under Exports → Download Excel analysis workbook. Raw CSV and JSON downloads remain available.

## Release evidence

- Reviewed implementation: 743dd6261031b4f23dabcd1291fdabc5ad86f004
- Release approval commit: f1051fb03546b94b5c7a9c7ef7eac7ad103818e8
- QA: https://github.com/gvanesch/fractional-hr-site/actions/runs/39017743768 — passed, including desktop/mobile administration and collection journeys.
- Production: https://github.com/gvanesch/fractional-hr-site/actions/runs/39018036697 — passed, including 86 tests, type checking, build, deployment, binding checks and synthetic workbook reconciliation.
- Live Worker version: f17aa8eb-c12a-403a-8b36-856ec50b7684
- Previous Worker version: c58bfff0-9fb1-48b9-8a02-716b1a18ef14
- Production workflow artifact: baseline-excel-production-verification (recovery identifiers and live synthetic XLSX; 30-day retention).

## Workbook and analysis

The 14 worksheets contain scalar answers, readable choice labels, typed numeric percentages, respondent identifiers, native filters and frozen headers. Respondents has 57 columns for the current synthetic dataset. Repeatable answers have separate linked worksheets: work allocation, contact routes, payroll stages/parties, systems, technology time/systems/activities/partners, management time and comments. Read me and Field guide describe the structure and denominators.

Use Include in analysis = TRUE for completed responses. Time within management or technology is separately labelled from the derived share of total working time. Weekly hours use contracted hours multiplied by total-working-time share; FTE uses working fraction multiplied by that share. Missing capacity remains blank.

Read-only production checks reconciled 40 reserved synthetic respondents, 32 completed responses and 73 work-allocation rows. XLSX ZIP integrity and every XML part were validated. Authenticated response headers and authorization were tested in the API harness; the live unauthenticated boundary was verified. A real signed-in administrator download was not manually exercised.

## Preserved production configuration

All five data-store flags remain d1, using Cloudflare D1 vanesch-prod (b81b99d7-4b10-4f7e-a0c1-ada3adf596fc). Supabase remains password authentication and historical recovery records. Baseline remains enabled; BASELINE_MAIL_MODE remains preview. No invitations or email were sent; no questionnaire responses or database schema were changed. No merge to main occurred.

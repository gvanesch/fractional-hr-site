# Detailed baseline v5 — 17 October 2026

Greg authorised expansion of the questionnaire to obtain the evidence implied in the HRD Operational Review deck. New campaigns use team-blue-baseline-v5. Existing v3/v4 definitions, campaign versions and submitted answers are preserved. No response migration, reset, automatic retention/deletion or email sending is included.

## Evidence added

- Confirmed work-base country separate from roster location and supported countries; current supported businesses; working language capability; supported employee population with records/estimate/unknown basis.
- Country shares of total working time, with Group-wide work separate and a Not known option. Other countries entered one per line have stable independent percentage fields and export rows.
- Selected task-level activities and shares within each non-technology/non-management work area. Technology and management retain their specific allocations. Adding selections at any time creates new fields; existing values persist; hidden values do not enter totals or evidence.
- Per-area local language, country law, consultation, onsite, entity and service-hours requirements, with country/site explanation; whole-process ownership; received-from/passed-to parties and hand-off issues.
- Per-area personal volumes, units and periods; active handling minutes; correction/rework shares. Records, estimates, unknown and not applicable remain distinct.
- Per-area potential for delivery elsewhere and explicit skills, system, approval and hand-over conditions. This is a candidate work-design estimate, not a claim of spare capacity or cash savings.
- Usual autonomy, problem complexity, decision reach, independent example and approval boundaries for role-framework comparison. Final title/grade evaluation remains outside the questionnaire.
- Reported contractual hours, overtime, uncommitted hours after current work and required cover, fixed site commitments, demand/backlog, trained cover and improvement opportunities.
- Peak months, drivers, duration narrative and extra hours per peak week, with estimate/record basis.
- Existing service measure, target, actual, reporting period and source; known recurring external provider cost, currency, period/scope and validating source. No salary question and no automatic benefit calculation.

## Country register

Project working register, reconciled in people-role-and-regional-coverage-review.docx (17 October), drawing on census, September regional illustration, October permissions and regional organisation. NE: DK/FI/SE/GB/IE. WE: BE/FR/DE/NL. SE: GR/IT/PT/ES/CH. CEE: BG/CZ/HU/SK/TR/RS. Austria remains selectable with Allocation to confirm. Other countries have no inferred core-region assignment. Group-wide service is not a country. Current location, reporting region and service coverage remain separate.

## Analysis and interpretation

V5 workbooks add eight tables: Country coverage, Detailed activities, Local requirements, Process handoffs, Delivery evidence, Role and capacity, Workload peaks, Service and provider evidence. All detail rows join by Participant ID. Historic-only workbooks retain their existing 14 tables. Raw JSON and optional answer-copy attachments contain all new evidence.

Country shares, work-area shares and within-area activity shares are separate views. Allocated hours/FTE use census contracted hours and working fraction; reported contractual hours remain separate for validation. Do not add across views. Uncommitted time is directly reported, not derived from a 100% allocation. Do not sum repeated provider costs, supported populations or repeated peak-month effort without reconciliation. Scope, records and estimates must be checked with accountable leaders before grading, relocating work, changing staffing or claiming savings.

The v5 form persists its exact resume-step key in the draft while mapping navigation to the existing 0–8 completion scale. No database rebuild or response schema migration is required. Detailed payloads use a bounded 300KB save/submit limit, typed nested validation and the existing optimistic concurrency/security boundary.

## Launch

Collection remains planned for 21–30 October 2026, with data kept without automatic expiry. Use a new v5 campaign for the final roster; do not repurpose the completed Greg test or synthetic 40-person campaign. General invitations remain restricted to the pinned Greg test campaign until the launch release. A human timing/comprehension pilot is still needed: this questionnaire is more detailed than v4; the form and v5 invitation now advise 25–40 minutes, longer for broad roles, with save/resume.

Advisor-only preview: /advisor/baseline/depth-preview (add ?manager=yes for the manager branch). Preview answers are not saved and no email is sent.

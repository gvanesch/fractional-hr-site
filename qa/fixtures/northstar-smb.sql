-- Northstar Manufacturing deterministic SMB golden fixture
-- QA / synthetic data only. Never run against production.
--
-- Purpose:
--   * stable, reproducible diagnostic fixture for Explorer/reporting regression QA
--   * enough HR + Manager completions to exercise operational weighting
--   * deliberately low-N Leadership cohort to exercise confidentiality behaviour
--   * incomplete invite states to exercise completion/outstanding UX
--   * complete Fact Pack and Service Access context
--
-- Stable project ID is retained from the historical Northstar demo so existing
-- QA Explorer links remain useful.

begin;

-- Replace only the reserved Northstar synthetic project. Cascades remove its
-- previous participants, responses, scores and contextual rows.
delete from public.client_projects
where project_id = '11111111-1111-4111-8111-111111111111'::uuid;

insert into public.client_projects (
  project_id,
  company_name,
  primary_contact_name,
  primary_contact_email,
  project_status,
  notes,
  created_at,
  updated_at,
  project_name,
  status,
  segmentation_schema,
  billing_contact_name,
  billing_contact_email,
  company_website,
  purchase_order_number,
  msa_status,
  dpa_status
) values (
  '11111111-1111-4111-8111-111111111111'::uuid,
  'Northstar Manufacturing Ltd',
  'Alex Morgan',
  'alex.morgan@northstar.example',
  'active',
  'QA GOLDEN FIXTURE: synthetic SMB diagnostic. Approx. 1,150 employees. Designed to exercise weighting, low-N confidentiality, segmentation, completion states and qualitative/contextual reporting.',
  '2026-09-01T08:00:00+00'::timestamptz,
  '2026-09-01T08:00:00+00'::timestamptz,
  'HR Operating Model Diagnostic - Northstar SMB Golden',
  'active',
  '{
    "fields": [
      {
        "fieldKey": "function",
        "fieldLabel": "Function",
        "options": [
          {"optionKey": "hr_people", "optionLabel": "HR / People", "canonicalKey": "hr"},
          {"optionKey": "operations", "optionLabel": "Operations", "canonicalKey": "operations"},
          {"optionKey": "sales", "optionLabel": "Sales", "canonicalKey": "sales"}
        ]
      },
      {
        "fieldKey": "location",
        "fieldLabel": "Location",
        "options": [
          {"optionKey": "uk", "optionLabel": "UK", "canonicalKey": "uk"},
          {"optionKey": "emea", "optionLabel": "EMEA", "canonicalKey": "emea"},
          {"optionKey": "global", "optionLabel": "Global", "canonicalKey": "global"}
        ]
      },
      {
        "fieldKey": "level",
        "fieldLabel": "Level",
        "options": [
          {"optionKey": "individual_contributor", "optionLabel": "Individual Contributor", "canonicalKey": "individual_contributor"},
          {"optionKey": "manager", "optionLabel": "Manager", "canonicalKey": "manager"},
          {"optionKey": "leadership", "optionLabel": "Leadership", "canonicalKey": "executive"}
        ]
      }
    ]
  }'::jsonb,
  'Jamie Patel',
  'finance@northstar.example',
  'https://northstar.example',
  'QA-PO-1150',
  'signed',
  'signed'
);

-- 14 total invitees:
--   HR:         4 invited / 3 completed / 1 started-outstanding
--   Manager:    6 invited / 4 completed / 1 started / 1 invited
--   Leadership: 3 invited / 2 completed / 1 invited
--   Fact Pack:  1 completed
--
-- Names and addresses are deliberately fictional and use the reserved .example TLD.
with participant_seed as (
  select * from (values
    ('hr01', 'hr', 'HR Operations Director', 'Priya Shah', 'priya.shah@northstar.example', 'completed', 'hr_people', 'global', 'leadership', 1),
    ('hr02', 'hr', 'HR Operations Manager UK', 'Daniel Reed', 'daniel.reed@northstar.example', 'completed', 'hr_people', 'uk', 'manager', 2),
    ('hr03', 'hr', 'HR Services Lead EMEA', 'Marta Klein', 'marta.klein@northstar.example', 'completed', 'hr_people', 'emea', 'manager', 3),
    ('hr04', 'hr', 'People Systems Manager', 'Imogen Clarke', 'imogen.clarke@northstar.example', 'started', 'hr_people', 'global', 'manager', 4),

    ('mgr01', 'manager', 'Operations Director UK', 'Lewis Grant', 'lewis.grant@northstar.example', 'completed', 'operations', 'uk', 'leadership', 1),
    ('mgr02', 'manager', 'Plant Manager UK', 'Sophie Evans', 'sophie.evans@northstar.example', 'completed', 'operations', 'uk', 'manager', 2),
    ('mgr03', 'manager', 'Commercial Manager EMEA', 'Jonas Weber', 'jonas.weber@northstar.example', 'completed', 'sales', 'emea', 'manager', 3),
    ('mgr04', 'manager', 'Sales Director Global', 'Claire Nolan', 'claire.nolan@northstar.example', 'completed', 'sales', 'global', 'leadership', 4),
    ('mgr05', 'manager', 'Operations Manager EMEA', 'Nina Fischer', 'nina.fischer@northstar.example', 'started', 'operations', 'emea', 'manager', 5),
    ('mgr06', 'manager', 'Sales Manager UK', 'Marcus Hill', 'marcus.hill@northstar.example', 'invited', 'sales', 'uk', 'manager', 6),

    ('lead01', 'leadership', 'Chief People Officer', 'Elena Rossi', 'elena.rossi@northstar.example', 'completed', 'hr_people', 'global', 'leadership', 1),
    ('lead02', 'leadership', 'Chief Operating Officer', 'Thomas Bennett', 'thomas.bennett@northstar.example', 'completed', 'operations', 'global', 'leadership', 2),
    ('lead03', 'leadership', 'Chief Commercial Officer', 'Amelia Stone', 'amelia.stone@northstar.example', 'invited', 'sales', 'global', 'leadership', 3),

    ('fp01', 'client_fact_pack', 'Client Fact Pack', 'Jordan Lee', 'jordan.lee@northstar.example', 'completed', null, null, null, 1)
  ) as t(code, questionnaire_type, role_label, name, email, participant_status, function_key, location_key, level_key, respondent_index)
)
insert into public.client_participants (
  participant_id,
  project_id,
  questionnaire_type,
  role_label,
  invite_token,
  participant_status,
  started_at,
  completed_at,
  created_at,
  updated_at,
  name,
  email,
  status,
  invited_at,
  segmentation_values,
  invite_expires_at,
  invite_revoked_at,
  invite_last_used_at
)
select
  extensions.uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, 'northstar-participant:' || code),
  '11111111-1111-4111-8111-111111111111'::uuid,
  questionnaire_type::public.client_questionnaire_type,
  role_label,
  extensions.uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, 'northstar-invite:' || code),
  participant_status::public.client_participant_status,
  case
    when participant_status in ('started', 'completed') then '2026-09-02T09:00:00+00'::timestamptz + (respondent_index || ' minutes')::interval
    else null
  end,
  case
    when participant_status = 'completed' then '2026-09-03T10:00:00+00'::timestamptz + (respondent_index || ' minutes')::interval
    else null
  end,
  '2026-09-01T08:15:00+00'::timestamptz + (respondent_index || ' seconds')::interval,
  '2026-09-03T10:30:00+00'::timestamptz + (respondent_index || ' seconds')::interval,
  name,
  email,
  participant_status,
  '2026-09-01T08:30:00+00'::timestamptz,
  case
    when questionnaire_type = 'client_fact_pack' then null
    else jsonb_build_object(
      'function', function_key,
      'location', location_key,
      'level', level_key
    )
  end,
  '2026-12-31T23:59:59+00'::timestamptz,
  null,
  case when participant_status in ('started', 'completed') then '2026-09-03T09:45:00+00'::timestamptz else null end
from participant_seed;

-- Ten current scored dimensions. Base scores intentionally encode a realistic
-- operating pattern:
--   * HR sees a broadly moderate environment
--   * Managers see more friction, especially service access and self-service
--   * Leadership is materially more optimistic and remains a separate sponsor lens
-- The deterministic variation formula below creates respondent/item spread around
-- these bases without any random values.
with dimensions as (
  select * from (values
    ('process_clarity',       1, 4, 3, 4),
    ('consistency',           2, 4, 3, 4),
    ('service_access',        3, 3, 2, 4),
    ('ownership',             4, 4, 3, 4),
    ('systems_enablement',    5, 3, 2, 4),
    ('knowledge_self_service',6, 3, 2, 4),
    ('operational_capacity',  7, 3, 2, 3),
    ('case_management',       8, 3, 3, 4),
    ('data_handoffs',         9, 3, 2, 4),
    ('change_resilience',    10, 3, 3, 4)
  ) as d(dimension_key, dimension_order, hr_base, manager_base, leadership_base)
),
completed_scored as (
  select
    p.participant_id,
    p.questionnaire_type::text as questionnaire_type,
    right(p.email, 0) as unused,
    case
      when p.email = 'priya.shah@northstar.example' then 1
      when p.email = 'daniel.reed@northstar.example' then 2
      when p.email = 'marta.klein@northstar.example' then 3
      when p.email = 'lewis.grant@northstar.example' then 1
      when p.email = 'sophie.evans@northstar.example' then 2
      when p.email = 'jonas.weber@northstar.example' then 3
      when p.email = 'claire.nolan@northstar.example' then 4
      when p.email = 'elena.rossi@northstar.example' then 1
      when p.email = 'thomas.bennett@northstar.example' then 2
      else 1
    end as respondent_index
  from public.client_participants p
  where p.project_id = '11111111-1111-4111-8111-111111111111'::uuid
    and p.questionnaire_type in ('hr', 'manager', 'leadership')
    and p.participant_status = 'completed'
),
score_rows as (
  select
    p.participant_id,
    p.questionnaire_type,
    p.respondent_index,
    d.dimension_key,
    d.dimension_order,
    q.question_number,
    greatest(
      1,
      least(
        5,
        (
          case p.questionnaire_type
            when 'hr' then d.hr_base
            when 'manager' then d.manager_base
            when 'leadership' then d.leadership_base
          end
          + case
              when mod(p.respondent_index + q.question_number + d.dimension_order, 7) = 0 then 1
              when mod(p.respondent_index + q.question_number + d.dimension_order, 7) = 1 then -1
              else 0
            end
        )
      )
    )::integer as answer_value
  from completed_scored p
  cross join dimensions d
  cross join generate_series(1, 5) as q(question_number)
)
insert into public.client_responses (
  response_id,
  project_id,
  participant_id,
  questionnaire_type,
  dimension_key,
  question_key,
  answer_value,
  comment_text,
  created_at,
  updated_at,
  responses,
  submitted_at
)
select
  extensions.uuid_generate_v5(
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid,
    'northstar-response:' || participant_id::text || ':' || dimension_key || ':score:' || question_number::text
  ),
  '11111111-1111-4111-8111-111111111111'::uuid,
  participant_id,
  questionnaire_type::public.client_questionnaire_type,
  dimension_key,
  questionnaire_type || '_' || dimension_key || '_score_' || question_number::text,
  answer_value,
  null,
  '2026-09-03T10:00:00+00'::timestamptz,
  '2026-09-03T10:00:00+00'::timestamptz,
  null,
  '2026-09-03T10:00:00+00'::timestamptz
from score_rows;

-- Every completed scored respondent has the ten probe rows expected by the
-- current question bank. The first respondent in each group provides richer
-- qualitative evidence; the remaining probe rows are intentionally blank.
with dimensions as (
  select * from (values
    ('process_clarity', 1),
    ('consistency', 2),
    ('service_access', 3),
    ('ownership', 4),
    ('systems_enablement', 5),
    ('knowledge_self_service', 6),
    ('operational_capacity', 7),
    ('case_management', 8),
    ('data_handoffs', 9),
    ('change_resilience', 10)
  ) as d(dimension_key, dimension_order)
),
completed_scored as (
  select
    p.participant_id,
    p.questionnaire_type::text as questionnaire_type,
    p.email,
    case
      when p.email in ('priya.shah@northstar.example', 'lewis.grant@northstar.example', 'elena.rossi@northstar.example') then true
      else false
    end as is_primary_commenter
  from public.client_participants p
  where p.project_id = '11111111-1111-4111-8111-111111111111'::uuid
    and p.questionnaire_type in ('hr', 'manager', 'leadership')
    and p.participant_status = 'completed'
)
insert into public.client_responses (
  response_id,
  project_id,
  participant_id,
  questionnaire_type,
  dimension_key,
  question_key,
  answer_value,
  comment_text,
  created_at,
  updated_at,
  responses,
  submitted_at
)
select
  extensions.uuid_generate_v5(
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid,
    'northstar-response:' || p.participant_id::text || ':' || d.dimension_key || ':probe:6'
  ),
  '11111111-1111-4111-8111-111111111111'::uuid,
  p.participant_id,
  p.questionnaire_type::public.client_questionnaire_type,
  d.dimension_key,
  p.questionnaire_type || '_' || d.dimension_key || '_probe_6',
  null,
  case
    when not p.is_primary_commenter then null
    when p.questionnaire_type = 'hr' and d.dimension_key = 'process_clarity' then 'Core processes are documented, but exceptions and cross-team handoffs still depend on local interpretation.'
    when p.questionnaire_type = 'hr' and d.dimension_key = 'consistency' then 'Manager practice varies by site and business area, especially where policies require judgement.'
    when p.questionnaire_type = 'hr' and d.dimension_key = 'service_access' then 'The formal service route exists, but managers still contact known HR colleagues directly when an issue feels urgent.'
    when p.questionnaire_type = 'hr' and d.dimension_key = 'ownership' then 'Accountability is usually clear until a case moves between HR operations, an HRBP and a specialist team.'
    when p.questionnaire_type = 'hr' and d.dimension_key = 'systems_enablement' then 'Workday is the core platform, but spreadsheets and email are still used for several operational handoffs and reconciliations.'
    when p.questionnaire_type = 'hr' and d.dimension_key = 'knowledge_self_service' then 'Guidance is spread across the intranet and local folders, and managers often ask HR to confirm which version is current.'
    when p.questionnaire_type = 'hr' and d.dimension_key = 'operational_capacity' then 'The team manages normal demand, but recurring queries and manual checks reduce the capacity available for improvement work.'
    when p.questionnaire_type = 'hr' and d.dimension_key = 'case_management' then 'Employee relations work is tracked, but routine service requests do not have one consistent end-to-end case view.'
    when p.questionnaire_type = 'hr' and d.dimension_key = 'data_handoffs' then 'Payroll and local HR teams still reconcile employee changes manually at month end, creating avoidable rework.'
    when p.questionnaire_type = 'hr' and d.dimension_key = 'change_resilience' then 'Changes are communicated, but reinforcement after launch is inconsistent and older local practices tend to return.'

    when p.questionnaire_type = 'manager' and d.dimension_key = 'process_clarity' then 'For standard requests the route is clear, but anything unusual quickly becomes a chain of emails to work out what happens next.'
    when p.questionnaire_type = 'manager' and d.dimension_key = 'consistency' then 'The answer can depend on which HR contact or location is involved, so managers compare notes before acting.'
    when p.questionnaire_type = 'manager' and d.dimension_key = 'service_access' then 'There are several mailboxes and channels. I usually message someone I know because it is faster than deciding which route to use.'
    when p.questionnaire_type = 'manager' and d.dimension_key = 'ownership' then 'It is not always obvious what the manager owns versus what HR will progress once a request has been raised.'
    when p.questionnaire_type = 'manager' and d.dimension_key = 'systems_enablement' then 'Some activities are straightforward in Workday, but other requests still need forms, spreadsheets or follow-up emails.'
    when p.questionnaire_type = 'manager' and d.dimension_key = 'knowledge_self_service' then 'Guidance is hard to find in the moment and I normally ask HR to confirm the right answer before I proceed.'
    when p.questionnaire_type = 'manager' and d.dimension_key = 'operational_capacity' then 'Response is good for urgent issues, but routine requests can wait and sometimes need chasing during busy periods.'
    when p.questionnaire_type = 'manager' and d.dimension_key = 'case_management' then 'Once something is submitted I cannot always see its status, owner or expected resolution date without asking.'
    when p.questionnaire_type = 'manager' and d.dimension_key = 'data_handoffs' then 'Information is occasionally requested more than once when a case moves between HR, payroll and another team.'
    when p.questionnaire_type = 'manager' and d.dimension_key = 'change_resilience' then 'New processes usually make sense at launch, but teams drift back to old habits when the new route is slower or unclear.'

    when p.questionnaire_type = 'leadership' and d.dimension_key = 'process_clarity' then 'The operating model is broadly understood at leadership level, although some local execution differences remain.'
    when p.questionnaire_type = 'leadership' and d.dimension_key = 'consistency' then 'We have common policies and standards, with some expected variation for countries and business circumstances.'
    when p.questionnaire_type = 'leadership' and d.dimension_key = 'service_access' then 'The service model has clear channels and appears capable of supporting the organisation at its current scale.'
    when p.questionnaire_type = 'leadership' and d.dimension_key = 'ownership' then 'Leadership accountability is clear, with HR operations and HRBPs having defined roles in the model.'
    when p.questionnaire_type = 'leadership' and d.dimension_key = 'systems_enablement' then 'The core HR technology investment is sound, although integration and adoption opportunities remain.'
    when p.questionnaire_type = 'leadership' and d.dimension_key = 'knowledge_self_service' then 'Self-service capability is established and should be able to absorb more routine demand over time.'
    when p.questionnaire_type = 'leadership' and d.dimension_key = 'operational_capacity' then 'Capacity is tighter than ideal, but the function continues to deliver while transformation work progresses.'
    when p.questionnaire_type = 'leadership' and d.dimension_key = 'case_management' then 'The main risk is visibility across channels rather than a fundamental inability to manage cases.'
    when p.questionnaire_type = 'leadership' and d.dimension_key = 'data_handoffs' then 'Data flows are improving, with known manual reconciliation points already identified for future automation.'
    when p.questionnaire_type = 'leadership' and d.dimension_key = 'change_resilience' then 'The organisation has absorbed substantial change and leadership believes the next phase can be delivered successfully.'
    else null
  end,
  '2026-09-03T10:00:00+00'::timestamptz,
  '2026-09-03T10:00:00+00'::timestamptz,
  null,
  '2026-09-03T10:00:00+00'::timestamptz
from completed_scored p
cross join dimensions d;

-- Derive participant-level dimension score records from the score responses.
-- This prevents the stored score fixture from drifting away from its source answers.
insert into public.client_dimension_scores (
  score_id,
  project_id,
  questionnaire_type,
  dimension_key,
  average_score,
  response_count,
  updated_at,
  participant_id,
  score
)
select
  extensions.uuid_generate_v5(
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid,
    'northstar-score:' || r.participant_id::text || ':' || r.dimension_key
  ),
  r.project_id,
  r.questionnaire_type,
  r.dimension_key,
  avg(r.answer_value)::numeric,
  count(r.answer_value)::integer,
  '2026-09-03T10:05:00+00'::timestamptz,
  r.participant_id,
  avg(r.answer_value)::numeric
from public.client_responses r
where r.project_id = '11111111-1111-4111-8111-111111111111'::uuid
  and r.answer_value is not null
group by r.project_id, r.participant_id, r.questionnaire_type, r.dimension_key;

-- Service-access context is present for every completed HR and Manager respondent.
with service_seed as (
  select * from (values
    ('priya.shah@northstar.example',  'hr',      array['HR portal','Shared mailbox','HRBP']::text[], 'HR portal',     3, 'digital_first_with_supported_escalation', 'HR portal',     'HR portal for routine demand; HRBP for complex or business-sensitive matters.'),
    ('daniel.reed@northstar.example', 'hr',      array['HR portal','Shared mailbox']::text[],         'Shared mailbox', 3, 'digital_first_with_supported_escalation', 'HR portal',     'UK managers still use the shared mailbox heavily for operational questions.'),
    ('marta.klein@northstar.example', 'hr',      array['HR portal','HRBP','Email']::text[],           'HRBP',           3, 'digital_first_with_supported_escalation', 'HR portal',     'Regional complexity creates more direct HRBP routing than the intended model.'),
    ('lewis.grant@northstar.example', 'manager', array['HR portal','HRBP','Teams']::text[],           'HRBP',           4, 'digital_first_with_supported_escalation', 'HR portal',     'Direct HRBP access is trusted and often used for time-sensitive matters.'),
    ('sophie.evans@northstar.example','manager', array['Shared mailbox','HR portal','Email']::text[], 'Shared mailbox', 2, 'digital_first_with_supported_escalation', 'HR portal',     'The mailbox is familiar but status visibility is weak once a request is submitted.'),
    ('jonas.weber@northstar.example', 'manager', array['HRBP','Email','HR portal']::text[],           'Email',          2, 'digital_first_with_supported_escalation', 'HR portal',     'Local teams still rely on direct contacts rather than the standard entry point.'),
    ('claire.nolan@northstar.example','manager', array['HR portal','HRBP']::text[],                   'HR portal',      4, 'digital_first_with_supported_escalation', 'HR portal',     'The digital route works for routine needs, with HRBP escalation for complex cases.')
  ) as s(email, questionnaire_type, routes_used, usual_route, effectiveness, intended_access_model, intended_primary_route, detail)
)
insert into public.client_service_access_context (
  context_id,
  project_id,
  participant_id,
  questionnaire_type,
  routes_used,
  usual_route,
  usual_route_effectiveness,
  intended_primary_route,
  specific_route_detail,
  created_at,
  updated_at,
  intended_access_model
)
select
  extensions.uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, 'northstar-service-context:' || p.participant_id::text),
  p.project_id,
  p.participant_id,
  s.questionnaire_type,
  s.routes_used,
  s.usual_route,
  s.effectiveness,
  s.intended_primary_route,
  s.detail,
  '2026-09-03T10:10:00+00'::timestamptz,
  '2026-09-03T10:10:00+00'::timestamptz,
  s.intended_access_model
from service_seed s
join public.client_participants p on p.email = s.email
where p.project_id = '11111111-1111-4111-8111-111111111111'::uuid;

-- Complete contextual Fact Pack using the live form's current JSON shape.
insert into public.client_fact_packs (
  fact_pack_id,
  project_id,
  participant_id,
  invite_token,
  response_json,
  status,
  submitted_at,
  created_at,
  updated_at
)
select
  extensions.uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, 'northstar-fact-pack'),
  p.project_id,
  p.participant_id,
  null,
  '{
    "operatingContext": {
      "workforceStructure": "multi_country_multiple_entities",
      "workforceComposition": {
        "directEmployees": 1070,
        "employerOfRecordEmployees": 20,
        "agencyTemporaryWorkers": 45,
        "independentContractors": 15,
        "otherContingentWorkers": 0,
        "otherContingentDescription": "",
        "diagnosticPopulationInScope": 1150
      },
      "operatingModelShape": "globally_standardised_with_local_variation",
      "geographicFootprint": "Approximately 1,150 workers across the UK, Germany, Netherlands, France, Spain and Ireland. Manufacturing and commercial operations are concentrated in the UK and Germany.",
      "regulatoryExposure": "Multi-jurisdiction employment, works council consultation in Germany, GDPR, UK employment regulation and local payroll/statutory reporting requirements.",
      "recentBusinessContext": "Northstar has grown through a combination of organic expansion and two small acquisitions. Leadership is now focused on standardising people operations without losing necessary local flexibility.",
      "mnaActivity": "recent_or_active",
      "mnaIntegrationComplexity": "moderate",
      "mnaComplexityAreas": ["process_standardisation","data_unification","system_consolidation","policy_harmonisation","local_entity_variation"],
      "mnaAdditionalContext": "One acquired European entity still uses local onboarding, absence and payroll-change processes that have not been fully absorbed into the standard model."
    },
    "systems": {
      "records": [
        {
          "id": "northstar-workday",
          "category": "hris",
          "systemName": "Workday HCM",
          "vendor": "Workday",
          "functionalScope": "broad_operational",
          "owner": "shared",
          "systemOfRecordStatus": "primary_system_of_record",
          "integrationMethod": "workflow_or_api_integrated",
          "workOutsideSystem": "Some employee-change approvals and local exception tracking still take place through email and spreadsheets.",
          "whyOutsideSystem": "Legacy local processes and gaps in configured workflow for complex exceptions.",
          "workaroundDrivers": ["process_not_designed","local_preference","legacy_habit"],
          "workaroundConsequences": ["duplicate_effort","weak_audit_trail","data_quality_risk","ownership_confusion"],
          "keyDependencies": "Identity platform, payroll interfaces and manager data quality.",
          "keyLimitations": "Not all local processes use the global workflow and reporting adoption is uneven."
        },
        {
          "id": "northstar-service",
          "category": "service_platform",
          "systemName": "ServiceNow HRSD",
          "vendor": "ServiceNow",
          "functionalScope": "core_only",
          "owner": "hr",
          "systemOfRecordStatus": "supporting_only",
          "integrationMethod": "basic_integration",
          "workOutsideSystem": "Shared mailboxes and direct HRBP contact remain common for manager queries.",
          "whyOutsideSystem": "The service catalogue is incomplete and users do not consistently trust routing for complex issues.",
          "workaroundDrivers": ["system_limitation","speed_or_convenience","legacy_habit"],
          "workaroundConsequences": ["weak_audit_trail","inconsistent_experience","dependency_on_key_individuals","reporting_issues"],
          "keyDependencies": "Knowledge content, routing rules and HR team adoption.",
          "keyLimitations": "Routine cases are visible but a material share of demand bypasses the platform."
        },
        {
          "id": "northstar-payroll",
          "category": "payroll",
          "systemName": "Regional payroll providers",
          "vendor": "Multiple",
          "functionalScope": "broad_operational",
          "owner": "shared",
          "systemOfRecordStatus": "partial_system_of_record",
          "integrationMethod": "manual_transfer",
          "workOutsideSystem": "Monthly payroll input files and reconciliations are prepared outside the payroll platforms.",
          "whyOutsideSystem": "Multiple providers and inconsistent country integrations.",
          "workaroundDrivers": ["lack_of_integration","control_requirement","legacy_habit"],
          "workaroundConsequences": ["duplicate_effort","slower_turnaround","data_quality_risk","reporting_issues"],
          "keyDependencies": "Accurate Workday changes and local payroll calendars.",
          "keyLimitations": "Reconciliation is labour intensive and exceptions are not visible in one place."
        }
      ],
      "primarySystemsFrictionPoints": "Core platforms are capable, but incomplete workflow coverage, local workarounds and limited integration create duplicate effort and weak end-to-end visibility."
    },
    "serviceDeliveryAndControl": {
      "approvalControlClarity": "defined_but_inconsistently_followed",
      "processStandardisation": "standardised_with_controlled_variation",
      "governanceNotes": "Global process ownership exists for core lifecycle processes, but local exceptions and service-routing governance are not consistently reviewed."
    },
    "dataAndIntegration": {
      "employeeDataSourceOfTruth": "mostly_centralised_with_some_duplication",
      "integrationQuality": "basic_integrations",
      "reportingModel": "mixed_manual_and_system_reporting",
      "recurringDataIssues": "Late employee changes, local spreadsheet tracking and payroll reconciliation create recurring mismatches and manual correction effort.",
      "securityAuditRegulatoryConstraints": "GDPR, local works council requirements, payroll control evidence and segregation of duties for sensitive employee changes."
    },
    "changeAndFutureState": {
      "transformationStatus": "significant_change_in_planning",
      "approvedFutureState": "A clearer tiered HR service model with the portal as the default entry point, stronger case visibility and fewer local manual handoffs.",
      "proposedFutureState": "Consolidated knowledge, expanded ServiceNow routing, improved Workday workflows and more automated payroll integrations.",
      "initiatives": [
        {"id":"northstar-initiative-1","name":"HR Service Model Reset","status":"approved","scope":"Service catalogue, routing, ownership and knowledge","sponsor":"Chief People Officer","timeline":"Q4 2026 - Q2 2027"},
        {"id":"northstar-initiative-2","name":"Payroll Integration Improvement","status":"proposed","scope":"Reduce manual country payroll files and reconciliation","sponsor":"HR Operations Director","timeline":"2027"}
      ]
    },
    "aiAndAutomation": {
      "aiAdoption": "early_exploration",
      "currentAiUsage": "Limited use of approved enterprise assistants for drafting and knowledge search. No autonomous HR decision-making.",
      "activeAiInitiatives": "Exploring assisted knowledge search and case categorisation once the service taxonomy is stabilised.",
      "aiGovernanceMaturity": "emerging",
      "aiRiskConcerns": "Employee-data privacy, hallucinated policy advice, inconsistent source content and unclear accountability for automated recommendations."
    },
    "advisoryContext": {
      "biggestOperationalConstraint": "Demand enters through too many routes, which weakens ownership, case visibility and the ability to manage capacity systematically.",
      "highestValueImprovement": "Make the intended service model real in day-to-day use by simplifying entry points, clarifying ownership and improving knowledge and workflow coverage.",
      "toleratedRisks": "Some local process variation will remain where legal or operationally necessary; the priority is controlled variation rather than absolute standardisation.",
      "additionalInterpretationContext": "Leadership is more optimistic than managers about current enablement. The diagnostic should treat this as a sponsor-perception gap rather than blend Leadership into operational maturity."
    }
  }'::jsonb,
  'completed',
  '2026-09-03T11:00:00+00'::timestamptz,
  '2026-09-03T10:45:00+00'::timestamptz,
  '2026-09-03T11:00:00+00'::timestamptz
from public.client_participants p
where p.project_id = '11111111-1111-4111-8111-111111111111'::uuid
  and p.questionnaire_type = 'client_fact_pack';

-- Hard fixture assertions. Any schema/data drift aborts the transaction.
do $$
declare
  v_participants integer;
  v_completed_hr integer;
  v_completed_manager integer;
  v_completed_leadership integer;
  v_responses integer;
  v_scored_responses integer;
  v_probe_responses integer;
  v_scores integer;
  v_context integer;
  v_fact_pack integer;
begin
  select count(*) into v_participants
  from public.client_participants
  where project_id = '11111111-1111-4111-8111-111111111111'::uuid;

  select count(*) into v_completed_hr
  from public.client_participants
  where project_id = '11111111-1111-4111-8111-111111111111'::uuid
    and questionnaire_type = 'hr' and participant_status = 'completed';

  select count(*) into v_completed_manager
  from public.client_participants
  where project_id = '11111111-1111-4111-8111-111111111111'::uuid
    and questionnaire_type = 'manager' and participant_status = 'completed';

  select count(*) into v_completed_leadership
  from public.client_participants
  where project_id = '11111111-1111-4111-8111-111111111111'::uuid
    and questionnaire_type = 'leadership' and participant_status = 'completed';

  select count(*), count(*) filter (where answer_value is not null), count(*) filter (where answer_value is null)
    into v_responses, v_scored_responses, v_probe_responses
  from public.client_responses
  where project_id = '11111111-1111-4111-8111-111111111111'::uuid;

  select count(*) into v_scores
  from public.client_dimension_scores
  where project_id = '11111111-1111-4111-8111-111111111111'::uuid;

  select count(*) into v_context
  from public.client_service_access_context
  where project_id = '11111111-1111-4111-8111-111111111111'::uuid;

  select count(*) into v_fact_pack
  from public.client_fact_packs
  where project_id = '11111111-1111-4111-8111-111111111111'::uuid;

  if v_participants <> 14 then raise exception 'Northstar fixture participant count mismatch: %', v_participants; end if;
  if v_completed_hr <> 3 then raise exception 'Northstar fixture HR completion mismatch: %', v_completed_hr; end if;
  if v_completed_manager <> 4 then raise exception 'Northstar fixture Manager completion mismatch: %', v_completed_manager; end if;
  if v_completed_leadership <> 2 then raise exception 'Northstar fixture Leadership completion mismatch: %', v_completed_leadership; end if;
  if v_responses <> 540 then raise exception 'Northstar fixture response count mismatch: %', v_responses; end if;
  if v_scored_responses <> 450 then raise exception 'Northstar fixture scored response count mismatch: %', v_scored_responses; end if;
  if v_probe_responses <> 90 then raise exception 'Northstar fixture probe response count mismatch: %', v_probe_responses; end if;
  if v_scores <> 90 then raise exception 'Northstar fixture dimension score count mismatch: %', v_scores; end if;
  if v_context <> 7 then raise exception 'Northstar fixture service context count mismatch: %', v_context; end if;
  if v_fact_pack <> 1 then raise exception 'Northstar fixture Fact Pack count mismatch: %', v_fact_pack; end if;
end $$;

commit;

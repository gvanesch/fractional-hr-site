-- Northstar SMB golden fixture regression assertions
-- QA only. Read-only validation queries.

-- 1. Core fixture shape
select
  (select count(*) from public.client_projects where project_id='11111111-1111-4111-8111-111111111111'::uuid) as projects,
  (select count(*) from public.client_participants where project_id='11111111-1111-4111-8111-111111111111'::uuid) as participants,
  (select count(*) from public.client_responses where project_id='11111111-1111-4111-8111-111111111111'::uuid) as responses,
  (select count(*) from public.client_responses where project_id='11111111-1111-4111-8111-111111111111'::uuid and answer_value is not null) as scored_responses,
  (select count(*) from public.client_responses where project_id='11111111-1111-4111-8111-111111111111'::uuid and answer_value is null) as probe_responses,
  (select count(*) from public.client_dimension_scores where project_id='11111111-1111-4111-8111-111111111111'::uuid) as dimension_scores,
  (select count(*) from public.client_service_access_context where project_id='11111111-1111-4111-8111-111111111111'::uuid) as service_context,
  (select count(*) from public.client_fact_packs where project_id='11111111-1111-4111-8111-111111111111'::uuid) as fact_packs;
-- Expected: 1 / 14 / 540 / 450 / 90 / 90 / 7 / 1

-- 2. Completion state by respondent group
select questionnaire_type::text as respondent_group,
       count(*) as invited,
       count(*) filter(where participant_status='completed') as completed,
       count(*) filter(where participant_status<>'completed') as outstanding
from public.client_participants
where project_id='11111111-1111-4111-8111-111111111111'::uuid
  and questionnaire_type in('hr','manager','leadership')
group by questionnaire_type
order by questionnaire_type;
-- Expected:
-- HR          4 invited / 3 completed / 1 outstanding
-- Manager     6 invited / 4 completed / 2 outstanding
-- Leadership  3 invited / 2 completed / 1 outstanding
-- Current build-project-summary policy therefore recommends min N = 3.

-- 3. Perspective averages by dimension
select questionnaire_type::text as respondent_group,
       dimension_key,
       round(avg(average_score)::numeric,2) as average_score,
       count(*) as n
from public.client_dimension_scores
where project_id='11111111-1111-4111-8111-111111111111'::uuid
group by questionnaire_type, dimension_key
order by dimension_key, questionnaire_type;
-- Intended pattern:
-- * HR broadly moderate/strong
-- * Managers materially weaker in service_access, systems_enablement,
--   knowledge_self_service, operational_capacity and data_handoffs
-- * Leadership generally optimistic but n=2 and therefore below current
--   recommended reporting threshold

-- 4. Key operational gaps. These should remain material enough to exercise
-- alignment/gap logic.
with g as (
  select questionnaire_type::text as respondent_group,
         dimension_key,
         avg(average_score)::numeric as avg_score
  from public.client_dimension_scores
  where project_id='11111111-1111-4111-8111-111111111111'::uuid
  group by questionnaire_type, dimension_key
)
select h.dimension_key,
       round(h.avg_score,2) as hr,
       round(m.avg_score,2) as manager,
       round(abs(h.avg_score-m.avg_score),2) as gap
from g h
join g m using(dimension_key)
where h.respondent_group='hr' and m.respondent_group='manager'
order by gap desc, dimension_key;

-- 5. Segment composition. This deliberately includes below-threshold and
-- group-dominated cuts for privacy/anti-differencing regression QA.
select k.key, k.value,
       count(*) filter(where p.participant_status='completed') as completed,
       count(*) as invited,
       count(*) filter(where p.participant_status='completed' and p.questionnaire_type='hr') as hr_completed,
       count(*) filter(where p.participant_status='completed' and p.questionnaire_type='manager') as manager_completed,
       count(*) filter(where p.participant_status='completed' and p.questionnaire_type='leadership') as leadership_completed
from public.client_participants p
cross join lateral jsonb_each_text(p.segmentation_values) k
where p.project_id='11111111-1111-4111-8111-111111111111'::uuid
  and p.questionnaire_type in('hr','manager','leadership')
group by k.key,k.value
order by k.key,k.value;

-- 6. Stored dimension scores must equal their source responses.
with derived as (
  select participant_id, questionnaire_type, dimension_key,
         avg(answer_value)::numeric as derived_score,
         count(answer_value)::int as derived_n
  from public.client_responses
  where project_id='11111111-1111-4111-8111-111111111111'::uuid
    and answer_value is not null
  group by participant_id, questionnaire_type, dimension_key
)
select count(*) as mismatches
from derived d
join public.client_dimension_scores s
  on s.project_id='11111111-1111-4111-8111-111111111111'::uuid
 and s.participant_id=d.participant_id
 and s.questionnaire_type=d.questionnaire_type
 and s.dimension_key=d.dimension_key
where s.average_score<>d.derived_score
   or s.response_count<>d.derived_n;
-- Expected: 0

-- 7. Credential-history tables are intentionally not seeded by the golden
-- analytical fixture. QA authentication tests must create fresh OTP/session
-- state through the real QA flow.
select
  (select count(*) from public.client_participant_otp_challenges where project_id='11111111-1111-4111-8111-111111111111'::uuid) as otp_history,
  (select count(*) from public.client_participant_verified_sessions where project_id='11111111-1111-4111-8111-111111111111'::uuid) as verified_sessions;
-- Expected immediately after seed: 0 / 0

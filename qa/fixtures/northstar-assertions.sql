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

-- 4. Canonical maturity and alignment regression.
-- Canonical dimension maturity is the mean across all valid scored respondents:
-- HR + Manager + Leadership. Each respondent contributes equally, so differently
-- sized perspective groups contribute in proportion to their valid respondent N.
--
-- Perspective interpretation remains separate. HR-vs-Manager absolute gap is the
-- primary operational alignment signal. Leadership is retained as a separate
-- strategic/sponsor perspective and is not part of the HR-vs-Manager gap.
with grouped as (
  select dimension_key,
         questionnaire_type::text as respondent_group,
         avg(average_score)::numeric as avg_score,
         count(distinct participant_id) as n
  from public.client_dimension_scores
  where project_id='11111111-1111-4111-8111-111111111111'::uuid
    and questionnaire_type in('hr','manager','leadership')
  group by dimension_key, questionnaire_type
), pivoted as (
  select dimension_key,
         max(avg_score) filter(where respondent_group='hr') as hr,
         max(avg_score) filter(where respondent_group='manager') as manager,
         max(avg_score) filter(where respondent_group='leadership') as leadership,
         max(n) filter(where respondent_group='hr') as hr_n,
         max(n) filter(where respondent_group='manager') as manager_n,
         max(n) filter(where respondent_group='leadership') as leadership_n
  from grouped
  group by dimension_key
)
select dimension_key,
       round(hr,2) as hr,
       round(manager,2) as manager,
       round(leadership,2) as leadership,
       hr_n, manager_n, leadership_n,
       round(
         (
           coalesce(hr,0) * coalesce(hr_n,0) +
           coalesce(manager,0) * coalesce(manager_n,0) +
           coalesce(leadership,0) * coalesce(leadership_n,0)
         ) /
         nullif(
           coalesce(hr_n,0) + coalesce(manager_n,0) + coalesce(leadership_n,0),
           0
         ),
         2
       ) as maturity_score,
       round(abs(hr-manager),2) as operational_gap,
       case when abs(hr-manager)<=0.5 then 'aligned'
            when abs(hr-manager)<=1.0 then 'emerging_gap'
            else 'significant_gap' end as alignment
from pivoted
order by dimension_key;
-- Golden expected outputs:
-- case_management        maturity 3.29 / gap 0.02 / aligned
-- change_resilience      maturity 3.20 / gap 0.05 / aligned
-- consistency            maturity 3.56 / gap 1.00 / emerging_gap
-- data_handoffs          maturity 2.78 / gap 1.00 / emerging_gap
-- knowledge_self_service maturity 2.76 / gap 1.00 / emerging_gap
-- operational_capacity   maturity 2.62 / gap 1.02 / significant_gap
-- ownership              maturity 3.51 / gap 0.98 / emerging_gap
-- process_clarity        maturity 3.62 / gap 1.02 / significant_gap
-- service_access         maturity 2.76 / gap 1.05 / significant_gap
-- systems_enablement     maturity 2.73 / gap 0.93 / emerging_gap

-- Boundary expectations for HR-vs-Manager alignment classification:
-- gap <= 0.50  => aligned
-- gap <= 1.00  => emerging_gap
-- gap >  1.00  => significant_gap

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

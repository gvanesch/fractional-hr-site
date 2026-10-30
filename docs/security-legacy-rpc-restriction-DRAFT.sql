-- REVIEW DRAFT ONLY. Not a migration and never run by QA or production CI.
-- Do not execute until callers and the exact live ACLs have been checked and
-- production permission changes have been separately approved.
-- Preserve Supabase Auth, all table data and baseline D1 access.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.save_client_fact_pack(uuid,uuid,uuid,jsonb,text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_client_diagnostic(uuid,uuid,uuid,public.client_questionnaire_type,jsonb,jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_client_diagnostic(uuid,uuid,uuid,public.client_questionnaire_type,jsonb,jsonb,jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_client_fact_pack(uuid,uuid,uuid,jsonb,text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_client_diagnostic(uuid,uuid,uuid,public.client_questionnaire_type,jsonb,jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_client_diagnostic(uuid,uuid,uuid,public.client_questionnaire_type,jsonb,jsonb,jsonb)
  TO service_role;
-- Deliberate rollback: a reviewer must explicitly replace this after approval.
ROLLBACK;

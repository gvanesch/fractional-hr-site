import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";

export async function requireAdvisorUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const userEmail = user?.email ?? null;

  if (error || !user || !isAllowedAdvisorEmail(userEmail)) {
    return null;
  }

  return user;
}
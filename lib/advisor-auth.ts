import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";

export async function requireAdvisorUser() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    const userEmail = user?.email ?? null;

    if (error) {
      console.error("[advisor-auth] supabase.auth.getUser() returned error", {
        message: error.message,
        name: error.name,
        status: (error as { status?: number }).status,
      });
      return null;
    }

    if (!user) {
      return null;
    }

    if (!isAllowedAdvisorEmail(userEmail)) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("[advisor-auth] requireAdvisorUser failed", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return null;
  }
}
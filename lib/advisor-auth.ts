import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAdvisorUser() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("[advisor-auth] supabase.auth.getSession() returned error", {
        message: error.message,
        name: error.name,
        status: (error as { status?: number }).status,
      });
      return null;
    }

    if (!session?.user) {
      return null;
    }

    const allowedEmails = (process.env.ADVISOR_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = session.user.email?.toLowerCase() ?? "";

    if (!userEmail || !allowedEmails.includes(userEmail)) {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error("[advisor-auth] requireAdvisorUser failed", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return null;
  }
}
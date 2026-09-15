import { getD1Database } from "@/lib/d1/database";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function checkD1Connection(): Promise<"connected" | "unavailable"> {
  try {
    const result = await getD1Database()
      .prepare("SELECT 1 AS ok")
      .first<{ ok: number }>();

    if (result?.ok !== 1) {
      throw new Error("Unexpected D1 health-check response.");
    }

    return "connected";
  } catch (error) {
    console.error("D1_HEALTH_CHECK_FAILED", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return "unavailable";
  }
}

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("client_projects")
      .select("project_id")
      .limit(1);

    if (error) {
      throw error;
    }

    const d1 = await checkD1Connection();

    return Response.json({
      status: "ok",
      supabase: "connected",
      d1,
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        supabase: "unavailable",
        message:
          error instanceof Error ? error.message : "Unknown health check error",
      },
      { status: 500 },
    );
  }
}

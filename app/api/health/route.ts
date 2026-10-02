import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isCloudflareAdvisorAuthEnabled } from "@/lib/cloudflare-access";
import { getD1Database } from "@/lib/d1/database";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function checkD1Connection(): Promise<"connected" | "unavailable"> {
  try {
    const result = await getD1Database()
      .prepare("SELECT COUNT(*) AS event_count FROM system_events")
      .first<{ event_count: number }>();

    if (!result || typeof result.event_count !== "number") {
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
    const env = getCloudflareContext().env as CloudflareEnv &
      Record<string, unknown>;
    const modes = [
      env.D1_SYSTEM_EVENTS_MODE,
      env.D1_DIAGNOSTIC_SUBMISSIONS_MODE,
      env.D1_CRM_PROSPECTS_MODE,
      env.D1_CLIENT_DIAGNOSTIC_MODE,
      env.D1_CLIENT_DIAGNOSTIC_SECURITY_MODE,
    ];
    const d1 = await checkD1Connection();
    const d1Required = modes.some((mode) => mode === "d1");
    if (
      modes.every((mode) => mode === "d1") &&
      isCloudflareAdvisorAuthEnabled()
    ) {
      return Response.json(
        {
          status: d1 === "connected" ? "ok" : "error",
          supabase: "not_required",
          d1,
        },
        { status: d1 === "connected" ? 200 : 503 },
      );
    }
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("client_projects")
      .select("project_id")
      .limit(1);

    if (error) {
      throw error;
    }

    return Response.json(
      {
        status: d1Required && d1 !== "connected" ? "error" : "ok",
        supabase: "connected",
        d1,
      },
      { status: d1Required && d1 !== "connected" ? 503 : 200 },
    );
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

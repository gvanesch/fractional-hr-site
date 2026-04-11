import { NextResponse } from "next/server";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const advisorUser = await requireAdvisorUser();

    if (!advisorUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 403 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("client_projects")
      .select(
        "project_id, project_name, company_name, project_status, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      projects: data,
    });
  } catch (error) {
    console.error("Failed to fetch projects", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}
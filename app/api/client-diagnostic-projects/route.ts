import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdvisorUser } from "@/lib/advisor-auth";


export async function GET() {
  try {
    const advisorUser = await requireAdvisorUser();

    if (!advisorUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 403 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await supabase
      .from("client_projects")
      .select("project_id, project_name, company_name, project_status, created_at")
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
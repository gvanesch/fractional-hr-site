import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdvisorUser } from "@/lib/advisor-auth";


type UpdateProjectStatusRequest = {
  projectId: string;
  projectStatus: "active" | "closed";
};

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function PATCH(request: Request) {
  try {
    const advisorUser = await requireAdvisorUser();

    if (!advisorUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Partial<UpdateProjectStatusRequest>;

    if (!body.projectId || typeof body.projectId !== "string") {
      return NextResponse.json(
        { success: false, error: "projectId is required." },
        { status: 400 },
      );
    }

    if (!isUuid(body.projectId)) {
      return NextResponse.json(
        { success: false, error: "projectId must be a valid UUID." },
        { status: 400 },
      );
    }

    if (body.projectStatus !== "active" && body.projectStatus !== "closed") {
      return NextResponse.json(
        { success: false, error: "projectStatus must be active or closed." },
        { status: 400 },
      );
    }

    const supabase = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data, error } = await supabase
      .from("client_projects")
      .update({
        project_status: body.projectStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("project_id", body.projectId)
      .select("project_id, project_status")
      .single();

    if (error || !data) {
      console.error("Failed to update project status", error);

      return NextResponse.json(
        { success: false, error: "Unable to update project status." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      projectId: data.project_id,
      projectStatus: data.project_status,
    });
  } catch (error) {
    console.error("Unexpected error updating project status", error);

    return NextResponse.json(
      { success: false, error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
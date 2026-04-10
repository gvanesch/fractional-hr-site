import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdvisorUser } from "@/lib/advisor-auth";

export const dynamic = "force-dynamic";

type CreateParticipantBody = {
  projectId?: string;
  questionnaireType?: "hr" | "manager" | "leadership" | "client_fact_pack";
  roleLabel?: string;
  name?: string;
  email?: string;
};

function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isValidQuestionnaireType(
  value: string,
): value is "hr" | "manager" | "leadership" | "client_fact_pack" {
  return ["hr", "manager", "leadership", "client_fact_pack"].includes(value);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const advisorUser = await requireAdvisorUser();

    if (!advisorUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as CreateParticipantBody;

    const projectId = body.projectId?.trim() ?? "";
    const questionnaireType = body.questionnaireType?.trim() ?? "";
    const roleLabel = body.roleLabel?.trim() ?? "";
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!projectId || !isUuid(projectId)) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid projectId is required.",
        },
        { status: 400 },
      );
    }

    if (!isValidQuestionnaireType(questionnaireType)) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid questionnaireType is required.",
        },
        { status: 400 },
      );
    }

    if (!roleLabel) {
      return NextResponse.json(
        {
          success: false,
          error: "roleLabel is required.",
        },
        { status: 400 },
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid email address is required.",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: project, error: projectError } = await supabase
      .from("client_projects")
      .select("project_id")
      .eq("project_id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found.",
        },
        { status: 404 },
      );
    }

    const { data: existingParticipant, error: existingParticipantError } =
      await supabase
        .from("client_participants")
        .select("participant_id")
        .eq("project_id", projectId)
        .eq("email", email)
        .maybeSingle();

    if (existingParticipantError) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to validate existing participants.",
        },
        { status: 500 },
      );
    }

    if (existingParticipant) {
      return NextResponse.json(
        {
          success: false,
          error: "A participant with this email already exists for the project.",
        },
        { status: 409 },
      );
    }

    const { data: participant, error: insertError } = await supabase
      .from("client_participants")
      .insert({
        project_id: projectId,
        questionnaire_type: questionnaireType,
        role_label: roleLabel,
        name: name || null,
        email,
        participant_status: "invited",
        invited_at: new Date().toISOString(),
      })
      .select(
        "participant_id, project_id, questionnaire_type, role_label, name, email, participant_status, invited_at",
      )
      .single();

    if (insertError || !participant) {
      console.error("[advisor-project-participants] insert failed", {
        insertError,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Unable to create participant.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        participant,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[advisor-project-participants] POST failed", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error while creating participant.",
      },
      { status: 500 },
    );
  }
}
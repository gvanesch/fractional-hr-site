import { NextResponse } from "next/server";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type CreateParticipantBody = {
  projectId?: string;
  questionnaireType?: "hr" | "manager" | "leadership" | "client_fact_pack";
  roleLabel?: string;
  name?: string;
  email?: string;
};

const DEFAULT_INVITE_EXPIRY_DAYS = 21;

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

function getDefaultInviteExpiresAt(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_INVITE_EXPIRY_DAYS);
  return expiresAt.toISOString();
}

export async function POST(request: Request): Promise<Response> {
  try {
    const advisorUser = await requireAdvisorUser();

    if (!advisorUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
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
        { success: false, error: "A valid projectId is required." },
        { status: 400 },
      );
    }

    if (!isValidQuestionnaireType(questionnaireType)) {
      return NextResponse.json(
        { success: false, error: "A valid questionnaireType is required." },
        { status: 400 },
      );
    }

    if (!roleLabel) {
      return NextResponse.json(
        { success: false, error: "roleLabel is required." },
        { status: 400 },
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    // 🔒 Check project exists AND is active
    const { data: project, error: projectError } = await supabase
      .from("client_projects")
      .select("project_id, project_status")
      .eq("project_id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 },
      );
    }

    if (project.project_status !== "active") {
      return NextResponse.json(
        { success: false, error: "Project is not active." },
        { status: 409 },
      );
    }

    // 🔒 Prevent duplicate emails in project
    const { data: existing, error: existingError } = await supabase
      .from("client_participants")
      .select("participant_id")
      .eq("project_id", projectId)
      .eq("email", email)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to validate existing participants.",
        },
        { status: 500 },
      );
    }

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "A participant with this email already exists.",
        },
        { status: 409 },
      );
    }

    const inviteExpiresAt = getDefaultInviteExpiresAt();

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
        invite_expires_at: inviteExpiresAt,
      })
      .select(
        "participant_id, email, participant_status, invite_expires_at",
      )
      .single();

    if (insertError || !participant) {
      console.error("Participant insert failed", insertError);

      return NextResponse.json(
        { success: false, error: "Unable to create participant." },
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
    console.error("Unexpected error creating participant", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
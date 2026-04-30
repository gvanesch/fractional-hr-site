import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendParticipantEventEmail } from "@/lib/client-diagnostic/participant-email";
import {
  validateSegmentationValues,
  type SegmentationSchema,
  type SegmentationValues,
} from "@/lib/client-diagnostic/segmentation";

export const dynamic = "force-dynamic";

type QuestionnaireType = "hr" | "manager" | "leadership" | "client_fact_pack";

type CreateParticipantBody = {
  projectId?: string;
  questionnaireType?: QuestionnaireType;
  roleLabel?: string;
  name?: string;
  email?: string;
  segmentationValues?: SegmentationValues | null;
};

type ProjectRow = {
  project_id: string;
  project_name: string | null;
  company_name: string;
  project_status: string;
  segmentation_schema: SegmentationSchema | null;
};

type InsertedParticipantRow = {
  participant_id: string;
  email: string;
  name: string | null;
  questionnaire_type: QuestionnaireType;
  invite_token: string | null;
  participant_status: string;
  invite_expires_at: string | null;
};

const DEFAULT_INVITE_EXPIRY_DAYS = 21;

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

function isValidQuestionnaireType(value: string): value is QuestionnaireType {
  return ["hr", "manager", "leadership", "client_fact_pack"].includes(value);
}

function isScoredQuestionnaireType(
  questionnaireType: QuestionnaireType,
): boolean {
  return (
    questionnaireType === "hr" ||
    questionnaireType === "manager" ||
    questionnaireType === "leadership"
  );
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

    const { data: project, error: projectError } = await supabase
      .from("client_projects")
      .select(
        "project_id, project_name, company_name, project_status, segmentation_schema",
      )
      .eq("project_id", projectId)
      .single<ProjectRow>();

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

    let validatedSegmentationValues: SegmentationValues | null = null;

    if (isScoredQuestionnaireType(questionnaireType)) {
      if (!project.segmentation_schema) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Project segmentation schema is unavailable, so a scored participant cannot be added.",
          },
          { status: 400 },
        );
      }

      validatedSegmentationValues = validateSegmentationValues(
        project.segmentation_schema,
        body.segmentationValues,
      );

      if (!validatedSegmentationValues) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Function, location, and level are required for scored participants.",
          },
          { status: 400 },
        );
      }
    }

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
        segmentation_values: validatedSegmentationValues,
        participant_status: "invited",
        invited_at: new Date().toISOString(),
        invite_expires_at: inviteExpiresAt,
      })
      .select(
        "participant_id, email, name, questionnaire_type, invite_token, participant_status, invite_expires_at",
      )
      .single<InsertedParticipantRow>();

    if (insertError || !participant) {
      console.error("Participant insert failed", insertError);

      return NextResponse.json(
        { success: false, error: "Unable to create participant." },
        { status: 500 },
      );
    }

    const resend = new Resend(getEnv("RESEND_API_KEY"));
    const siteUrl = getEnv("NEXT_PUBLIC_SITE_URL").replace(/\/+$/, "");
    const fromEmail = getEnv("CONTACT_FROM_EMAIL");
    const replyToEmail = getEnv("CONTACT_TO_EMAIL");
    const projectName = project.project_name?.trim() || project.company_name;

    const emailResult = await sendParticipantEventEmail({
      resend,
      fromEmail,
      replyToEmail,
      siteUrl,
      projectName,
      companyName: project.company_name,
      eventType: "invite",
      participant: {
        name: participant.name?.trim() || roleLabel,
        email: participant.email,
        questionnaireType: participant.questionnaire_type,
        inviteToken: participant.invite_token,
        inviteExpiresAt: participant.invite_expires_at,
      },
    });

    if (!emailResult.success) {
      console.error("Participant created but invite email failed", {
        projectId,
        participantId: participant.participant_id,
        participantEmail: participant.email,
        error: emailResult.error,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Participant created, but the invitation email failed.",
          participant,
          emailResult,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        participant,
        emailResult,
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
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { requireAdvisorUser } from "@/lib/advisor-auth";

export const runtime = "nodejs";

type QuestionnaireType = "HR" | "Manager" | "Leadership";
type DatabaseQuestionnaireType = "hr" | "manager" | "leadership";

type ParticipantInput = {
  name: string;
  email: string;
  questionnaireType: QuestionnaireType;
};

type CreateProjectRequest = {
  projectName: string;
  companyName?: string;
  participants: ParticipantInput[];
};

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function mapQuestionnaireTypeToDatabaseValue(
  questionnaireType: QuestionnaireType,
): DatabaseQuestionnaireType {
  switch (questionnaireType) {
    case "HR":
      return "hr";
    case "Manager":
      return "manager";
    case "Leadership":
      return "leadership";
    default:
      throw new Error(`Unsupported questionnaire type: ${questionnaireType}`);
  }
}

function buildEmailSubject(projectName: string) {
  return `Input requested: ${projectName} HR operations diagnostic`;
}

function buildEmailHtml(params: {
  name: string;
  projectName: string;
  inviteUrl: string;
}) {
  const { name, projectName, inviteUrl } = params;

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 560px;">
      <p>Hi ${name},</p>

      <p>You’ve been asked to contribute to an HR operations diagnostic for <strong>${projectName}</strong>.</p>

      <p>This is not a generic survey. It is used to assess how HR services are designed, delivered, and experienced across the organisation.</p>

      <p>Your input will be combined with other perspectives to identify where processes are working, where they are inconsistent, and where operational friction exists.</p>

      <p><strong>The questionnaire takes around 8–10 minutes to complete.</strong></p>

      <p style="margin: 24px 0;">
        <a href="${inviteUrl}" 
           style="display:inline-block;padding:12px 18px;background:#1E6FD9;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
          Start questionnaire
        </a>
      </p>

      <p>If you need to pause, you can return to the same link at any time.</p>

      <p style="margin-top: 24px;">
        Thank you for your input,<br/>
        Van Esch Advisory
      </p>
    </div>
  `;
}

function buildEmailText(params: {
  name: string;
  projectName: string;
  inviteUrl: string;
}) {
  const { name, projectName, inviteUrl } = params;

  return [
    `Hi ${name},`,
    ``,
    `You’ve been asked to contribute to an HR operations diagnostic for ${projectName}.`,
    ``,
    `This is not a generic survey. It is used to assess how HR services are designed, delivered, and experienced across the organisation.`,
    ``,
    `Your input will be combined with other perspectives to identify where processes are working, where they are inconsistent, and where operational friction exists.`,
    ``,
    `The questionnaire takes around 8–10 minutes to complete.`,
    ``,
    `Start questionnaire: ${inviteUrl}`,
    ``,
    `If you need to pause, you can return to the same link at any time.`,
    ``,
    `Thank you for your input,`,
    `Van Esch Advisory`,
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const advisorUser = await requireAdvisorUser();

    if (!advisorUser) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 },
      );
    }

    const supabase = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const resend = new Resend(getEnv("RESEND_API_KEY"));

    const body = (await request.json()) as CreateProjectRequest;

    const projectName = body.projectName?.trim();
    const participants = body.participants || [];

    if (!projectName) {
      return NextResponse.json(
        { error: "Project name is required." },
        { status: 400 },
      );
    }

    if (participants.length === 0) {
      return NextResponse.json(
        { error: "At least one participant is required." },
        { status: 400 },
      );
    }

    for (let i = 0; i < participants.length; i += 1) {
      const participant = participants[i];

      if (!participant.name?.trim()) {
        return NextResponse.json(
          { error: `Participant ${i + 1} missing name.` },
          { status: 400 },
        );
      }

      if (!participant.email?.trim() || !isValidEmail(participant.email)) {
        return NextResponse.json(
          { error: `Participant ${i + 1} email invalid.` },
          { status: 400 },
        );
      }

      if (
        participant.questionnaireType !== "HR" &&
        participant.questionnaireType !== "Manager" &&
        participant.questionnaireType !== "Leadership"
      ) {
        return NextResponse.json(
          { error: `Participant ${i + 1} questionnaire type invalid.` },
          { status: 400 },
        );
      }
    }

    const primary = participants[0];

    const { data: project, error: projectError } = await supabase
      .from("client_projects")
      .insert({
        project_name: projectName,
        company_name: body.companyName?.trim() || projectName,
        primary_contact_name: primary.name.trim(),
        primary_contact_email: primary.email.trim().toLowerCase(),
        project_status: "active",
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error("Failed to create project", projectError);

      return NextResponse.json(
        { error: "Failed to create project." },
        { status: 500 },
      );
    }

    const participantRows = participants.map((participant) => ({
      project_id: project.project_id,
      questionnaire_type: mapQuestionnaireTypeToDatabaseValue(
        participant.questionnaireType,
      ),
      role_label: participant.questionnaireType,
      name: participant.name.trim(),
      email: participant.email.trim().toLowerCase(),
    }));

    const {
      data: insertedParticipants,
      error: participantError,
    } = await supabase
      .from("client_participants")
      .insert(participantRows)
      .select();

    if (participantError || !insertedParticipants) {
      console.error("Failed to create participants", participantError);

      return NextResponse.json(
        { error: "Failed to create participants." },
        { status: 500 },
      );
    }

    const siteUrl = getEnv("NEXT_PUBLIC_SITE_URL").replace(/\/+$/, "");
    const fromEmail = getEnv("CONTACT_FROM_EMAIL");
    const replyToEmail = getEnv("CONTACT_TO_EMAIL");

    await Promise.all(
      insertedParticipants.map(async (participant: any) => {
        const inviteUrl = `${siteUrl}/client-diagnostic/respond/${participant.invite_token}`;

        await resend.emails.send({
          from: `Van Esch Advisory <${fromEmail}>`,
          to: participant.email,
          replyTo: replyToEmail,
          subject: buildEmailSubject(projectName),
          html: buildEmailHtml({
            name: participant.name,
            projectName,
            inviteUrl,
          }),
          text: buildEmailText({
            name: participant.name,
            projectName,
            inviteUrl,
          }),
        });
      }),
    );

    return NextResponse.json({
      success: true,
      projectId: project.project_id,
      participants: insertedParticipants.length,
    });
  } catch (error) {
    console.error("Unexpected error in create-project route", error);

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
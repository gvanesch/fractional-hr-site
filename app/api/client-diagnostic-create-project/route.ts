import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  validateSegmentationSchema,
  validateSegmentationValues,
  type SegmentationSchema,
  type SegmentationValues,
} from "@/lib/client-diagnostic/segmentation";

type UiQuestionnaireType = "HR" | "Manager" | "Leadership";
type DatabaseQuestionnaireType =
  | "hr"
  | "manager"
  | "leadership"
  | "client_fact_pack";

type ParticipantInput = {
  name: string;
  email: string;
  questionnaireType: UiQuestionnaireType;
  segmentationValues: SegmentationValues;
};

type FactPackRecipientInput = {
  name: string;
  email: string;
};

type CreateProjectRequest = {
  projectName: string;
  companyName?: string;
  segmentationSchema: SegmentationSchema;
  participants: ParticipantInput[];
  factPackRecipient?: FactPackRecipientInput | null;
};

type EmailSendResult = {
  email: string;
  success: boolean;
  resendId: string | null;
  error: string | null;
};

type InsertedParticipantRow = {
  participant_id: string;
  project_id: string;
  questionnaire_type: DatabaseQuestionnaireType;
  role_label: string;
  name: string;
  email: string;
  segmentation_values: SegmentationValues | null;
  invite_token: string | null;
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function mapQuestionnaireTypeToDatabaseValue(
  questionnaireType: UiQuestionnaireType,
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

function buildDiagnosticEmailSubject(projectName: string): string {
  return `Input requested: ${projectName} HR operations diagnostic`;
}

function buildDiagnosticEmailHtml(params: {
  name: string;
  projectName: string;
  inviteUrl: string;
}): string {
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

function buildDiagnosticEmailText(params: {
  name: string;
  projectName: string;
  inviteUrl: string;
}): string {
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

function buildFactPackEmailSubject(projectName: string): string {
  return `Input requested: ${projectName} client fact pack`;
}

function buildFactPackEmailHtml(params: {
  name: string;
  projectName: string;
  inviteUrl: string;
}): string {
  const { name, projectName, inviteUrl } = params;

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 560px;">
      <p>Hi ${name},</p>

      <p>You’ve been asked to complete the Client Fact Pack for <strong>${projectName}</strong>.</p>

      <p>This captures contextual information on the current people operations environment, including systems, tooling, infrastructure, and delivery context.</p>

      <p>It is used to strengthen final interpretation and advisory output, but it is not included in scored statistical analysis.</p>

      <p><strong>This input should only be completed once for the project.</strong></p>

      <p style="margin: 24px 0;">
        <a href="${inviteUrl}" 
           style="display:inline-block;padding:12px 18px;background:#1E6FD9;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
          Start fact pack
        </a>
      </p>

      <p>If you need to pause, you can return to the same link at any time.</p>

      <p style="margin-top: 24px;">
        Thank you,<br/>
        Van Esch Advisory
      </p>
    </div>
  `;
}

function buildFactPackEmailText(params: {
  name: string;
  projectName: string;
  inviteUrl: string;
}): string {
  const { name, projectName, inviteUrl } = params;

  return [
    `Hi ${name},`,
    ``,
    `You’ve been asked to complete the Client Fact Pack for ${projectName}.`,
    ``,
    `This captures contextual information on the current people operations environment, including systems, tooling, infrastructure, and delivery context.`,
    ``,
    `It is used to strengthen final interpretation and advisory output, but it is not included in scored statistical analysis.`,
    ``,
    `This input should only be completed once for the project.`,
    ``,
    `Start fact pack: ${inviteUrl}`,
    ``,
    `If you need to pause, you can return to the same link at any time.`,
    ``,
    `Thank you,`,
    `Van Esch Advisory`,
  ].join("\n");
}

function getCleanFactPackRecipient(
  input: FactPackRecipientInput | null | undefined,
): FactPackRecipientInput | null {
  if (!input) {
    return null;
  }

  const name = input.name?.trim() ?? "";
  const email = input.email?.trim() ?? "";

  if (!name && !email) {
    return null;
  }

  if (!name || !email) {
    throw new Error(
      "If a Client Fact Pack recipient is provided, both name and email are required.",
    );
  }

  if (!isValidEmail(email)) {
    throw new Error("Client Fact Pack recipient email is invalid.");
  }

  return {
    name,
    email: email.toLowerCase(),
  };
}

function getDefaultInviteExpiresAt(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_INVITE_EXPIRY_DAYS);
  return expiresAt.toISOString();
}

function getNormalisedParticipantEmails(
  participants: ParticipantInput[],
  factPackRecipient: FactPackRecipientInput | null,
): string[] {
  const emails = participants.map((participant) =>
    participant.email.trim().toLowerCase(),
  );

  if (factPackRecipient) {
    emails.push(factPackRecipient.email.trim().toLowerCase());
  }

  return emails;
}

function getDuplicateEmails(emails: string[]): string[] {
  const seen = new Map<string, number>();

  for (const email of emails) {
    seen.set(email, (seen.get(email) ?? 0) + 1);
  }

  return [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([email]) => email);
}

async function sendParticipantInvite(params: {
  resend: Resend;
  fromEmail: string;
  replyToEmail: string;
  siteUrl: string;
  projectName: string;
  participant: InsertedParticipantRow;
}): Promise<EmailSendResult> {
  const { resend, fromEmail, replyToEmail, siteUrl, projectName, participant } =
    params;

  if (!participant.invite_token) {
    return {
      email: participant.email,
      success: false,
      resendId: null,
      error: "Missing invite token on participant row.",
    };
  }

  const inviteUrl = `${siteUrl}/client-diagnostic/respond/${participant.invite_token}`;
  const isFactPack = participant.questionnaire_type === "client_fact_pack";

  try {
    const resendResponse = await resend.emails.send({
      from: `Van Esch Advisory <${fromEmail}>`,
      to: participant.email,
      replyTo: replyToEmail,
      subject: isFactPack
        ? buildFactPackEmailSubject(projectName)
        : buildDiagnosticEmailSubject(projectName),
      html: isFactPack
        ? buildFactPackEmailHtml({
            name: participant.name,
            projectName,
            inviteUrl,
          })
        : buildDiagnosticEmailHtml({
            name: participant.name,
            projectName,
            inviteUrl,
          }),
      text: isFactPack
        ? buildFactPackEmailText({
            name: participant.name,
            projectName,
            inviteUrl,
          })
        : buildDiagnosticEmailText({
            name: participant.name,
            projectName,
            inviteUrl,
          }),
    });

    const resendError =
      resendResponse && "error" in resendResponse
        ? resendResponse.error
        : null;

    const resendData =
      resendResponse && "data" in resendResponse ? resendResponse.data : null;

    if (resendError) {
      console.error("Resend returned an error", {
        participantEmail: participant.email,
        resendError,
      });

      return {
        email: participant.email,
        success: false,
        resendId: null,
        error:
          typeof resendError.message === "string"
            ? resendError.message
            : "Resend returned an error.",
      };
    }

    console.info("Resend accepted email send", {
      participantEmail: participant.email,
      resendId: resendData?.id ?? null,
      questionnaireType: participant.questionnaire_type,
      inviteExpiresAt: participant.invite_expires_at,
    });

    return {
      email: participant.email,
      success: true,
      resendId: resendData?.id ?? null,
      error: null,
    };
  } catch (emailError) {
    const message =
      emailError instanceof Error
        ? emailError.message
        : "Unknown email send error.";

    console.error("Email send threw an exception", {
      participantEmail: participant.email,
      error: message,
      questionnaireType: participant.questionnaire_type,
    });

    return {
      email: participant.email,
      success: false,
      resendId: null,
      error: message,
    };
  }
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

    const supabase = createSupabaseAdminClient();
    const resend = new Resend(getEnv("RESEND_API_KEY"));

    const body = (await request.json()) as Partial<CreateProjectRequest>;

    const projectName = body.projectName?.trim();
    const companyName = body.companyName?.trim() || projectName;
    const participants = Array.isArray(body.participants) ? body.participants : [];
    const segmentationSchema = validateSegmentationSchema(body.segmentationSchema);
    const factPackRecipient = getCleanFactPackRecipient(
      body.factPackRecipient ?? null,
    );

    if (!projectName) {
      return NextResponse.json(
        { success: false, error: "Project name is required." },
        { status: 400 },
      );
    }

    if (!segmentationSchema) {
      return NextResponse.json(
        { success: false, error: "A valid segmentation schema is required." },
        { status: 400 },
      );
    }

    if (participants.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one participant is required." },
        { status: 400 },
      );
    }

    for (let i = 0; i < participants.length; i += 1) {
      const participant = participants[i];

      if (!participant.name?.trim()) {
        return NextResponse.json(
          { success: false, error: `Participant ${i + 1} missing name.` },
          { status: 400 },
        );
      }

      if (!participant.email?.trim() || !isValidEmail(participant.email)) {
        return NextResponse.json(
          { success: false, error: `Participant ${i + 1} email invalid.` },
          { status: 400 },
        );
      }

      if (
        participant.questionnaireType !== "HR" &&
        participant.questionnaireType !== "Manager" &&
        participant.questionnaireType !== "Leadership"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Participant ${i + 1} questionnaire type invalid.`,
          },
          { status: 400 },
        );
      }

      const validatedSegmentationValues = validateSegmentationValues(
        segmentationSchema,
        participant.segmentationValues,
      );

      if (!validatedSegmentationValues) {
        return NextResponse.json(
          {
            success: false,
            error: `Participant ${i + 1} segmentation values are invalid.`,
          },
          { status: 400 },
        );
      }
    }

    const normalisedEmails = getNormalisedParticipantEmails(
      participants,
      factPackRecipient,
    );
    const duplicateEmails = getDuplicateEmails(normalisedEmails);

    if (duplicateEmails.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Duplicate participant email(s) detected: ${duplicateEmails.join(", ")}.`,
        },
        { status: 400 },
      );
    }

    const primary = participants[0];

    const { data: project, error: projectError } = await supabase
      .from("client_projects")
      .insert({
        project_name: projectName,
        company_name: companyName,
        primary_contact_name: primary.name.trim(),
        primary_contact_email: primary.email.trim().toLowerCase(),
        project_status: "active",
        segmentation_schema: segmentationSchema,
      })
      .select("project_id, project_name, company_name")
      .single();

    if (projectError || !project) {
      console.error("Failed to create project", projectError);

      return NextResponse.json(
        { success: false, error: "Failed to create project." },
        { status: 500 },
      );
    }

    console.info("Project created successfully", {
      projectId: project.project_id,
      projectName,
      participantCount: participants.length,
      factPackIncluded: Boolean(factPackRecipient),
    });

    const inviteExpiresAt = getDefaultInviteExpiresAt();

    const participantRows: Array<{
      project_id: string;
      questionnaire_type: DatabaseQuestionnaireType;
      role_label: string;
      name: string;
      email: string;
      segmentation_values: SegmentationValues | null;
      invite_expires_at: string;
    }> = participants.map((participant) => {
      const validatedSegmentationValues = validateSegmentationValues(
        segmentationSchema,
        participant.segmentationValues,
      );

      return {
        project_id: project.project_id,
        questionnaire_type: mapQuestionnaireTypeToDatabaseValue(
          participant.questionnaireType,
        ),
        role_label: participant.questionnaireType,
        name: participant.name.trim(),
        email: participant.email.trim().toLowerCase(),
        segmentation_values: validatedSegmentationValues,
        invite_expires_at: inviteExpiresAt,
      };
    });

    if (factPackRecipient) {
      participantRows.push({
        project_id: project.project_id,
        questionnaire_type: "client_fact_pack",
        role_label: "Client Fact Pack",
        name: factPackRecipient.name,
        email: factPackRecipient.email,
        segmentation_values: null,
        invite_expires_at: inviteExpiresAt,
      });
    }

    const { data: insertedParticipants, error: participantError } = await supabase
      .from("client_participants")
      .insert(participantRows)
      .select(
        "participant_id, project_id, questionnaire_type, role_label, name, email, segmentation_values, invite_token, invite_expires_at",
      )
      .returns<InsertedParticipantRow[]>();

    if (participantError || !insertedParticipants) {
      console.error("Failed to create participants", participantError);

      return NextResponse.json(
        { success: false, error: "Failed to create participants." },
        { status: 500 },
      );
    }

    console.info("Participants created successfully", {
      projectId: project.project_id,
      insertedParticipants: insertedParticipants.length,
      inviteExpiresAt,
    });

    const siteUrl = getEnv("NEXT_PUBLIC_SITE_URL").replace(/\/+$/, "");
    const fromEmail = getEnv("CONTACT_FROM_EMAIL");
    const replyToEmail = getEnv("CONTACT_TO_EMAIL");

    const emailResults: EmailSendResult[] = await Promise.all(
      insertedParticipants.map((participant) =>
        sendParticipantInvite({
          resend,
          fromEmail,
          replyToEmail,
          siteUrl,
          projectName,
          participant,
        }),
      ),
    );

    const failedEmails = emailResults.filter((result) => !result.success);

    if (failedEmails.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Project created, but one or more invitation emails failed.",
          projectId: project.project_id,
          participants: insertedParticipants.length,
          emailResults,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      projectId: project.project_id,
      participants: insertedParticipants.length,
      inviteExpiresAt,
      emailResults,
    });
  } catch (error) {
    console.error("Unexpected error in create-project route", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
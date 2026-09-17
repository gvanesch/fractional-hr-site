import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isD1ClientDiagnosticShadowWriteEnabled } from "@/lib/d1/database";
import { writeD1ClientProjectWithParticipants } from "@/lib/d1/client-diagnostic";
import { sendParticipantEventEmail } from "@/lib/client-diagnostic/participant-email";
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

type ShadowProjectRow = {
  project_id: string;
  company_name: string;
  primary_contact_name: string;
  primary_contact_email: string;
  project_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  project_name: string | null;
  status: string | null;
  segmentation_schema: unknown | null;
  billing_contact_name: string | null;
  billing_contact_email: string | null;
  company_website: string | null;
  purchase_order_number: string | null;
  msa_status: string | null;
  dpa_status: string | null;
};

type ShadowParticipantRow = {
  participant_id: string;
  project_id: string;
  questionnaire_type: DatabaseQuestionnaireType | "payroll";
  role_label: string;
  invite_token: string;
  participant_status: "invited" | "started" | "completed" | "archived";
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  name: string | null;
  email: string | null;
  status: string | null;
  invited_at: string | null;
  segmentation_values: unknown | null;
  invite_expires_at: string | null;
  invite_revoked_at: string | null;
  invite_last_used_at: string | null;
  withdraw_reason: string | null;
  withdraw_note: string | null;
  withdrawn_at: string | null;
  reinstate_reason: string | null;
  reinstate_note: string | null;
  reinstated_at: string | null;
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

function getNormalisedParticipantEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getDuplicateQuestionnaireParticipantEmails(
  participants: ParticipantInput[],
): string[] {
  const seen = new Map<string, number>();

  for (const participant of participants) {
    const email = getNormalisedParticipantEmail(participant.email);
    seen.set(email, (seen.get(email) ?? 0) + 1);
  }

  return [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([email]) => email);
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

    const duplicateQuestionnaireEmails =
      getDuplicateQuestionnaireParticipantEmails(participants);

    if (duplicateQuestionnaireEmails.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Duplicate participant email(s) detected across scored questionnaires: ${duplicateQuestionnaireEmails.join(", ")}.`,
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
    const invitedAt = new Date().toISOString();

    const participantRows: Array<{
      project_id: string;
      questionnaire_type: DatabaseQuestionnaireType;
      role_label: string;
      name: string;
      email: string;
      segmentation_values: SegmentationValues | null;
      participant_status: "invited";
      invited_at: string;
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
        participant_status: "invited",
        invited_at: invitedAt,
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
        participant_status: "invited",
        invited_at: invitedAt,
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
      invitedAt,
    });

    if (isD1ClientDiagnosticShadowWriteEnabled()) {
      try {
        const [
          { data: shadowProject, error: shadowProjectError },
          { data: shadowParticipants, error: shadowParticipantsError },
        ] = await Promise.all([
          supabase
            .from("client_projects")
            .select("*")
            .eq("project_id", project.project_id)
            .single<ShadowProjectRow>(),
          supabase
            .from("client_participants")
            .select("*")
            .eq("project_id", project.project_id)
            .returns<ShadowParticipantRow[]>(),
        ]);

        if (
          shadowProjectError ||
          shadowParticipantsError ||
          !shadowProject ||
          !shadowParticipants
        ) {
          throw new Error(
            "Unable to reload the Supabase project for D1 shadowing.",
          );
        }

        await writeD1ClientProjectWithParticipants({
          project: {
            projectId: shadowProject.project_id,
            companyName: shadowProject.company_name,
            primaryContactName: shadowProject.primary_contact_name,
            primaryContactEmail: shadowProject.primary_contact_email,
            projectStatus: shadowProject.project_status,
            notes: shadowProject.notes,
            createdAt: shadowProject.created_at,
            updatedAt: shadowProject.updated_at,
            projectName: shadowProject.project_name,
            status: shadowProject.status,
            segmentationSchema: shadowProject.segmentation_schema,
            billingContactName: shadowProject.billing_contact_name,
            billingContactEmail: shadowProject.billing_contact_email,
            companyWebsite: shadowProject.company_website,
            purchaseOrderNumber: shadowProject.purchase_order_number,
            msaStatus: shadowProject.msa_status,
            dpaStatus: shadowProject.dpa_status,
          },
          participants: shadowParticipants.map((participant) => ({
            participantId: participant.participant_id,
            projectId: participant.project_id,
            questionnaireType: participant.questionnaire_type,
            roleLabel: participant.role_label,
            inviteToken: participant.invite_token,
            participantStatus: participant.participant_status,
            startedAt: participant.started_at,
            completedAt: participant.completed_at,
            createdAt: participant.created_at,
            updatedAt: participant.updated_at,
            name: participant.name,
            email: participant.email,
            status: participant.status,
            invitedAt: participant.invited_at,
            segmentationValues: participant.segmentation_values,
            inviteExpiresAt: participant.invite_expires_at,
            inviteRevokedAt: participant.invite_revoked_at,
            inviteLastUsedAt: participant.invite_last_used_at,
            withdrawReason: participant.withdraw_reason,
            withdrawNote: participant.withdraw_note,
            withdrawnAt: participant.withdrawn_at,
            reinstateReason: participant.reinstate_reason,
            reinstateNote: participant.reinstate_note,
            reinstatedAt: participant.reinstated_at,
          })),
        });
      } catch (d1Error) {
        console.error(
          "[client-diagnostic-create-project] D1 shadow write failed",
          d1Error,
        );
      }
    }

    const siteUrl = getEnv("NEXT_PUBLIC_SITE_URL").replace(/\/+$/, "");
    const fromEmail = getEnv("CONTACT_FROM_EMAIL");
    const replyToEmail = getEnv("CONTACT_TO_EMAIL");

    const emailResults: EmailSendResult[] = await Promise.all(
      insertedParticipants.map((participant) =>
        sendParticipantEventEmail({
          resend,
          fromEmail,
          replyToEmail,
          siteUrl,
          projectName,
          companyName,
          eventType: "invite",
          participant: {
            name: participant.name,
            email: participant.email,
            questionnaireType: participant.questionnaire_type,
            inviteToken: participant.invite_token,
            inviteExpiresAt: participant.invite_expires_at,
          },
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
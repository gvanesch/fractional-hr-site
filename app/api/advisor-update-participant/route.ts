import { NextResponse } from "next/server";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type QuestionnaireType =
  | "hr"
  | "manager"
  | "leadership"
  | "client_fact_pack";

type SegmentationValues = Record<string, string | null | undefined>;

type UpdateParticipantRequest = {
  participantId?: string;
  name?: string;
  email?: string;
  roleLabel?: string;
  questionnaireType?: QuestionnaireType;
  segmentationValues?: SegmentationValues | null;
};

type ParticipantRow = {
  participant_id: string;
  project_id: string;
  questionnaire_type: QuestionnaireType;
  role_label: string;
  name: string;
  email: string;
  segmentation_values: SegmentationValues | null;
  participant_status: string;
  completed_at: string | null;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidQuestionnaireType(
  value: string,
): value is QuestionnaireType {
  return ["hr", "manager", "leadership", "client_fact_pack"].includes(value);
}

function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isCompletedParticipant(participant: ParticipantRow): boolean {
  return (
    participant.participant_status === "completed" ||
    participant.completed_at !== null
  );
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const advisorUser = await requireAdvisorUser();

    if (!advisorUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as UpdateParticipantRequest;

    const participantId = cleanString(body.participantId);
    const name = cleanString(body.name);
    const email = normaliseEmail(cleanString(body.email));
    const roleLabel = cleanString(body.roleLabel);
    const questionnaireType = cleanString(body.questionnaireType);
    const segmentationValues =
      body.segmentationValues && typeof body.segmentationValues === "object"
        ? body.segmentationValues
        : null;

    if (!participantId || !isUuid(participantId)) {
      return NextResponse.json(
        { success: false, error: "A valid participantId is required." },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required." },
        { status: 400 },
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400 },
      );
    }

    if (!roleLabel) {
      return NextResponse.json(
        { success: false, error: "roleLabel is required." },
        { status: 400 },
      );
    }

    if (!isValidQuestionnaireType(questionnaireType)) {
      return NextResponse.json(
        { success: false, error: "A valid questionnaireType is required." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: existingParticipant, error: existingParticipantError } =
      await supabase
        .from("client_participants")
        .select(
          "participant_id, project_id, questionnaire_type, role_label, name, email, segmentation_values, participant_status, completed_at",
        )
        .eq("participant_id", participantId)
        .single<ParticipantRow>();

    if (existingParticipantError || !existingParticipant) {
      return NextResponse.json(
        { success: false, error: "Participant not found." },
        { status: 404 },
      );
    }

    const participantIsCompleted = isCompletedParticipant(existingParticipant);

    if (participantIsCompleted) {
      if (email !== existingParticipant.email) {
        return NextResponse.json(
          {
            success: false,
            error: "Completed participants cannot have their email changed.",
          },
          { status: 409 },
        );
      }

      if (questionnaireType !== existingParticipant.questionnaire_type) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Completed participants cannot have their questionnaire type changed.",
          },
          { status: 409 },
        );
      }
    }

    const { data: conflictingParticipants, error: conflictingParticipantsError } =
      await supabase
        .from("client_participants")
        .select("participant_id, questionnaire_type, email")
        .eq("project_id", existingParticipant.project_id)
        .eq("email", email);

    if (conflictingParticipantsError) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to validate project participant uniqueness.",
        },
        { status: 500 },
      );
    }

    const otherParticipants = (conflictingParticipants ?? []).filter(
      (participant) => participant.participant_id !== participantId,
    );

    if (questionnaireType === "client_fact_pack") {
      const duplicateFactPack = otherParticipants.find(
        (participant) => participant.questionnaire_type === "client_fact_pack",
      );

      if (duplicateFactPack) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only one Client Fact Pack participant is allowed per project.",
          },
          { status: 409 },
        );
      }
    } else {
      if (otherParticipants.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This email address is already assigned to another participant in this project.",
          },
          { status: 409 },
        );
      }
    }

    if (questionnaireType !== "client_fact_pack") {
      const { data: duplicateQuestionnaireTypeRows, error: duplicateQuestionnaireTypeError } =
        await supabase
          .from("client_participants")
          .select("participant_id")
          .eq("project_id", existingParticipant.project_id)
          .eq("email", email)
          .neq("participant_id", participantId);

      if (duplicateQuestionnaireTypeError) {
        return NextResponse.json(
          {
            success: false,
            error: "Unable to validate questionnaire assignment rules.",
          },
          { status: 500 },
        );
      }

      if ((duplicateQuestionnaireTypeRows ?? []).length > 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A participant email can only be used once per project for scored questionnaires.",
          },
          { status: 409 },
        );
      }
    }

    const { data: updatedParticipant, error: updateError } = await supabase
      .from("client_participants")
      .update({
        name,
        email,
        role_label: roleLabel,
        questionnaire_type: questionnaireType,
        segmentation_values: questionnaireType === "client_fact_pack"
          ? null
          : segmentationValues,
        updated_at: new Date().toISOString(),
      })
      .eq("participant_id", participantId)
      .select(
        "participant_id, project_id, questionnaire_type, role_label, name, email, segmentation_values, participant_status, completed_at",
      )
      .single<ParticipantRow>();

    if (updateError || !updatedParticipant) {
      console.error("Participant update failed", updateError);

      return NextResponse.json(
        { success: false, error: "Unable to update participant." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      participant: {
        participantId: updatedParticipant.participant_id,
        projectId: updatedParticipant.project_id,
        questionnaireType: updatedParticipant.questionnaire_type,
        roleLabel: updatedParticipant.role_label,
        name: updatedParticipant.name,
        email: updatedParticipant.email,
        segmentationValues: updatedParticipant.segmentation_values,
        participantStatus: updatedParticipant.participant_status,
        completedAt: updatedParticipant.completed_at,
      },
    });
  } catch (error) {
    console.error("Unexpected error updating participant", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
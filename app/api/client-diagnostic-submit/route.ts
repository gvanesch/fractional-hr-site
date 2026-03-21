import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type QuestionnaireType = "hr" | "manager" | "leadership" | "client_fact_pack";
type ResponseKind = "score" | "probe";

type SubmittedResponse = {
  questionId: string;
  dimension: string;
  kind: ResponseKind;
  value: number | string;
};

type ClientDiagnosticSubmitRequestBody = {
  projectId: string;
  participantId: string;
  questionnaireType: QuestionnaireType;
  responses: SubmittedResponse[];
};

const VALID_QUESTIONNAIRE_TYPES: QuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
  "client_fact_pack",
];

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isQuestionnaireType(value: string): value is QuestionnaireType {
  return VALID_QUESTIONNAIRE_TYPES.includes(value as QuestionnaireType);
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function validateRequestBody(
  body: unknown,
): { isValid: true; data: ClientDiagnosticSubmitRequestBody } | { isValid: false; message: string } {
  if (!body || typeof body !== "object") {
    return {
      isValid: false,
      message: "Request body must be a JSON object.",
    };
  }

  const candidate = body as Partial<ClientDiagnosticSubmitRequestBody>;

  if (!candidate.projectId || typeof candidate.projectId !== "string") {
    return {
      isValid: false,
      message: "projectId is required.",
    };
  }

  if (!isUuid(candidate.projectId)) {
    return {
      isValid: false,
      message: "projectId must be a valid UUID.",
    };
  }

  if (!candidate.participantId || typeof candidate.participantId !== "string") {
    return {
      isValid: false,
      message: "participantId is required.",
    };
  }

  if (!isUuid(candidate.participantId)) {
    return {
      isValid: false,
      message: "participantId must be a valid UUID.",
    };
  }

  if (
    !candidate.questionnaireType ||
    typeof candidate.questionnaireType !== "string" ||
    !isQuestionnaireType(candidate.questionnaireType)
  ) {
    return {
      isValid: false,
      message: "questionnaireType is invalid.",
    };
  }

  if (!Array.isArray(candidate.responses) || candidate.responses.length === 0) {
    return {
      isValid: false,
      message: "responses must be a non-empty array.",
    };
  }

  for (const response of candidate.responses) {
    if (!response || typeof response !== "object") {
      return {
        isValid: false,
        message: "Each response must be an object.",
      };
    }

    const typedResponse = response as Partial<SubmittedResponse>;

    if (!typedResponse.questionId || typeof typedResponse.questionId !== "string") {
      return {
        isValid: false,
        message: "Each response must include a questionId.",
      };
    }

    if (!typedResponse.dimension || typeof typedResponse.dimension !== "string") {
      return {
        isValid: false,
        message: "Each response must include a dimension.",
      };
    }

    if (
      typedResponse.kind !== "score" &&
      typedResponse.kind !== "probe"
    ) {
      return {
        isValid: false,
        message: "Each response kind must be 'score' or 'probe'.",
      };
    }

    if (typedResponse.kind === "score") {
      if (
        typeof typedResponse.value !== "number" ||
        !Number.isInteger(typedResponse.value) ||
        typedResponse.value < 1 ||
        typedResponse.value > 5
      ) {
        return {
          isValid: false,
          message: "Score responses must have an integer value between 1 and 5.",
        };
      }
    }

    if (typedResponse.kind === "probe") {
      if (typeof typedResponse.value !== "string") {
        return {
          isValid: false,
          message: "Probe responses must have a string value.",
        };
      }
    }
  }

  return {
    isValid: true,
    data: {
      projectId: candidate.projectId,
      participantId: candidate.participantId,
      questionnaireType: candidate.questionnaireType,
      responses: candidate.responses,
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateRequestBody(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.message,
        },
        { status: 400 },
      );
    }

    const { projectId, participantId, questionnaireType, responses } =
      validation.data;

    const supabase = getSupabaseAdminClient();

    const { data: participant, error: participantError } = await supabase
      .from("client_participants")
      .select(
        "participant_id, project_id, questionnaire_type, participant_status, started_at, completed_at",
      )
      .eq("participant_id", participantId)
      .eq("project_id", projectId)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        {
          success: false,
          error: "Participant record not found for this project.",
        },
        { status: 404 },
      );
    }

    if (participant.questionnaire_type !== questionnaireType) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Submitted questionnaire type does not match the participant record.",
        },
        { status: 400 },
      );
    }

    const nowIso = new Date().toISOString();

    const { error: deleteExistingResponsesError } = await supabase
      .from("client_responses")
      .delete()
      .eq("project_id", projectId)
      .eq("participant_id", participantId)
      .eq("questionnaire_type", questionnaireType);

    if (deleteExistingResponsesError) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to replace existing participant responses.",
          details: deleteExistingResponsesError.message,
        },
        { status: 500 },
      );
    }

    const responseRows = responses.map((response) => {
      const baseRow = {
        project_id: projectId,
        participant_id: participantId,
        questionnaire_type: questionnaireType,
        dimension_key: response.dimension,
        question_key: response.questionId,
        updated_at: nowIso,
      };

      if (response.kind === "score") {
        return {
          ...baseRow,
          answer_value: response.value,
          comment_text: null,
        };
      }

      return {
        ...baseRow,
        answer_value: null,
        comment_text:
          typeof response.value === "string" ? response.value.trim() : null,
      };
    });

    const { error: insertResponsesError } = await supabase
      .from("client_responses")
      .insert(responseRows);

    if (insertResponsesError) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to save client diagnostic responses.",
          details: insertResponsesError.message,
        },
        { status: 500 },
      );
    }

    const participantUpdate: {
      participant_status: string;
      updated_at: string;
      started_at?: string;
      completed_at?: string;
    } = {
      participant_status: "completed",
      updated_at: nowIso,
      completed_at: nowIso,
    };

    if (!participant.started_at) {
      participantUpdate.started_at = nowIso;
    }

    const { error: updateParticipantError } = await supabase
      .from("client_participants")
      .update(participantUpdate)
      .eq("participant_id", participantId)
      .eq("project_id", projectId);

    if (updateParticipantError) {
      return NextResponse.json(
        {
          success: false,
          error: "Responses were saved, but participant status could not be updated.",
          details: updateParticipantError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      projectId,
      participantId,
      questionnaireType,
      savedResponseCount: responseRows.length,
      message: "Client diagnostic submission saved successfully.",
    });
  } catch (error) {
    console.error("Client diagnostic submission failed.", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error while saving client diagnostic submission.",
      },
      { status: 500 },
    );
  }
}
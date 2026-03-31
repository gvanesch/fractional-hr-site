import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getQuestionsForQuestionnaireType,
  type ClientDiagnosticQuestion,
  type QuestionnaireType,
} from "@/lib/client-diagnostic/question-bank";

export const runtime = "edge";

type ResponseKind = "score" | "probe";

type SubmittedResponse = {
  questionId: string;
  dimension: string;
  kind: ResponseKind;
  value: number | string;
};

type SubmittedPayload = {
  questionnaireType: QuestionnaireType;
  preparedAt?: string;
  responses: SubmittedResponse[];
};

type ClientDiagnosticSubmitRequestBody = {
  projectId: string;
  participantId: string;
  questionnaireType: QuestionnaireType;
  submission: SubmittedPayload;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
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

function getQuestionMap(
  questionnaireType: QuestionnaireType,
): Map<string, ClientDiagnosticQuestion> {
  return new Map(
    getQuestionsForQuestionnaireType(questionnaireType).map((question) => [
      question.id,
      question,
    ]),
  );
}

function validateRequestBody(
  body: unknown,
):
  | {
      isValid: true;
      data: {
        projectId: string;
        participantId: string;
        questionnaireType: QuestionnaireType;
        responses: SubmittedResponse[];
      };
    }
  | { isValid: false; message: string } {
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

  if (!candidate.questionnaireType || typeof candidate.questionnaireType !== "string") {
    return {
      isValid: false,
      message: "questionnaireType is required.",
    };
  }

  if (
    candidate.questionnaireType !== "hr" &&
    candidate.questionnaireType !== "manager" &&
    candidate.questionnaireType !== "leadership"
  ) {
    return {
      isValid: false,
      message: "questionnaireType is invalid.",
    };
  }

  if (!candidate.submission || typeof candidate.submission !== "object") {
    return {
      isValid: false,
      message: "submission is required.",
    };
  }

  const submission = candidate.submission as Partial<SubmittedPayload>;

  if (
    !submission.questionnaireType ||
    submission.questionnaireType !== candidate.questionnaireType
  ) {
    return {
      isValid: false,
      message:
        "submission.questionnaireType must be present and match questionnaireType.",
    };
  }

  if (!Array.isArray(submission.responses) || submission.responses.length === 0) {
    return {
      isValid: false,
      message: "submission.responses must be a non-empty array.",
    };
  }

  const questionMap = getQuestionMap(candidate.questionnaireType);
  const seenQuestionIds = new Set<string>();

  for (const response of submission.responses) {
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

    if (seenQuestionIds.has(typedResponse.questionId)) {
      return {
        isValid: false,
        message: `Duplicate response detected for questionId '${typedResponse.questionId}'.`,
      };
    }

    seenQuestionIds.add(typedResponse.questionId);

    const matchedQuestion = questionMap.get(typedResponse.questionId);

    if (!matchedQuestion) {
      return {
        isValid: false,
        message: `Unknown questionId '${typedResponse.questionId}' for this questionnaire.`,
      };
    }

    if (!typedResponse.dimension || typeof typedResponse.dimension !== "string") {
      return {
        isValid: false,
        message: "Each response must include a dimension.",
      };
    }

    if (typedResponse.dimension !== matchedQuestion.dimension) {
      return {
        isValid: false,
        message: `Response dimension does not match the question definition for '${typedResponse.questionId}'.`,
      };
    }

    if (typedResponse.kind !== "score" && typedResponse.kind !== "probe") {
      return {
        isValid: false,
        message: "Each response kind must be 'score' or 'probe'.",
      };
    }

    if (typedResponse.kind !== matchedQuestion.kind) {
      return {
        isValid: false,
        message: `Response kind does not match the question definition for '${typedResponse.questionId}'.`,
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

  const requiredScoreQuestionIds = [...questionMap.values()]
    .filter((question) => question.kind === "score" && question.required)
    .map((question) => question.id);

  const submittedScoreQuestionIds = new Set(
    submission.responses
      .filter(
        (response): response is SubmittedResponse & { kind: "score"; value: number } =>
          response.kind === "score" && typeof response.value === "number",
      )
      .map((response) => response.questionId),
  );

  const missingRequiredScoreQuestions = requiredScoreQuestionIds.filter(
    (questionId) => !submittedScoreQuestionIds.has(questionId),
  );

  if (missingRequiredScoreQuestions.length > 0) {
    return {
      isValid: false,
      message: "All scored questions must be completed before submission.",
    };
  }

  return {
    isValid: true,
    data: {
      projectId: candidate.projectId,
      participantId: candidate.participantId,
      questionnaireType: candidate.questionnaireType,
      responses: submission.responses,
    },
  };
}

function buildDimensionScoreRows(params: {
  projectId: string;
  questionnaireType: QuestionnaireType;
  responses: SubmittedResponse[];
  nowIso: string;
}) {
  const { projectId, questionnaireType, responses, nowIso } = params;

  const scoreResponses = responses.filter(
    (response): response is SubmittedResponse & { kind: "score"; value: number } =>
      response.kind === "score" && typeof response.value === "number",
  );

  const dimensionMap: Record<
    string,
    {
      total: number;
      count: number;
    }
  > = {};

  for (const response of scoreResponses) {
    if (!dimensionMap[response.dimension]) {
      dimensionMap[response.dimension] = {
        total: 0,
        count: 0,
      };
    }

    dimensionMap[response.dimension].total += response.value;
    dimensionMap[response.dimension].count += 1;
  }

  return Object.entries(dimensionMap).map(([dimension, aggregate]) => ({
    project_id: projectId,
    questionnaire_type: questionnaireType,
    dimension_key: dimension,
    average_score: Number((aggregate.total / aggregate.count).toFixed(2)),
    response_count: aggregate.count,
    updated_at: nowIso,
  }));
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

    const responseRows = responses
      .map((response) => {
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

        const trimmedComment =
          typeof response.value === "string" ? response.value.trim() : "";

        if (!trimmedComment) {
          return null;
        }

        return {
          ...baseRow,
          answer_value: null,
          comment_text: trimmedComment,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (responseRows.length > 0) {
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
    }

    const { error: deleteExistingDimensionScoresError } = await supabase
      .from("client_dimension_scores")
      .delete()
      .eq("project_id", projectId)
      .eq("questionnaire_type", questionnaireType);

    if (deleteExistingDimensionScoresError) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Responses were saved, but previous dimension scores could not be cleared.",
          details: deleteExistingDimensionScoresError.message,
        },
        { status: 500 },
      );
    }

    const dimensionScoreRows = buildDimensionScoreRows({
      projectId,
      questionnaireType,
      responses,
      nowIso,
    });

    if (dimensionScoreRows.length > 0) {
      const { error: insertDimensionScoresError } = await supabase
        .from("client_dimension_scores")
        .insert(dimensionScoreRows);

      if (insertDimensionScoresError) {
        return NextResponse.json(
          {
            success: false,
            error: "Responses were saved, but dimension scores could not be created.",
            details: insertDimensionScoresError.message,
          },
          { status: 500 },
        );
      }
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
          error:
            "Responses were saved, but participant status could not be updated.",
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
      dimensionScoresCreated: dimensionScoreRows.length,
      message: "Client diagnostic submission saved successfully.",
    });
  } catch (error) {
    console.error("Client diagnostic submission failed.", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Unexpected server error while saving client diagnostic submission.",
      },
      { status: 500 },
    );
  }
}
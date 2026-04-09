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
  inviteToken: string;
  questionnaireType: QuestionnaireType;
  submission: SubmittedPayload;
};

type SubmitClientDiagnosticRpcResult = {
  success: boolean;
  projectId: string;
  participantId: string;
  questionnaireType: QuestionnaireType;
  savedResponseCount: number;
  dimensionScoresCreated: number;
  message: string;
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
        inviteToken: string;
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

  if (!candidate.inviteToken || typeof candidate.inviteToken !== "string") {
    return {
      isValid: false,
      message: "inviteToken is required.",
    };
  }

  if (!isUuid(candidate.inviteToken)) {
    return {
      isValid: false,
      message: "inviteToken must be a valid UUID.",
    };
  }

  if (
    !candidate.questionnaireType ||
    typeof candidate.questionnaireType !== "string"
  ) {
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
      inviteToken: candidate.inviteToken,
      questionnaireType: candidate.questionnaireType,
      responses: submission.responses,
    },
  };
}

function buildResponseRows(responses: SubmittedResponse[]) {
  return responses
    .map((response) => {
      if (response.kind === "score") {
        return {
          dimension_key: response.dimension,
          question_key: response.questionId,
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
        dimension_key: response.dimension,
        question_key: response.questionId,
        answer_value: null,
        comment_text: trimmedComment,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

function buildDimensionScoreRows(responses: SubmittedResponse[]) {
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
    dimension_key: dimension,
    average_score: Number((aggregate.total / aggregate.count).toFixed(2)),
    response_count: aggregate.count,
  }));
}

function mapRpcErrorToResponse(errorMessage: string) {
  switch (errorMessage) {
    case "Participant record not found for this project.":
      return { status: 404, error: errorMessage };
    case "This diagnostic link is invalid for the selected participant.":
      return { status: 403, error: errorMessage };
    case "This questionnaire has already been submitted.":
      return { status: 409, error: errorMessage };
    case "Submitted questionnaire type does not match the participant record.":
      return { status: 400, error: errorMessage };
    case "Participant is not in a valid state for submission.":
      return { status: 409, error: errorMessage };
    default:
      return {
        status: 500,
        error: "Unexpected server error while saving client diagnostic submission.",
      };
  }
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

    const { projectId, participantId, inviteToken, questionnaireType, responses } =
      validation.data;

    const responseRows = buildResponseRows(responses);
    const dimensionScoreRows = buildDimensionScoreRows(responses);

    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase.rpc("submit_client_diagnostic", {
      p_project_id: projectId,
      p_participant_id: participantId,
      p_invite_token: inviteToken,
      p_questionnaire_type: questionnaireType,
      p_response_rows: responseRows,
      p_dimension_score_rows: dimensionScoreRows,
    });

    if (error) {
      console.error("Client diagnostic submission RPC failed.", error);

      const mapped = mapRpcErrorToResponse(error.message);

      return NextResponse.json(
        {
          success: false,
          error: mapped.error,
        },
        { status: mapped.status },
      );
    }

    const result = data as SubmitClientDiagnosticRpcResult;

    return NextResponse.json({
      success: true,
      projectId: result.projectId,
      participantId: result.participantId,
      questionnaireType: result.questionnaireType,
      savedResponseCount: result.savedResponseCount,
      dimensionScoresCreated: result.dimensionScoresCreated,
      message: result.message,
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
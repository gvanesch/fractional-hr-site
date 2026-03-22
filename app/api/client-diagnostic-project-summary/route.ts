import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildDimensionInsights,
  type DimensionInsight,
} from "@/lib/client-diagnostic/insight-engine";
import {
  dimensionDefinitions,
  questionnaireTypes,
  type QuestionnaireType,
} from "@/lib/client-diagnostic/question-bank";

export const runtime = "edge";

type ParticipantRow = {
  participant_id: string;
  questionnaire_type: QuestionnaireType;
  role_label: string;
  participant_status: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

type DimensionScoreRow = {
  score_id: string;
  project_id: string;
  questionnaire_type: QuestionnaireType;
  dimension_key: string;
  average_score: number;
  response_count: number;
  updated_at: string;
};

type ProjectRow = {
  project_id: string;
  company_name: string;
  primary_contact_name: string;
  primary_contact_email: string;
  project_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type QuestionnaireTypeScores = Partial<Record<QuestionnaireType, number>>;

type DimensionSummary = {
  dimensionKey: string;
  dimensionLabel: string;
  dimensionDescription: string;
  scores: QuestionnaireTypeScores;
  completedQuestionnaireTypes: QuestionnaireType[];
  missingQuestionnaireTypes: QuestionnaireType[];
  maxScore: number | null;
  minScore: number | null;
  gap: number | null;
};

type RespondentGroupSummary = {
  questionnaireType: QuestionnaireType;
  label: string;
  totalInvited: number;
  outstanding: number;
  completed: number;
  outstandingParticipants: Array<{
    participantId: string;
    roleLabel: string;
    participantStatus: string;
    startedAt: string | null;
    completedAt: string | null;
    updatedAt: string;
  }>;
};

type ProjectSummaryResponse = {
  success: true;
  project: {
    projectId: string;
    companyName: string;
    primaryContactName: string;
    primaryContactEmail: string;
    projectStatus: string;
    notes: string | null;
  };
  completion: {
    totalInvited: number;
    outstanding: number;
    completed: number;
    completionPercentage: number;
    participants: Array<{
      participantId: string;
      questionnaireType: QuestionnaireType;
      roleLabel: string;
      participantStatus: string;
      startedAt: string | null;
      completedAt: string | null;
      updatedAt: string;
    }>;
    respondentGroups: RespondentGroupSummary[];
  };
  dimensions: DimensionSummary[];
  strongestAlignment: DimensionSummary[];
  biggestGaps: DimensionSummary[];
  insights: {
    dimensions: DimensionInsight[];
    summary: {
      status: {
        strong: number;
        moderate: number;
        weak: number;
      };
      alignment: {
        aligned: number;
        emergingGap: number;
        significantGap: number;
      };
      completeness: {
        sufficient: number;
        partial: number;
        insufficient: number;
      };
    };
  };
};

type ErrorResponse = {
  success: false;
  error: string;
};

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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getCompletionPercentage(
  completed: number,
  totalInvited: number,
): number {
  if (totalInvited === 0) {
    return 0;
  }

  return Math.round((completed / totalInvited) * 100);
}

function formatQuestionnaireTypeLabel(
  questionnaireType: QuestionnaireType,
): string {
  switch (questionnaireType) {
    case "hr":
      return "HR";
    case "manager":
      return "Manager";
    case "leadership":
      return "Leadership";
    case "client_fact_pack":
      return "Client Fact Pack";
    default:
      return questionnaireType;
  }
}

function buildRespondentGroups(
  participantRows: ParticipantRow[],
): RespondentGroupSummary[] {
  return questionnaireTypes.map((questionnaireType) => {
    const matchingParticipants = participantRows.filter(
      (participant) => participant.questionnaire_type === questionnaireType,
    );

    const completed = matchingParticipants.filter(
      (participant) => participant.participant_status === "completed",
    ).length;

    const totalInvited = matchingParticipants.length;
    const outstanding = Math.max(totalInvited - completed, 0);

    const outstandingParticipants = matchingParticipants
      .filter((participant) => participant.participant_status !== "completed")
      .map((participant) => ({
        participantId: participant.participant_id,
        roleLabel: participant.role_label,
        participantStatus: participant.participant_status,
        startedAt: participant.started_at,
        completedAt: participant.completed_at,
        updatedAt: participant.updated_at,
      }));

    return {
      questionnaireType,
      label: formatQuestionnaireTypeLabel(questionnaireType),
      totalInvited,
      outstanding,
      completed,
      outstandingParticipants,
    };
  });
}

function buildDimensionSummaries(
  scoreRows: DimensionScoreRow[],
): DimensionSummary[] {
  return dimensionDefinitions.map((dimension) => {
    const matchingRows = scoreRows.filter(
      (row) => row.dimension_key === dimension.key,
    );

    const scores: QuestionnaireTypeScores = {};
    const completedQuestionnaireTypes: QuestionnaireType[] = [];
    const missingQuestionnaireTypes: QuestionnaireType[] = [];

    for (const questionnaireType of questionnaireTypes) {
      const match = matchingRows.find(
        (row) => row.questionnaire_type === questionnaireType,
      );

      if (match) {
        scores[questionnaireType] = Number(match.average_score);
        completedQuestionnaireTypes.push(questionnaireType);
      } else {
        missingQuestionnaireTypes.push(questionnaireType);
      }
    }

    const numericScores = Object.values(scores).filter(
      (value): value is number => typeof value === "number",
    );

    const maxScore =
      numericScores.length > 0 ? Math.max(...numericScores) : null;
    const minScore =
      numericScores.length > 0 ? Math.min(...numericScores) : null;
    const gap =
      maxScore !== null && minScore !== null
        ? Number((maxScore - minScore).toFixed(2))
        : null;

    return {
      dimensionKey: dimension.key,
      dimensionLabel: dimension.label,
      dimensionDescription: dimension.description,
      scores,
      completedQuestionnaireTypes,
      missingQuestionnaireTypes,
      maxScore,
      minScore,
      gap,
    };
  });
}

function sortDimensionsByGap(
  dimensions: DimensionSummary[],
  direction: "asc" | "desc",
): DimensionSummary[] {
  return [...dimensions].sort((a, b) => {
    const gapA = a.gap ?? -1;
    const gapB = b.gap ?? -1;

    if (direction === "asc") {
      return gapA - gapB;
    }

    return gapB - gapA;
  });
}

function buildInsightSummary(dimensionInsights: DimensionInsight[]) {
  return {
    status: {
      strong: dimensionInsights.filter((insight) => insight.status === "strong")
        .length,
      moderate: dimensionInsights.filter(
        (insight) => insight.status === "moderate",
      ).length,
      weak: dimensionInsights.filter((insight) => insight.status === "weak")
        .length,
    },
    alignment: {
      aligned: dimensionInsights.filter(
        (insight) => insight.alignment === "aligned",
      ).length,
      emergingGap: dimensionInsights.filter(
        (insight) => insight.alignment === "emerging_gap",
      ).length,
      significantGap: dimensionInsights.filter(
        (insight) => insight.alignment === "significant_gap",
      ).length,
    },
    completeness: {
      sufficient: dimensionInsights.filter(
        (insight) => insight.completeness === "sufficient",
      ).length,
      partial: dimensionInsights.filter(
        (insight) => insight.completeness === "partial",
      ).length,
      insufficient: dimensionInsights.filter(
        (insight) => insight.completeness === "insufficient",
      ).length,
    },
  };
}

export async function GET(
  request: Request,
): Promise<NextResponse<ProjectSummaryResponse | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "projectId is required.",
        },
        { status: 400 },
      );
    }

    if (!isUuid(projectId)) {
      return NextResponse.json(
        {
          success: false,
          error: "projectId must be a valid UUID.",
        },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const [
      { data: project, error: projectError },
      { data: participants, error: participantsError },
      { data: scoreRows, error: scoresError },
    ] = await Promise.all([
      supabase
        .from("client_projects")
        .select(
          "project_id, company_name, primary_contact_name, primary_contact_email, project_status, notes, created_at, updated_at",
        )
        .eq("project_id", projectId)
        .single<ProjectRow>(),
      supabase
        .from("client_participants")
        .select(
          "participant_id, questionnaire_type, role_label, participant_status, started_at, completed_at, updated_at",
        )
        .eq("project_id", projectId)
        .returns<ParticipantRow[]>(),
      supabase
        .from("client_dimension_scores")
        .select(
          "score_id, project_id, questionnaire_type, dimension_key, average_score, response_count, updated_at",
        )
        .eq("project_id", projectId)
        .returns<DimensionScoreRow[]>(),
    ]);

    if (projectError || !project) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found.",
        },
        { status: 404 },
      );
    }

    if (participantsError) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to load project participants.",
        },
        { status: 500 },
      );
    }

    if (scoresError) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to load project dimension scores.",
        },
        { status: 500 },
      );
    }

    const participantRows = participants ?? [];
    const dimensionScoreRows = scoreRows ?? [];

    const completed = participantRows.filter(
      (participant) => participant.participant_status === "completed",
    ).length;

    const totalInvited = participantRows.length;
    const outstanding = Math.max(totalInvited - completed, 0);

    const respondentGroups = buildRespondentGroups(participantRows);
    const dimensions = buildDimensionSummaries(dimensionScoreRows);
    const dimensionInsights = buildDimensionInsights(dimensions);
    const insightSummary = buildInsightSummary(dimensionInsights);

    const strongestAlignment = sortDimensionsByGap(
      dimensions.filter((dimension) => dimension.gap !== null),
      "asc",
    ).slice(0, 3);

    const biggestGaps = sortDimensionsByGap(
      dimensions.filter((dimension) => dimension.gap !== null),
      "desc",
    ).slice(0, 3);

    return NextResponse.json({
      success: true,
      project: {
        projectId: project.project_id,
        companyName: project.company_name,
        primaryContactName: project.primary_contact_name,
        primaryContactEmail: project.primary_contact_email,
        projectStatus: project.project_status,
        notes: project.notes,
      },
      completion: {
        totalInvited,
        outstanding,
        completed,
        completionPercentage: getCompletionPercentage(
          completed,
          totalInvited,
        ),
        participants: participantRows.map((participant) => ({
          participantId: participant.participant_id,
          questionnaireType: participant.questionnaire_type,
          roleLabel: participant.role_label,
          participantStatus: participant.participant_status,
          startedAt: participant.started_at,
          completedAt: participant.completed_at,
          updatedAt: participant.updated_at,
        })),
        respondentGroups,
      },
      dimensions,
      strongestAlignment,
      biggestGaps,
      insights: {
        dimensions: dimensionInsights,
        summary: insightSummary,
      },
    });
  } catch (error) {
    console.error("Unable to build client diagnostic project summary.", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error while building project summary.",
      },
      { status: 500 },
    );
  }
}
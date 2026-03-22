import { NextResponse } from "next/server";
import {
  buildDimensionInsights,
  type DimensionInsight,
} from "@/lib/client-diagnostic/insight-engine";
import {
  buildDimensionNarratives,
  type DimensionNarrative,
} from "@/lib/client-diagnostic/narrative-engine";

export const runtime = "edge";

type QuestionnaireType = "hr" | "manager" | "leadership" | "client_fact_pack";
type ScoredQuestionnaireType = "hr" | "manager" | "leadership";

type DimensionScores = Partial<Record<QuestionnaireType, number>>;
type ClientSafeDimensionScores = Partial<Record<ScoredQuestionnaireType, number>>;

type DimensionSummary = {
  dimensionKey: string;
  dimensionLabel: string;
  dimensionDescription: string;
  scores: DimensionScores;
  completedQuestionnaireTypes: QuestionnaireType[];
  missingQuestionnaireTypes: QuestionnaireType[];
  maxScore: number | null;
  minScore: number | null;
  gap: number | null;
};

type ClientSafeDimensionSummary = {
  dimensionKey: string;
  dimensionLabel: string;
  dimensionDescription: string;
  scores: ClientSafeDimensionScores;
  completedQuestionnaireTypes: ScoredQuestionnaireType[];
  missingQuestionnaireTypes: ScoredQuestionnaireType[];
  maxScore: number | null;
  minScore: number | null;
  gap: number | null;
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
    respondentGroups: Array<{
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
    }>;
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
  narratives: {
    dimensions: DimensionNarrative[];
  };
};

type ClientDiagnosticReportResponse = {
  success: true;
  report: {
    project: {
      projectId: string;
      companyName: string;
      primaryContactName: string;
      projectStatus: string;
    };
    executiveSummary: {
      overview: string;
      completionPercentage: number;
      completedRespondentGroups: number;
      totalRespondentGroups: number;
    };
    insightSummary: {
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
    priorityDimensions: {
      strengths: ClientSafeDimensionSummary[];
      gaps: ClientSafeDimensionSummary[];
    };
    dimensions: ClientSafeDimensionSummary[];
    insights: {
      dimensions: DimensionInsight[];
    };
    narratives: {
      dimensions: DimensionNarrative[];
    };
    methodology: {
      scoredQuestionnaireTypes: ScoredQuestionnaireType[];
      contextualQuestionnaireTypesExcluded: QuestionnaireType[];
      note: string;
    };
  };
};

type ErrorResponse = {
  success: false;
  error: string;
};

const SCORED_QUESTIONNAIRE_TYPES: ScoredQuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
];

const EXCLUDED_CONTEXTUAL_TYPES: QuestionnaireType[] = ["client_fact_pack"];

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getBaseUrl(request: Request): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  const requestUrl = new URL(request.url);
  return requestUrl.origin;
}

function getQuestionnaireTypeLabel(
  questionnaireType: ScoredQuestionnaireType,
): string {
  switch (questionnaireType) {
    case "hr":
      return "HR";
    case "manager":
      return "Manager";
    case "leadership":
      return "Leadership";
    default:
      return questionnaireType;
  }
}

function buildClientSafeDimensionSummary(
  dimension: DimensionSummary,
): ClientSafeDimensionSummary {
  const scores: ClientSafeDimensionScores = {};

  for (const questionnaireType of SCORED_QUESTIONNAIRE_TYPES) {
    const value = dimension.scores[questionnaireType];

    if (typeof value === "number") {
      scores[questionnaireType] = value;
    }
  }

  const completedQuestionnaireTypes = SCORED_QUESTIONNAIRE_TYPES.filter(
    (questionnaireType) => typeof scores[questionnaireType] === "number",
  );

  const missingQuestionnaireTypes = SCORED_QUESTIONNAIRE_TYPES.filter(
    (questionnaireType) => typeof scores[questionnaireType] !== "number",
  );

  const numericScores = Object.values(scores).filter(
    (value): value is number => typeof value === "number",
  );

  const maxScore =
    numericScores.length > 0 ? Number(Math.max(...numericScores).toFixed(2)) : null;

  const minScore =
    numericScores.length > 0 ? Number(Math.min(...numericScores).toFixed(2)) : null;

  const gap =
    maxScore !== null && minScore !== null
      ? Number((maxScore - minScore).toFixed(2))
      : null;

  return {
    dimensionKey: dimension.dimensionKey,
    dimensionLabel: dimension.dimensionLabel,
    dimensionDescription: dimension.dimensionDescription,
    scores,
    completedQuestionnaireTypes,
    missingQuestionnaireTypes,
    maxScore,
    minScore,
    gap,
  };
}

function sortDimensionsByGap(
  dimensions: ClientSafeDimensionSummary[],
  direction: "asc" | "desc",
): ClientSafeDimensionSummary[] {
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

function buildExecutiveSummary({
  insights,
  completionPercentage,
  completedRespondentGroups,
  totalRespondentGroups,
}: {
  insights: DimensionInsight[];
  completionPercentage: number;
  completedRespondentGroups: number;
  totalRespondentGroups: number;
}): string {
  const strong = insights.filter((insight) => insight.status === "strong").length;
  const weak = insights.filter((insight) => insight.status === "weak").length;

  const significantGaps = insights.filter(
    (insight) => insight.alignment === "significant_gap",
  ).length;

  const emergingGaps = insights.filter(
    (insight) => insight.alignment === "emerging_gap",
  ).length;

  let maturityStatement = "";

  if (strong >= weak + 2) {
    maturityStatement =
      "HR operations appear relatively well established, with several areas of strength across the assessed dimensions.";
  } else if (weak >= strong + 2) {
    maturityStatement =
      "HR operations appear to be under strain, with multiple dimensions indicating weaker or inconsistent execution.";
  } else {
    maturityStatement =
      "HR operations show a mixed level of maturity, with strengths in some areas but clear opportunities for improvement in others.";
  }

  let alignmentStatement = "";

  if (significantGaps > 0) {
    alignmentStatement =
      "There are clear differences in how HR, managers, and leadership experience people operations, suggesting inconsistency in how processes are understood or applied.";
  } else if (emergingGaps > 0) {
    alignmentStatement =
      "There are early signs of variation between respondent groups, indicating that some processes may not be consistently experienced across the organisation.";
  } else {
    alignmentStatement =
      "Perceptions across HR, managers, and leadership are broadly aligned, suggesting that processes are generally understood and applied consistently.";
  }

  let completenessStatement = "";

  if (completionPercentage < 50) {
    completenessStatement =
      "This view is based on a limited response set and should be treated as directional rather than definitive.";
  } else if (completedRespondentGroups < totalRespondentGroups) {
    completenessStatement =
      "Not all respondent groups are fully represented, so some areas may benefit from additional input to confirm these patterns.";
  } else {
    completenessStatement =
      "The response set provides a well-rounded view across respondent groups, giving a reliable picture of current operations.";
  }

  let directionStatement = "";

  if (significantGaps > 0) {
    directionStatement =
      "The most valuable next step is to focus on areas with the greatest variation, aligning expectations, clarifying ownership, and standardising how key processes are delivered.";
  } else if (weak > strong) {
    directionStatement =
      "The priority should be strengthening core operational foundations, ensuring that key processes are clearly defined, consistently applied, and well supported.";
  } else {
    directionStatement =
      "The next step is to build on existing strengths while addressing targeted areas of inconsistency before they become larger operational constraints.";
  }

  return `${maturityStatement} ${alignmentStatement} ${completenessStatement} ${directionStatement}`;
}

async function fetchProjectSummary(
  request: Request,
  projectId: string,
): Promise<ProjectSummaryResponse> {
  const baseUrl = getBaseUrl(request);
  const summaryUrl = `${baseUrl}/api/client-diagnostic-project-summary?projectId=${encodeURIComponent(
    projectId,
  )}`;

  const response = await fetch(summaryUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Project summary request failed with status ${response.status}.`,
    );
  }

  const json = (await response.json()) as ProjectSummaryResponse | ErrorResponse;

  if (!json.success) {
    throw new Error(json.error);
  }

  return json;
}

export async function GET(
  request: Request,
): Promise<NextResponse<ClientDiagnosticReportResponse | ErrorResponse>> {
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

    const summary = await fetchProjectSummary(request, projectId);

    const clientSafeDimensions = summary.dimensions.map(
      buildClientSafeDimensionSummary,
    );

    const clientSafeInsights = buildDimensionInsights(clientSafeDimensions);
    const clientSafeNarratives = buildDimensionNarratives(clientSafeInsights);
    const clientSafeInsightSummary = buildInsightSummary(clientSafeInsights);

    const strengths = sortDimensionsByGap(
      clientSafeDimensions.filter((dimension) => dimension.gap !== null),
      "asc",
    ).slice(0, 3);

    const gaps = sortDimensionsByGap(
      clientSafeDimensions.filter((dimension) => dimension.gap !== null),
      "desc",
    ).slice(0, 3);

    const completedRespondentGroups = summary.completion.respondentGroups.filter(
      (group) =>
        group.questionnaireType !== "client_fact_pack" && group.completed > 0,
    ).length;

    const completionPercentage = summary.completion.completionPercentage;
    const totalRespondentGroups = SCORED_QUESTIONNAIRE_TYPES.length;

    const executiveOverview = buildExecutiveSummary({
      insights: clientSafeInsights,
      completionPercentage,
      completedRespondentGroups,
      totalRespondentGroups,
    });

    return NextResponse.json({
      success: true,
      report: {
        project: {
          projectId: summary.project.projectId,
          companyName: summary.project.companyName,
          primaryContactName: summary.project.primaryContactName,
          projectStatus: summary.project.projectStatus,
        },
        executiveSummary: {
          overview: executiveOverview,
          completionPercentage,
          completedRespondentGroups,
          totalRespondentGroups,
        },
        insightSummary: clientSafeInsightSummary,
        priorityDimensions: {
          strengths,
          gaps,
        },
        dimensions: clientSafeDimensions,
        insights: {
          dimensions: clientSafeInsights,
        },
        narratives: {
          dimensions: clientSafeNarratives,
        },
        methodology: {
          scoredQuestionnaireTypes: SCORED_QUESTIONNAIRE_TYPES,
          contextualQuestionnaireTypesExcluded: EXCLUDED_CONTEXTUAL_TYPES,
          note: `This report uses scored responses from ${SCORED_QUESTIONNAIRE_TYPES.map(
            getQuestionnaireTypeLabel,
          ).join(", ")}. Client Fact Pack input is treated as contextual background and is excluded from scored comparison, gap analysis, and narrative classification.`,
        },
      },
    });
  } catch (error) {
    console.error("Unable to build client diagnostic report.", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected server error while building client diagnostic report.",
      },
      { status: 500 },
    );
  }
}
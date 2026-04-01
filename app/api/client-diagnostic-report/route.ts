import { NextResponse } from "next/server";
import {
  buildDimensionInsights,
  type DimensionInsight,
} from "@/lib/client-diagnostic/insight-engine";
import {
  buildDimensionNarratives,
  type DimensionNarrative,
} from "@/lib/client-diagnostic/narrative-engine";
import { buildDimensionAnalyses } from "@/lib/client-diagnostic/analysis-engine";

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

type QualitativeThemeSummary = {
  key: string;
  label: string;
  count: number;
};

type DimensionQualitativeSummary = {
  dimensionKey: string;
  dimensionLabel: string;
  commentCount: number;
  respondentGroupsWithComments: QuestionnaireType[];
  keyThemes: QualitativeThemeSummary[];
  advisoryRead: string | null;
  illustrativeSignals: string[];
  confidence: "high" | "medium" | "low";
};

type OverallQualitativeSummary = {
  totalCommentCount: number;
  respondentGroupsWithComments: QuestionnaireType[];
  crossCuttingThemes: QualitativeThemeSummary[];
  summary: string | null;
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
  qualitative: {
    overall: OverallQualitativeSummary;
    dimensions: DimensionQualitativeSummary[];
  };
};

type ReportIssueType =
  | "structural"
  | "behavioural"
  | "fragile"
  | "optimisation"
  | "insufficient-data";

type ReportPriorityArea = {
  dimensionKey: string;
  dimensionLabel: string;
  overallAverage: number | null;
  gap: number | null;
  priorityScore: number;
  issueType: ReportIssueType;
};

type ReportAnalyticsDimension = {
  dimensionKey: string;
  dimensionLabel: string;
  overallAverage: number | null;
  hrScore: number | null;
  managerScore: number | null;
  leadershipScore: number | null;
  gap: number | null;
  priorityScore: number;
  issueType: ReportIssueType;
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
    analytics: {
      overallScore: number | null;
      alignmentScore: number | null;
      confidenceLevel: "low" | "medium" | "high";
      dimensions: ReportAnalyticsDimension[];
      priorityAreas: ReportPriorityArea[];
      priorityClusters: {
        structural: ReportPriorityArea[];
        behavioural: ReportPriorityArea[];
        fragile: ReportPriorityArea[];
        optimisation: ReportPriorityArea[];
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
    qualitative: {
      overall: {
        totalCommentCount: number;
        respondentGroupsWithComments: ScoredQuestionnaireType[];
        crossCuttingThemes: QualitativeThemeSummary[];
        summary: string | null;
      };
      dimensions: Array<{
        dimensionKey: string;
        dimensionLabel: string;
        commentCount: number;
        respondentGroupsWithComments: ScoredQuestionnaireType[];
        keyThemes: QualitativeThemeSummary[];
        advisoryRead: string | null;
        illustrativeSignals: string[];
        confidence: "high" | "medium" | "low";
      }>;
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

function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

function average(values: number[]): number | null {
  if (!values.length) {
    return null;
  }

  return roundToTwo(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getBaseUrl(request: Request): string {
  const requestUrl = new URL(request.url);

  if (process.env.NODE_ENV !== "production") {
    return requestUrl.origin;
  }

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

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

function isScoredQuestionnaireType(
  value: QuestionnaireType,
): value is ScoredQuestionnaireType {
  return SCORED_QUESTIONNAIRE_TYPES.includes(value as ScoredQuestionnaireType);
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

function classifyIssueType(params: {
  overallAverage: number | null;
  gap: number | null;
}): ReportIssueType {
  const { overallAverage, gap } = params;

  if (overallAverage === null) {
    return "insufficient-data";
  }

  if (overallAverage < 3.2 && (gap ?? 0) < 1.0) {
    return "structural";
  }

  if (overallAverage < 3.2 && (gap ?? 0) >= 1.0) {
    return "behavioural";
  }

  if (overallAverage >= 3.2 && (gap ?? 0) >= 1.0) {
    return "fragile";
  }

  return "optimisation";
}

function calculatePriorityScore(params: {
  overallAverage: number | null;
  gap: number | null;
}): number {
  const { overallAverage, gap } = params;

  if (overallAverage === null) {
    return 0;
  }

  const severity = 5 - overallAverage;
  const varianceWeight = gap ?? 0;

  return roundToTwo(severity * 0.7 + varianceWeight * 0.3);
}

function buildAnalyticsDimensions(
  dimensions: ClientSafeDimensionSummary[],
): ReportAnalyticsDimension[] {
  return dimensions.map((dimension) => {
    const hrScore = dimension.scores.hr ?? null;
    const managerScore = dimension.scores.manager ?? null;
    const leadershipScore = dimension.scores.leadership ?? null;

    const overallAverage = average(
      [hrScore, managerScore, leadershipScore].filter(
        (value): value is number => typeof value === "number",
      ),
    );

    const issueType = classifyIssueType({
      overallAverage,
      gap: dimension.gap,
    });

    const priorityScore = calculatePriorityScore({
      overallAverage,
      gap: dimension.gap,
    });

    return {
      dimensionKey: dimension.dimensionKey,
      dimensionLabel: dimension.dimensionLabel,
      overallAverage,
      hrScore,
      managerScore,
      leadershipScore,
      gap: dimension.gap,
      priorityScore,
      issueType,
    };
  });
}

function buildPriorityAreas(
  analyticsDimensions: ReportAnalyticsDimension[],
): ReportPriorityArea[] {
  return [...analyticsDimensions]
    .filter((dimension) => dimension.overallAverage !== null)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 3)
    .map((dimension) => ({
      dimensionKey: dimension.dimensionKey,
      dimensionLabel: dimension.dimensionLabel,
      overallAverage: dimension.overallAverage,
      gap: dimension.gap,
      priorityScore: dimension.priorityScore,
      issueType: dimension.issueType,
    }));
}

function buildPriorityClusters(priorityAreas: ReportPriorityArea[]) {
  return {
    structural: priorityAreas.filter((area) => area.issueType === "structural"),
    behavioural: priorityAreas.filter(
      (area) => area.issueType === "behavioural",
    ),
    fragile: priorityAreas.filter((area) => area.issueType === "fragile"),
    optimisation: priorityAreas.filter(
      (area) => area.issueType === "optimisation",
    ),
  };
}

function calculateOverallScore(
  analyticsDimensions: ReportAnalyticsDimension[],
): number | null {
  const values = analyticsDimensions
    .map((dimension) => dimension.overallAverage)
    .filter((value): value is number => typeof value === "number");

  if (!values.length) {
    return null;
  }

  const avg = average(values);

  if (avg === null) {
    return null;
  }

  return roundToTwo(((avg - 1) / 4) * 100);
}

function calculateAlignmentScore(
  analyticsDimensions: ReportAnalyticsDimension[],
): number | null {
  const gaps = analyticsDimensions
    .map((dimension) => dimension.gap)
    .filter((value): value is number => typeof value === "number");

  if (!gaps.length) {
    return null;
  }

  const avgGap = average(gaps);

  if (avgGap === null) {
    return null;
  }

  return roundToTwo(Math.max(0, 100 - (avgGap / 4) * 100));
}

function calculateConfidenceLevel(params: {
  completionPercentage: number;
  completedRespondentGroups: number;
  averageGap: number | null;
}): "low" | "medium" | "high" {
  const { completionPercentage, completedRespondentGroups, averageGap } = params;

  if (completionPercentage < 50 || completedRespondentGroups < 2) {
    return "low";
  }

  if (completionPercentage < 75 || completedRespondentGroups < 3) {
    return "medium";
  }

  if (averageGap !== null && averageGap > 1.25) {
    return "medium";
  }

  return "high";
}

function buildExecutiveSummary({
  insights,
  completionPercentage,
  completedRespondentGroups,
  totalRespondentGroups,
  overallScore,
  alignmentScore,
  priorityAreas,
}: {
  insights: DimensionInsight[];
  completionPercentage: number;
  completedRespondentGroups: number;
  totalRespondentGroups: number;
  overallScore: number | null;
  alignmentScore: number | null;
  priorityAreas: ReportPriorityArea[];
}): string {
  const strong = insights.filter((insight) => insight.status === "strong").length;
  const weak = insights.filter((insight) => insight.status === "weak").length;

  const significantGaps = insights.filter(
    (insight) => insight.alignment === "significant_gap",
  ).length;

  const emergingGaps = insights.filter(
    (insight) => insight.alignment === "emerging_gap",
  ).length;

  const topPriorityLabels = priorityAreas.map((area) => area.dimensionLabel);

  let maturityStatement = "";

  if (overallScore !== null && overallScore >= 75) {
    maturityStatement =
      "The diagnostic suggests a relatively mature HR operating model overall, with more opportunity in refinement and optimisation than foundational repair.";
  } else if (strong >= weak + 2) {
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

  if (alignmentScore !== null && alignmentScore < 60) {
    alignmentStatement =
      "There are meaningful differences in how HR, managers, and leadership experience people operations, suggesting that the current model is not being experienced consistently across the organisation.";
  } else if (significantGaps > 0) {
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

  if (topPriorityLabels.length > 0) {
    directionStatement = `The strongest priorities currently sit in ${topPriorityLabels.join(
      ", ",
    )}. These areas are most likely to benefit from deeper investigation, clearer ownership, and more focused improvement sequencing.`;
  } else if (significantGaps > 0) {
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

function buildClientSafeQualitativeSummary(
  summary: ProjectSummaryResponse["qualitative"],
): ClientDiagnosticReportResponse["report"]["qualitative"] {
  return {
    overall: {
      totalCommentCount: summary.overall.totalCommentCount,
      respondentGroupsWithComments:
        summary.overall.respondentGroupsWithComments.filter(
          isScoredQuestionnaireType,
        ),
      crossCuttingThemes: summary.overall.crossCuttingThemes,
      summary: summary.overall.summary,
    },
    dimensions: summary.dimensions.map((dimension) => ({
      dimensionKey: dimension.dimensionKey,
      dimensionLabel: dimension.dimensionLabel,
      commentCount: dimension.commentCount,
      respondentGroupsWithComments: dimension.respondentGroupsWithComments.filter(
        isScoredQuestionnaireType,
      ),
      keyThemes: dimension.keyThemes,
      advisoryRead: dimension.advisoryRead,
      illustrativeSignals: dimension.illustrativeSignals,
      confidence: dimension.confidence,
    })),
  };
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

    const clientSafeAnalyses = buildDimensionAnalyses({
      insights: clientSafeInsights,
    });

    const clientSafeNarratives = buildDimensionNarratives(clientSafeAnalyses);
    const clientSafeInsightSummary = buildInsightSummary(clientSafeInsights);
    const clientSafeQualitative = buildClientSafeQualitativeSummary(
      summary.qualitative,
    );

    const analyticsDimensions = buildAnalyticsDimensions(clientSafeDimensions);
    const priorityAreas = buildPriorityAreas(analyticsDimensions);
    const priorityClusters = buildPriorityClusters(priorityAreas);
    const overallScore = calculateOverallScore(analyticsDimensions);
    const alignmentScore = calculateAlignmentScore(analyticsDimensions);

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

    const averageGap = average(
      analyticsDimensions
        .map((dimension) => dimension.gap)
        .filter((value): value is number => typeof value === "number"),
    );

    const confidenceLevel = calculateConfidenceLevel({
      completionPercentage,
      completedRespondentGroups,
      averageGap,
    });

    const executiveOverview = buildExecutiveSummary({
      insights: clientSafeInsights,
      completionPercentage,
      completedRespondentGroups,
      totalRespondentGroups,
      overallScore,
      alignmentScore,
      priorityAreas,
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
        analytics: {
          overallScore,
          alignmentScore,
          confidenceLevel,
          dimensions: analyticsDimensions,
          priorityAreas,
          priorityClusters,
        },
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
        qualitative: clientSafeQualitative,
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
import {
  buildProjectSummary,
  type ProjectSummaryResponse,
  type DimensionSummary,
  type QualitativeThemeSummary,
} from "@/lib/client-diagnostic/build-project-summary";
import type { DimensionInsight } from "@/lib/client-diagnostic/insight-engine";
import type { DimensionNarrative } from "@/lib/client-diagnostic/narrative-engine";
import type { DimensionAnalysis } from "@/lib/client-diagnostic/analysis-engine";
import {
  average,
  classifyIssueType,
  calculatePriorityScore,
  calculateOverallScore,
  calculateAlignmentScore,
  calculateConfidenceLevel,
} from "@/lib/client-diagnostic/scoring";

export type QuestionnaireType =
  | "hr"
  | "manager"
  | "leadership"
  | "client_fact_pack";

export type ScoredQuestionnaireType = "hr" | "manager" | "leadership";

type DimensionScores = Partial<Record<QuestionnaireType, number>>;
type ClientSafeDimensionScores = Partial<Record<ScoredQuestionnaireType, number>>;

export type ClientSafeDimensionSummary = {
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

export type ReportIssueType =
  | "structural"
  | "behavioural"
  | "fragile"
  | "optimisation"
  | "insufficient-data";

export type ReportPriorityArea = {
  dimensionKey: string;
  dimensionLabel: string;
  overallAverage: number | null;
  gap: number | null;
  priorityScore: number;
  issueType: ReportIssueType;
};

export type ReportAnalyticsDimension = {
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

export type ClientDiagnosticReport = {
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
  evidenceBase: {
    respondentGroups: {
      hr: {
        invited: number;
        completed: number;
      };
      manager: {
        invited: number;
        completed: number;
      };
      leadership: {
        invited: number;
        completed: number;
      };
    };
  };
  segmentation: ProjectSummaryResponse["segmentation"];
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
  analyses: {
    dimensions: DimensionAnalysis[];
  };
  itemEvidence: {
    dimensions: Array<{
      dimensionKey: string;
      items: {
        score_1: {
          combined: number | null;
          groups: {
            hr: { mean: number | null; n: number };
            manager: { mean: number | null; n: number };
            leadership: { mean: number | null; n: number };
          };
        };
        score_2: {
          combined: number | null;
          groups: {
            hr: { mean: number | null; n: number };
            manager: { mean: number | null; n: number };
            leadership: { mean: number | null; n: number };
          };
        };
        score_3: {
          combined: number | null;
          groups: {
            hr: { mean: number | null; n: number };
            manager: { mean: number | null; n: number };
            leadership: { mean: number | null; n: number };
          };
        };
        score_4: {
          combined: number | null;
          groups: {
            hr: { mean: number | null; n: number };
            manager: { mean: number | null; n: number };
            leadership: { mean: number | null; n: number };
          };
        };
        score_5: {
          combined: number | null;
          groups: {
            hr: { mean: number | null; n: number };
            manager: { mean: number | null; n: number };
            leadership: { mean: number | null; n: number };
          };
        };
      };
    }>;
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
  context: {
    factPack: {
      status: string | null;
      submittedAt: string | null;
      response: Record<string, unknown> | null;
    };
    serviceAccess: Array<{
      participant_id: string;
      questionnaire_type: "hr" | "manager";
      routes_used: string[];
      usual_route: string | null;
      usual_route_effectiveness: number | null;
      intended_access_model: string | null;
      intended_primary_route: string | null;
      specific_route_detail: string | null;
    }>;
  };
  methodology: {
    scoredQuestionnaireTypes: ScoredQuestionnaireType[];
    contextualQuestionnaireTypesExcluded: QuestionnaireType[];
    note: string;
  };
};

const SCORED_QUESTIONNAIRE_TYPES: ScoredQuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
];

const EXCLUDED_CONTEXTUAL_TYPES: QuestionnaireType[] = ["client_fact_pack"];

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
    const value = (dimension.scores as DimensionScores)[questionnaireType];

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

  const hrScore = typeof scores.hr === "number" ? scores.hr : null;
  const managerScore =
    typeof scores.manager === "number" ? scores.manager : null;
  const operationalScores = [hrScore, managerScore].filter(
    (value): value is number => typeof value === "number",
  );

  const maxScore =
    operationalScores.length > 0
      ? Number(Math.max(...operationalScores).toFixed(2))
      : null;

  const minScore =
    operationalScores.length > 0
      ? Number(Math.min(...operationalScores).toFixed(2))
      : null;

  const gap =
    hrScore !== null && managerScore !== null
      ? Number(Math.abs(hrScore - managerScore).toFixed(2))
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

function buildAnalyticsDimensions(
  dimensions: ClientSafeDimensionSummary[],
  insights: DimensionInsight[],
): ReportAnalyticsDimension[] {
  return dimensions.map((dimension) => {
    const hrScore = dimension.scores.hr ?? null;
    const managerScore = dimension.scores.manager ?? null;
    const leadershipScore = dimension.scores.leadership ?? null;
    const insight = insights.find(
      (candidate) => candidate.dimensionKey === dimension.dimensionKey,
    );
    const overallAverage = insight?.averageScore ?? null;
    const gap = insight?.gap ?? dimension.gap;

    const issueType = classifyIssueType({
      overallAverage,
      gap,
    });

    const priorityScore = calculatePriorityScore({
      overallAverage,
      gap,
    });

    return {
      dimensionKey: dimension.dimensionKey,
      dimensionLabel: dimension.dimensionLabel,
      overallAverage,
      hrScore,
      managerScore,
      leadershipScore,
      gap,
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
      "There are meaningful differences between HR and Manager experience of people operations, suggesting that important parts of the current model are not being experienced consistently in day-to-day operation. Leadership should be interpreted separately as a strategic perspective.";
  } else if (significantGaps > 0) {
    alignmentStatement =
      "There are clear differences between HR and Manager experience of people operations, suggesting inconsistency in how processes are understood or applied in day-to-day operation. Leadership remains a separate strategic perspective.";
  } else if (emergingGaps > 0) {
    alignmentStatement =
      "Several dimensions show meaningful differences between HR and Manager experience of the operating model. The pattern is not organisation-wide disagreement, but it does indicate that important parts of the model are landing differently in operational experience. Leadership should be read separately as a strategic perspective.";
  } else {
    alignmentStatement =
      "HR and Manager perceptions are broadly aligned on the operational experience. This indicates similar views of how the model is working, not that the underlying capabilities are necessarily strong. Leadership remains a separate strategic perspective.";
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
): ClientDiagnosticReport["qualitative"] {
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

export async function buildClientDiagnosticReport(
  projectId: string,
): Promise<ClientDiagnosticReport> {
  const summary = await buildProjectSummary(projectId);

  const clientSafeDimensions = summary.dimensions.map(
    buildClientSafeDimensionSummary,
  );

  const summaryInsights = summary.insights.dimensions;
  const summaryInsightSummary = summary.insights.summary;
  const summaryAnalyses = summary.analyses.dimensions;
  const summaryNarratives = summary.narratives.dimensions;
  const clientSafeQualitative = buildClientSafeQualitativeSummary(
    summary.qualitative,
  );

  const analyticsDimensions = buildAnalyticsDimensions(
    clientSafeDimensions,
    summaryInsights,
  );
  const priorityAreas = buildPriorityAreas(analyticsDimensions);
  const priorityClusters = buildPriorityClusters(priorityAreas);
  const overallScore = calculateOverallScore(
  analyticsDimensions
    .map((dimension) => dimension.overallAverage)
    .filter((value): value is number => typeof value === "number"),
);
  const alignmentScore = calculateAlignmentScore(
  analyticsDimensions
    .map((dimension) => dimension.gap)
    .filter((value): value is number => typeof value === "number"),
);

  const strengths = sortDimensionsByGap(
    clientSafeDimensions.filter((dimension) => dimension.gap !== null),
    "asc",
  ).slice(0, 3);

  const gaps = sortDimensionsByGap(
    clientSafeDimensions.filter((dimension) => dimension.gap !== null),
    "desc",
  ).slice(0, 3);

  const completedRespondentGroups = summary.completion.respondentGroups.filter(
    (group) => group.completed > 0,
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
    insights: summaryInsights,
    completionPercentage,
    completedRespondentGroups,
    totalRespondentGroups,
    overallScore,
    alignmentScore,
    priorityAreas,
  });

  return {
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
    insightSummary: summaryInsightSummary,
    evidenceBase: summary.evidenceBase,
    segmentation: summary.segmentation,
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
      dimensions: summaryInsights,
    },
    analyses: {
      dimensions: summaryAnalyses,
    },
    itemEvidence: summary.itemEvidence,
    narratives: {
      dimensions: summaryNarratives,
    },
    qualitative: clientSafeQualitative,
    context: summary.context,
    methodology: {
      scoredQuestionnaireTypes: SCORED_QUESTIONNAIRE_TYPES,
      contextualQuestionnaireTypesExcluded: EXCLUDED_CONTEXTUAL_TYPES,
      note: `This report uses scored responses from ${SCORED_QUESTIONNAIRE_TYPES.map(
        getQuestionnaireTypeLabel,
      ).join(", ")}. Client Fact Pack input is treated as contextual background and is excluded from scored comparison, gap analysis, and narrative classification.`,
    },
  };
}
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildDimensionInsights,
  type DimensionInsight,
} from "@/lib/client-diagnostic/insight-engine";
import {
  buildDimensionNarratives,
  type DimensionNarrative,
} from "@/lib/client-diagnostic/narrative-engine";
import {
  dimensionDefinitions,
  questionnaireTypes,
  type QuestionnaireType,
} from "@/lib/client-diagnostic/question-bank";
import {
  buildDimensionAnalyses,
  type DimensionAnalysis,
} from "@/lib/client-diagnostic/analysis-engine";

type ParticipantRow = {
  participant_id: string;
  questionnaire_type: QuestionnaireType;
  role_label: string;
  participant_status: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
  segmentation_values: Record<string, string> | null;
};

type DimensionScoreRow = {
  score_id: string;
  project_id: string;
  participant_id: string | null;
  questionnaire_type: QuestionnaireType;
  dimension_key: string;
  average_score: number;
  response_count: number;
  updated_at: string;
};

type CommentRow = {
  participant_id: string;
  questionnaire_type: QuestionnaireType;
  dimension_key: string;
  question_key: string;
  comment_text: string | null;
  updated_at: string;
};

type ScoredResponseRow = {
  participant_id: string;
  questionnaire_type: QuestionnaireType;
  dimension_key: string;
  question_key: string;
  answer_value: number | null;
};

type FactPackRow = {
  participant_id: string;
  status: string;
  submitted_at: string | null;
  updated_at: string;
  response_json: Record<string, unknown> | null;
};

type ServiceAccessContextRow = {
  participant_id: string;
  questionnaire_type: "hr" | "manager";
  routes_used: string[];
  usual_route: string | null;
  usual_route_effectiveness: number | null;
  intended_access_model: string | null;
  intended_primary_route: string | null;
  specific_route_detail: string | null;
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

type ScoredQuestionnaireType = Extract<
  QuestionnaireType,
  "hr" | "manager" | "leadership"
>;

const DEFAULT_SEGMENT_REPORTING_MIN_N = 5;

function recommendSegmentReportingMinN({
  totalInvited,
  respondentGroupInvitedCounts,
}: {
  totalInvited: number;
  respondentGroupInvitedCounts: number[];
}): {
  recommendedMinN: number;
  reason: string;
} {
  const positiveGroupCounts = respondentGroupInvitedCounts.filter(
    (count) => count > 0,
  );
  const smallestGroup =
    positiveGroupCounts.length > 0
      ? Math.min(...positiveGroupCounts)
      : 0;

  if (totalInvited <= 8) {
    return {
      recommendedMinN: 2,
      reason:
        "Very small diagnostic population; lower reporting threshold recommended so that meaningful cohort evidence is not automatically suppressed.",
    };
  }

  if (totalInvited <= 15 || smallestGroup <= 2) {
    return {
      recommendedMinN: 3,
      reason:
        "Small diagnostic population or intentionally small respondent cohort; reduced threshold recommended with appropriately cautious interpretation.",
    };
  }

  if (totalInvited <= 25 || smallestGroup <= 4) {
    return {
      recommendedMinN: 4,
      reason:
        "Smaller diagnostic population; moderately reduced threshold recommended to preserve useful segment coverage while retaining confidentiality protection.",
    };
  }

  return {
    recommendedMinN: DEFAULT_SEGMENT_REPORTING_MIN_N,
    reason:
      "Standard reporting threshold recommended for this diagnostic population and respondent-group structure.",
  };
}

type QuestionnaireTypeScores = Partial<Record<QuestionnaireType, number>>;

export type DimensionSummary = {
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

type QualitativeThemeDefinition = {
  key: string;
  label: string;
  keywords: string[];
};

export type QualitativeThemeSummary = {
  key: string;
  label: string;
  count: number;
};

export type DimensionQualitativeSummary = {
  dimensionKey: string;
  dimensionLabel: string;
  commentCount: number;
  respondentGroupsWithComments: QuestionnaireType[];
  keyThemes: QualitativeThemeSummary[];
  advisoryRead: string | null;
  illustrativeSignals: string[];
  confidence: "high" | "medium" | "low";
};

export type OverallQualitativeSummary = {
  totalCommentCount: number;
  respondentGroupsWithComments: QuestionnaireType[];
  crossCuttingThemes: QualitativeThemeSummary[];
  summary: string | null;
};

type ScoredRespondentCount = {
  invited: number;
  completed: number;
};

type ItemGroupEvidence = {
  mean: number | null;
  n: number;
};

type SegmentGroupEvidence = ItemGroupEvidence & {
  clientReporting: {
    status: "reportable" | "suppressed";
    reason: "meets_threshold" | "below_threshold";
  };
};

type ItemEvidenceValue = {
  combined: number | null;
  groups: {
    hr: ItemGroupEvidence;
    manager: ItemGroupEvidence;
    leadership: ItemGroupEvidence;
  };
};

export type ProjectSummaryResponse = {
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
  evidenceBase: {
    respondentGroups: {
      hr: ScoredRespondentCount;
      manager: ScoredRespondentCount;
      leadership: ScoredRespondentCount;
    };
  };
  reportingPolicy: {
    recommendedSegmentReportingMinN: number;
    segmentReportingMinN: number;
    source: "default" | "project";
    recommendationReason: string;
  };
  segmentation: {
    availableKeys: Array<{
      key: string;
      values: string[];
    }>;
    segments: Array<{
      key: string;
      value: string;
      respondentCount: number;
      respondentCountClientReporting: {
        status: "reportable" | "suppressed";
        reason:
          | "segment_below_threshold"
          | "no_single_hidden_nonzero_group"
          | "single_hidden_nonzero_group";
      };
      questionnaireTypes: QuestionnaireType[];
      respondentGroups: {
        hr: number;
        manager: number;
        leadership: number;
      };
      respondentGroupClientReporting: {
        hr: {
          status: "reportable" | "suppressed";
          reason: "meets_threshold" | "below_threshold";
        };
        manager: {
          status: "reportable" | "suppressed";
          reason: "meets_threshold" | "below_threshold";
        };
        leadership: {
          status: "reportable" | "suppressed";
          reason: "meets_threshold" | "below_threshold";
        };
      };
      confidentialityStatus: "reportable" | "suppressed";
      analyticalStrength:
        | "insufficient"
        | "directional"
        | "moderate"
        | "strong";
      compositionStatus: "single_group" | "group_dominated" | "mixed";
      independentSegmentInterpretation: "allowed" | "constrained";
      leadershipEvidence: {
        n: number;
        presence: "none" | "limited" | "established";
        interpretiveUse: "unavailable" | "caution" | "usable";
      };
      dimensions: Array<{
        dimensionKey: string;
        respondentCount: number;
        averageScore: number | null;
        clientReporting: {
          status: "reportable" | "suppressed";
          reason:
            | "all_contributing_groups_reportable"
            | "suppressed_group_contributes";
        };
        groups: {
          hr: SegmentGroupEvidence;
          manager: SegmentGroupEvidence;
          leadership: SegmentGroupEvidence;
        };
        groupComparisons: Array<{
          leftGroup: "hr" | "manager" | "leadership";
          rightGroup: "hr" | "manager" | "leadership";
          leftN: number;
          rightN: number;
          leftAverageScore: number;
          rightAverageScore: number;
          delta: number;
          magnitude: "minimal" | "notable" | "material";
          interpretiveUse: "unavailable" | "caution" | "usable";
          clientReporting: {
            status: "reportable" | "suppressed";
            reason: "both_groups_reportable" | "group_below_threshold";
          };
        }>;
      }>;
    }>;
    comparisons: Array<{
      key: string;
      leftValue: string;
      rightValue: string;
      availability: "allowed" | "constrained" | "unavailable";
      analyticalStrength:
        | "insufficient"
        | "directional"
        | "moderate"
        | "strong";
      dimensions: Array<{
        dimensionKey: string;
        leftAverageScore: number | null;
        rightAverageScore: number | null;
        delta: number | null;
        magnitude: "minimal" | "notable" | "material" | null;
      }>;
    }>;
  };
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
  analyses: {
    dimensions: DimensionAnalysis[];
  };
  itemEvidence: {
    dimensions: Array<{
      dimensionKey: string;
      items: {
        score_1: ItemEvidenceValue;
        score_2: ItemEvidenceValue;
        score_3: ItemEvidenceValue;
        score_4: ItemEvidenceValue;
        score_5: ItemEvidenceValue;
      };
    }>;
  };
  narratives: {
    dimensions: DimensionNarrative[];
  };
  qualitative: {
    overall: OverallQualitativeSummary;
    dimensions: DimensionQualitativeSummary[];
  };
  context: {
    factPack: {
      status: string | null;
      submittedAt: string | null;
      response: Record<string, unknown> | null;
    };
    serviceAccess: ServiceAccessContextRow[];
  };
};

export type BuildProjectSummaryErrorCode =
  | "INVALID_PROJECT_ID"
  | "PROJECT_NOT_FOUND"
  | "PARTICIPANTS_LOAD_FAILED"
  | "SCORES_LOAD_FAILED"
  | "COMMENTS_LOAD_FAILED";

export class BuildProjectSummaryError extends Error {
  code: BuildProjectSummaryErrorCode;
  status: number;

  constructor(
    code: BuildProjectSummaryErrorCode,
    message: string,
    status: number,
  ) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const SCORED_QUESTIONNAIRE_TYPES: QuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
];

function isScoredQuestionnaireType(
  questionnaireType: QuestionnaireType,
): boolean {
  return SCORED_QUESTIONNAIRE_TYPES.includes(questionnaireType);
}

const GENERIC_THEME_LIBRARY: QualitativeThemeDefinition[] = [
  {
    key: "clarity_gap",
    label: "Clarity and interpretation gaps",
    keywords: [
      "unclear",
      "not clear",
      "confusing",
      "ambigu",
      "unsure",
      "interpret",
    ],
  },
  {
    key: "inconsistent_execution",
    label: "Inconsistent execution",
    keywords: [
      "inconsistent",
      "different",
      "varies",
      "depends on",
      "not the same",
      "uneven",
    ],
  },
  {
    key: "manual_workaround",
    label: "Manual workaround and extra effort",
    keywords: [
      "manual",
      "workaround",
      "offline",
      "spreadsheet",
      "rework",
      "duplicate",
    ],
  },
  {
    key: "ownership_gap",
    label: "Ownership and follow-through gaps",
    keywords: [
      "owner",
      "ownership",
      "responsib",
      "accountab",
      "follow up",
      "dropped",
      "handoff",
    ],
  },
];

const DIMENSION_THEME_LIBRARY: Record<string, QualitativeThemeDefinition[]> = {
  process_clarity: [
    {
      key: "unclear_workflow",
      label: "Workflow steps are not consistently clear",
      keywords: [
        "unclear",
        "not clear",
        "confusing",
        "which step",
        "what happens next",
        "process",
      ],
    },
    {
      key: "local_interpretation",
      label: "Teams are relying on local interpretation",
      keywords: [
        "depends on",
        "manager by manager",
        "team by team",
        "interpret",
        "local",
        "varies",
      ],
    },
    {
      key: "handoff_ambiguity",
      label: "Handoffs are creating ambiguity",
      keywords: [
        "handoff",
        "handover",
        "between teams",
        "passed around",
        "back and forth",
      ],
    },
  ],
  consistency: [
    {
      key: "uneven_decisions",
      label: "Similar issues are being handled differently",
      keywords: [
        "different",
        "inconsistent",
        "varies",
        "depends on",
        "not the same",
        "uneven",
      ],
    },
    {
      key: "local_variation",
      label: "Local practice is overriding the standard",
      keywords: [
        "local",
        "team by team",
        "manager by manager",
        "business area",
        "region",
      ],
    },
    {
      key: "exception_handling",
      label: "Exceptions are not handled consistently",
      keywords: ["exception", "case by case", "depends", "special case", "judgement"],
    },
  ],
  service_access: [
    {
      key: "unclear_entry_point",
      label: "Support entry points are not always clear",
      keywords: [
        "where to go",
        "who to contact",
        "entry point",
        "mailbox",
        "reach out",
        "contact",
      ],
    },
    {
      key: "informal_routing",
      label: "People are relying on informal routes",
      keywords: ["personal contact", "slack", "message someone", "ask around", "informal"],
    },
    {
      key: "slow_response",
      label: "Response speed and routing are causing delay",
      keywords: ["slow", "delay", "waiting", "queue", "response time", "chase"],
    },
  ],
  ownership: [
    {
      key: "unclear_accountability",
      label: "Accountability is not always clear",
      keywords: [
        "owner",
        "ownership",
        "responsib",
        "accountab",
        "who should",
        "who owns",
      ],
    },
    {
      key: "blurred_boundary",
      label: "Boundaries between roles are blurred",
      keywords: [
        "between hr and manager",
        "between teams",
        "unclear role",
        "boundary",
        "handoff",
      ],
    },
    {
      key: "follow_through_gap",
      label: "Follow-through is inconsistent",
      keywords: ["follow up", "dropped", "missed", "falls through", "not picked up"],
    },
  ],
  systems_enablement: [
    {
      key: "manual_workaround",
      label: "Manual workaround is filling system gaps",
      keywords: ["manual", "workaround", "spreadsheet", "offline", "outside the system"],
    },
    {
      key: "duplicate_entry",
      label: "Duplicate entry and rekeying are creating friction",
      keywords: ["duplicate", "double entry", "enter twice", "rekey", "multiple systems"],
    },
    {
      key: "poor_system_fit",
      label: "The system design is not fitting the real workflow",
      keywords: ["clunky", "hard to use", "friction", "system doesn't", "not fit", "usability"],
    },
  ],
  technology_enablement: [
    {
      key: "manual_workaround",
      label: "Manual workaround is filling system gaps",
      keywords: ["manual", "workaround", "spreadsheet", "offline", "outside the system"],
    },
    {
      key: "duplicate_entry",
      label: "Duplicate entry and rekeying are creating friction",
      keywords: ["duplicate", "double entry", "enter twice", "rekey", "multiple systems"],
    },
    {
      key: "poor_system_fit",
      label: "The system design is not fitting the real workflow",
      keywords: ["clunky", "hard to use", "friction", "system doesn't", "not fit", "usability"],
    },
  ],
  knowledge_self_service: [
    {
      key: "hard_to_find_guidance",
      label: "Guidance is hard to find in the moment",
      keywords: ["find", "search", "locate", "buried", "hard to find", "navigation"],
    },
    {
      key: "outdated_guidance",
      label: "Guidance quality or currency is not trusted",
      keywords: ["outdated", "old", "not updated", "wrong", "trust", "confidence"],
    },
    {
      key: "dependency_on_hr",
      label: "People still depend heavily on HR for clarification",
      keywords: ["ask hr", "need hr", "reach out to hr", "can't self serve", "clarify"],
    },
  ],
  knowledge_access: [
    {
      key: "hard_to_find_guidance",
      label: "Guidance is hard to find in the moment",
      keywords: ["find", "search", "locate", "buried", "hard to find", "navigation"],
    },
    {
      key: "outdated_guidance",
      label: "Guidance quality or currency is not trusted",
      keywords: ["outdated", "old", "not updated", "wrong", "trust", "confidence"],
    },
    {
      key: "dependency_on_hr",
      label: "People still depend heavily on HR for clarification",
      keywords: ["ask hr", "need hr", "reach out to hr", "can't self serve", "clarify"],
    },
  ],
  operational_capacity: [
    {
      key: "reactive_load",
      label: "The model is operating reactively",
      keywords: ["reactive", "firefighting", "always chasing", "constantly", "urgent"],
    },
    {
      key: "bandwidth_constraint",
      label: "Capacity and bandwidth are constrained",
      keywords: ["capacity", "bandwidth", "stretched", "resourced", "too busy", "backlog"],
    },
    {
      key: "priority_conflict",
      label: "Competing priorities are diluting delivery quality",
      keywords: ["priority", "competing", "trade-off", "interrupt", "too many things"],
    },
  ],
  case_management: [
    {
      key: "tracking_gap",
      label: "Tracking and visibility are inconsistent",
      keywords: ["track", "tracking", "status", "visibility", "case", "lost"],
    },
    {
      key: "routing_gap",
      label: "Routing and ownership are not tight enough",
      keywords: ["route", "routing", "ownership", "handoff", "escalate", "pick up"],
    },
    {
      key: "resolution_variation",
      label: "Resolution quality is varying too much",
      keywords: ["resolve", "resolved", "close out", "sla", "quality", "follow-up"],
    },
  ],
  data_handoffs: [
    {
      key: "data_error",
      label: "Data quality and transfer issues are creating rework",
      keywords: ["error", "wrong data", "incorrect", "mismatch", "duplicate record"],
    },
    {
      key: "handoff_delay",
      label: "Handoffs are slowing work down",
      keywords: ["handoff", "handover", "delay", "lag", "waiting", "between systems"],
    },
    {
      key: "reconciliation_effort",
      label: "Correction and reconciliation effort is too high",
      keywords: ["reconcile", "correct", "rework", "manual check", "fix data"],
    },
  ],
  change_resilience: [
    {
      key: "communication_gap",
      label: "Change communication is not landing consistently",
      keywords: ["not aware", "not told", "communication", "briefed", "didn't know"],
    },
    {
      key: "adoption_gap",
      label: "New ways of working are not embedding evenly",
      keywords: ["adoption", "old way", "not sticking", "embed", "follow new process"],
    },
    {
      key: "readiness_gap",
      label: "Readiness and enablement are not strong enough",
      keywords: ["ready", "training", "enablement", "rollout", "implementation"],
    },
  ],
};

export function isUuid(value: string): boolean {
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
      (row) =>
        row.dimension_key === dimension.key &&
        isScoredQuestionnaireType(row.questionnaire_type),
    );

    const scores: QuestionnaireTypeScores = {};
    const completedQuestionnaireTypes: QuestionnaireType[] = [];
    const missingQuestionnaireTypes: QuestionnaireType[] = [];

    for (const questionnaireType of SCORED_QUESTIONNAIRE_TYPES) {
      const groupRows = matchingRows.filter(
        (row) => row.questionnaire_type === questionnaireType,
      );

      const averagedGroupScore = average(
        groupRows
          .map((row) => Number(row.average_score))
          .filter((value) => Number.isFinite(value)),
      );

      if (averagedGroupScore !== null) {
        scores[questionnaireType] = averagedGroupScore;
        completedQuestionnaireTypes.push(questionnaireType);
      } else {
        missingQuestionnaireTypes.push(questionnaireType);
      }
    }

    const numericScores = Object.values(scores).filter(
      (value): value is number => typeof value === "number",
    );

    const maxScore =
      numericScores.length > 0 ? roundToTwo(Math.max(...numericScores)) : null;
    const minScore =
      numericScores.length > 0 ? roundToTwo(Math.min(...numericScores)) : null;
    const gap =
      maxScore !== null && minScore !== null
        ? roundToTwo(maxScore - minScore)
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

function normaliseText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getCleanCommentRows(commentRows: CommentRow[]): CommentRow[] {
  return commentRows.filter(
    (row) =>
      isScoredQuestionnaireType(row.questionnaire_type) &&
      typeof row.comment_text === "string" &&
      normaliseText(row.comment_text).length > 0,
  );
}

function getThemeLibrary(dimensionKey: string): QualitativeThemeDefinition[] {
  return DIMENSION_THEME_LIBRARY[dimensionKey] ?? GENERIC_THEME_LIBRARY;
}

function countThemeMatches(
  comments: string[],
  themes: QualitativeThemeDefinition[],
): QualitativeThemeSummary[] {
  return themes
    .map((theme) => {
      let count = 0;

      for (const comment of comments) {
        const lowerComment = comment.toLowerCase();

        if (theme.keywords.some((keyword) => lowerComment.includes(keyword))) {
          count += 1;
        }
      }

      return {
        key: theme.key,
        label: theme.label,
        count,
      };
    })
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function getQualitativeConfidence(params: {
  commentCount: number;
  respondentGroupCount: number;
  themeCount: number;
}): "high" | "medium" | "low" {
  const { commentCount, respondentGroupCount, themeCount } = params;

  if (commentCount >= 6 && respondentGroupCount >= 2 && themeCount >= 2) {
    return "high";
  }

  if (commentCount >= 3 && respondentGroupCount >= 2) {
    return "medium";
  }

  if (commentCount >= 2) {
    return "low";
  }

  return "low";
}

function getIllustrativeSignals(comments: string[]): string[] {
  return comments
    .map(normaliseText)
    .filter((comment) => comment.length > 0)
    .slice(0, 3)
    .map((comment) =>
      comment
        .replace(/\s+/g, " ")
        .replace(/\s([,.;:!?])/g, "$1")
        .trim(),
    );
}

function buildDimensionAdvisoryRead(params: {
  insight: DimensionInsight;
  dimensionLabel: string;
  commentCount: number;
  themes: QualitativeThemeSummary[];
}): string | null {
  const { insight, dimensionLabel, commentCount, themes } = params;

  if (commentCount === 0) {
    return null;
  }

  const themeLabels = themes.map((t) => t.label.toLowerCase());
  const primary = themeLabels[0];
  const secondary = themeLabels[1];

  const variantSeed =
    Math.round((insight.averageScore ?? 3) * 10) +
    Math.round((insight.gap ?? 0) * 10) +
    dimensionLabel.length;

  const variant = variantSeed % 4;

  const alignmentLine =
    insight.alignment === "significant_gap"
      ? "What stands out most is the difference in how this is being experienced across groups."
      : insight.alignment === "emerging_gap"
        ? "There are signs this is not landing evenly across the organisation."
        : "The pattern appears broadly consistent across respondent groups.";

  if (insight.status === "strong" && primary) {
    const options = [
      `The score for ${dimensionLabel.toLowerCase()} is relatively strong, but the comments add a different layer. ${primary} comes through more clearly than the score alone would suggest. ${alignmentLine}`,
      `Although ${dimensionLabel.toLowerCase()} scores well overall, the written responses are more mixed. The most consistent signal is ${primary}, which suggests some underlying friction still exists. ${alignmentLine}`,
      `The quantitative result is positive, but the qualitative signal is more cautious. ${primary} appears repeatedly in the comments, which suggests the experience may not be as strong as the score implies. ${alignmentLine}`,
      `There is a slight tension between the score and the comments here. ${primary} is coming through consistently, which suggests this area may be stronger in structure than in lived experience. ${alignmentLine}`,
    ];

    return options[variant];
  }

  if (insight.alignment !== "aligned" && primary) {
    const options = [
      `The comments on ${dimensionLabel.toLowerCase()} are particularly useful in explaining the variation in scores. ${primary} is the dominant signal, with ${secondary ?? "related issues"} appearing alongside it. ${alignmentLine}`,
      `The qualitative picture helps explain why this dimension shows variation. ${primary} appears consistently, suggesting the issue is being experienced differently depending on where you sit. ${alignmentLine}`,
      `This is one of the clearer examples where the written responses explain the score pattern. ${primary} is the strongest theme, and it aligns with the differences seen across respondent groups. ${alignmentLine}`,
      `The comments add important context to the score variation. ${primary} comes through most clearly, with ${secondary ?? "additional related signals"} reinforcing the same pattern. ${alignmentLine}`,
    ];

    return options[variant];
  }

  if (primary && secondary) {
    const options = [
      `The qualitative signal for ${dimensionLabel.toLowerCase()} is fairly consistent. ${primary} comes through most clearly, with ${secondary} appearing as a secondary thread. ${alignmentLine}`,
      `Comments on ${dimensionLabel.toLowerCase()} broadly support the score. The strongest signal is ${primary}, alongside ${secondary}. ${alignmentLine}`,
      `The written responses reinforce the overall picture. ${primary} is the dominant theme, with ${secondary} appearing less frequently but still relevant. ${alignmentLine}`,
      `The qualitative picture is relatively clear. ${primary} appears most often, with ${secondary} adding further context to the same pattern. ${alignmentLine}`,
    ];

    return options[variant];
  }

  if (primary) {
    return `The written responses for ${dimensionLabel.toLowerCase()} highlight ${primary} as the most consistent signal. ${alignmentLine}`;
  }

  return `The written responses for ${dimensionLabel.toLowerCase()} provide additional context to the score pattern, although no single theme dominates. ${alignmentLine}`;
}

function buildSystemicThemeStory(
  crossCuttingThemes: QualitativeThemeSummary[],
): string | null {
  const keys = crossCuttingThemes.map((theme) => theme.key);

  const hasCapacity =
    keys.includes("bandwidth_constraint") || keys.includes("reactive_load");
  const hasHandoffs =
    keys.includes("handoff_delay") || keys.includes("handoff_ambiguity");
  const hasWorkflow =
    keys.includes("unclear_workflow") ||
    keys.includes("local_interpretation") ||
    keys.includes("uneven_decisions");
  const hasKnowledge =
    keys.includes("hard_to_find_guidance") ||
    keys.includes("dependency_on_hr") ||
    keys.includes("outdated_guidance");
  const hasOwnership =
    keys.includes("unclear_accountability") ||
    keys.includes("blurred_boundary") ||
    keys.includes("follow_through_gap");

  if (hasCapacity && hasHandoffs && hasWorkflow) {
    return "Taken together, the themes suggest an operating model where limited bandwidth, weak handoffs, and workflow ambiguity are reinforcing each other. That usually creates a reactive pattern rather than one clean root cause.";
  }

  if (hasOwnership && hasWorkflow) {
    return "Taken together, the themes suggest the operating model is carrying both clarity and accountability issues. In practice, that usually means work moves forward, but not always with one dependable path or one clear owner.";
  }

  if (hasKnowledge && hasWorkflow) {
    return "Taken together, the themes suggest the organisation is still relying too much on interpretation in the moment. Guidance exists, but not yet in a way that consistently reduces dependence on local clarification.";
  }

  if (hasHandoffs && hasOwnership) {
    return "Taken together, the themes suggest the friction is sitting at the points where work changes hands. That usually indicates a structural operating issue rather than a narrow process defect.";
  }

  return null;
}

function buildOverallQualitativeSummary(params: {
  totalCommentCount: number;
  respondentGroupsWithComments: QuestionnaireType[];
  crossCuttingThemes: QualitativeThemeSummary[];
}): string | null {
  const {
    totalCommentCount,
    respondentGroupsWithComments,
    crossCuttingThemes,
  } = params;

  if (totalCommentCount === 0) {
    return null;
  }

  const groupLabels = respondentGroupsWithComments.map(
    formatQuestionnaireTypeLabel,
  );
  const themeLabels = crossCuttingThemes.map((theme) => theme.label.toLowerCase());
  const systemicStory = buildSystemicThemeStory(crossCuttingThemes);

  if (themeLabels.length >= 3) {
    return `A total of ${totalCommentCount} written comments were provided across ${groupLabels.join(
      ", ",
    )}. The most consistent qualitative signals relate to ${themeLabels[0]}, ${themeLabels[1]}, and ${themeLabels[2]}. ${
      systemicStory ??
      "Together, that pattern suggests the issues are showing up in day-to-day operation rather than only in scored perception."
    }`;
  }

  if (themeLabels.length >= 1) {
    return `A total of ${totalCommentCount} written comments were provided across ${groupLabels.join(
      ", ",
    )}. The clearest recurring signal relates to ${themeLabels[0]}, which adds useful context behind the score pattern.${
      systemicStory ? ` ${systemicStory}` : ""
    }`;
  }

  return `A total of ${totalCommentCount} written comments were provided across ${groupLabels.join(
      ", ",
    )}. The qualitative evidence adds useful context, although the themes are still fairly dispersed and not yet concentrated around one dominant pattern.`;
}

function buildQualitativeSummary(params: {
  dimensions: DimensionSummary[];
  insights: DimensionInsight[];
  commentRows: CommentRow[];
}) {
  const { dimensions, insights, commentRows } = params;
  const cleanRows = getCleanCommentRows(commentRows);

  const dimensionQualitative = dimensions.map((dimension) => {
    const matchingRows = cleanRows.filter(
      (row) => row.dimension_key === dimension.dimensionKey,
    );

    const comments = matchingRows
      .map((row) => normaliseText(row.comment_text ?? ""))
      .filter((value) => value.length > 0);

    const respondentGroupsWithComments = Array.from(
      new Set(matchingRows.map((row) => row.questionnaire_type)),
    ) as QuestionnaireType[];

    const themes = countThemeMatches(
      comments,
      getThemeLibrary(dimension.dimensionKey),
    );

    const insight = insights.find(
      (candidate) => candidate.dimensionKey === dimension.dimensionKey,
    );

    return {
      dimensionKey: dimension.dimensionKey,
      dimensionLabel: dimension.dimensionLabel,
      commentCount: comments.length,
      respondentGroupsWithComments,
      keyThemes: themes,
      advisoryRead:
        insight !== undefined
          ? buildDimensionAdvisoryRead({
              insight,
              dimensionLabel: dimension.dimensionLabel,
              commentCount: comments.length,
              themes,
            })
          : null,
      illustrativeSignals: getIllustrativeSignals(comments),
      confidence: getQualitativeConfidence({
        commentCount: comments.length,
        respondentGroupCount: respondentGroupsWithComments.length,
        themeCount: themes.length,
      }),
    } satisfies DimensionQualitativeSummary;
  });

  const crossCuttingThemeMap = new Map<string, QualitativeThemeSummary>();

  for (const dimension of dimensionQualitative) {
    for (const theme of dimension.keyThemes) {
      const existing = crossCuttingThemeMap.get(theme.key);

      if (existing) {
        existing.count += theme.count;
      } else {
        crossCuttingThemeMap.set(theme.key, { ...theme });
      }
    }
  }

  const crossCuttingThemes = [...crossCuttingThemeMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const respondentGroupsWithComments = Array.from(
    new Set(cleanRows.map((row) => row.questionnaire_type)),
  ) as QuestionnaireType[];

  return {
    overall: {
      totalCommentCount: cleanRows.length,
      respondentGroupsWithComments,
      crossCuttingThemes,
      summary: buildOverallQualitativeSummary({
        totalCommentCount: cleanRows.length,
        respondentGroupsWithComments,
        crossCuttingThemes,
      }),
    } satisfies OverallQualitativeSummary,
    dimensions: dimensionQualitative,
  };
}

function buildQuestionScoresByDimension(
  rows: ScoredResponseRow[],
): Record<string, Record<string, number | undefined>> {
  const grouped = new Map<
    string,
    Map<
      string,
      Map<QuestionnaireType, number[]>
    >
  >();

  for (const row of rows) {
    if (typeof row.answer_value !== "number") {
      continue;
    }

    const match = row.question_key.match(/_score_([1-5])$/);

    if (!match) {
      continue;
    }

    const itemKey = `score_${match[1]}`;

    let dimension = grouped.get(row.dimension_key);

    if (!dimension) {
      dimension = new Map();
      grouped.set(row.dimension_key, dimension);
    }

    let item = dimension.get(itemKey);

    if (!item) {
      item = new Map();
      dimension.set(itemKey, item);
    }

    const values = item.get(row.questionnaire_type) ?? [];
    values.push(row.answer_value);
    item.set(row.questionnaire_type, values);
  }

  const result: Record<string, Record<string, number | undefined>> = {};

  for (const [dimensionKey, items] of grouped) {
    const dimensionScores: Record<string, number | undefined> = {};

    for (const [itemKey, groups] of items) {
      const groupMeans = questionnaireTypes
        .map((questionnaireType) => {
          const values = groups.get(questionnaireType);

          if (!values || values.length === 0) {
            return null;
          }

          return values.reduce((sum, value) => sum + value, 0) / values.length;
        })
        .filter((value): value is number => value !== null);

      if (groupMeans.length > 0) {
        dimensionScores[itemKey] =
          groupMeans.reduce((sum, value) => sum + value, 0) /
          groupMeans.length;
      }
    }

    result[dimensionKey] = dimensionScores;
  }

  return result;
}

function buildItemEvidenceByDimension(
  rows: ScoredResponseRow[],
): Record<string, Record<string, ItemEvidenceValue>> {
  const grouped = new Map<
    string,
    Map<
      string,
      Map<
        ScoredQuestionnaireType,
        Map<string, number>
      >
    >
  >();

  for (const row of rows) {
    if (
      typeof row.answer_value !== "number" ||
      !isScoredQuestionnaireType(row.questionnaire_type)
    ) {
      continue;
    }

    const match = row.question_key.match(/_score_([1-5])$/);

    if (!match) {
      continue;
    }

    const itemKey = `score_${match[1]}`;

    let dimension = grouped.get(row.dimension_key);

    if (!dimension) {
      dimension = new Map();
      grouped.set(row.dimension_key, dimension);
    }

    let item = dimension.get(itemKey);

    if (!item) {
      item = new Map();
      dimension.set(itemKey, item);
    }

    let group = item.get(row.questionnaire_type);

    if (!group) {
      group = new Map();
      item.set(row.questionnaire_type, group);
    }

    group.set(row.participant_id, row.answer_value);
  }

  const result: Record<string, Record<string, ItemEvidenceValue>> = {};

  for (const [dimensionKey, items] of grouped) {
    const dimensionEvidence: Record<string, ItemEvidenceValue> = {};

    for (const [itemKey, groups] of items) {
      const buildGroupEvidence = (
        questionnaireType: ScoredQuestionnaireType,
      ): ItemGroupEvidence => {
        const participantValues = Array.from(
          groups.get(questionnaireType)?.values() ?? [],
        );

        if (participantValues.length === 0) {
          return {
            mean: null,
            n: 0,
          };
        }

        return {
          mean:
            participantValues.reduce((sum, value) => sum + value, 0) /
            participantValues.length,
          n: participantValues.length,
        };
      };

      const hr = buildGroupEvidence("hr");
      const manager = buildGroupEvidence("manager");
      const leadership = buildGroupEvidence("leadership");

      const availableGroupMeans = [hr.mean, manager.mean, leadership.mean].filter(
        (value): value is number => typeof value === "number",
      );

      dimensionEvidence[itemKey] = {
        combined:
          availableGroupMeans.length > 0
            ? availableGroupMeans.reduce((sum, value) => sum + value, 0) /
              availableGroupMeans.length
            : null,
        groups: {
          hr,
          manager,
          leadership,
        },
      };
    }

    result[dimensionKey] = dimensionEvidence;
  }

  return result;
}

function weakerAnalyticalStrength(
  left: "insufficient" | "directional" | "moderate" | "strong",
  right: "insufficient" | "directional" | "moderate" | "strong",
): "insufficient" | "directional" | "moderate" | "strong" {
  const rank = {
    insufficient: 0,
    directional: 1,
    moderate: 2,
    strong: 3,
  } as const;

  return rank[left] <= rank[right] ? left : right;
}

function buildSegmentationSummary(
  participants: ParticipantRow[],
  dimensionScores: DimensionScoreRow[],
  segmentReportingMinN: number,
): ProjectSummaryResponse["segmentation"] {
  const scoredParticipants = participants.filter(
    (participant) =>
      participant.participant_status === "completed" &&
      isScoredQuestionnaireType(participant.questionnaire_type),
  );

  const availableValues = new Map<string, Set<string>>();

  for (const participant of scoredParticipants) {
    for (const [key, value] of Object.entries(
      participant.segmentation_values ?? {},
    )) {
      if (!value) {
        continue;
      }

      const values = availableValues.get(key) ?? new Set<string>();
      values.add(value);
      availableValues.set(key, values);
    }
  }

  const availableKeys = Array.from(availableValues.entries())
    .map(([key, values]) => ({
      key,
      values: Array.from(values).sort(),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const segments = availableKeys.flatMap(({ key, values }) =>
    values.map((value) => {
      const matchingParticipants = scoredParticipants.filter(
        (participant) => participant.segmentation_values?.[key] === value,
      );

      const participantIds = new Set(
        matchingParticipants.map((participant) => participant.participant_id),
      );

      const questionnaireTypes = Array.from(
        new Set(
          matchingParticipants.map(
            (participant) => participant.questionnaire_type,
          ),
        ),
      );

      const respondentGroups = {
        hr: matchingParticipants.filter(
          (participant) => participant.questionnaire_type === "hr",
        ).length,
        manager: matchingParticipants.filter(
          (participant) => participant.questionnaire_type === "manager",
        ).length,
        leadership: matchingParticipants.filter(
          (participant) => participant.questionnaire_type === "leadership",
        ).length,
      };

      const respondentCount = matchingParticipants.length;

      const confidentialityStatus: "reportable" | "suppressed" =
        respondentCount >= segmentReportingMinN
          ? "reportable"
          : "suppressed";

      const analyticalStrength:
        | "insufficient"
        | "directional"
        | "moderate"
        | "strong" =
        respondentCount < 5
          ? "insufficient"
          : respondentCount < 10
            ? "directional"
            : respondentCount < 20
              ? "moderate"
              : "strong";

      const nonZeroGroupCounts = Object.values(respondentGroups).filter(
        (count) => count > 0,
      );

      const largestGroupCount = Math.max(...Object.values(respondentGroups), 0);

      const compositionStatus:
        | "single_group"
        | "group_dominated"
        | "mixed" =
        nonZeroGroupCounts.length === 1
          ? "single_group"
          : respondentCount > 0 && largestGroupCount / respondentCount >= 0.75
            ? "group_dominated"
            : "mixed";

      const independentSegmentInterpretation:
        | "allowed"
        | "constrained" =
        confidentialityStatus === "reportable" && compositionStatus === "mixed"
          ? "allowed"
          : "constrained";

      const leadershipCount = respondentGroups.leadership;

      const leadershipEvidence: ProjectSummaryResponse["segmentation"]["segments"][number]["leadershipEvidence"] =
        leadershipCount === 0
          ? {
              n: 0,
              presence: "none",
              interpretiveUse: "unavailable",
            }
          : leadershipCount <= 2
            ? {
                n: leadershipCount,
                presence: "limited",
                interpretiveUse: "caution",
              }
            : {
                n: leadershipCount,
                presence: "established",
                interpretiveUse: "usable",
              };

      const dimensions = dimensionDefinitions.map((dimension) => {
        const matchingScores = dimensionScores.filter(
          (row) =>
            row.dimension_key === dimension.key &&
            row.participant_id !== null &&
            participantIds.has(row.participant_id) &&
            isScoredQuestionnaireType(row.questionnaire_type),
        );

        const buildGroupEvidence = (
          questionnaireType: ScoredQuestionnaireType,
        ): ItemGroupEvidence => {
          const groupRows = matchingScores.filter(
            (row) => row.questionnaire_type === questionnaireType,
          );

          const scores = groupRows
            .map((row) => Number(row.average_score))
            .filter((score) => Number.isFinite(score));

          return {
            mean:
              scores.length > 0
                ? scores.reduce((sum, score) => sum + score, 0) / scores.length
                : null,
            n: new Set(
              groupRows
                .map((row) => row.participant_id)
                .filter((participantId): participantId is string =>
                  participantId !== null,
                ),
            ).size,
          };
        };

        const withClientReporting = (
          group: ItemGroupEvidence,
        ): SegmentGroupEvidence => ({
          ...group,
          clientReporting:
            group.n >= segmentReportingMinN
              ? {
                  status: "reportable",
                  reason: "meets_threshold",
                }
              : {
                  status: "suppressed",
                  reason: "below_threshold",
                },
        });

        const hr = withClientReporting(buildGroupEvidence("hr"));
        const manager = withClientReporting(buildGroupEvidence("manager"));
        const leadership = withClientReporting(
          buildGroupEvidence("leadership"),
        );

        const respondentScores = matchingScores
          .map((row) => Number(row.average_score))
          .filter((score) => Number.isFinite(score));

        const groupComparisonPairs = [
          ["hr", "manager"],
          ["hr", "leadership"],
          ["manager", "leadership"],
        ] as const;

        const groupEvidence = {
          hr,
          manager,
          leadership,
        };

        const groupComparisons = groupComparisonPairs.flatMap(
          ([leftGroup, rightGroup]) => {
            const left = groupEvidence[leftGroup];
            const right = groupEvidence[rightGroup];

            if (
              left.n === 0 ||
              right.n === 0 ||
              left.mean === null ||
              right.mean === null
            ) {
              return [];
            }

            const delta = left.mean - right.mean;
            const absoluteRoundedDelta =
              Math.round(Math.abs(delta) * 100) / 100;

            const magnitude:
              | "minimal"
              | "notable"
              | "material" =
              absoluteRoundedDelta < 0.2
                ? "minimal"
                : absoluteRoundedDelta < 0.4
                  ? "notable"
                  : "material";

            const includesLeadership =
              rightGroup === "leadership";

            const interpretiveUse:
              | "unavailable"
              | "caution"
              | "usable" =
              includesLeadership
                ? leadershipEvidence.interpretiveUse
                : "usable";

            const clientReporting =
              left.clientReporting.status === "reportable" &&
              right.clientReporting.status === "reportable"
                ? {
                    status: "reportable" as const,
                    reason: "both_groups_reportable" as const,
                  }
                : {
                    status: "suppressed" as const,
                    reason: "group_below_threshold" as const,
                  };

            return [
              {
                leftGroup,
                rightGroup,
                leftN: left.n,
                rightN: right.n,
                leftAverageScore: left.mean,
                rightAverageScore: right.mean,
                delta,
                magnitude,
                interpretiveUse,
                clientReporting,
              },
            ];
          },
        );

        const contributingGroups = [hr, manager, leadership].filter(
          (group) => group.n > 0,
        );

        const clientReporting =
          contributingGroups.every(
            (group) => group.clientReporting.status === "reportable",
          )
            ? {
                status: "reportable" as const,
                reason: "all_contributing_groups_reportable" as const,
              }
            : {
                status: "suppressed" as const,
                reason: "suppressed_group_contributes" as const,
              };

        return {
          dimensionKey: dimension.key,
          respondentCount: new Set(
            matchingScores
              .map((row) => row.participant_id)
              .filter((participantId): participantId is string =>
                participantId !== null,
              ),
          ).size,
          averageScore:
            respondentScores.length > 0
              ? respondentScores.reduce((sum, score) => sum + score, 0) /
                respondentScores.length
              : null,
          clientReporting,
          groups: {
            hr,
            manager,
            leadership,
          },
          groupComparisons,
        };
      });

      const respondentGroupClientReporting = {
        hr:
          respondentGroups.hr >= segmentReportingMinN
            ? {
                status: "reportable" as const,
                reason: "meets_threshold" as const,
              }
            : {
                status: "suppressed" as const,
                reason: "below_threshold" as const,
              },
        manager:
          respondentGroups.manager >= segmentReportingMinN
            ? {
                status: "reportable" as const,
                reason: "meets_threshold" as const,
              }
            : {
                status: "suppressed" as const,
                reason: "below_threshold" as const,
              },
        leadership:
          respondentGroups.leadership >= segmentReportingMinN
            ? {
                status: "reportable" as const,
                reason: "meets_threshold" as const,
              }
            : {
                status: "suppressed" as const,
                reason: "below_threshold" as const,
              },
      };

      const suppressedNonZeroRespondentGroups = (
        ["hr", "manager", "leadership"] as const
      ).filter(
        (group) =>
          respondentGroups[group] > 0 &&
          respondentGroupClientReporting[group].status === "suppressed",
      );

      const respondentCountClientReporting =
        confidentialityStatus === "suppressed"
          ? {
              status: "suppressed" as const,
              reason: "segment_below_threshold" as const,
            }
          : suppressedNonZeroRespondentGroups.length === 1
            ? {
                status: "suppressed" as const,
                reason: "single_hidden_nonzero_group" as const,
              }
            : {
                status: "reportable" as const,
                reason: "no_single_hidden_nonzero_group" as const,
              };

      return {
        key,
        value,
        respondentCount,
        respondentCountClientReporting,
        questionnaireTypes,
        respondentGroups,
        respondentGroupClientReporting,
        confidentialityStatus,
        analyticalStrength,
        compositionStatus,
        independentSegmentInterpretation,
        leadershipEvidence,
        dimensions,
      };
    }),
  );

  const comparisons: ProjectSummaryResponse["segmentation"]["comparisons"] =
    [];

  for (const availableKey of availableKeys) {
    const keySegments = segments.filter(
      (segment) => segment.key === availableKey.key,
    );

    for (let leftIndex = 0; leftIndex < keySegments.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < keySegments.length;
        rightIndex += 1
      ) {
        const left = keySegments[leftIndex];
        const right = keySegments[rightIndex];

        const availability:
          | "allowed"
          | "constrained"
          | "unavailable" =
          left.confidentialityStatus === "suppressed" ||
          right.confidentialityStatus === "suppressed"
            ? "unavailable"
            : left.independentSegmentInterpretation === "allowed" &&
                right.independentSegmentInterpretation === "allowed"
              ? "allowed"
              : "constrained";

        const comparisonDimensions =
          availability === "unavailable"
            ? []
            : dimensionDefinitions.map((dimension) => {
                const leftDimension = left.dimensions.find(
                  (item) => item.dimensionKey === dimension.key,
                );
                const rightDimension = right.dimensions.find(
                  (item) => item.dimensionKey === dimension.key,
                );

                const leftAverageScore = leftDimension?.averageScore ?? null;
                const rightAverageScore = rightDimension?.averageScore ?? null;

                const delta =
                  leftAverageScore !== null && rightAverageScore !== null
                    ? leftAverageScore - rightAverageScore
                    : null;

                const absoluteRoundedDelta =
                  delta === null ? null : Math.round(Math.abs(delta) * 100) / 100;

                const magnitude:
                  | "minimal"
                  | "notable"
                  | "material"
                  | null =
                  absoluteRoundedDelta === null
                    ? null
                    : absoluteRoundedDelta < 0.2
                      ? "minimal"
                      : absoluteRoundedDelta < 0.4
                        ? "notable"
                        : "material";

                return {
                  dimensionKey: dimension.key,
                  leftAverageScore,
                  rightAverageScore,
                  delta,
                  magnitude,
                };
              });

        comparisons.push({
          key: availableKey.key,
          leftValue: left.value,
          rightValue: right.value,
          availability,
          analyticalStrength: weakerAnalyticalStrength(
            left.analyticalStrength,
            right.analyticalStrength,
          ),
          dimensions: comparisonDimensions,
        });
      }
    }
  }

  return {
    availableKeys,
    segments,
    comparisons,
  };
}

export async function buildProjectSummary(
  projectId: string,
): Promise<ProjectSummaryResponse> {
  if (!projectId) {
    throw new BuildProjectSummaryError(
      "INVALID_PROJECT_ID",
      "projectId is required.",
      400,
    );
  }

  if (!isUuid(projectId)) {
    throw new BuildProjectSummaryError(
      "INVALID_PROJECT_ID",
      "projectId must be a valid UUID.",
      400,
    );
  }

  const supabase = createSupabaseAdminClient();

  async function loadPagedRows<T>(
    loadPage: (
      from: number,
      to: number,
    ) => Promise<{ data: T[] | null; error: unknown }>,
  ): Promise<{ data: T[] | null; error: unknown }> {
    const pageSize = 1000;
    const rows: T[] = [];

    for (let from = 0; ; from += pageSize) {
      const { data, error } = await loadPage(from, from + pageSize - 1);

      if (error) {
        return {
          data: null,
          error,
        };
      }

      const pageRows = data ?? [];
      rows.push(...pageRows);

      if (pageRows.length < pageSize) {
        return {
          data: rows,
          error: null,
        };
      }
    }
  }

  const participantsPromise = loadPagedRows<ParticipantRow>(
    async (from, to) => {
      const { data, error } = await supabase
        .from("client_participants")
        .select(
          "participant_id, questionnaire_type, role_label, participant_status, started_at, completed_at, updated_at, segmentation_values",
        )
        .eq("project_id", projectId)
        .order("participant_id", { ascending: true })
        .range(from, to)
        .returns<ParticipantRow[]>();

      return { data, error };
    },
  );

  const dimensionScoresPromise = loadPagedRows<DimensionScoreRow>(
    async (from, to) => {
      const { data, error } = await supabase
        .from("client_dimension_scores")
        .select(
          "score_id, project_id, participant_id, questionnaire_type, dimension_key, average_score, response_count, updated_at",
        )
        .eq("project_id", projectId)
        .order("score_id", { ascending: true })
        .range(from, to)
        .returns<DimensionScoreRow[]>();

      return { data, error };
    },
  );

  const scoredResponsesPromise = loadPagedRows<ScoredResponseRow>(
    async (from, to) => {
      const { data, error } = await supabase
        .from("client_responses")
        .select(
          "participant_id, questionnaire_type, dimension_key, question_key, answer_value",
        )
        .eq("project_id", projectId)
        .not("answer_value", "is", null)
        .order("participant_id", { ascending: true })
        .order("question_key", { ascending: true })
        .range(from, to)
        .returns<ScoredResponseRow[]>();

      return { data, error };
    },
  );

  const commentsPromise = loadPagedRows<CommentRow>(
    async (from, to) => {
      const { data, error } = await supabase
        .from("client_responses")
        .select(
          "participant_id, questionnaire_type, dimension_key, question_key, comment_text, updated_at",
        )
        .eq("project_id", projectId)
        .not("comment_text", "is", null)
        .order("participant_id", { ascending: true })
        .order("question_key", { ascending: true })
        .range(from, to)
        .returns<CommentRow[]>();

      return { data, error };
    },
  );

  const serviceAccessPromise = loadPagedRows<ServiceAccessContextRow>(
    async (from, to) => {
      const { data, error } = await supabase
        .from("client_service_access_context")
        .select(
          "participant_id, questionnaire_type, routes_used, usual_route, usual_route_effectiveness, intended_access_model, intended_primary_route, specific_route_detail",
        )
        .eq("project_id", projectId)
        .order("participant_id", { ascending: true })
        .range(from, to)
        .returns<ServiceAccessContextRow[]>();

      return { data, error };
    },
  );

  const [
    { data: project, error: projectError },
    { data: participants, error: participantsError },
    { data: scoreRows, error: scoresError },
    { data: scoredResponseRows, error: scoredResponsesError },
    { data: commentRows, error: commentsError },
    { data: factPackRows, error: factPackError },
    { data: serviceAccessRows, error: serviceAccessError },
  ] = await Promise.all([
    supabase
      .from("client_projects")
      .select(
        "project_id, company_name, primary_contact_name, primary_contact_email, project_status, notes, created_at, updated_at",
      )
      .eq("project_id", projectId)
      .single<ProjectRow>(),
    participantsPromise,
    dimensionScoresPromise,
    scoredResponsesPromise,
    commentsPromise,
    supabase
      .from("client_fact_packs")
      .select("participant_id, status, submitted_at, updated_at, response_json")
      .eq("project_id", projectId)
      .returns<FactPackRow[]>(),
    serviceAccessPromise,
  ]);

  if (projectError || !project) {
    throw new BuildProjectSummaryError(
      "PROJECT_NOT_FOUND",
      "Project not found.",
      404,
    );
  }

  if (participantsError) {
    throw new BuildProjectSummaryError(
      "PARTICIPANTS_LOAD_FAILED",
      "Unable to load project participants.",
      500,
    );
  }

  if (scoresError) {
    throw new BuildProjectSummaryError(
      "SCORES_LOAD_FAILED",
      "Unable to load project dimension scores.",
      500,
    );
  }

  if (scoredResponsesError) {
    throw new BuildProjectSummaryError(
      "COMMENTS_LOAD_FAILED",
      "Unable to load scored diagnostic responses.",
      500,
    );
  }

  if (commentsError) {
    throw new BuildProjectSummaryError(
      "COMMENTS_LOAD_FAILED",
      "Unable to load project comments.",
      500,
    );
  }

  if (factPackError) {
    throw new BuildProjectSummaryError(
      "COMMENTS_LOAD_FAILED",
      "Unable to load client fact pack.",
      500,
    );
  }

  if (serviceAccessError) {
    throw new BuildProjectSummaryError(
      "COMMENTS_LOAD_FAILED",
      "Unable to load service access context.",
      500,
    );
  }

  const participantRows = participants ?? [];
  const dimensionScoreRows = (scoreRows ?? []).filter((row) =>
    isScoredQuestionnaireType(row.questionnaire_type),
  );
  const qualitativeRows = (commentRows ?? []).filter((row) =>
    isScoredQuestionnaireType(row.questionnaire_type),
  );

  const factPackRow =
    (factPackRows ?? []).find(
      (row) => row.status === "completed" || row.submitted_at !== null,
    ) ??
    (factPackRows ?? [])[0] ??
    null;

  const serviceAccessContext = serviceAccessRows ?? [];

  const completed = participantRows.filter(
    (participant) => participant.participant_status === "completed",
  ).length;

  const totalInvited = participantRows.length;
  const outstanding = Math.max(totalInvited - completed, 0);

  const respondentGroups = buildRespondentGroups(participantRows);
  const dimensions = buildDimensionSummaries(dimensionScoreRows);
  const reportingRecommendation = recommendSegmentReportingMinN({
    totalInvited,
    respondentGroupInvitedCounts: respondentGroups.map(
      (group) => group.totalInvited,
    ),
  });

  const reportingPolicy: ProjectSummaryResponse["reportingPolicy"] = {
    recommendedSegmentReportingMinN:
      reportingRecommendation.recommendedMinN,
    segmentReportingMinN: reportingRecommendation.recommendedMinN,
    source: "default",
    recommendationReason: reportingRecommendation.reason,
  };

  const segmentation = buildSegmentationSummary(
    participantRows,
    dimensionScoreRows,
    reportingPolicy.segmentReportingMinN,
  );
  const dimensionInsights = buildDimensionInsights(dimensions);
  const questionScoresByDimension = buildQuestionScoresByDimension(
    scoredResponseRows ?? [],
  );
  const itemEvidenceByDimension = buildItemEvidenceByDimension(
    scoredResponseRows ?? [],
  );
  const dimensionAnalyses = buildDimensionAnalyses({
    insights: dimensionInsights,
    questionScoresByDimension,
  });
  const dimensionNarratives = buildDimensionNarratives(dimensionAnalyses);
  const insightSummary = buildInsightSummary(dimensionInsights);

  const qualitativeSummary = buildQualitativeSummary({
    dimensions,
    insights: dimensionInsights,
    commentRows: qualitativeRows,
  });

  const strongestAlignment = sortDimensionsByGap(
    dimensions.filter((dimension) => dimension.gap !== null),
    "asc",
  ).slice(0, 3);

  const biggestGaps = sortDimensionsByGap(
    dimensions.filter((dimension) => dimension.gap !== null),
    "desc",
  ).slice(0, 3);

  return {
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
      completionPercentage: getCompletionPercentage(completed, totalInvited),
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
    evidenceBase: {
      respondentGroups: {
        hr: (() => {
          const group = respondentGroups.find(
            (item) => item.questionnaireType === "hr",
          );
          return {
            invited: group?.totalInvited ?? 0,
            completed: group?.completed ?? 0,
          };
        })(),
        manager: (() => {
          const group = respondentGroups.find(
            (item) => item.questionnaireType === "manager",
          );
          return {
            invited: group?.totalInvited ?? 0,
            completed: group?.completed ?? 0,
          };
        })(),
        leadership: (() => {
          const group = respondentGroups.find(
            (item) => item.questionnaireType === "leadership",
          );
          return {
            invited: group?.totalInvited ?? 0,
            completed: group?.completed ?? 0,
          };
        })(),
      },
    },
    reportingPolicy,
    segmentation,
    insights: {
      dimensions: dimensionInsights,
      summary: insightSummary,
    },
    analyses: {
      dimensions: dimensionAnalyses,
    },
    itemEvidence: {
      dimensions: dimensionDefinitions.map((dimension) => {
        const evidence = itemEvidenceByDimension[dimension.key] ?? {};

        const emptyItemEvidence = (): ItemEvidenceValue => ({
          combined: null,
          groups: {
            hr: { mean: null, n: 0 },
            manager: { mean: null, n: 0 },
            leadership: { mean: null, n: 0 },
          },
        });

        return {
          dimensionKey: dimension.key,
          items: {
            score_1: evidence.score_1 ?? emptyItemEvidence(),
            score_2: evidence.score_2 ?? emptyItemEvidence(),
            score_3: evidence.score_3 ?? emptyItemEvidence(),
            score_4: evidence.score_4 ?? emptyItemEvidence(),
            score_5: evidence.score_5 ?? emptyItemEvidence(),
          },
        };
      }),
    },
    narratives: {
      dimensions: dimensionNarratives,
    },
    qualitative: qualitativeSummary,
    context: {
      factPack: {
        status: factPackRow?.status ?? null,
        submittedAt: factPackRow?.submitted_at ?? null,
        response: factPackRow?.response_json ?? null,
      },
      serviceAccess: serviceAccessContext,
    },
  };
}
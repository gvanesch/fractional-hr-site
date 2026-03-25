import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

type CommentRow = {
  participant_id: string;
  questionnaire_type: QuestionnaireType;
  dimension_key: string;
  question_key: string;
  comment_text: string | null;
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

type QualitativeThemeDefinition = {
  key: string;
  label: string;
  keywords: string[];
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
  narratives: {
    dimensions: DimensionNarrative[];
  };
  qualitative: {
    overall: OverallQualitativeSummary;
    dimensions: DimensionQualitativeSummary[];
  };
};

type ErrorResponse = {
  success: false;
  error: string;
};

const GENERIC_THEME_LIBRARY: QualitativeThemeDefinition[] = [
  {
    key: "clarity_gap",
    label: "Clarity and interpretation gaps",
    keywords: ["unclear", "not clear", "confusing", "ambigu", "unsure", "interpret"],
  },
  {
    key: "inconsistent_execution",
    label: "Inconsistent execution",
    keywords: ["inconsistent", "different", "varies", "depends on", "not the same", "uneven"],
  },
  {
    key: "manual_workaround",
    label: "Manual workaround and extra effort",
    keywords: ["manual", "workaround", "offline", "spreadsheet", "rework", "duplicate"],
  },
  {
    key: "ownership_gap",
    label: "Ownership and follow-through gaps",
    keywords: ["owner", "ownership", "responsib", "accountab", "follow up", "dropped", "handoff"],
  },
];

const DIMENSION_THEME_LIBRARY: Record<string, QualitativeThemeDefinition[]> = {
  process_clarity: [
    {
      key: "unclear_workflow",
      label: "Workflow steps are not consistently clear",
      keywords: ["unclear", "not clear", "confusing", "which step", "what happens next", "process"],
    },
    {
      key: "local_interpretation",
      label: "Teams are relying on local interpretation",
      keywords: ["depends on", "manager by manager", "team by team", "interpret", "local", "varies"],
    },
    {
      key: "handoff_ambiguity",
      label: "Handoffs are creating ambiguity",
      keywords: ["handoff", "handover", "between teams", "passed around", "back and forth"],
    },
  ],
  consistency: [
    {
      key: "uneven_decisions",
      label: "Similar issues are being handled differently",
      keywords: ["different", "inconsistent", "varies", "depends on", "not the same", "uneven"],
    },
    {
      key: "local_variation",
      label: "Local practice is overriding the standard",
      keywords: ["local", "team by team", "manager by manager", "business area", "region"],
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
      keywords: ["where to go", "who to contact", "entry point", "mailbox", "reach out", "contact"],
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
      keywords: ["owner", "ownership", "responsib", "accountab", "who should", "who owns"],
    },
    {
      key: "blurred_boundary",
      label: "Boundaries between roles are blurred",
      keywords: ["between hr and manager", "between teams", "unclear role", "boundary", "handoff"],
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

function normaliseText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getCleanCommentRows(commentRows: CommentRow[]): CommentRow[] {
  return commentRows.filter(
    (row) => typeof row.comment_text === "string" && normaliseText(row.comment_text).length > 0,
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

function getQualitativeConfidence(
  commentCount: number,
  respondentGroupCount: number,
): "high" | "medium" | "low" {
  if (commentCount >= 6 && respondentGroupCount >= 2) {
    return "high";
  }

  if (commentCount >= 3) {
    return "medium";
  }

  return "low";
}

function getIllustrativeSignals(comments: string[]): string[] {
  return comments
    .map(normaliseText)
    .filter((comment) => comment.length > 0)
    .slice(0, 3)
    .map((comment) => {
      if (comment.length <= 160) {
        return comment;
      }

      return `${comment.slice(0, 157).trimEnd()}...`;
    });
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

  const themeLabels = themes.map((theme) => theme.label.toLowerCase());

  const primaryTheme = themeLabels[0];
  const secondaryTheme = themeLabels[1];

  const strengthPosition =
    insight.status === "strong"
      ? "reinforce the stronger score pattern"
      : insight.status === "moderate"
        ? "help explain why the area is only partially embedded"
        : "reinforce that this is a visible operational weakness";

  const alignmentPosition =
    insight.alignment === "significant_gap"
      ? "They also suggest that the issue is not being experienced consistently across respondent groups."
      : insight.alignment === "emerging_gap"
        ? "They suggest there is some unevenness in how the issue is showing up across the organisation."
        : "The comments are broadly consistent with a shared operating experience rather than a narrow local issue.";

  if (primaryTheme && secondaryTheme) {
    return `The written responses for ${dimensionLabel.toLowerCase()} ${strengthPosition}. The clearest signals point to ${primaryTheme}, alongside ${secondaryTheme}. ${alignmentPosition}`;
  }

  if (primaryTheme) {
    return `The written responses for ${dimensionLabel.toLowerCase()} ${strengthPosition}. The dominant theme is ${primaryTheme}. ${alignmentPosition}`;
  }

  return `The written responses for ${dimensionLabel.toLowerCase()} add useful operational colour to the score pattern. ${alignmentPosition}`;
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

  const groupLabels = respondentGroupsWithComments.map(formatQuestionnaireTypeLabel);
  const themeLabels = crossCuttingThemes.map((theme) => theme.label.toLowerCase());

  if (themeLabels.length >= 3) {
    return `A total of ${totalCommentCount} written comments were provided across ${groupLabels.join(
      ", ",
    )}. The strongest recurring qualitative signals relate to ${themeLabels[0]}, ${themeLabels[1]}, and ${themeLabels[2]}. Together, these comments suggest the issues are showing up in daily operating practice rather than only in scored perception.`;
  }

  if (themeLabels.length >= 1) {
    return `A total of ${totalCommentCount} written comments were provided across ${groupLabels.join(
      ", ",
    )}. The most consistent qualitative signal relates to ${themeLabels[0]}, which provides useful context behind the scored results.`;
  }

  return `A total of ${totalCommentCount} written comments were provided across ${groupLabels.join(
    ", ",
  )}. They add useful context to the scored results, although the themes are still fairly dispersed.`;
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

    const themes = countThemeMatches(comments, getThemeLibrary(dimension.dimensionKey));
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
      confidence: getQualitativeConfidence(
        comments.length,
        respondentGroupsWithComments.length,
      ),
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
      { data: commentRows, error: commentsError },
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
      supabase
        .from("client_responses")
        .select(
          "participant_id, questionnaire_type, dimension_key, question_key, comment_text, updated_at",
        )
        .eq("project_id", projectId)
        .not("comment_text", "is", null)
        .returns<CommentRow[]>(),
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

    if (commentsError) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to load project comments.",
        },
        { status: 500 },
      );
    }

    const participantRows = participants ?? [];
    const dimensionScoreRows = scoreRows ?? [];
    const qualitativeRows = commentRows ?? [];

    const completed = participantRows.filter(
      (participant) => participant.participant_status === "completed",
    ).length;

    const totalInvited = participantRows.length;
    const outstanding = Math.max(totalInvited - completed, 0);

    const respondentGroups = buildRespondentGroups(participantRows);
    const dimensions = buildDimensionSummaries(dimensionScoreRows);
    const dimensionInsights = buildDimensionInsights(dimensions);
    const dimensionNarratives = buildDimensionNarratives(dimensionInsights);
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
      narratives: {
        dimensions: dimensionNarratives,
      },
      qualitative: qualitativeSummary,
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
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
  type QuestionnaireType,
} from "@/lib/client-diagnostic/question-bank";
import {
  buildDimensionAnalyses,
  type DimensionAnalysis,
} from "@/lib/client-diagnostic/analysis-engine";
import type {
  SegmentationSchema,
  SegmentationValues,
} from "@/lib/client-diagnostic/segmentation";

type ProjectQuestionnaireType =
  | "hr"
  | "manager"
  | "leadership"
  | "client_fact_pack";

type ParticipantRow = {
  participant_id: string;
  questionnaire_type: ProjectQuestionnaireType;
  role_label: string;
  name: string;
  email: string;
  segmentation_values: SegmentationValues | null;
  participant_status: string;
  invited_at: string | null;
  invite_expires_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
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

type ProjectRow = {
  project_id: string;
  company_name: string;
  primary_contact_name: string;
  primary_contact_email: string;
  billing_contact_name: string | null;
  billing_contact_email: string | null;
  company_website: string | null;
  purchase_order_number: string | null;
  msa_status: string | null;
  dpa_status: string | null;
  project_status: string;
  notes: string | null;
  segmentation_schema: SegmentationSchema | null;
  created_at: string;
  updated_at: string;
};

type FactPackRow = {
  participant_id: string;
  status: string;
  submitted_at: string | null;
  updated_at: string;
  response_json: Record<string, unknown> | null;
};

type ParticipantSummary = {
  participantId: string;
  questionnaireType: ProjectQuestionnaireType;
  roleLabel: string;
  name: string;
  email: string;
  segmentationValues: SegmentationValues | null;
  participantStatus: string;
  invitedAt: string | null;
  inviteExpiresAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
};

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

export type RespondentGroupSummary = {
  questionnaireType: ProjectQuestionnaireType;
  label: string;
  totalInvited: number;
  outstanding: number;
  completed: number;
  outstandingParticipants: Array<{
    participantId: string;
    roleLabel: string;
    name: string;
    email: string;
    segmentationValues: SegmentationValues | null;
    participantStatus: string;
    invitedAt: string | null;
    inviteExpiresAt: string | null;
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

type CompletionSummary = {
  totalInvited: number;
  outstanding: number;
  completed: number;
  completionPercentage: number;
  respondentGroups: RespondentGroupSummary[];
};

type FactPackSummary = {
  invited: boolean;
  participantId: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  participantStatus: string | null;
  factPackStatus: "not_invited" | "not_started" | "in_progress" | "completed";
  hasSavedResponse: boolean;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string | null;
  submittedAt: string | null;
};

export type ProjectSummaryResponse = {
  success: true;
  project: {
    projectId: string;
    companyName: string;
    primaryContactName: string;
    primaryContactEmail: string;
    billingContactName: string | null;
    billingContactEmail: string | null;
    companyWebsite: string | null;
    purchaseOrderNumber: string | null;
    msaStatus: string | null;
    dpaStatus: string | null;
    projectStatus: string;
    notes: string | null;
    segmentationSchema: SegmentationSchema | null;
  };
  completion: CompletionSummary & {
    participants: ParticipantSummary[];
  };
  scoredCompletion: CompletionSummary & {
    analysisReady: boolean;
  };
  factPack: FactPackSummary;
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
  analyses: {
    dimensions: DimensionAnalysis[];
  };
  narratives: {
    dimensions: DimensionNarrative[];
  };
  qualitative: {
    overall: OverallQualitativeSummary;
    dimensions: DimensionQualitativeSummary[];
  };
};

const ALL_PROJECT_QUESTIONNAIRE_TYPES: ProjectQuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
  "client_fact_pack",
];

const SCORED_PROJECT_QUESTIONNAIRE_TYPES: ProjectQuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
];

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

function isWithdrawnParticipant(
  participant: Pick<ParticipantRow, "participant_status">,
): boolean {
  return participant.participant_status === "archived";
}

function getActiveParticipants(participantRows: ParticipantRow[]): ParticipantRow[] {
  return participantRows.filter((participant) => !isWithdrawnParticipant(participant));
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
  questionnaireType: ProjectQuestionnaireType,
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

function buildParticipantSummary(
  participant: ParticipantRow,
): ParticipantSummary {
  return {
    participantId: participant.participant_id,
    questionnaireType: participant.questionnaire_type,
    roleLabel: participant.role_label,
    name: participant.name,
    email: participant.email,
    segmentationValues: participant.segmentation_values,
    participantStatus: participant.participant_status,
    invitedAt: participant.invited_at,
    inviteExpiresAt: participant.invite_expires_at,
    startedAt: participant.started_at,
    completedAt: participant.completed_at,
    updatedAt: participant.updated_at,
  };
}

function buildRespondentGroups(
  participantRows: ParticipantRow[],
  includedQuestionnaireTypes: ProjectQuestionnaireType[],
): RespondentGroupSummary[] {
  const activeParticipants = getActiveParticipants(participantRows);

  return includedQuestionnaireTypes.map((questionnaireType) => {
    const matchingParticipants = activeParticipants.filter(
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
        name: participant.name,
        email: participant.email,
        segmentationValues: participant.segmentation_values,
        participantStatus: participant.participant_status,
        invitedAt: participant.invited_at,
        inviteExpiresAt: participant.invite_expires_at,
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

function buildCompletionSummary(
  participantRows: ParticipantRow[],
  includedQuestionnaireTypes: ProjectQuestionnaireType[],
): CompletionSummary {
  const activeParticipants = getActiveParticipants(participantRows);

  const filteredParticipants = activeParticipants.filter((participant) =>
    includedQuestionnaireTypes.includes(participant.questionnaire_type),
  );

  const completed = filteredParticipants.filter(
    (participant) => participant.participant_status === "completed",
  ).length;

  const totalInvited = filteredParticipants.length;
  const outstanding = Math.max(totalInvited - completed, 0);

  return {
    totalInvited,
    outstanding,
    completed,
    completionPercentage: getCompletionPercentage(completed, totalInvited),
    respondentGroups: buildRespondentGroups(
      filteredParticipants,
      includedQuestionnaireTypes,
    ),
  };
}

function buildFactPackSummary(
  participantRows: ParticipantRow[],
  factPackRows: FactPackRow[],
): FactPackSummary {
  const participant =
    getActiveParticipants(participantRows).find(
      (row) => row.questionnaire_type === "client_fact_pack",
    ) ?? null;

  if (!participant) {
    return {
      invited: false,
      participantId: null,
      recipientName: null,
      recipientEmail: null,
      participantStatus: null,
      factPackStatus: "not_invited",
      hasSavedResponse: false,
      startedAt: null,
      completedAt: null,
      updatedAt: null,
      submittedAt: null,
    };
  }

  const factPack =
    factPackRows.find((row) => row.participant_id === participant.participant_id) ??
    null;

  const hasSavedResponse = Boolean(
    factPack?.response_json &&
      typeof factPack.response_json === "object" &&
      Object.keys(factPack.response_json).length > 0,
  );

  let factPackStatus: FactPackSummary["factPackStatus"] = "not_started";

  if (
    participant.participant_status === "completed" ||
    participant.completed_at !== null ||
    factPack?.status === "completed" ||
    factPack?.submitted_at !== null
  ) {
    factPackStatus = "completed";
  } else if (
    participant.started_at !== null ||
    participant.participant_status === "in_progress" ||
    factPack?.status === "in_progress" ||
    hasSavedResponse
  ) {
    factPackStatus = "in_progress";
  }

  return {
    invited: true,
    participantId: participant.participant_id,
    recipientName: participant.name,
    recipientEmail: participant.email,
    participantStatus: participant.participant_status,
    factPackStatus,
    hasSavedResponse,
    startedAt: participant.started_at,
    completedAt: participant.completed_at,
    updatedAt: factPack?.updated_at ?? participant.updated_at,
    submittedAt: factPack?.submitted_at ?? null,
  };
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
    .map((comment) => {
      const cleaned = comment
        .replace(/\s+/g, " ")
        .replace(/\s([,.;:!?])/g, "$1")
        .trim();

      if (cleaned.length <= 145) {
        return cleaned;
      }

      return `${cleaned.slice(0, 142).trimEnd()}...`;
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

  const groupLabels = respondentGroupsWithComments.map((value) =>
    formatQuestionnaireTypeLabel(value as ProjectQuestionnaireType),
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

export async function getProjectSummaryData(
  projectId: string,
): Promise<ProjectSummaryResponse> {
  if (!isUuid(projectId)) {
    throw new Error("projectId must be a valid UUID.");
  }

  const supabase = getSupabaseAdminClient();

  const [
    { data: project, error: projectError },
    { data: participants, error: participantsError },
    { data: factPackRows, error: factPackError },
    { data: scoreRows, error: scoresError },
    { data: commentRows, error: commentsError },
  ] = await Promise.all([
    supabase
      .from("client_projects")
      .select(
        "project_id, company_name, primary_contact_name, primary_contact_email, billing_contact_name, billing_contact_email, company_website, purchase_order_number, msa_status, dpa_status, project_status, notes, segmentation_schema, created_at, updated_at",
    )
      .eq("project_id", projectId)
      .single<ProjectRow>(),
    supabase
      .from("client_participants")
      .select(
        "participant_id, questionnaire_type, role_label, name, email, segmentation_values, participant_status, invited_at, invite_expires_at, started_at, completed_at, updated_at",
      )
      .eq("project_id", projectId)
      .returns<ParticipantRow[]>(),
    supabase
      .from("client_fact_packs")
      .select(
        "participant_id, status, submitted_at, updated_at, response_json",
      )
      .eq("project_id", projectId)
      .returns<FactPackRow[]>(),
    supabase
      .from("client_dimension_scores")
      .select(
        "score_id, project_id, participant_id, questionnaire_type, dimension_key, average_score, response_count, updated_at",
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
    throw new Error("Project not found.");
  }

  if (participantsError) {
    throw new Error("Unable to load project participants.");
  }

  if (factPackError) {
    throw new Error("Unable to load client fact pack summary.");
  }

  if (scoresError) {
    throw new Error("Unable to load project dimension scores.");
  }

  if (commentsError) {
    throw new Error("Unable to load project comments.");
  }

  const participantRows = participants ?? [];
  const activeParticipants = getActiveParticipants(participantRows);
  const activeParticipantIds = new Set(
    activeParticipants.map((participant) => participant.participant_id),
  );
  const activeScoredParticipantIds = new Set(
    activeParticipants
      .filter((participant) =>
        participant.questionnaire_type === "hr" ||
        participant.questionnaire_type === "manager" ||
        participant.questionnaire_type === "leadership",
      )
      .map((participant) => participant.participant_id),
  );

  const participantSummaries = participantRows.map(buildParticipantSummary);
  const factPackSummary = buildFactPackSummary(
    participantRows,
    factPackRows ?? [],
  );

  const dimensionScoreRows = (scoreRows ?? []).filter(
    (row) =>
      isScoredQuestionnaireType(row.questionnaire_type) &&
      row.participant_id !== null &&
      activeScoredParticipantIds.has(row.participant_id),
  );

  const qualitativeRows = (commentRows ?? []).filter(
    (row) =>
      isScoredQuestionnaireType(row.questionnaire_type) &&
      activeParticipantIds.has(row.participant_id),
  );

  const completion = buildCompletionSummary(
    participantRows,
    ALL_PROJECT_QUESTIONNAIRE_TYPES,
  );

  const scoredCompletion = buildCompletionSummary(
    participantRows,
    SCORED_PROJECT_QUESTIONNAIRE_TYPES,
  );

  const dimensions = buildDimensionSummaries(dimensionScoreRows);
  const dimensionInsights = buildDimensionInsights(dimensions);
  const dimensionAnalyses = buildDimensionAnalyses({
    insights: dimensionInsights,
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
        billingContactName: project.billing_contact_name,
        billingContactEmail: project.billing_contact_email,
        companyWebsite: project.company_website,
        purchaseOrderNumber: project.purchase_order_number,
        msaStatus: project.msa_status,
        dpaStatus: project.dpa_status,
        projectStatus: project.project_status,
        notes: project.notes,
        segmentationSchema: project.segmentation_schema,
     },
    completion: {
      ...completion,
      participants: participantSummaries,
    },
    scoredCompletion: {
      ...scoredCompletion,
      analysisReady:
        scoredCompletion.totalInvited > 0 &&
        scoredCompletion.outstanding === 0,
    },
    factPack: factPackSummary,
    dimensions,
    strongestAlignment,
    biggestGaps,
    insights: {
      dimensions: dimensionInsights,
      summary: insightSummary,
    },
    analyses: {
      dimensions: dimensionAnalyses,
    },
    narratives: {
      dimensions: dimensionNarratives,
    },
    qualitative: qualitativeSummary,
  };
}
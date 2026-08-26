import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { dimensionDefinitions } from "@/lib/client-diagnostic/question-bank";
import type { ProjectSummaryResponse } from "@/lib/client-diagnostic/build-project-summary";

type ScoredQuestionnaireType = "hr" | "manager" | "leadership";

export type ExplorerPerspective = ScoredQuestionnaireType;

type ParticipantRow = {
  participant_id: string;
  questionnaire_type: string;
  participant_status: string;
  segmentation_values: Record<string, string> | null;
};

type DimensionScoreRow = {
  participant_id: string | null;
  questionnaire_type: string;
  dimension_key: string;
  average_score: number;
};

type CommentRow = {
  participant_id: string;
  questionnaire_type: string;
  dimension_key: string;
  question_key: string;
  comment_text: string | null;
  updated_at: string;
};

type Segment = ProjectSummaryResponse["segmentation"]["segments"][number];
type SegmentDimension = Segment["dimensions"][number];
type AvailableKey = ProjectSummaryResponse["segmentation"]["availableKeys"][number];

export type ExplorerCohortFilter = {
  key: string;
  values: string[];
};

export type ExplorerCohortQualitativeComment = {
  questionnaireType: ExplorerPerspective;
  commentText: string;
};

export type ExplorerCohortQualitativeDimension = {
  dimensionKey: string;
  commentCount: number;
  respondentGroupsWithComments: ExplorerPerspective[];
  comments: ExplorerCohortQualitativeComment[];
};

export type ExplorerCohort = {
  selections: ExplorerCohortFilter[];
  filters: ExplorerCohortFilter[];
  isOverallEquivalent: boolean;
  respondentCount: number;
  respondentGroups: Record<ExplorerPerspective, number>;
  analyticalStrength: Segment["analyticalStrength"];
  compositionStatus: Segment["compositionStatus"];
  confidentialityStatus: Segment["confidentialityStatus"];
  dimensions: SegmentDimension[];
  qualitative: {
    totalCommentCount: number;
    respondentGroupsWithComments: ExplorerPerspective[];
    dimensions: ExplorerCohortQualitativeDimension[];
  };
};

const PERSPECTIVES: ExplorerPerspective[] = ["hr", "manager", "leadership"];

function isScoredQuestionnaireType(
  questionnaireType: string,
): questionnaireType is ScoredQuestionnaireType {
  return PERSPECTIVES.includes(questionnaireType as ExplorerPerspective);
}

function normalizeSelections({
  requestedFilters,
  availableKeys,
}: {
  requestedFilters: Record<string, string[]>;
  availableKeys: AvailableKey[];
}): ExplorerCohortFilter[] {
  return availableKeys.flatMap((availableKey) => {
    const requestedValues = requestedFilters[availableKey.key] ?? [];
    const uniqueValidValues = Array.from(new Set(requestedValues)).filter(
      (value) => availableKey.values.includes(value),
    );

    if (uniqueValidValues.length === 0) {
      return [];
    }

    return [
      {
        key: availableKey.key,
        values: availableKey.values.filter((value) =>
          uniqueValidValues.includes(value),
        ),
      },
    ];
  });
}

function getEffectiveFilters({
  selections,
  availableKeys,
  scoredParticipants,
}: {
  selections: ExplorerCohortFilter[];
  availableKeys: AvailableKey[];
  scoredParticipants: ParticipantRow[];
}): ExplorerCohortFilter[] {
  return selections.filter((selection) => {
    const availableKey = availableKeys.find((item) => item.key === selection.key);

    if (!availableKey || selection.values.length < availableKey.values.length) {
      return true;
    }

    return scoredParticipants.some((participant) => {
      const participantValue = participant.segmentation_values?.[selection.key];
      return (
        typeof participantValue !== "string" ||
        !availableKey.values.includes(participantValue)
      );
    });
  });
}

function participantMatchesFilters(
  participant: ParticipantRow,
  filters: ExplorerCohortFilter[],
): boolean {
  return filters.every((filter) => {
    const participantValue = participant.segmentation_values?.[filter.key];
    return (
      typeof participantValue === "string" &&
      filter.values.includes(participantValue)
    );
  });
}

function sameParticipantSet(left: ParticipantRow[], right: ParticipantRow[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightIds = new Set(right.map((participant) => participant.participant_id));
  return left.every((participant) => rightIds.has(participant.participant_id));
}

function getAnalyticalStrength(
  respondentCount: number,
): Segment["analyticalStrength"] {
  if (respondentCount < 5) {
    return "insufficient";
  }

  if (respondentCount < 10) {
    return "directional";
  }

  if (respondentCount < 20) {
    return "moderate";
  }

  return "strong";
}

function getCompositionStatus(
  respondentGroups: Record<ExplorerPerspective, number>,
): Segment["compositionStatus"] {
  const respondentCount = PERSPECTIVES.reduce(
    (total, perspective) => total + respondentGroups[perspective],
    0,
  );
  const nonZeroGroups = PERSPECTIVES.filter(
    (perspective) => respondentGroups[perspective] > 0,
  );

  if (nonZeroGroups.length <= 1) {
    return "single_group";
  }

  const largestGroup = Math.max(
    respondentGroups.hr,
    respondentGroups.manager,
    respondentGroups.leadership,
  );

  return respondentCount > 0 && largestGroup / respondentCount >= 0.75
    ? "group_dominated"
    : "mixed";
}

function withClientReporting(
  evidence: { mean: number | null; n: number },
  reportingMinN: number,
): SegmentDimension["groups"][ExplorerPerspective] {
  return {
    ...evidence,
    clientReporting:
      evidence.n >= reportingMinN
        ? {
            status: "reportable",
            reason: "meets_threshold",
          }
        : {
            status: "suppressed",
            reason: "below_threshold",
          },
  };
}

function buildGroupEvidence(
  rows: DimensionScoreRow[],
  questionnaireType: ExplorerPerspective,
): { mean: number | null; n: number } {
  const groupRows = rows.filter(
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
        .filter((participantId): participantId is string => participantId !== null),
    ).size,
  };
}

function buildCohortDimensions({
  participantIds,
  dimensionScores,
  reportingMinN,
}: {
  participantIds: Set<string>;
  dimensionScores: DimensionScoreRow[];
  reportingMinN: number;
}): SegmentDimension[] {
  return dimensionDefinitions.map((dimension) => {
    const matchingRows = dimensionScores.filter(
      (row) =>
        row.dimension_key === dimension.key &&
        row.participant_id !== null &&
        participantIds.has(row.participant_id) &&
        isScoredQuestionnaireType(row.questionnaire_type),
    );

    const hr = withClientReporting(
      buildGroupEvidence(matchingRows, "hr"),
      reportingMinN,
    );
    const manager = withClientReporting(
      buildGroupEvidence(matchingRows, "manager"),
      reportingMinN,
    );
    const leadership = withClientReporting(
      buildGroupEvidence(matchingRows, "leadership"),
      reportingMinN,
    );

    const respondentScores = matchingRows
      .map((row) => Number(row.average_score))
      .filter((score) => Number.isFinite(score));
    const respondentCount = new Set(
      matchingRows
        .map((row) => row.participant_id)
        .filter((participantId): participantId is string => participantId !== null),
    ).size;

    const groups = { hr, manager, leadership };
    const contributingGroups = PERSPECTIVES.filter(
      (perspective) => groups[perspective].n > 0,
    );
    const allContributingGroupsReportable =
      contributingGroups.length > 0 &&
      contributingGroups.every(
        (perspective) => groups[perspective].n >= reportingMinN,
      );

    return {
      dimensionKey: dimension.key,
      respondentCount,
      averageScore:
        respondentScores.length > 0
          ? respondentScores.reduce((sum, score) => sum + score, 0) /
            respondentScores.length
          : null,
      clientReporting: {
        status: allContributingGroupsReportable ? "reportable" : "suppressed",
        reason: allContributingGroupsReportable
          ? "all_contributing_groups_reportable"
          : "suppressed_group_contributes",
      },
      groups,
      groupComparisons: [],
    };
  });
}

function buildCohortQualitative({
  participantIds,
  comments,
}: {
  participantIds: Set<string>;
  comments: CommentRow[];
}): ExplorerCohort["qualitative"] {
  const matchingComments = comments.filter(
    (row) =>
      participantIds.has(row.participant_id) &&
      isScoredQuestionnaireType(row.questionnaire_type) &&
      typeof row.comment_text === "string" &&
      row.comment_text.trim().length > 0,
  );

  const respondentGroupsWithComments = PERSPECTIVES.filter((perspective) =>
    matchingComments.some((row) => row.questionnaire_type === perspective),
  );

  return {
    totalCommentCount: matchingComments.length,
    respondentGroupsWithComments,
    dimensions: dimensionDefinitions.map((dimension) => {
      const dimensionComments = matchingComments.filter(
        (row) => row.dimension_key === dimension.key,
      );

      return {
        dimensionKey: dimension.key,
        commentCount: dimensionComments.length,
        respondentGroupsWithComments: PERSPECTIVES.filter((perspective) =>
          dimensionComments.some(
            (row) => row.questionnaire_type === perspective,
          ),
        ),
        comments: dimensionComments.map((row) => ({
          questionnaireType: row.questionnaire_type as ExplorerPerspective,
          commentText: row.comment_text!.trim(),
        })),
      };
    }),
  };
}

export async function buildExplorerCohort({
  projectId,
  requestedFilters,
  availableKeys,
  reportingMinN,
}: {
  projectId: string;
  requestedFilters: Record<string, string[]>;
  availableKeys: AvailableKey[];
  reportingMinN: number;
}): Promise<ExplorerCohort> {
  const supabase = createSupabaseAdminClient();
  const pageSize = 1000;

  async function loadPagedRows<T>(
    loadPage: (
      from: number,
      to: number,
    ) => Promise<{ data: T[] | null; error: unknown }>,
  ): Promise<T[]> {
    const rows: T[] = [];

    for (let from = 0; ; from += pageSize) {
      const { data, error } = await loadPage(from, from + pageSize - 1);

      if (error) {
        throw error;
      }

      const pageRows = data ?? [];
      rows.push(...pageRows);

      if (pageRows.length < pageSize) {
        return rows;
      }
    }
  }

  const [participants, dimensionScores, comments] = await Promise.all([
    loadPagedRows<ParticipantRow>(async (from, to) => {
      const { data, error } = await supabase
        .from("client_participants")
        .select(
          "participant_id, questionnaire_type, participant_status, segmentation_values",
        )
        .eq("project_id", projectId)
        .order("participant_id", { ascending: true })
        .range(from, to)
        .returns<ParticipantRow[]>();

      return { data, error };
    }),
    loadPagedRows<DimensionScoreRow>(async (from, to) => {
      const { data, error } = await supabase
        .from("client_dimension_scores")
        .select(
          "participant_id, questionnaire_type, dimension_key, average_score",
        )
        .eq("project_id", projectId)
        .order("participant_id", { ascending: true })
        .order("dimension_key", { ascending: true })
        .range(from, to)
        .returns<DimensionScoreRow[]>();

      return { data, error };
    }),
    loadPagedRows<CommentRow>(async (from, to) => {
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
    }),
  ]);

  const scoredParticipants = participants.filter(
    (participant) =>
      participant.participant_status === "completed" &&
      isScoredQuestionnaireType(participant.questionnaire_type),
  );
  const selections = normalizeSelections({ requestedFilters, availableKeys });
  const filters = getEffectiveFilters({
    selections,
    availableKeys,
    scoredParticipants,
  });
  const matchingParticipants = scoredParticipants.filter((participant) =>
    participantMatchesFilters(participant, filters),
  );
  const participantIds = new Set(
    matchingParticipants.map((participant) => participant.participant_id),
  );

  const respondentGroups: Record<ExplorerPerspective, number> = {
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

  return {
    selections,
    filters,
    isOverallEquivalent: sameParticipantSet(
      scoredParticipants,
      matchingParticipants,
    ),
    respondentCount,
    respondentGroups,
    analyticalStrength: getAnalyticalStrength(respondentCount),
    compositionStatus: getCompositionStatus(respondentGroups),
    confidentialityStatus:
      respondentCount >= reportingMinN ? "reportable" : "suppressed",
    dimensions: buildCohortDimensions({
      participantIds,
      dimensionScores,
      reportingMinN,
    }),
    qualitative: buildCohortQualitative({
      participantIds,
      comments,
    }),
  };
}

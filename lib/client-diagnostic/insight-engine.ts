import { type QuestionnaireType } from "./question-bank";

export type QuestionnaireTypeScores = Partial<Record<QuestionnaireType, number>>;

export type DimensionInsightInput = {
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

export type DimensionStatus = "strong" | "moderate" | "weak";
export type AlignmentStatus = "aligned" | "emerging_gap" | "significant_gap";
export type CompletenessStatus = "sufficient" | "partial" | "insufficient";

export type DimensionInsight = {
  dimensionKey: string;
  dimensionLabel: string;
  dimensionDescription: string;
  averageScore: number | null;
  status: DimensionStatus | null;
  alignment: AlignmentStatus | null;
  completeness: CompletenessStatus;
  completedQuestionnaireTypes: QuestionnaireType[];
  missingQuestionnaireTypes: QuestionnaireType[];
  gap: number | null;
  maxScore: number | null;
  minScore: number | null;
  scores: QuestionnaireTypeScores;
};

const SCORED_QUESTIONNAIRE_TYPES: QuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
];

const HR_OPERATIONAL_WEIGHT = 0.55;
const MANAGER_OPERATIONAL_WEIGHT = 0.45;

function roundToTwoDecimals(value: number): number {
  return Number(value.toFixed(2));
}

/**
 * Operational maturity is an HR + Manager measure.
 * Leadership is retained as a separate strategic sponsor lens and must never be
 * blended into the operational maturity score.
 *
 * At this layer the inputs are already aggregated group scores. When both HR and
 * Manager scores exist we apply the agreed 55/45 weighting. If only one
 * operational group is available, that group's score is returned and the
 * completeness flag communicates that the evidence base is incomplete.
 *
 * The upstream summary layer is responsible for deciding whether a group score
 * is sufficiently evidenced for inclusion. That keeps minimum-N policy separate
 * from the scoring formula itself.
 */
function getOperationalAverageScore(
  scores: QuestionnaireTypeScores,
): number | null {
  const hr = typeof scores.hr === "number" ? scores.hr : null;
  const manager = typeof scores.manager === "number" ? scores.manager : null;

  if (hr !== null && manager !== null) {
    return roundToTwoDecimals(
      hr * HR_OPERATIONAL_WEIGHT + manager * MANAGER_OPERATIONAL_WEIGHT,
    );
  }

  if (hr !== null) {
    return roundToTwoDecimals(hr);
  }

  if (manager !== null) {
    return roundToTwoDecimals(manager);
  }

  return null;
}

/**
 * Alignment is specifically the absolute HR-vs-Manager perception gap.
 * Leadership is not part of operational alignment.
 */
function getOperationalGap(scores: QuestionnaireTypeScores): number | null {
  const hr = typeof scores.hr === "number" ? scores.hr : null;
  const manager = typeof scores.manager === "number" ? scores.manager : null;

  if (hr === null || manager === null) {
    return null;
  }

  return roundToTwoDecimals(Math.abs(hr - manager));
}

function getOperationalRange(scores: QuestionnaireTypeScores): {
  maxScore: number | null;
  minScore: number | null;
} {
  const operationalScores = [scores.hr, scores.manager].filter(
    (value): value is number => typeof value === "number",
  );

  if (operationalScores.length === 0) {
    return { maxScore: null, minScore: null };
  }

  return {
    maxScore: roundToTwoDecimals(Math.max(...operationalScores)),
    minScore: roundToTwoDecimals(Math.min(...operationalScores)),
  };
}

function getStatus(averageScore: number | null): DimensionStatus | null {
  if (averageScore === null) {
    return null;
  }

  if (averageScore >= 4.0) {
    return "strong";
  }

  if (averageScore >= 3.0) {
    return "moderate";
  }

  return "weak";
}

function getAlignment(gap: number | null): AlignmentStatus | null {
  if (gap === null) {
    return null;
  }

  if (gap <= 0.5) {
    return "aligned";
  }

  if (gap <= 1.0) {
    return "emerging_gap";
  }

  return "significant_gap";
}

function getCompleteness(
  completedQuestionnaireTypes: QuestionnaireType[],
): CompletenessStatus {
  const completedScoredTypes = SCORED_QUESTIONNAIRE_TYPES.filter(
    (questionnaireType) => completedQuestionnaireTypes.includes(questionnaireType),
  );

  const completedCount = completedScoredTypes.length;
  const totalCount = SCORED_QUESTIONNAIRE_TYPES.length;

  if (completedCount === 0) {
    return "insufficient";
  }

  if (completedCount === totalCount) {
    return "sufficient";
  }

  if (completedCount >= 2) {
    return "partial";
  }

  return "insufficient";
}

export function buildDimensionInsight(
  dimension: DimensionInsightInput,
): DimensionInsight {
  const averageScore = getOperationalAverageScore(dimension.scores);
  const gap = getOperationalGap(dimension.scores);
  const { maxScore, minScore } = getOperationalRange(dimension.scores);

  return {
    dimensionKey: dimension.dimensionKey,
    dimensionLabel: dimension.dimensionLabel,
    dimensionDescription: dimension.dimensionDescription,
    averageScore,
    status: getStatus(averageScore),
    alignment: getAlignment(gap),
    completeness: getCompleteness(dimension.completedQuestionnaireTypes),
    completedQuestionnaireTypes: dimension.completedQuestionnaireTypes,
    missingQuestionnaireTypes: dimension.missingQuestionnaireTypes,
    gap,
    maxScore,
    minScore,
    scores: dimension.scores,
  };
}

export function buildDimensionInsights(
  dimensions: DimensionInsightInput[],
): DimensionInsight[] {
  return dimensions.map(buildDimensionInsight);
}

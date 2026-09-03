import { type QuestionnaireType } from "./question-bank";

export type QuestionnaireTypeScores = Partial<Record<QuestionnaireType, number>>;
export type QuestionnaireTypeRespondentCounts = Partial<
  Record<QuestionnaireType, number>
>;

export type DimensionInsightInput = {
  dimensionKey: string;
  dimensionLabel: string;
  dimensionDescription: string;
  scores: QuestionnaireTypeScores;
  respondentCounts?: QuestionnaireTypeRespondentCounts;
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
 * Canonical overall diagnostic maturity is the respondent-weighted mean across
 * all scored respondent perspectives: HR, Manager and Leadership.
 *
 * Each respondent therefore contributes equally to the aggregate irrespective
 * of stakeholder group. Group means remain separate interpretive evidence and
 * Leadership retains its distinct strategic/sponsor interpretation.
 *
 * The optional respondentCounts property is transitional while the two summary
 * builders are migrated. Once supplied, it is the canonical calculation path.
 * Existing callers without counts retain the previous HR/Manager calculation so
 * this methodology migration can be wired safely without an intermediate break.
 */
function getOverallAverageScore(
  scores: QuestionnaireTypeScores,
  respondentCounts?: QuestionnaireTypeRespondentCounts,
): number | null {
  if (respondentCounts) {
    let weightedScoreTotal = 0;
    let respondentTotal = 0;

    for (const questionnaireType of SCORED_QUESTIONNAIRE_TYPES) {
      const score = scores[questionnaireType];
      const respondentCount = respondentCounts[questionnaireType] ?? 0;

      if (
        typeof score !== "number" ||
        !Number.isFinite(score) ||
        !Number.isFinite(respondentCount) ||
        respondentCount <= 0
      ) {
        continue;
      }

      weightedScoreTotal += score * respondentCount;
      respondentTotal += respondentCount;
    }

    return respondentTotal > 0
      ? roundToTwoDecimals(weightedScoreTotal / respondentTotal)
      : null;
  }

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
 * Operational alignment remains specifically the absolute HR-vs-Manager
 * perception gap. Leadership is visible separately rather than being used to
 * redefine the operational alignment signal.
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
  const averageScore = getOverallAverageScore(
    dimension.scores,
    dimension.respondentCounts,
  );
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

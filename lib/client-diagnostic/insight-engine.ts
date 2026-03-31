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

function roundToTwoDecimals(value: number): number {
  return Number(value.toFixed(2));
}

function getAverageScore(scores: QuestionnaireTypeScores): number | null {
  const numericScores = Object.values(scores).filter(
    (value): value is number => typeof value === "number",
  );

  if (numericScores.length === 0) {
    return null;
  }

  const total = numericScores.reduce((sum, value) => sum + value, 0);

  return roundToTwoDecimals(total / numericScores.length);
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

  if (gap >= 1.5) {
    return "significant_gap";
  }

  if (gap >= 0.75) {
    return "emerging_gap";
  }

  return "aligned";
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
  const averageScore = getAverageScore(dimension.scores);

  return {
    dimensionKey: dimension.dimensionKey,
    dimensionLabel: dimension.dimensionLabel,
    dimensionDescription: dimension.dimensionDescription,
    averageScore,
    status: getStatus(averageScore),
    alignment: getAlignment(dimension.gap),
    completeness: getCompleteness(dimension.completedQuestionnaireTypes),
    completedQuestionnaireTypes: dimension.completedQuestionnaireTypes,
    missingQuestionnaireTypes: dimension.missingQuestionnaireTypes,
    gap: dimension.gap,
    maxScore: dimension.maxScore,
    minScore: dimension.minScore,
    scores: dimension.scores,
  };
}

export function buildDimensionInsights(
  dimensions: DimensionInsightInput[],
): DimensionInsight[] {
  return dimensions.map(buildDimensionInsight);
}
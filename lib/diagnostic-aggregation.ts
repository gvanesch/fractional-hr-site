export type QuestionnaireGroup = "hr" | "manager" | "leadership";

export type ScoredResponse = {
  participantId?: string;
  questionnaireType: QuestionnaireGroup;
  answers: Record<string | number, number | undefined>;
};

export type GroupStats = {
  average: number | null;
  min: number | null;
  max: number | null;
  range: number | null;
  count: number;
};

export type DimensionAggregation = {
  label: string;
  overallAverage: number | null;
  hr: GroupStats;
  manager: GroupStats;
  leadership: GroupStats;
  betweenGroupVariance: number;
  priorityScore: number;
  issueType:
    | "structural"
    | "behavioural"
    | "fragile"
    | "optimisation"
    | "insufficient-data";
};

export type PriorityArea = {
  label: string;
  priorityScore: number;
  issueType:
    | "structural"
    | "behavioural"
    | "fragile"
    | "optimisation"
    | "insufficient-data";
  betweenGroupVariance: number;
  overallAverage: number | null;
};

export type DiagnosticAggregation = {
  overallScore: number | null;
  alignmentScore: number | null;
  confidenceLevel: "low" | "medium" | "high";
  totalResponses: number;
  groupCounts: Record<QuestionnaireGroup, number>;
  dimensions: DimensionAggregation[];
  priorityAreas: PriorityArea[];
};

export const DIAGNOSTIC_DIMENSIONS = [
  "Process clarity",
  "Consistency",
  "Service access",
  "Ownership",
  "Onboarding",
  "Technology alignment",
  "Knowledge and self-service",
  "Operational capacity",
  "Data and handoffs",
  "Change resilience",
] as const;

export type DiagnosticDimensionLabel =
  (typeof DIAGNOSTIC_DIMENSIONS)[number];

type QuestionDefinition = {
  id: number;
  dimension: DiagnosticDimensionLabel;
};

export const DIAGNOSTIC_QUESTIONS: QuestionDefinition[] = [
  { id: 1, dimension: "Process clarity" },
  { id: 2, dimension: "Consistency" },
  { id: 3, dimension: "Service access" },
  { id: 4, dimension: "Ownership" },
  { id: 5, dimension: "Onboarding" },
  { id: 6, dimension: "Technology alignment" },
  { id: 7, dimension: "Knowledge and self-service" },
  { id: 8, dimension: "Operational capacity" },
  { id: 9, dimension: "Data and handoffs" },
  { id: 10, dimension: "Change resilience" },
];

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function average(values: number[]): number | null {
  if (!values.length) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return roundToTwo(total / values.length);
}

function minValue(values: number[]): number | null {
  if (!values.length) {
    return null;
  }

  return Math.min(...values);
}

function maxValue(values: number[]): number | null {
  if (!values.length) {
    return null;
  }

  return Math.max(...values);
}

function rangeValue(values: number[]): number | null {
  if (!values.length) {
    return null;
  }

  return roundToTwo(Math.max(...values) - Math.min(...values));
}

function toGroupStats(values: number[]): GroupStats {
  return {
    average: average(values),
    min: minValue(values),
    max: maxValue(values),
    range: rangeValue(values),
    count: values.length,
  };
}

function isValidAnswer(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 1 &&
    value <= 5
  );
}

function getAnswerForQuestion(
  answers: Record<string | number, number | undefined>,
  questionId: number,
): number | null {
  const direct = answers[questionId];
  if (isValidAnswer(direct)) {
    return direct;
  }

  const stringKey = answers[String(questionId)];
  if (isValidAnswer(stringKey)) {
    return stringKey;
  }

  return null;
}

function calculateBetweenGroupVariance(groupAverages: Array<number | null>): number {
  const valid = groupAverages.filter(
    (value): value is number => typeof value === "number",
  );

  if (valid.length < 2) {
    return 0;
  }

  return roundToTwo(Math.max(...valid) - Math.min(...valid));
}

function calculatePriorityScore(params: {
  overallAverage: number | null;
  betweenGroupVariance: number;
}): number {
  const { overallAverage, betweenGroupVariance } = params;

  if (overallAverage === null) {
    return 0;
  }

  const severity = 5 - overallAverage;
  const score = severity * 0.7 + betweenGroupVariance * 0.3;

  return roundToTwo(score);
}

function classifyIssueType(params: {
  overallAverage: number | null;
  betweenGroupVariance: number;
}):
  | "structural"
  | "behavioural"
  | "fragile"
  | "optimisation"
  | "insufficient-data" {
  const { overallAverage, betweenGroupVariance } = params;

  if (overallAverage === null) {
    return "insufficient-data";
  }

  if (overallAverage < 3.2 && betweenGroupVariance < 1.0) {
    return "structural";
  }

  if (overallAverage < 3.2 && betweenGroupVariance >= 1.0) {
    return "behavioural";
  }

  if (overallAverage >= 3.2 && betweenGroupVariance >= 1.0) {
    return "fragile";
  }

  return "optimisation";
}

function calculateOverallScore(dimensions: DimensionAggregation[]): number | null {
  const values = dimensions
    .map((dimension) => dimension.overallAverage)
    .filter((value): value is number => typeof value === "number");

  if (!values.length) {
    return null;
  }

  const averageScore = average(values);

  if (averageScore === null) {
    return null;
  }

  return roundToTwo(((averageScore - 1) / 4) * 100);
}

function calculateAlignmentScore(dimensions: DimensionAggregation[]): number | null {
  const variances = dimensions
    .map((dimension) => dimension.betweenGroupVariance)
    .filter((value) => Number.isFinite(value));

  if (!variances.length) {
    return null;
  }

  const avgVariance = average(variances);

  if (avgVariance === null) {
    return null;
  }

  const alignment = Math.max(0, 100 - (avgVariance / 4) * 100);

  return roundToTwo(alignment);
}

function calculateConfidenceLevel(params: {
  totalResponses: number;
  alignmentScore: number | null;
}): "low" | "medium" | "high" {
  const { totalResponses, alignmentScore } = params;

  if (totalResponses < 6) {
    return "low";
  }

  if (totalResponses < 12) {
    return "medium";
  }

  if (alignmentScore !== null && alignmentScore < 55) {
    return "medium";
  }

  return "high";
}

export function aggregateDiagnosticResponses(
  responses: ScoredResponse[],
): DiagnosticAggregation {
  const scoredResponses = responses.filter((response) =>
    response.questionnaireType === "hr" ||
    response.questionnaireType === "manager" ||
    response.questionnaireType === "leadership",
  );

  const groupCounts: Record<QuestionnaireGroup, number> = {
    hr: scoredResponses.filter((response) => response.questionnaireType === "hr")
      .length,
    manager: scoredResponses.filter(
      (response) => response.questionnaireType === "manager",
    ).length,
    leadership: scoredResponses.filter(
      (response) => response.questionnaireType === "leadership",
    ).length,
  };

  const dimensions: DimensionAggregation[] = DIAGNOSTIC_QUESTIONS.map(
    (question) => {
      const hrValues = scoredResponses
        .filter((response) => response.questionnaireType === "hr")
        .map((response) => getAnswerForQuestion(response.answers, question.id))
        .filter((value): value is number => value !== null);

      const managerValues = scoredResponses
        .filter((response) => response.questionnaireType === "manager")
        .map((response) => getAnswerForQuestion(response.answers, question.id))
        .filter((value): value is number => value !== null);

      const leadershipValues = scoredResponses
        .filter((response) => response.questionnaireType === "leadership")
        .map((response) => getAnswerForQuestion(response.answers, question.id))
        .filter((value): value is number => value !== null);

      const hr = toGroupStats(hrValues);
      const manager = toGroupStats(managerValues);
      const leadership = toGroupStats(leadershipValues);

      const overallAverage = average([
        ...hrValues,
        ...managerValues,
        ...leadershipValues,
      ]);

      const betweenGroupVariance = calculateBetweenGroupVariance([
        hr.average,
        manager.average,
        leadership.average,
      ]);

      const priorityScore = calculatePriorityScore({
        overallAverage,
        betweenGroupVariance,
      });

      const issueType = classifyIssueType({
        overallAverage,
        betweenGroupVariance,
      });

      return {
        label: question.dimension,
        overallAverage,
        hr,
        manager,
        leadership,
        betweenGroupVariance,
        priorityScore,
        issueType,
      };
    },
  );

  const priorityAreas: PriorityArea[] = [...dimensions]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 3)
    .map((dimension) => ({
      label: dimension.label,
      priorityScore: dimension.priorityScore,
      issueType: dimension.issueType,
      betweenGroupVariance: dimension.betweenGroupVariance,
      overallAverage: dimension.overallAverage,
    }));

  const overallScore = calculateOverallScore(dimensions);
  const alignmentScore = calculateAlignmentScore(dimensions);

  return {
    overallScore,
    alignmentScore,
    confidenceLevel: calculateConfidenceLevel({
      totalResponses: scoredResponses.length,
      alignmentScore,
    }),
    totalResponses: scoredResponses.length,
    groupCounts,
    dimensions,
    priorityAreas,
  };
}
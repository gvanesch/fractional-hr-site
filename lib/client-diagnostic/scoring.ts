export function roundToTwo(value: number): number {
  return Number(value.toFixed(2));
}

export function average(values: number[]): number | null {
  if (!values.length) return null;
  return roundToTwo(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function classifyIssueType(params: {
  overallAverage: number | null;
  gap: number | null;
}): "structural" | "behavioural" | "fragile" | "optimisation" | "insufficient-data" {
  const { overallAverage, gap } = params;

  if (overallAverage === null) return "insufficient-data";

  if (overallAverage < 3.2 && (gap ?? 0) < 1.0) return "structural";
  if (overallAverage < 3.2 && (gap ?? 0) >= 1.0) return "behavioural";
  if (overallAverage >= 3.2 && (gap ?? 0) >= 1.0) return "fragile";

  return "optimisation";
}

export function calculatePriorityScore(params: {
  overallAverage: number | null;
  gap: number | null;
}): number {
  const { overallAverage, gap } = params;

  if (overallAverage === null) return 0;

  const severity = 5 - overallAverage;
  const varianceWeight = gap ?? 0;

  return roundToTwo(severity * 0.7 + varianceWeight * 0.3);
}

export function calculateOverallScore(values: number[]): number | null {
  const avg = average(values);
  if (avg === null) return null;

  return roundToTwo(((avg - 1) / 4) * 100);
}

export function calculateAlignmentScore(gaps: number[]): number | null {
  const avgGap = average(gaps);
  if (avgGap === null) return null;

  return roundToTwo(Math.max(0, 100 - (avgGap / 4) * 100));
}

export function calculateConfidenceLevel(params: {
  completionPercentage: number;
  completedRespondentGroups: number;
  averageGap: number | null;
}): "low" | "medium" | "high" {
  const { completionPercentage, completedRespondentGroups, averageGap } = params;

  if (completionPercentage < 50 || completedRespondentGroups < 2) return "low";
  if (completionPercentage < 75 || completedRespondentGroups < 3) return "medium";
  if (averageGap !== null && averageGap > 1.25) return "medium";

  return "high";
}
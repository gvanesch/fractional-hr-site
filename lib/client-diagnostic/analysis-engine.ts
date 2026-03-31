import type { DimensionInsight } from "./insight-engine";
import {
  detectDimensionPatterns,
  type DiagnosticPattern,
  type GapPattern,
  type QuestionScoreMap,
} from "./pattern-engine";

export type DimensionAnalysis = {
  dimensionKey: string;
  dimensionLabel: string;
  dimensionDescription: string;
  averageScore: number | null;
  scores: {
    hr: number | null;
    manager: number | null;
    leadership: number | null;
  };
  gap: number | null;
  alignment: DimensionInsight["alignment"];
  strength: DimensionInsight["status"];
  completeness: DimensionInsight["completeness"];
  confidence: "high" | "medium" | "low";
  gapPattern: GapPattern;
  primaryPattern: DiagnosticPattern | null;
  secondaryPattern: DiagnosticPattern | null;
  flags: string[];
};

function getNarrativeConfidence(
  completeness: DimensionInsight["completeness"],
): "high" | "medium" | "low" {
  switch (completeness) {
    case "sufficient":
      return "high";
    case "partial":
      return "medium";
    case "insufficient":
      return "low";
    default:
      return "low";
  }
}

function getScore(
  insight: DimensionInsight,
  key: "hr" | "manager" | "leadership",
): number | null {
  const value = insight.scores[key];
  return typeof value === "number" ? value : null;
}

export function buildDimensionAnalysis(params: {
  insight: DimensionInsight;
  questionScores?: QuestionScoreMap;
}): DimensionAnalysis {
  const { insight, questionScores } = params;
  const patternResult = detectDimensionPatterns({
    insight,
    questionScores,
  });

  return {
    dimensionKey: insight.dimensionKey,
    dimensionLabel: insight.dimensionLabel,
    dimensionDescription: insight.dimensionDescription,
    averageScore:
      typeof insight.averageScore === "number" ? insight.averageScore : null,
    scores: {
      hr: getScore(insight, "hr"),
      manager: getScore(insight, "manager"),
      leadership: getScore(insight, "leadership"),
    },
    gap: typeof insight.gap === "number" ? insight.gap : null,
    alignment: insight.alignment,
    strength: insight.status,
    completeness: insight.completeness,
    confidence: getNarrativeConfidence(insight.completeness),
    gapPattern: patternResult.gapPattern,
    primaryPattern: patternResult.primary,
    secondaryPattern: patternResult.secondary,
    flags: patternResult.flags,
  };
}

export function buildDimensionAnalyses(params: {
  insights: DimensionInsight[];
  questionScoresByDimension?: Record<string, QuestionScoreMap>;
}): DimensionAnalysis[] {
  const { insights, questionScoresByDimension = {} } = params;

  return insights.map((insight) =>
    buildDimensionAnalysis({
      insight,
      questionScores: questionScoresByDimension[insight.dimensionKey],
    }),
  );
}
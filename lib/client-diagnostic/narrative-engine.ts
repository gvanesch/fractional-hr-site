import type { DimensionInsight } from "./insight-engine";

export type DimensionNarrative = {
  dimensionKey: string;
  dimensionLabel: string;
  observation: string;
  implication: string;
  recommendedNextStep: string;
  confidence: "high" | "medium" | "low";
};

function getConfidence(insight: DimensionInsight): "high" | "medium" | "low" {
  if (insight.completeness === "sufficient") {
    return "high";
  }

  if (insight.completeness === "partial") {
    return "medium";
  }

  return "low";
}

function buildObservation(insight: DimensionInsight): string {
  if (insight.completeness === "insufficient") {
    return `${insight.dimensionLabel} does not yet have enough completed respondent coverage to support a reliable interpretation.`;
  }

  if (insight.status === "strong" && insight.alignment === "aligned") {
    return `${insight.dimensionLabel} is currently scoring strongly with relatively consistent perceptions across respondent groups.`;
  }

  if (insight.status === "strong" && insight.alignment === "emerging_gap") {
    return `${insight.dimensionLabel} is scoring strongly overall, but there are early differences in how respondent groups are experiencing it.`;
  }

  if (insight.status === "strong" && insight.alignment === "significant_gap") {
    return `${insight.dimensionLabel} appears strong overall, but there is material variation between respondent groups that should be examined before drawing a firm conclusion.`;
  }

  if (insight.status === "moderate" && insight.alignment === "aligned") {
    return `${insight.dimensionLabel} appears broadly stable, but current scores suggest room for improvement rather than a clear area of strength.`;
  }

  if (insight.status === "moderate" && insight.alignment === "emerging_gap") {
    return `${insight.dimensionLabel} is moderate overall, with emerging differences between respondent groups that may point to uneven execution.`;
  }

  if (insight.status === "moderate" && insight.alignment === "significant_gap") {
    return `${insight.dimensionLabel} is moderate overall, but the spread between respondent groups suggests a more structural consistency issue may be developing.`;
  }

  if (insight.status === "weak" && insight.alignment === "aligned") {
    return `${insight.dimensionLabel} is scoring weakly and that view is relatively consistent across respondent groups.`;
  }

  if (insight.status === "weak" && insight.alignment === "emerging_gap") {
    return `${insight.dimensionLabel} is scoring weakly, with some early differences between groups in how the problem is experienced.`;
  }

  if (insight.status === "weak" && insight.alignment === "significant_gap") {
    return `${insight.dimensionLabel} is scoring weakly and shows a significant perception gap between respondent groups.`;
  }

  return `${insight.dimensionLabel} has mixed signals and should be reviewed in more detail.`;
}

function buildImplication(insight: DimensionInsight): string {
  if (insight.completeness === "insufficient") {
    return "Interpretation should remain provisional until more respondent groups have completed the diagnostic.";
  }

  if (insight.status === "strong" && insight.alignment === "aligned") {
    return "This is more likely to represent a real area of operational maturity than an isolated positive perception.";
  }

  if (
    insight.status === "strong" &&
    (insight.alignment === "emerging_gap" ||
      insight.alignment === "significant_gap")
  ) {
    return "The organisation may have strong design intent here, but experience is not fully consistent across roles or audiences.";
  }

  if (insight.status === "moderate" && insight.alignment === "aligned") {
    return "This is likely functioning adequately, but may not yet be robust enough to scale or absorb change well.";
  }

  if (
    insight.status === "moderate" &&
    (insight.alignment === "emerging_gap" ||
      insight.alignment === "significant_gap")
  ) {
    return "Differences in respondent perception may indicate inconsistent execution, handoffs, ownership, or manager enablement.";
  }

  if (insight.status === "weak" && insight.alignment === "aligned") {
    return "This is likely a genuine shared weakness rather than a narrow issue isolated to one group.";
  }

  if (
    insight.status === "weak" &&
    (insight.alignment === "emerging_gap" ||
      insight.alignment === "significant_gap")
  ) {
    return "There may be both an underlying weakness and a cross-role disconnect in how the issue is understood or experienced.";
  }

  return "This area needs further interpretation alongside the wider response pattern.";
}

function buildRecommendedNextStep(insight: DimensionInsight): string {
  if (insight.completeness === "insufficient") {
    return "Prioritise completion from the missing respondent groups before using this dimension as a basis for advice or client reporting.";
  }

  if (insight.status === "strong" && insight.alignment === "aligned") {
    return "Treat this as a potential strength to preserve, and validate what specific practices or controls are making it work well.";
  }

  if (
    insight.status === "strong" &&
    (insight.alignment === "emerging_gap" ||
      insight.alignment === "significant_gap")
  ) {
    return "Validate where experience differs by role, and check whether communication, access, or local execution is driving the variation.";
  }

  if (insight.status === "moderate" && insight.alignment === "aligned") {
    return "Review this dimension for incremental improvement opportunities before it becomes a drag on consistency or scale.";
  }

  if (
    insight.status === "moderate" &&
    (insight.alignment === "emerging_gap" ||
      insight.alignment === "significant_gap")
  ) {
    return "Test for inconsistency in process execution, manager understanding, service access, or regional/team variation.";
  }

  if (insight.status === "weak" && insight.alignment === "aligned") {
    return "Treat this as a priority improvement area and investigate root causes in process design, ownership, and enablement.";
  }

  if (
    insight.status === "weak" &&
    (insight.alignment === "emerging_gap" ||
      insight.alignment === "significant_gap")
  ) {
    return "Prioritise this for deeper diagnosis, focusing on both the underlying weakness and the differences between respondent perspectives.";
  }

  return "Review this dimension manually before issuing a formal recommendation.";
}

export function buildDimensionNarrative(
  insight: DimensionInsight,
): DimensionNarrative {
  return {
    dimensionKey: insight.dimensionKey,
    dimensionLabel: insight.dimensionLabel,
    observation: buildObservation(insight),
    implication: buildImplication(insight),
    recommendedNextStep: buildRecommendedNextStep(insight),
    confidence: getConfidence(insight),
  };
}

export function buildDimensionNarratives(
  insights: DimensionInsight[],
): DimensionNarrative[] {
  return insights.map(buildDimensionNarrative);
}
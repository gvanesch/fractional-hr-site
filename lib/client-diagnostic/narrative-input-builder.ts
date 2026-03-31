import type { DimensionInsight } from "./insight-engine";

export type GapPattern =
  | "none"
  | "hr_lower_than_leadership"
  | "manager_lower_than_others"
  | "leadership_lower_than_others"
  | "general_spread";

export type ManagerGapSubtype =
  | "pure_execution"
  | "mixed_signal"
  | "fragile_model";

export type NarrativeStrength = "strong" | "moderate" | "weak";

export type NarrativeAlignment =
  | "aligned"
  | "emerging_gap"
  | "significant_gap";

export type NarrativePatternType =
  | "uniform_weakness"
  | "combined_weakness_and_gap"
  | "manager_execution_gap"
  | "hr_visibility_gap"
  | "leadership_caution_gap"
  | "general_spread_gap"
  | "serviceable_base"
  | "strong_aligned"
  | "strong_with_tension";

export type InterventionPosture =
  | "protect"
  | "stabilise"
  | "clarify"
  | "normalise"
  | "strengthen"
  | "surface_gap"
  | "reset";

export type DimensionNarrativeInput = {
  dimensionKey: string;
  dimensionLabel: string;
  dimensionDescription: string;
  averageScore: number | null;
  gap: number | null;
  gapText: string | null;
  scores: {
    hr: number | null;
    manager: number | null;
    leadership: number | null;
  };
  classification: {
    strength: NarrativeStrength | null;
    alignment: NarrativeAlignment | null;
    patternType: NarrativePatternType;
    gapPattern: GapPattern;
    managerGapSubtype: ManagerGapSubtype | null;
  };
  evidence: {
    completeness: DimensionInsight["completeness"];
    confidence: "high" | "medium" | "low";
    evidenceText: string;
  };
  story: {
    coreFinding: string;
    breakdownPoint: string | null;
    practicalConsequenceHint: string | null;
    interventionPosture: InterventionPosture;
  };
};

function getConfidence(
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

function getEvidenceText(insight: DimensionInsight): string {
  if (insight.completeness === "partial") {
    return " The pattern is directionally useful, although a fuller response set would sharpen it further.";
  }

  if (insight.completeness === "insufficient") {
    return " The evidence is still light, so this should be treated as an emerging read rather than a settled conclusion.";
  }

  return "";
}

function getRoundedScore(value: number | null): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Number(Math.max(0, Math.min(5, value)).toFixed(1));
}

function getGapValue(insight: DimensionInsight): number | null {
  return typeof insight.gap === "number" ? insight.gap : null;
}

function getGapText(insight: DimensionInsight): string | null {
  const gap = getGapValue(insight);
  return gap !== null ? gap.toFixed(2) : null;
}

function getScore(
  insight: DimensionInsight,
  key: "hr" | "manager" | "leadership",
): number | null {
  const value = insight.scores[key];
  return typeof value === "number" ? value : null;
}

function hasMeaningfulGap(insight: DimensionInsight): boolean {
  return (
    insight.alignment === "emerging_gap" ||
    insight.alignment === "significant_gap"
  );
}

function getGapPattern(insight: DimensionInsight): GapPattern {
  if (!hasMeaningfulGap(insight)) {
    return "none";
  }

  const hr = getScore(insight, "hr");
  const manager = getScore(insight, "manager");
  const leadership = getScore(insight, "leadership");

  if (
    hr !== null &&
    manager !== null &&
    leadership !== null &&
    hr < manager &&
    hr < leadership &&
    leadership - hr >= 0.4
  ) {
    return "hr_lower_than_leadership";
  }

  if (
    hr !== null &&
    manager !== null &&
    leadership !== null &&
    manager < hr &&
    manager < leadership &&
    hr - manager >= 0.3 &&
    leadership - manager >= 0.3
  ) {
    return "manager_lower_than_others";
  }

  if (
    hr !== null &&
    manager !== null &&
    leadership !== null &&
    leadership < hr &&
    leadership < manager &&
    hr - leadership >= 0.3
  ) {
    return "leadership_lower_than_others";
  }

  return "general_spread";
}

function getManagerGapSubtype(
  insight: DimensionInsight,
): ManagerGapSubtype | null {
  if (getGapPattern(insight) !== "manager_lower_than_others") {
    return null;
  }

  const hr = getScore(insight, "hr") ?? 0;
  const leadership = getScore(insight, "leadership") ?? 0;
  const manager = getScore(insight, "manager") ?? 0;

  if (hr >= 3.8 && leadership >= 3.8 && manager <= 3.0) {
    return "pure_execution";
  }

  if (hr >= 3.5 && leadership < 3.5 && manager < leadership) {
    return "mixed_signal";
  }

  return "fragile_model";
}

function getPatternType(insight: DimensionInsight): NarrativePatternType {
  const average = getRoundedScore(insight.averageScore) ?? 0;
  const gap = getGapValue(insight) ?? 0;
  const gapPattern = getGapPattern(insight);

  if (average < 3.0 && gap >= 1.2) {
    return "combined_weakness_and_gap";
  }

  if (average < 3.0 && gap < 0.4) {
    return "uniform_weakness";
  }

  if (gap >= 1.2 && gapPattern === "manager_lower_than_others") {
    return "manager_execution_gap";
  }

  if (gap >= 1.2 && gapPattern === "hr_lower_than_leadership") {
    return "hr_visibility_gap";
  }

  if (gap >= 1.2 && gapPattern === "leadership_lower_than_others") {
    return "leadership_caution_gap";
  }

  if (gap >= 1.2) {
    return "general_spread_gap";
  }

  if (average >= 4.0 && gap < 0.4) {
    return "strong_aligned";
  }

  if (average >= 4.0 && gap >= 0.4) {
    return "strong_with_tension";
  }

  return "serviceable_base";
}

function getInterventionPosture(
  patternType: NarrativePatternType,
  averageScore: number | null,
): InterventionPosture {
  switch (patternType) {
    case "uniform_weakness":
      return "stabilise";
    case "combined_weakness_and_gap":
      return "reset";
    case "manager_execution_gap":
    case "hr_visibility_gap":
    case "leadership_caution_gap":
    case "general_spread_gap":
      return "surface_gap";
    case "strong_aligned":
      return "protect";
    case "strong_with_tension":
      return "normalise";
    case "serviceable_base":
    default: {
      const average = getRoundedScore(averageScore) ?? 0;

      if (average < 3.2) {
        return "clarify";
      }

      return "strengthen";
    }
  }
}

function buildCoreFinding(
  insight: DimensionInsight,
  patternType: NarrativePatternType,
): string {
  switch (patternType) {
    case "uniform_weakness":
      return "The capability is weak in a broadly shared way rather than failing for only one group.";
    case "combined_weakness_and_gap":
      return "The capability is weak overall and is also being experienced differently across the organisation.";
    case "manager_execution_gap":
      return "The model appears more coherent in design and from a distance than it does at the point where managers have to apply it.";
    case "hr_visibility_gap":
      return "HR is experiencing more operational friction than leadership currently appears to see.";
    case "leadership_caution_gap":
      return "Leadership is reading the dimension more cautiously than the delivery-level experience alone would suggest.";
    case "general_spread_gap":
      return "The spread between respondent groups is the most important feature of this result.";
    case "strong_aligned":
      return "This dimension is operating as a genuine asset within the wider model.";
    case "strong_with_tension":
      return "The capability itself is strong, but the experience of it is not equally strong across all groups.";
    case "serviceable_base":
    default:
      return "The capability is present and usable, but not yet fully settled or friction-free.";
  }
}

function buildBreakdownPoint(
  insight: DimensionInsight,
  patternType: NarrativePatternType,
): string | null {
  switch (patternType) {
    case "manager_execution_gap":
      return `The breakdown is happening at the point where the model has to be applied rather than where it is designed.`;
    case "hr_visibility_gap":
      return `The gap sits between lived operational reality and senior-level visibility.`;
    case "combined_weakness_and_gap":
      return `The issue is both structural and unevenly experienced.`;
    case "uniform_weakness":
      return `The weakness is broadly shared rather than isolated.`;
    case "strong_with_tension":
      return `The remaining issue is consistency of experience rather than capability absence.`;
    case "strong_aligned":
      return `The capability appears embedded rather than individually dependent.`;
    case "serviceable_base":
      return `The model is functioning, but not yet strongly enough to stay invisible under pressure.`;
    default:
      return null;
  }
}

function buildPracticalConsequenceHint(
  dimensionKey: string,
): string | null {
  switch (dimensionKey) {
    case "process_clarity":
      return "interpretive load stays higher than it should and downstream workflows absorb more clarification effort";
    case "consistency":
      return "similar cases can still produce different outcomes, which weakens predictability and trust";
    case "service_access":
      return "informal routing and duplicated intake noise stay higher than they should";
    case "ownership":
      return "accountability goes implicit at handoffs and work slows while ownership is manually re-established";
    case "systems_enablement":
    case "technology_enablement":
      return "more effort is pushed back onto people through workaround, rekeying, and manual checking";
    case "knowledge_self_service":
    case "knowledge_access":
      return "repeat clarification demand flows back into HR instead of being absorbed through guidance";
    case "operational_capacity":
      return "capacity pressure compounds other weak dimensions instead of remaining a contained issue";
    case "case_management":
      return "visibility degrades once work is in flight and more follow-up effort is needed to keep issues moving";
    case "data_handoffs":
      return "downstream work becomes organised around checking, correction, and reconciliation";
    case "change_resilience":
      return "changes are more likely to require repeat reinforcement before they become stable practice";
    default:
      return null;
  }
}

export function buildDimensionNarrativeInput(
  insight: DimensionInsight,
): DimensionNarrativeInput {
  const averageScore = getRoundedScore(insight.averageScore);
  const gap = getGapValue(insight);
  const patternType = getPatternType(insight);

  return {
    dimensionKey: insight.dimensionKey,
    dimensionLabel: insight.dimensionLabel,
    dimensionDescription: insight.dimensionDescription,
    averageScore,
    gap,
    gapText: getGapText(insight),
    scores: {
      hr: getScore(insight, "hr"),
      manager: getScore(insight, "manager"),
      leadership: getScore(insight, "leadership"),
    },
    classification: {
      strength: insight.status,
      alignment: insight.alignment,
      patternType,
      gapPattern: getGapPattern(insight),
      managerGapSubtype: getManagerGapSubtype(insight),
    },
    evidence: {
      completeness: insight.completeness,
      confidence: getConfidence(insight.completeness),
      evidenceText: getEvidenceText(insight),
    },
    story: {
      coreFinding: buildCoreFinding(insight, patternType),
      breakdownPoint: buildBreakdownPoint(insight, patternType),
      practicalConsequenceHint: buildPracticalConsequenceHint(
        insight.dimensionKey,
      ),
      interventionPosture: getInterventionPosture(
        patternType,
        averageScore,
      ),
    },
  };
}

export function buildDimensionNarrativeInputs(
  insights: DimensionInsight[],
): DimensionNarrativeInput[] {
  return insights.map(buildDimensionNarrativeInput);
}
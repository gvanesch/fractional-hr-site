import type { DimensionInsight } from "./insight-engine";

export type DimensionNarrative = {
  dimensionKey: string;
  dimensionLabel: string;
  observation: string;
  implication: string;
  recommendedNextStep: string;
  confidence: "high" | "medium" | "low";
};

type NarrativeLens = {
  areaNoun: string;
  pluralAreaNoun: string;
  actorNoun: string;
  operatingFocus: string;
  likelyFailureMode: string;
  likelyConsequence: string;
  firstIntervention: string;
  secondIntervention: string;
  outcomeGoal: string;
};

type ScoreBucketBand =
  | "very_low"
  | "low"
  | "low_mid"
  | "mid"
  | "high_mid"
  | "high";

type ObservationTone =
  | "fragile"
  | "inconsistent"
  | "workable"
  | "developing"
  | "stable"
  | "strong";

type ImplicationTone =
  | "reactive_drag"
  | "execution_risk"
  | "scale_constraint"
  | "efficiency_drag"
  | "platform_strength"
  | "operating_advantage";

type NextStepMode =
  | "reset"
  | "stabilise"
  | "clarify"
  | "strengthen"
  | "normalise"
  | "optimise"
  | "protect";

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

function getRoundedScore(value: number | null): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Number(Math.max(0, Math.min(5, value)).toFixed(1));
}

function getScoreBucketBand(score: number | null): ScoreBucketBand {
  const roundedScore = getRoundedScore(score);

  if (roundedScore === null) {
    return "mid";
  }

  if (roundedScore < 2.0) {
    return "very_low";
  }

  if (roundedScore < 2.8) {
    return "low";
  }

  if (roundedScore < 3.2) {
    return "low_mid";
  }

  if (roundedScore < 3.8) {
    return "mid";
  }

  if (roundedScore < 4.3) {
    return "high_mid";
  }

  return "high";
}

function getObservationTone(insight: DimensionInsight): ObservationTone {
  if (insight.status === "weak" && insight.alignment !== "aligned") {
    return "fragile";
  }

  if (insight.status === "weak") {
    return "inconsistent";
  }

  if (insight.status === "moderate" && insight.alignment !== "aligned") {
    return "developing";
  }

  if (insight.status === "moderate") {
    return "workable";
  }

  if (insight.status === "strong" && insight.alignment !== "aligned") {
    return "stable";
  }

  return "strong";
}

function getImplicationTone(insight: DimensionInsight): ImplicationTone {
  if (insight.status === "weak" && insight.alignment !== "aligned") {
    return "execution_risk";
  }

  if (insight.status === "weak") {
    return "reactive_drag";
  }

  if (insight.status === "moderate" && insight.alignment !== "aligned") {
    return "scale_constraint";
  }

  if (insight.status === "moderate") {
    return "efficiency_drag";
  }

  if (insight.status === "strong" && insight.alignment !== "aligned") {
    return "platform_strength";
  }

  return "operating_advantage";
}

function getNextStepMode(insight: DimensionInsight): NextStepMode {
  if (insight.status === "weak" && insight.alignment === "significant_gap") {
    return "reset";
  }

  if (insight.status === "weak") {
    return "stabilise";
  }

  if (insight.status === "moderate" && insight.alignment !== "aligned") {
    return "normalise";
  }

  if (insight.status === "moderate") {
    return "strengthen";
  }

  if (insight.status === "strong" && insight.alignment !== "aligned") {
    return "optimise";
  }

  return "protect";
}

function hasMeaningfulGap(insight: DimensionInsight): boolean {
  return insight.alignment === "emerging_gap" || insight.alignment === "significant_gap";
}

function getLens(dimensionKey: string, dimensionLabel: string): NarrativeLens {
  switch (dimensionKey) {
    case "process_clarity":
      return {
        areaNoun: "process clarity",
        pluralAreaNoun: "core workflows",
        actorNoun: "managers and HR",
        operatingFocus: "how clearly core HR processes are understood and followed in practice",
        likelyFailureMode: "different teams relying on interpretation instead of one shared way of working",
        likelyConsequence: "avoidable variation in execution and more correction work downstream",
        firstIntervention: "map the workflows that create the most ambiguity today",
        secondIntervention: "tighten ownership, handoffs, and the expected process path",
        outcomeGoal: "one clearer operating route rather than multiple local versions",
      };

    case "consistency":
      return {
        areaNoun: "consistency",
        pluralAreaNoun: "service and decision pathways",
        actorNoun: "employees, managers, and HR",
        operatingFocus: "how reliably similar issues are handled in the same way",
        likelyFailureMode: "similar people matters being handled differently across teams or managers",
        likelyConsequence: "uneven employee experience and weaker confidence in the operating model",
        firstIntervention: "review the areas where similar cases are currently producing different outcomes",
        secondIntervention: "standardise the points where decisions, approvals, or service responses diverge",
        outcomeGoal: "a more repeatable and defensible operating standard",
      };

    case "service_access":
      return {
        areaNoun: "service access",
        pluralAreaNoun: "support entry points",
        actorNoun: "employees and managers",
        operatingFocus: "how easy it is to know where to go and how to get help",
        likelyFailureMode: "support being accessed through informal channels or unclear routes",
        likelyConsequence: "confusion, slower response, and unnecessary escalation",
        firstIntervention: "review how people currently enter HR support and where they hesitate or reroute",
        secondIntervention: "simplify the first route in, clarify ownership, and reduce channel duplication",
        outcomeGoal: "a more obvious and dependable path to support",
      };

    case "ownership":
      return {
        areaNoun: "ownership",
        pluralAreaNoun: "decision and delivery responsibilities",
        actorNoun: "HR, managers, leaders, and enabling teams",
        operatingFocus: "how clearly responsibilities are understood across the people operating model",
        likelyFailureMode: "work stalling or being re-routed because accountability is blurred",
        likelyConsequence: "slower execution, duplicated effort, and weak follow-through",
        firstIntervention: "identify where responsibility currently becomes ambiguous",
        secondIntervention: "make decision ownership, action ownership, and follow-through explicit",
        outcomeGoal: "cleaner accountability at the points where work most often stalls",
      };

    case "systems_enablement":
    case "technology_enablement":
      return {
        areaNoun: "systems enablement",
        pluralAreaNoun: "technology-supported workflows",
        actorNoun: "HR, managers, and employees",
        operatingFocus: "how well systems support the intended way of working",
        likelyFailureMode: "manual workaround and friction being absorbed around the toolset",
        likelyConsequence: "extra effort, weaker visibility, and lower process reliability",
        firstIntervention: "separate process design issues from platform or configuration issues",
        secondIntervention: "simplify the workflow before optimising the technology layer",
        outcomeGoal: "a cleaner workflow that technology can support more effectively",
      };

    case "knowledge_self_service":
    case "knowledge_access":
      return {
        areaNoun: "knowledge and self-service",
        pluralAreaNoun: "guidance and self-service pathways",
        actorNoun: "managers and employees",
        operatingFocus: "how easily people can find and use trusted guidance without HR intervention",
        likelyFailureMode: "guidance being fragmented, hard to find, or not trusted enough to use",
        likelyConsequence: "repeat queries, inconsistent interpretation, and avoidable dependency on HR",
        firstIntervention: "focus on the topics generating the highest repeat demand or confusion",
        secondIntervention: "rebuild the guidance structure around clearer ownership, navigation, and practical use",
        outcomeGoal: "a more dependable self-service model for common needs",
      };

    case "operational_capacity":
      return {
        areaNoun: "operational capacity",
        pluralAreaNoun: "delivery pressures and workload patterns",
        actorNoun: "the HR operating model",
        operatingFocus: "whether the model has enough bandwidth and resilience to deliver well",
        likelyFailureMode: "reactive work crowding out proactive improvement and consistent service",
        likelyConsequence: "slower delivery, weaker prioritisation, and more visible strain over time",
        firstIntervention: "test whether the issue is capacity, fragmentation of effort, or work sitting in the wrong place",
        secondIntervention: "reset priorities, role boundaries, or workflow design accordingly",
        outcomeGoal: "a more sustainable delivery model rather than short-term firefighting",
      };

    case "case_management":
      return {
        areaNoun: "case management",
        pluralAreaNoun: "issue handling and exception pathways",
        actorNoun: "HR teams and service owners",
        operatingFocus: "how effectively issues, requests, and exceptions are tracked, routed, and resolved",
        likelyFailureMode: "requests being tracked or resolved inconsistently across the model",
        likelyConsequence: "rework, weak visibility, and inconsistent resolution quality",
        firstIntervention: "review where requests and exceptions are currently handled differently",
        secondIntervention: "tighten routing, ownership, and resolution discipline",
        outcomeGoal: "a more controlled and visible case-handling approach",
      };

    case "data_handoffs":
      return {
        areaNoun: "data and handoffs",
        pluralAreaNoun: "handoff points and data movements",
        actorNoun: "people, processes, and systems",
        operatingFocus: "how reliably information moves without friction or error",
        likelyFailureMode: "work getting delayed, repeated, or corrected because the handoff is weak",
        likelyConsequence: "avoidable friction, lower trust in data, and more correction effort",
        firstIntervention: "trace the handoff points where work is most often delayed or corrected",
        secondIntervention: "clarify inputs, outputs, ownership, and expected control points",
        outcomeGoal: "cleaner movement of work and information across the model",
      };

    case "change_resilience":
      return {
        areaNoun: "change resilience",
        pluralAreaNoun: "change implementation pathways",
        actorNoun: "the wider organisation",
        operatingFocus: "how well process and service changes are absorbed and operationalised",
        likelyFailureMode: "changes being understood differently or landing unevenly in practice",
        likelyConsequence: "slower adoption, inconsistent execution, and recurring confusion after change",
        firstIntervention: "review one or two recent changes and where implementation became uneven",
        secondIntervention: "tighten readiness, communication, manager enablement, and follow-through",
        outcomeGoal: "a more reliable way of landing change into day-to-day operations",
      };

    default:
      return {
        areaNoun: dimensionLabel.toLowerCase(),
        pluralAreaNoun: "operating components",
        actorNoun: "stakeholders",
        operatingFocus: `${dimensionLabel.toLowerCase()} in day-to-day execution`,
        likelyFailureMode: "the operating model not being applied consistently in practice",
        likelyConsequence: "avoidable friction and weaker execution quality",
        firstIntervention: "identify where the operating pattern is weakest or most uneven",
        secondIntervention: "clarify the model, ownership, and expected handling",
        outcomeGoal: "a more dependable operating standard",
      };
  }
}

function getVariantIndex(insight: DimensionInsight): number {
  const roundedScore = getRoundedScore(insight.averageScore) ?? 3.0;
  const gap = insight.gap ?? 0;
  return Math.abs(
    Math.round(roundedScore * 10) +
      Math.round(gap * 10) +
      insight.dimensionKey.length +
      insight.completedQuestionnaireTypes.length,
  ) % 3;
}

function getObservationByTone(
  insight: DimensionInsight,
  lens: NarrativeLens,
  scoreBand: ScoreBucketBand,
  tone: ObservationTone,
  variantIndex: number,
): string {
  const roundedScore = getRoundedScore(insight.averageScore);
  const scoreText = roundedScore !== null ? roundedScore.toFixed(1) : "unknown";
  const gapText =
    typeof insight.gap === "number" ? insight.gap.toFixed(2) : null;
  const gapPhrase = hasMeaningfulGap(insight)
    ? ` The gap between respondent groups is also notable at ${gapText}, which suggests the experience is not landing in the same way across the organisation.`
    : "";
  const completenessPhrase =
    insight.completeness === "partial"
      ? " The signal is directionally useful, although a fuller response set would sharpen the picture further."
      : insight.completeness === "insufficient"
        ? " The reading is still early, so this should be treated as an emerging view rather than a settled conclusion."
        : "";

  if (tone === "fragile") {
    const variants = [
      `This is reading as a fragile area rather than a merely immature one. At ${scoreText}, ${lens.areaNoun} appears to be struggling to provide a dependable operating base, with signs that ${lens.likelyFailureMode}.${gapPhrase}${completenessPhrase}`,
      `The current score of ${scoreText} suggests ${lens.areaNoun} is not just underpowered, but unstable. In practical terms, that usually means ${lens.likelyFailureMode}, with the quality of execution depending too heavily on local conditions.${gapPhrase}${completenessPhrase}`,
      `At ${scoreText}, this looks like an operating weakness with real structural impact. ${lens.areaNoun} does not appear to be standing up consistently in practice, and there are likely points where ${lens.actorNoun} are compensating for gaps in the model.${gapPhrase}${completenessPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  if (tone === "inconsistent") {
    const variants = [
      `The score of ${scoreText} suggests ${lens.areaNoun} is underdeveloped in a fairly visible way. The main issue does not appear to be isolated failure, but a generally weak level of support for ${lens.operatingFocus}.${gapPhrase}${completenessPhrase}`,
      `This reads as a broad weakness rather than a narrow local problem. At ${scoreText}, ${lens.areaNoun} is likely not giving ${lens.actorNoun} a sufficiently reliable operating experience, even if some basics are in place.${gapPhrase}${completenessPhrase}`,
      `At ${scoreText}, the picture is one of low operating strength. ${lens.areaNoun} appears to be present in form, but not yet strong enough to make ${lens.operatingFocus} feel dependable day to day.${gapPhrase}${completenessPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  if (tone === "developing") {
    const variants = [
      `This area looks as though it is developing, but not yet landing to one common standard. A score of ${scoreText} suggests the foundations exist, although parts of the organisation are still experiencing ${lens.areaNoun} differently in practice.${gapPhrase}${completenessPhrase}`,
      `The result points to a partially formed capability rather than a fully settled one. At ${scoreText}, ${lens.areaNoun} seems to be working for some groups more effectively than others, which usually indicates uneven operating discipline.${gapPhrase}${completenessPhrase}`,
      `There are signs of a workable base here, but not yet of a consistently embedded model. With a score of ${scoreText}, the issue is less whether ${lens.areaNoun} exists at all, and more whether it is being applied with the same quality everywhere.${gapPhrase}${completenessPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  if (tone === "workable") {
    const variants = [
      `At ${scoreText}, this reads as workable but not especially robust. ${lens.areaNoun} appears to be supporting day-to-day operations to a degree, although it is unlikely to feel especially strong or friction-free in the moments that matter most.${gapPhrase}${completenessPhrase}`,
      `The current picture is one of basic functionality rather than clear operational strength. A score of ${scoreText} suggests ${lens.areaNoun} is not breaking down materially, but nor is it yet giving the organisation a particularly strong platform.${gapPhrase}${completenessPhrase}`,
      `This looks like an area where the basics are in place, but the operating quality is still fairly ordinary. At ${scoreText}, ${lens.areaNoun} seems serviceable enough for current needs without yet standing out as a mature capability.${gapPhrase}${completenessPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  if (tone === "stable") {
    const variants = [
      `This area is scoring at ${scoreText}, which suggests a broadly stable capability. ${lens.areaNoun} appears to be giving the organisation a solid operating base, even if some pockets of uneven experience remain beneath the surface.${gapPhrase}${completenessPhrase}`,
      `The current result points to a reasonably settled operating strength. At ${scoreText}, ${lens.areaNoun} seems to be working well enough to support normal execution, although not yet with completely even experience across groups.${gapPhrase}${completenessPhrase}`,
      `At ${scoreText}, the signal is broadly positive. ${lens.areaNoun} appears to be more strength than concern, with the main watch-out being whether the same standard is really being experienced throughout the organisation.${gapPhrase}${completenessPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  const strongVariants = [
    `This is one of the stronger parts of the operating model. With a score of ${scoreText}, ${lens.areaNoun} appears to be giving ${lens.actorNoun} a dependable and relatively well-established operating experience.${gapPhrase}${completenessPhrase}`,
    `At ${scoreText}, ${lens.areaNoun} reads as a genuine strength rather than simply an area avoiding obvious problems. The evidence suggests this part of the model is supporting execution in a fairly reliable way.${gapPhrase}${completenessPhrase}`,
    `The current score places ${lens.areaNoun} firmly in the stronger end of the range. In practical terms, that suggests the organisation is getting a reasonably dependable result in ${lens.operatingFocus}.${gapPhrase}${completenessPhrase}`,
  ];

  return strongVariants[variantIndex] ?? strongVariants[0];
}

function getImplicationByTone(
  insight: DimensionInsight,
  lens: NarrativeLens,
  scoreBand: ScoreBucketBand,
  tone: ImplicationTone,
  variantIndex: number,
): string {
  const gapPhrase = hasMeaningfulGap(insight)
    ? " The unevenness matters, because it usually means the organisation is carrying both a quality problem and a consistency problem at the same time."
    : "";

  if (tone === "reactive_drag") {
    const variants = [
      `The practical effect is likely to be more reactive work, more clarifying effort, and more dependence on individual intervention than the model should require.${gapPhrase}`,
      `In practice, this usually shows up as extra noise for HR and slower, less confident execution for managers or employees.${gapPhrase}`,
      `The business cost is rarely dramatic in one place, but it tends to accumulate through repeat queries, correction work, and a lower level of operating confidence.${gapPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  if (tone === "execution_risk") {
    const variants = [
      `This combination creates a more material execution risk. Where capability is weak and experience is uneven, outcomes often depend too heavily on who is involved, which team is handling the issue, or how much local support exists.${gapPhrase}`,
      `The implication is not just friction, but instability. Weakness combined with variation usually means the operating model is not yet providing a dependable standard of execution.${gapPhrase}`,
      `At this level, the organisation is likely carrying a real risk of uneven decisions, weak follow-through, and higher effort simply to get routine work completed reliably.${gapPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  if (tone === "scale_constraint") {
    const variants = [
      `This may be manageable at the current point in time, but it is unlikely to stay comfortable as complexity, volume, or change activity increases.${gapPhrase}`,
      `The main implication is that the model is not yet scaling evenly. Some groups are likely carrying more friction than others, which becomes harder to tolerate as the organisation grows.${gapPhrase}`,
      `This is the kind of issue that often sits in the background until growth or change exposes it more visibly. The inconsistency is as important as the absolute score.${gapPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  if (tone === "efficiency_drag") {
    const variants = [
      `The area is probably not failing outright, but it is likely creating more drag than it should. That usually shows up as avoidable effort, slower handling, or more dependence on informal clarification.${gapPhrase}`,
      `The likely consequence is not severe disruption, but a steady loss of efficiency and operating confidence over time.${gapPhrase}`,
      `This sort of middle-range result tends to mean the basics are functioning, but not cleanly enough to stay invisible. The organisation is still paying a friction cost here.${gapPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  if (tone === "platform_strength") {
    const variants = [
      `This gives the organisation a useful platform. The capability appears to be supporting more dependable execution, even if the final step is to make that strength land more consistently across groups.${gapPhrase}`,
      `Operationally, this should be helping to reduce noise and support clearer execution. The remaining issue is less about capability and more about making the same standard visible everywhere.${gapPhrase}`,
      `The positive here is that the organisation appears to have a workable strength to build from. The main risk is allowing residual inconsistency to dilute a capability that is otherwise sound.${gapPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  const advantageVariants = [
    `This is likely acting as a genuine operating advantage. Areas performing at this level tend to support consistency elsewhere and reduce the amount of intervention needed to keep the model working well.${gapPhrase}`,
    `The organisation is probably getting disproportionate value from this area because stronger capabilities like this often improve adjacent workflows as well.${gapPhrase}`,
    `Where a dimension is this strong, it usually contributes not just to smoother execution, but to higher confidence in the operating model overall.${gapPhrase}`,
  ];

  return advantageVariants[variantIndex] ?? advantageVariants[0];
}

function getNextStepByMode(
  insight: DimensionInsight,
  lens: NarrativeLens,
  mode: NextStepMode,
  variantIndex: number,
): string {
  const gapPhrase = hasMeaningfulGap(insight)
    ? " The first pass should compare how different respondent groups are currently experiencing the area rather than assuming one common problem statement."
    : "";

  if (mode === "reset") {
    const variants = [
      `The priority should be to ${lens.firstIntervention}, then ${lens.secondIntervention}. The aim is to create ${lens.outcomeGoal} rather than trying to optimise a model that is not yet stable.${gapPhrase}`,
      `This needs more than light tuning. Start by ${lens.firstIntervention}, then move quickly to ${lens.secondIntervention} so the organisation has ${lens.outcomeGoal}.${gapPhrase}`,
      `A sensible first move is a more fundamental reset: ${lens.firstIntervention}, then ${lens.secondIntervention}. That should give you ${lens.outcomeGoal} before further optimisation is attempted.${gapPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  if (mode === "stabilise") {
    const variants = [
      `The immediate task is to stabilise the area. Start by ${lens.firstIntervention}, then ${lens.secondIntervention} so the model becomes more dependable in normal day-to-day use.${gapPhrase}`,
      `A practical next step is to stop the area from drifting further. ${lens.firstIntervention}, then ${lens.secondIntervention}, with the near-term objective of ${lens.outcomeGoal}.${gapPhrase}`,
      `This is best handled as a stabilisation exercise rather than a redesign programme. Begin by ${lens.firstIntervention}, then ${lens.secondIntervention}.${gapPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  if (mode === "clarify") {
    const variants = [
      `The next step should focus on clarification rather than expansion. ${lens.firstIntervention}, then ${lens.secondIntervention}, so the model is easier to apply consistently.${gapPhrase}`,
      `What would help most now is greater operational clarity. Start by ${lens.firstIntervention}, then ${lens.secondIntervention}.${gapPhrase}`,
      `The strongest short-term move is to remove ambiguity. ${lens.firstIntervention}, then ${lens.secondIntervention}, with the aim of ${lens.outcomeGoal}.${gapPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  if (mode === "normalise") {
    const variants = [
      `The focus should be on normalising the experience, not redesigning the whole model. ${lens.firstIntervention}, then ${lens.secondIntervention}, so the strongest current pattern becomes the default standard.${gapPhrase}`,
      `The area looks strong enough in parts, but not evenly enough overall. Start by ${lens.firstIntervention}, then ${lens.secondIntervention} so the organisation is operating to one clearer standard.${gapPhrase}`,
      `The next step is to narrow the spread in experience. ${lens.firstIntervention}, then ${lens.secondIntervention}, bringing weaker local patterns into line with the strongest one.${gapPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  if (mode === "optimise") {
    const variants = [
      `This is now more about refinement than repair. ${lens.firstIntervention}, then ${lens.secondIntervention}, using the current strength as a benchmark for how the wider model should operate.${gapPhrase}`,
      `A pragmatic next step is to optimise from a position of strength. Begin by ${lens.firstIntervention}, then ${lens.secondIntervention}, so the capability becomes more consistently realised.${gapPhrase}`,
      `The opportunity here is to extend a strength rather than solve a weakness. ${lens.firstIntervention}, then ${lens.secondIntervention}, while protecting what is already working well.${gapPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  if (mode === "protect") {
    const variants = [
      `The main task is to protect what is already working. ${lens.firstIntervention}, then ${lens.secondIntervention}, so the capability remains strong as operating complexity changes.${gapPhrase}`,
      `Rather than changing the model materially, the goal should be to preserve the current quality. Start by ${lens.firstIntervention}, then ${lens.secondIntervention}.${gapPhrase}`,
      `This looks like an area worth protecting deliberately. ${lens.firstIntervention}, then ${lens.secondIntervention}, using it as a reference point for adjacent improvements.${gapPhrase}`,
    ];

    return variants[variantIndex] ?? variants[0];
  }

  const strengthenVariants = [
    `The next step should be to strengthen the existing base rather than replace it. ${lens.firstIntervention}, then ${lens.secondIntervention}, so the organisation moves towards ${lens.outcomeGoal}.${gapPhrase}`,
    `There is enough here to build from. Start by ${lens.firstIntervention}, then ${lens.secondIntervention}, with the aim of making the capability more dependable under normal operating pressure.${gapPhrase}`,
    `A sensible move now is to work on the weakest parts of the current model. ${lens.firstIntervention}, then ${lens.secondIntervention}, so the area becomes more robust without unnecessary redesign.${gapPhrase}`,
  ];

  return strengthenVariants[variantIndex] ?? strengthenVariants[0];
}

function buildObservation(insight: DimensionInsight): string {
  const lens = getLens(insight.dimensionKey, insight.dimensionLabel);
  const scoreBand = getScoreBucketBand(insight.averageScore);
  const tone = getObservationTone(insight);
  const variantIndex = getVariantIndex(insight);

  return getObservationByTone(insight, lens, scoreBand, tone, variantIndex);
}

function buildImplication(insight: DimensionInsight): string {
  const lens = getLens(insight.dimensionKey, insight.dimensionLabel);
  const scoreBand = getScoreBucketBand(insight.averageScore);
  const tone = getImplicationTone(insight);
  const variantIndex = getVariantIndex(insight);

  return getImplicationByTone(insight, lens, scoreBand, tone, variantIndex);
}

function buildRecommendedNextStep(insight: DimensionInsight): string {
  const lens = getLens(insight.dimensionKey, insight.dimensionLabel);
  const mode = getNextStepMode(insight);
  const variantIndex = getVariantIndex(insight);

  return getNextStepByMode(insight, lens, mode, variantIndex);
}

export function buildDimensionNarratives(
  insights: DimensionInsight[],
): DimensionNarrative[] {
  return insights.map((insight) => ({
    dimensionKey: insight.dimensionKey,
    dimensionLabel: insight.dimensionLabel,
    observation: buildObservation(insight),
    implication: buildImplication(insight),
    recommendedNextStep: buildRecommendedNextStep(insight),
    confidence: getConfidence(insight.completeness),
  }));
}
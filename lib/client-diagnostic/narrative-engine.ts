import type { DimensionAnalysis } from "./analysis-engine";
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
  strongLead: string;
  moderateLead: string;
  weakLead: string;
  strongOperationalBenefit: string;
  moderateOperationalRisk: string;
  weakOperationalRisk: string;
  nextStepFocus: string;
};

function getLens(dimensionKey: string, dimensionLabel: string): NarrativeLens {
  switch (dimensionKey) {
    case "process_clarity":
      return {
        strongLead:
          "The workflow path is clear enough that routine execution is not heavily dependent on interpretation.",
        moderateLead:
          "The workflow is visible, but it is not yet tight enough to remove ambiguity consistently.",
        weakLead:
          "The workflow is still relying too heavily on interpretation, clarification, or reconstruction to keep moving.",
        strongOperationalBenefit:
          "That reduces interpretive load across adjacent workflows and makes routine execution easier to sustain.",
        moderateOperationalRisk:
          "That leaves the model more exposed at handoffs, in edge cases, and when activity becomes more complex.",
        weakOperationalRisk:
          "That increases delay, rework, and the likelihood that people take different routes through the same process.",
        nextStepFocus:
          "reducing interpretive load inside the workflow itself",
      };
    case "ownership":
      return {
        strongLead:
          "Accountability appears clear enough that work can move without heavy reliance on manual escalation or reconstruction.",
        moderateLead:
          "The ownership model exists, but it is not yet landing cleanly enough in day-to-day execution.",
        weakLead:
          "Accountability is still becoming blurred at exactly the points where work needs a clear owner.",
        strongOperationalBenefit:
          "That supports cleaner decision flow and reduces the need for intervention to keep work moving.",
        moderateOperationalRisk:
          "That leaves the model vulnerable when work crosses teams, roles, or less standard scenarios.",
        weakOperationalRisk:
          "That creates pauses, rerouting, and a higher dependency on HR or senior intervention to re-establish control.",
        nextStepFocus:
          "making accountability explicit where it still goes implicit",
      };
    case "service_access":
      return {
        strongLead:
          "The access model is clear enough that people can reach support without much hesitation or rerouting.",
        moderateLead:
          "The front door exists, but it is not yet obvious enough to eliminate access friction consistently.",
        weakLead:
          "The route into support is still too fragmented or unclear to act as a dependable entry point.",
        strongOperationalBenefit:
          "That reduces intake noise and helps the wider service model start from a cleaner point of control.",
        moderateOperationalRisk:
          "That keeps avoidable friction at the front of the model, which then travels downstream into routing and delivery.",
        weakOperationalRisk:
          "That encourages bypass behaviour, duplicated requests, and unnecessary effort before work has properly started.",
        nextStepFocus:
          "making the first route into HR support more obvious and dependable",
      };
    case "knowledge_self_service":
    case "knowledge_access":
      return {
        strongLead:
          "The knowledge model is strong enough that self-service is reducing repeat clarification demand in common scenarios.",
        moderateLead:
          "Guidance exists, but it is not yet consistently reducing dependence on HR for interpretation.",
        weakLead:
          "The current knowledge model is not doing enough practical work at the point where people need it.",
        strongOperationalBenefit:
          "That protects capacity by reducing avoidable demand flowing back into HR.",
        moderateOperationalRisk:
          "That means self-service is only partially absorbing routine need, so HR is still carrying more translation work than it should.",
        weakOperationalRisk:
          "That sustains repeat clarification demand and keeps HR acting as a human workaround for weak guidance.",
        nextStepFocus:
          "reducing repeat clarification demand through stronger guidance design",
      };
    case "systems_enablement":
    case "technology_enablement":
      return {
        strongLead:
          "The system environment appears to be supporting the intended workflow rather than forcing people to compensate around it.",
        moderateLead:
          "The platform is usable, but it is not yet aligned tightly enough to the workflow to remove friction consistently.",
        weakLead:
          "The technology layer is still pushing too much effort back onto people through workaround, duplication, or manual checking.",
        strongOperationalBenefit:
          "That gives the model a cleaner control layer and reduces the manual effort needed to hold the process together.",
        moderateOperationalRisk:
          "That means the workflow is still carrying technology drag, even if the platform looks broadly serviceable on the surface.",
        weakOperationalRisk:
          "That creates hidden operational drag because the system is not acting as the dependable operating layer it needs to be.",
        nextStepFocus:
          "aligning the technology layer more closely to the actual workflow",
      };
    case "case_management":
      return {
        strongLead:
          "The case path appears visible enough and disciplined enough to support reliable handling in flight.",
        moderateLead:
          "The case path is functioning, but not yet tightly enough to eliminate uncertainty once work is already in motion.",
        weakLead:
          "The current case model is not giving enough control over work once it has entered the system.",
        strongOperationalBenefit:
          "That supports better visibility, cleaner issue handling, and less manual chasing.",
        moderateOperationalRisk:
          "That leaves the model exposed to loss of pace, weaker visibility, and inconsistent status control.",
        weakOperationalRisk:
          "That means status visibility and routing discipline are too dependent on manual effort to be dependable.",
        nextStepFocus:
          "creating stronger visibility and routing control for work in flight",
      };
    case "data_handoffs":
      return {
        strongLead:
          "Work and information appear to be moving between stages with relatively little correction or defensive checking.",
        moderateLead:
          "The transfer points are functioning, but not yet cleanly enough to eliminate downstream friction consistently.",
        weakLead:
          "The handoff model is still creating too much checking, correction, or back-and-forth as work moves forward.",
        strongOperationalBenefit:
          "That reduces hidden correction effort and helps downstream work start from a stronger base.",
        moderateOperationalRisk:
          "That leaves the model exposed to avoidable friction at exactly the points where clean transfer matters most.",
        weakOperationalRisk:
          "That creates a hidden tax on throughput because teams cannot rely confidently on the work or data they receive.",
        nextStepFocus:
          "reducing correction effort and strengthening transfer discipline",
      };
    case "consistency":
      return {
        strongLead:
          "The model appears to be producing a reasonably consistent standard of handling across comparable situations.",
        moderateLead:
          "The standard exists, but not yet firmly enough to remove visible variation in practice.",
        weakLead:
          "The operating model is still allowing too much variation in how similar situations are handled.",
        strongOperationalBenefit:
          "That reduces intervention load and gives people more confidence that the same standards will be applied predictably.",
        moderateOperationalRisk:
          "That means the model is still carrying a reliability problem at the margins, even where major breakdown is not visible.",
        weakOperationalRisk:
          "That creates fairness risk, weaker trust, and a higher dependency on manual intervention to preserve one standard.",
        nextStepFocus:
          "tightening the decision points that still allow local variation",
      };
    case "operational_capacity":
      return {
        strongLead:
          "The delivery model appears to have enough headroom that normal demand does not immediately tip it into reaction.",
        moderateLead:
          "The service is holding, but with visible sensitivity to interruptions, spikes, or competing demand.",
        weakLead:
          "The model is still carrying too much reactive load to create dependable operating headroom.",
        strongOperationalBenefit:
          "That gives the function more resilience and more room to improve rather than only respond.",
        moderateOperationalRisk:
          "That means capacity is present, but not yet comfortably enough to absorb variation without some degradation.",
        weakOperationalRisk:
          "That creates broader operating drag because finite capacity is being consumed by interruption, backlog, or avoidable demand.",
        nextStepFocus:
          "releasing usable capacity by reducing reactive or avoidable demand",
      };
    case "change_resilience":
      return {
        strongLead:
          "The organisation appears able to convert change into stable day-to-day practice rather than repeated re-launch.",
        moderateLead:
          "The model can move change, but not yet evenly enough to guarantee that it embeds cleanly over time.",
        weakLead:
          "The organisation is still too vulnerable to change fading, fragmenting, or reverting after launch.",
        strongOperationalBenefit:
          "That reduces repeated effort and helps improvement work stick once it has been introduced.",
        moderateOperationalRisk:
          "That means changes can still drift in quality or adoption after launch, even where the initial rollout appears sound.",
        weakOperationalRisk:
          "That leaves the organisation exposed to solving the same problem more than once because change is not embedding durably enough.",
        nextStepFocus:
          "strengthening reinforcement and embed around change adoption",
      };
    default:
      return {
        strongLead:
          `${dimensionLabel} appears to be operating as a dependable part of the wider model.`,
        moderateLead:
          `${dimensionLabel} looks serviceable, but not yet firmly enough embedded to remove friction consistently.`,
        weakLead:
          `${dimensionLabel} is still reading as a weaker part of the operating model.`,
        strongOperationalBenefit:
          "That is giving the organisation a useful platform to build from.",
        moderateOperationalRisk:
          "That leaves some avoidable friction in the model.",
        weakOperationalRisk:
          "That is creating more operating drag than the model should be carrying.",
        nextStepFocus:
          `stabilising and strengthening ${dimensionLabel.toLowerCase()}`,
      };
  }
}

function formatScore(value: number | null): string {
  return typeof value === "number" ? value.toFixed(1) : "unknown";
}

function formatGap(value: number | null): string {
  return typeof value === "number" ? value.toFixed(2) : "unknown";
}

function buildGapOverlay(analysis: DimensionAnalysis): string | null {
  const { gapPattern, scores, gap, alignment } = analysis;

  if (
    alignment !== "emerging_gap" &&
    alignment !== "significant_gap"
  ) {
    return null;
  }

  if (gapPattern === "manager_lower_than_others") {
    return `Managers are rating this materially lower than both HR and Leadership, which suggests the model is stronger in design than in practical application.`;
  }

  if (gapPattern === "hr_lower_than_leadership") {
    return `HR is reading this more cautiously than Leadership, which suggests the friction is being experienced more directly than it is being seen from above.`;
  }

  if (gapPattern === "leadership_lower_than_others") {
    return `Leadership is more cautious on this dimension than the groups closer to daily execution, which suggests concern about resilience or control at a broader operating level.`;
  }

  return `The spread between respondent groups is ${formatGap(
    gap,
  )}, which indicates the experience is not landing evenly across the organisation.`;
}

function buildObservation(analysis: DimensionAnalysis): string {
  const lens = getLens(analysis.dimensionKey, analysis.dimensionLabel);
  const primaryPattern = analysis.primaryPattern;
  const averageScoreText = formatScore(analysis.averageScore);
  const gapText = formatGap(analysis.gap);
  const gapOverlay = buildGapOverlay(analysis);

  if (primaryPattern?.code === "KNOWLEDGE_DEMAND_LOOP") {
    return `The knowledge model is not reducing demand in the way it should. Guidance may exist, but people are still relying on HR to interpret or validate it, which keeps repeat clarification demand flowing back into the function. This is showing up against an average score of ${averageScoreText} and a group gap of ${gapText}.${gapOverlay ? ` ${gapOverlay}` : ""}`;
  }

  if (primaryPattern?.code === "SYSTEM_WORKFLOW_MISALIGNMENT") {
    return `The system is not yet acting as a dependable operating layer for this part of the model. The workflow and the platform are not aligned tightly enough, which means users are still compensating around the system rather than being carried by it. This sits against an average score of ${averageScoreText} and a group gap of ${gapText}.${gapOverlay ? ` ${gapOverlay}` : ""}`;
  }

  if (primaryPattern?.code === "SYSTEM_WORKAROUND_MODEL") {
    return `The system environment is still relying too heavily on workaround to keep work moving. In practice, the intended workflow is not being supported cleanly enough inside the platform, so extra effort is being pushed back onto users. This is reflected in an average score of ${averageScoreText}.${gapOverlay ? ` ${gapOverlay}` : ""}`;
  }

  if (primaryPattern?.code === "CASE_TRACKING_VISIBILITY_GAP") {
    return `Work in flight is not visible enough once it enters the case model. The issue is less about whether work exists in the system, and more about whether status, pace, and control can be seen without manual chasing. The average score here is ${averageScoreText}, with a gap of ${gapText}.${gapOverlay ? ` ${gapOverlay}` : ""}`;
  }

  if (primaryPattern?.code === "DATA_REWORK_ENGINE") {
    return `The handoff model is generating too much correction and validation effort. Work is moving forward, but not cleanly enough to prevent rework and defensive checking at the points where one team or step depends on another. This is reflected in an average score of ${averageScoreText}.${gapOverlay ? ` ${gapOverlay}` : ""}`;
  }

  if (primaryPattern?.code === "CONSISTENCY_MANAGER_VARIATION") {
    return `The main issue here is not absence of a standard, but too much dependence on local judgement for that standard to hold. Similar situations are still vulnerable to different handling depending on where they land. The average score is ${averageScoreText}, with a gap of ${gapText}.${gapOverlay ? ` ${gapOverlay}` : ""}`;
  }

  if (primaryPattern?.code === "CAPACITY_TRUE_SHORTFALL") {
    return `The operating model appears to be carrying a real capacity shortfall rather than only a perception of pressure. Demand, backlog, and resilience are all combining to suggest the function does not currently have enough usable capacity to absorb work cleanly. The average score is ${averageScoreText}.${gapOverlay ? ` ${gapOverlay}` : ""}`;
  }

  if (primaryPattern?.code === "CAPACITY_REACTIVE_MODEL") {
    return `The function is still operating too reactively for its capacity to feel dependable. Interruption and unplanned demand are absorbing too much of the model's usable headroom, which makes the service more fragile under pressure. This sits against an average score of ${averageScoreText}.${gapOverlay ? ` ${gapOverlay}` : ""}`;
  }

  if (primaryPattern?.code === "CHANGE_REVERSION_RISK") {
    return `The issue here is not simply launching change, but sustaining it long enough for it to become normal practice. The current pattern suggests that improvements are still vulnerable to drift or reversion after the initial rollout phase. The average score is ${averageScoreText}.${gapOverlay ? ` ${gapOverlay}` : ""}`;
  }

  if (analysis.strength === "strong") {
    return `${lens.strongLead} The dimension is currently scoring at ${averageScoreText}, with a gap of ${gapText}.${gapOverlay ? ` ${gapOverlay}` : ""}`;
  }

  if (analysis.strength === "moderate") {
    return `${lens.moderateLead} The dimension is currently scoring at ${averageScoreText}, with a gap of ${gapText}.${gapOverlay ? ` ${gapOverlay}` : ""}`;
  }

  return `${lens.weakLead} The dimension is currently scoring at ${averageScoreText}, with a gap of ${gapText}.${gapOverlay ? ` ${gapOverlay}` : ""}`;
}

function buildImplication(analysis: DimensionAnalysis): string {
  const lens = getLens(analysis.dimensionKey, analysis.dimensionLabel);
  const primaryPattern = analysis.primaryPattern;

  if (primaryPattern?.code === "KNOWLEDGE_DEMAND_LOOP") {
    return `The consequence is sustained avoidable demand. HR continues to act as a translation layer for routine needs, which increases workload, slows response, and reduces the capacity available for higher-value work.`;
  }

  if (primaryPattern?.code === "KNOWLEDGE_LOW_TRUST") {
    return `The practical cost is that guidance is not trusted enough to change behaviour. People check with HR anyway, which means the knowledge model is not reducing dependency in the way it should.`;
  }

  if (primaryPattern?.code === "SYSTEM_WORKFLOW_MISALIGNMENT") {
    return `The cost is not just friction inside the tool. It is the fact that the platform is not reinforcing the intended operating model strongly enough, which leaves users to bridge the gap manually.`;
  }

  if (primaryPattern?.code === "SYSTEM_WORKAROUND_MODEL") {
    return `That creates a hidden efficiency tax. The workflow may still complete, but it does so with more off-system effort, more manual compensation, and less control than the model should require.`;
  }

  if (primaryPattern?.code === "SYSTEM_DUPLICATION_GAP") {
    return `The operating consequence is repeated manual effort and weaker data confidence. When the same work or data has to be entered, checked, or reconciled more than once, the system stops acting as a clean control layer.`;
  }

  if (primaryPattern?.code === "CASE_TRACKING_VISIBILITY_GAP") {
    return `Once work is in flight, the model is not giving enough status control. Managers are more likely to chase, escalate, or reconstruct progress manually, which increases effort and weakens confidence in the service model.`;
  }

  if (primaryPattern?.code === "CASE_SHADOW_MANAGEMENT") {
    return `That means the formal case model is not carrying as much of the real work as it appears to. Control is diluted because updates, ownership, or progress are being managed in side channels rather than in one visible path.`;
  }

  if (primaryPattern?.code === "DATA_REWORK_ENGINE") {
    return `The model is carrying a hidden cost of correction. Teams spend time validating, fixing, and rechecking work that should already have moved forward cleanly, which slows throughput and lowers trust between steps.`;
  }

  if (primaryPattern?.code === "DATA_LOW_TRUST_HANDOFF") {
    return `The result is a defensive operating pattern. Teams are less able to trust incoming work, so they compensate with checking, validation, or manual control effort before they are willing to proceed.`;
  }

  if (primaryPattern?.code === "CONSISTENCY_MANAGER_VARIATION") {
    return `This creates a practical repeatability problem. Similar situations are less likely to produce similar outcomes, which weakens predictability and increases the amount of judgement needed at the margins.`;
  }

  if (primaryPattern?.code === "CONSISTENCY_HR_CORRECTION_LAYER") {
    return `The hidden cost is that HR becomes a manual stabiliser of the model rather than the model producing one standard on its own. That increases intervention load and leaves consistency vulnerable when that correction layer is absent.`;
  }

  if (primaryPattern?.code === "CAPACITY_TRUE_SHORTFALL") {
    return `The consequence is not only slower delivery, but a weaker operating posture overall. When the model lacks real headroom, service quality, responsiveness, and improvement capacity all become harder to sustain at the same time.`;
  }

  if (primaryPattern?.code === "CAPACITY_REACTIVE_MODEL") {
    return `The practical consequence is not only local workload pressure, but wider operating drag. Reactive demand absorbs the headroom that should be available for stable delivery and improvement.`;
  }

  if (primaryPattern?.code === "CAPACITY_AVOIDABLE_DEMAND") {
    return `That means finite capacity is being consumed by work the model should increasingly be preventing or absorbing elsewhere. The result is a service that feels over-stretched even where some of the load is structurally avoidable.`;
  }

  if (primaryPattern?.code === "CHANGE_MANAGER_ENABLEMENT_GAP") {
    return `The problem is not simply that change is difficult. It is that managers are not being enabled strongly enough to apply and sustain it, which leaves adoption uneven at the point where the model has to operate.`;
  }

  if (primaryPattern?.code === "CHANGE_REINFORCEMENT_GAP") {
    return `That leaves the organisation vulnerable to launch without embed. Changes may appear to land initially, but without reinforcement they are less likely to hold as routine practice over time.`;
  }

  if (primaryPattern?.code === "CHANGE_REVERSION_RISK") {
    return `The cost is repeated effort without durable return. If the model cannot sustain change once introduced, the organisation is likely to revisit the same issues more than once.`;
  }

  if (analysis.strength === "strong") {
    return lens.strongOperationalBenefit;
  }

  if (analysis.strength === "moderate") {
    return lens.moderateOperationalRisk;
  }

  return lens.weakOperationalRisk;
}

function buildRecommendedNextStep(analysis: DimensionAnalysis): string {
  const lens = getLens(analysis.dimensionKey, analysis.dimensionLabel);
  const primaryPattern = analysis.primaryPattern;

  if (primaryPattern?.code === "KNOWLEDGE_DEMAND_LOOP") {
    return `The priority is to reduce repeat clarification demand. Start by identifying the topics generating the highest volume of repeat questions or the lowest confidence in self-service. Then redesign those guidance paths around clarity, usability, and ownership so they can be used without HR interpretation.`;
  }

  if (primaryPattern?.code === "KNOWLEDGE_LOW_TRUST") {
    return `The priority is to rebuild trust in the guidance model. Start by identifying the guidance areas people are most likely to validate manually with HR. Then strengthen those areas for currency, clarity, and practical usability so confidence can increase without adding more content volume.`;
  }

  if (primaryPattern?.code === "SYSTEM_WORKFLOW_MISALIGNMENT") {
    return `The priority is to align the technology layer more closely to the actual workflow. Start by identifying where users are relying on workaround, bypass, or manual compensation to get work done. Then adjust the system configuration, process design, or integration points so the platform becomes the default operating path rather than an optional layer.`;
  }

  if (primaryPattern?.code === "SYSTEM_WORKAROUND_MODEL") {
    return `The priority is to reduce the manual compensation sitting around the system. Start by identifying the steps where workaround is most common or most costly. Then redesign those points so the workflow can be completed inside the system with less extra effort.`;
  }

  if (primaryPattern?.code === "SYSTEM_DUPLICATION_GAP") {
    return `The priority is to remove duplication and reconciliation effort from the technology flow. Start by identifying where data or steps are being repeated across systems. Then address the workflow, integration, or control weakness causing that repeat effort so the system landscape becomes cleaner to operate.`;
  }

  if (primaryPattern?.code === "CASE_TRACKING_VISIBILITY_GAP") {
    return `The priority is to create stronger visibility of work in flight. Start by identifying where cases lose status visibility or require manual chasing to reconstruct progress. Then tighten tracking, routing, and ownership at those points so status can be seen without intervention.`;
  }

  if (primaryPattern?.code === "CASE_SHADOW_MANAGEMENT") {
    return `The priority is to bring case control back into the formal model. Start by identifying which updates, decisions, or ownership transfers are happening outside the case path. Then redesign those points so the real work is managed inside one visible route rather than side channels.`;
  }

  if (primaryPattern?.code === "DATA_REWORK_ENGINE") {
    return `The priority is to reduce correction effort at transfer points. Start by identifying where incoming work most often requires validation, rework, or clarification before the next step can proceed. Then strengthen the input, output, and handoff controls at those points so work moves forward more cleanly.`;
  }

  if (primaryPattern?.code === "DATA_LOW_TRUST_HANDOFF") {
    return `The priority is to increase trust in the handoff itself. Start by identifying where teams are most likely to validate incoming work before acting on it. Then clarify the ownership, quality checks, and handoff expectations at those points so incoming work can be relied on more confidently.`;
  }

  if (primaryPattern?.code === "CONSISTENCY_MANAGER_VARIATION") {
    return `The priority is to reduce local variation in decision-making. Start by identifying the situations where managers are most likely to interpret the standard differently. Then tighten the decision rules, exception handling, or guidance around those points so similar situations produce more predictable outcomes.`;
  }

  if (primaryPattern?.code === "CONSISTENCY_HR_CORRECTION_LAYER") {
    return `The priority is to reduce the amount of manual correction needed from HR. Start by identifying where HR is stepping in most often to stabilise outcomes. Then strengthen the underlying decision standard so consistency is produced by the model rather than by intervention.`;
  }

  if (primaryPattern?.code === "CAPACITY_TRUE_SHORTFALL") {
    return `The priority is to separate real capacity shortfall from the work the model should not be generating in the first place. Start by identifying where backlog, delay, and service degradation are most concentrated. Then determine which part of that pressure is true resourcing need and which part is being created elsewhere in the operating model.`;
  }

  if (primaryPattern?.code === "CAPACITY_REACTIVE_MODEL") {
    return `The priority is to reduce the reactive load consuming usable headroom. Start by identifying the main sources of interruption, escalation, or unplanned demand. Then redesign the upstream conditions creating that volatility so the model can operate with more stability.`;
  }

  if (primaryPattern?.code === "CAPACITY_AVOIDABLE_DEMAND") {
    return `The priority is to release capacity by reducing work the model should increasingly be preventing or absorbing elsewhere. Start by identifying the biggest sources of repeat or avoidable demand. Then address the root drivers so headroom is created without relying only on added resource.`;
  }

  if (primaryPattern?.code === "CHANGE_MANAGER_ENABLEMENT_GAP") {
    return `The priority is to make change more usable at manager level. Start by identifying where managers are least confident in applying the new way of working. Then strengthen the guidance, support, and reinforcement around those moments so adoption can become more consistent in practice.`;
  }

  if (primaryPattern?.code === "CHANGE_REINFORCEMENT_GAP") {
    return `The priority is to strengthen embed after launch. Start by identifying where changes are most likely to lose discipline after the initial rollout. Then put reinforcement, follow-through, and ownership around those points so the model does not depend on launch energy alone.`;
  }

  if (primaryPattern?.code === "CHANGE_REVERSION_RISK") {
    return `The priority is to stop drift back into older ways of working. Start by identifying where reversion is most visible after initial adoption. Then strengthen the reinforcement and accountability around those behaviours so the new model becomes durable rather than temporary.`;
  }

  if (analysis.strength === "strong") {
    return `This does not call for major redesign. The priority is deliberate protection. Start by identifying where ${lens.nextStepFocus} still depends on local knowledge, habit, or informal behaviour rather than explicit design. Then make those dependencies more visible and more deliberate so the current strength does not erode over time.`;
  }

  if (analysis.strength === "moderate") {
    return `The priority is ${lens.nextStepFocus}. Start by identifying the points where the current model is most exposed or inconsistent in practice. Then tighten those points so the capability becomes more dependable without broad redesign.`;
  }

  return `The priority is ${lens.nextStepFocus}. Start by identifying where the weakness is creating the most visible operating drag today. Then stabilise those points first so the wider model can improve from a more dependable base.`;
}

export function buildDimensionNarratives(
  analyses: DimensionAnalysis[],
): DimensionNarrative[] {
  return analyses.map((analysis) => ({
    dimensionKey: analysis.dimensionKey,
    dimensionLabel: analysis.dimensionLabel,
    observation: buildObservation(analysis),
    implication: buildImplication(analysis),
    recommendedNextStep: buildRecommendedNextStep(analysis),
    confidence: analysis.confidence,
  }));
}

/**
 * Temporary compatibility helper.
 * Use this only if you need a bridge while wiring the new analysis engine.
 */
export function buildDimensionNarrativesFromInsights(
  _insights: DimensionInsight[],
): DimensionNarrative[] {
  throw new Error(
    "buildDimensionNarrativesFromInsights is deprecated. Build DimensionAnalysis objects first and then call buildDimensionNarratives(analyses).",
  );
}
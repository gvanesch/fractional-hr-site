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
  strongAlignedObservation: string;
  strongGapObservation: string;
  moderateAlignedObservation: string;
  moderateGapObservation: string;
  weakAlignedObservation: string;
  weakGapObservation: string;
  strongAlignedImplication: string;
  strongGapImplication: string;
  moderateAlignedImplication: string;
  moderateGapImplication: string;
  weakAlignedImplication: string;
  weakGapImplication: string;
  strongAlignedNextStep: string;
  strongGapNextStep: string;
  moderateAlignedNextStep: string;
  moderateGapNextStep: string;
  weakAlignedNextStep: string;
  weakGapNextStep: string;
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

function getNarrativeLens(dimensionKey: string, dimensionLabel: string): NarrativeLens {
  switch (dimensionKey) {
    case "service_delivery":
      return {
        strongAlignedObservation:
          "Service delivery appears to be operating in a disciplined and dependable way, with respondent groups broadly experiencing support as accessible, consistent, and well managed.",
        strongGapObservation:
          "Service delivery is generally seen as effective, but experience is not fully consistent across respondent groups, suggesting that quality of support may still depend on team, channel, or local practice.",
        moderateAlignedObservation:
          "Service delivery appears functional but not especially strong, indicating that support is available but may not yet feel consistently efficient, proactive, or easy to navigate.",
        moderateGapObservation:
          "Service delivery is producing a mixed experience across the organisation, with some groups encountering a more reliable support model than others.",
        weakAlignedObservation:
          "Service delivery is being experienced as a clear operational weakness, with broad agreement that support is not currently landing with the consistency or effectiveness required.",
        weakGapObservation:
          "Service delivery appears both underpowered and uneven, suggesting not only a weak support model but also significant variation in how people gain access to help and resolution.",
        strongAlignedImplication:
          "This creates a strong operational backbone for HR and makes it easier to scale support without creating unnecessary friction for managers or employees.",
        strongGapImplication:
          "The underlying service model may be sound, but variation in execution risks eroding confidence and driving workarounds outside the intended support channels.",
        moderateAlignedImplication:
          "The basics are likely in place, but the model may struggle under greater scale or complexity unless service pathways, ownership, and responsiveness are strengthened.",
        moderateGapImplication:
          "An uneven support experience can lead to inconsistent employee outcomes, duplicated queries, and unnecessary reliance on informal escalation routes.",
        weakAlignedImplication:
          "Where service delivery is broadly recognised as weak, HR is likely absorbing avoidable reactive work while managers and employees experience slower, less reliable support.",
        weakGapImplication:
          "This combination points to a service model that is not yet stable, making consistency difficult to achieve and increasing operational drag across the organisation.",
        strongAlignedNextStep:
          "Protect what is working by documenting the current service model clearly, tracking service quality, and using this area as a benchmark for improving weaker parts of the operating model.",
        strongGapNextStep:
          "Focus on reducing variation in service delivery by tightening entry points, clarifying service ownership, and ensuring the support experience does not differ materially by team or location.",
        moderateAlignedNextStep:
          "Strengthen service delivery by simplifying support routes, clarifying who owns what, and making the experience faster and easier to navigate for managers and employees.",
        moderateGapNextStep:
          "Prioritise a service consistency review, looking at where requests are routed, how advice is given, and where manager or employee experience differs across teams or regions.",
        weakAlignedNextStep:
          "Redesign the service model around clearer access, stronger triage, defined ownership, and more consistent case handling so support becomes dependable rather than reactive.",
        weakGapNextStep:
          "Undertake a structured reset of service delivery, starting with how support is accessed, who owns resolution, and where inconsistency in response or quality is currently greatest.",
      };

    case "process_standardisation":
      return {
        strongAlignedObservation:
          "Processes appear to be well standardised, with broad agreement that key people operations are understood and applied consistently.",
        strongGapObservation:
          "Process standardisation is generally strong, but some groups are still experiencing more variation than others, suggesting local deviation from the intended model.",
        moderateAlignedObservation:
          "There is a reasonable level of process consistency, but standardisation does not yet appear strong enough to remove ambiguity or prevent variation in everyday execution.",
        moderateGapObservation:
          "Process standardisation appears uneven, with respondent groups experiencing different levels of clarity and consistency in how core activities are carried out.",
        weakAlignedObservation:
          "There is broad recognition that processes are not sufficiently standardised, with too much room for interpretation in how work is being done.",
        weakGapObservation:
          "Process standardisation is weak and uneven, suggesting not just a lack of common process discipline but also materially different ways of working across parts of the organisation.",
        strongAlignedImplication:
          "Strong standardisation reduces avoidable friction, supports control, and makes it easier to scale without losing consistency.",
        strongGapImplication:
          "Where standardisation exists in theory but not in lived experience, different teams may still be creating local versions of the same process.",
        moderateAlignedImplication:
          "This may be manageable at current scale, but moderate process discipline often becomes a constraint as the organisation grows or complexity increases.",
        moderateGapImplication:
          "Inconsistent process execution increases the risk of uneven employee experience, variable manager decisions, and additional burden on HR to correct issues downstream.",
        weakAlignedImplication:
          "Without strong standardisation, process quality depends too heavily on individual judgement, which makes consistency, control, and scale difficult to sustain.",
        weakGapImplication:
          "This creates a particularly unstable operating environment, where process quality is likely varying significantly by team, geography, or manager capability.",
        strongAlignedNextStep:
          "Preserve the strength here by keeping process ownership clear, maintaining documentation discipline, and using the strongest workflows as templates for adjacent areas.",
        strongGapNextStep:
          "Target the remaining variation by identifying where local interpretation persists and tightening governance around how standard processes should be applied.",
        moderateAlignedNextStep:
          "Move from workable to robust by clarifying process boundaries, reducing ambiguity in handoffs, and ensuring core workflows are documented and easy to follow.",
        moderateGapNextStep:
          "Run a focused standardisation exercise on the most variable processes, identifying where teams are following different paths and bringing them back to a common model.",
        weakAlignedNextStep:
          "Prioritise the design of a clear operating baseline for core HR processes, with explicit ownership, documented steps, and practical guidance on how work should be done.",
        weakGapNextStep:
          "Start with the highest-friction processes and bring them under tighter operational control, reducing local variation and making expectations explicit for all stakeholders.",
      };

    case "manager_enablement":
      return {
        strongAlignedObservation:
          "Managers appear to be well supported, with a shared view that they can access the guidance, clarity, and practical help needed to navigate people processes effectively.",
        strongGapObservation:
          "Manager enablement is seen as broadly effective, but experience varies enough to suggest that some managers are still receiving a stronger support model than others.",
        moderateAlignedObservation:
          "Managers appear to have some level of support, but not yet enough to suggest a consistently strong or well-embedded enablement model.",
        moderateGapObservation:
          "Manager enablement appears uneven, with some groups experiencing clearer guidance and stronger support than others.",
        weakAlignedObservation:
          "There is broad agreement that managers are not being sufficiently enabled, suggesting a persistent gap between process expectations and practical support.",
        weakGapObservation:
          "Manager enablement is both weak and inconsistent, implying that capability depends too heavily on local support, individual judgement, or informal networks.",
        strongAlignedImplication:
          "Well-enabled managers reduce operational noise for HR and are more likely to apply people processes consistently and confidently.",
        strongGapImplication:
          "Variation here can still create uneven decision-making, even if the underlying support model is strong in parts of the organisation.",
        moderateAlignedImplication:
          "A partially developed manager support model can leave HR carrying too much advisory burden and can slow down consistent execution at team level.",
        moderateGapImplication:
          "Where some managers are better supported than others, decision quality and employee experience are likely to differ across teams.",
        weakAlignedImplication:
          "Weak manager enablement often shows up in escalation volume, inconsistent decisions, slow handling of people matters, and avoidable dependence on HR intervention.",
        weakGapImplication:
          "This creates a structurally uneven management experience, making it difficult to achieve consistent execution even where formal processes exist.",
        strongAlignedNextStep:
          "Sustain the strength here by keeping manager guidance current, practical, and easy to access, and by using manager feedback to refine support over time.",
        strongGapNextStep:
          "Reduce remaining variation by checking whether manager support differs by business area or leader population, and then standardise the enablement experience.",
        moderateAlignedNextStep:
          "Strengthen manager enablement through clearer guidance, better just-in-time support, and more practical tools that help managers apply process consistently.",
        moderateGapNextStep:
          "Prioritise where manager experience differs most and tighten the support model so managers receive the same quality of guidance regardless of team or location.",
        weakAlignedNextStep:
          "Rebuild manager enablement around practical manager journeys, clear decision guidance, and accessible support so managers can execute people processes with more confidence.",
        weakGapNextStep:
          "Start by identifying where managers are most exposed or unsupported, then standardise core guidance, escalation routes, and process expectations across the organisation.",
      };

    case "employee_experience":
      return {
        strongAlignedObservation:
          "Employee experience appears to be relatively strong, with a shared sense that people processes are understandable, accessible, and reasonably well supported.",
        strongGapObservation:
          "Employee experience is generally positive, but differences across respondent groups suggest that not all parts of the organisation are experiencing the same standard.",
        moderateAlignedObservation:
          "Employee experience appears adequate but not especially distinctive, suggesting that core processes are working without yet feeling consistently clear or well designed.",
        moderateGapObservation:
          "Employee experience looks mixed, with noticeable differences in how smoothly or clearly people processes are being experienced across the organisation.",
        weakAlignedObservation:
          "There is broad recognition that employee experience is not where it needs to be, with common processes likely feeling unclear, inconsistent, or overly effortful.",
        weakGapObservation:
          "Employee experience is weak and uneven, indicating that friction is not only present but also distributed inconsistently across teams or employee groups.",
        strongAlignedImplication:
          "A strong employee experience supports trust in HR processes and reduces confusion, repeat queries, and avoidable frustration.",
        strongGapImplication:
          "If some groups experience the process better than others, the organisation risks creating pockets of confidence alongside pockets of frustration.",
        moderateAlignedImplication:
          "An adequate experience may hold for now, but it is unlikely to be resilient if volume, complexity, or organisational change increases.",
        moderateGapImplication:
          "Different employee experiences across the organisation often point to uneven process design, communication quality, or service accessibility.",
        weakAlignedImplication:
          "Where employee experience is broadly weak, people processes are likely creating more uncertainty and effort than they should, with downstream impact on trust and efficiency.",
        weakGapImplication:
          "This kind of variation makes it difficult to deliver a consistent employee proposition and often signals deeper inconsistency in operational execution.",
        strongAlignedNextStep:
          "Maintain the current experience by continuing to simplify employee touchpoints, monitor friction points, and preserve clarity across core journeys.",
        strongGapNextStep:
          "Close the experience gap by reviewing where employees are encountering a different standard of clarity, responsiveness, or support and normalising the strongest practices.",
        moderateAlignedNextStep:
          "Improve the employee experience by simplifying high-volume journeys, making guidance easier to access, and reducing avoidable uncertainty in key moments.",
        moderateGapNextStep:
          "Review the employee journeys that appear most uneven and identify whether communication, ownership, or service access is driving the different experiences.",
        weakAlignedNextStep:
          "Prioritise the redesign of the most visible employee journeys so the experience becomes clearer, less effortful, and more consistent end to end.",
        weakGapNextStep:
          "Start with the employee journeys generating the greatest friction and address both the quality problem and the consistency problem together, rather than treating them separately.",
      };

    case "technology_enablement":
      return {
        strongAlignedObservation:
          "Technology appears to be enabling the operating model effectively, with respondent groups broadly seeing systems as helpful rather than obstructive.",
        strongGapObservation:
          "Technology is generally seen as supportive, but there are still differences in experience that suggest uneven adoption, configuration, or usability.",
        moderateAlignedObservation:
          "Technology enablement appears serviceable but not especially strong, indicating that systems are supporting work to a degree without fully simplifying or strengthening it.",
        moderateGapObservation:
          "Technology enablement is mixed, with some respondent groups experiencing greater support from systems than others.",
        weakAlignedObservation:
          "There is broad recognition that technology is not adequately enabling the operating model, with systems likely creating friction or failing to support process effectively.",
        weakGapObservation:
          "Technology enablement appears both weak and inconsistent, suggesting that system value depends too heavily on team, role, or local workaround.",
        strongAlignedImplication:
          "When technology is working well, it supports consistency, reduces manual effort, and makes scale easier to achieve without increasing administrative burden.",
        strongGapImplication:
          "Variation in technology experience can still undermine process consistency, even if the platform itself is broadly capable.",
        moderateAlignedImplication:
          "A merely adequate systems landscape often leaves automation, self-service, and operational visibility underdeveloped.",
        moderateGapImplication:
          "Different experiences of the same systems usually point to uneven adoption, configuration issues, or unclear role-based enablement.",
        weakAlignedImplication:
          "Where systems are broadly experienced as weak, HR and managers are likely compensating through manual workarounds, duplicated effort, or offline fixes.",
        weakGapImplication:
          "This creates a fragmented operating environment in which technology is not acting as a stable backbone for process execution.",
        strongAlignedNextStep:
          "Continue to strengthen technology enablement by protecting usability, maintaining good governance, and extending successful patterns into adjacent process areas.",
        strongGapNextStep:
          "Investigate where system experience differs most and address whether the cause is configuration, adoption, access, or role-specific workflow design.",
        moderateAlignedNextStep:
          "Move beyond basic functionality by simplifying the highest-friction workflows and improving how systems support visibility, consistency, and self-service.",
        moderateGapNextStep:
          "Prioritise the technology-enabled processes where experience is most uneven and resolve whether the issue sits in tool design, access, or adoption.",
        weakAlignedNextStep:
          "Reset the role technology should play in the operating model, focusing first on the workflows where system friction is driving manual effort or inconsistent execution.",
        weakGapNextStep:
          "Begin with the areas where system limitations are creating the most uneven experience, then redesign the process and supporting technology together rather than in isolation.",
      };

    case "governance_controls":
      return {
        strongAlignedObservation:
          "Governance and controls appear to be well established, with a shared view that responsibilities, standards, and decision boundaries are reasonably clear.",
        strongGapObservation:
          "Governance and controls are generally viewed as sound, but differences in experience suggest that they may not be operating with the same discipline in all parts of the organisation.",
        moderateAlignedObservation:
          "Governance and controls appear present but not especially mature, indicating a working level of oversight without strong evidence of consistent operational discipline.",
        moderateGapObservation:
          "Governance and controls look uneven, with some parts of the organisation experiencing clearer structure and oversight than others.",
        weakAlignedObservation:
          "There is broad recognition that governance and controls are underdeveloped, leaving too much ambiguity around ownership, standards, or decision-making.",
        weakGapObservation:
          "Governance and controls are both weak and inconsistently experienced, suggesting that some areas are operating with much less clarity or discipline than others.",
        strongAlignedImplication:
          "Strong governance supports consistency, reduces risk, and makes it easier to scale operations without losing control.",
        strongGapImplication:
          "If governance is stronger in some areas than others, the organisation may still be carrying hidden control risk beneath an otherwise solid structure.",
        moderateAlignedImplication:
          "A moderate control environment may work under stable conditions but can become fragile under scale, change, or increased regulatory pressure.",
        moderateGapImplication:
          "Uneven governance creates inconsistent decision-making and makes it harder to rely on process discipline across the whole organisation.",
        weakAlignedImplication:
          "Where governance is broadly weak, process quality and control are likely depending too heavily on individuals rather than on a reliable operating framework.",
        weakGapImplication:
          "This creates a material risk that standards are being applied differently across teams, reducing both consistency and confidence in the operating model.",
        strongAlignedNextStep:
          "Maintain the strength of the control environment by keeping ownership clear, reviewing governance regularly, and ensuring standards remain practical as the organisation evolves.",
        strongGapNextStep:
          "Tighten areas where governance discipline appears less consistent so that ownership, approvals, and control expectations operate to the same standard across the organisation.",
        moderateAlignedNextStep:
          "Strengthen governance by making decision rights, ownership, and control points more explicit and easier to apply in day-to-day operations.",
        moderateGapNextStep:
          "Focus on the points where governance appears to differ most and bring those areas back to a common model of ownership, oversight, and control.",
        weakAlignedNextStep:
          "Prioritise a clearer governance framework for core people operations, defining who owns decisions, what standards apply, and how compliance with process will be maintained.",
        weakGapNextStep:
          "Begin by stabilising the areas with the weakest control discipline, ensuring ownership, approval routes, and operational standards are explicit and consistently followed.",
      };

    case "knowledge_access":
      return {
        strongAlignedObservation:
          "Knowledge and guidance appear to be readily accessible, with respondent groups broadly agreeing that people can find the information they need without unnecessary effort.",
        strongGapObservation:
          "Knowledge access is generally seen as effective, but some groups appear to be benefiting from greater clarity or easier access than others.",
        moderateAlignedObservation:
          "Knowledge access appears workable but not especially strong, suggesting that information exists but may not always be easy to find, use, or trust.",
        moderateGapObservation:
          "Knowledge access is inconsistent, with some groups experiencing more clarity and self-service support than others.",
        weakAlignedObservation:
          "There is broad agreement that knowledge access is weak, with guidance likely fragmented, hard to find, or too dependent on direct HR intervention.",
        weakGapObservation:
          "Knowledge access is both weak and uneven, implying that self-service quality differs significantly across roles, teams, or business areas.",
        strongAlignedImplication:
          "Strong knowledge access reduces dependence on HR for routine clarification and helps managers and employees navigate processes with more confidence.",
        strongGapImplication:
          "If access to guidance varies by group, the organisation may still be relying on informal knowledge networks rather than a fully dependable knowledge model.",
        moderateAlignedImplication:
          "A moderate knowledge environment may still generate avoidable queries and inconsistent interpretation of policy or process.",
        moderateGapImplication:
          "Uneven knowledge access tends to create uneven process outcomes, as some groups are better equipped than others to self-serve or make decisions confidently.",
        weakAlignedImplication:
          "Weak knowledge access typically drives repeated questions, dependence on tribal knowledge, and slower handling of routine people matters.",
        weakGapImplication:
          "This kind of inconsistency makes self-service unreliable and increases the likelihood of different teams interpreting the same issue in different ways.",
        strongAlignedNextStep:
          "Continue improving knowledge quality by keeping guidance current, easy to navigate, and aligned to the real questions managers and employees are asking.",
        strongGapNextStep:
          "Reduce unevenness in knowledge access by reviewing where guidance is easier to find or use for some groups than others and standardising the experience.",
        moderateAlignedNextStep:
          "Strengthen knowledge access by simplifying the information architecture, reducing ambiguity in guidance, and improving discoverability for common process questions.",
        moderateGapNextStep:
          "Focus first on the areas where access to guidance appears most uneven and make the route to trusted information more consistent across the organisation.",
        weakAlignedNextStep:
          "Rebuild the knowledge model around the highest-volume employee and manager needs, ensuring guidance is practical, current, and easy to find without relying on HR escalation.",
        weakGapNextStep:
          "Start by identifying where people are most dependent on informal advice, then create a more consistent self-service model with clearer ownership and better guidance structure.",
      };

    default:
      return {
        strongAlignedObservation:
          `${dimensionLabel} is consistently experienced as effective across respondent groups, suggesting that this part of the operating model is both well established and reliably applied.`,
        strongGapObservation:
          `${dimensionLabel} is generally viewed positively, but experience differs across respondent groups, indicating that execution is stronger in some parts of the organisation than others.`,
        moderateAlignedObservation:
          `${dimensionLabel} appears functional but not especially mature, suggesting that the basics are in place without this yet standing out as a clear operational strength.`,
        moderateGapObservation:
          `${dimensionLabel} shows a mixed picture, with noticeable variation in how it is experienced across HR, managers, and leadership.`,
        weakAlignedObservation:
          `${dimensionLabel} is broadly experienced as a weak area, indicating a shared view that this part of the operating model is not currently working as effectively as it should.`,
        weakGapObservation:
          `${dimensionLabel} appears both weak and uneven, suggesting that this area lacks both maturity and consistency in execution.`,
        strongAlignedImplication:
          "This provides a useful operational foundation and can be used as a benchmark when improving weaker areas.",
        strongGapImplication:
          "Although the area is broadly effective, variation in lived experience may still be creating avoidable inconsistency.",
        moderateAlignedImplication:
          "This may be workable today, but is unlikely to remain robust if organisational complexity increases.",
        moderateGapImplication:
          "Different experiences across respondent groups increase the risk of inconsistent execution and uneven outcomes.",
        weakAlignedImplication:
          "A shared view of weakness creates a clear case for improvement and suggests this issue is visible across the organisation.",
        weakGapImplication:
          "Low effectiveness combined with uneven experience typically creates operational friction and makes scale harder to achieve.",
        strongAlignedNextStep:
          `Maintain the strength in ${dimensionLabel} and use it as a reference point when improving adjacent areas of the operating model.`,
        strongGapNextStep:
          `Reduce variation in ${dimensionLabel} by tightening execution discipline, clarifying ownership, and bringing local practice closer to the intended model.`,
        moderateAlignedNextStep:
          `Strengthen ${dimensionLabel} by improving clarity, simplifying execution, and making the operating approach more resilient at scale.`,
        moderateGapNextStep:
          `Prioritise the areas where ${dimensionLabel} is being experienced differently and align expectations, process handling, and ownership more closely.`,
        weakAlignedNextStep:
          `Redesign ${dimensionLabel} with a clearer operating model, better definition of ownership, and more consistent day-to-day execution.`,
        weakGapNextStep:
          `Begin with the parts of ${dimensionLabel} showing the greatest inconsistency, and establish clearer standards, ownership, and execution discipline.`,
      };
  }
}

function buildObservation(insight: DimensionInsight): string {
  const lens = getNarrativeLens(insight.dimensionKey, insight.dimensionLabel);

  if (insight.status === "strong" && insight.alignment === "aligned") {
    return lens.strongAlignedObservation;
  }

  if (insight.status === "strong") {
    return lens.strongGapObservation;
  }

  if (insight.status === "moderate" && insight.alignment === "aligned") {
    return lens.moderateAlignedObservation;
  }

  if (insight.status === "moderate") {
    return lens.moderateGapObservation;
  }

  if (insight.alignment === "aligned") {
    return lens.weakAlignedObservation;
  }

  return lens.weakGapObservation;
}

function buildImplication(insight: DimensionInsight): string {
  const lens = getNarrativeLens(insight.dimensionKey, insight.dimensionLabel);

  if (insight.status === "strong" && insight.alignment === "aligned") {
    return lens.strongAlignedImplication;
  }

  if (insight.status === "strong") {
    return lens.strongGapImplication;
  }

  if (insight.status === "moderate" && insight.alignment === "aligned") {
    return lens.moderateAlignedImplication;
  }

  if (insight.status === "moderate") {
    return lens.moderateGapImplication;
  }

  if (insight.alignment === "aligned") {
    return lens.weakAlignedImplication;
  }

  return lens.weakGapImplication;
}

function buildRecommendedNextStep(insight: DimensionInsight): string {
  const lens = getNarrativeLens(insight.dimensionKey, insight.dimensionLabel);

  if (insight.status === "strong" && insight.alignment === "aligned") {
    return lens.strongAlignedNextStep;
  }

  if (insight.status === "strong") {
    return lens.strongGapNextStep;
  }

  if (insight.status === "moderate" && insight.alignment === "aligned") {
    return lens.moderateAlignedNextStep;
  }

  if (insight.status === "moderate") {
    return lens.moderateGapNextStep;
  }

  if (insight.alignment === "aligned") {
    return lens.weakAlignedNextStep;
  }

  return lens.weakGapNextStep;
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
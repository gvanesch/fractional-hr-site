export type AnswerValue = 1 | 2 | 3 | 4 | 5;

export type Question = {
  id: number;
  dimension: string;
  text: string;
};

export type ResultBand = {
  label: string;
  summary: string;
  freeInsights: string[];
};

export type DiagnosticAnswers = Record<number, AnswerValue | undefined>;

export type DiagnosticDimensionScore = {
  label: string;
  score: number;
};

export type DiagnosticResult = {
  rawScore: number;
  score: number;
  band: ResultBand;
  dimensions: DiagnosticDimensionScore[];
  lowestDimensions: DiagnosticDimensionScore[];
};

export type SavedDiagnosticState = {
  answers: DiagnosticAnswers;
  result: DiagnosticResult;
  completedAt: string;
};

export type AdvisorBrief = {
  headline: string;
  overallAssessment: string;
  keyThemes: string[];
  likelyOperationalRisks: string[];
  discussionPrompts: string[];
  suggestedFocusAreas: string[];

  executiveReadout: string;
  likelyFrictionPoints: string[];
  businessImplications: string[];
  whatTypicallyHappensNext: string[];
  first30DayPriorities: string[];
  recommendedCallAngle: string;

  callOpening: string;
  conversationFlow: string[];
  conversionPositioning: string[];

  patternDiagnosis: string;
  likelyOperatingModel: string;
  rootCauseHypotheses: string[];
  whatToValidateInCall: string[];
  qualificationSignals: string[];
  nextBestOffer: string;
  callObjective: string;
};

export const questions: Question[] = [
  {
    id: 1,
    dimension: "Process clarity",
    text: "Our core HR processes are documented clearly enough that managers and HR team members can follow them consistently.",
  },
  {
    id: 2,
    dimension: "Consistency",
    text: "Employees and managers generally receive a consistent HR experience across teams, departments, or locations.",
  },
  {
    id: 3,
    dimension: "Service access",
    text: "Employees know where to go for HR help, and the route for getting support is clear.",
  },
  {
    id: 4,
    dimension: "Ownership",
    text: "Ownership for key HR processes, approvals, and escalations is clearly defined.",
  },
  {
    id: 5,
    dimension: "Onboarding",
    text: "Onboarding is structured and repeatable rather than depending heavily on individual managers or manual follow-up.",
  },
  {
    id: 6,
    dimension: "Technology alignment",
    text: "Our HR systems and workflows reflect how work actually happens in the organisation.",
  },
  {
    id: 7,
    dimension: "Knowledge and self-service",
    text: "Managers and employees can find answers to common HR questions without always needing direct help from HR.",
  },
  {
    id: 8,
    dimension: "Operational capacity",
    text: "HR has enough structure and capacity to improve operations proactively, rather than spending most of its time reacting.",
  },
  {
    id: 9,
    dimension: "Data and handoffs",
    text: "HR data, handoffs, and workflow transitions are reliable enough that work does not regularly get stuck, repeated, or corrected.",
  },
  {
    id: 10,
    dimension: "Change resilience",
    text: "When the organisation grows or changes, HR processes can adapt without becoming confusing or chaotic.",
  },
];

export function scoreToBand(score: number): ResultBand {
  if (score <= 24) {
    return {
      label: "Emerging Foundations",
      summary:
        "The Health Check suggests that some core HR foundations may still be taking shape. As the organisation grows, clearer structure, ownership, and more consistent operating discipline would usually help the model run more confidently.",
      freeInsights: [
        "Some core HR processes may still benefit from clearer structure or more consistent documentation.",
        "Execution may currently depend too heavily on individual judgement, manager capability, or manual follow-through.",
        "Strengthening the foundations now would usually make service delivery more consistent and easier to scale.",
      ],
    };
  }

  if (score <= 49) {
    return {
      label: "Developing Structure",
      summary:
        "The Health Check suggests that useful HR foundations are in place, but they may not yet be landing consistently across the organisation. Greater clarity in process, ownership, or service delivery would usually help the model run more reliably as demands increase.",
      freeInsights: [
        "Some important HR processes may still rely on workarounds or individual interpretation more than they should.",
        "Clearer ownership and more consistent operating discipline would likely strengthen delivery across teams.",
        "There is likely a good base to build from, with targeted improvements that could make the model feel more dependable.",
      ],
    };
  }

  if (score <= 74) {
    return {
      label: "Structured but Improving",
      summary:
        "The Health Check suggests that many HR operational foundations are already in place. The opportunity is more likely to sit in refinement, consistency, and resilience, so the model continues to hold well as the organisation grows or becomes more complex.",
      freeInsights: [
        "A solid base appears to be in place, even if some areas would still benefit from tighter execution or clearer alignment.",
        "Targeted improvements in handoffs, service access, or process discipline would likely strengthen confidence in how HR runs.",
        "This looks less like a need for wholesale change and more like a need for focused improvement in the right areas.",
      ],
    };
  }

  return {
    label: "Operationally Mature",
    summary:
      "The Health Check suggests that HR operations are broadly well structured and able to support the organisation effectively. The opportunity is more likely to be in optimisation, resilience, and maintaining quality as priorities, scale, or complexity continue to evolve.",
    freeInsights: [
      "Core foundations appear to be well established and operating with a good degree of consistency.",
      "The strongest gains are likely to come from targeted refinement rather than major structural change.",
      "This result points more towards optimisation and scale-readiness than foundational rebuild.",
    ],
  };
}

export function getDimensionScores(
  answers: DiagnosticAnswers,
): DiagnosticDimensionScore[] {
  return questions.map((question) => ({
    label: question.dimension,
    score: Number(answers[question.id] ?? 0),
  }));
}

export function calculateRawScore(answers: DiagnosticAnswers): number {
  return questions.reduce((sum, question) => {
    return sum + Number(answers[question.id] ?? 0);
  }, 0);
}

export function calculatePercentageScore(rawScore: number): number {
  return Math.round(((rawScore - 10) / 40) * 100);
}

export function calculateDiagnosticResult(
  answers: DiagnosticAnswers,
): DiagnosticResult {
  const rawScore = calculateRawScore(answers);
  const score = calculatePercentageScore(rawScore);
  const band = scoreToBand(score);
  const dimensions = getDimensionScores(answers).sort((a, b) => a.score - b.score);
  const lowestDimensions = dimensions.slice(0, 3);

  return {
    rawScore,
    score,
    band,
    dimensions,
    lowestDimensions,
  };
}

function getThemeNarrative(label: string): string {
  switch (label) {
    case "Process clarity":
      return "Core HR processes may not yet be consistently defined or documented, which can create variability in execution.";
    case "Consistency":
      return "Employees and managers may be experiencing HR support differently across teams, managers, or locations.";
    case "Service access":
      return "Routes into HR support may not be sufficiently clear, making it harder for employees and managers to know where to go.";
    case "Ownership":
      return "Responsibility for key process steps, approvals, or escalations may not always be fully clear.";
    case "Onboarding":
      return "Onboarding may rely too heavily on individual managers or manual follow-up, increasing variability in experience.";
    case "Technology alignment":
      return "Systems and workflows may not yet reflect operational reality closely enough, creating workarounds or friction.";
    case "Knowledge and self-service":
      return "Common HR guidance may be difficult to access, increasing reliance on direct HR support for routine queries.";
    case "Operational capacity":
      return "The HR team may be spending most of its time reacting, leaving limited capacity for process improvement.";
    case "Data and handoffs":
      return "Workflow transitions, ownership handoffs, or data quality issues may be contributing to rework or delays.";
    case "Change resilience":
      return "The current operating approach may begin to show strain when the organisation grows or changes.";
    default:
      return `${label} may be contributing to operational friction and would benefit from further review.`;
  }
}

function getRiskNarratives(labels: string[]): string[] {
  const risks = labels.map((label) => {
    switch (label) {
      case "Process clarity":
        return "Managers may interpret HR processes differently, increasing inconsistency and reliance on informal guidance.";
      case "Consistency":
        return "Employee experience may vary across the organisation, which can undermine confidence in HR service delivery.";
      case "Service access":
        return "Queries may reach HR through ad hoc channels, reducing visibility and making prioritisation harder.";
      case "Ownership":
        return "Delays or escalations may occur because accountability is not always obvious at each process step.";
      case "Onboarding":
        return "New joiner experience may be uneven, with avoidable administrative gaps or missed handoffs.";
      case "Technology alignment":
        return "Manual workarounds may increase operational drag and reduce confidence in underlying processes.";
      case "Knowledge and self-service":
        return "HR may remain overloaded with repeat queries that could otherwise be handled through clearer self-service.";
      case "Operational capacity":
        return "Improvement work may be repeatedly deferred because urgent operational demands consume available capacity.";
      case "Data and handoffs":
        return "Work may be duplicated, corrected, or delayed where transitions between teams or systems are weak.";
      case "Change resilience":
        return "Growth, restructuring, or policy change may expose fragility in the current HR operating model.";
      default:
        return `${label} may introduce operational inefficiency or inconsistency if left unresolved.`;
    }
  });

  return Array.from(new Set(risks));
}

function getDiscussionPrompt(label: string): string {
  switch (label) {
    case "Process clarity":
      return "Which HR processes are most reliant on tribal knowledge rather than documented steps?";
    case "Consistency":
      return "Where do managers or employees appear to receive different HR experiences today?";
    case "Service access":
      return "How do employees and managers currently know where to go for HR support?";
    case "Ownership":
      return "Where do approvals, escalations, or handoffs tend to become unclear?";
    case "Onboarding":
      return "How structured is onboarding across different teams or hiring managers?";
    case "Technology alignment":
      return "Where do current HR systems fail to reflect how work actually happens?";
    case "Knowledge and self-service":
      return "What proportion of routine HR queries could be solved through stronger guidance or self-service?";
    case "Operational capacity":
      return "How much HR capacity is spent on reactive work versus improvement activity?";
    case "Data and handoffs":
      return "Where does work most often get stuck, repeated, or corrected?";
    case "Change resilience":
      return "What happens to HR operations when the business scales, restructures, or changes policy quickly?";
    default:
      return `What is currently driving friction in ${label.toLowerCase()}?`;
  }
}

function getSuggestedFocusAreas(labels: string[]): string[] {
  const focusAreas = labels.map((label) => {
    switch (label) {
      case "Process clarity":
        return "Clarify and document core HR processes and decision points.";
      case "Consistency":
        return "Improve consistency of execution across teams, managers, or geographies.";
      case "Service access":
        return "Create clearer entry points and service pathways for HR support.";
      case "Ownership":
        return "Strengthen accountability for process steps, approvals, and escalations.";
      case "Onboarding":
        return "Standardise onboarding foundations while preserving manager flexibility where useful.";
      case "Technology alignment":
        return "Reduce manual workarounds by aligning systems and workflows more closely to real operations.";
      case "Knowledge and self-service":
        return "Strengthen knowledge management and self-service guidance for common HR queries.";
      case "Operational capacity":
        return "Create more room for proactive improvement by reducing avoidable operational drag.";
      case "Data and handoffs":
        return "Tighten workflow transitions, handoffs, and data reliability across the employee lifecycle.";
      case "Change resilience":
        return "Improve the resilience of HR processes under growth or organisational change.";
      default:
        return `Review and strengthen ${label.toLowerCase()}.`;
    }
  });

  return Array.from(new Set(focusAreas));
}

function getFrictionPointNarrative(label: string): string {
  switch (label) {
    case "Process clarity":
      return "Managers and HR team members may be handling similar people processes differently, with too much reliance on informal interpretation.";
    case "Consistency":
      return "The employee and manager experience is likely varying by team, manager, or geography rather than feeling reliably repeatable.";
    case "Service access":
      return "HR support may be coming through mixed channels such as Slack, email, direct messages, or ad hoc conversations, making demand harder to manage.";
    case "Ownership":
      return "Work may stall around approvals, escalations, or exceptions because it is not always obvious who owns each step.";
    case "Onboarding":
      return "New joiner setup and early experience may be uneven, especially where manager capability or follow-through differs.";
    case "Technology alignment":
      return "People are likely compensating for system gaps with spreadsheets, side processes, manual reminders, or duplicated work.";
    case "Knowledge and self-service":
      return "The HR team may be absorbing avoidable volume because answers to common questions are not easy to find or trusted enough to use.";
    case "Operational capacity":
      return "The team may be trapped in a reactive cycle, with improvement work repeatedly deprioritised in favour of immediate case handling.";
    case "Data and handoffs":
      return "Breakdowns are likely appearing where work moves between teams, systems, or owners, creating rework and delays.";
    case "Change resilience":
      return "Operational strain may become most visible during growth, restructuring, policy shifts, or leadership change.";
    default:
      return `${label} is likely contributing to day-to-day operating friction.`;
  }
}

function getBusinessImplicationNarrative(label: string): string {
  switch (label) {
    case "Process clarity":
      return "Operational ambiguity can increase manager dependency on HR and make execution quality harder to control at scale.";
    case "Consistency":
      return "Inconsistent HR delivery can reduce confidence in the function and create uneven employee experience across the organisation.";
    case "Service access":
      return "Unclear access routes can hide true demand, increase response variability, and make service delivery harder to improve.";
    case "Ownership":
      return "Weak accountability can slow decisions, increase escalations, and create avoidable friction between HR, managers, and other stakeholders.";
    case "Onboarding":
      return "An inconsistent onboarding experience can slow time to effectiveness and create early confidence gaps for new hires.";
    case "Technology alignment":
      return "Misaligned systems can create persistent manual drag, lower trust in HR operations, and limit scale efficiency.";
    case "Knowledge and self-service":
      return "Low self-service maturity can keep HR tied up in repeat transactions rather than higher-value advisory or improvement work.";
    case "Operational capacity":
      return "A reactive operating model reduces the organisation’s ability to improve before issues become more visible and expensive.";
    case "Data and handoffs":
      return "Poor handoffs and unreliable data can create avoidable correction work and weaken confidence in process control.";
    case "Change resilience":
      return "Low resilience increases the risk that growth or change will expose structural weaknesses at exactly the point the business needs stability.";
    default:
      return `${label} may be constraining operational confidence and scalability.`;
  }
}

function getTypicalNextNarrative(label: string): string {
  switch (label) {
    case "Process clarity":
      return "Exception handling tends to increase because people are forced to interpret process rather than execute it consistently.";
    case "Consistency":
      return "Leadership often starts noticing that outcomes differ by team even when policies appear similar on paper.";
    case "Service access":
      return "HR support requests become harder to triage and prioritise because work enters through too many informal routes.";
    case "Ownership":
      return "Escalations grow because stakeholders become unsure who should decide, approve, or resolve specific issues.";
    case "Onboarding":
      return "As hiring grows, gaps become more visible and onboarding quality becomes more dependent on individual manager discipline.";
    case "Technology alignment":
      return "The business adds more workarounds instead of solving the underlying workflow design problem.";
    case "Knowledge and self-service":
      return "HR volume increases without proportional value because the same routine questions keep returning to the team.";
    case "Operational capacity":
      return "The backlog of improvement work grows while the team stays busy solving symptoms rather than root causes.";
    case "Data and handoffs":
      return "More work gets repeated, corrected, or chased because transitions are not reliable enough first time.";
    case "Change resilience":
      return "Periods of change start to feel disproportionately disruptive because the operating model is not absorbing variation well.";
    default:
      return `The organisation may see more visible friction if ${label.toLowerCase()} remains under-developed.`;
  }
}

function getFirst30DayPriority(label: string): string {
  switch (label) {
    case "Process clarity":
      return "Map and simplify the highest-friction HR processes so managers and HR are working from the same baseline.";
    case "Consistency":
      return "Identify where execution differs most by team or manager and define a tighter minimum service standard.";
    case "Service access":
      return "Clarify the main routes into HR support and reduce unnecessary channel sprawl.";
    case "Ownership":
      return "Make ownership of approvals, exceptions, and escalations explicit for the most business-critical workflows.";
    case "Onboarding":
      return "Stabilise the core onboarding journey with clearer handoffs, checklists, and manager expectations.";
    case "Technology alignment":
      return "Pinpoint the biggest system-driven workarounds and prioritise the ones creating the most operational drag.";
    case "Knowledge and self-service":
      return "Surface the most repeated HR questions and turn them into clearer, usable guidance.";
    case "Operational capacity":
      return "Create protected space for a small number of operational fixes that reduce repeat reactive workload.";
    case "Data and handoffs":
      return "Tighten one or two failure-prone handoff points across the employee lifecycle and reduce correction work.";
    case "Change resilience":
      return "Stress-test where current HR processes are most likely to break under growth or organisational change.";
    default:
      return `Prioritise practical stabilisation in ${label.toLowerCase()}.`;
  }
}

function buildExecutiveReadout(
  result: DiagnosticResult,
  weakestLabels: string[],
): string {
  const weakestSummary = weakestLabels.join(", ");

  if (result.band.label === "Emerging Foundations") {
    return `This lead’s responses suggest an HR operating model that is still forming in several important areas. The score pattern points to operational dependence on individual knowledge, manual coordination, and inconsistent execution. The weakest areas (${weakestSummary}) are likely creating friction for managers and employees already, and that friction is likely to become more visible as complexity grows.`;
  }

  if (result.band.label === "Developing Structure") {
    return `This lead appears to have some useful HR structure in place, but not yet enough consistency or control to make delivery feel reliably scalable. The weakest areas (${weakestSummary}) suggest that process discipline, ownership, or service design may not yet be fully embedded across the organisation.`;
  }

  if (result.band.label === "Structured but Improving") {
    return `This lead’s responses suggest a reasonably solid HR operating base with identifiable pressure points rather than wholesale breakdown. The weakest areas (${weakestSummary}) are likely where operational confidence drops, especially across handoffs, service execution, or periods of growth and change.`;
  }

  return `This lead appears broadly operationally mature, but the weakest areas (${weakestSummary}) may still be limiting efficiency, resilience, or scale readiness. The call should likely focus less on foundational repair and more on optimisation, cross-functional friction, and reducing hidden drag.`;
}

function buildOperatingModelHypothesis(
  result: DiagnosticResult,
  weakestLabels: string[],
): {
  patternDiagnosis: string;
  likelyOperatingModel: string;
  rootCauseHypotheses: string[];
} {
  if (result.band.label === "Emerging Foundations") {
    return {
      patternDiagnosis:
        "The operating model is not yet holding through structure. Work is moving, but it relies heavily on individual interpretation, informal ownership, and manual coordination rather than a clearly defined path.",
      likelyOperatingModel: "Ad hoc, people-dependent HR model",
      rootCauseHypotheses: [
        "Core processes are not yet defined tightly enough to remove reliance on individual judgement",
        "Ownership is implicit rather than explicit at key decision and handoff points",
        "The service model has evolved reactively rather than through deliberate design",
      ],
    };
  }

  if (result.band.label === "Developing Structure") {
    return {
      patternDiagnosis:
        "The operating model exists in parts, but it is not landing consistently in execution. Work is still relying on interpretation, informal ownership, and uneven access rather than a repeatable, controlled path.",
      likelyOperatingModel:
        "Partially structured, manager-dependent HR model",
      rootCauseHypotheses: [
        "Ownership exists in theory but is not explicit enough where work actually moves",
        "Process knowledge is held in individuals rather than embedded in the workflow",
        "Access into HR is not designed as a single front door, creating fragmented demand",
      ],
    };
  }

  if (result.band.label === "Structured but Improving") {
    return {
      patternDiagnosis:
        "The operating model is broadly in place, but it is carrying avoidable friction in how work flows, transfers, and is experienced. The structure exists, but it is not yet as clean or efficient as it could be.",
      likelyOperatingModel: "Structured but friction-heavy HR model",
      rootCauseHypotheses: [
        "Handoffs and ownership boundaries are not tight enough to prevent rework or delay",
        "Service access and routing are adding unnecessary complexity to otherwise defined processes",
        "Systems or workflows are not fully aligned to how work actually happens in practice",
      ],
    };
  }

  return {
    patternDiagnosis:
      "The operating model is broadly mature, but there are still areas where hidden inefficiency, cross-functional friction, or suboptimal design are limiting scale efficiency.",
    likelyOperatingModel: "Mature but optimisation-constrained HR model",
    rootCauseHypotheses: [
      "Some workflows are carrying legacy design choices that no longer match current scale or complexity",
      "Cross-functional handoffs are not fully optimised, creating hidden coordination cost",
      "Opportunities for simplification or automation have not yet been fully realised",
    ],
  };
}

function buildOverallAssessment(result: DiagnosticResult): string {
  if (result.band.label === "Emerging Foundations") {
    return "The organisation is likely operating with some important HR foundations still evolving. There may be meaningful dependence on individual knowledge, informal process handling, or manual coordination.";
  }

  if (result.band.label === "Developing Structure") {
    return "The organisation appears to have some useful HR operational structure in place, but it is likely not yet fully embedded across all workflows or stakeholder groups.";
  }

  if (result.band.label === "Structured but Improving") {
    return "The organisation appears to have a reasonably solid HR operating base, with targeted opportunities to reduce friction, strengthen consistency, and improve resilience.";
  }

  return "The organisation appears operationally mature overall, with the greatest opportunity likely in optimisation, scalability, and the refinement of more complex cross-functional workflows.";
}

function buildRecommendedCallAngle(
  result: DiagnosticResult,
  weakestLabels: string[],
): string {
  const joined = weakestLabels.join(", ");

  if (result.band.label === "Emerging Foundations") {
    return `Position the conversation around stabilising core HR operations before friction becomes more expensive. Anchor on ${joined}, then explore where managers are compensating for missing structure today.`;
  }

  if (result.band.label === "Developing Structure") {
    return `Position the conversation around moving from partial structure to repeatable operational confidence. Use ${joined} to explore where current processes exist in theory but are not landing consistently in practice.`;
  }

  if (result.band.label === "Structured but Improving") {
    return `Position the conversation around targeted improvement rather than wholesale redesign. Use ${joined} to identify where a relatively solid model is still creating avoidable drag or inconsistency.`;
  }

  return `Position the conversation around optimisation and scale-readiness. Use ${joined} to test where a mature HR operation still has hidden inefficiency, fragile handoffs, or opportunities for smarter service design.`;
}

function buildCallOpening(
  result: DiagnosticResult,
  weakestLabels: string[],
): string {
  const weakestSummary = weakestLabels.join(", ");

  if (result.band.label === "Emerging Foundations") {
    return `Based on your Health Check, the signal is that some core HR foundations may still be forming, particularly around ${weakestSummary}. What would be useful first is understanding where that is creating the most day-to-day friction for you today, rather than jumping straight into solutions.`;
  }

  if (result.band.label === "Developing Structure") {
    return `Based on your Health Check, it looks like you already have some useful structure in place, but it may not be landing consistently in practice, particularly around ${weakestSummary}. Before discussing solutions, it would be useful to understand where that is being felt most clearly today.`;
  }

  if (result.band.label === "Structured but Improving") {
    return `Based on your Health Check, the picture looks reasonably solid overall, but there are a few areas, particularly ${weakestSummary}, where the model may still be creating avoidable friction. It would be useful to start by understanding where that is most visible in practice.`;
  }

  return `Based on your Health Check, the operating model looks broadly mature, but there are still some areas, particularly ${weakestSummary}, where optimisation or hidden friction may be worth exploring. A useful place to start is understanding where you feel the current model is not working quite as cleanly as it should.`;
}

function buildConversationFlow(
  result: DiagnosticResult,
  weakestLabels: string[],
): string[] {
  const firstWeakest = weakestLabels[0]?.toLowerCase() || "the operating model";

  if (result.band.label === "Emerging Foundations") {
    return [
      "Start by confirming whether the result broadly resonates with their current experience.",
      `Explore where ${firstWeakest} is creating the most visible friction for managers, employees, or HR today.`,
      "Test whether issues are localised or showing up across multiple teams or workflows.",
      "Understand what is currently being handled through informal judgement or manual workaround.",
      "Close by framing the value of moving from reactive handling to more deliberate operating design.",
    ];
  }

  if (result.band.label === "Developing Structure") {
    return [
      "Start by validating where the current structure is helping and where it is falling short in practice.",
      "Explore where inconsistency is most visible across teams, managers, or locations.",
      "Test whether current issues reflect partial process design, weak ownership, or lack of operational discipline.",
      "Understand whether the organisation sees the problem clearly but lacks prioritised action.",
      "Close by positioning the diagnostic as a way to validate root causes before broader improvement work.",
    ];
  }

  if (result.band.label === "Structured but Improving") {
    return [
      "Start by confirming which parts of the current HR model already feel dependable.",
      "Explore where targeted friction continues to absorb disproportionate effort.",
      "Test whether pain points sit in handoffs, service execution, or manager experience rather than total process absence.",
      "Understand what is currently preventing more focused optimisation.",
      "Close by framing the diagnostic as a way to identify the highest-value improvements rather than redesign everything.",
    ];
  }

  return [
    "Start by confirming where the current operating model already feels strong and dependable.",
    "Explore where hidden inefficiency, cross-functional friction, or fragile handoffs still remain.",
    "Test whether the organisation is dealing with refinement opportunities rather than foundational gaps.",
    "Understand which pressure points matter enough to prioritise now.",
    "Close by positioning the diagnostic as a way to separate normal variation from material optimisation opportunity.",
  ];
}

function buildConversionPositioning(
  result: DiagnosticResult,
  weakestLabels: string[],
): string[] {
  const weakestSummary = weakestLabels.join(", ");

  if (result.band.label === "Emerging Foundations") {
    return [
      "Position the Diagnostic Assessment as a way to validate whether current friction is structural rather than isolated.",
      `Use ${weakestSummary} to show why greater clarity across HR, managers, and leadership would reduce guesswork.`,
      "Position the Sprint as focused execution once the highest-friction issues are clear.",
    ];
  }

  if (result.band.label === "Developing Structure") {
    return [
      "Position the Diagnostic Assessment as the next step to distinguish between partial structure and true operational consistency.",
      `Use ${weakestSummary} to show where cross-role insight would sharpen prioritisation.`,
      "Position the Sprint as targeted follow-through once the most material gaps are clear.",
    ];
  }

  if (result.band.label === "Structured but Improving") {
    return [
      "Position the Diagnostic Assessment as a way to identify the most valuable targeted improvements rather than broad redesign.",
      `Use ${weakestSummary} to explain how deeper evidence across roles would help sequence action.`,
      "Position the Sprint as a practical route to act on a smaller number of high-value improvements.",
    ];
  }

  return [
    "Position the Diagnostic Assessment as a way to validate optimisation opportunities across multiple stakeholder viewpoints.",
    `Use ${weakestSummary} to test whether current concerns are meaningful enough to prioritise now.`,
    "Position the Sprint as a focused route to remove hidden drag once the best improvement opportunities are confirmed.",
  ];
}

function buildWhatToValidateInCall(
  weakestLabels: string[],
): string[] {
  return weakestLabels.map((label) => {
    switch (label) {
      case "Process clarity":
        return "Whether managers are relying on verbal guidance or precedent rather than one clear documented path.";
      case "Consistency":
        return "Whether similar situations are producing materially different outcomes across teams or managers.";
      case "Service access":
        return "Whether requests are coming through multiple informal channels instead of one controlled route.";
      case "Ownership":
        return "Whether approvals, escalations, or exceptions regularly pause because accountability is not explicit.";
      case "Onboarding":
        return "Whether onboarding quality changes meaningfully depending on manager discipline or local process.";
      case "Technology alignment":
        return "Whether spreadsheets, side processes, or manual reminders are compensating for weak system support.";
      case "Knowledge and self-service":
        return "Whether HR is acting as a translation layer for routine questions that should be self-served.";
      case "Operational capacity":
        return "Whether the team is trapped in reactive case handling with little room for operational improvement.";
      case "Data and handoffs":
        return "Whether work is being corrected, re-entered, or chased when it moves between teams or systems.";
      case "Change resilience":
        return "Whether new ways of working are launched but not embedded consistently enough to hold.";
      default:
        return `Whether ${label.toLowerCase()} is creating visible day-to-day operating drag.`;
    }
  });
}

function buildQualificationSignals(
  result: DiagnosticResult,
  weakestLabels: string[],
): string[] {
  const signals: string[] = [];

  if (result.band.label === "Emerging Foundations") {
    signals.push(
      "Strong fit if they describe HR as reactive, manager-dependent, or inconsistent.",
      "Strong fit if growth is exposing weaknesses they previously managed informally.",
    );
  }

  if (result.band.label === "Developing Structure") {
    signals.push(
      "Strong fit if they say process exists on paper but does not land consistently in practice.",
      "Strong fit if leadership senses friction but cannot yet isolate the structural cause.",
    );
  }

  if (result.band.label === "Structured but Improving") {
    signals.push(
      "Strong fit if they already have a functioning model but want clearer prioritisation on where to tighten it.",
      "Strong fit if friction is concentrated in handoffs, service design, or execution discipline rather than full redesign need.",
    );
  }

  if (result.band.label === "Operationally Mature") {
    signals.push(
      "Strong fit if they are optimisation-minded and can point to specific drag, inefficiency, or scale-readiness concerns.",
    );
  }

  if (
    weakestLabels.includes("Process clarity") ||
    weakestLabels.includes("Ownership") ||
    weakestLabels.includes("Service access")
  ) {
    signals.push(
      "Qualification improves if they describe confusion around who owns work, how it moves, or where requests should enter HR.",
    );
  }

  return Array.from(new Set(signals));
}

function buildNextBestOffer(result: DiagnosticResult): string {
  if (result.band.label === "Emerging Foundations") {
    return "Position the HR Operations Diagnostic Assessment as the best next step to validate whether the visible friction is structural and to clarify the first priorities before execution support.";
  }

  if (result.band.label === "Developing Structure") {
    return "Position the HR Operations Diagnostic Assessment as the best next step to separate partial structure from true operational consistency and to sharpen prioritisation.";
  }

  if (result.band.label === "Structured but Improving") {
    return "Position the HR Operations Diagnostic Assessment as the best next step if they want stronger evidence on where targeted improvement will have the greatest operational return.";
  }

  return "Position the conversation around whether a targeted diagnostic review is justified to confirm meaningful optimisation opportunity before any broader work.";
}

function buildCallObjective(result: DiagnosticResult): string {
  if (result.band.label === "Emerging Foundations") {
    return "Confirm that the visible strain is structural, make it legible to the buyer, and create appetite for a deeper diagnostic rather than rushing into tactical fixes.";
  }

  if (result.band.label === "Developing Structure") {
    return "Help the buyer see the gap between having some structure and having a model that runs consistently enough to scale, then move them toward the deeper diagnostic.";
  }

  if (result.band.label === "Structured but Improving") {
    return "Clarify where targeted friction is absorbing disproportionate effort and create a case for a more structured diagnostic to sequence the right improvements.";
  }

  return "Test whether there is enough meaningful operating drag to justify deeper review and move the conversation toward focused optimisation rather than broad redesign.";
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items));
}

export function buildAdvisorBrief(result: DiagnosticResult): AdvisorBrief {
  const weakestLabels = result.lowestDimensions.map((dimension) => dimension.label);

  const headline = `${result.band.label}: score ${result.score}/100`;
  const overallAssessment = buildOverallAssessment(result);

  const keyThemes = weakestLabels.map(getThemeNarrative);
  const likelyOperationalRisks = getRiskNarratives(weakestLabels);
  const discussionPrompts = weakestLabels.map(getDiscussionPrompt);
  const suggestedFocusAreas = getSuggestedFocusAreas(weakestLabels);

  const executiveReadout = buildExecutiveReadout(result, weakestLabels);
  const likelyFrictionPoints = dedupe(weakestLabels.map(getFrictionPointNarrative));
  const businessImplications = dedupe(
    weakestLabels.map(getBusinessImplicationNarrative),
  );
  const whatTypicallyHappensNext = dedupe(
    weakestLabels.map(getTypicalNextNarrative),
  );
  const first30DayPriorities = dedupe(
    weakestLabels.map(getFirst30DayPriority),
  );
  const recommendedCallAngle = buildRecommendedCallAngle(
    result,
    weakestLabels,
  );

  const callOpening = buildCallOpening(result, weakestLabels);
  const conversationFlow = buildConversationFlow(result, weakestLabels);
  const conversionPositioning = buildConversionPositioning(
    result,
    weakestLabels,
  );

  const {
    patternDiagnosis,
    likelyOperatingModel,
    rootCauseHypotheses,
  } = buildOperatingModelHypothesis(result, weakestLabels);

  const whatToValidateInCall = buildWhatToValidateInCall(weakestLabels);
  const qualificationSignals = buildQualificationSignals(result, weakestLabels);
  const nextBestOffer = buildNextBestOffer(result);
  const callObjective = buildCallObjective(result);

  return {
    headline,
    overallAssessment,
    keyThemes,
    likelyOperationalRisks,
    discussionPrompts,
    suggestedFocusAreas,
    executiveReadout,
    likelyFrictionPoints,
    businessImplications,
    whatTypicallyHappensNext,
    first30DayPriorities,
    recommendedCallAngle,
    callOpening,
    conversationFlow,
    conversionPositioning,
    patternDiagnosis,
    likelyOperatingModel,
    rootCauseHypotheses,
    whatToValidateInCall,
    qualificationSignals,
    nextBestOffer,
    callObjective,
  };
}
export type PublicDiagnosticInterpretation = {
  overallAssessment: string;
  focusAreas: string[];
  whatTypicallyHappensNext: string[];
};

export function buildPublicDiagnosticInterpretation(
  result: DiagnosticResult,
): PublicDiagnosticInterpretation {
  const weakestLabels = result.lowestDimensions.map((dimension) => dimension.label);

  return {
    overallAssessment: buildOverallAssessment(result),
    focusAreas: getSuggestedFocusAreas(weakestLabels),
    whatTypicallyHappensNext: dedupe(
      weakestLabels.map(getTypicalNextNarrative),
    ),
  };
}
export function buildDiagnosticState(
  answers: DiagnosticAnswers,
): SavedDiagnosticState {
  return {
    answers,
    result: calculateDiagnosticResult(answers),
    completedAt: new Date().toISOString(),
  };
}
export type QuestionnaireType =
  | "hr"
  | "manager"
  | "leadership"
  | "client_fact_pack";

export type DimensionKey =
  | "process_clarity"
  | "consistency"
  | "service_access"
  | "ownership"
  | "systems_enablement"
  | "knowledge_self_service"
  | "operational_capacity"
  | "case_management"
  | "data_handoffs"
  | "change_resilience";

export type ScoreAnswerValue = 1 | 2 | 3 | 4 | 5;

export type QuestionKind = "score" | "probe";

export type BaseQuestion = {
  id: string;
  questionnaireType: QuestionnaireType;
  dimension: DimensionKey;
  kind: QuestionKind;
  prompt: string;
  helpText?: string;
  order: number;
  required: boolean;
};

export type ScoreQuestion = BaseQuestion & {
  kind: "score";
  scaleMin: 1;
  scaleMax: 5;
};

export type ProbeQuestion = BaseQuestion & {
  kind: "probe";
  maxLength?: number;
};

export type ClientDiagnosticQuestion = ScoreQuestion | ProbeQuestion;

export type DimensionDefinition = {
  key: DimensionKey;
  label: string;
  description: string;
};

export const dimensionDefinitions: DimensionDefinition[] = [
  {
    key: "process_clarity",
    label: "Process clarity",
    description:
      "How clearly core HR operational processes are defined, understood, and followed.",
  },
  {
    key: "consistency",
    label: "Consistency",
    description:
      "How reliably HR services and decisions are delivered across teams, managers, and locations.",
  },
  {
    key: "service_access",
    label: "Service access",
    description:
      "How easy it is for employees and managers to know where to go and how to get HR support.",
  },
  {
    key: "ownership",
    label: "Ownership",
    description:
      "How clearly responsibilities are understood across HR, managers, leaders, and supporting teams.",
  },
  {
    key: "systems_enablement",
    label: "Systems enablement",
    description:
      "How well systems and tools support efficient HR delivery, visibility, and control.",
  },
  {
    key: "knowledge_self_service",
    label: "Knowledge & self-service",
    description:
      "How effectively guidance, documentation, and self-service resources support the organisation.",
  },
  {
    key: "operational_capacity",
    label: "Operational capacity",
    description:
      "Whether the HR operating model has sufficient bandwidth, capability, and resilience to deliver well.",
  },
  {
    key: "case_management",
    label: "Case management",
    description:
      "How effectively HR issues, requests, and exceptions are tracked, routed, and resolved.",
  },
  {
    key: "data_handoffs",
    label: "Data & handoffs",
    description:
      "How well data moves between people, processes, and systems without friction or error.",
  },
  {
    key: "change_resilience",
    label: "Change resilience",
    description:
      "How well the organisation absorbs, communicates, and operationalises change in HR processes and services.",
  },
];

function scoreQuestion(
  questionnaireType: QuestionnaireType,
  dimension: DimensionKey,
  order: number,
  prompt: string,
  helpText?: string,
): ScoreQuestion {
  return {
    id: `${questionnaireType}_${dimension}_score_${order}`,
    questionnaireType,
    dimension,
    kind: "score",
    prompt,
    helpText,
    order,
    required: true,
    scaleMin: 1,
    scaleMax: 5,
  };
}

function probeQuestion(
  questionnaireType: QuestionnaireType,
  dimension: DimensionKey,
  order: number,
  prompt: string,
  helpText?: string,
): ProbeQuestion {
  return {
    id: `${questionnaireType}_${dimension}_probe_${order}`,
    questionnaireType,
    dimension,
    kind: "probe",
    prompt,
    helpText,
    order,
    required: false,
    maxLength: 1200,
  };
}

function buildDimensionQuestions(
  questionnaireType: QuestionnaireType,
  dimension: DimensionKey,
  scorePrompts: [string, string, string],
  probePrompt: string,
  probeHelpText?: string,
): ClientDiagnosticQuestion[] {
  return [
    scoreQuestion(questionnaireType, dimension, 1, scorePrompts[0]),
    scoreQuestion(questionnaireType, dimension, 2, scorePrompts[1]),
    scoreQuestion(questionnaireType, dimension, 3, scorePrompts[2]),
    probeQuestion(questionnaireType, dimension, 4, probePrompt, probeHelpText),
  ];
}

const hrQuestions: ClientDiagnosticQuestion[] = [
  ...buildDimensionQuestions(
    "hr",
    "process_clarity",
    [
      "Our core HR processes are documented clearly enough that HR team members can follow them consistently.",
      "There is shared understanding within HR of how key people processes should operate in practice.",
      "When exceptions arise, HR can usually determine the right process path without significant confusion.",
    ],
    "Where do you see the most confusion, ambiguity, or rework in HR processes today?",
    "Optional: share examples of processes that are unclear, interpreted differently, or regularly create friction.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "consistency",
    [
      "Employees and managers generally receive a consistent HR experience across teams, departments, or locations.",
      "Similar HR issues are usually handled in a broadly consistent way across the organisation.",
      "Variation in HR service delivery is understood and controlled rather than accidental.",
    ],
    "Where do you see inconsistency in HR service delivery or decision-making?",
    "Optional: note where experiences differ between teams, countries, business units, or managers.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "service_access",
    [
      "Employees and managers generally know where to go for different types of HR help.",
      "The routes into HR support are clear enough that requests usually reach the right place.",
      "People can access HR support without needing to rely heavily on informal relationships or escalation.",
    ],
    "What makes HR support easy or difficult to access in practice?",
    "Optional: include examples of unclear entry points, routing confusion, or over-reliance on certain individuals.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "ownership",
    [
      "Responsibilities between HR, managers, leaders, and other support teams are generally well understood.",
      "There is sufficient clarity on who owns key decisions, actions, and follow-up in people processes.",
      "Work is not regularly delayed because ownership is unclear or disputed.",
    ],
    "Where is ownership most unclear across people processes?",
    "Optional: describe where actions stall, responsibilities overlap, or accountability gets pushed around.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "systems_enablement",
    [
      "Our HR systems and tools support delivery of core processes effectively.",
      "The current systems landscape gives HR sufficient visibility to manage work and outcomes well.",
      "Manual workarounds exist, but they do not routinely undermine effective HR service delivery.",
    ],
    "What system or tooling issues create the biggest operational drag for HR?",
    "Optional: include system gaps, duplicate entry, reporting issues, or low-confidence tooling.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "knowledge_self_service",
    [
      "Guidance and process knowledge are documented well enough to support consistent HR delivery.",
      "Employees and managers can usually find the guidance they need without excessive support from HR.",
      "Knowledge content is maintained well enough that people broadly trust it.",
    ],
    "Where does knowledge or self-service break down most often?",
    "Optional: include outdated guidance, missing content, poor findability, or low confidence in documents.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "operational_capacity",
    [
      "The HR operating model has sufficient capacity to deliver core services reliably.",
      "The HR team has the right mix of bandwidth and capability for the demands placed on it.",
      "Pressure spikes can usually be absorbed without a major decline in service quality.",
    ],
    "Where is operational capacity most stretched today?",
    "Optional: include workload peaks, skill gaps, key-person dependency, or backlog pressure.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "case_management",
    [
      "HR requests and issues are tracked in a structured way from intake through resolution.",
      "There is sufficient visibility into open cases, ownership, status, and ageing.",
      "The current approach helps HR prioritise and resolve work in a controlled way.",
    ],
    "What are the biggest weaknesses in current case handling or issue tracking?",
    "Optional: include gaps in logging, prioritisation, routing, handoffs, or closure discipline.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "data_handoffs",
    [
      "Data moves between HR processes and systems with an acceptable level of accuracy and control.",
      "Handoffs between HR and other teams are usually clear enough to avoid repeated errors or delays.",
      "Manual intervention is required at times, but it does not routinely compromise outcomes.",
    ],
    "Where do data issues or operational handoffs create the most friction?",
    "Optional: include examples involving payroll, recruitment, IT, finance, or local HR teams.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "change_resilience",
    [
      "HR processes can adapt to change without causing significant operational instability.",
      "Changes to policy, systems, or ways of working are usually communicated clearly enough to be implemented well.",
      "The organisation can absorb change in HR delivery without creating sustained confusion or service deterioration.",
    ],
    "What tends to make change difficult to land in HR operations?",
    "Optional: include communication gaps, lack of training, weak ownership, or competing priorities.",
  ),
];

const managerQuestions: ClientDiagnosticQuestion[] = [
  ...buildDimensionQuestions(
    "manager",
    "process_clarity",
    [
      "The people processes I need to follow as a manager are generally clear.",
      "I usually know what is expected of me in common people situations such as hiring, onboarding, performance, or absence.",
      "When something more complex arises, the process path is usually understandable.",
    ],
    "Where are people processes least clear from a manager perspective?",
    "Optional: share where the process feels confusing, inconsistent, or difficult to follow.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "consistency",
    [
      "Managers broadly receive a consistent level of HR support across the organisation.",
      "Similar people situations are handled in a reasonably consistent way.",
      "The quality of HR guidance does not vary significantly depending on where you are or who you speak to.",
    ],
    "Where do you notice inconsistency in HR support or decision-making?",
    "Optional: include examples across teams, business areas, geographies, or HR contacts.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "service_access",
    [
      "It is generally clear where to go when I need HR help or guidance.",
      "I can usually access HR support without excessive effort or delay.",
      "The routes into HR support work well enough for day-to-day manager needs.",
    ],
    "What makes HR support easy or difficult for managers to access?",
    "Optional: include unclear channels, slow routing, or dependency on informal contacts.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "ownership",
    [
      "It is generally clear what sits with me as a manager versus what sits with HR or others.",
      "People issues usually move forward without confusion over who owns the next step.",
      "Responsibilities across manager, HR, and leadership are clear enough to avoid avoidable delay.",
    ],
    "Where is ownership least clear in the people processes you use?",
    "Optional: describe where action stalls or where accountability feels blurred.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "systems_enablement",
    [
      "The systems and tools I use for people processes generally support me well.",
      "HR-related systems are usable enough that they do not create unnecessary friction in common manager tasks.",
      "Where systems are imperfect, the workarounds are still manageable.",
    ],
    "What system or tooling issues most affect managers in people processes?",
    "Optional: include poor usability, duplicate steps, unclear workflows, or lack of visibility.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "knowledge_self_service",
    [
      "I can usually find the people guidance I need without having to ask HR directly.",
      "Available guidance is clear enough to help me complete common people tasks with confidence.",
      "I generally trust the HR guidance and self-service information available to me.",
    ],
    "Where does manager self-service or guidance fall short?",
    "Optional: include outdated content, poor searchability, missing guidance, or low confidence in information.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "operational_capacity",
    [
      "HR support is available with enough capacity to meet common manager needs.",
      "When I need support on people matters, the response is generally timely enough.",
      "Pressure on HR operations does not regularly leave managers without the support they need.",
    ],
    "Where do you see signs that HR capacity is stretched?",
    "Optional: include delays, backlog, over-reliance on certain people, or uneven support.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "case_management",
    [
      "People issues are generally handled in a structured and controlled way once raised.",
      "I usually have enough visibility on progress, ownership, and next steps when a people issue is in motion.",
      "Escalations or more complex matters are managed with appropriate follow-through.",
    ],
    "What weaknesses do you see in how people issues are managed once raised?",
    "Optional: include poor follow-up, lack of visibility, inconsistent handling, or delays.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "data_handoffs",
    [
      "Information needed for people processes is generally passed between teams and systems effectively.",
      "Operational handoffs do not regularly create avoidable delay or error in manager-led processes.",
      "I can usually trust that once I complete my part, the next stage will move as expected.",
    ],
    "Where do handoffs or data issues create the biggest problems for managers?",
    "Optional: include payroll, onboarding, changes, approvals, or coordination between teams.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "change_resilience",
    [
      "Changes to HR processes, systems, or policies are usually communicated clearly enough for managers to act on them.",
      "When people processes change, managers are generally supported well enough to adapt.",
      "Operational changes do not regularly leave managers unclear on what to do next.",
    ],
    "What makes changes to people processes difficult for managers to absorb?",
    "Optional: include poor communication, limited training, unclear ownership, or frequent changes.",
  ),
];

const leadershipQuestions: ClientDiagnosticQuestion[] = [
  ...buildDimensionQuestions(
    "leadership",
    "process_clarity",
    [
      "Core people processes are defined clearly enough to support effective organisational execution.",
      "The organisation appears to have sufficient clarity in how key HR processes are expected to operate.",
      "Lack of process clarity does not appear to be a major constraint on performance.",
    ],
    "Where do you believe process ambiguity creates the greatest organisational risk or drag?",
    "Optional: focus on areas where lack of clarity affects scale, control, speed, or confidence.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "consistency",
    [
      "The organisation delivers a reasonably consistent people experience across different parts of the business.",
      "Variation in HR service delivery appears to be broadly controlled rather than structural.",
      "The way people issues are handled feels sufficiently consistent to support trust and confidence.",
    ],
    "Where do you see the greatest inconsistency in the people experience?",
    "Optional: include leadership visibility on differences across teams, locations, or business units.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "service_access",
    [
      "Employees and managers appear able to access HR support through reasonably clear channels.",
      "The organisation has a sufficiently clear model for how HR support is accessed.",
      "Access to HR support does not appear to be a recurring barrier to effective people operations.",
    ],
    "Where do you believe access to HR support is weakest?",
    "Optional: note where access, responsiveness, or clarity seems to break down.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "ownership",
    [
      "Accountability across leaders, managers, HR, and other functions is sufficiently clear in people processes.",
      "Important people matters generally move forward without major confusion over ownership.",
      "The current operating model creates adequate clarity on decision rights and execution responsibilities.",
    ],
    "Where does ownership appear most blurred or contested in people operations?",
    "Optional: include where unclear accountability affects pace, quality, or risk.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "systems_enablement",
    [
      "The current systems landscape appears to support the organisation’s HR operations reasonably well.",
      "Technology supports sufficient visibility, control, and scalability across people processes.",
      "System limitations do not appear to be materially constraining execution in most areas.",
    ],
    "Where do you believe systems or tooling are constraining HR operational performance?",
    "Optional: include scale issues, reporting gaps, control weaknesses, or fragmented tooling.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "knowledge_self_service",
    [
      "The organisation appears to provide sufficient guidance and self-service support for common people needs.",
      "Managers and employees seem to have reasonable access to usable people information and guidance.",
      "Weaknesses in knowledge or self-service do not appear to be a major source of operational friction.",
    ],
    "Where do you think guidance or self-service is least effective today?",
    "Optional: include concerns around dependency on HR, poor usability, or knowledge trust.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "operational_capacity",
    [
      "The HR operating model appears to have broadly sufficient capacity for current business needs.",
      "The organisation has enough HR operational capability and resilience to support delivery effectively.",
      "Pressure on HR operations does not appear to be creating sustained risk for the business.",
    ],
    "Where do you believe HR operating capacity is most at risk?",
    "Optional: include scale strain, capability gaps, key-person dependency, or reactive load.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "case_management",
    [
      "The organisation appears to have a sufficiently controlled approach to handling HR cases and issues.",
      "People-related issues seem to move through the organisation with reasonable tracking and oversight.",
      "The current approach appears adequate for managing risk, responsiveness, and follow-through.",
    ],
    "What concerns do you have, if any, about how people issues are tracked and managed?",
    "Optional: include visibility, escalation, risk management, ageing, or governance concerns.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "data_handoffs",
    [
      "Data and process handoffs across HR and connected functions appear to work with reasonable control.",
      "The organisation seems able to move people data through operational workflows without frequent breakdowns.",
      "Weaknesses in handoffs or data flow do not appear to create major recurring business risk.",
    ],
    "Where do data flow or cross-functional handoffs appear weakest?",
    "Optional: include joins between HR, payroll, finance, IT, talent acquisition, or local teams.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "change_resilience",
    [
      "The organisation appears capable of landing changes in people processes without major operational disruption.",
      "Changes to policy, systems, or operating model are generally absorbed effectively enough.",
      "The business shows reasonable resilience when adapting people operations to new requirements.",
    ],
    "What tends to make operational change in HR difficult to land well?",
    "Optional: include competing priorities, weak change discipline, communication gaps, or adoption risk.",
  ),
];

const clientFactPackQuestions: ClientDiagnosticQuestion[] = [
  ...buildDimensionQuestions(
    "client_fact_pack",
    "process_clarity",
    [
      "Core HR processes are broadly defined and documented at an organisational level.",
      "There is a common understanding of how key people processes are expected to work.",
      "Process ambiguity is not seen as a major organisation-wide issue.",
    ],
    "What should we know about process design, documentation, or known ambiguity in HR operations?",
    "Optional: include recent redesigns, undocumented processes, regional differences, or known pain points.",
  ),
  ...buildDimensionQuestions(
    "client_fact_pack",
    "consistency",
    [
      "The organisation aims to deliver a broadly consistent people experience across its structure.",
      "Leaders would generally expect similar people matters to be handled in a similar way.",
      "Uncontrolled variation in HR service delivery is not considered a major issue.",
    ],
    "What should we know about inconsistency across regions, business units, or manager populations?",
    "Optional: include known variation drivers, exceptions, or recent concerns.",
  ),
  ...buildDimensionQuestions(
    "client_fact_pack",
    "service_access",
    [
      "The organisation has defined channels or routes for accessing HR support.",
      "Employees and managers are generally expected to know how to access the right HR support.",
      "Access to HR support is not widely viewed as a major barrier.",
    ],
    "What should we know about service channels, access routes, or current service model challenges?",
    "Optional: include shared services, HRBPs, ticketing, inboxes, portals, or local support structures.",
  ),
  ...buildDimensionQuestions(
    "client_fact_pack",
    "ownership",
    [
      "The organisation has a broadly defined split of responsibilities across HR, managers, and leaders.",
      "Decision rights in people processes are generally intended to be clear.",
      "Unclear ownership is not widely accepted as part of the operating model.",
    ],
    "What should we know about governance, decision rights, or ownership tensions in people operations?",
    "Optional: include HRBP/shared services splits, COE boundaries, or manager-accountability issues.",
  ),
  ...buildDimensionQuestions(
    "client_fact_pack",
    "systems_enablement",
    [
      "The current HR systems landscape is expected to support core operational delivery.",
      "Technology is intended to provide adequate visibility and enablement for key people processes.",
      "System fragmentation or tooling limitations are not viewed as universally blocking.",
    ],
    "What should we know about the HR tech landscape and its main operational limitations?",
    "Optional: include HRIS, case tools, knowledge tools, integrations, reporting, or manual workarounds.",
  ),
  ...buildDimensionQuestions(
    "client_fact_pack",
    "knowledge_self_service",
    [
      "The organisation has some level of documented guidance or self-service support for people processes.",
      "Managers and employees are expected to use available guidance before escalating routine questions.",
      "Knowledge content is intended to support consistency and reduce avoidable dependency on HR.",
    ],
    "What should we know about knowledge content, policy guidance, or self-service maturity?",
    "Optional: include ownership of content, quality concerns, search issues, or channel sprawl.",
  ),
  ...buildDimensionQuestions(
    "client_fact_pack",
    "operational_capacity",
    [
      "The current HR operating model is broadly intended to meet business demand.",
      "There is reasonable confidence in the team’s ability to deliver core services at current scale.",
      "Capacity or capability constraints are not expected to be pervasive across all areas.",
    ],
    "What should we know about workload pressure, team structure, capability gaps, or dependency risk?",
    "Optional: include open roles, growth pressure, transformation load, seasonal peaks, or regional strain.",
  ),
  ...buildDimensionQuestions(
    "client_fact_pack",
    "case_management",
    [
      "The organisation has a defined or semi-defined approach to managing HR requests and cases.",
      "There is some level of visibility or control over issue handling and escalation.",
      "Case handling is expected to support responsiveness and risk management adequately.",
    ],
    "What should we know about current request handling, case tools, or issue governance?",
    "Optional: include ticketing maturity, SLAs, backlog, visibility, triage, or escalation controls.",
  ),
  ...buildDimensionQuestions(
    "client_fact_pack",
    "data_handoffs",
    [
      "People data and process handoffs are expected to move through the organisation with reasonable control.",
      "Cross-functional coordination in people processes is generally intended to work effectively.",
      "Data flow weaknesses are not assumed to be systemic across all operations.",
    ],
    "What should we know about integrations, manual handoffs, or known data friction points?",
    "Optional: include payroll, finance, IT, TA, onboarding, offboarding, or regional operations.",
  ),
  ...buildDimensionQuestions(
    "client_fact_pack",
    "change_resilience",
    [
      "The organisation is generally able to implement changes to people processes or systems when needed.",
      "Change in HR operations is usually supported with some level of communication and rollout discipline.",
      "The operating model is expected to absorb change without major ongoing instability.",
    ],
    "What should we know about recent or upcoming changes affecting HR operations?",
    "Optional: include growth, restructuring, system change, policy change, acquisitions, or leadership shifts.",
  ),
];

export const clientDiagnosticQuestionBank: ClientDiagnosticQuestion[] = [
  ...hrQuestions,
  ...managerQuestions,
  ...leadershipQuestions,
  ...clientFactPackQuestions,
];

export const questionnaireTypes: QuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
  "client_fact_pack",
];

export const dimensionKeys: DimensionKey[] = [
  "process_clarity",
  "consistency",
  "service_access",
  "ownership",
  "systems_enablement",
  "knowledge_self_service",
  "operational_capacity",
  "case_management",
  "data_handoffs",
  "change_resilience",
];

export function getQuestionsForQuestionnaireType(
  questionnaireType: QuestionnaireType,
): ClientDiagnosticQuestion[] {
  return clientDiagnosticQuestionBank
    .filter((question) => question.questionnaireType === questionnaireType)
    .sort((a, b) => {
      if (a.dimension === b.dimension) {
        return a.order - b.order;
      }

      return (
        dimensionKeys.indexOf(a.dimension) - dimensionKeys.indexOf(b.dimension)
      );
    });
}

export function getQuestionsForDimension(
  questionnaireType: QuestionnaireType,
  dimension: DimensionKey,
): ClientDiagnosticQuestion[] {
  return clientDiagnosticQuestionBank
    .filter(
      (question) =>
        question.questionnaireType === questionnaireType &&
        question.dimension === dimension,
    )
    .sort((a, b) => a.order - b.order);
}

export function getDimensionDefinition(
  dimension: DimensionKey,
): DimensionDefinition | undefined {
  return dimensionDefinitions.find((item) => item.key === dimension);
}

export function getScoreQuestions(
  questionnaireType: QuestionnaireType,
  dimension: DimensionKey,
): ScoreQuestion[] {
  return getQuestionsForDimension(questionnaireType, dimension).filter(
    (question): question is ScoreQuestion => question.kind === "score",
  );
}

export function getProbeQuestion(
  questionnaireType: QuestionnaireType,
  dimension: DimensionKey,
): ProbeQuestion | undefined {
  return getQuestionsForDimension(questionnaireType, dimension).find(
    (question): question is ProbeQuestion => question.kind === "probe",
  );
}
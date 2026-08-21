export type QuestionnaireType = "hr" | "manager" | "leadership";

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
      "How clearly core HR processes are defined and can be navigated from start to finish.",
  },
  {
    key: "consistency",
    label: "Consistency",
    description:
      "How consistently HR processes, decisions and services are applied across the organisation.",
  },
  {
    key: "service_access",
    label: "Service access",
    description:
      "How easily employees and managers can identify, access and navigate the right route to HR support.",
  },
  {
    key: "ownership",
    label: "Ownership",
    description:
      "How clearly responsibilities, decision rights and accountability are defined across HR processes.",
  },
  {
    key: "systems_enablement",
    label: "Systems enablement",
    description:
      "How effectively systems enable efficient, connected and visible HR operations.",
  },
  {
    key: "knowledge_self_service",
    label: "Knowledge & self-service",
    description:
      "How effectively guidance and self-service resources enable people to find reliable information and resolve routine needs.",
  },
  {
    key: "operational_capacity",
    label: "Operational capacity",
    description:
      "How effectively the HR operating model sustains service delivery, absorbs demand and maintains capacity for improvement.",
  },
  {
    key: "case_management",
    label: "Case management",
    description:
      "How effectively HR requests and issues are captured, routed, owned, tracked and controlled through to resolution.",
  },
  {
    key: "data_handoffs",
    label: "Data & handoffs",
    description:
      "How reliably information and work are handed between people, teams and process stages without loss, error or rework.",
  },
  {
    key: "change_resilience",
    label: "Change resilience",
    description:
      "How effectively changes to HR processes and services are understood, adopted, reinforced and sustained.",
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
  scorePrompts: [string, string, string, string, string],
  probePrompt: string,
  probeHelpText?: string,
): ClientDiagnosticQuestion[] {
  return [
    scoreQuestion(questionnaireType, dimension, 1, scorePrompts[0]),
    scoreQuestion(questionnaireType, dimension, 2, scorePrompts[1]),
    scoreQuestion(questionnaireType, dimension, 3, scorePrompts[2]),
    scoreQuestion(questionnaireType, dimension, 4, scorePrompts[3]),
    scoreQuestion(questionnaireType, dimension, 5, scorePrompts[4]),
    probeQuestion(questionnaireType, dimension, 6, probePrompt, probeHelpText),
  ];
}

const hrQuestions: ClientDiagnosticQuestion[] = [
  ...buildDimensionQuestions(
    "hr",
    "process_clarity",
    [
      "Core HR processes have a clear sequence of steps from start to finish.",
      "Routine HR scenarios can be completed using a clear and standard process.",
      "When work moves between teams or roles, the next action and owner are clear.",
      "Non-standard or complex scenarios have a clear route for how they should be handled.",
      "Managers and employees can navigate core HR processes confidently with minimal clarification from HR.",
    ],
    "Where are HR processes least clear or most difficult to navigate today?",
    "Optional: include unclear process steps, difficult handoffs, uncertain ownership, complex exceptions, or areas that require repeated clarification.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "consistency",
    [
      "Similar people situations are handled using consistent principles across the organisation.",
      "Managers apply HR policies and decision criteria in a broadly consistent way.",
      "Employees and managers receive a broadly consistent HR experience across teams, functions and locations.",
      "Standard HR processes are applied consistently across the organisation.",
      "Exceptions are handled using clear and consistent principles.",
    ],
    "Where does inconsistency create the most operational difficulty today?",
    "Optional: include differences in policy interpretation, manager decisions, service delivery, employee experience, or how exceptions are handled.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "service_access",
    [
      "Employees and managers know where to start when they need HR support.",
      "Different types of HR requests have clear and appropriate routes for support.",
      "The available HR support routes are easy to navigate for common requests.",
      "Employees and managers generally use the intended HR support channels.",
      "People trust that using the appropriate support route will connect them with the right help.",
    ],
    "Where is access to HR support most difficult or confusing today?",
    "Optional: include unclear entry points, overlapping channels, inappropriate routing, bypass behaviour, or areas where users do not trust the available routes.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "ownership",
    [
      "Responsibilities across HR, managers and supporting teams are clearly defined in core HR processes.",
      "It is clear who has decision authority and who provides input or support.",
      "When work moves between roles or teams, responsibility for the next action transfers clearly.",
      "Each HR process has clear accountability for ensuring work progresses to completion.",
      "Ownership remains clear in complex or cross-functional people matters.",
    ],
    "Where is ownership or accountability least clear in HR operations today?",
    "Optional: include unclear role responsibilities, decision rights, handoffs, stalled work, or cross-functional processes where accountability becomes blurred.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "systems_enablement",
    [
      "HR systems support the way core HR processes are intended to operate.",
      "Users can complete common HR activities efficiently and confidently in the systems available to them.",
      "Routine workflow, approvals and handoffs are supported efficiently by the systems available.",
      "Information moves effectively between systems without unnecessary re-entry, reconciliation or duplication.",
      "The systems provide reliable visibility of the current status and information needed to manage HR work.",
    ],
    "Where do systems or tooling create the greatest operational friction in HR processes?",
    "Optional: include poor usability, workflow gaps, manual workarounds, duplicate entry, weak integration, limited automation or unreliable visibility.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "knowledge_self_service",
    [
      "Employees and managers can easily find the HR guidance they need.",
      "It is clear which guidance or source should be relied on for a particular HR matter.",
      "HR guidance is practical and clear enough to help users take the right action in real situations.",
      "Employees and managers can trust that HR guidance is accurate and up to date.",
      "Available guidance and self-service resources enable routine needs to be resolved with minimal HR intervention.",
    ],
    "Where does HR guidance or self-service fall short today?",
    "Optional: include difficulty finding information, uncertainty about the authoritative source, unclear or impractical guidance, outdated content, or routine needs that still require HR intervention.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "operational_capacity",
    [
      "The HR operating model has sufficient capacity to meet current demand.",
      "Work is completed within reasonable timeframes and sustained backlog is kept under control.",
      "HR has enough capacity to balance planned work with urgent or reactive demand.",
      "Routine demand is managed efficiently so that HR capacity remains available for higher-value work.",
      "There is sufficient capacity to improve processes and services while continuing to meet day-to-day demand.",
    ],
    "Where is HR capacity most constrained today?",
    "Optional: include sustained backlog, urgent demand, repeat queries, manual work, skill gaps, peaks in workload, or lack of capacity for improvement.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "case_management",
    [
      "HR requests and issues are captured in a structured and consistent way.",
      "Requests and cases are routed efficiently to the right person or team.",
      "Ownership remains clear as a case moves through different stages or teams.",
      "The current status and next action for a case are visible to the people who need them.",
      "Case activity is managed through defined processes that provide appropriate control and traceability.",
    ],
    "Where does case handling or issue tracking break down most often?",
    "Optional: include inconsistent intake, poor routing, unclear ownership, limited status visibility, weak traceability, repeated chasing or work being managed outside defined processes.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "data_handoffs",
    [
      "It is clear what information is required before work can move to the next stage.",
      "Handoffs between teams or roles include the information needed to continue the process.",
      "Information passed between teams or systems is generally accurate and reliable.",
      "Handoffs give the receiving team enough information to continue confidently.",
      "Information quality at handoff supports work progressing correctly the first time.",
    ],
    "Where do poor-quality handoffs create the most rework or delay?",
    "Optional: include unclear input requirements, incomplete information, repeated checking, inaccurate data, returned work or weak handoffs between teams.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "change_resilience",
    [
      "Changes to HR processes or services are explained clearly, including what is changing and what people need to do differently.",
      "Managers and employees receive enough support to adopt new processes or ways of working confidently.",
      "Changes are adopted consistently across relevant teams and locations.",
      "New processes and behaviours are reinforced after launch through ongoing communication, support or follow-up.",
      "New ways of working become established as normal operating practice over time.",
    ],
    "Where is operational change hardest to embed in HR processes today?",
    "Optional: include unclear communication, weak enablement, inconsistent adoption, limited reinforcement, competing priorities, or areas where old ways of working return.",
  ),
];

const managerQuestions: ClientDiagnosticQuestion[] = [
  ...buildDimensionQuestions(
    "manager",
    "process_clarity",
    [
      "The HR processes I use have a clear sequence of steps from start to finish.",
      "Routine HR situations can be handled using a clear and standard process.",
      "When work moves between me, HR or another team, the next action and owner are clear.",
      "Non-standard or complex HR situations have a clear route for how they should be handled.",
      "I can navigate the HR processes I use confidently with minimal clarification from HR.",
    ],
    "Where are HR processes least clear or most difficult for you to navigate?",
    "Optional: include unclear process steps, difficult handoffs, uncertain ownership, complex exceptions, or areas that require repeated clarification.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "consistency",
    [
      "Similar people situations are handled using consistent principles across the organisation.",
      "Managers have clear enough guidance to apply HR policies and decision criteria consistently.",
      "The HR support I receive is broadly consistent regardless of team, function or location.",
      "Standard HR processes are applied consistently across the organisation.",
      "When exceptions arise, there are clear and consistent principles for how they should be handled.",
    ],
    "Where do you experience the greatest inconsistency in HR processes or support?",
    "Optional: include different interpretations, different manager approaches, variation across teams or locations, or unclear handling of exceptions.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "service_access",
    [
      "I know where to start when I need HR support or guidance.",
      "Different types of HR requests have clear and appropriate routes for support.",
      "I can identify the right route for my request without unnecessary confusion.",
      "I can use the intended HR support channels confidently for most requests.",
      "I trust that using the appropriate support route will connect me with the right help.",
    ],
    "Where do you find it most difficult to access the right HR support?",
    "Optional: include unclear routes, difficulty knowing where to start, being passed between teams, or needing to rely on informal contacts.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "ownership",
    [
      "It is clear what I am responsible for as a manager and what sits with HR or other teams.",
      "It is clear when I have decision authority and when HR or another role owns the decision.",
      "When work moves between me, HR or another team, responsibility for the next action transfers clearly.",
      "There is clear accountability for ensuring HR matters continue to progress to completion.",
      "Ownership remains clear in complex situations involving several teams or roles.",
    ],
    "Where is it least clear who should own or decide an HR matter?",
    "Optional: include situations where responsibility moves between managers, HR or other teams, or where progress stalls because ownership is unclear.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "systems_enablement",
    [
      "The systems I use support the way HR processes are intended to work.",
      "I can complete common HR activities efficiently and confidently in the systems available to me.",
      "Routine workflow and approvals are supported efficiently by the systems available to me.",
      "Information already provided is reused effectively without unnecessary re-entry across systems.",
      "I can rely on the systems to show the current status and information I need.",
    ],
    "Where do the systems you use make HR processes harder than they need to be?",
    "Optional: include difficult navigation, manual steps, duplicate entry, disconnected systems, unclear status, or activities that require work outside the system.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "knowledge_self_service",
    [
      "I can easily find the HR guidance I need.",
      "It is clear which guidance or source I should rely on for a particular HR matter.",
      "The HR guidance available to me is practical and clear enough to help me take the right action.",
      "I can trust that the HR guidance available to me is accurate and up to date.",
      "Available guidance and self-service resources allow me to resolve routine needs with minimal HR intervention.",
    ],
    "Where is HR guidance or self-service least useful to you?",
    "Optional: include information that is difficult to find, uncertainty about which source to trust, guidance that is hard to apply, outdated content, or routine matters that still require HR support.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "operational_capacity",
    [
      "HR support is available when I need it for common HR matters.",
      "HR requests and issues usually progress within reasonable timeframes.",
      "HR support remains effective when urgent or unexpected matters arise.",
      "HR support provides timely progress and updates on requests and issues.",
      "The HR service appears able to support both day-to-day needs and periods of increased demand.",
    ],
    "Where do you most experience the effects of limited HR capacity?",
    "Optional: include delays, difficulty accessing support, repeated chasing, slower handling during busy periods, or urgent matters disrupting normal service.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "case_management",
    [
      "HR requests and issues are handled through a clear and structured process once raised.",
      "Requests are routed to the right person or team without unnecessary delay.",
      "Ownership remains clear while an HR issue is being handled.",
      "I have enough visibility of status and next steps while an HR issue is in progress.",
      "HR issues are managed through a reliable process with appropriate control and traceability.",
    ],
    "Where do you experience the greatest difficulty once an HR issue or request has been raised?",
    "Optional: include poor routing, unclear ownership, limited updates, repeated chasing, unclear next steps, or reliance on informal follow-up.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "data_handoffs",
    [
      "It is clear what information I need to provide before an HR process can move to the next stage.",
      "When I hand work to HR or another team, the information required for the next step is clear.",
      "Information passed between teams or systems is generally accurate and reliable.",
      "Handoffs give the next person or team enough information to continue confidently.",
      "Information quality at handoff supports HR processes progressing correctly the first time.",
    ],
    "Where do handoffs create the most friction in the HR processes you use?",
    "Optional: include unclear information requirements, repeated clarification, incomplete data, work being returned, or delays between teams.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "change_resilience",
    [
      "Changes to HR processes or policies are explained clearly, including what I need to do differently.",
      "I receive enough support to apply changes confidently in practice.",
      "Changes are adopted consistently across teams.",
      "New processes and expectations continue to be reinforced after launch.",
      "New ways of working become established as normal operating practice over time.",
    ],
    "What most makes changes to HR processes difficult for you to apply in practice?",
    "Optional: include unclear expectations, insufficient support, inconsistent interpretation, limited follow-up, or changes that are difficult to sustain.",
  ),
];

const leadershipQuestions: ClientDiagnosticQuestion[] = [
  ...buildDimensionQuestions(
    "leadership",
    "process_clarity",
    [
      "Core HR processes have a clear sequence of steps from start to finish.",
      "Routine HR situations are handled through clear and standard processes across the organisation.",
      "When work moves between functions or roles, the next action and owner are clear.",
      "Non-standard or complex HR situations have clear routes for how they should be handled.",
      "Core HR processes are clear enough for managers and employees to use with confidence.",
    ],
    "Where does process ambiguity create the greatest operational risk or friction?",
    "Optional: include unclear process steps, difficult handoffs, uncertain ownership, complex exceptions, or areas that require repeated clarification.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "consistency",
    [
      "Similar people situations are handled using consistent principles across the organisation.",
      "Managers apply HR policies and decision criteria in a broadly consistent way.",
      "Employees and managers receive a broadly consistent HR experience across teams, functions and locations.",
      "Standard HR processes are applied consistently across the organisation.",
      "Exceptions are handled using clear and consistent principles.",
    ],
    "Where does inconsistency create the greatest organisational risk or friction?",
    "Optional: include variation in policy interpretation, manager decisions, HR service delivery, employee experience, or exception handling.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "service_access",
    [
      "Employees and managers know where to start when they need HR support.",
      "Different types of HR requests have clear and appropriate routes for support.",
      "The HR support model is easy to navigate for common requests.",
      "Employees and managers use the intended HR support channels confidently for most requests.",
      "There is confidence that using the appropriate support route will connect users with the right help.",
    ],
    "Where does the current HR access model create the greatest friction for employees or managers?",
    "Optional: include unclear channels, poor routing, fragmented access, dependence on informal relationships, or low confidence in the service model.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "ownership",
    [
      "Responsibilities across leaders, managers, HR and supporting functions are clearly defined in HR processes.",
      "Decision rights are clear across the organisation for important HR matters.",
      "Responsibility transfers clearly when work moves between roles or functions.",
      "There is clear accountability for ensuring important HR matters progress to completion.",
      "Ownership remains clear in complex or cross-functional HR matters.",
    ],
    "Where does unclear ownership create the greatest organisational risk, delay or friction?",
    "Optional: include unclear decision rights, cross-functional accountability, stalled work, duplicated effort, or matters that require senior intervention to progress.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "systems_enablement",
    [
      "The HR systems landscape supports the organisation’s intended HR operating model.",
      "The systems are straightforward enough for managers and employees to use effectively.",
      "Routine HR processes are appropriately enabled through workflow and automation.",
      "Systems are sufficiently connected to minimise duplicate entry, reconciliation and manual data movement.",
      "The systems provide reliable visibility and information to support operational control and decision-making.",
    ],
    "Where are systems or tooling most constraining the effectiveness of HR operations?",
    "Optional: include usability, workflow automation, integration, manual effort, data visibility, or dependence on work outside core systems.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "knowledge_self_service",
    [
      "Managers and employees can find the HR guidance they need when they need it.",
      "There is clarity about which guidance or source should be relied on for HR matters.",
      "Available HR guidance is practical enough to support effective action and decision-making.",
      "There is confidence that HR guidance is accurate and up to date.",
      "Guidance and self-service resources enable routine needs to be resolved with minimal HR intervention.",
    ],
    "Where does weak HR guidance or self-service create the greatest operational friction?",
    "Optional: include poor findability, unclear sources, difficult-to-apply guidance, low trust in content, or unnecessary dependency on HR for routine matters.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "operational_capacity",
    [
      "The HR operating model appears adequately resourced for current organisational demand.",
      "HR services appear able to deliver within reasonable timeframes and keep sustained backlog under control.",
      "The function appears able to absorb urgent or unexpected demand while maintaining core delivery.",
      "Routine demand appears to be managed efficiently so that capacity remains available for higher-value work.",
      "The function appears to have sufficient capacity to improve services while sustaining day-to-day delivery.",
    ],
    "Where does HR capacity create the greatest organisational risk or constraint?",
    "Optional: include service delays, inability to absorb demand, dependence on key individuals, limited improvement capacity, or areas where demand is outgrowing the operating model.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "case_management",
    [
      "HR requests and issues are captured and managed through structured processes.",
      "Cases are routed efficiently to the appropriate teams or specialists.",
      "Ownership remains clear throughout the lifecycle of important HR matters.",
      "There is sufficient visibility of case status, progress and outstanding action.",
      "Case handling provides appropriate control and traceability for the organisation’s needs.",
    ],
    "Where does case handling create the greatest operational or control risk?",
    "Optional: include weak intake discipline, routing delays, unclear accountability, limited visibility, poor traceability, or inconsistent handling of sensitive matters.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "data_handoffs",
    [
      "It is clear what information is required before key HR processes can move to the next stage.",
      "Handoffs between teams or functions include the information needed for work to continue.",
      "Information used across HR processes is sufficiently accurate and reliable.",
      "Handoffs give the receiving team enough information to continue confidently.",
      "Information quality at handoff supports HR processes progressing correctly the first time.",
    ],
    "Where do weak data or operational handoffs create the greatest organisational risk or inefficiency?",
    "Optional: include poor information quality, repeated checking, rework, delays, or weak joins between HR and connected functions.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "change_resilience",
    [
      "Changes to HR processes or services are communicated clearly enough for the organisation to understand what is changing and why.",
      "Managers receive enough support to apply changes effectively.",
      "Changes are adopted consistently across the organisation.",
      "New ways of working are reinforced after launch through ongoing communication, support or follow-up.",
      "New ways of working become established as normal operating practice over time.",
    ],
    "Where does change in HR operations create the greatest execution risk?",
    "Optional: include weak communication, uneven adoption, insufficient manager enablement, limited reinforcement, or difficulty sustaining new ways of working.",
  ),
];

export const clientDiagnosticQuestionBank: ClientDiagnosticQuestion[] = [
  ...hrQuestions,
  ...managerQuestions,
  ...leadershipQuestions,
];

export const questionnaireTypes: QuestionnaireType[] = [
  "hr",
  "manager",
  "leadership",
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
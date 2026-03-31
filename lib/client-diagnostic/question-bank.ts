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
      "For common HR processes, there is a clearly understood sequence of steps from start to finish.",
      "People involved in these processes do not need to interpret or figure out what to do next in routine scenarios.",
      "When work moves between teams or roles, it is clear who is responsible for the next step.",
      "Non-standard or more complex scenarios are handled with the same level of clarity as routine cases.",
      "Managers and employees can usually use HR processes confidently without needing repeated clarification.",
    ],
    "Where do you see the most confusion, ambiguity, or rework in HR processes today?",
    "Optional: share examples where the process path is unclear, handoffs break down, or exceptions require significant intervention.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "consistency",
    [
      "Similar HR situations are handled in a consistent way across the organisation.",
      "Managers tend to make similar decisions when faced with similar people situations.",
      "The experience of HR processes does not vary significantly between teams, departments, or locations.",
      "HR is not frequently required to step in to correct inconsistent handling.",
      "Exceptions are handled in a structured and consistent way rather than ad hoc.",
    ],
    "Where do you see inconsistency in HR service delivery or decision-making?",
    "Optional: note where outcomes vary by manager, geography, team, or interpretation of the same issue.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "service_access",
    [
      "It is clear where to go to get HR support for most types of queries or requests.",
      "There is one obvious route into HR support rather than multiple competing options.",
      "It is easy to choose the correct route or option when raising a query or request.",
      "In practice, people use the intended route to access HR support rather than contacting individuals directly.",
      "Managers and employees generally trust that using the standard access route will lead to the right outcome.",
    ],
    "What makes HR support easy or difficult to access in practice?",
    "Optional: include unclear channels, duplicate routes, bypass behaviour, or where people do not trust the standard entry point.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "ownership",
    [
      "It is clear which role or team is responsible for each step in core HR processes.",
      "There is shared understanding of who owns decisions versus who supports or contributes.",
      "When work moves between teams or roles, ownership transfers are clear and understood.",
      "In practice, work progresses without needing someone to step in to clarify or reassign ownership.",
      "In more complex or cross-functional scenarios, ownership remains clear rather than becoming shared or ambiguous.",
    ],
    "Where is ownership most unclear across people processes?",
    "Optional: describe where accountability blurs, decisions stall, or cross-team work creates confusion over who owns what.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "systems_enablement",
    [
      "The systems we use support the way HR processes are intended to work.",
      "It is clear how work should move through the system from start to finish.",
      "People can complete HR processes in the system without needing workarounds.",
      "The same information does not need to be entered multiple times across systems.",
      "People generally trust the system to reflect the true status of HR processes.",
    ],
    "What system or tooling issues create the biggest operational drag for HR?",
    "Optional: include workflow misalignment, workaround behaviour, duplicate entry, low visibility, or lack of confidence in system status.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "knowledge_self_service",
    [
      "It is easy to find the right HR guidance when it is needed.",
      "Guidance is located in one place rather than spread across multiple sources.",
      "Guidance is written in a way that makes it easy to apply in real situations.",
      "People trust that the guidance is accurate and up to date.",
      "HR is not frequently asked the same questions that available guidance already covers.",
    ],
    "Where does knowledge or self-service break down most often?",
    "Optional: include poor findability, fragmented sources, policy-heavy content, low trust, or repeated dependency on HR to interpret guidance.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "operational_capacity",
    [
      "The HR operating model has sufficient capacity to handle current demand.",
      "Work can usually be completed without consistent backlog or delay.",
      "The majority of work is planned rather than reactive.",
      "A significant portion of HR workload is not driven by avoidable issues or repeat queries.",
      "There is sufficient headroom to improve processes rather than only respond to demand.",
    ],
    "Where is operational capacity most stretched today?",
    "Optional: include backlog pressure, reactive load, interruption culture, avoidable demand, or lack of capacity to improve.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "case_management",
    [
      "HR requests and issues are consistently captured in a structured way.",
      "Work is entered into a single, consistent case or request model.",
      "Cases are routed to the right person or team without unnecessary delay.",
      "It is easy to see the current status of a case at any point in time.",
      "Work is managed within the case system rather than through side conversations or manual tracking.",
    ],
    "What are the biggest weaknesses in current case handling or issue tracking?",
    "Optional: include inconsistent intake, routing friction, poor visibility, chasing behaviour, or shadow case management outside the system.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "data_handoffs",
    [
      "It is clear what information is required before work can move to the next step.",
      "Each stage of a process has clearly defined outputs that the next stage can rely on.",
      "Information passed between teams or systems is usually complete and accurate.",
      "Work rarely needs to be corrected or reworked after it has been passed on.",
      "Handoffs between systems or teams do not create duplication or manual effort.",
    ],
    "Where do data issues or operational handoffs create the most friction?",
    "Optional: include unclear inputs, low-trust handoffs, rework, repeated checking, duplication, or delay between teams and systems.",
  ),
  ...buildDimensionQuestions(
    "hr",
    "change_resilience",
    [
      "Changes to HR processes or services are clearly explained.",
      "Managers are given enough support to apply changes confidently.",
      "Changes are adopted consistently across teams rather than unevenly.",
      "Changes are reinforced after launch rather than left to embed on their own.",
      "Teams do not revert to previous ways of working after initial adoption.",
    ],
    "What tends to make change difficult to land in HR operations?",
    "Optional: include weak reinforcement, patchy adoption, poor manager enablement, unclear ownership of adoption, or drift back to old ways.",
  ),
];

const managerQuestions: ClientDiagnosticQuestion[] = [
  ...buildDimensionQuestions(
    "manager",
    "process_clarity",
    [
      "The people processes I need to follow as a manager are generally clear from start to finish.",
      "In routine people situations, I do not usually need to work out for myself what should happen next.",
      "When work passes between me, HR, or other teams, it is generally clear who owns the next step.",
      "Less common or more complex situations are handled with similar clarity to routine cases.",
      "I can usually use people processes confidently without needing repeated clarification.",
    ],
    "Where are people processes least clear from a manager perspective?",
    "Optional: share where the process path is confusing, where handoffs break down, or where exceptions feel hard to navigate.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "consistency",
    [
      "Similar people situations are handled in a reasonably consistent way across the organisation.",
      "Managers faced with similar people issues tend to make similar decisions.",
      "The experience of HR support does not vary significantly depending on team, department, or location.",
      "HR does not need to step in repeatedly to correct inconsistent handling.",
      "Exceptions are generally handled in a structured and consistent way.",
    ],
    "Where do you notice inconsistency in HR support or decision-making?",
    "Optional: include differences across teams, manager populations, locations, or how similar situations are treated.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "service_access",
    [
      "It is clear where to go when I need HR help or guidance.",
      "There is one obvious route into HR support rather than multiple competing options.",
      "It is easy to choose the correct route when raising a query or request.",
      "In practice, I can use the intended route for support rather than needing to rely on informal contacts.",
      "I trust that using the standard access route will lead to the right outcome.",
    ],
    "What makes HR support easy or difficult for managers to access?",
    "Optional: include unclear channels, duplicate routes, slow routing, or where standard access is bypassed in practice.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "ownership",
    [
      "It is generally clear what sits with me as a manager versus what sits with HR or others.",
      "There is shared understanding of who owns decisions versus who supports or contributes.",
      "When work moves between teams or roles, ownership transfers are clear and understood.",
      "People issues usually move forward without someone having to step in to clarify who owns the next step.",
      "In more complex or cross-functional situations, ownership remains clear rather than becoming blurred.",
    ],
    "Where is ownership least clear in the people processes you use?",
    "Optional: describe where action stalls, accountability becomes ambiguous, or decisions escalate because ownership is unclear.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "systems_enablement",
    [
      "The systems I use support the way people processes are intended to work.",
      "It is clear how work should move through the system from start to finish.",
      "I can complete common people processes in the system without needing workarounds.",
      "The same information does not need to be entered multiple times across systems.",
      "I generally trust the system to reflect the true status of people processes.",
    ],
    "What system or tooling issues most affect managers in people processes?",
    "Optional: include workflow confusion, workaround behaviour, duplicate entry, poor visibility, or low trust in system status.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "knowledge_self_service",
    [
      "It is easy to find the right people guidance when I need it.",
      "Guidance is located in one place rather than spread across multiple sources.",
      "Guidance is written in a way that makes it easy to apply in real situations.",
      "I trust that the guidance available to me is accurate and up to date.",
      "Available guidance reduces the need for me to ask HR the same routine questions repeatedly.",
    ],
    "Where does manager self-service or guidance fall short?",
    "Optional: include poor searchability, fragmented sources, unclear guidance, low trust, or where you still need HR to interpret routine matters.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "operational_capacity",
    [
      "HR support is available with enough capacity to meet common manager needs.",
      "When I need support, work can usually move without consistent backlog or delay.",
      "The support model feels planned and controlled rather than mostly reactive.",
      "A significant part of the delay or difficulty I experience does not seem to come from avoidable repeat issues.",
      "The HR model appears to have enough headroom to improve rather than only respond.",
    ],
    "Where do you see signs that HR capacity is stretched?",
    "Optional: include backlog, reactive load, interruption, uneven support, or where avoidable demand appears to be consuming capacity.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "case_management",
    [
      "People issues are consistently captured and managed in a structured way once raised.",
      "Issues or requests are routed to the right person or team without unnecessary delay.",
      "Ownership remains clear as a people issue moves through different stages or teams.",
      "I usually have enough visibility on current status when an issue is in progress.",
      "Issues are managed through the intended case process rather than through side conversations or manual tracking.",
    ],
    "What weaknesses do you see in how people issues are managed once raised?",
    "Optional: include poor routing, limited visibility, chasing for updates, unclear ownership, or handling outside the formal process.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "data_handoffs",
    [
      "It is clear what information I need to provide before work can move to the next step.",
      "The next stage of a process can usually rely on the information or outputs provided.",
      "Information passed between teams or systems is usually complete and accurate.",
      "Work does not often need to be corrected or reworked after it has been handed on.",
      "Handoffs between systems or teams do not usually create duplication or manual effort for me.",
    ],
    "Where do handoffs or data issues create the biggest problems for managers?",
    "Optional: include unclear inputs, repeated checking, rework, duplication, or breakdowns between teams, approvals, systems, or payroll-related processes.",
  ),
  ...buildDimensionQuestions(
    "manager",
    "change_resilience",
    [
      "Changes to HR processes or policies are clearly explained.",
      "Managers are given enough support to apply changes confidently.",
      "Changes are adopted consistently across teams rather than unevenly.",
      "Changes are reinforced after launch rather than left for managers to work out over time.",
      "Teams do not usually revert to previous ways of working after change has been introduced.",
    ],
    "What makes changes to people processes difficult for managers to absorb?",
    "Optional: include poor explanation, limited enablement, patchy adoption, weak follow-through, or drift back to old ways of working.",
  ),
];

const leadershipQuestions: ClientDiagnosticQuestion[] = [
  ...buildDimensionQuestions(
    "leadership",
    "process_clarity",
    [
      "Core people processes appear defined clearly enough to support effective organisational execution.",
      "Routine people processes do not seem to rely heavily on local interpretation to move forward.",
      "When work moves between functions or roles, the next step appears sufficiently clear.",
      "More complex or non-standard situations appear to be handled with similar clarity to routine cases.",
      "There is confidence that key people processes can run without repeated clarification or intervention.",
    ],
    "Where do you believe process ambiguity creates the greatest organisational risk or drag?",
    "Optional: focus on areas where unclear process flow, handoffs, or exceptions affect scale, speed, control, or confidence.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "consistency",
    [
      "Similar people situations appear to be handled in a consistent way across the organisation.",
      "Managers faced with similar issues appear to make broadly similar decisions.",
      "The people experience does not appear to vary significantly between teams, departments, or locations.",
      "HR does not appear to spend excessive effort correcting inconsistent handling.",
      "Exceptions appear to be handled in a structured and consistent way rather than ad hoc.",
    ],
    "Where do you see the greatest inconsistency in the people experience?",
    "Optional: include variation by team, geography, leader population, or where similar issues appear to lead to different outcomes.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "service_access",
    [
      "Employees and managers appear to know where to go to access HR support.",
      "The organisation appears to have one sufficiently clear route into HR support rather than multiple competing channels.",
      "The support model appears easy enough to navigate for common requests or queries.",
      "People do not appear overly dependent on informal relationships to access HR support.",
      "There appears to be confidence that using the standard access route will lead to the right outcome.",
    ],
    "Where do you believe access to HR support is weakest?",
    "Optional: note where access appears fragmented, difficult to navigate, dependent on informal routes, or not trusted by users.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "ownership",
    [
      "Accountability across leaders, managers, HR, and other functions appears sufficiently clear in people processes.",
      "There appears to be shared understanding of who owns decisions versus who supports or contributes.",
      "Ownership transfers between roles or functions appear clear when work moves between steps.",
      "Important people matters do not appear to require repeated intervention to clarify who owns the next step.",
      "In more complex or cross-functional situations, ownership appears to remain clear rather than becoming ambiguous.",
    ],
    "Where does ownership appear most blurred or contested in people operations?",
    "Optional: include where unclear accountability affects pace, quality, decision-making, or cross-functional execution.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "systems_enablement",
    [
      "The systems landscape appears aligned to the way HR processes are intended to work.",
      "It appears sufficiently clear how work should move through the system from start to finish.",
      "The operating model does not appear overly dependent on workarounds outside the system.",
      "The same information does not appear to require repeated entry across systems.",
      "There appears to be reasonable trust that systems reflect the true status of people processes.",
    ],
    "Where do you believe systems or tooling are constraining HR operational performance?",
    "Optional: include workflow misalignment, workaround culture, duplicate entry, poor visibility, or lack of confidence in system status.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "knowledge_self_service",
    [
      "Managers and employees appear able to find the right people guidance when they need it.",
      "Guidance appears sufficiently consolidated rather than spread across multiple sources.",
      "Available guidance appears practical enough to be applied in real situations.",
      "There appears to be confidence that guidance is accurate and up to date.",
      "Weaknesses in guidance do not appear to be driving repeated dependency on HR for routine interpretation.",
    ],
    "Where do you think guidance or self-service is least effective today?",
    "Optional: include poor findability, fragmented content, policy-heavy guidance, low trust, or ongoing dependency on HR to translate routine matters.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "operational_capacity",
    [
      "The HR operating model appears to have sufficient capacity for current demand.",
      "Work appears able to move without sustained backlog or delay becoming the norm.",
      "The model appears more planned than reactive in how demand is handled.",
      "Avoidable issues or repeat demand do not appear to be consuming an excessive share of workload.",
      "The function appears to have enough headroom to improve rather than only respond.",
    ],
    "Where do you believe HR operating capacity is most at risk?",
    "Optional: include backlog, reactive load, interruption, avoidable demand, skill constraints, or lack of headroom for improvement.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "case_management",
    [
      "The organisation appears to capture and manage HR issues in a structured way.",
      "Work appears routed to the right person or team without unnecessary delay.",
      "Ownership appears to remain clear as issues move between teams or stages.",
      "There appears to be enough visibility into the status of people issues while they are in flight.",
      "People issues do not appear to rely heavily on side conversations or manual tracking outside the intended case model.",
    ],
    "What concerns do you have, if any, about how people issues are tracked and managed?",
    "Optional: include intake discipline, routing, visibility, update chasing, governance, or work being managed outside the formal process.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "data_handoffs",
    [
      "It appears sufficiently clear what information is required before work can move to the next stage.",
      "Each stage of a process appears to produce outputs the next stage can rely on.",
      "Information passed between teams or systems appears usually complete and accurate.",
      "The operating model does not appear to depend heavily on correction or rework after handoff.",
      "Handoffs between systems or teams do not appear to create significant duplication or manual effort.",
    ],
    "Where do data flow or cross-functional handoffs appear weakest?",
    "Optional: include unclear inputs, low-trust transfers, repeated checking, rework, duplication, or weak joins between HR and connected functions.",
  ),
  ...buildDimensionQuestions(
    "leadership",
    "change_resilience",
    [
      "Changes to people processes or services appear to be explained clearly enough.",
      "Managers appear to receive enough support to apply changes confidently.",
      "Changes appear to be adopted consistently across teams rather than unevenly.",
      "Changes appear to be reinforced after launch rather than left to embed on their own.",
      "Teams do not appear to revert quickly to previous ways of working after change has been introduced.",
    ],
    "What tends to make operational change in HR difficult to land well?",
    "Optional: include weak explanation, poor manager enablement, patchy adoption, limited reinforcement, or drift back to older ways of working.",
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
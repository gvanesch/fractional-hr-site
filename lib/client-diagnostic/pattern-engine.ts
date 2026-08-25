import type { DimensionInsight } from "./insight-engine";

export type QuestionScoreMap = Record<string, number | undefined>;

export type DiagnosticPatternSeverity = "low" | "moderate" | "high";

export type DiagnosticPattern = {
  code: string;
  label: string;
  description: string;
  severity: DiagnosticPatternSeverity;
};

export type GapPattern =
  | "none"
  | "hr_lower_than_leadership"
  | "manager_lower_than_others"
  | "leadership_lower_than_others"
  | "general_spread";

export type DimensionPatternResult = {
  gapPattern: GapPattern;
  primary: DiagnosticPattern | null;
  secondary: DiagnosticPattern | null;
  flags: string[];
};

type PatternDefinition = {
  code: string;
  label: string;
  description: string;
  detect: (params: PatternDetectionParams) => boolean;
};

type PatternDetectionParams = {
  insight: DimensionInsight;
  questionScores: QuestionScoreMap;
  hrScore: number | null;
  managerScore: number | null;
  leadershipScore: number | null;
};

function getScore(
  insight: DimensionInsight,
  key: "hr" | "manager" | "leadership",
): number | null {
  const value = insight.scores[key];
  return typeof value === "number" ? value : null;
}

function getQuestionScore(
  questionScores: QuestionScoreMap,
  key: string,
): number | null {
  const value = questionScores[key];
  return typeof value === "number" ? value : null;
}

function isBelow(
  questionScores: QuestionScoreMap,
  key: string,
  threshold: number,
): boolean {
  const value = getQuestionScore(questionScores, key);
  return value !== null && value < threshold;
}

function countTriggeredPatterns(
  patterns: PatternDefinition[],
  params: PatternDetectionParams,
): number {
  return patterns.filter((pattern) => pattern.detect(params)).length;
}

function getPatternSeverity(params: {
  insight: DimensionInsight;
  triggeredPatternCount: number;
}): DiagnosticPatternSeverity {
  const { insight, triggeredPatternCount } = params;
  const averageScore =
    typeof insight.averageScore === "number" ? insight.averageScore : null;

  if (triggeredPatternCount >= 2 && averageScore !== null && averageScore < 3) {
    return "high";
  }

  if (triggeredPatternCount >= 2) {
    return "moderate";
  }

  return "moderate";
}

export function getGapPattern(insight: DimensionInsight): GapPattern {
  if (
    insight.alignment !== "emerging_gap" &&
    insight.alignment !== "significant_gap"
  ) {
    return "none";
  }

  const hr = getScore(insight, "hr");
  const manager = getScore(insight, "manager");
  const leadership = getScore(insight, "leadership");

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
    hr < leadership &&
    hr < manager &&
    leadership - hr >= 0.4
  ) {
    return "hr_lower_than_leadership";
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

const PROCESS_CLARITY_PATTERNS: PatternDefinition[] = [
  {
    code: "PROCESS_INTERPRETATION_DEPENDENCY",
    label: "Workflow still depends on clarification",
    description:
      "People cannot navigate core HR processes confidently enough without additional clarification.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_5", 3),
  },
  {
    code: "PROCESS_HANDOFF_AMBIGUITY",
    label: "Handoffs are creating ambiguity",
    description:
      "The next action or owner is not consistently clear when work moves between roles or teams.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_3", 3),
  },
  {
    code: "PROCESS_EDGE_CASE_BREAKDOWN",
    label: "Non-standard cases are not clear",
    description:
      "Complex or non-standard scenarios do not have a sufficiently clear route for handling.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_4", 3),
  },
];

const OWNERSHIP_PATTERNS: PatternDefinition[] = [
  {
    code: "OWNERSHIP_ROLE_CLARITY_GAP",
    label: "Responsibilities are not clear enough",
    description:
      "Responsibilities across HR, managers and supporting roles are not sufficiently clear in core processes.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_1", 3),
  },
  {
    code: "OWNERSHIP_DECISION_AMBIGUITY",
    label: "Decision ownership is not clear enough",
    description:
      "Decision authority and supporting roles are not sufficiently explicit.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_2", 3),
  },
  {
    code: "OWNERSHIP_HANDOFF_BREAKDOWN",
    label: "Ownership weakens at handoffs",
    description:
      "Responsibility for the next action is not transferring clearly enough when work moves between roles or teams.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_3", 3),
  },
  {
    code: "OWNERSHIP_ACCOUNTABILITY_GAP",
    label: "End-to-end accountability is not clear enough",
    description:
      "Accountability for ensuring work progresses to completion is not sufficiently clear.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_4", 3),
  },
  {
    code: "OWNERSHIP_COMPLEXITY_BREAKDOWN",
    label: "Ownership weakens in complex situations",
    description:
      "Ownership becomes less dependable when work spans several teams, roles or functions.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_5", 3),
  },
];

const SERVICE_ACCESS_PATTERNS: PatternDefinition[] = [
  {
    code: "SERVICE_ENTRY_POINT_CLARITY",
    label: "The starting point for support is not clear enough",
    description:
      "Employees and managers do not have sufficient clarity about where to start when they need HR support.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_1", 3),
  },
  {
    code: "SERVICE_ROUTE_CLARITY",
    label: "Support routes are not clear enough",
    description:
      "Different types of HR request do not have sufficiently clear and appropriate routes for support.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_2", 3),
  },
  {
    code: "SERVICE_NAVIGATION_FRICTION",
    label: "The support model is difficult to navigate",
    description:
      "Users are experiencing unnecessary difficulty identifying or navigating the right support route.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_3", 3),
  },
  {
    code: "SERVICE_CHANNEL_ADOPTION_GAP",
    label: "Intended support channels are not being used confidently",
    description:
      "Users are not consistently confident using the intended support channels for their requests.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_4", 3),
  },
  {
    code: "SERVICE_ROUTE_TRUST_GAP",
    label: "Confidence in the support route is too low",
    description:
      "Users do not have sufficient confidence that the appropriate support route will connect them with the right help.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_5", 3),
  },
];

const KNOWLEDGE_PATTERNS: PatternDefinition[] = [
  {
    code: "KNOWLEDGE_DEMAND_LOOP",
    label: "Self-service is not reducing demand",
    description:
      "Guidance and self-service are not enabling routine needs to be resolved with sufficiently little HR intervention.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_5", 3),
  },
  {
    code: "KNOWLEDGE_LOW_TRUST",
    label: "Guidance is not trusted enough",
    description:
      "Users do not have sufficient confidence that HR guidance is accurate and up to date.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_4", 3),
  },
  {
    code: "KNOWLEDGE_POLICY_NOT_PRACTICAL",
    label: "Guidance is not usable enough in practice",
    description:
      "Available guidance is not practical or clear enough to support the right action in real situations.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_3", 3),
  },
];

const SYSTEMS_PATTERNS: PatternDefinition[] = [
  {
    code: "SYSTEM_WORKFLOW_MISALIGNMENT",
    label: "System and operating model are not aligned enough",
    description:
      "The systems environment is not supporting the intended HR operating model strongly enough.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_1", 3),
  },
  {
    code: "SYSTEM_USABILITY_GAP",
    label: "Common system activity is not efficient enough",
    description:
      "Users cannot complete common HR activities efficiently and confidently enough in the systems available.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_2", 3),
  },
  {
    code: "SYSTEM_WORKFLOW_ENABLEMENT_GAP",
    label: "Workflow enablement is not strong enough",
    description:
      "Routine workflow, approvals and handoffs are not being supported efficiently enough by the systems available.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_3", 3),
  },
  {
    code: "SYSTEM_DUPLICATION_GAP",
    label: "System connections are creating duplicate effort",
    description:
      "Information is not moving between systems cleanly enough to avoid unnecessary re-entry, reconciliation or duplication.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_4", 3),
  },
  {
    code: "SYSTEM_VISIBILITY_GAP",
    label: "System visibility is not strong enough",
    description:
      "The systems do not provide sufficiently reliable status and information for operational control.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_5", 3),
  },
];

const CASE_MANAGEMENT_PATTERNS: PatternDefinition[] = [
  {
    code: "CASE_INTAKE_CONTROL_GAP",
    label: "Case intake is not structured enough",
    description:
      "Requests and issues are not being captured through a sufficiently structured and consistent process.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_1", 3),
  },
  {
    code: "CASE_ROUTING_WEAKNESS",
    label: "Case routing is not efficient enough",
    description:
      "Requests and cases are not being routed to the right person or team efficiently enough.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_2", 3),
  },
  {
    code: "CASE_OWNERSHIP_WEAKNESS",
    label: "Case ownership is not clear enough",
    description:
      "Ownership is not remaining sufficiently clear as cases move through different stages or teams.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_3", 3),
  },
  {
    code: "CASE_TRACKING_VISIBILITY_GAP",
    label: "Work in flight is not visible enough",
    description:
      "The current status and next action for cases are not sufficiently visible to the people who need them.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_4", 3),
  },
  {
    code: "CASE_CONTROL_WEAKNESS",
    label: "Case control and traceability are not strong enough",
    description:
      "Case handling is not providing sufficiently dependable process control and traceability.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_5", 3),
  },
];

const DATA_HANDOFF_PATTERNS: PatternDefinition[] = [
  {
    code: "DATA_INPUT_OUTPUT_AMBIGUITY",
    label: "Handoff requirements are not clear enough",
    description:
      "The information required before work can move forward is not consistently clear.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "score_1", 3) ||
      isBelow(questionScores, "score_2", 3),
  },
  {
    code: "DATA_LOW_TRUST_HANDOFF",
    label: "Incoming information is not dependable enough",
    description:
      "Information moving between teams or systems is not sufficiently reliable for receiving teams to proceed confidently.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "score_3", 3) ||
      isBelow(questionScores, "score_4", 3),
  },
  {
    code: "DATA_REWORK_ENGINE",
    label: "Handoff quality is creating repeat effort",
    description:
      "Information quality at transfer points is not strong enough to support work progressing correctly first time.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_5", 3),
  },
];

const CONSISTENCY_PATTERNS: PatternDefinition[] = [
  {
    code: "CONSISTENCY_PRINCIPLES_GAP",
    label: "Consistent principles are not holding strongly enough",
    description:
      "Similar people situations are not being handled using sufficiently consistent principles across the organisation.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_1", 3),
  },
  {
    code: "CONSISTENCY_MANAGER_APPLICATION_GAP",
    label: "Manager application of standards is uneven",
    description:
      "The guidance and application of HR policies and decision criteria are not producing sufficient consistency at manager level.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_2", 3),
  },
  {
    code: "CONSISTENCY_EXPERIENCE_VARIATION",
    label: "The HR experience varies too much",
    description:
      "Employees and managers are not receiving a sufficiently consistent HR experience across teams, functions or locations.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_3", 3),
  },
  {
    code: "CONSISTENCY_PROCESS_VARIATION",
    label: "Standard processes are not applied consistently enough",
    description:
      "Standard HR processes are not being applied with sufficient consistency across the organisation.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_4", 3),
  },
  {
    code: "CONSISTENCY_EXCEPTION_BREAKDOWN",
    label: "Exceptions are not controlled consistently",
    description:
      "Exceptions are not being handled using sufficiently clear and consistent principles.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_5", 3),
  },
];

const CAPACITY_PATTERNS: PatternDefinition[] = [
  {
    code: "CAPACITY_TRUE_SHORTFALL",
    label: "The model is carrying a capacity shortfall",
    description:
      "Current demand and delivery timeframes indicate that usable operating capacity may be insufficient.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "score_1", 3) &&
      isBelow(questionScores, "score_2", 3),
  },
  {
    code: "CAPACITY_REACTIVE_MODEL",
    label: "The model is vulnerable to reactive demand",
    description:
      "The function is not absorbing urgent or unexpected demand strongly enough while maintaining core delivery.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_3", 3),
  },
  {
    code: "CAPACITY_AVOIDABLE_DEMAND",
    label: "Routine demand is consuming too much headroom",
    description:
      "Routine demand is not being managed efficiently enough to protect capacity for higher-value work.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_4", 3),
  },
];

const CHANGE_PATTERNS: PatternDefinition[] = [
  {
    code: "CHANGE_MANAGER_ENABLEMENT_GAP",
    label: "Managers are not enabled strongly enough for change",
    description:
      "Managers and employees are not receiving enough support to adopt new processes or ways of working confidently.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_2", 3),
  },
  {
    code: "CHANGE_REINFORCEMENT_GAP",
    label: "Changes are not reinforced strongly enough",
    description:
      "New processes and behaviours are not being reinforced sufficiently after launch.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_4", 3),
  },
  {
    code: "CHANGE_REVERSION_RISK",
    label: "The model is vulnerable to reversion",
    description:
      "New ways of working are not becoming established strongly enough as normal operating practice.",
    detect: ({ questionScores }) => isBelow(questionScores, "score_5", 3),
  },
];

function getPatternDefinitions(
  dimensionKey: string,
): PatternDefinition[] {
  switch (dimensionKey) {
    case "process_clarity":
      return PROCESS_CLARITY_PATTERNS;
    case "ownership":
      return OWNERSHIP_PATTERNS;
    case "service_access":
      return SERVICE_ACCESS_PATTERNS;
    case "knowledge_self_service":
    case "knowledge_access":
      return KNOWLEDGE_PATTERNS;
    case "systems_enablement":
    case "technology_enablement":
      return SYSTEMS_PATTERNS;
    case "case_management":
      return CASE_MANAGEMENT_PATTERNS;
    case "data_handoffs":
      return DATA_HANDOFF_PATTERNS;
    case "consistency":
      return CONSISTENCY_PATTERNS;
    case "operational_capacity":
      return CAPACITY_PATTERNS;
    case "change_resilience":
      return CHANGE_PATTERNS;
    default:
      return [];
  }
}

function buildFallbackPattern(
  insight: DimensionInsight,
  gapPattern: GapPattern,
): DiagnosticPattern | null {
  if (insight.status === "weak" && gapPattern === "none") {
    return {
      code: "UNIFORM_WEAKNESS",
      label: "Uniform weakness",
      description:
        "This dimension is reading as a broad weakness rather than a localised or role-specific issue.",
      severity: "high",
    };
  }

  if (gapPattern === "manager_lower_than_others") {
    return {
      code: "MANAGER_EXPERIENCE_GAP",
      label: "Manager experience gap",
      description:
        "Managers are reporting a materially weaker experience than HR and Leadership.",
      severity: "high",
    };
  }

  if (gapPattern === "hr_lower_than_leadership") {
    return {
      code: "HR_EXPERIENCE_GAP",
      label: "HR experience gap",
      description:
        "HR is reporting a materially weaker experience than Leadership, with Manager responses providing an additional comparison point.",
      severity: "high",
    };
  }

  if (gapPattern === "leadership_lower_than_others") {
    return {
      code: "LEADERSHIP_EXPERIENCE_GAP",
      label: "Leadership experience gap",
      description:
        "Leadership is reporting a materially weaker experience than HR and Managers.",
      severity: "high",
    };
  }

  if (gapPattern === "general_spread") {
    return {
      code: "CROSS_GROUP_VARIATION",
      label: "Cross-group variation",
      description:
        "Respondent groups are reporting meaningfully different experiences, without one group consistently accounting for the variation.",
      severity: "moderate",
    };
  }

  if (insight.status === "strong" && gapPattern === "none") {
    return {
      code: "EMBEDDED_STRENGTH",
      label: "Embedded strength",
      description:
        "This dimension is operating as a genuine strength with relatively consistent experience across groups.",
      severity: "moderate",
    };
  }

  return null;
}

export function detectDimensionPatterns(params: {
  insight: DimensionInsight;
  questionScores?: QuestionScoreMap;
}): DimensionPatternResult {
  const { insight, questionScores = {} } = params;

  const hrScore = getScore(insight, "hr");
  const managerScore = getScore(insight, "manager");
  const leadershipScore = getScore(insight, "leadership");
  const gapPattern = getGapPattern(insight);

  const detectionParams: PatternDetectionParams = {
    insight,
    questionScores,
    hrScore,
    managerScore,
    leadershipScore,
  };

  const definitions = getPatternDefinitions(insight.dimensionKey);
  const triggeredDefinitions = definitions.filter((definition) =>
    definition.detect(detectionParams),
  );

  const triggeredPatternCount = countTriggeredPatterns(definitions, detectionParams);

  const patterns: DiagnosticPattern[] = triggeredDefinitions.map((definition) => ({
    code: definition.code,
    label: definition.label,
    description: definition.description,
    severity: getPatternSeverity({
      insight,
      triggeredPatternCount,
    }),
  }));

  const flags: string[] = [];

  if (gapPattern !== "none") {
    flags.push(gapPattern);
  }

  if (
    insight.status === "strong" &&
    (insight.alignment === "emerging_gap" ||
      insight.alignment === "significant_gap")
  ) {
    flags.push("fragile_strength");
  }

  if (
    insight.status === "moderate" &&
    insight.alignment === "aligned" &&
    patterns.length === 0
  ) {
    flags.push("serviceable_base");
  }

  const fallbackPattern = patterns[0] ?? buildFallbackPattern(insight, gapPattern);

  return {
    gapPattern,
    primary: fallbackPattern,
    secondary: patterns.length > 1 ? patterns[1] : null,
    flags,
  };
}
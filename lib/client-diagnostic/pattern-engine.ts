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

function isAtOrAbove(
  questionScores: QuestionScoreMap,
  key: string,
  threshold: number,
): boolean {
  const value = getQuestionScore(questionScores, key);
  return value !== null && value >= threshold;
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
    label: "Workflow depends on interpretation",
    description:
      "The workflow exists, but people still need to interpret or reconstruct what should happen next.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q2", 3) || isBelow(questionScores, "q6", 3),
  },
  {
    code: "PROCESS_HANDOFF_AMBIGUITY",
    label: "Handoffs are creating ambiguity",
    description:
      "The workflow is weakening at transition points between roles or teams.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q3", 3) || isBelow(questionScores, "q4", 3),
  },
  {
    code: "PROCESS_EDGE_CASE_BREAKDOWN",
    label: "Non-standard cases are not clear",
    description:
      "The process works better for routine work than for more complex or less common scenarios.",
    detect: ({ questionScores }) => isBelow(questionScores, "q7", 3),
  },
];

const OWNERSHIP_PATTERNS: PatternDefinition[] = [
  {
    code: "OWNERSHIP_EXECUTION_GAP",
    label: "Ownership is clear in design, not in use",
    description:
      "The accountability model exists, but it is not landing consistently at the point of execution.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q5", 3) || isBelow(questionScores, "q6", 3),
  },
  {
    code: "OWNERSHIP_HANDOFF_BREAKDOWN",
    label: "Ownership weakens at handoffs",
    description:
      "Responsibility is becoming blurred as work crosses roles or team boundaries.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q3", 3) || isBelow(questionScores, "q7", 3),
  },
  {
    code: "OWNERSHIP_DECISION_AMBIGUITY",
    label: "Decision ownership is not clear enough",
    description:
      "The line between decision owner and contributor is not sufficiently explicit.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q2", 3) || isBelow(questionScores, "q4", 3),
  },
];

const SERVICE_ACCESS_PATTERNS: PatternDefinition[] = [
  {
    code: "SERVICE_MULTIPLE_FRONT_DOORS",
    label: "Too many access routes",
    description:
      "The access model is fragmented and people are navigating multiple competing entry points.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q2", 3) || isBelow(questionScores, "q6", 3),
  },
  {
    code: "SERVICE_COGNITIVE_LOAD",
    label: "Choosing the right route is too hard",
    description:
      "The access model is creating too much decision effort before support can be reached.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q3", 3) || isBelow(questionScores, "q4", 3),
  },
  {
    code: "SERVICE_BYPASS_BEHAVIOUR",
    label: "Standard access routes are being bypassed",
    description:
      "People are not consistently trusting or using the intended front door into HR support.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q5", 3) || isBelow(questionScores, "q8", 3),
  },
];

const KNOWLEDGE_PATTERNS: PatternDefinition[] = [
  {
    code: "KNOWLEDGE_DEMAND_LOOP",
    label: "Self-service is not reducing demand",
    description:
      "Guidance exists, but HR remains the translation layer for routine questions.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q6", 3) && isBelow(questionScores, "q8", 3),
  },
  {
    code: "KNOWLEDGE_LOW_TRUST",
    label: "Guidance is not trusted enough",
    description:
      "People do not trust the guidance enough to act on it without checking with HR.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q5", 3) || isBelow(questionScores, "q7", 3),
  },
  {
    code: "KNOWLEDGE_POLICY_NOT_PRACTICAL",
    label: "Guidance is not usable in practice",
    description:
      "The content may exist, but it is not translating cleanly into action at the point of need.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q3", 3) || isBelow(questionScores, "q4", 3),
  },
];

const SYSTEMS_PATTERNS: PatternDefinition[] = [
  {
    code: "SYSTEM_WORKFLOW_MISALIGNMENT",
    label: "System and workflow are misaligned",
    description:
      "The platform is not matching the intended process closely enough to support it cleanly.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q1", 3) || isBelow(questionScores, "q2", 3),
  },
  {
    code: "SYSTEM_WORKAROUND_MODEL",
    label: "Workaround is compensating for system weakness",
    description:
      "People are relying on workaround or extra effort because the system is not supporting the workflow cleanly.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q3", 3) || isBelow(questionScores, "q4", 3),
  },
  {
    code: "SYSTEM_DUPLICATION_GAP",
    label: "Duplication and rekeying are creating drag",
    description:
      "The technology environment is creating repeat entry, manual reconciliation, or avoidable control effort.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q5", 3) || isBelow(questionScores, "q8", 3),
  },
];

const CASE_MANAGEMENT_PATTERNS: PatternDefinition[] = [
  {
    code: "CASE_INTAKE_FRAGMENTATION",
    label: "Case intake is not controlled enough",
    description:
      "Requests are not entering the case model in one structured, dependable way.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q1", 3) || isBelow(questionScores, "q2", 3),
  },
  {
    code: "CASE_TRACKING_VISIBILITY_GAP",
    label: "Work in flight is not visible enough",
    description:
      "Once work enters the model, visibility and status control are not strong enough.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q5", 3) || isBelow(questionScores, "q6", 3),
  },
  {
    code: "CASE_SHADOW_MANAGEMENT",
    label: "Case work is being managed outside the case model",
    description:
      "Side conversations or manual tracking are compensating for weaknesses in the formal case path.",
    detect: ({ questionScores }) => isBelow(questionScores, "q8", 3),
  },
];

const DATA_HANDOFF_PATTERNS: PatternDefinition[] = [
  {
    code: "DATA_INPUT_OUTPUT_AMBIGUITY",
    label: "Inputs and outputs are not clear enough",
    description:
      "Work is moving forward without one consistent understanding of what is required before transfer.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q1", 3) || isBelow(questionScores, "q2", 3),
  },
  {
    code: "DATA_LOW_TRUST_HANDOFF",
    label: "Incoming work is not trusted enough",
    description:
      "Teams are checking, validating, or correcting work because handoffs are not dependable enough.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q3", 3) || isBelow(questionScores, "q6", 3),
  },
  {
    code: "DATA_REWORK_ENGINE",
    label: "Rework is accumulating at transfer points",
    description:
      "Handoffs are creating correction effort and slowing the flow of work between stages.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q5", 3) || isBelow(questionScores, "q7", 3),
  },
];

const CONSISTENCY_PATTERNS: PatternDefinition[] = [
  {
    code: "CONSISTENCY_MANAGER_VARIATION",
    label: "Manager judgement is driving variation",
    description:
      "Similar situations are not being handled consistently because local judgement still plays too large a role.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q2", 3) || isBelow(questionScores, "q4", 3),
  },
  {
    code: "CONSISTENCY_HR_CORRECTION_LAYER",
    label: "HR is acting as a correction layer",
    description:
      "The function is stepping in to preserve consistency rather than the model producing it on its own.",
    detect: ({ questionScores }) => isBelow(questionScores, "q5", 3),
  },
  {
    code: "CONSISTENCY_EXCEPTION_BREAKDOWN",
    label: "Exceptions are not controlled consistently",
    description:
      "The standard weakens when cases are less straightforward or require judgement.",
    detect: ({ questionScores }) => isBelow(questionScores, "q8", 3),
  },
];

const CAPACITY_PATTERNS: PatternDefinition[] = [
  {
    code: "CAPACITY_TRUE_SHORTFALL",
    label: "The model is carrying a real capacity shortfall",
    description:
      "The operating model does not appear to have enough usable capacity for current demand.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q1", 3) &&
      isBelow(questionScores, "q2", 3) &&
      isBelow(questionScores, "q7", 3),
  },
  {
    code: "CAPACITY_REACTIVE_MODEL",
    label: "The model is operating too reactively",
    description:
      "Interruptions and unplanned work are consuming too much of the model's usable capacity.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q3", 3) || isBelow(questionScores, "q4", 3),
  },
  {
    code: "CAPACITY_AVOIDABLE_DEMAND",
    label: "Avoidable demand is consuming headroom",
    description:
      "A meaningful share of workload is being created by repeat issues or preventable operating friction.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q6", 3) || isBelow(questionScores, "q8", 3),
  },
];

const CHANGE_PATTERNS: PatternDefinition[] = [
  {
    code: "CHANGE_MANAGER_ENABLEMENT_GAP",
    label: "Managers are not enabled strongly enough for change",
    description:
      "The model for change depends too much on launch and not enough on manager-level usability.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q2", 3) || isBelow(questionScores, "q3", 3),
  },
  {
    code: "CHANGE_REINFORCEMENT_GAP",
    label: "Changes are not reinforced strongly enough",
    description:
      "Launch activity is happening, but reinforcement and follow-through are not strong enough to embed change.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q4", 3) || isBelow(questionScores, "q5", 3),
  },
  {
    code: "CHANGE_REVERSION_RISK",
    label: "The model is vulnerable to reversion",
    description:
      "New ways of working are not being sustained consistently enough over time.",
    detect: ({ questionScores }) =>
      isBelow(questionScores, "q6", 3) || isBelow(questionScores, "q8", 3),
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
      code: "MANAGER_EXECUTION_GAP",
      label: "Manager execution gap",
      description:
        "The model appears stronger in design than in application at manager level.",
      severity: "high",
    };
  }

  if (gapPattern === "hr_lower_than_leadership") {
    return {
      code: "HR_VISIBILITY_GAP",
      label: "HR visibility gap",
      description:
        "HR is experiencing more friction than is being seen from above.",
      severity: "high",
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
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
        "HR processes may still be evolving and some operational responsibilities may be handled informally. As organisations grow, this can begin to create friction for managers and employees.",
      freeInsights: [
        "Core HR processes may still need clearer structure or documentation.",
        "Managers may experience inconsistency in how people processes are handled.",
        "Strengthening operational foundations can improve consistency and reduce management overhead.",
      ],
    };
  }

  if (score <= 49) {
    return {
      label: "Developing Structure",
      summary:
        "The organisation likely has some HR operational foundations in place, though inconsistencies may still appear across teams or processes as the business grows.",
      freeInsights: [
        "Some processes may rely too heavily on individual judgement or workarounds.",
        "Clearer process ownership can improve consistency across the organisation.",
        "More structured HR service delivery can support growth more effectively.",
      ],
    };
  }

  if (score <= 74) {
    return {
      label: "Structured but Improving",
      summary:
        "Many HR operational foundations appear to be in place. However, some areas may still benefit from refinement to improve efficiency, consistency, and resilience.",
      freeInsights: [
        "Core structures likely exist but may not yet be fully embedded.",
        "Some friction may still appear in handoffs, service access, or process execution.",
        "Targeted improvements could strengthen scalability and operational confidence.",
      ],
    };
  }

  return {
    label: "Operationally Mature",
    summary:
      "HR operations appear well structured and capable of supporting organisational growth. Continued refinement can help maintain efficiency and keep HR aligned with business priorities.",
    freeInsights: [
      "Processes appear relatively well established and consistent.",
      "Operational governance is likely supporting delivery effectively.",
      "Targeted optimisation may still unlock additional value over time.",
    ],
  };
}

export function getDimensionScores(
  answers: DiagnosticAnswers
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
  answers: DiagnosticAnswers
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

export function buildDiagnosticState(
  answers: DiagnosticAnswers
): SavedDiagnosticState {
  return {
    answers,
    result: calculateDiagnosticResult(answers),
    completedAt: new Date().toISOString(),
  };
}
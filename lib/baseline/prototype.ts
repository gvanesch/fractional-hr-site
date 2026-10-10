import { AREAS, FREQUENCIES, ROLES } from "./model";
import { ACTION_LABELS } from "./prototype-actions";

// Prototype-only process groupings. They do not alter the deployed questionnaire.
export const PROCESSES = [
  {
    code: "employee_admin",
    label: "Employee support, documents and records",
    codes: [
      "ops_01",
      "ops_02",
      "ops_05",
      "ops_06",
      "ops_15",
      "ops_17",
      "bp_13",
    ],
  },
  {
    code: "join_move_leave",
    label: "Recruitment, joining, moving and leaving",
    codes: ["ops_03", "ops_04", "ops_10", "ops_11", "bp_09"],
  },
  {
    code: "pay_benefits",
    label: "Payroll, benefits and pay support",
    codes: ["ops_07", "ops_08", "bp_08"],
  },
  {
    code: "advice_cases",
    label: "Manager advice, employee relations and change support",
    codes: ["ops_09", "bp_01", "bp_02", "bp_03", "bp_10"],
  },
  {
    code: "planning_experience",
    label: "People planning, development and employee experience",
    codes: ["bp_04", "bp_05", "bp_06", "bp_07", "bp_14", "ops_18"],
  },
  {
    code: "systems_data",
    label: "Systems, data and digital work",
    codes: [
      "ops_13",
      "bp_11",
      ...AREAS.filter((a) => a.category === "tech").map((a) => a.code),
    ],
  },
  {
    code: "policies_governance",
    label: "Policies, compliance and local governance",
    codes: ["ops_12", "ops_14", "bp_12"],
  },
  {
    code: "office",
    label: "Reception, facilities and office services",
    codes: AREAS.filter((a) => a.category === "office").map((a) => a.code),
  },
  {
    code: "suppliers",
    label: "Other supplier and service coordination",
    codes: ["ops_16"],
  },
];
export type ActivityAnswer = {
  frequency: string;
  role: string;
  important: boolean;
};
export type PrototypeDraft = {
  selected: string[];
  customActivities: { code: string; label: string; processCode: string }[];
  time: Record<string, number>;
  answers: Record<string, ActivityAnswer>;
  notes: Record<string, string>;
};
export const emptyPrototype = (): PrototypeDraft => ({
  selected: [],
  customActivities: [],
  time: {},
  answers: {},
  notes: {},
});
export const activityChoices = (d: PrototypeDraft) => [
  ...AREAS.map((a) => ({ ...a, label: ACTION_LABELS[a.code] ?? a.label })),
  ...(d.customActivities ?? []).map((a) => ({
    ...a,
    example: "An activity you added.",
  })),
];
export function processesFor(d: PrototypeDraft) {
  const custom = d.customActivities ?? [];
  return [
    ...PROCESSES.map((p) => ({
      ...p,
      codes: [
        ...p.codes,
        ...custom.filter((a) => a.processCode === p.code).map((a) => a.code),
      ],
    })),
    {
      code: "other_work",
      label: "Other work / not sure where it fits",
      codes: custom
        .filter((a) => a.processCode === "other_work")
        .map((a) => a.code),
    },
  ];
}
export const activeProcesses = (d: PrototypeDraft) =>
  processesFor(d).filter((p) => p.codes.some((c) => d.selected.includes(c)));
export function addActivity(
  d: PrototypeDraft,
  label: string,
  processCode: string,
  code: string,
): PrototypeDraft {
  const text = label.trim();
  if (
    !text ||
    text.length > 120 ||
    (d.customActivities ?? []).length >= 20 ||
    activityChoices(d).some(
      (a) => a.label.toLowerCase() === text.toLowerCase(),
    ) ||
    ![...PROCESSES.map((p) => p.code), "other_work"].includes(processCode) ||
    !/^added_[a-f0-9-]{36}$/.test(code)
  )
    throw new Error("Add a short, unique activity and choose its group.");
  return {
    ...d,
    customActivities: [
      ...(d.customActivities ?? []),
      { code, label: text, processCode },
    ],
    selected: [...d.selected, code],
  };
}
export const processTotal = (d: PrototypeDraft) =>
  Math.round(
    activeProcesses(d).reduce((sum, p) => sum + (d.time[p.code] ?? 0), 0) * 100,
  ) / 100;
export const completeAnswer = (a?: ActivityAnswer) =>
  !!a && FREQUENCIES.includes(a.frequency) && ROLES.includes(a.role);
export function selectActivities(
  d: PrototypeDraft,
  selected: string[],
): PrototypeDraft {
  const next = {
    ...d,
    selected: [...new Set(selected)],
    answers: Object.fromEntries(
      Object.entries(d.answers).filter(([code]) => selected.includes(code)),
    ),
  };
  const active = activeProcesses(next).map((p) => p.code);
  return {
    ...next,
    time: Object.fromEntries(
      Object.entries(d.time).filter(([code]) => active.includes(code)),
    ),
    notes: Object.fromEntries(
      Object.entries(d.notes).filter(([code]) => active.includes(code)),
    ),
  };
}
export function applyAnswers(
  d: PrototypeDraft,
  processCode: string,
  frequency: string,
  role: string,
): PrototypeDraft {
  if (!FREQUENCIES.includes(frequency) || !ROLES.includes(role))
    throw new Error("Choose a frequency and your part in the work.");
  const process = processesFor(d).find((p) => p.code === processCode);
  if (!process) throw new Error("Choose a process group.");
  const answers = { ...d.answers };
  for (const code of process.codes.filter((c) => d.selected.includes(c))) {
    if (completeAnswer(answers[code])) continue;
    const previous = answers[code];
    answers[code] = {
      frequency: previous?.frequency || frequency,
      role: previous?.role || role,
      important: previous?.important ?? false,
    };
  }
  return { ...d, answers };
}
export function prototypeIssues(d: PrototypeDraft, stage: number): string[] {
  if (stage === 0) return d.selected.length ? [] : ["activities"];
  if (stage === 1)
    return activeProcesses(d)
      .filter(
        (p) =>
          !Object.hasOwn(d.time, p.code) ||
          !Number.isFinite(d.time[p.code]) ||
          d.time[p.code] < 0 ||
          d.time[p.code] > 100 ||
          processTotal(d) < 98 ||
          processTotal(d) > 102,
      )
      .map((p) => p.code);
  if (stage === 2)
    return d.selected.filter((code) => !completeAnswer(d.answers[code]));
  return [];
}
export function prototypeEvidence(d: PrototypeDraft) {
  return {
    processTime: activeProcesses(d).map((p) => ({
      code: p.code,
      label: p.label,
      percentage: d.time[p.code] ?? null,
    })),
    activities: d.selected.map((code) => ({
      code,
      label: activityChoices(d).find((a) => a.code === code)?.label,
      processCode: processesFor(d).find((p) => p.codes.includes(code))?.code,
      frequency: d.answers[code]?.frequency ?? null,
      role: d.answers[code]?.role ?? null,
      importantOccasionalWork: d.answers[code]?.important ?? false,
    })),
  };
}

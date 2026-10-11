// QA-only evidence. No capability, future role or individual example task is inferred.
export const CONTACT_ROUTES = [
  ["work_email", "Work email (your own work address)"],
  ["shared_mailbox", "Shared team mailbox"],
  ["direct_message", "Direct Slack / Teams message"],
  ["shared_channel", "Shared Slack / Teams channel"],
  ["ticket", "Ticket / service portal"],
  ["phone", "Telephone"],
  ["in_person", "In person"],
  ["other", "Other routes"],
];
export const PAYROLL_STAGES = [
  ["collect", "Collect employee changes and payroll inputs"],
  ["prepare", "Prepare or enter payroll information"],
  ["check", "Check payroll results and resolve corrections"],
  ["queries", "Answer employee payroll questions"],
];
export const PAYROLL_PARTIES = [
  ["other_hr", "HR colleagues"],
  ["internal_payroll", "Internal payroll team"],
  ["partner", "External payroll partner"],
  ["finance", "Finance"],
  ["managers", "Managers"],
  ["other", "Other"],
  ["none", "No one else"],
  ["unknown", "Not sure"],
];
export const MY_PAYROLL_PART = [
  ["do", "I do this work"],
  ["check", "I check this work"],
  ["coordinate", "I coordinate or support this work"],
  ["none", "I am not involved"],
  ["unknown", "I am not sure"],
];
export const NATURE_AREAS = ["advice_cases", "planning_development"];
export const WORK_NATURE = [
  ["routine", "Mainly administration or routine coordination"],
  ["advisory", "Mainly advice or leading people decisions"],
  ["mixed", "A mix of both"],
  ["unknown", "Not sure"],
];
export const LOCAL_NEEDS = [
  ["language", "Local language"],
  ["employment", "Local employment requirements"],
  ["onsite", "Being physically present at an office or site"],
  ["none", "None of these"],
  ["unknown", "Not sure"],
];
export const SYSTEMS = [
  ["hibob", "HiBob"],
  ["jira", "Jira / JSM"],
  ["confluence", "Confluence"],
  ["teamtailor", "Teamtailor"],
  ["excel", "Excel"],
  ["power_bi", "Power BI"],
  ["culture_amp", "Culture Amp"],
  ["navan", "Navan"],
  ["slack", "Slack"],
  ["teams", "Teams"],
  ["claude", "Claude"],
  ["blueai", "BlueAI"],
  ["payroll", "Payroll system"],
  ["other", "Other tools"],
  ["none", "No systems or tools used regularly"],
  ["unknown", "Not sure"],
];
export type RichDraft = {
  routes: string[];
  routeTime: Record<string, number>;
  recording: string;
  recordingNote: string;
  duplicates: string;
  sameRoutes: string;
  employeeRoutes: string[];
  managerRoutes: string[];
  payroll: string;
  payrollStages: Record<string, { mine: string; others: string[] }>;
  cycle: string;
  days: number | null;
  daysUnknown: boolean;
  otherPayroll: string;
  workNature: Record<string, string>;
  scope: string;
  localNeeds: string[];
  localNote: string;
  systems: string[];
  otherSystems: string;
  manualNote: string;
  strengths: string;
  missing: string;
};
export const emptyRichDraft = (): RichDraft => ({
  routes: [],
  routeTime: {},
  recording: "",
  recordingNote: "",
  duplicates: "",
  sameRoutes: "",
  employeeRoutes: [],
  managerRoutes: [],
  payroll: "",
  payrollStages: {},
  cycle: "",
  days: null,
  daysUnknown: false,
  otherPayroll: "",
  workNature: {},
  scope: "",
  localNeeds: [],
  localNote: "",
  systems: [],
  otherSystems: "",
  manualNote: "",
  strengths: "",
  missing: "",
});
export function toggleOption(
  values: string[],
  code: string,
  max = Infinity,
  exclusive: string[] = [],
): string[] {
  if (values.includes(code)) return values.filter((c) => c !== code);
  if (exclusive.includes(code)) return [code];
  const next = values.filter((c) => !exclusive.includes(c));
  return next.length < max ? [...next, code] : next;
}
const validChoices = (
  values: string[],
  options: string[][],
  max = Infinity,
  exclusive = ["none", "unknown"],
) =>
  values.length > 0 &&
  values.length <= max &&
  values.every((c) => options.some((o) => o[0] === c)) &&
  !(values.length > 1 && values.some((c) => exclusive.includes(c)));
export const routeTotal = (d: RichDraft) =>
  Math.round(
    d.routes.reduce(
      (n, c) => n + (Number.isFinite(d.routeTime[c]) ? d.routeTime[c] : 0),
      0,
    ) * 100,
  ) / 100;
export function richIssues(
  d: RichDraft,
  step: string,
  selectedAreas: string[] = [],
): string[] {
  const issues: string[] = [];
  if (step === "time_nature")
    for (const code of selectedAreas.filter((c) => NATURE_AREAS.includes(c)))
      if (!WORK_NATURE.some((o) => o[0] === d.workNature[code]))
        issues.push("nature_" + code);
  if (step === "contact") {
    if (!validChoices(d.routes, CONTACT_ROUTES, 5, [])) issues.push("routes");
    const bad = d.routes.filter(
      (c) =>
        !Number.isFinite(d.routeTime[c]) ||
        d.routeTime[c] < 0 ||
        d.routeTime[c] > 100,
    );
    issues.push(...bad.map((c) => "route_" + c));
    if (!bad.length && (routeTotal(d) < 98 || routeTotal(d) > 102))
      issues.push(...d.routes.map((c) => "route_" + c));
    if (!["all", "most", "some", "none", "unknown"].includes(d.recording))
      issues.push("recording");
    if (!["often", "sometimes", "rarely", "unknown"].includes(d.duplicates))
      issues.push("duplicates");
    if (!["same", "different", "unknown"].includes(d.sameRoutes))
      issues.push("sameRoutes");
    if (d.sameRoutes === "different")
      for (const key of ["employeeRoutes", "managerRoutes"] as const)
        if (!validChoices(d[key], CONTACT_ROUTES, 5, [])) issues.push(key);
  }
  if (step === "payroll") {
    if (!["yes", "no", "unknown"].includes(d.payroll)) return ["payroll"];
    if (d.payroll !== "yes") return [];
    for (const [code] of PAYROLL_STAGES) {
      const a = d.payrollStages[code];
      if (!a || !MY_PAYROLL_PART.some((o) => o[0] === a.mine)) {
        issues.push("payroll_" + code);
        continue;
      }
      // Uncertain involvement needs no invented actor answer. No involvement asks who handles it.
      if (a.mine === "unknown") continue;
      const options =
        a.mine === "none"
          ? PAYROLL_PARTIES.filter((o) => o[0] !== "none")
          : PAYROLL_PARTIES;
      if (
        (a.mine === "none" && !validChoices(a.others, options)) ||
        (a.others.length > 0 && !validChoices(a.others, options))
      )
        issues.push("payroll_" + code);
    }
    if (
      ![
        "weekly",
        "fortnightly",
        "four_weekly",
        "monthly",
        "varies",
        "other",
        "unknown",
      ].includes(d.cycle)
    )
      issues.push("cycle");
    if (
      !d.daysUnknown &&
      (d.days === null || !Number.isFinite(d.days) || d.days < 0 || d.days > 31)
    )
      issues.push("days");
  }
  if (step === "context") {
    if (!["one", "several", "group", "unknown"].includes(d.scope))
      issues.push("scope");
    if (!validChoices(d.localNeeds, LOCAL_NEEDS)) issues.push("localNeeds");
  }
  return issues;
}
export function richError(step: string, issues: string[]) {
  if (step === "payroll")
    return "Please answer the highlighted payroll questions. Choose Not sure where you do not know.";
  if (step === "contact")
    return issues.some((i) => i.startsWith("route_"))
      ? "Check the highlighted request percentages. Aim for 100% in total, and answer any other highlighted questions."
      : "Please select your contact routes and answer the highlighted questions.";
  return "Please answer the highlighted questions about support scope and local requirements.";
}
export function richEvidence(
  d: RichDraft,
  selectedAreas: string[],
  payrollVisible: boolean,
) {
  return {
    designVersion: "focused-work-prototype-v4",
    contact: {
      routes: d.routes.map((code) => ({
        code,
        shareOfRequests: d.routeTime[code],
      })),
      recording: d.recording,
      recordingNote: d.recordingNote,
      duplicateRequests: d.duplicates,
      sameEmployeeManagerRoutes: d.sameRoutes,
      ...(d.sameRoutes === "different"
        ? { employeeRoutes: d.employeeRoutes, managerRoutes: d.managerRoutes }
        : {}),
    },
    payroll: !payrollVisible
      ? null
      : {
          involvement: d.payroll,
          ...(d.payroll === "yes"
            ? {
                stages: PAYROLL_STAGES.map(([code]) => ({
                  code,
                  mine: d.payrollStages[code]?.mine ?? null,
                  others:
                    d.payrollStages[code]?.mine === "unknown"
                      ? []
                      : (d.payrollStages[code]?.others ?? []),
                })),
                cycle: d.cycle,
                estimatedPersonalDays: d.daysUnknown ? null : d.days,
                daysUnknown: d.daysUnknown,
                otherPayroll: d.otherPayroll,
              }
            : {}),
        },
    workNature: Object.fromEntries(
      Object.entries(d.workNature).filter(
        ([code]) => selectedAreas.includes(code) && NATURE_AREAS.includes(code),
      ),
    ),
    scope: d.scope,
    localNeeds: d.localNeeds,
    localNote: d.localNote,
    systems: d.systems,
    otherSystems: d.otherSystems,
    manualNote: d.manualNote,
    strengths: d.strengths,
    missing: d.missing,
  };
}

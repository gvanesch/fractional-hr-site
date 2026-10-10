// QA-only structured context. Unknown answers remain unknown in evidence.
export const CONTACT_ROUTES = [
  ["personal_email", "Personal email"],
  ["shared_mailbox", "Shared HR mailbox"],
  ["direct_message", "Direct Slack / Teams message"],
  ["shared_channel", "Shared Slack / Teams channel"],
  ["ticket", "Ticket / service portal"],
  ["phone", "Telephone"],
  ["in_person", "In person"],
  ["other", "Other routes"],
];
export const PAYROLL_STAGES = [
  ["collect", "Collect employee changes and other inputs"],
  ["prepare", "Prepare and enter payroll information"],
  ["calculate", "Calculate payroll"],
  ["check", "Check results and resolve errors"],
  ["approve", "Approve payroll"],
  ["pay", "Release payments"],
  ["reconcile", "Reconcile payroll and accounting records"],
  ["queries", "Answer employee payroll questions"],
];
export const PAYROLL_PARTIES = [
  ["other_hr", "Other HR colleagues"],
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
  ["check", "I check or approve this work"],
  ["coordinate", "I coordinate or support this work"],
  ["none", "I am not involved"],
  ["unknown", "I am not sure"],
];
export const CONTRIBUTIONS = [
  ["admin", "Administration and processing"],
  ["advice", "Advice and employee cases"],
  ["improvement", "Designing or improving how work is done"],
  ["coordination", "Coordinating or leading work"],
  ["unknown", "Not sure"],
];
export const DEPENDENCIES = [
  ["hr", "Other HR colleagues"],
  ["payroll", "Payroll / payroll partner"],
  ["finance", "Finance"],
  ["it", "IT"],
  ["legal", "Legal"],
  ["managers", "Managers / business leaders"],
  ["procurement", "Procurement"],
  ["office", "Local office / facilities"],
  ["vendor", "External suppliers"],
  ["other", "Other"],
  ["unknown", "Not sure"],
];
export const KNOWLEDGE = [
  ["local_requirements", "Local employment requirements"],
  ["language", "Local language"],
  ["business", "A particular business or entity"],
  ["payroll", "Payroll"],
  ["benefits", "Benefits"],
  ["cases", "Employee cases"],
  ["systems", "People systems"],
  ["data", "Data and reporting"],
  ["office", "Office / facilities"],
  ["process", "A specialist process"],
  ["other", "Other"],
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
];
export const MANUAL = [
  ["reenter", "Entering the same information again"],
  ["spreadsheets", "Using spreadsheets to connect processes"],
  ["checking", "Repeated checking or correcting information"],
  ["waiting", "Waiting for information"],
  ["approvals", "Chasing approvals"],
  ["duplicate", "Doing the same work in more than one place"],
  ["other", "Other"],
  ["none", "None of these"],
];
export type RichDraft = {
  receives: string;
  routes: string[];
  routeTime: Record<string, number>;
  recording: string;
  duplicates: string;
  sameRoutes: string;
  employeeRoutes: string[];
  managerRoutes: string[];
  payroll: string;
  payrollStages: Record<string, { mine: string; others: string[] }>;
  cycle: string;
  days: number | null;
  daysUnknown: boolean;
  scope: string;
  contributions: Record<string, string[]>;
  dependencies: string[];
  knowledge: string[];
  knowledgeNote: string;
  systems: string[];
  otherSystems: string;
  manual: string[];
  manualNote: string;
  strengths: string;
  missing: string;
};
export const emptyRichDraft = (): RichDraft => ({
  receives: "",
  routes: [],
  routeTime: {},
  recording: "",
  duplicates: "",
  sameRoutes: "",
  employeeRoutes: [],
  managerRoutes: [],
  payroll: "",
  payrollStages: {},
  cycle: "",
  days: null,
  daysUnknown: false,
  scope: "",
  contributions: {},
  dependencies: [],
  knowledge: [],
  knowledgeNote: "",
  systems: [],
  otherSystems: "",
  manual: [],
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
export const routeTotal = (d: RichDraft) =>
  Math.round(
    d.routes.reduce(
      (n, code) =>
        n + (Number.isFinite(d.routeTime[code]) ? d.routeTime[code] : 0),
      0,
    ) * 100,
  ) / 100;
export function richIssues(d: RichDraft, step: string): string[] {
  const issues: string[] = [];
  if (step === "contact") {
    if (!["yes", "no", "unknown"].includes(d.receives)) return ["receives"];
    if (d.receives !== "yes") return [];
    if (
      !d.routes.length ||
      d.routes.length > 5 ||
      d.routes.some((c) => !CONTACT_ROUTES.some((r) => r[0] === c))
    )
      issues.push("routes");
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
        if (
          !d[key].length ||
          d[key].length > 5 ||
          d[key].some((c) => !CONTACT_ROUTES.some((r) => r[0] === c))
        )
          issues.push(key);
  }
  if (step === "payroll") {
    if (!["yes", "no", "unknown"].includes(d.payroll)) return ["payroll"];
    if (d.payroll !== "yes") return [];
    for (const [code] of PAYROLL_STAGES) {
      const a = d.payrollStages[code];
      if (
        !a ||
        !MY_PAYROLL_PART.some((r) => r[0] === a.mine) ||
        !a.others.length ||
        a.others.some((c) => !PAYROLL_PARTIES.some((r) => r[0] === c)) ||
        (a.others.some((c) => ["unknown", "none"].includes(c)) &&
          a.others.length > 1)
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
  if (
    step === "context" &&
    !["one", "several", "group", "unknown"].includes(d.scope)
  )
    issues.push("scope");
  return issues;
}
export function richEvidence(
  d: RichDraft,
  selectedAreas: string[],
  payrollVisible: boolean,
) {
  return {
    designVersion: "broad-work-context-prototype-v2",
    contact: {
      receives: d.receives,
      ...(d.receives === "yes"
        ? {
            routes: d.routes.map((code) => ({
              code,
              shareOfRequests: d.routeTime[code],
            })),
            recording: d.recording,
            duplicateRequests: d.duplicates,
            sameEmployeeManagerRoutes: d.sameRoutes,
            ...(d.sameRoutes === "different"
              ? {
                  employeeRoutes: d.employeeRoutes,
                  managerRoutes: d.managerRoutes,
                }
              : {}),
          }
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
                  ...d.payrollStages[code],
                })),
                cycle: d.cycle,
                estimatedPersonalDays: d.daysUnknown ? null : d.days,
                daysUnknown: d.daysUnknown,
              }
            : {}),
        },
    scope: d.scope,
    contributions: Object.fromEntries(
      Object.entries(d.contributions).filter(([code]) =>
        selectedAreas.includes(code),
      ),
    ),
    dependencies: d.dependencies,
    knowledge: d.knowledge,
    knowledgeNote: d.knowledgeNote,
    systems: d.systems,
    otherSystems: d.otherSystems,
    manualWork: d.manual,
    manualNote: d.manualNote,
    strengths: d.strengths,
    missing: d.missing,
  };
}

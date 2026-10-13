import {
  BROAD_AREAS,
  emptyBroadDraft,
  broadIssues,
  broadEvidence,
  type BroadDraft,
} from "./broad-prototype";
import {
  emptyRichDraft,
  richIssues,
  richEvidence,
  CONTACT_ROUTES,
  PAYROLL_STAGES,
  PAYROLL_PARTIES,
  MY_PAYROLL_PART,
  LOCAL_NEEDS,
  SYSTEMS,
  WORK_NATURE,
  type RichDraft,
} from "./prototype-enrichment";
import {
  emptyTechnology,
  technologyIssues,
  technologyEvidence,
  TECHNOLOGY_ACTIVITIES,
  TECHNOLOGY_TIME,
  TECHNOLOGY_ROLES,
  TECHNOLOGY_PARTNERS,
  type TechnologyDraft,
} from "./technology-prototype";
import {
  MANAGEMENT_AREA,
  MANAGEMENT_ACTIVITIES,
  emptyManagement,
  managementIssues,
  managementEvidence,
  type ManagementDraft,
  type ManagerRecord,
} from "./management-prototype";
export const COLLECTION_VERSION = "team-blue-baseline-v3";
export type CollectionDraft = {
  version: typeof COLLECTION_VERSION;
  broad: BroadDraft;
  rich: RichDraft;
  technology: TechnologyDraft;
  management: ManagementDraft;
  started: boolean;
  answerCopy: boolean;
};
export const initialCollection = (): CollectionDraft => ({
  version: COLLECTION_VERSION,
  broad: emptyBroadDraft(),
  rich: emptyRichDraft(),
  technology: emptyTechnology(),
  management: emptyManagement(),
  started: false,
  answerCopy: false,
});
export const managerRecord = (
  profile: Record<string, string>,
): ManagerRecord => ({
  isPeopleManager: profile.manages_people === "yes",
  ...(profile.manages_people === "yes" &&
  /^\d+$/.test(profile.direct_reports ?? "")
    ? { directReports: Number(profile.direct_reports) }
    : {}),
});
export const collectionAreas = (manager: ManagerRecord) =>
  manager.isPeopleManager
    ? [
        ...BROAD_AREAS.filter((a) => a.code !== "other"),
        MANAGEMENT_AREA,
        ...BROAD_AREAS.filter((a) => a.code === "other"),
      ]
    : BROAD_AREAS;
export const collectionSteps = (d: CollectionDraft, manager: ManagerRecord) => [
  "areas",
  "time",
  "contact",
  ...(d.broad.selected.includes("pay_benefits") ? ["payroll"] : []),
  ...(manager.isPeopleManager && d.broad.selected.includes(MANAGEMENT_AREA.code)
    ? ["management"]
    : []),
  "context",
  ...(d.broad.selected.includes("systems_data") ? ["technology"] : []),
  "review",
];
export const COLLECTION_DEFINITION = {
  version: COLLECTION_VERSION,
  areas: BROAD_AREAS,
  managementArea: MANAGEMENT_AREA,
  contactRoutes: CONTACT_ROUTES,
  payrollStages: PAYROLL_STAGES,
  payrollParties: PAYROLL_PARTIES,
  myPayrollPart: MY_PAYROLL_PART,
  localNeeds: LOCAL_NEEDS,
  systems: SYSTEMS,
  workNature: WORK_NATURE,
  technologyActivities: TECHNOLOGY_ACTIVITIES,
  technologyTime: TECHNOLOGY_TIME,
  technologyRoles: TECHNOLOGY_ROLES,
  technologyPartners: TECHNOLOGY_PARTNERS,
  managementActivities: MANAGEMENT_ACTIVITIES,
  timeTolerance: [98, 102],
  method: "broad-current-state-capacity",
  copy: "optional-invite-email-only",
};
function object(x: unknown): Record<string, unknown> {
  if (!x || typeof x !== "object" || Array.isArray(x))
    throw Error("Please check your saved answers.");
  return x as Record<string, unknown>;
}
function fields(x: unknown, keys: string[]) {
  const value = object(x);
  if (Object.keys(value).some((k) => !keys.includes(k)))
    throw Error("Unexpected answer fields. Reload the questionnaire.");
  return value;
}
function tree(x: unknown, depth = 0): void {
  if (depth > 7) throw Error("Please shorten your answers.");
  if (typeof x === "string" && x.length > 4000)
    throw Error("Keep each text answer under 4,000 characters.");
  if (typeof x === "number" && !Number.isFinite(x))
    throw Error("Use a number for time estimates.");
  if (Array.isArray(x)) {
    if (x.length > 80) throw Error("Too many answer options.");
    x.forEach((v) => tree(v, depth + 1));
  } else if (x && typeof x === "object") {
    if (Object.keys(x).length > 100) throw Error("Too many answer fields.");
    Object.entries(x).forEach(([k, v]) => {
      if (k.length > 1000) throw Error("Please shorten the system name.");
      tree(v, depth + 1);
    });
  }
}
function codes(value: unknown, options: string[][] | { code: string }[]) {
  if (
    !Array.isArray(value) ||
    value.some(
      (c) =>
        typeof c !== "string" ||
        !options.some((o) => (Array.isArray(o) ? o[0] === c : o.code === c)),
    ) ||
    new Set(value).size !== value.length
  )
    throw Error("Choose answers from the available options.");
}
function numberMap(value: unknown, keys: string[], max = 100) {
  const map = fields(value, keys);
  if (
    Object.values(map).some(
      (n) => n !== null && (typeof n !== "number" || n < 0 || n > max),
    )
  )
    throw Error("Use percentages between 0 and 100.");
}
export function parseCollection(
  input: unknown,
  manager: ManagerRecord,
): CollectionDraft {
  tree(input);
  const raw = fields(input, Object.keys(initialCollection()));
  if (raw.version !== COLLECTION_VERSION)
    throw Error("This answer belongs to a different questionnaire version.");
  const d = { ...initialCollection(), ...raw } as CollectionDraft;
  const broad = fields(d.broad, Object.keys(emptyBroadDraft())),
    rich = fields(d.rich, Object.keys(emptyRichDraft())),
    technology = fields(d.technology, Object.keys(emptyTechnology())),
    management = fields(d.management, Object.keys(emptyManagement()));
  if (typeof d.started !== "boolean" || typeof d.answerCopy !== "boolean")
    throw Error("Check your questionnaire choices.");
  d.broad = { ...emptyBroadDraft(), ...broad } as BroadDraft;
  d.rich = { ...emptyRichDraft(), ...rich } as RichDraft;
  d.technology = { ...emptyTechnology(), ...technology } as TechnologyDraft;
  d.management = { ...emptyManagement(), ...management } as ManagementDraft;
  const areaCodes = collectionAreas(manager).map((a) => a.code);
  codes(d.broad.selected, collectionAreas(manager));
  numberMap(d.broad.time, areaCodes);
  const notes = fields(d.broad.notes, areaCodes);
  if (
    Object.values(notes).some((v) => typeof v !== "string") ||
    typeof d.broad.occasional !== "string"
  )
    throw Error("Check the text about your work.");
  for (const k of ["routes", "employeeRoutes", "managerRoutes"] as const)
    codes(d.rich[k], CONTACT_ROUTES);
  codes(d.rich.systems, SYSTEMS);
  codes(d.rich.localNeeds, LOCAL_NEEDS);
  numberMap(
    d.rich.routeTime,
    CONTACT_ROUTES.map((o) => o[0]),
  );
  const payroll = fields(
    d.rich.payrollStages,
    PAYROLL_STAGES.map((o) => o[0]),
  );
  for (const value of Object.values(payroll)) {
    const a = fields(value, ["mine", "others"]);
    if (
      typeof a.mine !== "string" ||
      !MY_PAYROLL_PART.some((o) => o[0] === a.mine)
    )
      throw Error("Choose your part in the payroll work.");
    codes(a.others, PAYROLL_PARTIES);
  }
  const nature = fields(d.rich.workNature, areaCodes);
  if (Object.values(nature).some((v) => !WORK_NATURE.some((o) => o[0] === v)))
    throw Error("Choose the main type of work.");
  for (const k of Object.keys(emptyRichDraft()).filter(
    (k) =>
      typeof (emptyRichDraft() as unknown as Record<string, unknown>)[k] ===
      "string",
  ))
    if (
      typeof (rich as Record<string, unknown>)[k] !== "string" &&
      Object.hasOwn(rich, k)
    )
      throw Error("Check your text answers.");
  if (
    typeof d.rich.daysUnknown !== "boolean" ||
    (d.rich.days !== null &&
      (typeof d.rich.days !== "number" || d.rich.days < 0 || d.rich.days > 31))
  )
    throw Error("Use payroll days between 0 and 31.");
  codes(d.technology.activities, TECHNOLOGY_ACTIVITIES);
  codes(
    d.technology.platforms,
    SYSTEMS.filter((o) => o[0] !== "none"),
  );
  codes(d.technology.partners, TECHNOLOGY_PARTNERS);
  numberMap(
    d.technology.time,
    TECHNOLOGY_TIME.map((o) => o[0]),
  );
  for (const [k, value] of Object.entries(object(d.technology.roles))) {
    if (!SYSTEMS.some((o) => o[0] === k) && !k.startsWith("custom:"))
      throw Error("Check the system involvement answers.");
    codes(value, TECHNOLOGY_ROLES);
  }
  for (const k of [
    "involvement",
    "otherActivity",
    "otherPlatform",
    "otherPartner",
    "note",
  ] as const)
    if (typeof d.technology[k] !== "string")
      throw Error("Check the technology answers.");
  codes(d.management.activities, MANAGEMENT_ACTIVITIES);
  for (const k of ["other", "sharedReporting", "note"] as const)
    if (typeof d.management[k] !== "string")
      throw Error("Check the management answers.");
  return d;
}
export function collectionIssues(d: CollectionDraft, manager: ManagerRecord) {
  const areas = collectionAreas(manager),
    selected = d.broad.selected;
  return [
    ...(!d.started ? ["privacy"] : []),
    ...broadIssues(d.broad, 1, areas),
    ...richIssues(d.rich, "time_nature", selected),
    ...richIssues(d.rich, "contact", selected),
    ...richIssues(d.rich, "context", selected),
    ...(selected.includes("pay_benefits")
      ? richIssues(d.rich, "payroll", selected)
      : []),
    ...(manager.isPeopleManager && selected.includes(MANAGEMENT_AREA.code)
      ? managementIssues(d.management)
      : []),
    ...(selected.includes("systems_data")
      ? technologyIssues(d.technology)
      : []),
  ];
}
export function collectionEvidence(d: CollectionDraft, manager: ManagerRecord) {
  return {
    version: d.version,
    ...broadEvidence(d.broad, collectionAreas(manager)),
    ...richEvidence(
      d.rich,
      d.broad.selected,
      d.broad.selected.includes("pay_benefits"),
    ),
    technology: technologyEvidence(
      d.technology,
      d.broad.selected.includes("systems_data"),
    ),
    management: managementEvidence(
      d.management,
      manager.isPeopleManager &&
        d.broad.selected.includes(MANAGEMENT_AREA.code),
    ),
    answerCopyRequested: d.answerCopy,
  };
}

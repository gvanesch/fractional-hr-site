import { AREA_HELP, OPTION_HELP, GROUP_LABELS } from "./help";
export const VERSION = "team-blue-baseline-v2";
export const WORK_TYPES = [
  ["people_operations", "People Operations"],
  ["business_partnering", "People Business Partnering"],
  ["people_technology", "People Technology"],
  ["reception", "Reception / front-of-house"],
  ["facilities", "Facilities / office operations"],
  ["mixed", "Mixed role"],
  ["other", "Other"],
] as const;
export type Category = "ops" | "bp" | "tech" | "office";
export type Area = {
  code: string;
  label: string;
  category: Category;
  example: string;
};
const groups: [Category, string[]][] = [
  [
    "ops",
    [
      "Employee questions and support",
      "Contracts and employee documents",
      "Onboarding",
      "Offboarding",
      "Employee data changes",
      "Absence and time off",
      "Payroll support",
      "Benefits support",
      "Employee relations administration/support",
      "Recruitment administration",
      "Mobility / immigration",
      "Compliance and local administration",
      "Reporting and data",
      "Policies and guidance",
      "People support tickets / service desk",
      "Supplier or vendor coordination",
      "Other People Operations work",
      "Employee events and activities",
    ],
  ],
  [
    "bp",
    [
      "Manager advice and coaching",
      "Employee relations",
      "Organisation change support",
      "Workforce planning",
      "Performance",
      "Talent and succession",
      "Engagement",
      "Reward / compensation input",
      "Recruitment partnership",
      "Change support",
      "People data and insight",
      "Local governance",
      "Operational People administration",
      "Other Business Partnering work",
    ],
  ],
  [
    "tech",
    [
      "Platform administration",
      "System configuration",
      "User support",
      "Integrations",
      "Workflows and automation",
      "AI / digital solutions",
      "Data quality",
      "Reporting and analytics",
      "Access and permissions",
      "Technology governance",
      "Vendor management",
      "Projects and implementations",
      "Documentation / knowledge management",
      "Other People Technology work",
    ],
  ],
  [
    "office",
    [
      "Reception / front desk",
      "Visitors",
      "Mail and deliveries",
      "Office supplies",
      "Building or site access",
      "Badges / passes",
      "Facilities and repairs",
      "Office moves",
      "Workplace suppliers",
      "Health and safety administration",
      "Office logistics",
      "Meeting rooms / office services",
      "Local workplace or office coordination",
      "Other office work",
    ],
  ],
];
export const AREAS: Area[] = groups.flatMap(([category, labels]) =>
  labels.map((label, i) => ({
    code: `${category}_${String(i + 1).padStart(2, "0")}`,
    label,
    category,
    example:
      AREA_HELP[`${category}_${String(i + 1).padStart(2, "0")}`] ??
      {
        ops: "For example: answer employee questions, prepare documents or update records.",
        bp: "For example: advise managers, coordinate a people process or work with local teams.",
        tech: "For example: change system settings, support users or connect two systems.",
        office:
          "For example: welcome visitors, arrange repairs or coordinate office services.",
      }[category],
  })),
);
export const FREQUENCIES = [
  "most_days",
  "most_weeks",
  "most_months",
  "few_times_year",
  "when_needed",
  "project_based",
];
export const FREQUENCY_LABELS = [
  "Most days",
  "Most weeks",
  "Most months",
  "A few times each year",
  "Only when needed",
  "Project-based",
];
export const ROLES = [
  "final_result",
  "lead_part",
  "contribute",
  "advice_approval",
  "administration_support",
  "not_sure",
];
export const ROLE_LABELS = [
  "I am responsible for the final result",
  "I lead an important part of it",
  "I contribute to it",
  "I provide advice or approval",
  "I provide administration or support",
  "I am not sure",
];
export const HANDOFFS = [
  "people_operations",
  "business_partnering",
  "people_technology",
  "reward_specialist",
  "manager_business",
  "finance",
  "it",
  "legal",
  "procurement",
  "external_provider",
  "local_office",
  "other",
  "not_sure",
];
export const HANDOFF_LABELS = [
  "People Operations",
  "People Business Partnering",
  "People Technology",
  "Reward / other People specialist team",
  "Manager / business leader",
  "Finance",
  "IT",
  "Legal",
  "Procurement",
  "External provider/vendor",
  "Local office/facilities",
  "Other",
  "Not sure",
];
export const SYSTEMS = [
  "hibob",
  "jira_jsm",
  "confluence",
  "teamtailor",
  "excel",
  "power_bi",
  "culture_amp",
  "navan",
  "payroll_system",
  "slack",
  "claude",
  "blueai",
  "none",
  "not_sure",
];
export const SYSTEM_LABELS = [
  "HiBob",
  "Jira / Jira Service Management",
  "Confluence",
  "Teamtailor",
  "Excel",
  "Power BI",
  "Culture Amp",
  "Navan",
  "Payroll system",
  "Slack",
  "Claude",
  "BlueAI",
  "No regular system",
  "Not sure",
];
export const systemLabel = (code: string) =>
  SYSTEM_LABELS[SYSTEMS.indexOf(code)] ?? code;
export const KNOWLEDGE = [
  "local_employment",
  "payroll",
  "benefits",
  "employee_relations",
  "people_systems",
  "data_reporting",
  "office_facilities",
  "country_business",
  "specialist_process",
  "other",
  "not_sure",
];
export const KNOWLEDGE_LABELS = [
  "Local employment requirements",
  "Payroll",
  "Benefits",
  "Employee relations",
  "People systems",
  "Data / reporting",
  "Office / facilities",
  "A specific country or business",
  "A specialist process",
  "Other",
  "Not sure",
];
export const CHANNELS = [
  "ticket",
  "email",
  "chat",
  "employees",
  "managers",
  "in_person_phone",
  "system_task",
  "planned",
  "project",
  "other",
  "not_sure",
];
export const CHANNEL_LABELS = [
  "People support ticket / Jira",
  "Email",
  "Slack / Teams",
  "Directly from employees",
  "Directly from managers",
  "In person / telephone",
  "A system-generated task",
  "Regular planned process",
  "Project work",
  "Other",
  "Not sure",
];
export const countryLabel = (code: string) =>
  code === "OTHER"
    ? "Another country"
    : code === "NOT_SURE"
      ? "Not sure"
      : (new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code);
export const STEP_LABELS = [
  "Who your work supports",
  "Your work areas",
  "Time allocation",
  "Main activities",
  "Occasional work",
  "Systems and knowledge",
  "How work reaches you",
  "Extra effort and strengths",
];
export const PRIVACY =
  "This baseline helps us understand current work, protect what works well and identify opportunities to strengthen and improve how we work. Your answers describe work and processes rather than rating people. Your answers are identifiable, not anonymous. Authorised programme administrators can view and export them for this purpose. Do not include employee names, individual cases, health information or other sensitive personal details. Keep your invitation link private. A secure cookie lets you save and return before submitting. Ask the campaign organiser if you have questions about access or how long the information is kept.";
export const QUESTIONS = {
  scope:
    "Does your regular work support one brand or entity, more than one, or the Group?",
  work: "Choose the areas where you currently spend meaningful time.",
  time: "In a typical month, about how much of your working time is spent on each area?",
  activity: "What do you normally do in this area?",
  frequency: "How often do you normally do this work?",
  responsibility: "Which best describes your role in this work?",
  handoffs: "Who do you normally work with or hand this work to/from?",
  cyclical:
    "Is there important work you do only at certain times of the year or only when something happens?",
  systems: "Which systems or tools do you use regularly for your work?",
  knowledge: "What knowledge or experience do colleagues rely on you for?",
  channels:
    "Choose up to five main ways work reaches you. Estimate the share of incoming work through each route.",
  extraEffort:
    "Which parts of your work take more time or manual effort than they should? (optional)",
  strengths:
    "What works particularly well today and should we make sure we keep? (optional)",
  anything:
    "Is there anything important about your current work that we have not asked? (optional)",
};
export const QUESTIONNAIRE = {
  version: VERSION,
  questions: QUESTIONS,
  rosterWorkTypes: WORK_TYPES,
  scopeChoices: ["one_entity", "multiple_entities", "all_group", "not_sure"],
  groups: GROUP_LABELS,
  descriptions: OPTION_HELP,
  activityDescriptions: AREA_HELP,
  intakeLimit: 5,
  areas: AREAS,
  frequencies: FREQUENCIES.map((code, i) => ({
    code,
    label: FREQUENCY_LABELS[i],
  })),
  roles: ROLES.map((code, i) => ({ code, label: ROLE_LABELS[i] })),
  handoffs: HANDOFFS.map((code, i) => ({ code, label: HANDOFF_LABELS[i] })),
  systems: SYSTEMS.map((code, i) => ({ code, label: SYSTEM_LABELS[i] })),
  knowledge: KNOWLEDGE.map((code, i) => ({ code, label: KNOWLEDGE_LABELS[i] })),
  channels: CHANNELS.map((code, i) => ({ code, label: CHANNEL_LABELS[i] })),
  steps: STEP_LABELS,
  privacy: PRIVACY,
  timeTolerance: [98, 102],
  detailLimit: 5,
};
export type Profile = {
  name: string;
  email: string;
  job_title: string;
  country: string;
  region: string;
  entity: string;
  work_type: string;
  manages_people: string;
  direct_reports: string;
  support_levels: string[];
  support_countries: string[];
  support_other: string;
};
export type Detail = {
  description: string;
  frequency: string;
  role: string;
  handoffs: string[];
  other: string;
};
export type EntityOption = { code: string; label: string };
export type Scope = { reach: string; entities: string[] };
export type Draft = {
  version: string;
  privacyAcknowledged: boolean;
  profile: Profile;
  scope: Scope;
  areas: string[];
  customAreas: Area[];
  allocation: Record<string, number>;
  important: string[];
  details: Record<string, Detail>;
  cyclical: { answer: string; text: string };
  systems: string[];
  knowledge: string[];
  knowledgeOther: string;
  channels: string[];
  channelOther: string;
  channelAllocation: Record<string, number>;
  extraEffort: string;
  strengths: string;
  anything: string;
};
export function initialDraft(profile: Partial<Profile> = {}): Draft {
  return {
    version: VERSION,
    privacyAcknowledged: false,
    profile: {
      name: "",
      email: "",
      job_title: "",
      country: "",
      region: "",
      entity: "",
      work_type: "",
      manages_people: "",
      direct_reports: "",
      support_levels: [],
      support_countries: [],
      support_other: "",
      ...profile,
    },
    scope: { reach: "", entities: [] },
    areas: [],
    customAreas: [],
    allocation: {},
    important: [],
    details: {},
    cyclical: { answer: "", text: "" },
    systems: [],
    knowledge: [],
    knowledgeOther: "",
    channels: [],
    channelOther: "",
    channelAllocation: {},
    extraEffort: "",
    strengths: "",
    anything: "",
  };
}
export function pillar(workType: string): string | null {
  return (
    (
      {
        people_operations: "people_operations",
        reception: "people_operations",
        facilities: "people_operations",
        business_partnering: "business_partnering",
        people_technology: "people_technology",
      } as Record<string, string>
    )[workType] ?? null
  );
}
export const areaPillar = (category: Category, code?: string) =>
  code === "bp_13"
    ? "people_operations"
    : category === "bp"
      ? "business_partnering"
      : category === "tech"
        ? "people_technology"
        : "people_operations";
export function availableAreas(_type: string, _all = true, search = "") {
  void _all; // Retained argument for compatibility; all respondents see the same activities.
  return AREAS.filter((area) =>
    area.label.toLowerCase().includes(search.toLowerCase()),
  );
}
export const allocationTotal = (draft: Draft) =>
  Math.round(
    draft.areas.reduce((sum, code) => sum + (draft.allocation[code] ?? 0), 0) *
      100,
  ) / 100;
export function detailCodes(draft: Draft): string[] {
  const largest = [...draft.areas]
    .sort((a, b) => (draft.allocation[b] ?? 0) - (draft.allocation[a] ?? 0))
    .slice(0, 3);
  return [...new Set([...largest, ...draft.important])].slice(0, 5);
}
function strings(value: unknown, max = 40): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= max &&
    value.every((x) => typeof x === "string" && x.length <= 200) &&
    new Set(value).size === value.length
  );
}
export function parseDraft(input: unknown): Draft {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Please check your answers.");
  const d = input as Draft;
  if (
    d.version !== VERSION ||
    typeof d.privacyAcknowledged !== "boolean" ||
    !d.profile ||
    typeof d.profile !== "object" ||
    !strings(d.areas, 40) ||
    !strings(d.important, 2) ||
    !Array.isArray(d.customAreas) ||
    d.customAreas.length > 6 ||
    !d.allocation ||
    !d.details
  )
    throw new Error("Please check your answers.");
  for (const key of [
    "name",
    "email",
    "job_title",
    "country",
    "region",
    "entity",
    "work_type",
    "manages_people",
    "direct_reports",
    "support_other",
  ] as const)
    if (
      typeof d.profile[key] !== "string" ||
      d.profile[key].length > (key === "support_other" ? 500 : 250)
    )
      throw new Error("Please shorten the role or support information.");
  for (const key of ["support_levels", "support_countries"] as const)
    if (!strings(d.profile[key]))
      throw new Error("Please check the countries and areas you support.");
  if (
    d.profile.work_type &&
    !WORK_TYPES.some(([code]) => code === d.profile.work_type)
  )
    throw new Error("Choose a current work type.");
  if (
    d.profile.country &&
    !/^(?:[A-Z]{2}|OTHER|NOT_SURE)$/.test(d.profile.country)
  )
    throw new Error("Choose your country.");
  if (
    !d.profile.support_countries.every((x) =>
      /^(?:[A-Z]{2}|OTHER|NOT_SURE)$/.test(x),
    ) ||
    !d.profile.support_levels.every((x) =>
      [
        "countries",
        "regional",
        "group",
        "business",
        "other",
        "not_sure",
      ].includes(x),
    )
  )
    throw new Error("Check your support areas.");
  if (
    !d.scope ||
    !["", "one_entity", "multiple_entities", "all_group", "not_sure"].includes(
      d.scope.reach,
    ) ||
    !strings(d.scope.entities, 300) ||
    !d.scope.entities.every((code) => /^entity_[a-f0-9]{16}$/.test(code))
  )
    throw new Error("Check the brands or entities you support.");
  if (
    d.customAreas.some(
      (a) =>
        !a ||
        !/^custom_[a-f0-9-]{36}$/.test(a.code) ||
        typeof a.label !== "string" ||
        !a.label.trim() ||
        a.label.length > 120 ||
        !["ops", "bp", "tech", "office"].includes(a.category) ||
        typeof a.example !== "string" ||
        a.example.length > 150,
    )
  )
    throw new Error("Check the added work areas.");
  const known = new Set([...AREAS, ...d.customAreas].map((a) => a.code));
  if (
    new Set(d.customAreas.map((a) => a.code)).size !== d.customAreas.length ||
    !d.areas.every((x) => known.has(x)) ||
    !d.important.every((x) => d.areas.includes(x))
  )
    throw new Error("Check your selected work areas.");
  for (const [code, value] of Object.entries(d.allocation))
    if (
      !d.areas.includes(code) ||
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 100
    )
      throw new Error("Enter a percentage between 0 and 100.");
  for (const [code, detail] of Object.entries(d.details))
    if (
      !d.areas.includes(code) ||
      !detail ||
      typeof detail.description !== "string" ||
      detail.description.length > 700 ||
      typeof detail.other !== "string" ||
      detail.other.length > 300 ||
      !strings(detail.handoffs) ||
      !detail.handoffs.every((x) => HANDOFFS.includes(x)) ||
      typeof detail.frequency !== "string" ||
      (detail.frequency !== "" && !FREQUENCIES.includes(detail.frequency)) ||
      typeof detail.role !== "string" ||
      (detail.role !== "" && !ROLES.includes(detail.role))
    )
      throw new Error("Check your activity details.");
  if (
    !d.cyclical ||
    !["", "yes", "no", "not_sure"].includes(d.cyclical.answer) ||
    typeof d.cyclical.text !== "string" ||
    d.cyclical.text.length > 1000
  )
    throw new Error("Check your occasional work answer.");
  if (
    !strings(d.systems, 30) ||
    !strings(d.knowledge) ||
    !d.knowledge.every((x) => KNOWLEDGE.includes(x)) ||
    !strings(d.channels, 5) ||
    !d.channels.every((x) => CHANNELS.includes(x))
  )
    throw new Error("Choose up to five ways work reaches you.");
  for (const key of [
    "knowledgeOther",
    "channelOther",
    "extraEffort",
    "strengths",
    "anything",
  ] as const)
    if (typeof d[key] !== "string" || d[key].length > 1500)
      throw new Error(
        "Please keep each written answer under 1,500 characters.",
      );
  if (
    !d.channelAllocation ||
    typeof d.channelAllocation !== "object" ||
    Array.isArray(d.channelAllocation)
  )
    throw new Error("Check your incoming-work percentages.");
  for (const [code, value] of Object.entries(d.channelAllocation))
    if (
      !d.channels.includes(code) ||
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 100
    )
      throw new Error("Enter an incoming-work percentage between 0 and 100.");
  // Rebuild a whitelisted object: unknown fields are never persisted or exported.
  return {
    version: VERSION,
    privacyAcknowledged: d.privacyAcknowledged,
    profile: Object.fromEntries(
      Object.keys(initialDraft().profile).map((k) => [
        k,
        d.profile[k as keyof Profile],
      ]),
    ) as Profile,
    scope: { reach: d.scope.reach, entities: d.scope.entities },
    areas: d.areas,
    customAreas: d.customAreas.map(({ code, label, category, example }) => ({
      code,
      label,
      category,
      example,
    })),
    allocation: Object.fromEntries(
      d.areas.filter((x) => x in d.allocation).map((x) => [x, d.allocation[x]]),
    ),
    important: d.important,
    details: Object.fromEntries(
      Object.entries(d.details).map(([code, x]) => [
        code,
        {
          description: x.description,
          frequency: x.frequency,
          role: x.role,
          handoffs: x.handoffs,
          other: x.other,
        },
      ]),
    ),
    cyclical: { answer: d.cyclical.answer, text: d.cyclical.text },
    systems: d.systems,
    knowledge: d.knowledge,
    knowledgeOther: d.knowledgeOther,
    channels: d.channels,
    channelOther: d.channelOther,
    channelAllocation: Object.fromEntries(
      d.channels
        .filter((code) => Object.hasOwn(d.channelAllocation, code))
        .map((code) => [code, d.channelAllocation[code]]),
    ),
    extraEffort: d.extraEffort,
    strengths: d.strengths,
    anything: d.anything,
  };
}

export type ValidationIssue = { step: number; key: string; message: string };
export const intakeTotal = (draft: Draft) =>
  Math.round(
    draft.channels.reduce(
      (sum, code) => sum + (draft.channelAllocation[code] ?? 0),
      0,
    ) * 100,
  ) / 100;
export function validationIssues(
  d: Draft,
  step: number,
  entities: EntityOption[] = [],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (key: string, message: string) =>
    issues.push({ step, key, message });
  if (!d.privacyAcknowledged)
    add("privacy", "Please read how your answers will be used.");
  if (step === 0) {
    if (!d.scope.reach)
      add(
        "scope",
        "Choose whether you support one entity, several entities or the Group.",
      );
    if (
      entities.length &&
      ["one_entity", "multiple_entities"].includes(d.scope.reach)
    ) {
      if (d.scope.reach === "one_entity" && d.scope.entities.length !== 1)
        add(
          "entities",
          "Choose the one brand or entity you regularly support.",
        );
      if (d.scope.reach === "multiple_entities" && d.scope.entities.length < 2)
        add("entities", "Choose the brands or entities you regularly support.");
    }
  }
  if (step === 1 && !d.areas.length)
    add("areas", "Choose at least one area where you spend meaningful time.");
  if (step === 2) {
    const badTotal = allocationTotal(d) < 98 || allocationTotal(d) > 102;
    for (const code of d.areas)
      if (
        badTotal ||
        !Object.hasOwn(d.allocation, code) ||
        d.allocation[code] < 0 ||
        d.allocation[code] > 100
      )
        add(
          "allocation:" + code,
          "Aim for 100% in total. Between 98% and 102% is accepted.",
        );
  }
  if (step === 3)
    for (const code of detailCodes(d)) {
      const detail = d.details[code];
      if (!detail?.description.trim())
        add(
          "detail:" + code + ":description",
          "Briefly describe what you normally do in this area.",
        );
      if (!detail?.frequency)
        add(
          "detail:" + code + ":frequency",
          "Choose how often you normally do this work.",
        );
      if (!detail?.role)
        add(
          "detail:" + code + ":role",
          "Choose the answer that describes your part in this work.",
        );
    }
  if (step === 4) {
    if (!d.cyclical.answer)
      add("cyclical", "Choose an answer about important occasional work.");
    else if (d.cyclical.answer === "yes" && !d.cyclical.text.trim())
      add("cyclicalText", "Briefly describe your important occasional work.");
  }
  if (step === 5) {
    if (!d.systems.length)
      add(
        "systems",
        "Choose your systems or select No regular system / Not sure.",
      );
    if (!d.knowledge.length)
      add(
        "knowledge",
        "Choose the knowledge colleagues rely on, or select Not sure.",
      );
  }
  if (step === 6) {
    if (!d.channels.length)
      add("channels", "Choose up to five main ways work reaches you.");
    const badTotal = intakeTotal(d) < 98 || intakeTotal(d) > 102;
    for (const code of d.channels)
      if (
        badTotal ||
        !Object.hasOwn(d.channelAllocation, code) ||
        d.channelAllocation[code] < 0 ||
        d.channelAllocation[code] > 100
      )
        add(
          "channelAllocation:" + code,
          "Aim for 100% of incoming work in total. Between 98% and 102% is accepted.",
        );
  }
  return issues;
}
export function stepError(
  d: Draft,
  step: number,
  entities: EntityOption[] = [],
) {
  return validationIssues(d, step, entities)[0]?.message ?? null;
}
export function completionError(d: Draft, entities: EntityOption[] = []) {
  for (let step = 0; step < 8; step++) {
    const error = stepError(d, step, entities);
    if (error) return error;
  }
  return null;
}

export function parseRoster(csv: string): Partial<Profile>[] {
  if (csv.length > 250000)
    throw new Error("Please import no more than 200 people at a time.");
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (c === '"') {
      if (quoted && csv[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted || !cell) quoted = !quoted;
      else throw new Error("Check the CSV quotation marks.");
    } else if (!quoted && (c === "," || c === "\n")) {
      row.push(cell.replace(/\r$/, ""));
      cell = "";
      if (c === "\n") {
        rows.push(row);
        row = [];
      }
    } else cell += c;
  }
  if (quoted) throw new Error("Check the CSV quotation marks.");
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const headers =
    rows.shift()?.map((x) =>
      x
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase(),
    ) ?? [];
  if (
    !headers.includes("name") ||
    !headers.includes("email") ||
    new Set(headers).size !== headers.length
  )
    throw new Error("The CSV needs name and email columns. Use the template.");
  const emails = new Set<string>();
  const allowed = [
    "name",
    "email",
    "job_title",
    "country",
    "region",
    "entity",
    "work_type",
    "manages_people",
    "direct_reports",
  ];
  return rows
    .filter((r) => r.some((x) => x.trim()))
    .map((r, i) => {
      if (i >= 200 || r.length !== headers.length)
        throw new Error(
          "Check the CSV column count and keep it to 200 people per file.",
        );
      const p = Object.fromEntries(
        allowed.map((key) => [key, (r[headers.indexOf(key)] ?? "").trim()]),
      ) as Record<string, string>;
      p.email = p.email.toLowerCase();
      if (
        !p.name ||
        p.name.length > 250 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email) ||
        p.email.length > 250 ||
        emails.has(p.email)
      )
        throw new Error(
          `Check the name or email on row ${i + 2}. Emails must be unique.`,
        );
      if (p.country && !/^(?:[A-Z]{2}|OTHER|NOT_SURE)$/.test(p.country))
        throw new Error(`Use a country code such as GB on row ${i + 2}.`);
      if (p.work_type && !WORK_TYPES.some(([code]) => code === p.work_type))
        throw new Error(`Check the work_type code on row ${i + 2}.`);
      if (
        p.manages_people &&
        !["yes", "no", "not_sure"].includes(p.manages_people)
      )
        throw new Error(
          `Use yes, no or not_sure for manages_people on row ${i + 2}.`,
        );
      if (
        p.direct_reports &&
        (!/^\d{1,4}$/.test(p.direct_reports) || Number(p.direct_reports) > 1000)
      )
        throw new Error(`Check direct_reports on row ${i + 2}.`);
      if (Object.values(p).some((v) => v.length > 250))
        throw new Error(`Please shorten row ${i + 2}.`);
      emails.add(p.email);
      return p;
    });
}
export function csvCell(value: unknown): string {
  let s =
    value == null
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  if (typeof value !== "number" && /^\s*[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = [...new Set(rows.flatMap(Object.keys))];
  return [
    keys.map(csvCell).join(","),
    ...rows.map((row) => keys.map((key) => csvCell(row[key])).join(",")),
  ].join("\r\n");
}

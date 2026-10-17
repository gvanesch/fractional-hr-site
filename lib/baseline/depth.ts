// Current-work evidence for the v5 collection. Country region is a working project register, not a reporting-line inference.
export const PROJECT_COUNTRIES = [
  ["DK", "Denmark", "Northern Europe"],
  ["FI", "Finland", "Northern Europe"],
  ["SE", "Sweden", "Northern Europe"],
  ["GB", "United Kingdom", "Northern Europe"],
  ["IE", "Ireland", "Northern Europe"],
  ["BE", "Belgium", "Western Europe"],
  ["FR", "France", "Western Europe"],
  ["DE", "Germany", "Western Europe"],
  ["NL", "Netherlands", "Western Europe"],
  ["GR", "Greece", "Southern Europe"],
  ["IT", "Italy", "Southern Europe"],
  ["PT", "Portugal", "Southern Europe"],
  ["ES", "Spain", "Southern Europe"],
  ["CH", "Switzerland", "Southern Europe"],
  ["BG", "Bulgaria", "Central and Eastern Europe"],
  ["CZ", "Czech Republic", "Central and Eastern Europe"],
  ["HU", "Hungary", "Central and Eastern Europe"],
  ["SK", "Slovakia", "Central and Eastern Europe"],
  ["TR", "Turkey", "Central and Eastern Europe"],
  ["RS", "Serbia", "Central and Eastern Europe"],
  ["AT", "Austria", "Allocation to confirm"],
];
export const COUNTRY_OPTIONS = [
  ...PROJECT_COUNTRIES.map(([c, l]) => [c, l]),
  ["other", "Other country / countries"],
  ["group", "Group-wide work, not attributable to one country"],
  ["unknown", "Not sure"],
];
export const LOCAL_REQUIREMENTS = [
  ["language", "Local language"],
  ["law", "Country employment / regulatory knowledge"],
  ["consultation", "Employee representatives / collective agreements"],
  ["onsite", "Physical presence / office cover"],
  ["entity", "Business or entity-specific knowledge"],
  ["timezone", "Service hours / time zone"],
  ["other", "Other requirement"],
  ["none", "No specific local requirement"],
  ["unknown", "Not sure"],
];
export const WORK_PARTIES = [
  ["employees", "Employees"],
  ["managers", "Line managers"],
  ["local_people", "Local People team"],
  ["regional_people", "Regional People team"],
  ["group_people", "Group People / specialist team"],
  ["finance", "Finance / Payroll"],
  ["it", "IT / People Technology"],
  ["legal", "Legal / employee representatives"],
  ["provider", "External provider / contractor"],
  ["system", "System / automated workflow"],
  ["other", "Other team"],
  ["none", "No hand-off"],
  ["unknown", "Not sure"],
];
export const OWNERSHIP = [
  ["accountable", "Accountable for the whole process / service"],
  ["steps", "Own a defined part of the process"],
  ["deliver", "Deliver tasks within a process owned by someone else"],
  ["coordinate", "Coordinate others delivering the work"],
  ["advise", "Advise or approve rather than deliver"],
  ["unknown", "Not sure"],
];
export const TASKS: Record<string, string[][]> = {
  lifecycle: [
    ["join", "Onboarding / joining"],
    ["leave", "Offboarding / leaving"],
    ["changes", "Job, contract and employee changes"],
    ["documents", "Contracts, letters and employee records"],
    ["absence", "Leave and absence administration"],
    ["questions", "Everyday employee / manager questions"],
    ["mobility", "Country moves / work permits"],
    ["other", "Other lifecycle work"],
  ],
  recruitment: [
    ["source", "Sourcing candidates"],
    ["coordinate", "Interview and candidate coordination"],
    ["select", "Assessment and selection"],
    ["offer", "Offers and hiring administration"],
    ["plan", "Hiring-manager advice / recruitment planning"],
    ["other", "Other recruitment work"],
  ],
  pay_benefits: [
    ["payroll", "Payroll preparation, checking and coordination"],
    ["benefits", "Benefits administration / providers"],
    ["review", "Salary reviews / reward cycles"],
    ["questions", "Pay / benefits questions and corrections"],
    ["other", "Other pay and benefits work"],
  ],
  advice_cases: [
    ["advice", "Everyday manager advice"],
    ["cases", "Employee relations / complex cases"],
    ["performance", "Absence / performance case support"],
    ["change", "Restructuring, redundancy and change cases"],
    ["legal", "Legal, consultation and specialist coordination"],
    ["other", "Other advice / case work"],
  ],
  planning_development: [
    ["planning", "Workforce and organisation planning"],
    ["performance", "Performance review processes"],
    ["talent", "Talent and succession"],
    ["learning", "Learning and development"],
    ["change", "People support for business change"],
    ["other", "Other planning / development work"],
  ],
  experience: [
    ["feedback", "Surveys, listening and feedback"],
    ["communication", "Employee communications"],
    ["events", "Events, recognition and engagement"],
    ["improvement", "Employee experience improvements"],
    ["other", "Other employee experience work"],
  ],
  policies: [
    ["policy", "Policy design / updates"],
    ["compliance", "Local requirements and compliance checks"],
    ["audit", "Audits and reporting"],
    ["consultation", "Representatives / consultation"],
    ["training", "Mandatory or compliance training"],
    ["other", "Other policy / governance work"],
  ],
  office: [
    ["reception", "Reception, visitors and deliveries"],
    ["facilities", "Facilities, repairs and building access"],
    ["supplies", "Office supplies and workplace suppliers"],
    ["safety", "Workplace / safety administration"],
    ["fleet", "Fleet or company cars"],
    ["events", "Office activities and practical support"],
    ["other", "Other office / facilities work"],
  ],
  other: [["other", "Other work — describe below"]],
};
export const MONTHS = [
  ["01", "January"],
  ["02", "February"],
  ["03", "March"],
  ["04", "April"],
  ["05", "May"],
  ["06", "June"],
  ["07", "July"],
  ["08", "August"],
  ["09", "September"],
  ["10", "October"],
  ["11", "November"],
  ["12", "December"],
  ["variable", "Timing varies / event-driven"],
  ["unknown", "Not sure"],
];
export const CAPACITY = [
  ["available", "Usually have some uncommitted time"],
  ["balanced", "Current demand broadly fits available time"],
  ["stretched", "Often need overtime or defer work"],
  ["overloaded", "Regularly cannot meet important demand"],
  ["variable", "Varies substantially"],
  ["unknown", "Not sure"],
];
export const NUMBER_BASIS = [
  ["records", "Based on records"],
  ["estimate", "My estimate"],
  ["unknown", "Not known"],
  ["na", "Not applicable"],
];
export const AUTONOMY = [
  ["guided", "Work to defined instructions with regular review"],
  ["independent", "Independently apply established policies / procedures"],
  ["complex", "Resolve complex exceptions and advise others"],
  ["design", "Set standards / design processes and make cross-team decisions"],
  ["strategy", "Set strategy and make material resource / risk decisions"],
  ["mixed", "A substantial mix — explain below"],
  ["unknown", "Not sure"],
];
export type WorkDetail = {
  tasks: string[];
  taskTime: Record<string, number | null>;
  taskTimeUnknown: boolean;
  taskNote: string;
  local: string[];
  localNote: string;
  ownership: string;
  ownerTeam: string;
  receives: string[];
  passes: string[];
  handoffNote: string;
  volumeBasis: string;
  volume: number | null;
  volumeUnit: string;
  volumePeriod: string;
  handlingBasis: string;
  handlingMinutes: number | null;
  reworkBasis: string;
  reworkPercent: number | null;
  transferable: string;
  transferPercent: number | null;
  transferNote: string;
};
export const emptyWorkDetail = (): WorkDetail => ({
  tasks: [],
  taskTime: {},
  taskTimeUnknown: false,
  taskNote: "",
  local: [],
  localNote: "",
  ownership: "",
  ownerTeam: "",
  receives: [],
  passes: [],
  handoffNote: "",
  volumeBasis: "",
  volume: null,
  volumeUnit: "",
  volumePeriod: "",
  handlingBasis: "",
  handlingMinutes: null,
  reworkBasis: "",
  reworkPercent: null,
  transferable: "",
  transferPercent: null,
  transferNote: "",
});
export type DepthDraft = {
  resumeStep: string;
  basedCountry: string;
  basedOther: string;
  countries: string[];
  otherCountries: string;
  countryTime: Record<string, number | null>;
  countryTimeUnknown: boolean;
  businesses: string;
  languages: string;
  populationBasis: string;
  supportedEmployees: number | null;
  work: Record<string, WorkDetail>;
  autonomy: string;
  complexity: string;
  impact: string;
  decisionExample: string;
  escalation: string;
  capacity: string;
  weeklyHours: number | null;
  hoursBasis: string;
  overtimeHours: number | null;
  availableHours: number | null;
  availableBasis: string;
  fixedOnsiteHours: number | null;
  unmetWork: string;
  peakPattern: string;
  peakMonths: string[];
  peakExtraHours: number | null;
  peakBasis: string;
  peakDescription: string;
  backup: string;
  improvements: string;
  serviceMetrics: string;
  metricName: string;
  metricTarget: string;
  metricActual: string;
  metricPeriod: string;
  metricSource: string;
  costKnowledge: string;
  providerCost: number | null;
  costCurrency: string;
  costPeriod: string;
  costSource: string;
};
export const emptyDepth = (): DepthDraft => ({
  resumeStep: "",
  basedCountry: "",
  basedOther: "",
  countries: [],
  otherCountries: "",
  countryTime: {},
  countryTimeUnknown: false,
  businesses: "",
  languages: "",
  populationBasis: "",
  supportedEmployees: null,
  work: {},
  autonomy: "",
  complexity: "",
  impact: "",
  decisionExample: "",
  escalation: "",
  capacity: "",
  weeklyHours: null,
  hoursBasis: "",
  overtimeHours: null,
  availableHours: null,
  availableBasis: "",
  fixedOnsiteHours: null,
  unmetWork: "",
  peakPattern: "",
  peakMonths: [],
  peakExtraHours: null,
  peakBasis: "",
  peakDescription: "",
  backup: "",
  improvements: "",
  serviceMetrics: "",
  metricName: "",
  metricTarget: "",
  metricActual: "",
  metricPeriod: "",
  metricSource: "",
  costKnowledge: "",
  providerCost: null,
  costCurrency: "",
  costPeriod: "",
  costSource: "",
});
export function coverageCountries(d: DepthDraft) {
  const standard = d.countries
    .filter((c) => c !== "other")
    .map((code) => ({
      code,
      label: COUNTRY_OPTIONS.find((o) => o[0] === code)?.[1] ?? code,
      region: PROJECT_COUNTRIES.find((o) => o[0] === code)?.[2] ?? "",
    }));
  const names = d.countries.includes("other")
    ? [
        ...new Map(
          d.otherCountries
            .split(/[\n;]+/)
            .map((n) => n.trim())
            .filter(Boolean)
            .map((n) => [n.toLowerCase(), n]),
        ).values(),
      ]
    : [];
  return [
    ...standard,
    ...names.map((label) => ({
      code: "custom:" + encodeURIComponent(label.toLowerCase()),
      label,
      region: "Outside core register",
    })),
  ];
}
export const sumShares = (
  selected: string[],
  map: Record<string, number | null>,
) =>
  Math.round(
    selected.reduce(
      (n, c) =>
        n +
        (typeof map[c] === "number" && Number.isFinite(map[c]) ? map[c]! : 0),
      0,
    ) * 100,
  ) / 100;
const chosen = (v: string[], options: string[][]) =>
  v.length > 0 &&
  v.every((c) => options.some((o) => o[0] === c)) &&
  !(v.length > 1 && v.some((c) => ["none", "unknown"].includes(c)));
const text = (v: string) => v.trim().length > 0;
const number = (v: number | null, max = 100) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;
const known = (v: string) => ["records", "estimate"].includes(v);
const splitIssues = (
  selected: string[],
  map: Record<string, number | null>,
  prefix: string,
) => {
  const missing = selected.filter((c) => !number(map[c]));
  return (
    missing.length
      ? missing
      : sumShares(selected, map) < 98 || sumShares(selected, map) > 102
        ? selected
        : []
  ).map((c) => prefix + c);
};
export function depthIssues(d: DepthDraft, selected: string[], step: string) {
  const issues: string[] = [];
  const need = (condition: boolean, key: string) => {
    if (!condition) issues.push(key);
  };
  if (step === "coverage") {
    need(
      PROJECT_COUNTRIES.some((c) => c[0] === d.basedCountry) ||
        ["other", "unknown"].includes(d.basedCountry),
      "basedCountry",
    );
    if (d.basedCountry === "other") need(text(d.basedOther), "basedOther");
    need(chosen(d.countries, COUNTRY_OPTIONS), "countries");
    if (d.countries.includes("other"))
      need(
        text(d.otherCountries) &&
          coverageCountries(d).filter((c) => c.code.startsWith("custom:"))
            .length <= 20 &&
          coverageCountries(d).every((c) => c.label.length <= 80),
        "otherCountries",
      );
    if (!d.countryTimeUnknown && !d.countries.includes("unknown"))
      issues.push(
        ...splitIssues(
          coverageCountries(d).map((c) => c.code),
          d.countryTime,
          "countryTime_",
        ),
      );
    need(text(d.businesses), "businesses");
    need(text(d.languages), "languages");
    need(
      NUMBER_BASIS.some((o) => o[0] === d.populationBasis),
      "populationBasis",
    );
    if (known(d.populationBasis))
      need(number(d.supportedEmployees, 1e9), "supportedEmployees");
  }
  if (step === "work_detail")
    for (const area of selected) {
      const w = d.work[area] ?? emptyWorkDetail(),
        p = area + "_";
      if (TASKS[area]) {
        need(
          chosen(w.tasks, [...TASKS[area], ["unknown", "Not sure"]]),
          p + "tasks",
        );
        if (!w.taskTimeUnknown && !w.tasks.includes("unknown"))
          issues.push(...splitIssues(w.tasks, w.taskTime, p + "taskTime_"));
        if (w.tasks.includes("other")) need(text(w.taskNote), p + "taskNote");
      }
      need(chosen(w.local, LOCAL_REQUIREMENTS), p + "local");
      if (w.local.some((c) => !["none", "unknown"].includes(c)))
        need(text(w.localNote), p + "localNote");
      need(
        OWNERSHIP.some((o) => o[0] === w.ownership),
        p + "ownership",
      );
      need(text(w.ownerTeam), p + "ownerTeam");
      need(chosen(w.receives, WORK_PARTIES), p + "receives");
      need(chosen(w.passes, WORK_PARTIES), p + "passes");
      need(
        NUMBER_BASIS.some((o) => o[0] === w.volumeBasis),
        p + "volumeBasis",
      );
      if (known(w.volumeBasis)) {
        need(number(w.volume, 1e9), p + "volume");
        need(
          ["week", "month", "year"].includes(w.volumePeriod),
          p + "volumePeriod",
        );
      }
      need(
        NUMBER_BASIS.some((o) => o[0] === w.handlingBasis),
        p + "handlingBasis",
      );
      if (
        known(w.volumeBasis) ||
        known(w.handlingBasis) ||
        known(w.reworkBasis)
      )
        need(text(w.volumeUnit), p + "volumeUnit");
      if (known(w.handlingBasis))
        need(number(w.handlingMinutes, 100000), p + "handlingMinutes");
      need(
        NUMBER_BASIS.some((o) => o[0] === w.reworkBasis),
        p + "reworkBasis",
      );
      if (known(w.reworkBasis))
        need(number(w.reworkPercent), p + "reworkPercent");
      need(
        ["yes", "part", "no", "unknown"].includes(w.transferable),
        p + "transferable",
      );
      if (["yes", "part"].includes(w.transferable)) {
        need(number(w.transferPercent), p + "transferPercent");
        need(text(w.transferNote), p + "transferNote");
      }
    }
  if (step === "role_capacity") {
    for (const [key, options] of [
      ["autonomy", AUTONOMY],
      ["capacity", CAPACITY],
      ["hoursBasis", NUMBER_BASIS],
      ["availableBasis", NUMBER_BASIS],
    ] as const)
      need(
        options.some((o) => o[0] === d[key]),
        key,
      );
    need(
      ["standard", "varied", "complex", "novel", "unknown"].includes(
        d.complexity,
      ),
      "complexity",
    );
    need(
      [
        "individual",
        "team",
        "country",
        "regional",
        "group",
        "unknown",
      ].includes(d.impact),
      "impact",
    );
    need(text(d.decisionExample), "decisionExample");
    need(text(d.escalation), "escalation");
    if (known(d.hoursBasis)) need(number(d.weeklyHours, 168), "weeklyHours");
    if (known(d.availableBasis))
      need(number(d.availableHours, 168), "availableHours");
    if (d.overtimeHours !== null)
      need(number(d.overtimeHours, 168), "overtimeHours");
    if (d.fixedOnsiteHours !== null)
      need(number(d.fixedOnsiteHours, 168), "fixedOnsiteHours");
    if (
      d.weeklyHours !== null &&
      d.availableHours !== null &&
      known(d.availableBasis)
    )
      need(
        d.availableHours + (d.fixedOnsiteHours ?? 0) <= d.weeklyHours,
        "availableHours",
      );
    need(
      ["none", "seasonal", "events", "unknown"].includes(d.peakPattern),
      "peakPattern",
    );
    if (["seasonal", "events"].includes(d.peakPattern)) {
      need(
        NUMBER_BASIS.some((o) => o[0] === d.peakBasis),
        "peakBasis",
      );
      need(chosen(d.peakMonths, MONTHS), "peakMonths");
      need(text(d.peakDescription), "peakDescription");
      if (known(d.peakBasis))
        need(number(d.peakExtraHours, 168), "peakExtraHours");
    }
    need(["full", "partial", "none", "unknown"].includes(d.backup), "backup");
    need(["yes", "no", "unknown"].includes(d.serviceMetrics), "serviceMetrics");
    if (d.serviceMetrics === "yes")
      for (const k of [
        "metricName",
        "metricTarget",
        "metricActual",
        "metricPeriod",
        "metricSource",
      ] as const)
        need(text(d[k]), k);
    need(["known", "unknown", "na"].includes(d.costKnowledge), "costKnowledge");
    if (d.costKnowledge === "known") {
      need(number(d.providerCost, 1e12), "providerCost");
      for (const k of ["costCurrency", "costPeriod", "costSource"] as const)
        need(text(d[k]), k);
      need(/^[A-Za-z]{3}$/.test(d.costCurrency.trim()), "costCurrency");
    }
  }
  return issues;
}
// Validate partial drafts as well as final answers; never accept arbitrary nested fields or non-finite numbers.
export function parseDepth(value: unknown, areaCodes: string[]): DepthDraft {
  const object = (v: unknown): Record<string, unknown> => {
    if (!v || typeof v !== "object" || Array.isArray(v))
      throw Error("Check the detailed work answers.");
    return v as Record<string, unknown>;
  };
  const shape = (v: unknown, defaults: object) => {
    const x = object(v);
    if (Object.keys(x).some((k) => !Object.hasOwn(defaults, k)))
      throw Error("Unexpected detailed work fields.");
    return x;
  };
  const list = (v: unknown, allowed: string[]) => {
    if (
      !Array.isArray(v) ||
      v.some((c) => typeof c !== "string" || !allowed.includes(c)) ||
      new Set(v).size !== v.length
    )
      throw Error("Choose from the listed detailed work options.");
  };
  const map = (v: unknown, allowed: string[], custom = false) => {
    const x = object(v);
    if (
      Object.keys(x).some(
        (c) =>
          !allowed.includes(c) &&
          !(custom && /^custom:[A-Za-z0-9%_.!~*'()-]{1,720}$/.test(c)),
      ) ||
      Object.values(x).some(
        (n) =>
          n !== null &&
          (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 100),
      )
    )
      throw Error("Use percentages between 0 and 100.");
  };
  const checkTypes = (
    x: Record<string, unknown>,
    defaults: Record<string, unknown>,
  ) => {
    for (const [k, v] of Object.entries(x)) {
      const def = defaults[k];
      if (typeof def === "string" && (typeof v !== "string" || v.length > 2000))
        throw Error("Keep each detailed answer under 2,000 characters.");
      if (typeof def === "boolean" && typeof v !== "boolean")
        throw Error("Check your detailed work choices.");
      if (
        def === null &&
        v !== null &&
        (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1e12)
      )
        throw Error("Use a positive number or leave unknown values blank.");
    }
  };
  const raw = shape(value, emptyDepth());
  checkTypes(raw, emptyDepth());
  const d = { ...emptyDepth(), ...raw } as DepthDraft;
  list(
    d.countries,
    COUNTRY_OPTIONS.map((o) => o[0]),
  );
  list(
    d.peakMonths,
    MONTHS.map((o) => o[0]),
  );
  map(
    d.countryTime,
    COUNTRY_OPTIONS.filter((o) => o[0] !== "unknown").map((o) => o[0]),
    true,
  );
  const work = object(d.work);
  if (Object.keys(work).some((c) => !areaCodes.includes(c)))
    throw Error("Check the detailed work areas.");
  d.work = {};
  for (const [area, value] of Object.entries(work)) {
    const x = shape(value, emptyWorkDetail());
    checkTypes(x, emptyWorkDetail());
    const w = { ...emptyWorkDetail(), ...x } as WorkDetail;
    list(w.tasks, [...(TASKS[area] ?? []).map((o) => o[0]), "unknown"]);
    map(
      w.taskTime,
      (TASKS[area] ?? []).map((o) => o[0]),
    );
    list(
      w.local,
      LOCAL_REQUIREMENTS.map((o) => o[0]),
    );
    list(
      w.receives,
      WORK_PARTIES.map((o) => o[0]),
    );
    list(
      w.passes,
      WORK_PARTIES.map((o) => o[0]),
    );
    d.work[area] = w;
  }
  return d;
}
export function depthEvidence(d: DepthDraft, selected: string[]) {
  const pct = (n: number | null | undefined) =>
    typeof n === "number" && Number.isFinite(n) ? n : null;
  const countryUnknown =
    d.countryTimeUnknown || d.countries.includes("unknown");
  return {
    basedCountry: d.basedCountry,
    basedOther: d.basedCountry === "other" ? d.basedOther : "",
    businesses: d.businesses,
    languages: d.languages,
    populationBasis: d.populationBasis,
    supportedEmployees: known(d.populationBasis) ? d.supportedEmployees : null,
    countryTimeUnknown: countryUnknown,
    countries: coverageCountries(d).map(({ code, label, region }) => ({
      code,
      label,
      region,
      shareOfWorkingTime: countryUnknown ? null : pct(d.countryTime[code]),
    })),
    work: selected.map((area) => {
      const w = d.work[area] ?? emptyWorkDetail();
      return {
        area,
        tasks: (TASKS[area] ? w.tasks : []).map((code) => ({
          code,
          label: TASKS[area]?.find((o) => o[0] === code)?.[1] ?? code,
          shareOfAreaTime:
            w.taskTimeUnknown || w.tasks.includes("unknown")
              ? null
              : pct(w.taskTime[code]),
        })),
        taskTimeUnknown: w.taskTimeUnknown,
        taskNote: w.tasks.includes("other") ? w.taskNote : "",
        local: w.local,
        localNote: w.local.some((c) => !["none", "unknown"].includes(c))
          ? w.localNote
          : "",
        ownership: w.ownership,
        ownerTeam: w.ownerTeam,
        receives: w.receives,
        passes: w.passes,
        handoffNote: w.handoffNote,
        volumeBasis: w.volumeBasis,
        volume: known(w.volumeBasis) ? w.volume : null,
        volumeUnit:
          known(w.volumeBasis) || known(w.handlingBasis) || known(w.reworkBasis)
            ? w.volumeUnit
            : "",
        volumePeriod: known(w.volumeBasis) ? w.volumePeriod : "",
        handlingBasis: w.handlingBasis,
        handlingMinutes: known(w.handlingBasis) ? w.handlingMinutes : null,
        reworkBasis: w.reworkBasis,
        reworkPercent: known(w.reworkBasis) ? w.reworkPercent : null,
        transferable: w.transferable,
        transferPercent: ["yes", "part"].includes(w.transferable)
          ? w.transferPercent
          : null,
        transferNote: ["yes", "part"].includes(w.transferable)
          ? w.transferNote
          : "",
      };
    }),
    role: {
      autonomy: d.autonomy,
      complexity: d.complexity,
      impact: d.impact,
      decisionExample: d.decisionExample,
      escalation: d.escalation,
    },
    capacity: {
      capacity: d.capacity,
      hoursBasis: d.hoursBasis,
      weeklyHours: known(d.hoursBasis) ? d.weeklyHours : null,
      overtimeHours: d.overtimeHours,
      availableBasis: d.availableBasis,
      availableHours: known(d.availableBasis) ? d.availableHours : null,
      fixedOnsiteHours: d.fixedOnsiteHours,
      unmetWork: d.unmetWork,
      backup: d.backup,
      improvements: d.improvements,
    },
    peaks: {
      pattern: d.peakPattern,
      months: ["seasonal", "events"].includes(d.peakPattern)
        ? d.peakMonths
        : [],
      description: ["seasonal", "events"].includes(d.peakPattern)
        ? d.peakDescription
        : "",
      basis: ["seasonal", "events"].includes(d.peakPattern) ? d.peakBasis : "",
      extraWeeklyHours:
        ["seasonal", "events"].includes(d.peakPattern) && known(d.peakBasis)
          ? d.peakExtraHours
          : null,
    },
    metrics: {
      status: d.serviceMetrics,
      name: d.serviceMetrics === "yes" ? d.metricName : "",
      target: d.serviceMetrics === "yes" ? d.metricTarget : "",
      actual: d.serviceMetrics === "yes" ? d.metricActual : "",
      period: d.serviceMetrics === "yes" ? d.metricPeriod : "",
      source: d.serviceMetrics === "yes" ? d.metricSource : "",
    },
    costs: {
      status: d.costKnowledge,
      amount: d.costKnowledge === "known" ? d.providerCost : null,
      currency: d.costKnowledge === "known" ? d.costCurrency : "",
      period: d.costKnowledge === "known" ? d.costPeriod : "",
      source: d.costKnowledge === "known" ? d.costSource : "",
    },
  };
}

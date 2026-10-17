// Synthetic QA answers only. Never import into the launch campaign or send invitations.
exports.fillDepth = function (d) {
  const t = {
    resumeStep: "role_capacity",
    basedCountry: "FI",
    basedOther: "",
    countries: ["FI", "SE", "other"],
    otherCountries: "Norway",
    countryTime: { FI: 60, SE: 30, "custom:norway": 10 },
    countryTimeUnknown: false,
    businesses: "Synthetic Finland and Sweden businesses",
    populationBasis: "estimate",
    supportedEmployees: 200,
    languages: "Finnish — professional; English — professional",
    work: {},
    autonomy: "independent",
    complexity: "complex",
    impact: "country",
    decisionExample:
      "Resolve a standard contract correction within approved templates; exceptions require senior review.",
    escalation:
      "Regional People lead approves exceptions and Finance approves expenditure.",
    capacity: "stretched",
    weeklyHours: 37.5,
    hoursBasis: "records",
    overtimeHours: 3,
    availableHours: 1,
    availableBasis: "estimate",
    fixedOnsiteHours: 8,
    unmetWork: "Synthetic backlog: five routine requests waiting two days.",
    peakPattern: "seasonal",
    peakMonths: ["11", "12"],
    peakExtraHours: 10,
    peakBasis: "estimate",
    peakDescription: "Annual review cycle adds two weeks of checks.",
    backup: "partial",
    improvements:
      "Standardise contract input and automate repeated data entry.",
    serviceMetrics: "yes",
    metricName: "Synthetic lifecycle requests completed within two days (%)",
    metricTarget: "90%",
    metricActual: "85%",
    metricPeriod: "September 2026",
    metricSource: "Synthetic service tracker",
    costKnowledge: "known",
    providerCost: 800,
    costCurrency: "EUR",
    costPeriod: "Monthly synthetic provider support for the Finland business",
    costSource: "Synthetic Finance contract register",
  };
  const taskCodes = {
    lifecycle: ["join", "leave"],
    recruitment: ["source"],
    pay_benefits: ["payroll"],
    advice_cases: ["advice"],
    planning_development: ["planning"],
    experience: ["feedback"],
    policies: ["policy"],
    office: ["reception", "facilities"],
    other: ["other"],
  };
  for (const area of d.broad.selected) {
    const tasks = taskCodes[area] ?? [];
    t.work[area] = {
      tasks,
      taskTime: Object.fromEntries(
        tasks.map((c, i) => [c, tasks.length === 1 ? 100 : i === 0 ? 60 : 40]),
      ),
      taskTimeUnknown: false,
      taskNote: area === "other" ? "Synthetic additional work" : "",
      local: ["language", "onsite"],
      localNote:
        "Finnish employee support and eight hours of Helsinki office cover.",
      ownership: "steps",
      ownerTeam: "Regional People Operations lead",
      receives: ["managers", "system"],
      passes: ["finance", "it"],
      handoffNote: "Manager input waits for a complete approval record.",
      volumeBasis: "estimate",
      volume: 50,
      volumeUnit: "Personal requests",
      volumePeriod: "month",
      handlingBasis: "estimate",
      handlingMinutes: 15,
      reworkBasis: "records",
      reworkPercent: 5,
      transferable: "part",
      transferPercent: 40,
      transferNote:
        "Routine requests could be shared after language training, system permissions and local escalation are agreed.",
    };
  }
  d.depth = t;
  return d;
};

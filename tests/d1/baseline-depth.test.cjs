const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  esbuild = require("esbuild");
async function load(file) {
  const b = await esbuild.build({
    entryPoints: [require("node:path").resolve(__dirname, "../../" + file)],
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
  });
  const m = { exports: {} };
  new Function("module", "exports", b.outputFiles[0].text)(m, m.exports);
  return m.exports;
}
const { fillDepth } = require("../../scripts/baseline/depth-fixture.cjs");
async function fixture() {
  const c = await load("lib/baseline/collection.ts"),
    m = await load("lib/baseline/depth.ts"),
    d = c.initialCollection(c.DEPTH_COLLECTION_VERSION);
  d.broad.selected = ["lifecycle"];
  d.broad.time = { lifecycle: 100 };
  fillDepth(d);
  return { c, m, d };
}
test("Simplified revision keeps headcount and estimates without removed basis or transfer questions", async () => {
  const { c, m, d } = await fixture();
  const originalKeys = Object.keys(m.emptyDepth());
  d.depth.formRevision = m.PREVIOUS_DEPTH_FORM_REVISION;
  d.depth.populationBasis = "";
  const w = d.depth.work.lifecycle;
  w.ownership = "accountable";
  w.ownerTeam = "Hidden historic owner";
  w.volumeBasis = w.handlingBasis = w.reworkBasis = "";
  w.transferable = "";
  assert.deepEqual(m.depthIssues(d.depth, d.broad.selected, "coverage"), []);
  assert.deepEqual(m.depthIssues(d.depth, d.broad.selected, "work_detail"), []);
  const parsed = m.parseDepth(d.depth, d.broad.selected);
  assert.equal(parsed.work.lifecycle.ownerTeam, "Hidden historic owner");
  const e = m.depthEvidence(parsed, d.broad.selected);
  assert.equal(e.supportedEmployees, 200);
  assert.equal(e.work[0].ownerTeam, "My role");
  assert.equal(e.work[0].volume, 50);
  assert.equal(e.work[0].reworkPercent, 5);
  assert.equal(e.work[0].handlingMinutes, null);
  assert.equal(e.work[0].transferPercent, null);
  assert.equal(e.work[0].transferNote, "");
  assert.deepEqual(Object.keys(m.emptyDepth()), originalKeys);
  assert.ok(
    !Object.keys(c.DEPTH_COLLECTION_DEFINITION).includes("formRevision"),
  );
  assert.throws(() =>
    m.parseDepth({ ...d.depth, formRevision: "injected" }, d.broad.selected),
  );
  w.ownership = "steps";
  w.ownerTeam = "";
  assert.ok(
    m
      .depthIssues(d.depth, d.broad.selected, "work_detail")
      .includes("lifecycle_ownerTeam"),
  );
  d.depth.supportedEmployees = null;
  assert.ok(
    m
      .depthIssues(d.depth, d.broad.selected, "coverage")
      .includes("supportedEmployees"),
  );
});
test("Manager advice handoffs are relevant and stale hidden choices cannot count as answers", async () => {
  const { m, d } = await fixture();
  d.depth.formRevision = m.PREVIOUS_DEPTH_FORM_REVISION;
  for (const direction of ["receives", "passes"]) {
    const codes = m.handoffOptions("advice_cases", direction).map((o) => o[0]);
    for (const excluded of ["it", "finance", "provider"])
      assert.ok(!codes.includes(excluded));
    assert.ok(codes.includes("other"));
  }
  const w = d.depth.work.lifecycle;
  d.depth.work.advice_cases = {
    ...w,
    tasks: ["advice"],
    taskTime: { advice: 100 },
    receives: ["finance"],
    passes: ["it"],
  };
  assert.ok(
    m
      .depthIssues(d.depth, ["advice_cases"], "work_detail")
      .includes("advice_cases_receives"),
  );
  const e = m.depthEvidence(d.depth, ["advice_cases"]).work[0];
  assert.deepEqual(e.receives, []);
  assert.deepEqual(e.passes, []);
});
test("Other work uses open narratives and exports them without requiring standard activity fields", async () => {
  const { m, d } = await fixture();
  d.depth.formRevision = m.CURRENT_DEPTH_FORM_REVISION;
  d.depth.work.other = {
    ...m.emptyWorkDetail(),
    taskNote: "Monthly community mentoring",
    handoffNote: "Requested by colleagues; shared with the community lead",
  };
  assert.deepEqual(m.depthIssues(d.depth, ["other"], "work_detail"), []);
  const w = m.depthEvidence(d.depth, ["other"]).work[0];
  assert.equal(w.taskNote, "Monthly community mentoring");
  assert.equal(w.handoffNote, d.depth.work.other.handoffNote);
  assert.equal(w.tasks[0].shareOfAreaTime, null);
  d.depth.work.other.taskNote = "";
  assert.deepEqual(m.depthIssues(d.depth, ["other"], "work_detail"), [
    "other_taskNote",
  ]);
});
test("Context review uses relevant questions for every work area and preserves legacy drafts", async () => {
  const { c, m, d } = await fixture();
  const q = await load("lib/baseline/work-area-questions.ts");
  const canonicalBefore = JSON.stringify(c.DEPTH_COLLECTION_DEFINITION);
  d.depth.formRevision = m.CURRENT_DEPTH_FORM_REVISION;
  const saved = { ...d.depth.work.lifecycle };
  for (const [area, config] of Object.entries(q.AREA_QUESTIONS)) {
    const task = (m.TASKS[area] ?? [])[0]?.[0];
    d.depth.work[area] = {
      ...m.emptyWorkDetail(),
      tasks: task ? [task] : [],
      taskTime: {},
      contributions: config.contributions
        ? ["accountable", "coordinate", "deliver"]
        : [],
      scopeNote: "Synthetic scope for " + area,
      taskNote: area === "other" ? "Other work narrative" : "",
      // Deliberately retain previously entered generic answers.
      ownership: "accountable",
      ownerTeam: "Old owner",
      local: ["onsite"],
      localNote: "Old local context",
      receives: ["employees", "finance"],
      passes: ["employees", "finance", "it"],
      handoffNote: "Synthetic collaboration",
      volume: config.volume ? 5 : 100,
      volumeUnit: "joiners",
      volumePeriod: "month",
      volumeBasis: "unknown",
      handlingBasis: "records",
      handlingMinutes: 123,
      reworkBasis: "estimate",
      reworkPercent: 75,
      transferable: "yes",
      transferPercent: 50,
      transferNote: "Old transfer note",
    };
    assert.deepEqual(m.depthIssues(d.depth, [area], "work_detail"), [], area);
    const parsed = m.parseDepth(d.depth, Object.keys(q.AREA_QUESTIONS));
    const w = m.depthEvidence(parsed, [area]).work[0];
    assert.equal(w.ownerTeam, "", area);
    assert.equal(w.ownership, "", area);
    assert.equal(w.handlingMinutes, null, area);
    assert.equal(w.transferPercent, null, area);
    assert.ok(
      w.tasks.every((t) => t.shareOfAreaTime === null),
      area,
    );
    if (!config.volume) assert.equal(w.volume, null, area);
    if (!q.asksRework(area, parsed.work[area].tasks))
      assert.equal(w.reworkPercent, null, area);
    if (!config.local) assert.equal(w.localNote, "", area);
    if (!config.nextStep) assert.deepEqual(w.passes, [], area);
    assert.deepEqual(w.receives, [], area);
    assert.equal(
      parsed.work[area].ownerTeam,
      "Old owner",
      "Raw answers stay saved",
    );
  }
  assert.ok(!q.AREA_QUESTIONS.experience.nextStep);
  assert.ok(!q.AREA_QUESTIONS.systems_data.local);
  assert.ok(!q.AREA_QUESTIONS.systems_data.contributions);
  assert.match(
    q.AREA_QUESTIONS.planning_development.scope[1],
    /performance|talent|learning/i,
  );
  assert.doesNotMatch(
    q.AREA_QUESTIONS.planning_development.scope[1],
    /joiners|leavers|contracts|payroll/i,
  );
  assert.equal(JSON.stringify(c.DEPTH_COLLECTION_DEFINITION), canonicalBefore);
  assert.equal(q.asksRework("lifecycle", ["documents"]), true);
  assert.equal(q.asksRework("experience", ["events"]), false);
  d.depth.work.lifecycle = saved;
});
test("Context review removes HRIS hours, all basis requirements, service metrics and provider costs", async () => {
  const { c, m, d } = await fixture();
  d.depth.formRevision = m.CURRENT_DEPTH_FORM_REVISION;
  d.depth.hoursBasis = d.depth.availableBasis = d.depth.peakBasis = "";
  d.depth.weeklyHours = 1; // Hidden historic value must not limit an estimate.
  d.depth.availableHours = 5;
  d.depth.decisionExample = d.depth.escalation = "";
  d.depth.serviceMetrics = d.depth.costKnowledge = "";
  d.depth.peakMonths = [];
  assert.deepEqual(
    m.depthIssues(d.depth, d.broad.selected, "role_capacity"),
    [],
  );
  const e = m.depthEvidence(d.depth, d.broad.selected);
  assert.equal(e.capacity.weeklyHours, null);
  assert.equal(e.capacity.hoursBasis, "");
  assert.equal(e.capacity.availableHours, 5);
  assert.equal(e.capacity.availableBasis, "estimate");
  assert.equal(e.capacity.fixedOnsiteHours, null);
  assert.equal(e.peaks.extraWeeklyHours, 10);
  assert.equal(e.peaks.basis, "estimate");
  assert.equal(e.metrics.actual, "");
  assert.equal(e.costs.amount, null);
  d.depth.availableHours = 169;
  assert.ok(
    m
      .depthIssues(d.depth, d.broad.selected, "role_capacity")
      .includes("availableHours"),
  );
  d.depth.availableHours = null;
  assert.deepEqual(
    m.depthIssues(d.depth, d.broad.selected, "role_capacity"),
    [],
  );
  d.rich.scope = "";
  assert.ok(
    !c.collectionIssues(d, { isPeopleManager: false }).includes("scope"),
  );
});
test("Context contributions and scope survive parsing and appear in analysis without implying sole ownership", async () => {
  const { c, m, d } = await fixture();
  d.depth.formRevision = m.CURRENT_DEPTH_FORM_REVISION;
  d.depth.work.lifecycle.contributions = ["accountable", "coordinate"];
  d.depth.work.lifecycle.scopeNote = "Preserved older narrative";
  const parsed = c.parseCollection(d, { isPeopleManager: false });
  const e = c.collectionEvidence(parsed, { isPeopleManager: false });
  assert.deepEqual(e.depth.work[0].contributions, [
    "accountable",
    "coordinate",
  ]);
  assert.equal(e.depth.work[0].scopeNote, ""); // No unasked field in current evidence.
  assert.equal(
    parsed.depth.work.lifecycle.scopeNote,
    "Preserved older narrative",
  );
  assert.throws(() =>
    m.parseDepth(
      {
        ...d.depth,
        work: {
          lifecycle: { ...d.depth.work.lifecycle, contributions: ["injected"] },
        },
      },
      ["lifecycle"],
    ),
  );
  assert.throws(() =>
    m.parseDepth(
      {
        ...d.depth,
        work: { lifecycle: { ...d.depth.work.lifecycle, scopeNote: 123 } },
      },
      ["lifecycle"],
    ),
  );
  const a = await load("lib/baseline/analysis-export.ts");
  const tables = a.analysisTables({ respondents: [
    {
      participant_id: "synthetic",
      status: "completed",
      questionnaire_version: d.version,
      ...e,
    },
  ] });
  const table = tables.find((t) => t.name === "Delivery evidence");
  assert.ok(table);
  const value = table.rows[0][table.columns.indexOf("Personal involvement")];
  assert.match(value, /Lead the lifecycle service/);
  assert.match(value, /Coordinate work/);
  assert.equal(table.rows[0][table.columns.indexOf("Whole process owner")], "");
});
test("v5 requires depth while historic collection versions preserve their definitions and steps", async () => {
  const { c, m, d } = await fixture();
  assert.equal(c.CURRENT_COLLECTION_VERSION, c.DEPTH_COLLECTION_VERSION);
  assert.ok(
    c.collectionSteps(d, { isPeopleManager: false }).includes("coverage"),
  );
  for (const v of [c.COLLECTION_VERSION, c.FROZEN_COLLECTION_VERSION]) {
    const old = c.initialCollection(v);
    assert.equal(old.depth, undefined);
    assert.ok(
      !c.collectionSteps(old, { isPeopleManager: false }).includes("coverage"),
    );
    assert.throws(
      () =>
        c.parseCollection(
          { ...old, depth: d.depth },
          { isPeopleManager: false },
        ),
      /different questionnaire/,
    );
  }
  for (const step of ["coverage", "work_detail", "role_capacity"])
    assert.deepEqual(m.depthIssues(d.depth, d.broad.selected, step), []);
  const empty = m.emptyDepth();
  for (const step of ["coverage", "work_detail", "role_capacity"])
    assert.ok(m.depthIssues(empty, ["lifecycle"], step).length > 0);
});
test("country register preserves project regions, unresolved Austria, Other and separate stable custom-country shares", async () => {
  const { m, d } = await fixture();
  assert.equal(m.PROJECT_COUNTRIES.length, 21);
  assert.equal(
    m.PROJECT_COUNTRIES.find((c) => c[0] === "TR")[2],
    "Central and Eastern Europe",
  );
  assert.equal(
    m.PROJECT_COUNTRIES.find((c) => c[0] === "AT")[2],
    "Allocation to confirm",
  );
  const t = d.depth;
  assert.equal(
    m.coverageCountries(t).find((c) => c.code === "custom:norway").label,
    "Norway",
  );
  t.otherCountries += "\nCanada";
  assert.ok(
    m
      .depthIssues(t, ["lifecycle"], "coverage")
      .includes("countryTime_custom:canada"),
  );
  assert.equal(t.countryTime["custom:norway"], 10);
  t.countryTime["custom:canada"] = 0;
  assert.deepEqual(m.depthIssues(t, ["lifecycle"], "coverage"), []);
  t.countries = ["FI"];
  t.countryTime.FI = 100;
  const e = m.depthEvidence(t, ["lifecycle"]);
  assert.deepEqual(
    e.countries.map((c) => c.code),
    ["FI"],
  );
  assert.equal(e.basedOther, "");
});
test("late task selections preserve answers, validate totals, and hide deselected work and unknown numeric evidence", async () => {
  const { m, d } = await fixture(),
    t = d.depth,
    w = t.work.lifecycle;
  w.tasks.push("documents");
  assert.ok(
    m
      .depthIssues(t, ["lifecycle"], "work_detail")
      .includes("lifecycle_taskTime_documents"),
  );
  assert.equal(w.taskTime.join, 60);
  w.taskTime.documents = 0;
  assert.deepEqual(m.depthIssues(t, ["lifecycle"], "work_detail"), []);
  w.tasks = ["join"];
  w.taskTime.join = 100;
  w.volumeBasis = "unknown";
  w.handlingBasis = "unknown";
  w.reworkBasis = "na";
  w.transferable = "no";
  const e = m.depthEvidence(t, ["lifecycle"]);
  assert.deepEqual(
    e.work[0].tasks.map((t) => t.code),
    ["join"],
  );
  assert.equal(e.work[0].volume, null);
  assert.equal(e.work[0].handlingMinutes, null);
  assert.equal(e.work[0].reworkPercent, null);
  assert.equal(e.work[0].transferPercent, null);
  assert.deepEqual(m.depthEvidence(t, []).work, []);
  w.taskTimeUnknown = true;
  assert.equal(
    m.depthEvidence(t, ["lifecycle"]).work[0].tasks[0].shareOfAreaTime,
    null,
  );
});
test("partial detailed drafts reject injected fields, invalid choice codes, negative numbers, NaN and invalid percentages", async () => {
  const { c, m, d } = await fixture();
  const parsed = c.parseCollection(JSON.parse(JSON.stringify(d)), {
    isPeopleManager: false,
  });
  assert.equal(parsed.depth.work.lifecycle.taskTime.join, 60);
  assert.equal(parsed.depth.countryTime["custom:norway"], 10);
  for (const mutate of [
    (t) => (t.foreignField = true),
    (t) => (t.countries = ["XX_INJECTED"]),
    (t) => (t.work.lifecycle.local = ["bad"]),
    (t) => (t.work.lifecycle.taskTime.join = 101),
    (t) => (t.weeklyHours = -1),
    (t) => (t.work.lifecycle.volume = NaN),
  ]) {
    const x = structuredClone(d.depth);
    mutate(x);
    assert.throws(() => m.parseDepth(x, ["lifecycle"]));
  }
  d.depth.availableHours = 35;
  assert.ok(
    m
      .depthIssues(d.depth, ["lifecycle"], "role_capacity")
      .includes("availableHours"),
  );
  d.depth.costCurrency = "pounds";
  assert.ok(
    m
      .depthIssues(d.depth, ["lifecycle"], "role_capacity")
      .includes("costCurrency"),
  );
});
test("v5 exports separate evidence tables, correct denominators, zero vs unknown and capacity vs transfer estimates", async () => {
  const { c, d } = await fixture(),
    { analysisTables } = await load("lib/baseline/analysis-export.ts");
  const evidence = c.collectionEvidence(d, { isPeopleManager: false });
  const tables = analysisTables({
    respondents: [
      {
        participant_id: "synthetic",
        status: "completed",
        contracted_hours: 40,
        working_fraction: 1,
        ...evidence,
      },
    ],
  });
  assert.equal(tables.length, 22);
  for (const t of tables)
    for (const row of t.rows)
      assert.equal(row.length, t.columns.length, t.name);
  const get = (name, column, row = 0) => {
    const t = tables.find((t) => t.name === name);
    return t.rows[row][t.columns.indexOf(column)];
  };
  assert.equal(get("Detailed activities", "Share of area time"), 0.6);
  assert.equal(get("Detailed activities", "Hours per week"), 24);
  assert.equal(get("Country coverage", "Hours per week"), 24);
  assert.equal(
    get("Role and capacity", "Reported uncommitted hours per week"),
    1,
  );
  assert.equal(get("Delivery evidence", "Potential hours per week"), 16);
  assert.equal(get("Delivery evidence", "Share of items needing rework"), 0.05);
  assert.equal(get("Workload peaks", "Additional hours per peak week"), 10);
  assert.equal(
    get("Service and provider evidence", "Provider cost amount"),
    800,
  );
  assert.ok(
    !tables.find((t) => t.name === "Respondents").columns.includes("depth"),
  );
});

test("known per-item time retains a required unit even when volumes are unknown", async () => {
  const { m, d } = await fixture();
  const w = d.depth.work.lifecycle;
  w.volumeBasis = "unknown";
  w.volumeUnit = "";
  assert.ok(
    m
      .depthIssues(d.depth, ["lifecycle"], "work_detail")
      .includes("lifecycle_volumeUnit"),
  );
  w.volumeUnit = "Employee requests";
  assert.deepEqual(m.depthIssues(d.depth, ["lifecycle"], "work_detail"), []);
  const evidence = m.depthEvidence(d.depth, ["lifecycle"]);
  assert.equal(evidence.work[0].volume, null);
  assert.equal(evidence.work[0].volumeUnit, "Employee requests");
  assert.equal(evidence.work[0].handlingMinutes, 15);
});

test("changing contractual hours to unknown does not constrain availability using a hidden old value", async () => {
  const { m, d } = await fixture();
  d.depth.weeklyHours = 10;
  d.depth.hoursBasis = "unknown";
  d.depth.availableHours = 20;
  d.depth.fixedOnsiteHours = 0;
  assert.deepEqual(m.depthIssues(d.depth, ["lifecycle"], "role_capacity"), []);
  assert.equal(
    m.depthEvidence(d.depth, ["lifecycle"]).capacity.weeklyHours,
    null,
  );
});

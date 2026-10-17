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

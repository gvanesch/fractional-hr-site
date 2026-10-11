const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const mod = { exports: {} };
new Function(
  "module",
  "exports",
  ts.transpileModule(
    fs.readFileSync(
      path.resolve(__dirname, "../../lib/baseline/prototype-enrichment.ts"),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
)(mod, mod.exports);
const m = mod.exports;
test("Focused final questions require scope and local needs without contribution matrices", () => {
  const d = m.emptyRichDraft();
  assert.deepEqual(m.richIssues(d, "context", ["office", "lifecycle"]), [
    "scope",
    "localNeeds",
    "systems",
  ]);
  d.scope = "one";
  d.systems = ["excel"];
  d.localNeeds = ["none"];
  assert.deepEqual(m.richIssues(d, "context", ["office", "lifecycle"]), []);
  d.localNeeds = ["none", "language"];
  assert.deepEqual(m.richIssues(d, "context"), ["localNeeds"]);
  d.localNeeds = ["unknown"];
  assert.deepEqual(m.richIssues(d, "context"), []);
  assert.equal(d.strengths, "");
  assert.ok(!("contributions" in m.richEvidence(d, [], false)));
});
test("Contact is unconditional, validates request shares and preserves tracking explanation", () => {
  const d = m.emptyRichDraft();
  assert.ok(m.richIssues(d, "contact").includes("routes"));
  Object.assign(d, {
    routes: ["work_email", "ticket"],
    routeTime: { work_email: 60, ticket: 40 },
    recording: "some",
    recordingNote: "Shared spreadsheet; next-day response target",
    duplicates: "often",
    sameRoutes: "different",
  });
  assert.deepEqual(m.richIssues(d, "contact"), [
    "employeeRoutes",
    "managerRoutes",
  ]);
  d.employeeRoutes = ["ticket"];
  d.managerRoutes = ["work_email"];
  assert.deepEqual(m.richIssues(d, "contact"), []);
  d.routeTime.ticket = 20;
  assert.ok(m.richIssues(d, "contact").includes("route_work_email"));
  d.routeTime.ticket = NaN;
  assert.ok(m.richIssues(d, "contact").includes("route_ticket"));
  assert.equal(m.toggleOption(["a", "b", "c", "d", "e"], "f", 5).length, 5);
  d.routeTime.ticket = 40;
  const e = m.richEvidence(d, ["lifecycle"], false);
  assert.equal(e.contact.routes[0].shareOfRequests, 60);
  assert.equal(e.contact.recordingNote, d.recordingNote);
  assert.equal(e.payroll, null);
  assert.ok(!("receives" in e.contact));
});
test("Simpler payroll asks who handles work when uninvolved and does not force guessed actors", () => {
  const d = m.emptyRichDraft();
  Object.assign(d, {
    payroll: "yes",
    cycle: "monthly",
    daysUnknown: true,
    days: 4,
  });
  assert.equal(m.PAYROLL_STAGES.length, 4);
  assert.ok(
    !m.PAYROLL_STAGES.some(([c]) =>
      ["pay", "reconcile", "calculate", "approve"].includes(c),
    ),
  );
  for (const [code] of m.PAYROLL_STAGES)
    d.payrollStages[code] = { mine: "do", others: [] };
  assert.deepEqual(m.richIssues(d, "payroll"), []);
  d.payrollStages.prepare = { mine: "none", others: [] };
  assert.deepEqual(m.richIssues(d, "payroll"), ["payroll_prepare"]);
  d.payrollStages.prepare.others = ["partner", "finance"];
  assert.deepEqual(m.richIssues(d, "payroll"), []);
  d.payrollStages.check = { mine: "unknown", others: ["finance"] };
  const e = m.richEvidence(d, ["pay_benefits"], true);
  assert.deepEqual(e.payroll.stages.find((s) => s.code === "check").others, []);
  assert.equal(e.payroll.estimatedPersonalDays, null);
  d.payrollStages.prepare.others = ["none"];
  assert.ok(m.richIssues(d, "payroll").includes("payroll_prepare"));
  d.payrollStages.prepare.others = ["unknown"];
  assert.deepEqual(m.richIssues(d, "payroll"), []);
  assert.ok(!m.richError("payroll", ["payroll_prepare"]).includes("100%"));
  assert.ok(!m.richError("context", ["scope"]).includes("100%"));
  assert.ok(m.richError("contact", ["route_ticket"]).includes("100%"));
});
test("Only mixed broad areas get a work-nature question; hidden detail is excluded", () => {
  const d = m.emptyRichDraft();
  assert.deepEqual(m.richIssues(d, "time_nature", ["office", "lifecycle"]), []);
  assert.deepEqual(m.richIssues(d, "time_nature", ["advice_cases"]), [
    "nature_advice_cases",
  ]);
  d.workNature = {
    advice_cases: "mixed",
    planning_development: "routine",
    office: "advisory",
  };
  assert.deepEqual(m.richIssues(d, "time_nature", ["advice_cases"]), []);
  d.payroll = "no";
  d.payrollStages.collect = { mine: "do", others: ["finance"] };
  d.sameRoutes = "same";
  d.employeeRoutes = ["work_email"];
  const e = m.richEvidence(d, ["advice_cases"], true);
  assert.deepEqual(e.workNature, { advice_cases: "mixed" });
  assert.ok(!("stages" in e.payroll));
  assert.ok(!("employeeRoutes" in e.contact));
  assert.deepEqual(
    m.toggleOption(["finance"], "unknown", Infinity, ["unknown", "none"]),
    ["unknown"],
  );
});

test("Tracking explanation is required only for recorded requests; systems require a valid answer", () => {
  const d = m.emptyRichDraft();
  for (const recording of ["all", "most", "some"]) {
    d.recording = recording;
    d.recordingNote = "   ";
    assert.ok(m.richIssues(d, "contact").includes("recordingNote"));
    d.recordingNote =
      "Shared mailbox. We assign each request. Replies within two days.";
    assert.ok(!m.richIssues(d, "contact").includes("recordingNote"));
  }
  for (const recording of ["none", "unknown"]) {
    d.recording = recording;
    d.recordingNote = "";
    assert.ok(!m.richIssues(d, "contact").includes("recordingNote"));
  }
  for (const systems of [["none"], ["unknown"], ["excel"]]) {
    d.systems = systems;
    assert.ok(!m.richIssues(d, "context").includes("systems"));
  }
  d.systems = ["other"];
  assert.ok(m.richIssues(d, "context").includes("otherSystems"));
  d.otherSystems = "Local payroll tool";
  assert.ok(!m.richIssues(d, "context").includes("otherSystems"));
});

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
test("Contact percentages describe requests, cap routes and require differing employee/manager routes", () => {
  const d = m.emptyRichDraft();
  Object.assign(d, {
    receives: "yes",
    routes: ["personal_email", "ticket"],
    routeTime: { personal_email: 60, ticket: 40 },
    recording: "some",
    duplicates: "often",
    sameRoutes: "different",
  });
  assert.deepEqual(m.richIssues(d, "contact"), [
    "employeeRoutes",
    "managerRoutes",
  ]);
  d.employeeRoutes = ["ticket"];
  d.managerRoutes = ["personal_email"];
  assert.deepEqual(m.richIssues(d, "contact"), []);
  d.routeTime.ticket = 20;
  assert.ok(m.richIssues(d, "contact").includes("route_personal_email"));
  d.routeTime.ticket = NaN;
  assert.ok(m.richIssues(d, "contact").includes("route_ticket"));
  assert.equal(m.toggleOption(["a", "b", "c", "d", "e"], "f", 5).length, 5);
  d.routeTime.ticket = 40;
  const e = m.richEvidence(d, ["lifecycle"], false);
  assert.equal(e.contact.routes[0].shareOfRequests, 60);
  assert.equal(e.payroll, null);
});
test("Conditional payroll preserves uncertain knowledge and captures partner and Finance separately", () => {
  const d = m.emptyRichDraft();
  d.payroll = "yes";
  d.cycle = "monthly";
  d.daysUnknown = true;
  d.days = 4;
  for (const [code] of m.PAYROLL_STAGES)
    d.payrollStages[code] = {
      mine: "coordinate",
      others: ["partner", "finance"],
    };
  assert.deepEqual(m.richIssues(d, "payroll"), []);
  d.payrollStages.calculate = { mine: "none", others: ["partner"] };
  const e = m.richEvidence(d, ["pay_benefits"], true);
  assert.equal(e.payroll.estimatedPersonalDays, null);
  assert.deepEqual(
    e.payroll.stages.find((s) => s.code === "calculate").others,
    ["partner"],
  );
  d.payrollStages.check.others = ["unknown", "finance"];
  assert.ok(m.richIssues(d, "payroll").includes("payroll_check"));
  d.daysUnknown = false;
  d.days = -1;
  assert.ok(m.richIssues(d, "payroll").includes("days"));
});
test("Hidden branches never leak stale detail into evidence", () => {
  const d = m.emptyRichDraft();
  d.receives = "no";
  d.routes = ["ticket"];
  d.routeTime.ticket = 100;
  d.sameRoutes = "same";
  d.employeeRoutes = ["personal_email"];
  d.payroll = "no";
  d.payrollStages.collect = { mine: "do", others: ["finance"] };
  d.contributions = { lifecycle: ["admin"], office: ["coordination"] };
  assert.deepEqual(m.richIssues(d, "contact"), []);
  assert.deepEqual(m.richIssues(d, "payroll"), []);
  const e = m.richEvidence(d, ["lifecycle"], true);
  assert.ok(!("routes" in e.contact));
  assert.ok(!("stages" in e.payroll));
  assert.deepEqual(e.contributions, { lifecycle: ["admin"] });
  d.receives = "yes";
  d.recording = "all";
  d.duplicates = "rarely";
  assert.ok(!("employeeRoutes" in m.richEvidence(d, [], false).contact));
  assert.deepEqual(
    m.toggleOption(["finance"], "unknown", Infinity, ["unknown", "none"]),
    ["unknown"],
  );
  assert.deepEqual(
    m.toggleOption(["unknown"], "finance", Infinity, ["unknown", "none"]),
    ["finance"],
  );
});

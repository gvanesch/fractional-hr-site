const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
const moduleValue = { exports: {} };
new Function(
  "module",
  "exports",
  ts.transpileModule(
    fs.readFileSync("lib/baseline/dashboard-view.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
)(moduleValue, moduleValue.exports);
const m = moduleValue.exports;
test("Dashboard filters stay inside the supplied permitted roster and metrics exclude withdrawn records", () => {
  const rows = [
    {
      name: "A",
      active: true,
      invited: true,
      status: "completed",
      region: "North",
      country: "GB",
      entity: "One",
      team: "Ops",
      regionalLeaderEmail: "north@example.invalid",
    },
    {
      name: "B",
      active: true,
      invited: true,
      status: "in_progress",
      region: "North",
      country: "GB",
      entity: "Two",
      team: "Tech",
      regionalLeaderEmail: "north@example.invalid",
    },
    {
      name: "C",
      active: false,
      invited: true,
      status: "completed",
      region: "North",
      country: "GB",
      entity: "One",
      team: "Ops",
      regionalLeaderEmail: "north@example.invalid",
    },
  ];
  assert.equal(
    m.filterDashboard(rows, {
      ...m.emptyDashboardFilters(),
      status: "completed",
    }).length,
    1,
  );
  assert.equal(
    m.filterDashboard(rows, {
      ...m.emptyDashboardFilters(),
      status: "withdrawn",
    }).length,
    1,
  );
  assert.equal(
    m.filterDashboard(rows, {
      ...m.emptyDashboardFilters(),
      leader: "outside@example.invalid",
    }).length,
    0,
  );
  assert.equal(m.dashboardCounts(rows).percent, 50);
  assert.equal(
    m.dashboardCounts(
      m.filterDashboard(rows, { ...m.emptyDashboardFilters(), team: "Tech" }),
    ).inProgress,
    1,
  );
});

const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
function load(file) {
  const m = { exports: {} };
  new Function(
    "module",
    "exports",
    ts.transpileModule(
      fs.readFileSync(
        path.resolve(__dirname, "../../lib/baseline/" + file + ".ts"),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
  )(m, m.exports);
  return m.exports;
}
const m = load("management-prototype"),
  b = load("broad-prototype");
test("Management is gated by confirmed roster status and selected workload, not informal oversight", () => {
  assert.equal(m.managementVisible(undefined, ["people_management"]), false);
  assert.equal(
    m.managementVisible({ isPeopleManager: false }, ["people_management"]),
    false,
  );
  assert.equal(
    m.managementVisible({ isPeopleManager: true }, ["lifecycle"]),
    false,
  );
  assert.equal(
    m.managementVisible({ isPeopleManager: true }, ["people_management"]),
    true,
  );
  assert.ok(!b.BROAD_AREAS.some((a) => a.code === "people_management"));
  assert.ok(
    fs
      .readFileSync(
        path.resolve(__dirname, "../../app/baseline/test/test-access.tsx"),
        "utf8",
      )
      .includes("managerRecord"),
  );
});
test("Management counts once within broad time and stays absent from the existing tester catalog", () => {
  const areas = [...b.BROAD_AREAS, m.MANAGEMENT_AREA];
  let d = b.emptyBroadDraft();
  d = b.toggleBroad(d, "lifecycle", areas);
  d = b.toggleBroad(d, "people_management", areas);
  d.time = { lifecycle: 70, people_management: 30 };
  assert.equal(b.broadTotal(d, areas), 100);
  assert.deepEqual(b.broadIssues(d, 1, areas), []);
  assert.equal(b.broadEvidence(d, areas).workAreas[1].percentage, 30);
  assert.equal(b.broadEvidence(d).workAreas.length, 1);
  d = b.toggleBroad(d, "people_management", areas);
  assert.equal(b.broadTotal(d, areas), 70);
  assert.equal(b.broadEvidence(d, areas).workAreas.length, 1);
  assert.ok(m.MANAGEMENT_AREA.examples.includes("own team"));
});
test("Management captures three main activities, supports uncertainty, and omits hidden details", () => {
  const d = m.emptyManagement();
  assert.deepEqual(m.managementIssues(d), ["activities", "sharedReporting"]);
  d.activities = ["one_to_ones", "coordination", "development"];
  d.sharedReporting = "yes";
  assert.deepEqual(m.managementIssues(d), []);
  d.activities.push("performance");
  assert.ok(m.managementIssues(d).includes("activities"));
  d.activities = ["unknown"];
  d.sharedReporting = "unknown";
  assert.deepEqual(m.managementIssues(d), []);
  d.activities = ["other"];
  assert.ok(m.managementIssues(d).includes("other"));
  d.other = "Cover team absences";
  assert.deepEqual(m.managementIssues(d), []);
  d.activities = ["team_meetings"];
  assert.ok(!("other" in m.managementEvidence(d, true)));
  assert.equal(m.managementEvidence(d, false), null);
  assert.ok(!("time" in m.managementEvidence(d, true)));
});

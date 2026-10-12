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
    "require",
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
  )(m, m.exports, (name) =>
    name === "./prototype-enrichment"
      ? load("prototype-enrichment")
      : require(name),
  );
  return m.exports;
}
const m = load("technology-prototype");
test("Technology detail is opt-in for advisor preview; ordinary tool use skips it", () => {
  assert.equal(m.technologyVisible(false, ["systems_data"]), false);
  assert.equal(m.technologyVisible(true, ["lifecycle"]), false);
  assert.equal(m.technologyVisible(true, ["systems_data"]), true);
  const d = m.emptyTechnology();
  assert.deepEqual(m.technologyIssues(d), ["involvement"]);
  for (const involvement of ["no", "unknown"]) {
    d.involvement = involvement;
    assert.deepEqual(m.technologyIssues(d), []);
    assert.ok(!("platforms" in m.technologyEvidence(d, true)));
  }
  assert.equal(m.technologyEvidence(d, false), null);
  const entry = fs.readFileSync(
    path.resolve(__dirname, "../../app/baseline/test/test-access.tsx"),
    "utf8",
  );
  assert.ok(!entry.includes("technologyPreview"));
});
test("Technology time uses only three groups; missing percentages and platform roles are highlighted", () => {
  const d = m.emptyTechnology();
  d.involvement = "yes";
  assert.ok(m.technologyIssues(d).includes("time_run"));
  Object.assign(d, {
    activities: ["integrations", "automation"],
    time: { run: 30, improve: 30, deliver: 40 },
    platforms: ["hibob"],
    roles: { hibob: ["technical", "responsible"] },
    partners: ["it"],
  });
  assert.deepEqual(m.technologyIssues(d), []);
  assert.equal(m.technologyTotal(d), 100);
  for (const value of [NaN, Infinity, -1, 101]) {
    d.time.run = value;
    assert.ok(m.technologyIssues(d).includes("time_run"));
  }
  d.time.run = 10;
  assert.equal(
    m.technologyIssues(d).filter((k) => k.startsWith("time_")).length,
    3,
  );
  d.time.run = 30;
  d.roles.hibob = [];
  assert.ok(m.technologyIssues(d).includes("roles_hibob"));
  d.roles.hibob = ["unknown"];
  assert.deepEqual(m.technologyIssues(d), []);
  d.roles.hibob = ["technical", "unknown"];
  assert.ok(m.technologyIssues(d).includes("roles_hibob"));
});
test("Technology selections preserve uncertainty and omit hidden platform answers", () => {
  const d = m.emptyTechnology();
  Object.assign(d, {
    involvement: "yes",
    activities: ["other"],
    time: { run: 100, improve: 0, deliver: 0 },
    platforms: ["unknown"],
    roles: { hibob: ["responsible"] },
    partners: ["other"],
  });
  assert.ok(m.technologyIssues(d).includes("otherActivity"));
  assert.ok(m.technologyIssues(d).includes("otherPartner"));
  d.otherActivity = "Maintain custom scripts";
  d.otherPartner = "Security";
  assert.deepEqual(m.technologyIssues(d), []);
  const e = m.technologyEvidence(d, true);
  assert.deepEqual(e.platforms, [{ code: "unknown", roles: [] }]);
  assert.equal(e.time[0].shareOfTechnologyTime, 100);
  assert.ok(!("pillar" in e));
  d.platforms = ["other"];
  assert.ok(m.technologyIssues(d).includes("otherPlatform"));
  d.otherPlatform = "Custom application";
  d.roles.other = ["technical"];
  assert.deepEqual(m.technologyIssues(d), []);
});

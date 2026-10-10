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
      path.resolve(__dirname, "../../lib/baseline/broad-prototype.ts"),
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
test("Broad lifecycle selection does not assert its example tasks or a future pillar", () => {
  let d = m.toggleBroad(m.emptyBroadDraft(), "lifecycle");
  d.time.lifecycle = 100;
  assert.deepEqual(m.broadIssues(d, 1), []);
  const evidence = m.broadEvidence(d);
  assert.equal(evidence.workAreas.length, 1);
  assert.equal(evidence.workAreas[0].code, "lifecycle");
  assert.ok(!("activities" in evidence));
  assert.ok(!("pillar" in evidence.workAreas[0]));
});
test("Broad hybrid edits preserve answers but omit deselected work from totals and evidence", () => {
  let d = m.emptyBroadDraft();
  for (const code of ["lifecycle", "advice_cases", "office"])
    d = m.toggleBroad(d, code);
  d.time = { lifecycle: 50, advice_cases: 30, office: 20 };
  d.notes.office = "Local workplace suppliers";
  assert.equal(m.broadTotal(d), 100);
  d = m.toggleBroad(d, "office");
  assert.equal(m.broadTotal(d), 80);
  assert.equal(m.broadEvidence(d).workAreas.length, 2);
  assert.equal(m.broadIssues(d, 1).length, 2);
  d = m.toggleBroad(d, "office");
  assert.equal(m.broadTotal(d), 100);
  assert.equal(
    m.broadEvidence(d).workAreas[2].respondentNote,
    "Local workplace suppliers",
  );
  assert.deepEqual(m.toggleBroad(d, "guessed-category"), d);
});
test("Broad percentages reject missing, non-finite, out-of-range and excessive totals", () => {
  let d = m.toggleBroad(m.emptyBroadDraft(), "other");
  for (const value of [undefined, NaN, Infinity, -1, 101, 50]) {
    d.time.other = value;
    assert.ok(m.broadIssues(d, 1).length);
  }
  d.time.other = 99;
  assert.deepEqual(m.broadIssues(d, 1), []);
  assert.ok(m.broadIssues(m.emptyBroadDraft(), 0).length);
});

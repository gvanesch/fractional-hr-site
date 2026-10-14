const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const m = { exports: {} };
new Function(
  "module",
  "exports",
  ts.transpileModule(
    fs.readFileSync(
      path.resolve(__dirname, "../../lib/baseline/management-time-preview.ts"),
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
const model = m.exports;
test("Management shares divide existing management time and validate a complete bounded allocation", () => {
  const d = model.emptyManagementTime();
  assert.equal(model.managementTimeIssues(d).length, 4);
  d.time = {
    coordination: 30,
    individual: 40,
    hiring: 20,
    administration: 10,
    other: 0,
  };
  assert.deepEqual(model.managementTimeIssues(d), []);
  assert.equal(model.managementTimeTotal(d), 100);
  const evidence = model.managementTimeEvidence(d, 30);
  assert.equal(evidence.groups[0].approximateShareOfWorkingTime, 9);
  assert.equal(
    evidence.groups.reduce((n, g) => n + g.approximateShareOfWorkingTime, 0),
    30,
  );
  for (const value of [NaN, Infinity, -1, 101]) {
    d.time.coordination = value;
    assert.ok(model.managementTimeIssues(d).includes("time_coordination"));
  }
  d.time.coordination = 10;
  assert.equal(model.managementTimeIssues(d).length, 5);
});
test("Other work requires an example only when it has time; uncertainty excludes retained guesses", () => {
  const d = model.emptyManagementTime();
  d.time = {
    coordination: 20,
    individual: 40,
    hiring: 20,
    administration: 10,
    other: 10,
  };
  assert.deepEqual(model.managementTimeIssues(d), ["other"]);
  d.other = "Own-team wellbeing support";
  assert.deepEqual(model.managementTimeIssues(d), []);
  assert.equal(
    model.managementTimeEvidence(d, 30).groups.at(-1).description,
    d.other,
  );
  d.uncertain = true;
  assert.deepEqual(model.managementTimeIssues(d), []);
  assert.deepEqual(model.managementTimeEvidence(d, 30), {
    uncertain: true,
    groups: [],
  });
  d.uncertain = false;
  d.time.other = 0;
  d.time.coordination = 30;
  assert.ok(
    !model.managementTimeEvidence(d, 30).groups.some((g) => g.code === "other"),
  );
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("../../scripts/baseline/answer-document-fixture.cjs");

test("login returns to advisor projects while rejecting external, script and disguised destinations", async () => {
  const { advisorReturnPath } = await load("lib/advisor-return-path.ts");
  for (const value of [
    "/advisor", "/advisor/projects?status=active", "/advisor/baseline/project/123#respondents",
  ]) assert.equal(advisorReturnPath(value), value);
  for (const value of [
    undefined, null, {}, "", "https://attacker.invalid/advisor", "//attacker.invalid/advisor",
    "javascript:alert(1)", "data:text/html,hello", "/\\attacker.invalid/advisor",
    " /advisor", "/advisor\n", "/advisor-elsewhere", "/advisor/../../contact",
    "/advisor/%2e%2e/contact", "/%2f%2fattacker.invalid", "/contact", "/advisor" + "x".repeat(2050),
  ]) assert.equal(advisorReturnPath(value), "/advisor", String(value));
});

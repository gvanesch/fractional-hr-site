import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validate } from "../../scripts/baseline/prepare-qa.mjs";
test("Baseline QA guard refuses production targets, branches, activation and real email", async () => {
  const config = JSON.parse(
    await readFile(new URL("../../wrangler.jsonc", import.meta.url), "utf8"),
  );
  assert.ok(validate(config, "refs/heads/feature/team-blue-baseline"));
  assert.throws(() => validate(config, "refs/heads/main"));
  for (const mutate of [
    (c) =>
      (c.env.qa.d1_databases[0].database_id = c.d1_databases[0].database_id),
    (c) => (c.vars.BASELINE_ENABLED = "true"),
    (c) => (c.vars.D1_CLIENT_DIAGNOSTIC_MODE = c.vars.D1_CLIENT_DIAGNOSTIC_MODE === "d1" ? "off" : "d1"),
    (c) => (c.env.qa.vars.BASELINE_MAIL_MODE = "send"),
    (c) => (c.env.qa.routes = ["vanesch.uk/*"]),
  ]) {
    const copy = structuredClone(config);
    mutate(copy);
    assert.throws(() =>
      validate(copy, "refs/heads/feature/team-blue-baseline"),
    );
  }
});

test("Baseline QA target stays isolated before and after production D1 activation", async () => {
 const config=JSON.parse(await readFile(new URL("../../wrangler.jsonc",import.meta.url),"utf8"));
 for (const mode of ["off","d1"]) {
  for (const flag of Object.keys(config.vars).filter(k=>k.startsWith("D1_")&&k.endsWith("_MODE"))) config.vars[flag]=mode;
  const qa=validate(config,"refs/heads/feature/team-blue-baseline");
  assert.equal(qa.d1_databases[0].database_id,"b25d59da-5f93-4301-9996-7be0c9708789");
  assert.equal(qa.vars.BASELINE_MAIL_MODE,"preview");
 }
});

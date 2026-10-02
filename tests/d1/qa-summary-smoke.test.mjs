import test from "node:test";
import assert from "node:assert/strict";
const script = new URL("../../scripts/d1/qa-summary-smoke.mjs", import.meta.url);
test("Hosted summary smoke refuses production and uses only QA dry runs", async () => {
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  const keys = ["GITHUB_REF", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  process.env.GITHUB_REF = "refs/heads/migration/d1";
  process.env.CLOUDFLARE_ACCOUNT_ID = "73221f18acc676e4992c89fcbf2b2a8f";
  process.env.CLOUDFLARE_API_TOKEN = "synthetic-token";
  console.log = () => {};
  const bindings = [
    { name: "DB", database_id: "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc" },
    { name: "DAILY_SUMMARY_RECIPIENT", text: "greg@vanesch.uk" },
    ...["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"]
      .map(name => ({ name: `D1_${name}_MODE`, text: "d1" })),
  ];
  try {
    let writes = 0;
    let secret;
    let hosted = 0;
    globalThis.fetch = async (url, options = {}) => {
      if (url.startsWith("https://api.cloudflare.com/")) {
        assert.ok(url.includes("/workers/scripts/fractional-hr-site-qa/"));
        if (url.endsWith("/settings")) return Response.json({ success: true, result: { bindings } });
        if (url.endsWith("/schedules")) return Response.json({ success: true, result: { schedules: [] } });
        assert.equal(url.endsWith("/secrets"), true);
        assert.equal(options.method, "PUT");
        const body = JSON.parse(options.body);
        assert.equal(body.name, "CRON_SECRET");
        assert.equal(body.type, "secret_text");
        assert.notEqual(body.text, secret);
        secret = body.text;
        writes++;
        return Response.json({ success: true, result: { name: "CRON_SECRET" } });
      }
      assert.ok(url.startsWith("https://fractional-hr-site-qa.greg-732.workers.dev/api/"));
      assert.equal(new URL(url).search, "?dryRun=true");
      assert.equal(options.redirect, "manual");
      hosted++;
      return options.headers?.Authorization === `Bearer ${secret}` && secret
        ? Response.json({ success: true, dryRun: true, emailGenerated: true })
        : new Response(null, { status: 403 });
    };
    await assert.rejects(import(`${script.href}?wrong-db`), /bindings are not isolated/);
    assert.equal(writes, 0);
    assert.equal(hosted, 0);
    bindings[0].database_id = "b25d59da-5f93-4301-9996-7be0c9708789";
    await import(`${script.href}?qa`);
    assert.equal(writes, 2);
    assert.equal(hosted, 6);
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

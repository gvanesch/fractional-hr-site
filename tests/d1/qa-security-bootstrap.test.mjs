import test from "node:test";
import assert from "node:assert/strict";

const script = new URL("../../scripts/d1/configure-qa-security.mjs", import.meta.url);
test("QA security bootstrap rejects wrong D1 and creates only missing bindings", async () => {
  const originalFetch = globalThis.fetch;
  const originalLog = console.log;
  const originalEnv = Object.fromEntries(
    ["GITHUB_REF", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"].map(
      (name) => [name, process.env[name]],
    ),
  );
  process.env.GITHUB_REF = "refs/heads/migration/d1";
  process.env.CLOUDFLARE_ACCOUNT_ID = "73221f18acc676e4992c89fcbf2b2a8f";
  process.env.CLOUDFLARE_API_TOKEN = "test-token";
  console.log = () => {};
  try {
    let writes = 0;
    globalThis.fetch = async (_url, options) => {
      if (options?.method === "PUT") {
        writes++;
        throw new Error("Unexpected mutation.");
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          result: { bindings: [{ name: "DB", database_id: "wrong-db" }] },
        }),
      };
    };
    await assert.rejects(import(`${script.href}?wrong-db`), /does not match vanesch-qa/);
    assert.equal(writes, 0);

    const created = [];
    globalThis.fetch = async (_url, options) => {
      if (options?.method === "PUT") {
        const body = JSON.parse(options.body);
        created.push(body);
        return { ok: true, json: async () => ({ success: true, result: { name: body.name } }) };
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          result: {
            bindings: [
              { name: "DB", database_id: "b25d59da-5f93-4301-9996-7be0c9708789" },
              { name: "CLIENT_DIAGNOSTIC_OTP_SECRET", type: "secret_text" },
            ],
          },
        }),
      };
    };
    await import(`${script.href}?missing-one`);
    assert.deepEqual(created.map((item) => item.name), ["INVITE_RATE_LIMIT_SALT", "ADVISOR_ALLOWED_EMAILS"]);
    assert.ok(created.every((item) => item.type === "secret_text"));
    assert.ok(created[0].text.length >= 40);
    assert.equal(created[1].text, "greg@vanesch.uk");
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog;
    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

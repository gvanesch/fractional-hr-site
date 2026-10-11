const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const crypto = require("node:crypto");
const path = require("node:path");
function compile(file, requireMock = require, replace = (s) => s) {
  const mod = { exports: {} };
  const src = replace(
    fs.readFileSync(path.resolve(__dirname, "../../" + file), "utf8"),
  );
  new Function(
    "module",
    "exports",
    "require",
    ts.transpileModule(src, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  )(mod, mod.exports, requireMock);
  return mod.exports;
}
test("Five hashed design links are QA-only, expire and never disclose raw tokens", () => {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const m = compile("lib/baseline/design-access.ts", require, (s) =>
    s.replace(/"[a-f0-9]{64}":\s*"Tester 1"/, `"${hash}": "Tester 1"`),
  );
  assert.equal(m.DESIGN_TESTER_COUNT, 5);
  const now = Date.parse("2026-10-11T13:00:00Z");
  assert.equal(m.designTester(token, "qa", now), "Tester 1");
  for (const env of ["production", "local", undefined])
    assert.equal(m.designTester(token, env, now), null);
  for (const wrong of ["", null, [], "0".repeat(64), "bad"])
    assert.equal(m.designTester(wrong, "qa", now), null);
  assert.equal(
    m.designTester(token, "qa", Date.parse(m.DESIGN_TEST_EXPIRES)),
    null,
  );
  assert.ok(
    !fs
      .readFileSync(
        path.resolve(__dirname, "../../lib/baseline/design-access.ts"),
        "utf8",
      )
      .includes(token),
  );
});
test("Design access checks QA, same origin and rate limits before returning a tester label only", async () => {
  class BaselineError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
  const calls = [];
  let env = "qa",
    originError = false,
    rateError = false;
  const service = {
    BaselineError,
    securityHeaders: { "Cache-Control": "private, no-store" },
    baselineEnv: () => ({ NEXT_PUBLIC_APP_ENV: env }),
    sameOrigin: () => {
      calls.push("origin");
      if (originError) throw new BaselineError("Forbidden", 403);
    },
    rateLimit: async (_r, context, max) => {
      calls.push("rate");
      assert.equal(context, "design-test-ip:127.0.0.1");
      assert.equal(max, 60);
      if (rateError) throw new BaselineError("Wait", 429);
    },
    readBody: async (_r, limit) => {
      calls.push("body");
      assert.equal(limit, 1024);
      return { token: "valid" };
    },
  };
  const m = compile("app/api/baseline/design-access/route.ts", (name) =>
    name === "next/server"
      ? {
          NextResponse: {
            json: (body, opts) => ({
              body,
              ...opts,
              status: opts.status ?? 200,
            }),
          },
        }
      : name.endsWith("/server")
        ? service
        : { designTester: (token) => (token === "valid" ? "Tester 1" : null) },
  );
  const request = new Request(
    "https://qa.example.invalid/api/baseline/design-access",
    { headers: { "cf-connecting-ip": "127.0.0.1" } },
  );
  const r = await m.POST(request);
  assert.deepEqual(r.body, { tester: "Tester 1" });
  assert.equal(r.status, 200);
  assert.deepEqual(calls, ["origin", "rate", "body"]);
  env = "production";
  calls.length = 0;
  assert.equal((await m.POST(request)).status, 404);
  assert.deepEqual(calls, []);
  env = "qa";
  originError = true;
  assert.equal((await m.POST(request)).status, 403);
  originError = false;
  rateError = true;
  assert.equal((await m.POST(request)).status, 429);
});

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { runCleanupMetadataPreflight, cleanupPreflightFailure } from "../../scripts/security/production-retirement-cleanup-preflight.mjs";
import { ACCOUNT } from "../../scripts/security/qa-retirement-release.mjs";

const ID = "11111111-1111-4111-8111-111111111111", OTHER = "22222222-2222-4222-8222-222222222222";
const DEPLOY = "33333333-3333-4333-8333-333333333333";
const clone = value => structuredClone(value);
function fixture() {
  const env = { GITHUB_REPOSITORY: "gvanesch/fractional-hr-site", GITHUB_REF: "refs/heads/chore/supabase-retirement-2026-11",
    CLOUDFLARE_ACCOUNT_ID: ACCOUNT, CLOUDFLARE_API_TOKEN: "private-test-token" };
  const bindings = [
    { name: "DB", type: "d1", id: "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc" },
    { name: "ADVISOR_AUTH_MODE", type: "plain_text", text: "supabase" },
    { name: "NEXT_PUBLIC_SUPABASE_URL", type: "plain_text", text: "https://private-test-instance.supabase.co" },
    { name: "PRIVATE_SECRET_NAME", type: "secret_text" },
    { name: "CONFIG", type: "json", json: { private: "private-binding-value" } },
  ];
  const runtime = { compatibility_date: "2026-03-01", compatibility_flags: ["nodejs_compat"], usage_model: "standard" };
  const legacy = { id: ID, number: 50, metadata: { created_on: "2026-11-20T12:00:00Z", author_email: "private-author@example.invalid", hasPreview: false },
    resources: { bindings, script: { etag: "private-etag", handlers: ["fetch"], named_handlers: [] }, script_runtime: clone(runtime) } };
  const betaBindings = bindings.map(item => item.type === "d1" ? { name: item.name, type: "d1", database_id: item.id } : clone(item));
  const beta = { id: ID, number: 50, created_on: "2026-11-20T12:00:00Z", urls: ["https://private-preview.example.invalid"],
    ...runtime, bindings: betaBindings, env: Object.fromEntries(betaBindings.map(({ name, ...rest }) => [name, rest])),
    assets: { jwt: "private-assets-jwt", config: { run_worker_first: true } }, main_module: "private-filename.js",
    modules: [{ name: "private-filename.js", content_type: "application/javascript+module", content_base64: Buffer.from("private-module-content").toString("base64") },
      { name: "private-filename.js.map", content_type: "application/source-map", content_base64: Buffer.from("private-source-map-content").toString("base64") }] };
  const state = { calls: [], legacy, beta, legacyReads: 0, betaReads: 0, deploymentReads: 0, versionListReads: 0,
    alter: null, fail: null, latest: ID, active: ID, percentage: 100 };
  async function fetchImpl(input, options) {
    const url = new URL(input), path = url.pathname.replace(`/client/v4/accounts/${ACCOUNT}`, "");
    assert.equal(url.origin, "https://api.cloudflare.com"); assert.equal(options.method, "GET"); assert.equal(options.body, undefined);
    assert.equal(options.redirect, "error"); assert.equal(options.cache, "no-store"); assert.equal(options.headers.Authorization, "Bearer private-test-token");
    assert.equal(options.headers["Cache-Control"], "no-cache"); assert.ok(options.signal instanceof AbortSignal);
    state.calls.push(path + url.search);
    if (state.fail) return await state.fail();
    let result, round;
    if (path.endsWith("/deployments")) { round = ++state.deploymentReads; result = { deployments: [{ id: DEPLOY, versions: [{ version_id: state.active, percentage: state.percentage }] }] }; }
    else if (path.endsWith("/versions")) { round = ++state.versionListReads; result = { items: [{ id: state.latest }] }; }
    else if (path.startsWith("/workers/scripts/fractional-hr-site/versions/")) { round = ++state.legacyReads; assert.equal(path.split("/").at(-1), ID); result = clone(legacy); }
    else if (path.startsWith("/workers/workers/fractional-hr-site/versions/")) {
      round = ++state.betaReads; assert.equal(path.split("/").at(-1), ID); assert.equal(url.search, "?include=modules,sourcemaps"); result = clone(beta);
    } else assert.fail("Unexpected endpoint");
    state.alter?.({ path, result, round });
    return Response.json({ success: true, result });
  }
  const inputs = { env, fetchImpl, now: Date.parse("2026-11-20T12:00:00Z") };
  return { env, state, inputs, run: () => runCleanupMetadataPreflight(inputs) };
}

test("read-only metadata preflight uses exactly two fresh detailed reads and does not require migrated auth", async () => {
  const f = fixture(), report = await f.run();
  assert.equal(report.metadataReady, true); assert.equal(report.acceptanceVerified, false);
  assert.equal(report.metadataReadCompleted, true); assert.equal(report.mutationAttempted, false);
  assert.equal(f.state.calls.length, 8); assert.equal(f.state.betaReads, 2); assert.equal(f.state.legacyReads, 2);
  assert.equal(report.first.modules.count, 2); assert.equal(report.stability.etagEqual, true); assert.equal(report.stability.assetsJwtEqual, true);
  assert.equal(report.first.bindings.beta.secretBindingCount, 1);
  assert.deepEqual(report.first.fieldTypes["beta.assets"].jwt, ["string"]);
  const text = JSON.stringify(report);
  for (const privateValue of ["private-test-token", "private-assets-jwt", "private-etag", "private-author", "private-preview", "private-binding-value",
    "private-filename", "private-module-content", "private-source-map-content", "private-test-instance", "PRIVATE_SECRET_NAME", Buffer.from("private-module-content").toString("base64")])
    assert.ok(!text.includes(privateValue), `Report leaked ${privateValue}`);
  assert.ok(report.first.bindings.beta.nonSecretBindings.some(item => item.name === "ADVISOR_AUTH_MODE"));
});

test("context and active/latest 100-percent guards stop without detailed version reads", async () => {
  for (const change of [f => { f.env.CLOUDFLARE_ACCOUNT_ID = "wrong"; }, f => { f.env.GITHUB_REF = "refs/heads/main"; },
    f => { f.env.CLOUDFLARE_ENV = "qa"; }, f => { f.state.latest = OTHER; }, f => { f.state.percentage = 50; }]) {
    const f = fixture(); change(f); await assert.rejects(f.run()); assert.equal(f.state.betaReads, 0); assert.equal(f.state.legacyReads, 0);
  }
});

test("unknown or missing metadata is reported without printing values or claiming readiness", async () => {
  for (const change of [
    f => { delete f.state.beta.assets.jwt; }, f => { delete f.state.beta.modules; },
    f => { delete f.state.beta.urls; }, f => { f.state.beta.created_on = "unknown"; },
    f => { delete f.state.legacy.resources.script.handlers; }, f => { f.state.beta.annotations = { example: 123 }; },
    f => { f.state.beta.provider_new_field = "private-unknown-value"; },
    f => { f.state.legacy.resources.script.provider_new_field = "private-unknown-value"; },
    f => { f.state.beta.assets["unsafe.field-name/private"] = "private-unknown-value"; },
    f => { f.state.beta.bindings.find(item => item.type === "secret_text").text = "private-unexpected-secret"; },
    f => { f.state.beta.env.DB.database_id = OTHER; },
    f => { f.state.beta.modules[0].content_base64 = "invalid?"; },
  ]) {
    const f = fixture(); change(f); const report = await f.run();
    assert.equal(report.metadataReadCompleted, true); assert.equal(report.metadataReady, false); assert.equal(f.state.calls.length, 8);
    assert.ok(!/private-unknown-value|private-unexpected-secret|unsafe\.field-name/.test(JSON.stringify(report)));
  }
});

test("two reads expose unstable asset tokens, code, etags, or metadata", async () => {
  for (const change of [
    ({ path, result }) => { if (path.includes("/workers/workers/")) result.assets.jwt = "different-private-jwt"; },
    ({ path, result }) => { if (path.includes("/workers/workers/")) result.modules[0].content_base64 = Buffer.from("different-code").toString("base64"); },
    ({ path, result }) => { if (path.includes("/workers/scripts/") && result.resources) result.resources.script.etag = "different-etag"; },
    ({ path, result }) => { if (path.includes("/workers/workers/")) result.assets.config.run_worker_first = false; },
  ]) {
    const f = fixture(); f.state.alter = event => { if (event.round === 2) change(event); };
    const report = await f.run(); assert.equal(report.metadataReady, false);
    assert.ok(Object.values(report.stability).some(value => value === false));
    assert.equal(f.state.calls.length, 8);
  }
});

test("a changed deployment or latest version during reads invalidates the lease", async () => {
  for (const resource of ["/deployments", "/versions"]) {
    const f = fixture(); f.state.alter = ({ path, result, round }) => {
      if (round === 2 && path.endsWith(resource)) {
        if (resource === "/deployments") result.deployments[0].id = OTHER;
        else result.items[0].id = OTHER;
      }
    };
    await assert.rejects(f.run(), /lease/); assert.equal(f.state.calls.length, 8);
  }
});

test("transport/provider failures are sanitized and never retried", async () => {
  for (const failure of [
    () => { throw new Error("private-test-token private-provider-url"); },
    () => new Response("private-error-body", { status: 403 }),
    () => Response.json({ success: false, errors: [{ message: "private-error-body" }] }),
    () => new Response("private-invalid-json", { status: 200 }),
  ]) {
    const f = fixture(); f.state.fail = failure;
    const error = await f.run().catch(error => error), report = cleanupPreflightFailure(error);
    assert.equal(report.metadataReadCompleted, false); assert.equal(report.metadataReady, false);
    assert.equal(f.state.calls.length, 2); assert.ok(!JSON.stringify(report).includes("private-"));
  }
});

test("CLI context failure exits with only a sanitized JSON report and no cloud credentials", () => {
  const result = spawnSync(process.execPath, ["scripts/security/production-retirement-cleanup-preflight.mjs"],
    { cwd: new URL("../../", import.meta.url), env: { PATH: process.env.PATH, CLOUDFLARE_API_TOKEN: "private-test-token" }, encoding: "utf8" });
  assert.equal(result.status, 1); assert.equal(result.stderr, "");
  const report = JSON.parse(result.stdout); assert.equal(report.failure.code, "fixed_context_unverified");
  assert.ok(!result.stdout.includes("private-test-token")); assert.equal(report.mutationAttempted, false);
});

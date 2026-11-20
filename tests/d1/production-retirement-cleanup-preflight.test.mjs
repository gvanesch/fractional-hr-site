import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { runCleanupMetadataPreflight, runProductionBindingReconciliation, cleanupPreflightFailure } from "../../scripts/security/production-retirement-cleanup-preflight.mjs";
import { ACCOUNT, fingerprint, normalizeBindings } from "../../scripts/security/qa-retirement-release.mjs";

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
    alter: null, fail: null, latest: ID, active: ID, percentage: 100,
    settings: { bindings: clone(bindings), observability: { logs: { enabled: true } } },
    secrets: bindings.filter(item => item.type === "secret_text").map(({ name, type }) => ({ name, type })),
    candidate: { ...clone(legacy), id: OTHER, number: 51 } };
  async function fetchImpl(input, options) {
    const url = new URL(input), path = url.pathname.replace(`/client/v4/accounts/${ACCOUNT}`, "");
    assert.equal(url.origin, "https://api.cloudflare.com"); assert.equal(options.method, "GET"); assert.equal(options.body, undefined);
    assert.equal(options.redirect, "error"); assert.equal(options.cache, "no-store"); assert.equal(options.headers.Authorization, "Bearer private-test-token");
    assert.equal(options.headers["Cache-Control"], "no-cache"); assert.ok(options.signal instanceof AbortSignal);
    state.calls.push(path + url.search);
    if (state.fail) return await state.fail();
    let result, round;
    if (path.endsWith("/settings")) result = clone(state.settings);
    else if (path.endsWith("/secrets")) result = clone(state.secrets);
    else if (path.endsWith("/deployments")) { round = ++state.deploymentReads; result = { deployments: [{ id: DEPLOY, versions: [{ version_id: state.active, percentage: state.percentage }] }] }; }
    else if (path.endsWith("/versions")) { round = ++state.versionListReads; result = { items: [{ id: state.latest }] }; }
    else if (path.startsWith("/workers/scripts/fractional-hr-site/versions/")) {
      round = ++state.legacyReads; const id = path.split("/").at(-1); assert.ok([ID, OTHER].includes(id)); result = clone(id === ID ? legacy : state.candidate);
    }
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

test("multi-megabyte valid modules are fingerprinted without regexp stack exhaustion", async () => {
  const f = fixture();
  f.state.beta.modules[0].content_base64 = Buffer.alloc(5_000_000, 97).toString("base64");
  const report = await f.run();
  assert.equal(report.metadataReady, true); assert.equal(report.stability.modulesEqual, true);
  assert.match(report.first.modules.inventoryFingerprint, /^[a-f0-9]{64}$/);
  assert.ok(JSON.stringify(report).length < 20000, "Large module content must never expand the diagnostic report");
  assert.equal(f.state.calls.length, 8);
});

test("context and active/latest 100-percent guards stop without detailed version reads", async () => {
  for (const change of [f => { f.env.CLOUDFLARE_ACCOUNT_ID = "wrong"; }, f => { f.env.GITHUB_REF = "refs/heads/main"; },
    f => { f.env.CLOUDFLARE_ENV = "qa"; }, f => { f.state.latest = "invalid"; }, f => { f.state.percentage = 50; }]) {
    const f = fixture(); change(f); await assert.rejects(f.run()); assert.equal(f.state.betaReads, 0); assert.equal(f.state.legacyReads, 0);
  }
});

test("inactive uploads trigger read-only settings/active/latest reconciliation with exact changed names", async () => {
  const f = fixture(); f.state.latest = OTHER;
  f.state.candidate.resources.bindings = f.state.candidate.resources.bindings.map(item => item.name === "ADVISOR_AUTH_MODE" ?
    { ...item, text: "cloudflare_access" } : item);
  f.state.candidate.resources.bindings.push(
    { name: "CLOUDFLARE_ACCESS_AUD", type: "plain_text", text: "private-new-audience" },
    { name: "CLOUDFLARE_ACCESS_TEAM_DOMAIN", type: "plain_text", text: "private-new-team" });
  const expectedAnnotations = { tag: `retirement-${"a".repeat(24)}`, message: `production-retirement-${"b".repeat(40)}` };
  f.state.candidate.annotations = { "workers/tag": expectedAnnotations.tag, "workers/message": expectedAnnotations.message };
  f.state.settings.bindings = clone(f.state.candidate.resources.bindings);
  f.state.settings.annotations = clone(f.state.candidate.annotations);
  const report = await runCleanupMetadataPreflight({ ...f.inputs, expectedAnnotations });
  assert.equal(report.kind, "production-worker-binding-reconciliation"); assert.equal(report.metadataReady, false);
  assert.equal(report.activeVersionId, ID); assert.equal(report.latestVersionId, OTHER); assert.equal(report.activeEqualsLatest, false);
  assert.equal(report.equalities.settingsMatchesActive, false); assert.equal(report.equalities.settingsMatchesLatest, true);
  assert.deepEqual(report.changedBindingNames.settingsVsActive, ["ADVISOR_AUTH_MODE", "CLOUDFLARE_ACCESS_AUD", "CLOUDFLARE_ACCESS_TEAM_DOMAIN"]);
  assert.deepEqual(report.changedBindingNames.settingsVsLatest, []); assert.equal(report.runtimesEqual, true);
  assert.equal(report.bindingFingerprints.settings, fingerprint(normalizeBindings(f.state.settings.bindings, f.state.secrets)));
  assert.equal(report.nonBindingSettingsFingerprint, fingerprint({ observability: { logs: { enabled: true } } }));
  assert.deepEqual(report.annotations.latest, { tagMatches: true, messageMatches: true });
  assert.deepEqual(report.annotations.active, { tagMatches: false, messageMatches: false });
  assert.equal(f.state.calls.length, 8); assert.equal(f.state.betaReads, 0); assert.equal(report.mutationAttempted, false);
  const text = JSON.stringify(report);
  assert.ok(!text.includes("private-") && !text.includes("PRIVATE_SECRET_NAME") && !text.includes(expectedAnnotations.tag) && !text.includes(expectedAnnotations.message));
});

test("explicit reconciliation deduplicates an identical active/latest version and makes no readiness claim", async () => {
  const f = fixture(), report = await runProductionBindingReconciliation(f.inputs);
  assert.equal(report.metadataReady, false); assert.equal(report.reconciliationCompleted, true);
  assert.equal(report.activeEqualsLatest, true); assert.equal(report.equalities.settingsMatchesActive, true);
  assert.equal(report.equalities.settingsMatchesLatest, true); assert.deepEqual(report.changedBindingNames.activeVsLatest, []);
  assert.equal(report.annotations.expectedTagProvided, false); assert.equal(report.annotations.latest.tagMatches, null);
  assert.equal(f.state.calls.length, 7); assert.equal(f.state.betaReads, 0); assert.equal(f.state.legacyReads, 1);
});

test("reconciliation reports unsupported binding metadata and rejects a changing lease", async () => {
  const unsupported = fixture(); unsupported.state.latest = OTHER;
  unsupported.state.settings.bindings.push({ name: "UNHANDLED", type: "unsupported_resource", private: "private-unhandled-value" });
  const report = await unsupported.run();
  assert.equal(report.bindingComparisonsComplete, false); assert.equal(report.bindingFingerprints.settings, null);
  assert.equal(report.metadataReady, false); assert.ok(!JSON.stringify(report).includes("private-"));
  const changed = fixture(); changed.state.latest = OTHER;
  changed.state.alter = ({ path, result, round }) => { if (path.endsWith("/deployments") && round === 2) result.deployments[0].versions[0].version_id = OTHER; };
  const error = await changed.run().catch(error => error), failure = cleanupPreflightFailure(error);
  assert.equal(failure.failure.code, "active_latest_lease_changed");
  assert.equal(failure.failure.stage, "binding_reconciliation_final_lease");
  assert.deepEqual(failure.diagnostics.lease, { activeVersionId: ID, latestVersionId: OTHER, activeEqualsLatest: false, activePercentage: 100 });
  assert.equal(changed.state.calls.length, 8);
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
    f => { f.state.beta.modules[0].content_base64 = "AA=A"; },
    f => { f.state.beta.modules[0].content_base64 = "AAA"; },
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
    assert.equal(report.failure.stage, "initial_active_latest_lease");
    assert.ok(["Error", "SyntaxError", "PreflightError"].includes(report.failure.errorClass));
    assert.equal(f.state.calls.length, 2); assert.ok(!JSON.stringify(report).includes("private-"));
  }
});

test("unexpected provider-shape exceptions retain safe stage, class, field types and module sizes", async () => {
  const f = fixture(); f.state.beta.created_on = { toString: "private-invalid-provider-value" };
  const error = await f.run().catch(error => error), report = cleanupPreflightFailure(error);
  assert.equal(report.metadataReady, false); assert.equal(report.failure.errorClass, "TypeError");
  assert.equal(report.failure.stage, "version_round_1_description");
  assert.equal(report.diagnostics.cloudflareGetRequests, 4); assert.equal(report.diagnostics.completedVersionRounds, 0);
  const read = report.diagnostics.versionReads[0];
  assert.equal(read.stage, "runtime_and_schema_comparison");
  assert.deepEqual(read.fieldTypes.beta.created_on, ["object"]);
  assert.deepEqual(read.fieldTypes["beta.modules[]"].content_base64, ["string"]);
  assert.equal(read.moduleCount, 2); assert.equal(read.modulesVisited, 2);
  assert.ok(read.largestEncodedModuleCharacters > 0);
  assert.ok(!/private-|PRIVATE_SECRET_NAME|stack|Cannot convert/.test(JSON.stringify(report)));
});

test("version identity failures retain field shape without exposing provider values", async () => {
  const f = fixture(); f.state.beta.id = "private-unexpected-identity";
  const error = await f.run().catch(error => error), report = cleanupPreflightFailure(error);
  assert.equal(report.failure.stage, "version_round_1_identity");
  assert.equal(report.failure.errorClass, "PreflightError");
  assert.equal(report.diagnostics.versionReads[0].identity.betaMatches, false);
  assert.deepEqual(report.diagnostics.versionReads[0].fieldTypes.beta.id, ["string"]);
  assert.ok(!JSON.stringify(report).includes("private-")); assert.equal(f.state.calls.length, 4);
});

test("CLI context failure exits with only a sanitized JSON report and no cloud credentials", () => {
  const result = spawnSync(process.execPath, ["scripts/security/production-retirement-cleanup-preflight.mjs"],
    { cwd: new URL("../../", import.meta.url), env: { PATH: process.env.PATH, CLOUDFLARE_API_TOKEN: "private-test-token" }, encoding: "utf8" });
  assert.equal(result.status, 1); assert.equal(result.stderr, "");
  const report = JSON.parse(result.stdout); assert.equal(report.failure.code, "fixed_context_unverified");
  assert.ok(!result.stdout.includes("private-test-token")); assert.equal(report.mutationAttempted, false);
});

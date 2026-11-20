import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  REQUEST_PATH, CONFIG_PATH, validateProductionRequest, validateVerifiedAccess,
  prepareProductionRelease, deployProductionRelease, productionUploadArguments, uploadProductionCandidate, readProductionEligibility,
  ACTIVATION_REQUEST_PATH, readRecordedProductionCandidate, activateRecordedProductionCandidate,
} from "../../scripts/security/production-retirement-release.mjs";
import { ACCOUNT, QA, PRODUCTION, fingerprint } from "../../scripts/security/qa-retirement-release.mjs";
import { MODES } from "../../scripts/security/supabase-retirement-readonly.mjs";

const NOW = Date.parse("2026-11-20T15:30:00Z");
const PROD_VERSION = "11111111-1111-4111-8111-111111111111";
const QA_VERSION = "22222222-2222-4222-8222-222222222222";
const NEW_VERSION = "33333333-3333-4333-8333-333333333333";
const OTHER_VERSION = "44444444-4444-4444-8444-444444444444";
const HEAD = "a".repeat(40), PARENT = "b".repeat(40), PLAN = "c".repeat(64);
const clone = value => structuredClone(value);
const repositoryConfig = JSON.parse(await readFile(new URL("../../wrangler.jsonc", import.meta.url), "utf8"));

function fixture() {
  const request = { operation: "deploy-reviewed-retirement-candidate-to-production", requestId: "retirement-20261120-production-01",
    requestedAt: new Date(NOW - 1000).toISOString(), reviewedCommit: PARENT,
    expectedProductionVersionId: PROD_VERSION, expectedQaVersionId: QA_VERSION, expectedAccessPlanFingerprint: PLAN };
  const env = { GITHUB_REPOSITORY: "gvanesch/fractional-hr-site", GITHUB_REF: "refs/heads/chore/supabase-retirement-2026-11",
    GITHUB_SHA: HEAD, CLOUDFLARE_ACCOUNT_ID: ACCOUNT, CLOUDFLARE_API_TOKEN: "synthetic-test-token",
    NEXT_PUBLIC_APP_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://vanesch.uk", ADVISOR_AUTH_MODE: "cloudflare_access",
    ...Object.fromEntries(MODES.map(name => [name, "d1"])) };
  const git = { head: HEAD, parent: PARENT, changedPaths: [REQUEST_PATH] };
  const access = { kind: "verified-production-advisor-access", accountId: ACCOUNT,
    applicationId: "55555555-5555-4555-8555-555555555555", audience: "d".repeat(64), teamDomain: "https://gregvanesch.cloudflareaccess.com",
    planFingerprint: PLAN, applicationFingerprint: "e".repeat(64), protectedRoutesVerified: true, publicBoundariesVerified: true,
    identityPolicyVerified: true, cookiePathAttribute: false };
  const runtime = { compatibility_date: repositoryConfig.compatibility_date, compatibility_flags: repositoryConfig.compatibility_flags };
  function makeWorker(target, version) {
    const isProd = target.worker === PRODUCTION.worker;
    const bindings = [
      { name: "DB", type: "d1", id: target.database }, { name: "ASSETS", type: "assets" },
      { name: "WORKER_SELF_REFERENCE", type: "service", service: target.worker, environment: "production" },
      ...MODES.map(name => ({ name, type: "plain_text", text: "d1" })),
      { name: "NEXT_PUBLIC_APP_ENV", type: "plain_text", text: isProd ? "production" : "qa" },
      { name: "NEXT_PUBLIC_SITE_URL", type: "plain_text", text: isProd ? "https://vanesch.uk" : QA.site },
      ...["CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL", "DAILY_SUMMARY_RECIPIENT"].map(name => ({ name, type: "plain_text", text: "private-existing-value@example.invalid" })),
      ...["ADVISOR_ALLOWED_EMAILS", "CLIENT_DIAGNOSTIC_OTP_SECRET", "INVITE_RATE_LIMIT_SALT", "CRON_SECRET", "RESEND_API_KEY", "SUPABASE_SERVICE_ROLE_KEY"].map(name => ({ name, type: "secret_text" })),
      { name: "NEXT_PUBLIC_SUPABASE_URL", type: "plain_text", text: "https://synthetic.supabase.co" },
      ...(!isProd ? [{ name: "ADVISOR_AUTH_MODE", type: "plain_text", text: "cloudflare_access" },
        { name: "CLOUDFLARE_ACCESS_AUD", type: "secret_text" }, { name: "CLOUDFLARE_ACCESS_TEAM_DOMAIN", type: "secret_text" }] : []),
    ];
    const settings = { tags: isProd ? ["cf:service=fractional-hr-site"] : ["cf:service=fractional-hr-site", "cf:environment=qa"],
      observability: { logs: { enabled: true } }, bindings };
    return { active: version, latest: version, deployment: isProd ? "66666666-6666-4666-8666-666666666666" : "77777777-7777-4777-8777-777777777777",
      settings, schedules: { schedules: [] }, subdomain: { enabled: true, previews_enabled: false },
      versions: new Map([[version, { id: version, resources: { bindings: clone(bindings), script_runtime: clone(runtime) } }]]) };
  }
  const prod = makeWorker(PRODUCTION, PROD_VERSION), qa = makeWorker(QA, QA_VERSION);
  const state = { prod, qa, calls: [], uploads: [], evidence: [], accessReads: 0, activations: 0,
    afterUpload: null, beforeResponse: null, accessOverride: null, uncertainActivation: false, failPublicAfterActivation: false };
  async function fetchImpl(input, options = {}) {
    const url = new URL(String(input));
    const method = options.method ?? "GET";
    state.calls.push({ origin: url.origin, path: url.pathname, method });
    if (url.origin === "https://api.cloudflare.com") {
      assert.equal(options.redirect, "error");
      assert.equal(options.headers.Authorization, "Bearer synthetic-test-token");
      const prefix = `/client/v4/accounts/${ACCOUNT}`;
      assert.ok(url.pathname.startsWith(prefix));
      const path = url.pathname.slice(prefix.length);
      if (path === `/d1/database/${PRODUCTION.database}`) {
        assert.equal(method, "GET");
        return Response.json({ success: true, result: { uuid: PRODUCTION.database, name: "vanesch-prod" } });
      }
      const match = /^\/workers\/scripts\/(fractional-hr-site(?:-qa)?)\/(.*)$/.exec(path);
      assert.ok(match, "Only fixed Worker metadata/activation endpoints are allowed");
      const worker = match[1] === PRODUCTION.worker ? prod : qa;
      const resource = match[2];
      if (method === "POST") {
        assert.equal(match[1], PRODUCTION.worker);
        assert.equal(resource, "deployments");
        state.activations++;
        const payload = JSON.parse(options.body);
        assert.deepEqual(payload.versions, [{ version_id: NEW_VERSION, percentage: 100 }]);
        if (state.uncertainActivation) throw new Error("synthetic provider error containing secret-like-content");
        worker.active = NEW_VERSION;
        worker.deployment = "88888888-8888-4888-8888-888888888888";
        worker.settings.bindings = clone(worker.versions.get(NEW_VERSION).resources.bindings);
        return Response.json({ success: true, result: { id: worker.deployment } });
      }
      assert.equal(method, "GET");
      let result;
      if (resource === "settings") result = clone(worker.settings);
      else if (resource === "secrets") result = worker.settings.bindings.filter(b => b.type === "secret_text").map(b => ({ name: b.name, type: b.type }));
      else if (resource === "schedules") result = clone(worker.schedules);
      else if (resource === "subdomain") result = clone(worker.subdomain);
      else if (resource === "deployments") result = { deployments: [{ id: worker.deployment, versions: [{ version_id: worker.active, percentage: 100 }] }] };
      else if (resource === "versions") result = { items: [{ id: worker.latest }] };
      else if (resource.startsWith("versions/")) result = clone(worker.versions.get(resource.slice("versions/".length)));
      else assert.fail("Unexpected metadata endpoint");
      const override = state.beforeResponse?.({ resource, worker, result });
      return Response.json(override ?? { success: true, result });
    }
    assert.ok(["vanesch.uk", "www.vanesch.uk"].includes(url.hostname));
    assert.equal(method, "GET", "Hosted verification must never submit a form or cron POST");
    assert.equal(options.headers, undefined, "Cloudflare API credentials must not reach public origins");
    if (url.pathname === "/api/health") return Response.json({ status: "ok", d1: "connected",
      supabase: prod.active === NEW_VERSION && !state.failPublicAfterActivation ? "not_required" : "connected" });
    if (url.pathname === "/advisor") return new Response(null, { status: 302, headers: { location: "https://gregvanesch.cloudflareaccess.com/cdn-cgi/access/login/vanesch.uk" } });
    if (url.pathname.startsWith("/api/")) return new Response(null, { status: 405 });
    return new Response("<html>Production public page</html>", { headers: { "content-type": "text/html" } });
  }
  async function inspectAccess() {
    state.accessReads++;
    return clone(state.accessOverride?.(state.accessReads, access) ?? access);
  }
  async function uploadImpl(args) {
    state.uploads.push(clone(args));
    const bindings = clone(prod.settings.bindings).filter(b => b.name !== "ADVISOR_AUTH_MODE");
    bindings.push({ name: "ADVISOR_AUTH_MODE", type: "plain_text", text: "cloudflare_access" },
      { name: "CLOUDFLARE_ACCESS_AUD", type: "plain_text", text: access.audience },
      { name: "CLOUDFLARE_ACCESS_TEAM_DOMAIN", type: "plain_text", text: access.teamDomain });
    prod.versions.set(NEW_VERSION, { id: NEW_VERSION, annotations: { "workers/tag": args.tag, "workers/message": args.message },
      resources: { bindings, script_runtime: clone(runtime) } });
    prod.latest = NEW_VERSION;
    // Cloudflare exposes latest uploaded bindings through /settings even while
    // /deployments still sends all traffic to the previous immutable version.
    prod.settings.bindings = clone(bindings);
    await state.afterUpload?.();
    return NEW_VERSION;
  }
  const inputs = { request, env, git, repositoryConfig: clone(repositoryConfig), inspectAccess, fetchImpl, now: NOW };
  return { request, env, git, access, state, inputs, fetchImpl, inspectAccess, uploadImpl,
    prepare: () => prepareProductionRelease(inputs),
    deploy: prepared => deployProductionRelease({ ...inputs, ...prepared, uploadImpl, onEvidence: report => { state.evidence.push(clone(report)); } }) };
}

test("prepare makes only reads and pins exact production/QA/Access state without exposing existing binding values", async () => {
  const f = fixture();
  const prepared = await f.prepare();
  assert.equal(prepared.config.name, PRODUCTION.worker);
  assert.equal(prepared.config.keep_vars, true);
  assert.deepEqual(prepared.config.d1_databases.map(b => b.database_id), [PRODUCTION.database]);
  assert.deepEqual(Object.keys(prepared.config.vars).sort(), [...MODES, "ADVISOR_AUTH_MODE", "CLOUDFLARE_ACCESS_AUD", "CLOUDFLARE_ACCESS_TEAM_DOMAIN"].sort());
  assert.equal(prepared.config.env.qa.d1_databases[0].database_id, QA.database);
  assert.equal(prepared.checkpoint.production.versionId, PROD_VERSION);
  assert.equal(prepared.checkpoint.qa.versionId, QA_VERSION);
  assert.ok(f.state.calls.every(call => call.method === "GET"));
  assert.equal(f.state.uploads.length, 0);
  assert.ok(!JSON.stringify(prepared).includes("private-existing-value"));
  assert.ok(!JSON.stringify(prepared).includes("synthetic-test-token"));
});

test("pre-Access eligibility uses GET-only metadata, verifies real production/QA configuration and returns no generated values", async () => {
  const f = fixture();
  const result = await readProductionEligibility({ env: f.env, repositoryConfig: f.inputs.repositoryConfig,
    expectedProductionVersionId: PROD_VERSION, expectedQaVersionId: QA_VERSION, fetchImpl: f.fetchImpl });
  assert.equal(result.eligibleForReviewedAuthChange, true);
  assert.equal(result.productionEnvironmentVerified, true);
  assert.equal(result.qaIsolationVerified, true);
  assert.equal(result.accessApplicationVerified, false);
  assert.equal(f.state.accessReads, 0);
  assert.equal(f.state.uploads.length, 0);
  assert.ok(f.state.calls.every(call => call.method === "GET" && call.origin === "https://api.cloudflare.com"));
  assert.ok(!JSON.stringify(result).includes("private-existing-value"));
  assert.ok(!JSON.stringify(result).includes("synthetic-test-token"));
  assert.ok(!JSON.stringify(result).includes("0".repeat(64)));
});

test("eligibility rejects unknown production environment values and QA isolation/configuration drift before Access creation", async () => {
  for (const mutate of [
    f => { f.env.GITHUB_REF = "refs/heads/main"; },
    f => { f.state.prod.settings.bindings.find(b => b.name === "NEXT_PUBLIC_APP_ENV").text = "prod"; },
    f => { f.state.prod.settings.bindings = f.state.prod.settings.bindings.filter(b => b.name !== "NEXT_PUBLIC_APP_ENV"); },
    f => { f.state.qa.settings.bindings.find(b => b.name === "DB").id = PRODUCTION.database; },
    f => { f.state.qa.settings.tags = ["cf:service=unexpected"]; },
  ]) {
    const f = fixture(); mutate(f);
    f.state.prod.versions.get(PROD_VERSION).resources.bindings = clone(f.state.prod.settings.bindings);
    f.state.qa.versions.get(QA_VERSION).resources.bindings = clone(f.state.qa.settings.bindings);
    await assert.rejects(readProductionEligibility({ env: f.env, repositoryConfig: f.inputs.repositoryConfig,
      expectedProductionVersionId: PROD_VERSION, expectedQaVersionId: QA_VERSION, fetchImpl: f.fetchImpl }));
    assert.equal(f.state.uploads.length, 0);
    assert.equal(f.state.activations, 0);
    assert.ok(f.state.calls.every(call => call.method === "GET"));
  }
});

test("request/source/build-environment guard rejects stale, ambiguous and Supabase-enabled requests", () => {
  const mutations = [
    f => { f.request.requestedAt = new Date(NOW - 86400001).toISOString(); },
    f => { f.request.requestedAt = new Date(NOW + 1).toISOString(); },
    f => { f.request.expectedAccessPlanFingerprint = "unknown"; },
    f => { f.env.GITHUB_REF = "refs/heads/main"; },
    f => { f.env.CLOUDFLARE_ACCOUNT_ID = "wrong-account"; },
    f => { f.git.parent = "f".repeat(40); },
    f => { f.git.changedPaths.push("app/page.tsx"); },
    f => { f.env.GITHUB_SHA = "f".repeat(40); },
    f => { f.env.NEXT_PUBLIC_APP_ENV = "qa"; },
    f => { f.env.NEXT_PUBLIC_SITE_URL = QA.site; },
    f => { f.env[MODES[0]] = "off"; },
    f => { f.env.ADVISOR_AUTH_MODE = "supabase"; },
    f => { f.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "synthetic-unwanted-key"; },
    f => { f.env.SUPABASE_URL = "https://synthetic.supabase.co"; },
    f => { f.env.CLOUDFLARE_ENV = "qa"; },
    f => { f.env.NEXT_DEV_WRANGLER_ENV = "qa"; },
  ];
  for (const mutate of mutations) {
    const f = fixture(); mutate(f);
    assert.throws(() => validateProductionRequest(f.request, f.env, f.git, NOW));
    assert.equal(f.state.calls.length, 0);
  }
});

test("Access proof requires the exact plan, domain, app audience, identity and public-route assertions", () => {
  for (const [key, value] of [
    ["kind", "unchecked"], ["accountId", "wrong-account"], ["applicationId", "unknown"], ["audience", "unknown"],
    ["teamDomain", "https://unexpected.cloudflareaccess.com"], ["planFingerprint", "f".repeat(64)],
    ["applicationFingerprint", "unknown"], ["protectedRoutesVerified", false], ["publicBoundariesVerified", false],
    ["identityPolicyVerified", false], ["cookiePathAttribute", true],
  ]) {
    const f = fixture(); f.access[key] = value;
    assert.throws(() => validateVerifiedAccess(f.access, f.request));
  }
});

test("prepare refuses preexisting Access bindings, missing secrets and non-D1 production resource state", async () => {
  const mutations = [
    bindings => bindings.push({ name: "CLOUDFLARE_ACCESS_AUD", type: "plain_text", text: "d".repeat(64) }),
    bindings => bindings.push({ name: "CLOUDFLARE_ACCESS_TEAM_DOMAIN", type: "secret_text" }),
    bindings => bindings.push({ name: "ADVISOR_AUTH_MODE", type: "plain_text", text: "cloudflare_access" }),
    bindings => { bindings.find(b => b.name === "DB").id = QA.database; },
    bindings => { bindings.find(b => b.name === MODES[0]).text = "off"; },
    bindings => bindings.splice(bindings.findIndex(b => b.name === "ADVISOR_ALLOWED_EMAILS"), 1),
    bindings => bindings.push({ name: "UNREVIEWED_RESOURCE", type: "r2_bucket" }),
  ];
  for (const mutate of mutations) {
    const f = fixture(); mutate(f.state.prod.settings.bindings);
    f.state.prod.versions.get(PROD_VERSION).resources.bindings = clone(f.state.prod.settings.bindings);
    await assert.rejects(f.prepare());
    assert.equal(f.state.activations, 0);
    assert.ok(f.state.calls.every(call => call.method === "GET"));
  }
});

test("prepare refuses unknown latest uploaded versions in either production or QA", async () => {
  for (const target of ["prod", "qa"]) {
    const f = fixture(); f.state[target].latest = OTHER_VERSION;
    await assert.rejects(f.prepare(), /undeployed Worker version/);
    assert.equal(f.state.activations, 0);
  }
});

test("uploader config preserves existing grouping and refuses side-effectful repository configuration", async () => {
  const plain = fixture(); plain.state.prod.settings.tags = ["retained-custom-tag"];
  assert.equal((await plain.prepare()).config.env, undefined);
  for (const mutate of [
    f => { f.state.prod.settings.tags.push("cf:environment=qa"); },
    f => { f.inputs.repositoryConfig.routes = [{ pattern: "example.invalid/*" }]; },
    f => { f.inputs.repositoryConfig.triggers = { crons: [] }; },
    f => { f.inputs.repositoryConfig.migrations = []; },
    f => { f.inputs.repositoryConfig.vars.UNREVIEWED_FLAG = "true"; },
    f => { f.inputs.repositoryConfig.compatibility_date = "2026-01-01"; },
  ]) {
    const f = fixture(); mutate(f);
    await assert.rejects(f.prepare());
    assert.equal(f.state.activations, 0);
  }
});

test("versioned limits are carried forward and unreviewed placement/cache/tail settings stop before upload", async () => {
  const f = fixture();
  f.state.prod.settings.placement = { mode: "off" };
  f.state.prod.settings.cache_options = { enabled: false, cross_version_cache: false };
  f.state.prod.settings.limits = { cpu_ms: 30000 };
  f.state.prod.versions.get(PROD_VERSION).resources.script_runtime.limits = { cpu_ms: 30000, subrequests: 1000 };
  const prepared = await f.prepare();
  assert.deepEqual(prepared.config.placement, { mode: "off" });
  assert.deepEqual(prepared.config.cache, { enabled: false, cross_version_cache: false });
  assert.deepEqual(prepared.config.limits, { cpu_ms: 30000, subrequests: 1000 });
  for (const [key, value] of [
    ["placement", { mode: "smart" }], ["placement", { mode: "off", unknown: true }],
    ["cache_options", { enabled: true }], ["cache", { enabled: false, cross_version_cache: true }],
    ["tail_consumers", [{ service: "existing-observer" }]], ["limits", { unknown_limit: 1 }],
  ]) {
    const invalid = fixture(); invalid.state.prod.settings[key] = value;
    await assert.rejects(invalid.prepare());
    assert.equal(invalid.state.uploads.length, 0);
    assert.equal(invalid.state.activations, 0);
  }
});

test("one inactive upload then one verified activation changes only the three auth vars and leaves QA untouched", async () => {
  const f = fixture();
  const beforeQa = fingerprint(f.state.qa.settings);
  const oldProdSecrets = f.state.prod.settings.bindings.filter(b => b.type === "secret_text").map(b => b.name).sort();
  const prepared = await f.prepare();
  const result = await f.deploy(prepared);
  assert.equal(result.stage, "verified");
  assert.equal(result.previousProductionVersion, PROD_VERSION);
  assert.equal(result.deployedProductionVersion, NEW_VERSION);
  assert.equal(result.authenticatedAdvisorFlowTested, false);
  assert.equal(result.databaseWrites, false);
  assert.equal(result.emailsSent, false);
  assert.equal(result.supabaseShutdownPerformed, false);
  assert.equal(f.state.uploads.length, 1);
  assert.equal(f.state.uploads[0].expectedConfigFingerprint, prepared.checkpoint.configFingerprint);
  assert.equal(f.state.activations, 1);
  assert.equal(f.state.accessReads, 4);
  assert.equal(fingerprint(f.state.qa.settings), beforeQa);
  assert.deepEqual(f.state.prod.settings.bindings.filter(b => b.type === "secret_text").map(b => b.name).sort(), oldProdSecrets);
  assert.deepEqual(f.state.calls.filter(call => call.method !== "GET").map(call => call.path), [`/client/v4/accounts/${ACCOUNT}/workers/scripts/${PRODUCTION.worker}/deployments`]);
  assert.deepEqual(f.state.evidence.map(item => item.stage), ["upload_requested_outcome_unknown", "uploaded_not_activated", "activation_requested_outcome_unknown", "activated_verification_pending", "verified"]);
  assert.ok(!JSON.stringify(f.state.evidence).includes(f.access.audience));
});

test("stale or changed checkpoint cannot invoke the uploader", async () => {
  for (const mutate of [
    prepared => { prepared.checkpoint.preparedAt = new Date(NOW - 3600001).toISOString(); },
    prepared => { prepared.config.vars.ADVISOR_AUTH_MODE = "supabase"; },
    prepared => { prepared.checkpoint.sourceCommit = "f".repeat(40); },
    prepared => { prepared.checkpoint.expectedBindingFingerprint = "unknown"; },
  ]) {
    const f = fixture(); const prepared = await f.prepare(); mutate(prepared);
    await assert.rejects(f.deploy(prepared));
    assert.equal(f.state.uploads.length, 0);
  }
});

test("production, QA or Access lease drift prevents the first upload", async () => {
  for (const mutate of [
    f => { f.state.prod.settings.observability.logs.enabled = false; },
    f => { f.state.qa.schedules.schedules.push({ cron: "0 * * * *" }); },
    f => { f.state.prod.subdomain.previews_enabled = true; },
    f => { f.access.applicationFingerprint = "f".repeat(64); },
  ]) {
    const f = fixture(); const prepared = await f.prepare(); mutate(f);
    await assert.rejects(f.deploy(prepared));
    assert.equal(f.state.uploads.length, 0);
    assert.equal(f.state.activations, 0);
  }
});

test("wrong candidate bindings or annotations stop after inactive upload", async () => {
  for (const mutate of [
    candidate => { candidate.annotations["workers/message"] = "wrong-candidate"; },
    candidate => { candidate.resources.bindings.find(b => b.name === "CLOUDFLARE_ACCESS_AUD").text = "f".repeat(64); },
    candidate => { candidate.resources.bindings.find(b => b.name === "DB").id = QA.database; },
    candidate => { candidate.resources.bindings = candidate.resources.bindings.filter(b => b.name !== "CRON_SECRET"); },
    candidate => { candidate.resources.script_runtime.compatibility_date = "2026-01-01"; },
  ]) {
    const f = fixture(); const prepared = await f.prepare();
    f.state.afterUpload = () => mutate(f.state.prod.versions.get(NEW_VERSION));
    await assert.rejects(f.deploy(prepared), /Uploaded production version/);
    assert.equal(f.state.uploads.length, 1);
    assert.equal(f.state.activations, 0);
    assert.equal(f.state.prod.active, PROD_VERSION);
  }
});

test("late QA, production or Access drift prevents activation of an otherwise valid upload", async () => {
  for (const mutate of [
    f => { f.state.qa.subdomain.enabled = false; },
    f => { f.state.prod.latest = OTHER_VERSION; },
    f => { f.state.prod.schedules.schedules.push({ cron: "0 * * * *" }); },
    f => { f.access.applicationFingerprint = "f".repeat(64); },
  ]) {
    const f = fixture(); const prepared = await f.prepare(); f.state.afterUpload = () => mutate(f);
    await assert.rejects(f.deploy(prepared));
    assert.equal(f.state.activations, 0);
    assert.equal(f.state.prod.active, PROD_VERSION);
  }
});

test("uncertain activation is attempted once, preserves recovery evidence and never leaks provider text", async () => {
  const f = fixture(); const prepared = await f.prepare(); f.state.uncertainActivation = true;
  await assert.rejects(f.deploy(prepared), error => /no automatic mutation retry/.test(error.message) && !error.message.includes("secret-like-content"));
  assert.equal(f.state.activations, 1);
  assert.equal(f.state.evidence.at(-1).stage, "activation_requested_outcome_unknown");
  assert.equal(f.state.evidence.at(-1).previousProductionVersion, PROD_VERSION);
  assert.equal(f.state.evidence.at(-1).uploadedProductionVersion, NEW_VERSION);
});

test("post-activation independence failure retains activated-pending evidence and does not repeat or roll back automatically", async () => {
  const f = fixture(); const prepared = await f.prepare(); f.state.failPublicAfterActivation = true;
  await assert.rejects(f.deploy(prepared), /required D1\/auth state/);
  assert.equal(f.state.activations, 1);
  assert.equal(f.state.prod.active, NEW_VERSION);
  assert.equal(f.state.evidence.at(-1).stage, "activated_verification_pending");
});

test("API success envelopes and Access callback failures fail closed with sanitized errors", async () => {
  for (const envelope of [null, [], { success: false, result: {} }, { result: {} }]) {
    const f = fixture();
    f.state.beforeResponse = ({ resource }) => resource === "settings" ? envelope : undefined;
    // null needs a Response override because the fixture's optional override uses ?? .
    const fetchImpl = envelope === null ? async (url, options) => String(url).endsWith("/settings") ? Response.json(null) : f.fetchImpl(url, options) : f.fetchImpl;
    await assert.rejects(prepareProductionRelease({ ...f.inputs, fetchImpl }), /did not confirm/);
    assert.equal(f.state.activations, 0);
  }
  const f = fixture();
  await assert.rejects(prepareProductionRelease({ ...f.inputs, inspectAccess: async () => { throw new Error("secret-like-provider-body"); } }),
    error => /Access verification failed/.test(error.message) && !error.message.includes("secret-like-provider-body"));
});

test("upload arguments pin production and accept no unreviewed config, shell metacharacters or QA selection", () => {
  const args = { configPath: CONFIG_PATH, tag: "retirement-" + "a".repeat(24), message: "production-retirement-" + HEAD };
  const invocation = productionUploadArguments(args);
  assert.equal(invocation[invocation.indexOf("--name") + 1], PRODUCTION.worker);
  assert.equal(invocation.includes("--env"), false);
  assert.equal(invocation.includes("deploy"), false);
  for (const mutation of [{ configPath: "wrangler.jsonc" }, { tag: "retirement-$(echo unsafe)" }, { message: "production-retirement-" + HEAD + " --env qa" }])
    assert.throws(() => productionUploadArguments({ ...args, ...mutation }));
});

test("real uploader rejects a changed generated file before launching a subprocess", async () => {
  const directory = await mkdtemp(join(tmpdir(), "production-retirement-guard-"));
  const previousCwd = process.cwd();
  try {
    process.chdir(directory);
    await writeFile(CONFIG_PATH, JSON.stringify({ name: "unreviewed-worker" }));
    await assert.rejects(uploadProductionCandidate({ configPath: CONFIG_PATH, tag: "retirement-" + "a".repeat(24),
      message: "production-retirement-" + HEAD, expectedConfigFingerprint: "f".repeat(64) }), /upload file differs/);
  } finally {
    process.chdir(previousCwd);
    await rm(directory, { recursive: true, force: true });
  }
});

async function recordedFixture({ resumedAccess = false } = {}) {
  const f = fixture();
  const originalEligibility = await readProductionEligibility({ env: f.env, repositoryConfig: f.inputs.repositoryConfig,
    expectedProductionVersionId: PROD_VERSION, expectedQaVersionId: QA_VERSION, fetchImpl: f.fetchImpl });
  const originalRequest = clone(f.request);
  if (resumedAccess) originalRequest.accessRecovery = { originalRequest: { ...clone(f.request), requestId: "retirement-original-policy-only" },
    evidence: { stage: "policy_created_verification_pending", policyId: "99999999-9999-4999-8999-999999999999" } };
  await f.uploadImpl({ tag: `retirement-${fingerprint(originalRequest).slice(0, 24)}`, message: `production-retirement-${HEAD}` });
  const ownership = originalRequest.accessRecovery?.originalRequest ?? originalRequest;
  const recordedReport = { requestId: originalRequest.requestId, sourceCommit: HEAD, stage: "worker", stopped: true,
    buildFingerprint: "1".repeat(64), failure: "Active Worker version and settings do not agree.",
    access: { kind: "production-retirement-access-checkpoint", stage: "verified", requestId: ownership.requestId,
      requestFingerprint: fingerprint(ownership), sourceCommit: resumedAccess ? "2".repeat(40) : HEAD,
      planFingerprint: PLAN, applicationId: f.access.applicationId, policyId: "99999999-9999-4999-8999-999999999999",
      policyFingerprint: "3".repeat(64), applicationFingerprint: f.access.applicationFingerprint,
      workerEligibilityFingerprint: fingerprint(originalEligibility),
      ...(resumedAccess ? { resumeExecutionFingerprint: fingerprint(originalRequest), resumeExecutionSourceCommit: HEAD,
        resumeEvidenceFingerprint: fingerprint(originalRequest.accessRecovery.evidence) } : {}) },
    worker: { stage: "uploaded_not_activated", previousProductionVersion: PROD_VERSION, qaVersion: QA_VERSION,
      previousVersionUsesSupabaseAuth: true, accessRollbackIsSeparate: true, uploadedProductionVersion: NEW_VERSION } };
  const request = { operation: "activate-recorded-retirement-candidate-to-production", requestId: "activate-recorded-production-01",
    requestedAt: new Date(NOW - 500).toISOString(), reviewedCommit: PARENT, expectedProductionVersionId: PROD_VERSION,
    expectedQaVersionId: QA_VERSION, expectedAccessPlanFingerprint: PLAN, candidateVersionId: NEW_VERSION,
    originalSourceCommit: HEAD, originalRequestFingerprint: fingerprint(originalRequest),
    recordedReportFingerprint: fingerprint(recordedReport), originalEligibilityFingerprint: fingerprint(originalEligibility) };
  const newHead = "9".repeat(40);
  const args = { ...f.inputs, request, env: { ...f.env, GITHUB_SHA: newHead },
    git: { head: newHead, parent: PARENT, changedPaths: [ACTIVATION_REQUEST_PATH] },
    originalRequest, originalSourceCommit: HEAD, recordedReport, originalEligibility };
  f.state.calls = []; f.state.uploads = []; f.state.evidence = [];
  return { ...f, args, read: () => readRecordedProductionCandidate(args),
    activate: checkpoint => activateRecordedProductionCandidate({ ...args, checkpoint,
      onEvidence: report => { f.state.evidence.push(clone(report)); } }) };
}

test("known latest settings are reconciled against the candidate while immutable old bindings remain the active lease", async () => {
  const f = await recordedFixture();
  const checkpoint = await f.read();
  assert.equal(f.state.prod.active, PROD_VERSION);
  assert.equal(f.state.prod.latest, NEW_VERSION);
  assert.equal(checkpoint.production.versionId, PROD_VERSION);
  assert.equal(checkpoint.production.latestVersionId, NEW_VERSION);
  assert.equal(checkpoint.production.bindingFingerprint, f.args.originalEligibility.productionBindingFingerprint);
  assert.notEqual(checkpoint.production.bindingFingerprint, checkpoint.expectedBindingFingerprint);
  assert.equal(checkpoint.originalEligibilityFingerprint, fingerprint(f.args.originalEligibility));
  assert.ok(f.state.calls.every(call => call.method === "GET"));
  assert.equal(f.state.uploads.length, 0);
  assert.equal(f.state.activations, 0);
  assert.ok(!JSON.stringify(checkpoint).includes("private-existing-value"));
  assert.ok(!JSON.stringify(checkpoint).includes(f.access.audience));
});

test("existing recorded candidate activates once without uploads or Access writes and verifies final independence", async () => {
  for (const resumedAccess of [false, true]) {
    const f = await recordedFixture({ resumedAccess });
    const checkpoint = await f.read();
    const qaBefore = fingerprint(f.state.qa);
    const report = await f.activate(checkpoint);
    assert.equal(report.stage, "verified");
    assert.equal(report.candidateCommit, HEAD);
    assert.equal(report.activationSourceCommit, f.args.git.head);
    assert.equal(report.deployedProductionVersion, NEW_VERSION);
    assert.equal(report.uploadsPerformed, false);
    assert.equal(report.accessPolicyChanges, false);
    assert.equal(report.healthSupabaseNotRequired, true);
    assert.equal(report.authenticatedAdvisorFlowTested, false);
    assert.equal(report.databaseWrites, false);
    assert.equal(report.emailsSent, false);
    assert.equal(f.state.uploads.length, 0);
    assert.equal(f.state.activations, 1);
    assert.equal(fingerprint(f.state.qa), qaBefore);
    assert.deepEqual(f.state.calls.filter(call => call.method !== "GET").map(call => call.path),
      [`/client/v4/accounts/${ACCOUNT}/workers/scripts/${PRODUCTION.worker}/deployments`]);
    assert.deepEqual(f.state.evidence.map(value => value.stage), ["activation_requested_outcome_unknown", "activated_verification_pending", "verified"]);
  }
});

test("recorded activation validates the fresh request-only source and every original provenance link before reads", async () => {
  for (const mutate of [
    f => { f.args.env.GITHUB_REF = "refs/heads/main"; },
    f => { f.args.env.GITHUB_SHA = HEAD; },
    f => { f.args.env.SUPABASE_SERVICE_ROLE_KEY = "unwanted-value"; },
    f => { f.args.git.changedPaths = [REQUEST_PATH]; },
    f => { f.args.git.changedPaths.push("app/page.tsx"); },
    f => { f.args.request.operation = "deploy-reviewed-retirement-candidate-to-production"; },
    f => { f.args.request.requestedAt = new Date(NOW - 86400001).toISOString(); },
    f => { f.args.request.candidateVersionId = PROD_VERSION; },
    f => { f.args.request.unreviewedFlag = true; },
    f => { f.args.originalRequest.requestId = "different-original-request"; },
    f => { f.args.originalSourceCommit = "f".repeat(40); },
    f => { f.args.originalEligibility.productionBindingFingerprint = "f".repeat(64); },
    f => { f.args.recordedReport.worker.stage = "activation_requested_outcome_unknown"; },
    f => { f.args.recordedReport.access.stage = "application_created_verification_pending"; },
  ]) {
    const f = await recordedFixture(); mutate(f);
    await assert.rejects(f.read());
    assert.equal(f.state.calls.length, 0);
    assert.equal(f.state.activations, 0);
  }
});

test("recorded evidence must prove no prior activation and the exact original Access ownership even if rehashed", async () => {
  for (const mutate of [
    f => { f.args.recordedReport.stage = "verified"; },
    f => { f.args.recordedReport.stopped = false; },
    f => { f.args.recordedReport.failure = "unrelated failure"; },
    f => { f.args.recordedReport.sourceCommit = "f".repeat(40); },
    f => { f.args.recordedReport.worker.deployedProductionVersion = NEW_VERSION; },
    f => { f.args.recordedReport.worker.uploadedProductionVersion = OTHER_VERSION; },
    f => { f.args.recordedReport.access.requestFingerprint = "f".repeat(64); },
    f => { f.args.recordedReport.access.workerEligibilityFingerprint = "f".repeat(64); },
    f => { f.args.recordedReport.access.resumeExecutionSourceCommit = "f".repeat(40); },
    f => { f.args.recordedReport.access.resumeEvidenceFingerprint = "f".repeat(64); },
  ]) {
    const f = await recordedFixture({ resumedAccess: true }); mutate(f);
    f.args.request.recordedReportFingerprint = fingerprint(f.args.recordedReport);
    await assert.rejects(f.read());
    assert.equal(f.state.calls.length, 0);
    assert.equal(f.state.activations, 0);
  }
});

test("unknown latest, old or altered settings, resource drift and Access drift cannot authorize recorded activation", async () => {
  for (const mutate of [
    f => { f.state.prod.latest = OTHER_VERSION; },
    f => { f.state.prod.active = OTHER_VERSION; },
    f => { f.state.prod.settings.bindings = clone(f.state.prod.versions.get(PROD_VERSION).resources.bindings); },
    f => { f.state.prod.settings.bindings.find(b => b.name === "CLOUDFLARE_ACCESS_AUD").text = "f".repeat(64); },
    f => { f.state.prod.settings.observability.logs.enabled = false; },
    f => { f.state.prod.subdomain.previews_enabled = true; },
    f => { f.state.qa.schedules.schedules.push({ cron: "0 * * * *" }); },
    f => { f.state.qa.latest = OTHER_VERSION; },
    f => { f.state.prod.versions.get(NEW_VERSION).annotations["workers/message"] = "production-retirement-" + "f".repeat(40); },
    f => { f.state.prod.versions.get(NEW_VERSION).annotations["workers/tag"] = "retirement-" + "f".repeat(24); },
    f => { f.state.prod.versions.get(NEW_VERSION).resources.script_runtime.compatibility_date = "2026-01-01"; },
    f => {
      f.state.prod.versions.get(NEW_VERSION).resources.bindings.find(b => b.name === "DB").id = QA.database;
      f.state.prod.settings.bindings = clone(f.state.prod.versions.get(NEW_VERSION).resources.bindings);
    },
    f => { f.access.applicationFingerprint = "f".repeat(64); },
    f => { f.access.applicationId = OTHER_VERSION; },
  ]) {
    const f = await recordedFixture(); mutate(f);
    await assert.rejects(f.read());
    assert.equal(f.state.activations, 0);
    assert.equal(f.state.uploads.length, 0);
    assert.ok(f.state.calls.every(call => call.method === "GET"));
  }
});

test("activation rereads state and rejects lease or checkpoint drift with no POST", async () => {
  for (const mutate of [
    (f, checkpoint) => { checkpoint.preparedAt = new Date(NOW - 3600001).toISOString(); },
    (f, checkpoint) => { checkpoint.expectedBindingFingerprint = "f".repeat(64); },
    (f, checkpoint) => { checkpoint.candidateFingerprint = "f".repeat(64); },
    f => { f.state.prod.deployment = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"; },
    f => { f.state.prod.latest = OTHER_VERSION; },
    f => { f.state.qa.settings.tags.push("unreviewed-tag"); },
    f => { f.access.applicationFingerprint = "f".repeat(64); },
  ]) {
    const f = await recordedFixture(); const checkpoint = await f.read(); mutate(f, checkpoint);
    await assert.rejects(f.activate(checkpoint));
    assert.equal(f.state.activations, 0);
    assert.equal(f.state.uploads.length, 0);
  }
});

test("durable activation intent must succeed before POST; uncertainty and post-check failures never retry", async () => {
  const before = await recordedFixture(); const beforeCheckpoint = await before.read();
  await assert.rejects(activateRecordedProductionCandidate({ ...before.args, checkpoint: beforeCheckpoint }));
  await assert.rejects(activateRecordedProductionCandidate({ ...before.args, checkpoint: beforeCheckpoint,
    onEvidence: async () => { throw new Error("recording failed"); } }));
  assert.equal(before.state.activations, 0);
  const uncertain = await recordedFixture(); const uncertainCheckpoint = await uncertain.read();
  uncertain.state.uncertainActivation = true;
  await assert.rejects(uncertain.activate(uncertainCheckpoint), error => /no automatic mutation retry/.test(error.message) &&
    !error.message.includes("secret-like-content"));
  assert.equal(uncertain.state.activations, 1);
  assert.equal(uncertain.state.evidence.at(-1).stage, "activation_requested_outcome_unknown");
  const after = await recordedFixture(); const afterCheckpoint = await after.read();
  after.state.failPublicAfterActivation = true;
  await assert.rejects(after.activate(afterCheckpoint), /required D1\/auth state/);
  assert.equal(after.state.activations, 1);
  assert.equal(after.state.prod.active, NEW_VERSION);
  assert.equal(after.state.evidence.at(-1).stage, "activated_verification_pending");
  // Even reusing original evidence cannot resubmit after observed activation.
  await assert.rejects(after.activate(afterCheckpoint), /current Worker deployment differs/);
  assert.equal(after.state.activations, 1);
});

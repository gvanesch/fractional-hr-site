import test from "node:test";
import assert from "node:assert/strict";
import {
  LEGACY_SUPABASE_BINDINGS, validateCleanupContext, prepareProductionBindingCleanup,
  createProductionBindingCleanupVersion, activateProductionBindingCleanup,
} from "../../scripts/security/production-retirement-binding-cleanup.mjs";
import { ACCOUNT, QA, PRODUCTION, fingerprint } from "../../scripts/security/qa-retirement-release.mjs";
import { MODES } from "../../scripts/security/supabase-retirement-readonly.mjs";

const NOW = Date.parse("2026-11-20T20:00:00Z");
const PROD = "11111111-1111-4111-8111-111111111111", QA_ID = "22222222-2222-4222-8222-222222222222";
const CANDIDATE = "33333333-3333-4333-8333-333333333333", OTHER = "44444444-4444-4444-8444-444444444444";
const PLAN = "a".repeat(64), APP = "b".repeat(64), AUD = "c".repeat(64);
const clone = value => structuredClone(value);
const mutations = state => state.calls.filter(call => call.method !== "GET");
const hash = value => fingerprint({ value });
function asBeta(entries) { return entries.map(item => item.type === "d1" ? { name: item.name, type: "d1", database_id: item.id } : clone(item)); }
function envMap(entries) { return Object.fromEntries(entries.map(({ name, ...rest }) => [name, rest])); }

function fixture() {
  const env = { GITHUB_REPOSITORY: "gvanesch/fractional-hr-site", GITHUB_REF: "refs/heads/chore/supabase-retirement-2026-11",
    GITHUB_SHA: "d".repeat(40), CLOUDFLARE_ACCOUNT_ID: ACCOUNT, CLOUDFLARE_API_TOKEN: "synthetic-test-token" };
  const accepted = { kind: "accepted-production-d1-access", acceptedAt: new Date(NOW - 1000).toISOString(),
    productionVersionId: PROD, qaVersionId: QA_ID, accessPlanFingerprint: PLAN, accessApplicationFingerprint: APP,
    healthD1Connected: true, healthSupabaseNotRequired: true, healthCheckD1WriteReadVerified: true,
    advisorFlowVerified: true, crmFlowVerified: true, projectSpacesVerified: true, baselineFlowVerified: true, logoutVerified: true };
  const access = { kind: "verified-production-advisor-access", accountId: ACCOUNT,
    applicationId: "55555555-5555-4555-8555-555555555555", audience: AUD, teamDomain: "https://gregvanesch.cloudflareaccess.com",
    planFingerprint: PLAN, applicationFingerprint: APP, protectedRoutesVerified: true, publicBoundariesVerified: true,
    identityPolicyVerified: true, cookiePathAttribute: false };
  function worker(target, id) {
    const production = target === PRODUCTION;
    const bindings = [
      { name: "DB", type: "d1", id: target.database }, { name: "ASSETS", type: "assets" },
      { name: "WORKER_SELF_REFERENCE", type: "service", service: target.worker, environment: "production" },
      ...MODES.map(name => ({ name, type: "plain_text", text: "d1" })),
      { name: "ADVISOR_AUTH_MODE", type: "plain_text", text: "cloudflare_access" },
      { name: "CLOUDFLARE_ACCESS_AUD", type: "plain_text", text: AUD },
      { name: "CLOUDFLARE_ACCESS_TEAM_DOMAIN", type: "plain_text", text: access.teamDomain },
      { name: "NEXT_PUBLIC_APP_ENV", type: "plain_text", text: production ? "production" : "qa" },
      { name: "NEXT_PUBLIC_SITE_URL", type: "plain_text", text: production ? "https://vanesch.uk" : QA.site },
      { name: "EXISTING_JSON", type: "json", json: { nested: [true, "private-existing-value"] } },
      ...["CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL", "DAILY_SUMMARY_RECIPIENT"].map(name => ({ name, type: "plain_text", text: "private-existing-value@example.invalid" })),
      ...["ADVISOR_ALLOWED_EMAILS", "CLIENT_DIAGNOSTIC_OTP_SECRET", "INVITE_RATE_LIMIT_SALT", "CRON_SECRET", "RESEND_API_KEY"].map(name => ({ name, type: "secret_text" })),
      ...(production ? [
        { name: "NEXT_PUBLIC_SUPABASE_URL", type: "plain_text", text: "https://synthetic.supabase.co" },
        { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", type: "plain_text", text: "synthetic-anon-key" },
        { name: "SUPABASE_SERVICE_ROLE_KEY", type: "secret_text" },
      ] : []),
    ];
    const runtime = { compatibility_date: "2026-03-01", compatibility_flags: ["nodejs_compat"], usage_model: "standard", limits: { cpu_ms: 30000 },
      exports: { default: { type: "worker", state: "created" } } };
    const annotations = { "workers/message": "accepted-code", "workers/tag": "accepted", "workers/commit_sha": "e".repeat(40) };
    const betaBindings = asBeta(bindings);
    const beta = { id, number: production ? 50 : 30, created_on: "2026-11-20T19:00:00Z", urls: ["https://synthetic-version.example.invalid"],
      author_email: "private-author@example.invalid", source: "wrangler", startup_time_ms: 50,
      annotations: clone(annotations), bindings: betaBindings, env: envMap(betaBindings),
      main_module: "worker.js", modules: [
        { name: "worker.js", content_type: "application/javascript+module", content_base64: Buffer.from("export default { fetch() { return new Response('private-existing-module'); } }").toString("base64") },
        { name: "worker.js.map", content_type: "application/source-map", content_base64: Buffer.from('{"version":3,"sources":[]}').toString("base64") },
      ], assets: { config: { run_worker_first: true, not_found_handling: "none" }, jwt: "synthetic-private-assets-identity" },
      ...clone(runtime), cache_options: { enabled: false, cross_version_cache: false },
      exports: { default: { type: "worker", state: "created" } }, package_dependencies: [{ name: "next", installedVersion: "15.0.0", packageJsonVersion: "^15" }] };
    const legacy = { id, number: beta.number, metadata: { created_on: beta.created_on, source: "wrangler", hasPreview: false }, annotations: clone(annotations),
      resources: { bindings: clone(bindings), script: { etag: "synthetic-identical-code-etag", handlers: ["fetch"], named_handlers: [], last_deployed_from: "wrangler" }, script_runtime: clone(runtime) },
      cache_options: clone(beta.cache_options) };
    return { target, active: id, order: [id], deployment: production ? "66666666-6666-4666-8666-666666666666" : "77777777-7777-4777-8777-777777777777",
      versions: new Map([[id, { beta, legacy }]]),
      settings: { bindings, annotations, tags: production ? ["cf:service=fractional-hr-site"] : ["cf:service=fractional-hr-site", "cf:environment=qa"],
        observability: { logs: { enabled: true } }, assets: { config: clone(beta.assets.config) } },
      schedules: { schedules: [] }, subdomain: { enabled: true, previews_enabled: false } };
  }
  const prod = worker(PRODUCTION, PROD), qa = worker(QA, QA_ID);
  const state = { prod, qa, calls: [], evidence: [], patches: 0, activations: 0, accessReads: 0,
    beforeReply: null, afterPatch: null, afterActivation: null, failPatch: false, failActivation: false, failHealth: false, redirectHealth: false };
  function updateBindings(target, entries, versionId = target.active) {
    if (versionId === target.order[0]) target.settings.bindings = clone(entries);
    const entry = target.versions.get(versionId);
    entry.legacy.resources.bindings = clone(entries);
    entry.beta.bindings = asBeta(entries);
    entry.beta.env = envMap(entry.beta.bindings);
  }
  async function fetchImpl(input, options = {}) {
    const url = new URL(String(input)), method = options.method ?? "GET";
    state.calls.push({ origin: url.origin, path: url.pathname, search: url.search, method, ...(options.body ? { body: JSON.parse(options.body) } : {}) });
    if (url.origin !== "https://api.cloudflare.com") {
      assert.ok(["vanesch.uk", "www.vanesch.uk"].includes(url.hostname));
      assert.equal(url.pathname, "/api/health"); assert.equal(method, "GET"); assert.equal(options.headers, undefined);
      if (state.redirectHealth && url.hostname === "www.vanesch.uk") return new Response(null, { status: 301, headers: { location: "https://vanesch.uk/api/health" } });
      return Response.json({ status: "ok", d1: "connected", supabase: state.failHealth ? "connected" : "not_required" });
    }
    assert.equal(options.redirect, "error"); assert.equal(options.headers.Authorization, "Bearer synthetic-test-token");
    const prefix = `/client/v4/accounts/${ACCOUNT}`;
    assert.ok(url.pathname.startsWith(prefix));
    const path = url.pathname.slice(prefix.length), match = /^\/workers\/(scripts|workers)\/(fractional-hr-site(?:-qa)?)\/(.*)$/.exec(path);
    assert.ok(match, "Only fixed Worker endpoints are allowed");
    const target = match[2] === PRODUCTION.worker ? prod : qa, resource = match[3];
    let result;
    if (method === "PATCH") {
      assert.equal(match[1], "workers"); assert.equal(target, prod); assert.equal(resource, "versions/latest"); assert.equal(url.search, "");
      assert.equal(options.headers["Content-Type"], "application/merge-patch+json");
      state.patches++;
      if (state.failPatch) throw new Error("sensitive provider failure synthetic-test-token private-existing-value");
      const body = JSON.parse(options.body), base = clone(prod.versions.get(prod.order[0]));
      assert.deepEqual(Object.keys(body).sort(), ["annotations", "env"]);
      assert.ok(Object.values(body.env).every(value => value === null));
      const removed = Object.keys(body.env), nextBindings = base.legacy.resources.bindings.filter(item => !removed.includes(item.name));
      base.beta.id = CANDIDATE; base.legacy.id = CANDIDATE; base.beta.number++; base.legacy.number++;
      base.beta.created_on = "2026-11-20T20:00:00Z"; base.beta.source = "api"; base.beta.urls = ["https://new-version.example.invalid"];
      base.beta.annotations = { ...base.beta.annotations, ...body.annotations, "workers/triggered_by": "secret" };
      base.legacy.annotations = clone(base.beta.annotations);
      prod.versions.set(CANDIDATE, base); prod.order.unshift(CANDIDATE); updateBindings(prod, nextBindings, CANDIDATE);
      prod.settings.annotations = clone(base.beta.annotations);
      await state.afterPatch?.(); result = { id: CANDIDATE };
    } else if (method === "POST") {
      assert.equal(match[1], "scripts"); assert.equal(target, prod); assert.equal(resource, "deployments"); assert.equal(url.search, "");
      assert.deepEqual(JSON.parse(options.body).versions, [{ version_id: CANDIDATE, percentage: 100 }]);
      state.activations++;
      if (state.failActivation) throw new Error("sensitive provider error synthetic-test-token private-existing-value");
      prod.active = CANDIDATE; prod.deployment = "88888888-8888-4888-8888-888888888888";
      prod.settings.bindings = clone(prod.versions.get(CANDIDATE).legacy.resources.bindings);
      prod.settings.annotations = clone(prod.versions.get(CANDIDATE).beta.annotations);
      await state.afterActivation?.(); result = { id: prod.deployment };
    } else {
      assert.equal(method, "GET");
      if (match[1] === "workers") {
        assert.equal(url.searchParams.get("include"), "modules,sourcemaps");
        result = clone(target.versions.get(resource.slice("versions/".length))?.beta);
      } else if (resource === "settings") result = clone(target.settings);
      else if (resource === "secrets") result = target.settings.bindings.filter(item => item.type.startsWith("secret_")).map(({ name, type }) => ({ name, type }));
      else if (resource === "schedules") result = clone(target.schedules);
      else if (resource === "subdomain") result = clone(target.subdomain);
      else if (resource === "deployments") result = { deployments: [{ id: target.deployment, versions: [{ version_id: target.active, percentage: 100 }] }] };
      else if (resource === "versions") result = { items: target.order.map(id => ({ id })) };
      else if (resource.startsWith("versions/")) result = clone(target.versions.get(resource.slice("versions/".length))?.legacy);
      else assert.fail("Unexpected metadata read");
    }
    const override = state.beforeReply?.({ target, family: match[1], resource, method, result });
    return override ?? Response.json({ success: true, result });
  }
  const inputs = { env, accepted, fetchImpl, inspectAccess: async () => { state.accessReads++; return clone(access); }, now: NOW };
  const onEvidence = report => state.evidence.push(clone(report));
  return { env, accepted, access, inputs, state, updateBindings,
    prepare: () => prepareProductionBindingCleanup(inputs),
    stage: checkpoint => createProductionBindingCleanupVersion({ ...inputs, checkpoint, onEvidence }),
    activate: (checkpoint, staged) => activateProductionBindingCleanup({ ...inputs, checkpoint, staged, onEvidence }) };
}

test("cleanup preparation is read-only, pins complete state, and returns only sanitized evidence", async () => {
  const f = fixture(); f.state.redirectHealth = true;
  const prepared = await f.prepare();
  assert.deepEqual(prepared.removeBindings, LEGACY_SUPABASE_BINDINGS);
  assert.equal(prepared.production.id, PROD); assert.equal(prepared.qa.id, QA_ID);
  assert.equal(mutations(f.state).length, 0);
  for (const forbidden of ["private-existing-value", "synthetic-test-token", "synthetic-private-assets-identity", "private-existing-module", "private-author", AUD])
    assert.ok(!JSON.stringify(prepared).includes(forbidden));
});

test("cleanup verifies a multi-megabyte module without regexp stack exhaustion", async () => {
  const f = fixture();
  f.state.prod.versions.get(PROD).beta.modules[0].content_base64 = Buffer.alloc(5_000_000, 97).toString("base64");
  const checkpoint = await f.prepare();
  assert.match(checkpoint.production.codeFingerprint, /^[a-f0-9]{64}$/);
  assert.ok(JSON.stringify(checkpoint).length < 10000);
  assert.equal(mutations(f.state).length, 0);
});

test("staging performs one narrowly scoped inactive PATCH; activation is a separate verified call", async () => {
  const f = fixture(), checkpoint = await f.prepare(), initialQa = hash(f.state.qa.settings);
  const staged = await f.stage(checkpoint);
  assert.equal(f.state.prod.active, PROD); assert.equal(f.state.activations, 0);
  assert.ok(f.state.prod.versions.get(PROD).legacy.resources.bindings.some(item => item.name === "SUPABASE_SERVICE_ROLE_KEY"),
    "The immutable serving version retains its original bindings until activation");
  assert.ok(!f.state.prod.settings.bindings.some(item => LEGACY_SUPABASE_BINDINGS.includes(item.name)),
    "Settings already describe the known inactive cleanup candidate");
  assert.deepEqual(mutations(f.state).map(call => call.method), ["PATCH"]);
  assert.deepEqual(mutations(f.state)[0].body.env, Object.fromEntries(LEGACY_SUPABASE_BINDINGS.map(name => [name, null])));
  const report = await f.activate(checkpoint, staged);
  assert.equal(f.state.prod.active, CANDIDATE); assert.equal(f.state.patches, 1); assert.equal(f.state.activations, 1);
  assert.equal(hash(f.state.qa.settings), initialQa);
  assert.equal(report.stage, "cleanup_verified"); assert.equal(report.previousProductionVersion, PROD);
  assert.equal(report.previousVersionUsesSupabaseAuth, false); assert.equal(report.rollbackNeverForcedAutomatically, true);
  assert.ok(f.state.prod.versions.has(PROD), "The exact prior Access/D1 version remains available");
  assert.deepEqual(f.state.evidence.map(item => item.stage), ["cleanup_patch_requested_outcome_unknown", "cleanup_uploaded_not_verified",
    "cleanup_verified_not_activated", "cleanup_activation_requested_outcome_unknown", "cleanup_activated_verification_pending", "cleanup_verified"]);
  assert.ok(mutations(f.state).every(call => !call.search));
});

test("stale active settings or secret inventory cannot masquerade as the known inactive candidate", async () => {
  for (const stale of ["settings", "secrets"]) {
    const f = fixture(), checkpoint = await f.prepare();
    f.state.afterPatch = () => {
      if (stale === "settings") f.state.prod.settings.bindings = clone(f.state.prod.versions.get(PROD).legacy.resources.bindings);
      else f.state.beforeReply = ({ target, resource, result }) => {
        if (target === f.state.prod && resource === "secrets") return Response.json({ success: true,
          result: [...result, { name: "SUPABASE_SERVICE_ROLE_KEY", type: "secret_text" }] });
      };
    };
    await assert.rejects(f.stage(checkpoint), /known latest/);
    assert.equal(f.state.patches, 1); assert.equal(f.state.activations, 0); assert.equal(f.state.prod.active, PROD);
    assert.equal(f.state.evidence.at(-1).stage, "cleanup_uploaded_not_verified");
  }
});

test("candidate settings cannot hide an unknown latest upload or drift in the still-serving version", async () => {
  for (const change of [
    f => { f.state.prod.order.unshift(OTHER); },
    f => { f.state.prod.order.splice(1, 0, OTHER); },
    f => { f.updateBindings(f.state.prod, f.state.prod.versions.get(PROD).legacy.resources.bindings.filter(item => item.name !== "RESEND_API_KEY"), PROD); },
    f => { f.state.prod.versions.get(PROD).beta.modules[0].content_base64 = Buffer.from("changed serving code").toString("base64"); },
  ]) {
    const f = fixture(), checkpoint = await f.prepare(), staged = await f.stage(checkpoint);
    change(f);
    await assert.rejects(f.activate(checkpoint, staged));
    assert.equal(f.state.activations, 0); assert.equal(f.state.prod.active, PROD);
  }
});

test("staging removes only known bindings actually present and preserves all others", async () => {
  const f = fixture();
  f.updateBindings(f.state.prod, f.state.prod.settings.bindings.filter(item => item.name !== "NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  const checkpoint = await f.prepare(); await f.stage(checkpoint);
  assert.deepEqual(Object.keys(mutations(f.state)[0].body.env), ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  assert.equal(f.state.activations, 0);
});

test("already-clean or unreviewed Supabase binding states never create a version", async () => {
  for (const extra of [false, true]) {
    const f = fixture();
    const entries = extra ? [...f.state.prod.settings.bindings, { name: "SUPABASE_UNREVIEWED", type: "secret_text" }] :
      f.state.prod.settings.bindings.filter(item => !LEGACY_SUPABASE_BINDINGS.includes(item.name));
    f.updateBindings(f.state.prod, entries);
    await assert.rejects(f.prepare(), extra ? /unreviewed Supabase/ : /No known Supabase/);
    assert.equal(mutations(f.state).length, 0);
  }
});

test("accepted-production proof and fixed-context guards reject before any network operation", () => {
  for (const mutate of [
    f => { f.accepted.advisorFlowVerified = false; }, f => { f.accepted.healthCheckD1WriteReadVerified = false; },
    f => { f.accepted.acceptedAt = new Date(NOW - 86400001).toISOString(); },
    f => { f.accepted.qaVersionId = PROD; }, f => { f.env.GITHUB_REPOSITORY = "other/repo"; },
    f => { f.env.CLOUDFLARE_ACCOUNT_ID = "other"; }, f => { f.env.GITHUB_REF = "refs/heads/main"; },
    f => { f.env.CLOUDFLARE_ENV = "qa"; }, f => { f.env.SUPABASE_SERVICE_ROLE_KEY = "unexpected"; },
    f => { f.inputs.fetchImpl = undefined; },
  ]) {
    const f = fixture(); mutate(f); assert.throws(() => validateCleanupContext(f.inputs)); assert.equal(f.state.calls.length, 0);
  }
});

test("unavailable or unsupported provider metadata fails before the first mutation", async () => {
  for (const mutate of [
    v => { delete v.beta.assets.jwt; }, v => { delete v.beta.assets; }, v => { delete v.beta.modules; },
    v => { v.beta.unmapped_provider_setting = true; }, v => { v.legacy.resources.unmapped = true; },
    v => { v.legacy.metadata.unmapped = true; },
    v => { v.beta.modules[0].content_base64 = "invalid?"; },
    v => { v.beta.modules[0].content_base64 = "AA=A"; },
    v => { v.beta.modules[0].content_base64 = "AAA"; },
    v => { v.beta.assets.new_identity = "unknown"; },
    v => { v.beta.env.DB.database_id = QA.database; },
    v => { v.beta.bindings[0].id = QA.database; },
    v => { v.beta.bindings.find(item => item.type === "secret_text").text = "provider-must-not-return-secrets"; },
  ]) {
    const f = fixture(); mutate(f.state.prod.versions.get(PROD));
    await assert.rejects(f.prepare()); assert.equal(mutations(f.state).length, 0);
  }
});

test("production/QA resource identity, Access, and health must remain accepted", async () => {
  for (const mutate of [
    f => { f.updateBindings(f.state.prod, f.state.prod.settings.bindings.map(item => item.name === "DB" ? { ...item, id: QA.database } : item)); },
    f => { f.updateBindings(f.state.qa, f.state.qa.settings.bindings.map(item => item.name === MODES[0] ? { ...item, text: "off" } : item)); },
    f => { f.access.applicationFingerprint = "f".repeat(64); }, f => { f.state.failHealth = true; },
    f => { f.state.prod.order.unshift(OTHER); }, f => { f.state.qa.order.unshift(OTHER); },
    f => { f.updateBindings(f.state.prod, f.state.prod.settings.bindings.map(item => item.name === "NEXT_PUBLIC_SUPABASE_URL" ?
      { name: item.name, type: "service", service: "unrelated-resource" } : item)); },
  ]) {
    const f = fixture(); mutate(f); await assert.rejects(f.prepare()); assert.equal(mutations(f.state).length, 0);
  }
});

test("a changed lease or tampered removal plan stops before PATCH", async () => {
  for (const mutate of [
    (f, p) => { p.removeBindings.push("RESEND_API_KEY"); },
    (f, p) => { p.removeBindings.pop(); },
    (f, p) => { p.preparedAt = new Date(NOW - 3600001).toISOString(); },
    f => { f.state.prod.settings.observability.logs.enabled = false; },
    f => { f.state.qa.subdomain.previews_enabled = true; },
    f => { f.state.prod.versions.get(PROD).beta.modules[0].content_base64 = Buffer.from("changed code").toString("base64"); },
  ]) {
    const f = fixture(), p = await f.prepare(); mutate(f, p);
    await assert.rejects(f.stage(p)); assert.equal(mutations(f.state).length, 0);
  }
});

test("candidate drift in code, assets, runtime, bindings, annotations, sequence or QA blocks activation", async () => {
  for (const mutate of [
    (f, v) => { v.beta.modules[0].content_base64 = Buffer.from("changed code").toString("base64"); },
    (f, v) => { v.beta.assets.jwt = "changed-asset-set"; },
    (f, v) => { v.beta.assets.config.run_worker_first = false; },
    (f, v) => { v.beta.compatibility_date = "2026-04-01"; v.legacy.resources.script_runtime.compatibility_date = "2026-04-01"; },
    (f, v) => { v.beta.exports.default.cache = { enabled: true }; },
    (f, v) => { v.legacy.metadata.hasPreview = true; },
    (f, v) => { v.legacy.resources.script.named_handlers = [{ name: "UnexpectedEntrypoint", handlers: ["fetch"] }]; },
    (f, v) => { v.beta.annotations["workers/commit_sha"] = "f".repeat(40); },
    (f, v) => { v.legacy.resources.script.etag = "unexpected-code-etag"; },
    (f, v) => { f.updateBindings(f.state.prod, v.legacy.resources.bindings.filter(item => item.name !== "RESEND_API_KEY"), CANDIDATE); },
    (f, v) => { f.updateBindings(f.state.prod, [...v.legacy.resources.bindings, { name: "SUPABASE_SERVICE_ROLE_KEY", type: "secret_text" }], CANDIDATE); },
    (f, v) => { v.beta.number++; v.legacy.number++; },
    f => { f.state.prod.order.splice(1, 0, OTHER); },
    f => { f.state.qa.settings.tags.push("unrelated-change"); },
    f => { f.state.prod.settings.assets.config.run_worker_first = false; },
  ]) {
    const f = fixture(), p = await f.prepare(); f.state.afterPatch = () => mutate(f, f.state.prod.versions.get(CANDIDATE));
    await assert.rejects(f.stage(p)); assert.equal(f.state.patches, 1); assert.equal(f.state.activations, 0); assert.equal(f.state.prod.active, PROD);
  }
});

test("the separately staged candidate cannot bypass activation-time drift and freshness checks", async () => {
  for (const mutate of [
    (f, p, s) => { s.stagedAt = new Date(NOW - 3600001).toISOString(); },
    (f, p, s) => { s.candidateVersionId = OTHER; },
    f => { f.state.prod.order.unshift(OTHER); },
    f => { f.state.prod.versions.get(CANDIDATE).beta.modules[0].content_base64 = Buffer.from("changed after staging").toString("base64"); },
    f => { f.state.qa.schedules.schedules.push({ cron: "0 1 * * *" }); },
    f => { f.access.identityPolicyVerified = false; },
  ]) {
    const f = fixture(), p = await f.prepare(), s = await f.stage(p); mutate(f, p, s);
    await assert.rejects(f.activate(p, s)); assert.equal(f.state.activations, 0);
  }
});

test("PATCH and activation failures never retry or expose raw provider details", async () => {
  for (const phase of ["patch", "activation"]) {
    const f = fixture(), p = await f.prepare();
    let action;
    if (phase === "patch") { f.state.failPatch = true; action = () => f.stage(p); }
    else { const s = await f.stage(p); f.state.failActivation = true; action = () => f.activate(p, s); }
    const error = await action().catch(error => error);
    assert.match(error.message, /failed or timed out/);
    assert.ok(!/synthetic-test-token|private-existing-value/.test(error.message));
    assert.equal(f.state.patches, 1); assert.equal(f.state.activations, phase === "activation" ? 1 : 0);
    assert.match(f.state.evidence.at(-1).stage, /requested_outcome_unknown/);
  }
});

test("failure to record recovery evidence prevents the next mutation", async () => {
  const f = fixture(), p = await f.prepare();
  await assert.rejects(createProductionBindingCleanupVersion({ ...f.inputs, checkpoint: p,
    onEvidence: () => { throw new Error("synthetic-test-token"); } }), /Recovery evidence could not/);
  assert.equal(f.state.patches, 0);
});

test("async evidence callbacks cannot expand the removal set or replace the validated version lease", async () => {
  const f = fixture(), p = await f.prepare();
  const staged = await createProductionBindingCleanupVersion({ ...f.inputs, checkpoint: p, onEvidence: report => {
    f.state.evidence.push(clone(report));
    p.removeBindings.push("DB", "RESEND_API_KEY");
    f.accepted.productionVersionId = OTHER;
    f.env.CLOUDFLARE_API_TOKEN = "changed-after-validation";
  } });
  assert.equal(staged.candidateVersionId, CANDIDATE);
  assert.deepEqual(Object.keys(mutations(f.state)[0].body.env), LEGACY_SUPABASE_BINDINGS);
  assert.ok(f.state.evidence.every(report => report.previousProductionVersion === PROD));
  assert.equal(f.state.prod.active, PROD);
});

test("post-activation faults remain explicit verification-pending outcomes without automatic rollback", async () => {
  for (const mutate of [
    f => { f.state.failHealth = true; },
    f => { f.state.qa.settings.observability.logs.enabled = false; },
    f => { f.state.prod.versions.get(CANDIDATE).beta.assets.jwt = "changed-after-activation"; },
  ]) {
    const f = fixture(), p = await f.prepare(), s = await f.stage(p); f.state.afterActivation = () => mutate(f);
    await assert.rejects(f.activate(p, s));
    assert.equal(f.state.prod.active, CANDIDATE); assert.equal(f.state.activations, 1);
    assert.equal(f.state.evidence.at(-1).stage, "cleanup_activated_verification_pending");
    assert.deepEqual(mutations(f.state).map(call => call.method), ["PATCH", "POST"]);
  }
});

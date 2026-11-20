import test from "node:test";
import assert from "node:assert/strict";
import {
  ACCOUNT, QA, PRODUCTION, REQUEST_PATH, CONFIG_PATH, prepareQaRelease, deployQaRelease,
  normalizeBindings, uploadArguments,
} from "../../scripts/security/qa-retirement-release.mjs";

const QA_VERSION = "11111111-2222-4333-8444-555555555555";
const PROD_VERSION = "22222222-2222-4333-8444-555555555555";
const CANDIDATE = "33333333-2222-4333-8444-555555555555";
const OTHER_VERSION = "44444444-2222-4333-8444-555555555555";
const QA_DEPLOYMENT = "55555555-2222-4333-8444-555555555555";
const PROD_DEPLOYMENT = "66666666-2222-4333-8444-555555555555";
const NEW_DEPLOYMENT = "77777777-2222-4333-8444-555555555555";
const NOW = Date.parse("2026-11-20T15:00:00Z");
const SOURCE = "1".repeat(40);
const HEAD = "2".repeat(40);
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;
const request = {
  operation: "deploy-reviewed-retirement-candidate-to-qa", requestId: "20261120-release-one",
  requestedAt: new Date(NOW).toISOString(), reviewedCommit: SOURCE,
  expectedQaVersionId: QA_VERSION, expectedProductionVersionId: PROD_VERSION,
};
const env = {
  GITHUB_REPOSITORY: "gvanesch/fractional-hr-site", GITHUB_REF: "refs/heads/chore/supabase-retirement-2026-11",
  GITHUB_SHA: HEAD, CLOUDFLARE_ACCOUNT_ID: ACCOUNT, CLOUDFLARE_API_TOKEN: "synthetic-api-token-not-for-logs",
};
const git = { head: HEAD, parent: SOURCE, changedPaths: [REQUEST_PATH] };
const runtime = { compatibility_date: "2025-05-05", compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"] };

function harness() {
  const secretNames = ["ADVISOR_ALLOWED_EMAILS", "CLOUDFLARE_ACCESS_AUD", "CLOUDFLARE_ACCESS_TEAM_DOMAIN", "CLIENT_DIAGNOSTIC_OTP_SECRET", "INVITE_RATE_LIMIT_SALT", "CRON_SECRET", "RESEND_API_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
  const qaVars = {
    ...Object.fromEntries(["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"].map(name => [`D1_${name}_MODE`, "d1"])),
    ADVISOR_AUTH_MODE: "cloudflare_access", NEXT_PUBLIC_APP_ENV: "qa", NEXT_PUBLIC_SITE_URL: QA.site,
    BASELINE_ENABLED: "true", BASELINE_MAIL_MODE: "preview", BASELINE_QA_EMAIL_TESTS: "greg-only",
    CONTACT_FROM_EMAIL: "qa@vanesch.uk", CONTACT_TO_EMAIL: "greg@vanesch.uk", DAILY_SUMMARY_RECIPIENT: "greg@vanesch.uk",
    EXISTING_EXTRA_VARIABLE: "preserve-me", NEXT_PUBLIC_SUPABASE_URL: "https://retired-test.supabase.co",
  };
  const qaBindings = [
    { name: "DB", type: "d1", id: QA.database },
    { name: "ASSETS", type: "assets" },
    { name: "WORKER_SELF_REFERENCE", type: "service", service: QA.worker },
    ...Object.entries(qaVars).map(([name, text]) => ({ name, type: "plain_text", text })),
    ...secretNames.map(name => ({ name, type: "secret_text" })),
    { name: "EXISTING_JSON", type: "json", json: { preserve: true } },
  ];
  const prodBindings = [
    { name: "DB", type: "d1", id: PRODUCTION.database },
    { name: "ASSETS", type: "assets" },
    { name: "WORKER_SELF_REFERENCE", type: "service", service: PRODUCTION.worker },
    { name: "SUPABASE_SERVICE_ROLE_KEY", type: "secret_text" },
    { name: "ADVISOR_AUTH_MODE", type: "plain_text", text: "supabase" },
  ];
  const makeWorker = (version, deployment, bindings) => ({
    active: version, latest: version, deployment,
    settings: { bindings, ...structuredClone(runtime), tags: ["cf:service=fractional-hr-site", "cf:environment=qa"], observability: { enabled: true } },
    schedules: { schedules: [] }, subdomain: { enabled: true, previews_enabled: false },
    secrets: bindings.filter(b => b.type === "secret_text").map(b => ({ name: b.name, type: b.type })),
    versions: new Map([[version, { id: version, resources: { bindings: structuredClone(bindings), script_runtime: structuredClone(runtime) } }]]),
  });
  const state = {
    qa: makeWorker(QA_VERSION, QA_DEPLOYMENT, qaBindings), production: makeWorker(PROD_VERSION, PROD_DEPLOYMENT, prodBindings),
    calls: [], writes: [], uploads: [], evidence: [], healthy: true, publicStatus: 200,
    failDeploy: false, afterUpload: undefined,
  };
  const repositoryConfig = {
    name: PRODUCTION.worker, main: ".open-next/worker.js", keep_vars: true, ...structuredClone(runtime),
    d1_databases: [{ binding: "DB", database_id: PRODUCTION.database }],
    env: { qa: {
      vars: qaVars, services: [{ binding: "WORKER_SELF_REFERENCE", service: QA.worker }],
      assets: { directory: ".open-next/assets", binding: "ASSETS" },
      d1_databases: [{ binding: "DB", database_name: "vanesch-qa", database_id: QA.database }],
    } },
  };
  const cf = value => Response.json({ success: true, result: structuredClone(value) });
  async function fetchImpl(url, options = {}) {
    state.calls.push({ url, method: options.method ?? "GET" });
    assert.equal(options.redirect, "manual");
    assert.ok(options.signal);
    if (url.startsWith(API)) {
      assert.equal(options.headers.Authorization, `Bearer ${env.CLOUDFLARE_API_TOKEN}`);
      if (url === `${API}/d1/database/${QA.database}`) {
        assert.equal(options.method ?? "GET", "GET", "No D1 query or mutation is permitted");
        return cf({ uuid: QA.database, name: "vanesch-qa" });
      }
      const match = url.slice(API.length).match(/^\/workers\/scripts\/(fractional-hr-site(?:-qa)?)\/(.+)$/);
      assert.ok(match, "Only the two fixed Workers may be inspected");
      const worker = match[1] === QA.worker ? state.qa : state.production;
      const path = match[2];
      if (options.method === "POST") {
        assert.equal(match[1], QA.worker, "Production must never receive a write");
        assert.equal(path, "deployments", "No secret, settings, route or schedule writes are permitted");
        const body = JSON.parse(options.body);
        state.writes.push({ url, body });
        assert.deepEqual(body.versions, [{ version_id: CANDIDATE, percentage: 100 }]);
        assert.equal(body.strategy, "percentage");
        worker.active = CANDIDATE;
        worker.deployment = NEW_DEPLOYMENT;
        if (state.failDeploy) throw new Error(`Private provider error ${env.CLOUDFLARE_API_TOKEN}`);
        return cf({ id: NEW_DEPLOYMENT });
      }
      assert.equal(options.method ?? "GET", "GET");
      if (path === "settings") return cf(worker.settings);
      if (path === "secrets") return cf(worker.secrets);
      if (path === "schedules") return cf(worker.schedules);
      if (path === "subdomain") return cf(worker.subdomain);
      if (path === "deployments") return cf({ deployments: [{ id: worker.deployment, versions: [{ version_id: worker.active, percentage: 100 }] }] });
      if (path === "versions") return cf({ items: [{ id: worker.latest }] });
      if (path.startsWith("versions/")) return cf(worker.versions.get(path.slice(9)));
      assert.fail(`Unexpected Cloudflare path ${path}`);
    }
    assert.equal(options.headers?.Authorization, undefined, "Cloudflare API credential must never reach the public site");
    assert.ok(url.startsWith(QA.site), "No other public website may receive a request");
    assert.equal(options.method ?? "GET", "GET", "No forms, mail or record writes are permitted");
    if (url.endsWith("/api/health")) return Response.json({ status: state.healthy ? "ok" : "error", d1: "connected", supabase: "not_required" });
    if (url.endsWith("/advisor")) return new Response(null, { status: 302, headers: { location: "https://gregvanesch.cloudflareaccess.com/cdn-cgi/access/login/example" } });
    return new Response("<html>QA</html>", { status: state.publicStatus, headers: { "content-type": "text/html" } });
  }
  async function uploadImpl(args) {
    state.uploads.push(args);
    state.qa.latest = CANDIDATE;
    state.qa.versions.set(CANDIDATE, { id: CANDIDATE,
      annotations: { "workers/tag": args.tag, "workers/message": args.message },
      resources: { bindings: structuredClone(state.qa.settings.bindings), script_runtime: structuredClone(runtime) },
    });
    await state.afterUpload?.();
    return CANDIDATE;
  }
  const common = { request, env, git, fetchImpl, now: NOW };
  const prepare = overrides => prepareQaRelease({ ...common, repositoryConfig, ...overrides });
  const deploy = (prepared, overrides) => deployQaRelease({ ...common, ...prepared, uploadImpl,
    onEvidence: async evidence => state.evidence.push(evidence), ...overrides });
  return { state, repositoryConfig, prepare, deploy };
}

test("QA code-only release preserves resources and activates exactly one new QA version", async () => {
  const h = harness();
  const prepared = await h.prepare();
  assert.equal(h.state.writes.length, 0);
  assert.equal(h.state.uploads.length, 0);
  assert.equal(prepared.config.env.qa.name, QA.worker);
  assert.equal(prepared.config.d1_databases, undefined);
  assert.equal(prepared.config.env.qa.vars.NEXT_PUBLIC_SUPABASE_URL, undefined, "Build config must not inject a Supabase URL");
  const report = await h.deploy(prepared);
  assert.equal(report.stage, "verified");
  assert.equal(report.previousQaVersion, QA_VERSION, "Previous code version is retained for a controlled rollback");
  assert.equal(report.deployedQaVersion, CANDIDATE);
  assert.equal(h.state.uploads.length, 1);
  assert.equal(h.state.writes.length, 1);
  assert.equal(h.state.production.active, PROD_VERSION);
  assert.deepEqual(h.state.evidence.map(e => e.stage), ["uploaded_not_activated", "activation_requested_outcome_unknown", "activated_verification_pending", "verified"]);
  assert.doesNotMatch(JSON.stringify([report, prepared.checkpoint, h.state.evidence]), /synthetic-api-token-not-for-logs|preserve-me|retired-test/);
});

test("QA request rejects wrong account, ref, source changes, age and Supabase build credentials before network", async () => {
  for (const overrides of [
    { env: { ...env, CLOUDFLARE_ACCOUNT_ID: "other" } },
    { env: { ...env, GITHUB_REF: "refs/heads/main" } },
    { env: { ...env, GITHUB_REPOSITORY: "other/repo" } },
    { env: { ...env, GITHUB_SHA: SOURCE } },
    { env: { ...env, SUPABASE_SERVICE_ROLE_KEY: "should-not-build" } },
    { env: { ...env, NEXT_PUBLIC_SUPABASE_URL: "https://not-allowed.example" } },
    { git: { ...git, parent: "3".repeat(40) } },
    { git: { ...git, changedPaths: [REQUEST_PATH, "app/page.tsx"] } },
    { request: { ...request, operation: "deploy-production" } },
    { request: { ...request, expectedQaVersionId: "unknown" } },
    { request: { ...request, requestedAt: new Date(NOW - 86400001).toISOString() } },
    { request: { ...request, requestedAt: new Date(NOW + 1).toISOString() } },
  ]) {
    const h = harness();
    await assert.rejects(h.prepare(overrides));
    assert.equal(h.state.calls.length, 0);
    assert.equal(h.state.uploads.length, 0);
  }
});

test("Preflight refuses different live QA resources, email settings and unhandled bindings", async () => {
  for (const change of [
    h => { h.state.qa.settings.bindings.find(b => b.name === "DB").id = PRODUCTION.database; },
    h => { h.state.qa.settings.bindings.find(b => b.name === "CONTACT_TO_EMAIL").text = "elsewhere@example.invalid"; },
    h => { h.state.qa.settings.bindings.find(b => b.name === "ADVISOR_AUTH_MODE").text = "supabase"; },
    h => { h.state.qa.settings.bindings.find(b => b.name === "D1_CRM_PROSPECTS_MODE").text = "off"; },
    h => { h.state.qa.settings.bindings.push({ name: "UNREVIEWED_KV", type: "kv_namespace", namespace_id: "other" }); },
    h => { h.repositoryConfig.env.qa.routes = ["www.vanesch.uk/*"]; },
    h => { h.repositoryConfig.env.qa.d1_databases[0].database_id = PRODUCTION.database; },
  ]) {
    const h = harness();
    change(h);
    h.state.qa.versions.get(QA_VERSION).resources.bindings = structuredClone(h.state.qa.settings.bindings);
    await assert.rejects(h.prepare());
    assert.equal(h.state.uploads.length, 0);
    assert.equal(h.state.writes.length, 0);
  }
});

test("Binding inheritance requires the latest QA upload to be the active reviewed version", async () => {
  const h = harness();
  h.state.qa.latest = OTHER_VERSION;
  await assert.rejects(h.prepare(), /undeployed Worker version/);
  assert.equal(h.state.writes.length, 0);
  const independent = harness();
  independent.state.production.latest = OTHER_VERSION;
  const prepared = await independent.prepare();
  await independent.deploy(prepared);
  assert.equal(independent.state.production.latest, OTHER_VERSION, "A stable staged production version is not touched or inherited by QA");
});

test("Preflight prevents Wrangler from changing service/environment grouping metadata", async () => {
  for (const tags of [[], ["cf:service=other", "cf:environment=qa"], ["cf:environment=qa", "cf:service=fractional-hr-site"]]) {
    const h = harness();
    h.state.qa.settings.tags = tags;
    await assert.rejects(h.prepare(), /grouping metadata would be changed/);
    assert.equal(h.state.uploads.length, 0);
    assert.equal(h.state.writes.length, 0);
  }
});

test("Lease changes after prepare stop before uploading code", async () => {
  for (const change of [
    h => { h.state.qa.latest = OTHER_VERSION; },
    h => { h.state.qa.deployment = NEW_DEPLOYMENT; },
    h => { h.state.production.settings.observability.enabled = false; },
    h => { h.state.qa.subdomain.previews_enabled = true; },
    h => { h.state.qa.schedules.schedules.push({ cron: "0 0 * * *" }); },
  ]) {
    const h = harness();
    const prepared = await h.prepare();
    change(h);
    await assert.rejects(h.deploy(prepared));
    assert.equal(h.state.uploads.length, 0);
    assert.equal(h.state.writes.length, 0);
  }
});

test("A second lease after upload prevents activation after concurrent changes", async () => {
  for (const change of [
    h => { h.state.qa.latest = OTHER_VERSION; },
    h => { h.state.qa.deployment = NEW_DEPLOYMENT; },
    h => { h.state.production.settings.observability.enabled = false; },
    h => { h.state.qa.subdomain.previews_enabled = true; },
  ]) {
    const h = harness();
    const prepared = await h.prepare();
    h.state.afterUpload = () => change(h);
    await assert.rejects(h.deploy(prepared));
    assert.equal(h.state.uploads.length, 1);
    assert.equal(h.state.writes.length, 0);
    assert.equal(h.state.qa.active, QA_VERSION);
  }
});

test("Uploaded version must preserve every binding, secret name and runtime setting", async () => {
  for (const change of [
    version => { version.resources.bindings = version.resources.bindings.filter(b => b.name !== "CRON_SECRET"); },
    version => { version.resources.bindings.find(b => b.name === "DB").id = PRODUCTION.database; },
    version => { version.resources.bindings.find(b => b.name === "EXISTING_EXTRA_VARIABLE").text = "changed"; },
    version => { version.resources.script_runtime.compatibility_date = "2026-11-20"; },
    version => { version.annotations["workers/tag"] = "different-candidate"; },
  ]) {
    const h = harness();
    const prepared = await h.prepare();
    h.state.afterUpload = () => change(h.state.qa.versions.get(CANDIDATE));
    await assert.rejects(h.deploy(prepared));
    assert.equal(h.state.writes.length, 0);
    assert.equal(h.state.qa.active, QA_VERSION);
  }
});

test("Stale or modified checkpoints stop before upload", async () => {
  for (const mutate of [
    p => { p.config.env.qa.d1_databases[0].database_id = PRODUCTION.database; },
    p => { p.checkpoint.preparedAt = new Date(NOW - 3600001).toISOString(); },
    p => { p.checkpoint.sourceCommit = SOURCE; },
  ]) {
    const h = harness();
    const prepared = await h.prepare();
    mutate(prepared);
    await assert.rejects(h.deploy(prepared), /checkpoint/);
    assert.equal(h.state.uploads.length, 0);
    assert.equal(h.state.writes.length, 0);
  }
});

test("The script does not repeat an uncertain uploader invocation or activation, or leak provider errors", async () => {
  const upload = harness();
  const prepared = await upload.prepare();
  await assert.rejects(upload.deploy(prepared, { uploadImpl: async () => { throw new Error(env.CLOUDFLARE_API_TOKEN); } }), error => {
    assert.match(error.message, /QA upload failed/);
    assert.doesNotMatch(error.message, /synthetic-api-token/);
    return true;
  });
  assert.equal(upload.state.writes.length, 0);
  const activation = harness();
  const p = await activation.prepare();
  activation.state.failDeploy = true;
  await assert.rejects(activation.deploy(p), error => {
    assert.match(error.message, /no automatic mutation retry/);
    assert.doesNotMatch(error.message, /synthetic-api-token/);
    return true;
  });
  assert.equal(activation.state.writes.length, 1);
  assert.equal(activation.state.evidence.at(-1).stage, "activation_requested_outcome_unknown");
});

test("A failed post-deployment health check retains exact recovery identifiers without blind rollback", async () => {
  const h = harness();
  const prepared = await h.prepare();
  h.state.afterUpload = () => { h.state.healthy = false; };
  await assert.rejects(h.deploy(prepared), /QA health/);
  assert.equal(h.state.writes.length, 1);
  assert.equal(h.state.evidence.at(-1).stage, "activated_verification_pending");
  assert.equal(h.state.evidence.at(-1).previousQaVersion, QA_VERSION);
  assert.equal(h.state.evidence.at(-1).deployedQaVersion, CANDIDATE);
});

test("A rerun after activation fails the original version lease without another upload", async () => {
  const h = harness();
  const prepared = await h.prepare();
  await h.deploy(prepared);
  await assert.rejects(h.deploy(prepared), /deployment differs/);
  assert.equal(h.state.uploads.length, 1);
  assert.equal(h.state.writes.length, 1);
});

test("Controlled upload hard-pins QA twice and rejects shell-sensitive metadata", () => {
  const args = uploadArguments({ configPath: CONFIG_PATH, tag: `retirement-${"a".repeat(24)}`, message: `qa-retirement-${HEAD}` });
  assert.deepEqual(args.slice(1, 8), ["upload", "--config", CONFIG_PATH, "--env", "qa", "--name", QA.worker]);
  assert.equal(args.includes("deploy"), false);
  for (const changes of [{ configPath: "wrangler.jsonc" }, { tag: "retirement-$(no)" }, { message: "bad; command" }])
    assert.throws(() => uploadArguments({ configPath: CONFIG_PATH, tag: `retirement-${"a".repeat(24)}`, message: `qa-retirement-${HEAD}`, ...changes }));
});

test("Binding normalization never retains secret values and refuses conflicting inventories", () => {
  assert.deepEqual(normalizeBindings([{ name: "EXISTING_SECRET", type: "secret_text", text: "never-retain" }]), [{ name: "EXISTING_SECRET", type: "secret_text" }]);
  assert.throws(() => normalizeBindings([{ name: "EXISTING_SECRET", type: "plain_text", text: "value" }], [{ name: "EXISTING_SECRET", type: "secret_text" }]), /disagree/);
});

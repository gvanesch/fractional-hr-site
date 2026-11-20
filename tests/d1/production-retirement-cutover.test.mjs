import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fingerprintBuiltWorker, runProductionCutover } from "../../scripts/security/production-retirement-cutover.mjs";
import { REQUEST_PATH, productionUploaderEnvironment } from "../../scripts/security/production-retirement-release.mjs";
import { ACCOUNT, fingerprint } from "../../scripts/security/qa-retirement-release.mjs";
import { MODES } from "../../scripts/security/supabase-retirement-readonly.mjs";

const NOW = Date.parse("2026-11-20T16:00:00Z");
const HEAD = "a".repeat(40), PARENT = "b".repeat(40);
const clone = value => structuredClone(value);
function fixture() {
  const request = { operation: "deploy-reviewed-retirement-candidate-to-production", requestId: "retirement-production-test-01",
    requestedAt: new Date(NOW - 1000).toISOString(), reviewedCommit: PARENT,
    expectedProductionVersionId: "11111111-1111-4111-8111-111111111111",
    expectedQaVersionId: "22222222-2222-4222-8222-222222222222", expectedAccessPlanFingerprint: "c".repeat(64) };
  const env = { GITHUB_REPOSITORY: "gvanesch/fractional-hr-site", GITHUB_REF: "refs/heads/chore/supabase-retirement-2026-11",
    GITHUB_SHA: HEAD, CLOUDFLARE_ACCOUNT_ID: ACCOUNT, CLOUDFLARE_API_TOKEN: "synthetic-worker-token",
    CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: "synthetic-access-token", NEXT_PUBLIC_APP_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://www.vanesch.uk", ADVISOR_AUTH_MODE: "cloudflare_access", ...Object.fromEntries(MODES.map(name => [name, "d1"])) };
  const git = { head: HEAD, parent: PARENT, changedPaths: [REQUEST_PATH] };
  const eligibility = { eligibleForReviewedAuthChange: true, productionVersionId: request.expectedProductionVersionId,
    qaVersionId: request.expectedQaVersionId, bindingFingerprint: "d".repeat(64) };
  const build = { fingerprint: "e".repeat(64), fileCount: 100, bytes: 1000 };
  const checkpoint = { kind: "production-access-checkpoint", requestId: request.requestId, applicationId: "33333333-3333-4333-8333-333333333333" };
  const proof = { privateFreshAudience: "not-a-checkpoint" };
  const state = { calls: [], evidence: [], creates: 0, deploys: 0, saved: null, buildReads: 0 };
  const inputs = { request, env, git, repositoryConfig: {}, now: NOW,
    preflight: { observedAt: new Date(NOW - 5000).toISOString(), sourceCommit: HEAD, requestFingerprint: fingerprint(request), eligibility },
    built: { sourceCommit: HEAD, requestFingerprint: fingerprint(request), build },
    getBuiltFingerprint: async () => { state.calls.push("build"); state.buildReads++; return clone(build); },
    eligibilityImpl: async () => { state.calls.push("lease"); return clone(eligibility); },
    createAccessImpl: async ({ verifyWorkerLease }) => { state.calls.push("create"); state.creates++; await verifyWorkerLease(); return { checkpoint: clone(checkpoint), proof: clone(proof) }; },
    saveAccessCheckpoint: async value => { state.calls.push("save"); state.saved = value; assert.deepEqual(value, checkpoint); },
    inspectAccessImpl: async ({ checkpoint: supplied }) => { state.calls.push("inspect"); assert.deepEqual(supplied, checkpoint); return clone(proof); },
    prepareImpl: async ({ inspectAccess }) => { state.calls.push("prepare"); assert.deepEqual(await inspectAccess(), proof); return { config: { reviewed: true }, checkpoint: { prepared: true } }; },
    writeConfig: async config => { state.calls.push("config"); assert.deepEqual(config, { reviewed: true }); },
    deployImpl: async ({ inspectAccess, config }) => { state.calls.push("deploy"); state.deploys++; assert.deepEqual(await inspectAccess(), proof); assert.equal(config.reviewed, true); return { passed: true }; },
    onEvidence: async value => { state.evidence.push(value); },
    fetchImpl: async () => { assert.fail("Orchestrator must use only its explicit cloud adapters"); },
  };
  return { inputs, state, build, eligibility, checkpoint };
}

test("cutover uses the verified build before Access, saves only the returned checkpoint and verifies Access again before deployment", async () => {
  const f = fixture();
  assert.deepEqual(await runProductionCutover(f.inputs), { passed: true });
  assert.deepEqual(f.state.calls, ["build", "lease", "create", "lease", "save", "prepare", "inspect", "config", "build", "deploy", "inspect"]);
  assert.equal(f.state.creates, 1); assert.equal(f.state.deploys, 1);
  assert.deepEqual(f.state.saved, f.checkpoint);
  assert.equal(f.state.evidence[0].buildFingerprint, f.build.fingerprint);
});

test("stale source, request, build or preflight stops before any Access write", async () => {
  for (const mutate of [
    f => { f.inputs.git.changedPaths.push("app/page.tsx"); },
    f => { f.inputs.preflight.observedAt = new Date(NOW - 3600001).toISOString(); },
    f => { f.inputs.preflight.observedAt = new Date(NOW + 1).toISOString(); },
    f => { f.inputs.preflight.sourceCommit = PARENT; },
    f => { f.inputs.preflight.requestFingerprint = "f".repeat(64); },
    f => { f.inputs.preflight.eligibility.eligibleForReviewedAuthChange = false; },
    f => { f.inputs.built.sourceCommit = PARENT; },
    f => { f.inputs.built.requestFingerprint = "f".repeat(64); },
    f => { f.inputs.getBuiltFingerprint = async () => ({ ...f.build, bytes: f.build.bytes + 1 }); },
    f => { f.inputs.env.NEXT_PUBLIC_SUPABASE_URL = "https://synthetic.invalid"; },
    f => { delete f.inputs.writeConfig; },
  ]) {
    const f = fixture(); mutate(f);
    await assert.rejects(runProductionCutover(f.inputs));
    assert.equal(f.state.creates, 0); assert.equal(f.state.deploys, 0);
  }
});

test("production or QA drift after the tokenless build stops before Access creation", async () => {
  const f = fixture();
  f.inputs.eligibilityImpl = async () => ({ ...f.eligibility, bindingFingerprint: "f".repeat(64) });
  await assert.rejects(runProductionCutover(f.inputs), /changed after/);
  assert.equal(f.state.creates, 0); assert.equal(f.state.deploys, 0);
});

test("build drift after Access creation prevents upload or activation while retaining reconciliation state", async () => {
  const f = fixture();
  f.inputs.getBuiltFingerprint = async () => (++f.state.buildReads === 1 ? clone(f.build) : { ...f.build, bytes: 999 });
  await assert.rejects(runProductionCutover(f.inputs), /changed after Access creation/);
  assert.equal(f.state.creates, 1); assert.equal(f.state.deploys, 0); assert.deepEqual(f.state.saved, f.checkpoint);
});

test("an uncertain Access mutation is attempted once and never followed by Worker deployment", async () => {
  const f = fixture();
  f.inputs.createAccessImpl = async () => { f.state.creates++; throw new Error("synthetic-uncertain-mutation"); };
  await assert.rejects(runProductionCutover(f.inputs), /synthetic-uncertain/);
  assert.equal(f.state.creates, 1); assert.equal(f.state.deploys, 0); assert.equal(f.state.saved, null);
});

test("fresh Access verification failure after creation prevents Worker deployment", async () => {
  const f = fixture();
  f.inputs.inspectAccessImpl = async () => { throw new Error("synthetic-policy-drift"); };
  await assert.rejects(runProductionCutover(f.inputs), /synthetic-policy-drift/);
  assert.equal(f.state.creates, 1); assert.equal(f.state.deploys, 0); assert.deepEqual(f.state.saved, f.checkpoint);
});

async function builtFixture(t) {
  const parent = await mkdtemp(join(tmpdir(), "retirement-build-")), root = join(parent, "build");
  t.after(() => rm(parent, { recursive: true, force: true }));
  await mkdir(join(root, "server-functions/default"), { recursive: true });
  await mkdir(join(root, "assets"), { recursive: true });
  await writeFile(join(root, "worker.js"), "export default {};");
  await writeFile(join(root, "server-functions/default/handler.mjs"),
    "export default [process.env.CLOUDFLARE_ACCESS_AUD, process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN, process.env.ADVISOR_AUTH_MODE];");
  await writeFile(join(root, "assets/index.html"), "synthetic asset");
  return { parent, root };
}

test("built Worker fingerprint covers code, assets and bounded internal links", async t => {
  const { root } = await builtFixture(t);
  const a = await fingerprintBuiltWorker(root);
  await symlink("assets", join(root, "asset-link"));
  const b = await fingerprintBuiltWorker(root);
  assert.notEqual(a.fingerprint, b.fingerprint); assert.equal(b.fileCount, 4);
  await writeFile(join(root, "assets/index.html"), "changed synthetic asset");
  const c = await fingerprintBuiltWorker(root);
  assert.notEqual(b.fingerprint, c.fingerprint);
  await writeFile(join(root, "worker.js"), "export default {changed:true};");
  assert.notEqual(c.fingerprint, (await fingerprintBuiltWorker(root)).fingerprint);
});

test("built Worker rejects external symlinks and incomplete or compile-time-only auth", async t => {
  const { parent, root } = await builtFixture(t);
  await writeFile(join(parent, "outside"), "synthetic external file");
  await symlink("../outside", join(root, "external-link"));
  await assert.rejects(fingerprintBuiltWorker(root), /outside its output directory/);
  await rm(join(root, "external-link"));
  await writeFile(join(root, "server-functions/default/handler.mjs"), "export default 'compiled-auth-values';");
  await assert.rejects(fingerprintBuiltWorker(root), /at runtime/);
  await rm(join(root, "worker.js"));
  await assert.rejects(fingerprintBuiltWorker(root), /complete built Worker/);
});

test("uploader receives the existing Worker credential and never the Access edit token", () => {
  const original = { CLOUDFLARE_API_TOKEN: "synthetic-worker", CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: "synthetic-access", PATH: "/synthetic/path" };
  const child = productionUploaderEnvironment(original);
  assert.equal(child.CLOUDFLARE_API_TOKEN, original.CLOUDFLARE_API_TOKEN);
  assert.equal(child.PATH, original.PATH);
  assert.equal(child.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN, undefined);
  assert.equal(child.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV, "false");
  assert.equal(original.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN, "synthetic-access");
});

test("production workflow builds first, serializes with existing releases and needs a request-only commit", async () => {
  const workflow = await readFile(new URL("../../.github/workflows/production-retirement-cutover.yml", import.meta.url), "utf8");
  assert.ok(workflow.includes("      - scripts/security/production-retirement-release-request.json"));
  assert.ok(!workflow.includes("workflow_dispatch"));
  assert.ok(workflow.includes("fetch-depth: 2"));
  assert.ok(workflow.includes("persist-credentials: false"));
  assert.ok(workflow.includes("group: vanesch-production-release"));
  assert.ok(workflow.includes("cancel-in-progress: false"));
  const build = workflow.indexOf("run: npx opennextjs-cloudflare build --config wrangler.jsonc");
  const pin = workflow.indexOf("run: node scripts/security/production-retirement-cutover.mjs capture-build");
  const apply = workflow.indexOf("run: node scripts/security/production-retirement-cutover.mjs apply");
  assert.ok(build > 0 && build < pin && pin < apply);
  assert.ok(!workflow.includes("SUPABASE"));
  assert.ok(!workflow.includes("path: production-retirement-access-checkpoint.private.json"));
});

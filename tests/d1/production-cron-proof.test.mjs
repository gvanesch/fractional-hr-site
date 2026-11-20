import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  REQUEST_PATH, REPORT_PATH, PRODUCTION_VERSION, PROOF_REQUEST_ID, ProductionCronProofError,
  validateProductionCronProofRequest, runProductionCronProof, productionCronProofFailure, readProductionCronProofGit,
} from "../../scripts/security/production-cron-proof.mjs";

const NOW = Date.parse("2026-11-20T22:00:00.000Z"), HEAD = "a".repeat(40), PARENT = "b".repeat(40);
const ACCOUNT = "73221f18acc676e4992c89fcbf2b2a8f";
const DEPLOYMENT = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const PRIVATE = "private-provider-response-not-for-output";
const API_CREDENTIAL = "synthetic-cloudflare-token";
const CRON_CREDENTIAL = "synthetic-cron-bearer";
const CF_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers/scripts/fractional-hr-site/deployments`;
const HEALTH_URL = "https://www.vanesch.uk/api/health";
const ADVISOR_URL = "https://www.vanesch.uk/api/advisor-daily-action-digest?dryRun=true";
const SUMMARY_URL = "https://www.vanesch.uk/api/client-diagnostic-daily-summary?dryRun=true";
const fails = code => error => error instanceof ProductionCronProofError && error.code === code;

function fixture() {
  const request = { operation: "verify-production-cron-dry-runs", requestId: PROOF_REQUEST_ID,
    requestedAt: new Date(NOW - 1000).toISOString(), reviewedCommit: PARENT, expectedProductionVersionId: PRODUCTION_VERSION };
  const env = { GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "push", GITHUB_RUN_ATTEMPT: "1",
    GITHUB_REPOSITORY: "gvanesch/fractional-hr-site", GITHUB_REF: "refs/heads/chore/supabase-retirement-2026-11",
    GITHUB_SHA: HEAD, CLOUDFLARE_ACCOUNT_ID: ACCOUNT, CLOUDFLARE_API_TOKEN: API_CREDENTIAL,
    DAILY_SUMMARY_ENDPOINT_SECRET: CRON_CREDENTIAL };
  const git = { head: HEAD, parents: [PARENT], clean: true, changedPaths: [REQUEST_PATH] };
  const state = { calls: [], evidence: [], posts: 0, readsSincePost: new Set(), deploymentId: DEPLOYMENT,
    activeVersion: PRODUCTION_VERSION, split: false, apiSuccess: true,
    health: { status: "ok", d1: "connected", supabase: "not_required" }, beforeFetch: null, postOverride: null,
    advisor: { success: true, dryRun: true, emailGenerated: true, overdueProspects: 1, dueTodayProspects: 2,
      nextSevenDaysProspects: 3, noNextActionProspects: 4, contactFormDiagnostics: 5, activeProjects: 6 },
    summary: { success: true, dryRun: true, emailGenerated: true, projectCount: 2 } };
  const fetchImpl = async (url, options) => {
    state.calls.push({ url, method: options.method });
    assert.equal(options.redirect, "error"); assert.ok(options.signal);
    assert.equal(options.body, undefined);
    const override = state.beforeFetch?.(url, options);
    if (override) return override;
    if (url === CF_URL) {
      assert.equal(options.method, "GET");
      assert.deepEqual(options.headers, { Authorization: `Bearer ${API_CREDENTIAL}` });
      state.readsSincePost.add("deployment");
      return Response.json({ success: state.apiSuccess, result: { deployments: [{ id: state.deploymentId,
        versions: state.split ? [{ version_id: state.activeVersion, percentage: 50 }, { version_id: OTHER, percentage: 50 }]
          : [{ version_id: state.activeVersion, percentage: 100 }] }] } });
    }
    if (url === HEALTH_URL) {
      assert.equal(options.method, "GET"); assert.equal(options.headers, undefined);
      state.readsSincePost.add("health"); return Response.json(state.health);
    }
    assert.ok([ADVISOR_URL, SUMMARY_URL].includes(url), "Only the two fixed no-send production URLs can be called");
    assert.equal(options.method, "POST");
    assert.deepEqual(options.headers, { Authorization: `Bearer ${CRON_CREDENTIAL}` });
    assert.equal(new URL(url).search, "?dryRun=true");
    assert.deepEqual([...state.readsSincePost].sort(), ["deployment", "health"], "Every POST has fresh preceding deployment and health reads");
    state.readsSincePost.clear(); state.posts++;
    return state.postOverride?.(url, options) ?? Response.json(url === ADVISOR_URL ? state.advisor : state.summary);
  };
  const onEvidence = async value => { state.evidence.push(structuredClone(value)); };
  const options = { request, env, git, now: NOW, fetchImpl, onEvidence };
  return { request, env, git, state, options, run: overrides => runProductionCronProof({ ...options, ...overrides }) };
}

test("Two fixed no-send handlers are verified once with fresh live leases and count-only output", async () => {
  const f = fixture(), result = await f.run();
  assert.equal(result.stage, "production_cron_proof_verified");
  assert.equal(result.success, true); assert.equal(result.dryRun, true);
  assert.equal(result.productionVersion, PRODUCTION_VERSION);
  assert.equal(result.emailsSent, false); assert.equal(result.databaseWrites, false);
  assert.equal(result.deploymentsChanged, false); assert.equal(result.schedulerConfigurationChanged, false);
  assert.equal(result.automaticRetryAllowed, false);
  assert.deepEqual(result.results.advisorDigest, { success: true, dryRun: true, emailGenerated: true,
    counts: { overdueProspects: 1, dueTodayProspects: 2, nextSevenDaysProspects: 3,
      noNextActionProspects: 4, contactFormDiagnostics: 5, activeProjects: 6 } });
  assert.deepEqual(result.results.clientDiagnosticSummary, { success: true, dryRun: true, emailGenerated: true, counts: { projectCount: 2 } });
  assert.equal(f.state.posts, 2);
  assert.equal(f.state.calls.filter(call => call.method === "GET").length, 6);
  assert.deepEqual(f.state.calls.filter(call => call.method === "POST").map(call => call.url), [ADVISOR_URL, SUMMARY_URL]);
  assert.doesNotMatch(JSON.stringify([result, f.state.evidence]), new RegExp(`${API_CREDENTIAL}|${CRON_CREDENTIAL}|${PRIVATE}`));
});

test("The no-active-project summary is a valid no-send result and its message is not published", async () => {
  const f = fixture(); f.state.summary = { success: true, dryRun: true, emailGenerated: false, projectCount: 0, message: PRIVATE };
  const result = await f.run();
  assert.deepEqual(result.results.clientDiagnosticSummary, { success: true, dryRun: true, emailGenerated: false, counts: { projectCount: 0 } });
  assert.doesNotMatch(JSON.stringify([result, f.state.evidence]), new RegExp(PRIVATE));
});

test("Request validation is token-free and requires exact context, identity, version and freshness", async () => {
  const plain = fixture(); delete plain.env.CLOUDFLARE_API_TOKEN; delete plain.env.DAILY_SUMMARY_ENDPOINT_SECRET;
  assert.doesNotThrow(() => validateProductionCronProofRequest(plain.request, plain.env, plain.git, NOW));
  for (const mutate of [
    f => { f.env.GITHUB_ACTIONS = "false"; }, f => { f.env.GITHUB_EVENT_NAME = "workflow_dispatch"; },
    f => { f.env.GITHUB_RUN_ATTEMPT = "2"; }, f => { f.env.GITHUB_REPOSITORY = "other/repo"; },
    f => { f.env.GITHUB_REF = "refs/heads/main"; }, f => { f.env.CLOUDFLARE_ACCOUNT_ID = "other"; },
    f => { f.request.operation = "send-cron-emails"; }, f => { f.request.requestId += "-retry"; },
    f => { f.request.expectedProductionVersionId = OTHER; }, f => { f.request.reviewedCommit = "unknown"; },
    f => { f.request.requestedAt = new Date(NOW - 86400001).toISOString(); },
    f => { f.request.requestedAt = new Date(NOW + 1).toISOString(); },
    f => { f.request.force = true; }, f => { f.request.url = "https://other.invalid"; },
    f => { delete f.request.reviewedCommit; },
  ]) {
    const f = fixture(); mutate(f); await assert.rejects(f.run(), ProductionCronProofError);
    assert.equal(f.state.calls.length, 0); assert.equal(f.state.posts, 0);
  }
});

test("Only a clean single-parent request-file change can reach a provider", async () => {
  for (const mutate of [
    f => { f.git.parents = [PARENT, HEAD]; }, f => { f.git.parents = []; }, f => { f.git.parents = [HEAD]; },
    f => { f.git.head = PARENT; }, f => { f.env.GITHUB_SHA = PARENT; }, f => { f.git.clean = false; },
    f => { f.git.changedPaths = []; }, f => { f.git.changedPaths = ["other.json"]; },
    f => { f.git.changedPaths.push("scripts/security/production-cron-proof.mjs"); },
  ]) {
    const f = fixture(); mutate(f);
    await assert.rejects(f.run(), fails("production_cron_requires_request_only_reviewed_parent"));
    assert.equal(f.state.calls.length, 0);
  }
});

test("Missing credentials or durable evidence writer stop before provider access", async () => {
  for (const name of ["CLOUDFLARE_API_TOKEN", "DAILY_SUMMARY_ENDPOINT_SECRET"]) for (const value of [undefined, " ", "bad\r\nheader"]) {
    const f = fixture(); f.env[name] = value;
    await assert.rejects(f.run(), fails("production_cron_credentials_missing"));
    assert.equal(f.state.calls.length, 0);
  }
  const f = fixture(); await assert.rejects(f.run({ onEvidence: undefined }), fails("production_cron_evidence_writer_required"));
  assert.equal(f.state.calls.length, 0);
});

test("Wrong, mixed or unavailable serving versions and non-independent health block every cron POST", async () => {
  for (const mutate of [
    f => { f.state.activeVersion = OTHER; }, f => { f.state.split = true; }, f => { f.state.deploymentId = "unknown"; },
    f => { f.state.apiSuccess = false; }, f => { f.state.health.supabase = "connected"; },
    f => { f.state.health.d1 = "error"; }, f => { f.state.health.status = "error"; },
    f => { f.state.beforeFetch = url => url === CF_URL ? Response.json({ success: true, result: {} }) : undefined; },
    f => { f.state.beforeFetch = url => url === HEALTH_URL ? new Response(PRIVATE, { status: 500 }) : undefined; },
  ]) {
    const f = fixture(); mutate(f); await assert.rejects(f.run(), ProductionCronProofError);
    assert.equal(f.state.posts, 0);
    assert.ok(!f.state.evidence.some(value => value.stage === "production_cron_proof_verified"));
  }
});

test("Changed deployment or health between handlers prevents the second dry-run POST", async () => {
  for (const mutate of [f => { f.state.deploymentId = OTHER; }, f => { f.state.activeVersion = OTHER; },
    f => { f.state.health.supabase = "connected"; }]) {
    const f = fixture(); f.state.postOverride = () => { mutate(f); return Response.json(f.state.advisor); };
    await assert.rejects(f.run(), ProductionCronProofError);
    assert.equal(f.state.posts, 1);
    assert.equal(f.state.calls.filter(call => call.url === SUMMARY_URL).length, 0);
  }
});

test("The final deployment check prevents a success claim if production changes after the second handler", async () => {
  const f = fixture(); f.state.postOverride = url => {
    if (url === SUMMARY_URL) { f.state.deploymentId = OTHER; return Response.json(f.state.summary); }
  };
  await assert.rejects(f.run(), fails("production_cron_deployment_changed"));
  assert.equal(f.state.posts, 2);
  assert.ok(!f.state.evidence.some(value => value.stage === "production_cron_proof_verified"));
});

test("Redirects, HTTP failures, invalid JSON and timeouts never retry or expose provider text", async () => {
  for (const response of [
    () => new Response(PRIVATE, { status: 302, headers: { location: "https://other.invalid/private" } }),
    () => new Response(PRIVATE, { status: 403 }), () => new Response(PRIVATE, { status: 500 }),
    () => new Response(PRIVATE, { status: 200 }),
    () => { throw new Error(`${PRIVATE} ${API_CREDENTIAL} ${CRON_CREDENTIAL}`); },
  ]) {
    const f = fixture(); f.state.postOverride = response;
    await assert.rejects(f.run(), error => {
      const report = productionCronProofFailure(error);
      assert.equal(report.postOutcomeUnknown, true);
      assert.doesNotMatch(JSON.stringify([report, error.message]), new RegExp(`${PRIVATE}|${API_CREDENTIAL}|${CRON_CREDENTIAL}`));
      return true;
    });
    assert.equal(f.state.posts, 1);
    assert.equal(f.state.evidence.at(-1).stage, "dry_run_requested_outcome_unknown");
    assert.equal(f.state.calls.filter(call => call.url === SUMMARY_URL).length, 0);
  }
});

test("Only complete successful dry-run count responses can be published", async () => {
  for (const mutate of [
    value => { value.success = false; }, value => { value.dryRun = false; }, value => { delete value.dryRun; },
    value => { value.emailGenerated = false; }, value => { value.overdueProspects = -1; },
    value => { value.dueTodayProspects = "1"; }, value => { value.activeProjects = Number.MAX_SAFE_INTEGER + 1; },
    value => { delete value.noNextActionProspects; }, value => { value.privateDebug = PRIVATE; },
  ]) {
    const f = fixture(); mutate(f.state.advisor);
    await assert.rejects(f.run(), error => error instanceof ProductionCronProofError && error.postOutcomeUnknown === true);
    assert.equal(f.state.posts, 1);
    assert.doesNotMatch(JSON.stringify(f.state.evidence), new RegExp(PRIVATE));
  }
  const f = fixture(); f.state.summary.emailGenerated = false;
  await assert.rejects(f.run(), fails("production_cron_email_generation_unverified"));
  assert.equal(f.state.posts, 2);
});

test("Failed evidence persistence stops before the next authenticated POST", async () => {
  for (const stage of ["checking_production_before_dry_runs", "dry_run_requested_outcome_unknown", "dry_run_verified"]) {
    const f = fixture();
    await assert.rejects(f.run({ onEvidence: async value => { if (value.stage === stage) throw new Error(PRIVATE); } }),
      fails("production_cron_evidence_persistence_failed"));
    assert.equal(f.state.posts, stage === "dry_run_verified" ? 1 : 0);
  }
});

test("Asynchronous evidence callbacks cannot change the already-validated request or credentials", async () => {
  const f = fixture(); const originalEvidence = f.options.onEvidence;
  const result = await f.run({ onEvidence: async value => {
    f.request.expectedProductionVersionId = OTHER; f.env.CLOUDFLARE_API_TOKEN = PRIVATE;
    f.env.DAILY_SUMMARY_ENDPOINT_SECRET = PRIVATE; f.git.head = PARENT;
    await originalEvidence(value);
  } });
  assert.equal(result.productionVersion, PRODUCTION_VERSION); assert.equal(result.sourceCommit, HEAD);
  assert.equal(f.state.posts, 2);
});

test("Git lineage and unexpected failures are sanitized", () => {
  const command = args => args[0] === "rev-list" ? `${HEAD} ${PARENT}` : args[0] === "status" ? "" : REQUEST_PATH;
  assert.deepEqual(readProductionCronProofGit(command), fixture().git);
  assert.throws(() => readProductionCronProofGit(() => { throw new Error(PRIVATE); }), fails("production_cron_git_history_unavailable"));
  assert.deepEqual(productionCronProofFailure(new Error(PRIVATE)),
    { code: "production_cron_unexpected_failure", httpStatus: null, postOutcomeUnknown: null });
});

test("The workflow is request-only, first-attempt, concurrency-locked and gives credentials only to the proof step", () => {
  const source = readFileSync(new URL("../../.github/workflows/production-cron-proof.yml", import.meta.url), "utf8");
  assert.ok(source.includes(`      - ${REQUEST_PATH}\n`));
  assert.equal((source.match(/      - scripts\//g) ?? []).length, 1);
  for (const value of ["group: vanesch-production-release", "cancel-in-progress: false", "github.run_attempt == 1",
    "github.event_name == 'push'", "persist-credentials: false", "fetch-depth: 2"]) assert.ok(source.includes(value));
  assert.ok(!/workflow_dispatch|schedule:|pull_request|wrangler|opennext|npm |force=|RETIREMENT_AUDIT_TOKEN|SUPABASE/.test(source));
  const [before, proofAndAfter] = source.split("      - name: Verify the live version and both existing no-send handlers\n");
  assert.ok(!before.includes("secrets."));
  assert.ok(before.includes("production-cron-proof.mjs validate")); assert.ok(before.includes("node --test"));
  const [proof, ...after] = proofAndAfter.split("      - name:");
  assert.equal((proof.match(/secrets\.CLOUDFLARE_API_TOKEN/g) ?? []).length, 1);
  assert.equal((proof.match(/secrets\.DAILY_SUMMARY_ENDPOINT_SECRET/g) ?? []).length, 1);
  assert.ok(proof.includes("production-cron-proof.mjs prove"));
  assert.ok(!after.join("\n").includes("secrets.")); assert.ok(after.join("\n").includes(`path: ${REPORT_PATH}`));
});

test("Importing the runner is inert", () => {
  const url = new URL("../../scripts/security/production-cron-proof.mjs", import.meta.url).href;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e",
    `globalThis.fetch = () => { throw new Error('unexpected network'); }; await import(${JSON.stringify(url)});`],
  { encoding: "utf8", env: { PATH: process.env.PATH } });
  assert.equal(result.status, 0, result.stderr); assert.equal(result.stdout, ""); assert.equal(result.stderr, "");
});

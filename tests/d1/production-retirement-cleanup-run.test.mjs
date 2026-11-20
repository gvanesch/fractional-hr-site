import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import {
  CLEANUP_REQUEST_PATH, CLEANUP_ACCEPTANCE_PATH, CLEANUP_UI_RECORD_PATH, CLEANUP_REQUEST_ID,
  EXPECTED_PRODUCTION_VERSION, EXPECTED_QA_VERSION, EXPECTED_ACCESS_APPLICATION_FINGERPRINT, EXPECTED_ACCESS_CHECKPOINT_FINGERPRINT,
  validateProductionCleanupInputs, verifyCleanupSourceHistory, readProductionCleanupGit, runProductionCleanup,
} from "../../scripts/security/production-retirement-cleanup-run.mjs";
import { UPLOAD_EVIDENCE_PATH } from "../../scripts/security/production-retirement-activate-existing.mjs";
import { ACCOUNT, fingerprint } from "../../scripts/security/qa-retirement-release.mjs";
import { EXISTING_NOTIFICATION_ROUTING } from "../../scripts/security/production-healthcheck-smoke.mjs";

const uploadReceipt = JSON.parse(await readFile(new URL(`../../${UPLOAD_EVIDENCE_PATH}`, import.meta.url), "utf8"));
const NOW = Date.parse("2026-11-20T22:00:00Z"), HEAD = "a".repeat(40), PARENT = "b".repeat(40), HEALTH_SOURCE = "c".repeat(40);
const CANDIDATE = "11111111-1111-4111-8111-111111111111", DEPLOYMENT = "22222222-2222-4222-8222-222222222222";
const UI_CHECKS = ["advisorHealthCheckReadback", "crmFlow", "projectSpaces", "baselineExport", "logout"];
const HEALTH_PATH = "scripts/security/production-healthcheck-smoke-request.json";
const clone = value => structuredClone(value);
const rawHash = value => createHash("sha256").update(value).digest("hex");

function fixture() {
  const observedAt = new Date(NOW - 2000).toISOString();
  // Synthetic test-only evidence. This never creates the real acceptance file.
  const uiRecord = "# Synthetic complete acceptance\n\n## Browser evidence\n\n" + UI_CHECKS.map(name =>
    `<!-- production-cleanup-check:${name}:passed:${EXPECTED_PRODUCTION_VERSION}:${observedAt} -->`).join("\n") + "\n";
  const healthRequest = { operation: "verify-healthcheck-on-production", requestId: "retirement-20261120-production-healthcheck-01",
    requestedAt: new Date(NOW - 5000).toISOString(), reviewedCommit: "d".repeat(40), expectedProductionVersionId: EXPECTED_PRODUCTION_VERSION,
    notificationRouting: EXISTING_NOTIFICATION_ROUTING };
  const proof = { requestId: healthRequest.requestId, productionVersion: EXPECTED_PRODUCTION_VERSION,
    d1WriteVerified: true, publicResultVerified: true, insertEventVerified: true, advisorEmailProviderAccepted: true,
    internalNotificationStatus: "provider_accepted", internalRecipientBindingPresent: true, recipientValueVerified: false,
    participantEmails: 0, existingDataChanged: false, automaticResubmissionAllowed: false, notificationRouting: EXISTING_NOTIFICATION_ROUTING };
  const acceptanceEvidence = { kind: "production-d1-access-acceptance-evidence", acceptedAt: new Date(NOW - 1000).toISOString(),
    productionVersionId: EXPECTED_PRODUCTION_VERSION, qaVersionId: EXPECTED_QA_VERSION,
    accessApplicationFingerprint: EXPECTED_ACCESS_APPLICATION_FINGERPRINT, accessPlanFingerprint: uploadReceipt.recordedReport.access.planFingerprint,
    healthCheck: { workflowRunId: "99999999999", report: { stage: "production_healthcheck_verified", requestId: healthRequest.requestId,
      sourceCommit: HEALTH_SOURCE, requestFingerprint: fingerprint(healthRequest), productionVersion: EXPECTED_PRODUCTION_VERSION, proof } },
    ui: { observedAt, recordSha256: rawHash(uiRecord), checks: Object.fromEntries(UI_CHECKS.map(name => [name, { status: "passed", recordSection: "Browser evidence" }])) } };
  const request = { operation: "remove-reviewed-supabase-bindings-from-production", requestId: CLEANUP_REQUEST_ID,
    requestedAt: new Date(NOW).toISOString(), reviewedCommit: PARENT, expectedProductionVersionId: EXPECTED_PRODUCTION_VERSION,
    expectedQaVersionId: EXPECTED_QA_VERSION, expectedAccessApplicationFingerprint: EXPECTED_ACCESS_APPLICATION_FINGERPRINT,
    expectedAccessCheckpointFingerprint: EXPECTED_ACCESS_CHECKPOINT_FINGERPRINT, acceptanceFingerprint: fingerprint(acceptanceEvidence) };
  const inputs = { request, acceptanceEvidence, uiRecord, uploadEvidence: clone(uploadReceipt), now: NOW,
    env: { GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "push", GITHUB_RUN_ATTEMPT: "1", GITHUB_REPOSITORY: "gvanesch/fractional-hr-site",
      GITHUB_REF: "refs/heads/chore/supabase-retirement-2026-11", GITHUB_SHA: HEAD, CLOUDFLARE_ACCOUNT_ID: ACCOUNT,
      CLOUDFLARE_API_TOKEN: "private-worker-token", CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: "private-access-token" },
    git: { head: HEAD, parents: [PARENT], clean: true, changedPaths: [CLEANUP_REQUEST_PATH] } };
  const state = { events: [], persisted: [], historyOverride: null, failEvidenceStage: null, failAfterPatch: false, failAfterPost: false };
  const originals = new Map([
    [uploadReceipt.originalSourceCommit, { request: uploadReceipt.originalRequest, path: "scripts/security/production-retirement-release-request.json" }],
    [uploadReceipt.recordedReport.access.sourceCommit, { request: uploadReceipt.originalRequest.accessRecovery.originalRequest, path: "scripts/security/production-retirement-release-request.json" }],
    [HEALTH_SOURCE, { request: healthRequest, path: HEALTH_PATH }],
  ]);
  const committed = new Map([[CLEANUP_REQUEST_PATH, JSON.stringify(request)], [CLEANUP_ACCEPTANCE_PATH, JSON.stringify(acceptanceEvidence)],
    [UPLOAD_EVIDENCE_PATH, JSON.stringify(uploadReceipt)], [CLEANUP_UI_RECORD_PATH, uiRecord.trimEnd()]]);
  function command(args) {
    const override = state.historyOverride?.(args);
    if (override !== undefined) return override;
    if (args[0] === "show") {
      const [source, path] = args[1].split(":");
      if (source === "HEAD") { assert.ok(committed.has(path)); return committed.get(path); }
      const original = originals.get(source); assert.equal(path, original?.path); return JSON.stringify(original.request);
    }
    if (args[0] === "merge-base") { assert.ok(originals.has(args[2])); assert.equal(args[3], "HEAD"); return ""; }
    if (args[0] === "rev-parse") return originals.get(args[1].slice(0, -1)).request.reviewedCommit;
    if (args[0] === "rev-list") {
      const source = args.at(-1); return source === "HEAD" ? `${HEAD} ${PARENT}` : `${source} ${originals.get(source).request.reviewedCommit}`;
    }
    if (args[0] === "status") return "";
    if (args[0] === "diff") return args.at(-1) === "HEAD" ? CLEANUP_REQUEST_PATH : originals.get(args.at(-1)).path;
    assert.fail("Unexpected Git operation");
  }
  const retained = { previousProductionVersion: EXPECTED_PRODUCTION_VERSION, qaVersion: EXPECTED_QA_VERSION,
    removedBindings: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"], previousVersionUsesSupabaseAuth: false,
    rollbackSecretDifferenceRequiresReview: true, rollbackNeverForcedAutomatically: true };
  Object.assign(inputs, {
    gitCommand: command,
    fetchImpl: async () => assert.fail("Runner tests never call any provider"),
    inspectAccessImpl: async args => {
      assert.deepEqual(args.request, uploadReceipt.originalRequest.accessRecovery.originalRequest);
      assert.deepEqual(args.checkpoint, uploadReceipt.recordedReport.access);
      assert.equal(args.env.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN, "private-access-token");
      state.events.push("inspect-owned-access"); return { syntheticVerified: true };
    },
    onEvidence: async value => {
      if (value.stage === state.failEvidenceStage) throw new Error("private-evidence-error");
      state.persisted.push(clone(value)); state.events.push(`persist:${value.stage}`);
    },
    prepareImpl: async args => {
      state.events.push("prepare"); await args.inspectAccess();
      assert.equal(args.accepted.productionVersionId, EXPECTED_PRODUCTION_VERSION); assert.equal(args.accepted.logoutVerified, true);
      return { kind: "synthetic-prepared", privateTestSentinel: "private-checkpoint-value" };
    },
    stageImpl: async args => {
      assert.equal(args.checkpoint.kind, "synthetic-prepared");
      await args.onEvidence({ stage: "cleanup_patch_requested_outcome_unknown", ...retained, rawProvider: "private-provider-value" });
      state.events.push("PATCH");
      if (state.failAfterPatch) throw new Error("private-worker-token private-provider-failure");
      await args.onEvidence({ stage: "cleanup_uploaded_not_verified", ...retained, cleanupVersion: CANDIDATE });
      await args.onEvidence({ stage: "cleanup_verified_not_activated", ...retained, cleanupVersion: CANDIDATE, productionTrafficUnchanged: true });
      return { kind: "synthetic-staged", candidateVersionId: CANDIDATE };
    },
    activateImpl: async args => {
      assert.equal(args.staged.candidateVersionId, CANDIDATE);
      await args.onEvidence({ stage: "cleanup_activation_requested_outcome_unknown", ...retained, cleanupVersion: CANDIDATE });
      state.events.push("POST");
      if (state.failAfterPost) throw new Error("private-worker-token private-provider-failure");
      await args.onEvidence({ stage: "cleanup_activated_verification_pending", ...retained, cleanupVersion: CANDIDATE });
      await args.onEvidence({ stage: "cleanup_verified", ...retained, cleanupVersion: CANDIDATE, productionDeploymentId: DEPLOYMENT,
        nonTargetBindingsPreserved: true, runtimeCodeAssetsSettingsPreserved: true, qaUnchanged: true, healthD1Connected: true, healthSupabaseNotRequired: true,
        assetPreservation: { basis: "provider-env-only-merge-inheritance-and-readable-metadata-equality", independentAssetContentDigestsVerified: false } });
    },
  });
  return { inputs, state, committed, originals, command, refreshReceiptHash: () => { inputs.request.acceptanceFingerprint = fingerprint(inputs.acceptanceEvidence); } };
}

test("cleanup derives fixed acceptance only from complete reviewed Health Check and UI evidence", () => {
  const f = fixture(), accepted = validateProductionCleanupInputs(f.inputs);
  assert.equal(accepted.kind, "accepted-production-d1-access"); assert.equal(accepted.productionVersionId, EXPECTED_PRODUCTION_VERSION);
  assert.equal(accepted.healthCheckD1WriteReadVerified, true); assert.equal(accepted.logoutVerified, true);
  assert.equal(accepted.accessApplicationFingerprint, EXPECTED_ACCESS_APPLICATION_FINGERPRINT);
  assert.equal(accepted.healthCheck, undefined); assert.equal(accepted.env, undefined);
  verifyCleanupSourceHistory(f.inputs, f.command, NOW);
  assert.deepEqual(readProductionCleanupGit(f.command), f.inputs.git);
});

test("missing, failed, stale or contradictory acceptance cannot reach preparation or any mutation", async () => {
  for (const change of [
    x => { x.acceptanceEvidence = undefined; }, x => { x.acceptanceEvidence.ready = true; },
    x => { x.acceptanceEvidence.acceptedAt = new Date(NOW - 86400001).toISOString(); },
    x => { x.acceptanceEvidence.healthCheck.report.stage = "production_readonly_preflight_verified"; },
    x => { x.acceptanceEvidence.healthCheck.report.stopped = true; },
    x => { x.acceptanceEvidence.healthCheck.report.proof.d1WriteVerified = false; },
    x => { x.acceptanceEvidence.healthCheck.report.proof.publicResultVerified = false; },
    x => { x.acceptanceEvidence.healthCheck.report.proof.advisorEmailProviderAccepted = false; },
    x => { x.acceptanceEvidence.healthCheck.report.proof.internalNotificationStatus = "unknown"; },
    x => { x.acceptanceEvidence.healthCheck.report.proof.recipientValueVerified = true; },
    x => { x.acceptanceEvidence.healthCheck.report.proof.internalRecipientBindingPresent = false; },
    x => { x.acceptanceEvidence.ui.checks.logout.status = "pending"; },
    x => { delete x.acceptanceEvidence.ui.checks.advisorHealthCheckReadback; },
    x => { x.acceptanceEvidence.ui.observedAt = new Date(NOW + 1000).toISOString(); },
    x => { x.acceptanceEvidence.ui.checks.crmFlow.recordSection = "Absent section"; },
    x => { x.uiRecord = x.uiRecord.replace("production-cleanup-check:logout", "pending-check:logout"); x.acceptanceEvidence.ui.recordSha256 = rawHash(x.uiRecord); },
    x => { x.uiRecord += "\nPartial acceptance only\n"; x.acceptanceEvidence.ui.recordSha256 = rawHash(x.uiRecord); },
    x => { x.uiRecord += "\n| Logout | Not yet checked | Pending |\n"; x.acceptanceEvidence.ui.recordSha256 = rawHash(x.uiRecord); },
  ]) {
    const f = fixture(); change(f.inputs);
    if (f.inputs.acceptanceEvidence) f.refreshReceiptHash();
    await assert.rejects(runProductionCleanup(f.inputs)); assert.deepEqual(f.state.events, []);
  }
});

test("exact request, scope, source, version and immutable Access ownership gates fail before execution", async () => {
  for (const change of [
    x => { x.env.GITHUB_RUN_ATTEMPT = "2"; }, x => { x.env.GITHUB_EVENT_NAME = "workflow_dispatch"; },
    x => { x.env.GITHUB_REPOSITORY = "untrusted/repo"; }, x => { x.env.GITHUB_REF = "refs/heads/main"; },
    x => { x.env.CLOUDFLARE_ENV = "qa"; }, x => { x.env.SUPABASE_URL = "private-unexpected-value"; },
    x => { x.request.operation = "delete-production"; }, x => { x.request.requestId = "different-request"; },
    x => { x.request.expectedProductionVersionId = CANDIDATE; }, x => { x.request.expectedQaVersionId = CANDIDATE; },
    x => { x.request.expectedAccessCheckpointFingerprint = "f".repeat(64); },
    x => { x.request.extra = true; }, x => { x.request.requestedAt = new Date(NOW - 86400001).toISOString(); },
    x => { x.git.parents.push("e".repeat(40)); }, x => { x.git.clean = false; },
    x => { x.git.changedPaths.push(CLEANUP_ACCEPTANCE_PATH); }, x => { x.env.GITHUB_SHA = PARENT; },
    x => { x.uploadEvidence.recordedReport.access.applicationFingerprint = "f".repeat(64); },
    x => { x.uploadEvidence.originalRequest.accessRecovery.originalRequest.requestId = "other-owner"; },
  ]) {
    const f = fixture(); change(f.inputs);
    await assert.rejects(runProductionCleanup(f.inputs)); assert.deepEqual(f.state.events, []);
  }
});

test("acceptance files and the real request-only evidence chain must exist in reviewed Git history", async () => {
  for (const mode of ["untracked-acceptance", "different-ui-record", "different-health-request", "non-ancestor", "merge-source", "mixed-source"]) {
    const f = fixture();
    f.state.historyOverride = args => {
      if (mode === "untracked-acceptance" && args[1] === `HEAD:${CLEANUP_ACCEPTANCE_PATH}`) throw new Error("not committed");
      if (mode === "different-ui-record" && args[1] === `HEAD:${CLEANUP_UI_RECORD_PATH}`) return "different committed record";
      if (mode === "different-health-request" && args[1] === `${HEALTH_SOURCE}:${HEALTH_PATH}`) return JSON.stringify({ ...f.originals.get(HEALTH_SOURCE).request, requestId: "different" });
      if (mode === "non-ancestor" && args[0] === "merge-base") throw new Error("not ancestor");
      if (mode === "merge-source" && args[0] === "rev-list" && args.at(-1) === HEALTH_SOURCE) return `${HEALTH_SOURCE} ${PARENT} ${HEAD}`;
      if (mode === "mixed-source" && args[0] === "diff" && args.at(-1) === HEALTH_SOURCE) return `${HEALTH_PATH}\napp/page.tsx`;
    };
    await assert.rejects(runProductionCleanup(f.inputs), /evidence_history_unverified/); assert.deepEqual(f.state.events, []);
  }
});

test("caller persists sanitized recovery boundaries before one stage and one separate activation", async () => {
  const f = fixture(), report = await runProductionCleanup(f.inputs);
  assert.equal(report.stage, "cleanup_verified"); assert.equal(report.automaticMutationRetryAllowed, false);
  assert.equal(report.healthCheckProvenance, "reviewed-completed-workflow-artifact-receipt"); assert.equal(report.independentGithubExecutionVerified, false);
  assert.equal(f.state.events.filter(x => x === "PATCH").length, 1); assert.equal(f.state.events.filter(x => x === "POST").length, 1);
  assert.equal(f.state.events[f.state.events.indexOf("PATCH") - 1], "persist:cleanup_patch_requested_outcome_unknown");
  assert.equal(f.state.events[f.state.events.indexOf("POST") - 1], "persist:cleanup_activation_requested_outcome_unknown");
  assert.equal(report.cleanupVersion, CANDIDATE); assert.equal(report.previousProductionVersion, EXPECTED_PRODUCTION_VERSION);
  assert.ok(!JSON.stringify(f.state.persisted).includes("private-"));
  assert.deepEqual(report.evidence.map(x => x.stage), ["cleanup_patch_requested_outcome_unknown", "cleanup_uploaded_not_verified", "cleanup_verified_not_activated",
    "cleanup_activation_requested_outcome_unknown", "cleanup_activated_verification_pending", "cleanup_verified"]);
});

test("evidence write failure blocks the next mutation and provider failures retain unknown stages without retry", async () => {
  for (const phase of ["before-patch", "after-patch", "before-post", "after-post"]) {
    const f = fixture();
    if (phase === "before-patch") f.state.failEvidenceStage = "cleanup_patch_requested_outcome_unknown";
    if (phase === "after-patch") f.state.failAfterPatch = true;
    if (phase === "before-post") f.state.failEvidenceStage = "cleanup_activation_requested_outcome_unknown";
    if (phase === "after-post") f.state.failAfterPost = true;
    const error = await runProductionCleanup(f.inputs).catch(error => error);
    assert.ok(!error.message.includes("private-") && !JSON.stringify(f.state.persisted).includes("private-"));
    assert.equal(f.state.events.filter(x => x === "PATCH").length, phase === "before-patch" ? 0 : 1);
    assert.equal(f.state.events.filter(x => x === "POST").length, phase === "after-post" ? 1 : 0);
    if (phase.startsWith("after")) {
      assert.equal(f.state.persisted.at(-1).stopped, true);
      assert.match(f.state.persisted.at(-1).stage, /requested_outcome_unknown$/);
      assert.equal(f.state.persisted.at(-1).readOnlyReconciliationRequired, true);
    }
  }
});

test("callback mutation of caller data cannot replace the validated lease or original Access owner", async () => {
  const f = fixture(), save = f.inputs.onEvidence;
  f.inputs.onEvidence = async report => {
    await save(report); f.inputs.env.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN = "changed-value";
    f.inputs.uploadEvidence.originalRequest.accessRecovery.originalRequest.requestId = "changed-owner";
    f.inputs.acceptanceEvidence.productionVersionId = CANDIDATE;
  };
  const report = await runProductionCleanup(f.inputs);
  assert.equal(report.stage, "cleanup_verified"); assert.equal(report.productionVersion, EXPECTED_PRODUCTION_VERSION);
});

test("cleanup workflow is request-only, shares the production lock, and scopes credentials to execution", async () => {
  const source = await readFile(new URL("../../.github/workflows/production-retirement-cleanup.yml", import.meta.url), "utf8");
  assert.ok(source.includes(`      - ${CLEANUP_REQUEST_PATH}`)); assert.ok(source.includes("group: vanesch-production-release"));
  assert.ok(source.includes("cancel-in-progress: false")); assert.ok(source.includes("github.run_attempt == 1"));
  assert.ok(source.includes("fetch-depth: 0") && source.includes("persist-credentials: false"));
  assert.ok(!/workflow_dispatch|npm |wrangler |continue-on-error|SUPABASE_/.test(source));
  const [before, execution] = source.split("      - name: Stage and activate the single accepted binding cleanup\n");
  assert.ok(!before.includes("secrets.")); assert.ok(before.includes("production-retirement-cleanup-run.mjs validate"));
  const [step, ...after] = execution.split("      - name:");
  assert.equal((step.match(/secrets\.CLOUDFLARE_API_TOKEN/g) ?? []).length, 1);
  assert.equal((step.match(/secrets\.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN/g) ?? []).length, 1);
  assert.ok(step.includes("production-retirement-cleanup-run.mjs execute")); assert.ok(!after.join("\n").includes("secrets."));
});

test("CLI cannot proceed without the separately supplied real acceptance and never prints credentials", () => {
  const result = spawnSync(process.execPath, ["scripts/security/production-retirement-cleanup-run.mjs", "unrecognized"], {
    cwd: new URL("../../", import.meta.url), encoding: "utf8", env: { PATH: process.env.PATH, CLOUDFLARE_API_TOKEN: "private-test-token" },
  });
  assert.equal(result.status, 1); assert.equal(result.stdout, ""); assert.ok(!result.stderr.includes("private-test-token"));
  assert.match(result.stderr, /stopped; inspect its sanitized evidence/);
});

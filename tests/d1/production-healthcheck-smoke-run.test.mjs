import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fingerprint } from "../../scripts/security/qa-retirement-release.mjs";
import { ProductionHealthCheckError } from "../../scripts/security/production-healthcheck-smoke.mjs";
import {
  REQUEST_PATH, REPORT_PATH, HEALTHCHECK_REQUEST_ID, EXPECTED_PRODUCTION_VERSION_ID,
  ProductionHealthCheckRunError, validateProductionHealthCheckRequest,
  prepareProductionHealthCheckRun, executeProductionHealthCheckRun,
  productionHealthCheckRunFailure, readProductionHealthCheckGit,
} from "../../scripts/security/production-healthcheck-smoke-run.mjs";

const NOW = Date.parse("2026-11-20T21:00:00.000Z");
const HEAD = "a".repeat(40), PARENT = "b".repeat(40);
const PRIVATE = "synthetic-private-provider-secret-never-output";
const fail = code => error => error instanceof ProductionHealthCheckRunError && error.code === code;
function fixture() {
  const request = { operation: "verify-healthcheck-on-production", requestId: HEALTHCHECK_REQUEST_ID,
    requestedAt: new Date(NOW - 60000).toISOString(), reviewedCommit: PARENT,
    expectedProductionVersionId: EXPECTED_PRODUCTION_VERSION_ID };
  const env = { GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "push", GITHUB_RUN_ATTEMPT: "1",
    GITHUB_REPOSITORY: "gvanesch/fractional-hr-site", GITHUB_REF: "refs/heads/chore/supabase-retirement-2026-11",
    GITHUB_SHA: HEAD, CLOUDFLARE_ACCOUNT_ID: "73221f18acc676e4992c89fcbf2b2a8f" };
  const git = { head: HEAD, parents: [PARENT], changedPaths: [REQUEST_PATH], clean: true };
  const adapterRequest = { operation: request.operation, requestId: request.requestId,
    expectedProductionVersionId: request.expectedProductionVersionId };
  const adapterCheckpoint = { kind: "production-healthcheck-smoke-checkpoint", requestFingerprint: fingerprint(adapterRequest),
    productionVersionId: EXPECTED_PRODUCTION_VERSION_ID, payloadFingerprint: "c".repeat(64), leaseFingerprint: "d".repeat(64) };
  const state = { prepared: { readOnly: true, databaseWrites: false, applicationSubmissionAttempted: false,
    internalRecipientVerified: true, participantEmails: 0, state: "ready", checkpoint: adapterCheckpoint,
    payload: { sensitiveNeverPersisted: PRIVATE }, ignoredPrivateResponse: PRIVATE },
  proof: { requestId: HEALTHCHECK_REQUEST_ID, productionVersion: EXPECTED_PRODUCTION_VERSION_ID,
    d1WriteVerified: true, publicResultVerified: true, insertEventVerified: true, internalRecipientVerified: true,
    participantEmails: 0, existingDataChanged: false, automaticResubmissionAllowed: false,
    internalNotificationStatus: "provider_accepted", advisorEmailProviderAccepted: true,
    createdSubmission: true, reusedSubmission: false, applicationSubmissionAttempted: true, submissionMethod: "api",
    ignoredPrivateResponse: PRIVATE },
  prepareCalls: [], runCalls: [], evidence: [], order: [] };
  const fetchImpl = () => { throw new Error("Focused wrapper tests cannot call the network"); };
  const prepareImpl = async options => {
    state.prepareCalls.push(options); state.order.push("read-only-prepare"); return structuredClone(state.prepared);
  };
  const runImpl = async options => {
    state.runCalls.push(options); state.order.push("library-run"); return structuredClone(state.proof);
  };
  const onEvidence = async value => { state.evidence.push(structuredClone(value)); state.order.push(`evidence:${value.stage}`); };
  const options = { request, env, git, now: NOW, fetchImpl, prepareImpl, runImpl, onEvidence };
  return { request, env, git, adapterRequest, state, options,
    prepare: overrides => prepareProductionHealthCheckRun({ ...options, ...overrides }),
    execute: (checkpoint, overrides) => executeProductionHealthCheckRun({ ...options, checkpoint, ...overrides }) };
}

test("The exact request-only source gate works without provider credentials and projects only the library fields", () => {
  const h = fixture();
  assert.equal(h.env.CLOUDFLARE_API_TOKEN, undefined);
  assert.deepEqual(validateProductionHealthCheckRequest(h.request, h.env, h.git, NOW), h.adapterRequest);
  assert.deepEqual(Object.keys(h.adapterRequest).sort(), ["operation", "requestId", "expectedProductionVersionId"].sort());
});

test("Repository, push event, first run, branch, reviewed parent and clean request-only history are mandatory", () => {
  for (const [key, value] of [["GITHUB_ACTIONS", "false"], ["GITHUB_EVENT_NAME", "workflow_dispatch"],
    ["GITHUB_RUN_ATTEMPT", "2"], ["GITHUB_RUN_ATTEMPT", undefined], ["GITHUB_REPOSITORY", "other/repo"],
    ["GITHUB_REF", "refs/heads/main"], ["CLOUDFLARE_ACCOUNT_ID", "other"]]) {
    const h = fixture(); h.env[key] = value;
    assert.throws(() => validateProductionHealthCheckRequest(h.request, h.env, h.git, NOW),
      fail("production_healthcheck_execution_not_authorized"), key);
  }
  for (const change of [ h => { h.env.GITHUB_SHA = PARENT; }, h => { h.git.head = "invalid"; },
    h => { h.git.parents = [HEAD]; }, h => { h.git.parents = [PARENT, HEAD]; }, h => { h.git.parents = []; },
    h => { h.git.clean = false; }, h => { h.git.changedPaths = [REQUEST_PATH, "scripts/security/production-healthcheck-smoke-run.mjs"]; },
    h => { h.git.changedPaths = []; }, h => { h.git.changedPaths = ["other.json"]; } ]) {
    const h = fixture(); change(h);
    assert.throws(() => validateProductionHealthCheckRequest(h.request, h.env, h.git, NOW),
      fail("production_healthcheck_requires_request_only_reviewed_parent"));
  }
});

test("Only the fixed accepted version, fixed durable identity and fresh exact request schema are allowed", () => {
  for (const change of [ h => { h.request.requestId += "-retry"; }, h => { h.request.operation = "other"; },
    h => { h.request.expectedProductionVersionId = "11111111-2222-4333-8444-555555555555"; },
    h => { h.request.reviewedCommit = "invalid"; }, h => { h.request.requestedAt = new Date(NOW - 86400001).toISOString(); },
    h => { h.request.requestedAt = new Date(NOW + 1).toISOString(); }, h => { h.request.requestedAt = "invalid"; },
    h => { h.request.recipient = "another@example.invalid"; }, h => { delete h.request.requestedAt; } ]) {
    const h = fixture(); change(h);
    assert.throws(() => validateProductionHealthCheckRequest(h.request, h.env, h.git, NOW),
      fail("production_healthcheck_reviewed_request_invalid_or_stale"));
  }
});

test("Read-only preflight saves only verified fingerprints and passes no wrapper fields into the adapter", async () => {
  const h = fixture(), checkpoint = await h.prepare();
  assert.equal(h.state.prepareCalls.length, 1);
  assert.equal(h.state.runCalls.length, 0);
  assert.deepEqual(h.state.prepareCalls[0].request, h.adapterRequest);
  assert.equal(checkpoint.sourceCommit, HEAD);
  assert.equal(checkpoint.requestFingerprint, fingerprint(h.request));
  assert.equal(checkpoint.adapterCheckpoint.requestFingerprint, fingerprint(h.adapterRequest));
  assert.equal(checkpoint.state, "ready");
  assert.doesNotMatch(JSON.stringify([checkpoint, h.state.evidence]), new RegExp(PRIVATE));
});

test("The submit phase rechecks the lease, persists attempt evidence, invokes the library once and allowlists the proof", async () => {
  const h = fixture(), checkpoint = await h.prepare(), proof = await h.execute(checkpoint);
  assert.equal(h.state.prepareCalls.length, 2);
  assert.equal(h.state.runCalls.length, 1);
  assert.deepEqual(h.state.runCalls[0].request, h.adapterRequest);
  assert.equal(proof.d1WriteVerified, true);
  assert.equal(proof.createdSubmission, true);
  const attempt = h.state.order.indexOf("evidence:entering_durable_single_attempt");
  assert.ok(attempt >= 0 && attempt < h.state.order.indexOf("library-run"));
  assert.equal(h.state.evidence.at(-1).databaseWriteStatus, "verified_synthetic_only");
  assert.equal(h.state.evidence.at(-1).applicationSubmissionStatus, "verified_once");
  assert.doesNotMatch(JSON.stringify([proof, h.state.evidence]), new RegExp(PRIVATE));
});

test("Failed source authorization cannot reach either preflight or submission callbacks", async () => {
  const h = fixture(), checkpoint = await h.prepare();
  h.state.prepareCalls.length = 0;
  h.env.GITHUB_RUN_ATTEMPT = "2";
  await assert.rejects(h.prepare(), fail("production_healthcheck_execution_not_authorized"));
  await assert.rejects(h.execute(checkpoint), fail("production_healthcheck_execution_not_authorized"));
  assert.equal(h.state.prepareCalls.length, 0);
  assert.equal(h.state.runCalls.length, 0);
});

test("A prior reserved browser or uncertain API attempt stops preflight without calling the submitter", async () => {
  const h = fixture(); h.state.prepared.state = "reserved_attempt_requires_verification";
  await assert.rejects(h.prepare(), fail("production_healthcheck_prior_attempt_requires_readonly_reconciliation"));
  assert.equal(h.state.runCalls.length, 0);
  assert.equal(h.state.evidence.at(-1).preflightState, "reserved_attempt_requires_verification");
});

test("Missing, stale, changed or mismatched preflight evidence blocks the submitter", async () => {
  for (const change of [ checkpoint => { checkpoint.sourceCommit = PARENT; },
    checkpoint => { checkpoint.requestFingerprint = "e".repeat(64); }, checkpoint => { checkpoint.kind = "other"; },
    checkpoint => { checkpoint.observedAt = new Date(NOW - 900001).toISOString(); },
    checkpoint => { checkpoint.observedAt = new Date(NOW + 1).toISOString(); },
    checkpoint => { checkpoint.state = "reserved_attempt_requires_verification"; },
    checkpoint => { checkpoint.adapterCheckpoint.requestFingerprint = "e".repeat(64); },
    checkpoint => { checkpoint.adapterCheckpoint.productionVersionId = "another"; },
    checkpoint => { checkpoint.adapterCheckpoint.payloadFingerprint = "invalid"; } ]) {
    const h = fixture(), checkpoint = await h.prepare(); change(checkpoint);
    await assert.rejects(h.execute(checkpoint), ProductionHealthCheckRunError);
    assert.equal(h.state.runCalls.length, 0);
  }
});

test("Fresh lease or durable-attempt state changes after preflight block submission", async () => {
  for (const change of [ h => { h.state.prepared.checkpoint.leaseFingerprint = "e".repeat(64); },
    h => { h.state.prepared.state = "existing_submission"; }, h => { h.state.prepared.state = "reserved_attempt_requires_verification"; } ]) {
    const h = fixture(), checkpoint = await h.prepare(); change(h);
    await assert.rejects(h.execute(checkpoint), fail("production_healthcheck_runtime_or_attempt_changed_after_preflight"));
    assert.equal(h.state.runCalls.length, 0);
  }
});

test("Unverified recipient or non-read-only preflight is rejected before any library run", async () => {
  for (const [key, value] of [["internalRecipientVerified", false], ["participantEmails", 1], ["databaseWrites", true],
    ["readOnly", false], ["applicationSubmissionAttempted", true]]) {
    const h = fixture(); h.state.prepared[key] = value;
    await assert.rejects(h.prepare(), fail("production_healthcheck_readonly_preflight_unverified"));
    assert.equal(h.state.runCalls.length, 0);
  }
});

test("A failed durable evidence writer stops execution before the library may reserve or submit", async () => {
  const h = fixture(), checkpoint = await h.prepare();
  await assert.rejects(h.execute(checkpoint, { onEvidence: async () => { throw new Error("Synthetic disk failure"); } }), /Synthetic disk failure/);
  assert.equal(h.state.runCalls.length, 0);
});

test("An uncertain library result is propagated once with sanitized failure evidence and no retry", async () => {
  const h = fixture(), checkpoint = await h.prepare();
  let attempts = 0;
  await assert.rejects(h.execute(checkpoint, { runImpl: async () => {
    attempts++; throw new ProductionHealthCheckError("production_hosted_transport_failure_no_retry", true);
  } }), error => {
    assert.deepEqual(productionHealthCheckRunFailure(error), { code: "production_hosted_transport_failure_no_retry", mutationOutcomeUnknown: true, httpStatus: null });
    return true;
  });
  assert.equal(attempts, 1);
  assert.equal(h.state.evidence.at(-1).applicationSubmissionStatus, "may_have_occurred");
  assert.equal(h.state.evidence.at(-1).automaticResubmissionAllowed, false);
  assert.deepEqual(productionHealthCheckRunFailure(new Error(PRIVATE)),
    { code: "unexpected_production_healthcheck_failure", mutationOutcomeUnknown: null, httpStatus: null });
});

test("Existing browser proof is reconciled read-only under the same durable identity", async () => {
  const h = fixture(); h.state.prepared.state = "existing_submission";
  Object.assign(h.state.proof, { createdSubmission: false, reusedSubmission: true, applicationSubmissionAttempted: false, submissionMethod: "browser" });
  const checkpoint = await h.prepare(), result = await h.execute(checkpoint);
  assert.equal(result.reusedSubmission, true);
  assert.equal(h.state.evidence.at(-1).applicationSubmissionStatus, "not_attempted");
  assert.equal(h.state.evidence.at(-1).databaseWriteStatus, "read_only_reconciliation");
  assert.deepEqual(h.state.runCalls[0].request, h.adapterRequest);
});

test("Notification failure remains visible and unsafe or incomplete proof cannot be published as verified", async () => {
  for (const status of ["failed", "unknown"]) {
    const h = fixture(), checkpoint = await h.prepare();
    Object.assign(h.state.proof, { internalNotificationStatus: status, advisorEmailProviderAccepted: false });
    assert.equal((await h.execute(checkpoint)).internalNotificationStatus, status);
    assert.equal(h.state.runCalls.length, 1);
  }
  for (const [key, value] of [["participantEmails", 1], ["internalRecipientVerified", false], ["productionVersion", "another"],
    ["requestId", "another"], ["publicResultVerified", false], ["automaticResubmissionAllowed", true], ["submissionMethod", "browser"]]) {
    const h = fixture(), checkpoint = await h.prepare(); h.state.proof[key] = value;
    await assert.rejects(h.execute(checkpoint), fail("production_healthcheck_completion_unverified_do_not_resubmit"));
    assert.equal(h.state.runCalls.length, 1);
    assert.ok(!h.state.evidence.some(item => item.stage === "production_healthcheck_verified"));
  }
});

test("Git metadata preserves parent count and working-tree status, with sanitized command failures", () => {
  const commands = [];
  const command = args => {
    commands.push(args);
    if (args[0] === "rev-list") return `${HEAD} ${PARENT}`;
    if (args[0] === "status") return "";
    if (args[0] === "diff") return REQUEST_PATH;
    throw new Error("Unexpected Git command");
  };
  assert.deepEqual(readProductionHealthCheckGit(command), fixture().git);
  assert.ok(commands.some(args => args.includes("--untracked-files=no")));
  assert.throws(() => readProductionHealthCheckGit(() => { throw new Error(PRIVATE); }),
    fail("production_healthcheck_git_history_unavailable"));
});

test("Workflow has only the request push trigger, the production lock and first-attempt gate; secrets stay inside its proof step", () => {
  const source = readFileSync(new URL("../../.github/workflows/production-healthcheck-smoke.yml", import.meta.url), "utf8");
  assert.match(source, new RegExp(`paths:\\n      - ${REQUEST_PATH}\\n`));
  assert.equal((source.match(/      - scripts\//g) ?? []).length, 1);
  assert.ok(source.includes("group: vanesch-production-release"));
  assert.ok(source.includes("cancel-in-progress: false"));
  assert.ok(source.includes("github.run_attempt == 1"));
  assert.ok(source.includes("github.event_name == 'push'"));
  assert.ok(source.includes("persist-credentials: false"));
  assert.ok(source.includes("fetch-depth: 2"));
  assert.ok(!/workflow_dispatch|schedule:|pull_request|wrangler|opennext|npm |SUPABASE|RETIREMENT_AUDIT_TOKEN/.test(source));
  const [before, secretAndAfter] = source.split("      - name: Read production metadata and prove the single reserved Health Check\n");
  assert.ok(!before.includes("secrets."));
  assert.ok(before.includes("production-healthcheck-smoke-run.mjs validate"));
  assert.ok(before.includes("node --test"));
  const [secretStep, ...after] = secretAndAfter.split("      - name:");
  assert.equal((secretStep.match(/secrets\.CLOUDFLARE_API_TOKEN/g) ?? []).length, 1);
  assert.ok(secretStep.includes("production-healthcheck-smoke-run.mjs preflight"));
  assert.ok(secretStep.includes("production-healthcheck-smoke-run.mjs submit"));
  assert.ok(!after.join("\n").includes("secrets."));
  assert.ok(after.join("\n").includes(`path: ${REPORT_PATH}`));
  assert.ok(!after.join("\n").includes("checkpoint"));
});

test("Importing the runner performs no network, file writes or CLI execution", () => {
  const moduleUrl = new URL("../../scripts/security/production-healthcheck-smoke-run.mjs", import.meta.url).href;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e",
    `globalThis.fetch = () => { throw new Error('unexpected network'); }; await import(${JSON.stringify(moduleUrl)});`],
  { encoding: "utf8", env: { PATH: process.env.PATH } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});

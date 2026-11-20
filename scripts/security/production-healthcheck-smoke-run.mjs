// Request-gated entry point for one production Health Check. Importing this
// module is inert. Only the separate request-file commit can enable its workflow.
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fingerprint } from "./qa-retirement-release.mjs";
import { ACCOUNT, CANDIDATE_REF } from "./supabase-retirement-readonly.mjs";
import {
  prepareProductionHealthCheckSmoke, runProductionHealthCheckSmoke, productionHealthCheckFailure,
  STRICT_NOTIFICATION_ROUTING, EXISTING_NOTIFICATION_ROUTING,
} from "./production-healthcheck-smoke.mjs";

export const REQUEST_PATH = "scripts/security/production-healthcheck-smoke-request.json";
export const CHECKPOINT_PATH = "production-healthcheck-smoke-checkpoint.json";
export const REPORT_PATH = "production-healthcheck-smoke-report.json";
export const EXPECTED_PRODUCTION_VERSION_ID = "9bd890ab-41e1-4845-867c-f6d4eb85196f";
export const HEALTHCHECK_REQUEST_ID = "retirement-20261120-production-healthcheck-01";
const SHA = /^[a-f\d]{40}$/, HASH = /^[a-f\d]{64}$/;
const CHECKPOINT_KIND = "production-healthcheck-workflow-checkpoint";
const object = value => value != null && typeof value === "object" && !Array.isArray(value);
const REQUEST_FIELDS = ["operation", "requestId", "requestedAt", "reviewedCommit", "expectedProductionVersionId"];
const routingFor = request => request.notificationRouting ?? STRICT_NOTIFICATION_ROUTING;

export class ProductionHealthCheckRunError extends Error {
  constructor(code) { super(code); this.code = code; }
}
const check = (condition, code) => { if (!condition) throw new ProductionHealthCheckRunError(code); };

export function validateProductionHealthCheckRequest(request, env, git, now = Date.now()) {
  check(env?.GITHUB_ACTIONS === "true" && env.GITHUB_EVENT_NAME === "push" && env.GITHUB_RUN_ATTEMPT === "1" &&
    env.GITHUB_REPOSITORY === "gvanesch/fractional-hr-site" && env.GITHUB_REF === CANDIDATE_REF &&
    env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT, "production_healthcheck_execution_not_authorized");
  const age = now - Date.parse(request?.requestedAt);
  const existingRoutingDeclared = object(request) && Object.hasOwn(request, "notificationRouting");
  const fields = existingRoutingDeclared ? [...REQUEST_FIELDS, "notificationRouting"] : REQUEST_FIELDS;
  check(object(request) && Object.keys(request).length === fields.length &&
    Object.keys(request).every(key => fields.includes(key)) &&
    (!existingRoutingDeclared || request.notificationRouting === EXISTING_NOTIFICATION_ROUTING) &&
    request.operation === "verify-healthcheck-on-production" && request.requestId === HEALTHCHECK_REQUEST_ID &&
    request.expectedProductionVersionId === EXPECTED_PRODUCTION_VERSION_ID && SHA.test(request.reviewedCommit ?? "") &&
    typeof request.requestedAt === "string" && /Z$/.test(request.requestedAt) &&
    Number.isFinite(age) && age >= 0 && age <= 24 * 60 * 60 * 1000,
  "production_healthcheck_reviewed_request_invalid_or_stale");
  check(SHA.test(git?.head ?? "") && git.head === env.GITHUB_SHA && git.clean === true &&
    git.parents?.length === 1 && git.parents[0] === request.reviewedCommit &&
    git.changedPaths?.length === 1 && git.changedPaths[0] === REQUEST_PATH,
  "production_healthcheck_requires_request_only_reviewed_parent");
  return { operation: request.operation, requestId: request.requestId, expectedProductionVersionId: request.expectedProductionVersionId,
    ...(existingRoutingDeclared ? { notificationRouting: EXISTING_NOTIFICATION_ROUTING } : {}) };
}

function checkedAdapterCheckpoint(value, adapterRequest) {
  check(value?.kind === "production-healthcheck-smoke-checkpoint" && value.requestFingerprint === fingerprint(adapterRequest) &&
    value.productionVersionId === EXPECTED_PRODUCTION_VERSION_ID && HASH.test(value.payloadFingerprint ?? "") &&
    HASH.test(value.leaseFingerprint ?? ""), "production_healthcheck_adapter_checkpoint_unverified");
  return { kind: value.kind, requestFingerprint: value.requestFingerprint, productionVersionId: value.productionVersionId,
    payloadFingerprint: value.payloadFingerprint, leaseFingerprint: value.leaseFingerprint };
}

function checkedPrepared(value, adapterRequest) {
  check(value?.readOnly === true && value.databaseWrites === false && value.applicationSubmissionAttempted === false &&
    value.notificationRouting === routingFor(adapterRequest) && value.internalRecipientBindingPresent === true &&
    value.recipientValueVerified === (routingFor(adapterRequest) === STRICT_NOTIFICATION_ROUTING) && value.participantEmails === 0 &&
    ["ready", "existing_submission", "reserved_attempt_requires_verification"].includes(value.state),
  "production_healthcheck_readonly_preflight_unverified");
  return { state: value.state, checkpoint: checkedAdapterCheckpoint(value.checkpoint, adapterRequest) };
}

function checkedProof(value, adapterRequest) {
  check(value?.requestId === HEALTHCHECK_REQUEST_ID && value.productionVersion === EXPECTED_PRODUCTION_VERSION_ID &&
    value.d1WriteVerified === true && value.publicResultVerified === true && value.insertEventVerified === true &&
    value.notificationRouting === routingFor(adapterRequest) && value.internalRecipientBindingPresent === true &&
    value.recipientValueVerified === (routingFor(adapterRequest) === STRICT_NOTIFICATION_ROUTING) &&
    value.participantEmails === 0 && value.existingDataChanged === false &&
    value.automaticResubmissionAllowed === false && ["provider_accepted", "failed", "unknown"].includes(value.internalNotificationStatus) &&
    value.advisorEmailProviderAccepted === (value.internalNotificationStatus === "provider_accepted") &&
    typeof value.createdSubmission === "boolean" && value.reusedSubmission === !value.createdSubmission &&
    value.applicationSubmissionAttempted === value.createdSubmission && ["api", "browser"].includes(value.submissionMethod) &&
    (!value.createdSubmission || value.submissionMethod === "api"), "production_healthcheck_completion_unverified_do_not_resubmit");
  return Object.fromEntries(["requestId", "productionVersion", "d1WriteVerified", "publicResultVerified", "insertEventVerified",
    "notificationRouting", "internalRecipientBindingPresent", "recipientValueVerified", "internalNotificationStatus", "advisorEmailProviderAccepted", "participantEmails", "submissionMethod",
    "automaticResubmissionAllowed", "existingDataChanged", "createdSubmission", "reusedSubmission", "applicationSubmissionAttempted"]
    .map(key => [key, value[key]]));
}

export async function prepareProductionHealthCheckRun({ request, env, git, now = Date.now(), fetchImpl = fetch,
  prepareImpl = prepareProductionHealthCheckSmoke, onEvidence = async () => {} }) {
  const adapterRequest = validateProductionHealthCheckRequest(request, env, git, now);
  await onEvidence({ stage: "checking_production_without_database_writes", requestId: adapterRequest.requestId,
    sourceCommit: git.head, productionVersion: EXPECTED_PRODUCTION_VERSION_ID, requestFingerprint: fingerprint(request),
    notificationRouting: routingFor(adapterRequest), recipientValueVerified: false,
    automaticResubmissionAllowed: false, databaseWriteStatus: "not_attempted", applicationSubmissionStatus: "not_attempted" });
  const prepared = checkedPrepared(await prepareImpl({ request: adapterRequest, env, fetchImpl }), adapterRequest);
  await onEvidence({ stage: "production_readonly_preflight_verified", preflightState: prepared.state,
    notificationRouting: routingFor(adapterRequest), internalRecipientBindingPresent: true,
    recipientValueVerified: routingFor(adapterRequest) === STRICT_NOTIFICATION_ROUTING, participantEmails: 0 });
  check(prepared.state !== "reserved_attempt_requires_verification", "production_healthcheck_prior_attempt_requires_readonly_reconciliation");
  return { kind: CHECKPOINT_KIND, observedAt: new Date(now).toISOString(), sourceCommit: git.head,
    requestFingerprint: fingerprint(request), state: prepared.state, adapterCheckpoint: prepared.checkpoint };
}

export async function executeProductionHealthCheckRun({ request, env, git, checkpoint, now = Date.now(), fetchImpl = fetch,
  prepareImpl = prepareProductionHealthCheckSmoke, runImpl = runProductionHealthCheckSmoke, onEvidence = async () => {} }) {
  const adapterRequest = validateProductionHealthCheckRequest(request, env, git, now);
  const age = now - Date.parse(checkpoint?.observedAt);
  check(checkpoint?.kind === CHECKPOINT_KIND && checkpoint.sourceCommit === git.head &&
    checkpoint.requestFingerprint === fingerprint(request) && ["ready", "existing_submission"].includes(checkpoint.state) &&
    Number.isFinite(age) && age >= 0 && age <= 15 * 60 * 1000, "production_healthcheck_preflight_missing_changed_or_stale");
  const previous = checkedAdapterCheckpoint(checkpoint.adapterCheckpoint, adapterRequest);
  const current = checkedPrepared(await prepareImpl({ request: adapterRequest, env, fetchImpl }), adapterRequest);
  check(fingerprint(previous) === fingerprint(current.checkpoint) && checkpoint.state === current.state,
    "production_healthcheck_runtime_or_attempt_changed_after_preflight");
  await onEvidence({ stage: current.state === "ready" ? "entering_durable_single_attempt" : "reconciling_existing_submission_readonly",
    requestId: adapterRequest.requestId, sourceCommit: git.head, productionVersion: EXPECTED_PRODUCTION_VERSION_ID,
    requestFingerprint: fingerprint(request), automaticResubmissionAllowed: false,
    notificationRouting: routingFor(adapterRequest), internalRecipientBindingPresent: true,
    recipientValueVerified: routingFor(adapterRequest) === STRICT_NOTIFICATION_ROUTING,
    databaseWriteStatus: current.state === "ready" ? "may_have_occurred" : "not_attempted",
    applicationSubmissionStatus: current.state === "ready" ? "may_have_occurred" : "not_attempted" });
  // The library alone owns the unique D1 reservation and normal website POST.
  // It never retries a prior reserved attempt, including a browser reservation.
  const proof = checkedProof(await runImpl({ request: adapterRequest, env, fetchImpl }), adapterRequest);
  await onEvidence({ stage: "production_healthcheck_verified", proof, automaticResubmissionAllowed: false,
    databaseWriteStatus: proof.createdSubmission ? "verified_synthetic_only" : "read_only_reconciliation",
    applicationSubmissionStatus: proof.applicationSubmissionAttempted ? "verified_once" : "not_attempted" });
  return proof;
}

export function productionHealthCheckRunFailure(error) {
  return error instanceof ProductionHealthCheckRunError
    ? { code: error.code, mutationOutcomeUnknown: null, httpStatus: null }
    : productionHealthCheckFailure(error);
}

const gitCommand = args => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
export function readProductionHealthCheckGit(command = gitCommand) {
  try {
    const lineage = command(["rev-list", "--parents", "-n", "1", "HEAD"]).split(/\s+/);
    return { head: lineage[0], parents: lineage.slice(1),
      clean: command(["status", "--porcelain", "--untracked-files=no"]) === "",
      changedPaths: command(["diff", "--name-only", "HEAD^", "HEAD"]).split("\n").filter(Boolean) };
  } catch { throw new ProductionHealthCheckRunError("production_healthcheck_git_history_unavailable"); }
}

const jsonFile = async path => JSON.parse(await readFile(path, "utf8"));
const saveJson = async (path, value) => writeFile(path, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
async function main() {
  const stage = process.argv[2];
  check(["validate", "preflight", "submit"].includes(stage), "production_healthcheck_stage_invalid");
  const request = await jsonFile(REQUEST_PATH), git = readProductionHealthCheckGit();
  validateProductionHealthCheckRequest(request, process.env, git);
  if (stage === "validate") {
    console.log("Exact production Health Check request and reviewed parent verified. No provider request or database write.");
    return;
  }
  let report = { requestId: HEALTHCHECK_REQUEST_ID, sourceCommit: git.head, productionVersion: EXPECTED_PRODUCTION_VERSION_ID,
    notificationRouting: routingFor(request), recipientValueVerified: false,
    stage: "starting", automaticResubmissionAllowed: false, databaseWriteStatus: "not_attempted", applicationSubmissionStatus: "not_attempted" };
  const onEvidence = async update => { report = { ...report, ...update }; await saveJson(REPORT_PATH, report); };
  try {
    const inputs = { request, env: process.env, git, onEvidence };
    if (stage === "preflight") await saveJson(CHECKPOINT_PATH, await prepareProductionHealthCheckRun(inputs));
    else await executeProductionHealthCheckRun({ ...inputs, checkpoint: await jsonFile(CHECKPOINT_PATH) });
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    await onEvidence({ stopped: true, automaticResubmissionAllowed: false, readOnlyReconciliationRequired: true,
      failure: productionHealthCheckRunFailure(error) });
    console.log(JSON.stringify(report, null, 2)); process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch(() => { console.error("Production Health Check stopped. Inspect sanitized evidence; do not resubmit an uncertain attempt."); process.exitCode = 1; });

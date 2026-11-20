// Inert until a separate request-only push supplies reviewed REAL acceptance.
// No acceptance/request fixture is created by this runner or its workflow.
// Existing D1/Access version only: one inactive env PATCH, then verified
// activation. No code upload, Access mutation, D1 write, mail or forced retry.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, open, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ACCOUNT, fingerprint } from "./qa-retirement-release.mjs";
import { inspectProductionAccess } from "./production-retirement-access-apply.mjs";
import { UPLOAD_EVIDENCE_PATH, verifyOriginalSourceHistory } from "./production-retirement-activate-existing.mjs";
import { LEGACY_SUPABASE_BINDINGS, prepareProductionBindingCleanup,
  createProductionBindingCleanupVersion, activateProductionBindingCleanup } from "./production-retirement-binding-cleanup.mjs";
import { STRICT_NOTIFICATION_ROUTING, EXISTING_NOTIFICATION_ROUTING } from "./production-healthcheck-smoke.mjs";

export const CLEANUP_REQUEST_PATH = "scripts/security/production-retirement-cleanup-request.json";
export const CLEANUP_ACCEPTANCE_PATH = "scripts/security/production-retirement-cleanup-acceptance.json";
export const CLEANUP_UI_RECORD_PATH = "docs/SUPABASE_RETIREMENT_PRODUCTION_ACCEPTANCE_2026-11-20.md";
export const CLEANUP_REPORT_PATH = "production-retirement-cleanup-report.json";
export const CLEANUP_REQUEST_ID = "retirement-20261120-production-binding-cleanup-01";
export const EXPECTED_PRODUCTION_VERSION = "9bd890ab-41e1-4845-867c-f6d4eb85196f";
export const EXPECTED_QA_VERSION = "f6076224-8523-4761-8148-69b637e2e542";
export const EXPECTED_ACCESS_APPLICATION_FINGERPRINT = "c0893f8c3ba74096da144abdf86bbd3a4bc28de5aef35a5bf7838d7fa69250ff";
export const EXPECTED_ACCESS_CHECKPOINT_FINGERPRINT = "bb52ef9fcad63bb5e62084bde18617edafeb94d74d64ec8eabc8776c9e4c1d8c";
const EXPECTED_ACCESS_PLAN_FINGERPRINT = "e6e55cdca65458926f5e779888e1ae002a323d1176516c598477c165f2238e42";
const EXPECTED_UPLOAD_EVIDENCE_FINGERPRINT = "6ae0a1c4185b8aae06b123f9ab45a0e66af1db4bf7b6f0c7e9fc6757d29a6c33";
const HEALTH_REQUEST_PATH = "scripts/security/production-healthcheck-smoke-request.json";
const HEALTH_REQUEST_ID = "retirement-20261120-production-healthcheck-01";
const REF = "refs/heads/chore/supabase-retirement-2026-11";
const SHA = /^[a-f0-9]{40}$/, HASH = /^[a-f0-9]{64}$/, UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const UI_CHECKS = ["advisorHealthCheckReadback", "crmFlow", "projectSpaces", "baselineExport", "logout"];
const LIBRARY_STAGES = ["cleanup_patch_requested_outcome_unknown", "cleanup_uploaded_not_verified", "cleanup_verified_not_activated",
  "cleanup_activation_requested_outcome_unknown", "cleanup_activated_verification_pending", "cleanup_verified"];
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const rawHash = value => createHash("sha256").update(value).digest("hex");
const ageWithin = (value, now) => typeof value === "string" && /Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) && now - Date.parse(value) >= 0 && now - Date.parse(value) <= 86400000;

export class ProductionCleanupRunError extends Error {
  constructor(code) { super(code); this.code = code; }
}
const check = (condition, code) => { if (!condition) throw new ProductionCleanupRunError(code); };
function exactFields(value, fields, code) {
  check(object(value) && Object.keys(value).length === fields.length && Object.keys(value).every(key => fields.includes(key)), code);
}

export function validateProductionCleanupInputs({ request, env, git, acceptanceEvidence, uploadEvidence, uiRecord, now = Date.now() }) {
  check(env?.GITHUB_ACTIONS === "true" && env.GITHUB_EVENT_NAME === "push" && env.GITHUB_RUN_ATTEMPT === "1" &&
    env.GITHUB_REPOSITORY === "gvanesch/fractional-hr-site" && env.GITHUB_REF === REF && env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT &&
    !env.CLOUDFLARE_ENV && !env.NEXT_DEV_WRANGLER_ENV && !Object.entries(env).some(([key, value]) => /SUPABASE/i.test(key) && Boolean(value)),
  "cleanup_execution_context_unverified");
  exactFields(request, ["operation", "requestId", "requestedAt", "reviewedCommit", "expectedProductionVersionId", "expectedQaVersionId",
    "expectedAccessApplicationFingerprint", "expectedAccessCheckpointFingerprint", "acceptanceFingerprint"], "cleanup_request_shape_unverified");
  check(request.operation === "remove-reviewed-supabase-bindings-from-production" && request.requestId === CLEANUP_REQUEST_ID &&
    ageWithin(request.requestedAt, now) && SHA.test(request.reviewedCommit) &&
    request.expectedProductionVersionId === EXPECTED_PRODUCTION_VERSION && request.expectedQaVersionId === EXPECTED_QA_VERSION &&
    request.expectedAccessApplicationFingerprint === EXPECTED_ACCESS_APPLICATION_FINGERPRINT &&
    request.expectedAccessCheckpointFingerprint === EXPECTED_ACCESS_CHECKPOINT_FINGERPRINT && HASH.test(request.acceptanceFingerprint),
  "cleanup_reviewed_request_invalid_or_stale");
  check(git?.clean === true && SHA.test(git.head ?? "") && git.head === env.GITHUB_SHA && git.parents?.length === 1 &&
    git.parents[0] === request.reviewedCommit && git.changedPaths?.length === 1 && git.changedPaths[0] === CLEANUP_REQUEST_PATH,
  "cleanup_requires_request_only_reviewed_parent");
  check(object(uploadEvidence) && fingerprint(uploadEvidence) === EXPECTED_UPLOAD_EVIDENCE_FINGERPRINT &&
    fingerprint(uploadEvidence.recordedReport?.access) === EXPECTED_ACCESS_CHECKPOINT_FINGERPRINT &&
    uploadEvidence.recordedReport.access.stage === "verified" && uploadEvidence.recordedReport.access.applicationFingerprint === EXPECTED_ACCESS_APPLICATION_FINGERPRINT &&
    uploadEvidence.recordedReport.access.planFingerprint === EXPECTED_ACCESS_PLAN_FINGERPRINT &&
    object(uploadEvidence.originalRequest?.accessRecovery?.originalRequest), "cleanup_original_access_ownership_unverified");

  // This file is deliberately absent until the production test and UI work
  // finish. A ready flag or the partial UI record cannot substitute for proof.
  exactFields(acceptanceEvidence, ["kind", "acceptedAt", "productionVersionId", "qaVersionId", "accessApplicationFingerprint",
    "accessPlanFingerprint", "healthCheck", "ui"], "cleanup_acceptance_evidence_missing_or_invalid");
  const acceptance = acceptanceEvidence, health = acceptance.healthCheck, ui = acceptance.ui;
  check(fingerprint(acceptance) === request.acceptanceFingerprint && acceptance.kind === "production-d1-access-acceptance-evidence" &&
    ageWithin(acceptance.acceptedAt, now) && Date.parse(acceptance.acceptedAt) <= Date.parse(request.requestedAt) &&
    acceptance.productionVersionId === EXPECTED_PRODUCTION_VERSION && acceptance.qaVersionId === EXPECTED_QA_VERSION &&
    acceptance.accessApplicationFingerprint === EXPECTED_ACCESS_APPLICATION_FINGERPRINT && acceptance.accessPlanFingerprint === EXPECTED_ACCESS_PLAN_FINGERPRINT,
  "cleanup_exact_production_acceptance_unverified");
  exactFields(health, ["workflowRunId", "report"], "cleanup_healthcheck_evidence_invalid");
  const report = health.report, proof = report?.proof;
  // This is a reviewed receipt copied from a genuine completed workflow
  // artifact, not an independent GitHub execution attestation. Its whole value
  // must exist in the reviewed parent and match the later request fingerprint.
  // Root must retrieve the real artifact before writing the acceptance file.
  check(/^[1-9][0-9]{5,19}$/.test(health.workflowRunId ?? "") && report?.stage === "production_healthcheck_verified" && report.stopped !== true &&
    SHA.test(report.sourceCommit ?? "") && HASH.test(report.requestFingerprint ?? "") && report.requestId === HEALTH_REQUEST_ID &&
    report.productionVersion === EXPECTED_PRODUCTION_VERSION && proof?.requestId === HEALTH_REQUEST_ID && proof.productionVersion === EXPECTED_PRODUCTION_VERSION &&
    proof.d1WriteVerified === true && proof.publicResultVerified === true && proof.insertEventVerified === true &&
    proof.advisorEmailProviderAccepted === true && proof.internalNotificationStatus === "provider_accepted" &&
    proof.participantEmails === 0 && proof.existingDataChanged === false && proof.automaticResubmissionAllowed === false &&
    proof.internalRecipientBindingPresent === true && [STRICT_NOTIFICATION_ROUTING, EXISTING_NOTIFICATION_ROUTING].includes(proof.notificationRouting) &&
    proof.recipientValueVerified === (proof.notificationRouting === STRICT_NOTIFICATION_ROUTING),
  "cleanup_completed_production_healthcheck_proof_required");
  exactFields(ui, ["observedAt", "recordSha256", "checks"], "cleanup_ui_evidence_invalid");
  exactFields(ui.checks, UI_CHECKS, "cleanup_complete_ui_checks_required");
  check(ageWithin(ui.observedAt, now) && Date.parse(ui.observedAt) <= Date.parse(acceptance.acceptedAt) &&
    HASH.test(ui.recordSha256 ?? "") && typeof uiRecord === "string" && uiRecord.length > 0 && rawHash(uiRecord) === ui.recordSha256,
  "cleanup_reviewed_ui_record_unverified");
  check(!/partial acceptance only/i.test(uiRecord) && !/^\|[^\n]*\|\s*Pending\s*\|\s*$/im.test(uiRecord), "cleanup_ui_record_still_partial");
  for (const name of UI_CHECKS) {
    exactFields(ui.checks[name], ["status", "recordSection"], "cleanup_complete_ui_checks_required");
    const item = ui.checks[name];
    check(item.status === "passed" && typeof item.recordSection === "string" && item.recordSection.trim().length >= 3 &&
      item.recordSection.length <= 160 && uiRecord.split("\n").some(line => /^#{1,6} /.test(line) && line.replace(/^#{1,6} /, "").trim() === item.recordSection),
    "cleanup_ui_check_not_passed_or_unrecorded");
    // Each marker may be added only after the actual UI observation. A JSON
    // 'passed' declaration cannot promote an existing partial Markdown record.
    check(uiRecord.split("\n").includes(`<!-- production-cleanup-check:${name}:passed:${EXPECTED_PRODUCTION_VERSION}:${ui.observedAt} -->`),
      "cleanup_ui_completion_marker_missing");
  }
  // Build the library input explicitly. No caller-provided ready booleans,
  // executable options, environment values or alternative targets are spread.
  return { kind: "accepted-production-d1-access", acceptedAt: acceptance.acceptedAt,
    productionVersionId: EXPECTED_PRODUCTION_VERSION, qaVersionId: EXPECTED_QA_VERSION,
    accessPlanFingerprint: EXPECTED_ACCESS_PLAN_FINGERPRINT, accessApplicationFingerprint: EXPECTED_ACCESS_APPLICATION_FINGERPRINT,
    healthD1Connected: proof.d1WriteVerified, healthSupabaseNotRequired: true, healthCheckD1WriteReadVerified: proof.publicResultVerified,
    advisorFlowVerified: ui.checks.advisorHealthCheckReadback.status === "passed", crmFlowVerified: ui.checks.crmFlow.status === "passed",
    projectSpacesVerified: ui.checks.projectSpaces.status === "passed", baselineFlowVerified: ui.checks.baselineExport.status === "passed",
    logoutVerified: ui.checks.logout.status === "passed" };
}

const gitCommand = args => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
export function readProductionCleanupGit(command = gitCommand) {
  try {
    const lineage = command(["rev-list", "--parents", "-n", "1", "HEAD"]).split(/\s+/);
    return { head: lineage[0], parents: lineage.slice(1), clean: command(["status", "--porcelain", "--untracked-files=no"]) === "",
      changedPaths: command(["diff", "--name-only", "HEAD^", "HEAD"]).split("\n").filter(Boolean) };
  } catch { throw new ProductionCleanupRunError("cleanup_git_history_unavailable"); }
}

export function verifyCleanupSourceHistory({ request, acceptanceEvidence, uploadEvidence, uiRecord }, command = gitCommand, now = Date.now()) {
  try {
    // File presence in reviewed Git history is mandatory. Untracked local files
    // must not enable execution even if the tracked working tree is clean.
    for (const [path, expected] of [[CLEANUP_REQUEST_PATH, request], [CLEANUP_ACCEPTANCE_PATH, acceptanceEvidence], [UPLOAD_EVIDENCE_PATH, uploadEvidence]])
      check(fingerprint(JSON.parse(command(["show", `HEAD:${path}`]))) === fingerprint(expected), "cleanup_record_not_committed");
    check(rawHash(command(["show", `HEAD:${CLEANUP_UI_RECORD_PATH}`]).trimEnd()) === rawHash(uiRecord.trimEnd()), "cleanup_ui_record_not_committed");
    verifyOriginalSourceHistory(uploadEvidence, command);
    const verifyRequestOnly = (source, path, expected) => {
      check(SHA.test(source ?? ""), "cleanup_evidence_source_invalid");
      command(["merge-base", "--is-ancestor", source, "HEAD"]);
      const original = JSON.parse(command(["show", `${source}:${path}`]));
      const lineage = command(["rev-list", "--parents", "-n", "1", source]).split(/\s+/);
      check(lineage.length === 2 && lineage[0] === source && lineage[1] === original.reviewedCommit &&
        command(["diff", "--name-only", `${source}^`, source]) === path && (!expected || fingerprint(original) === fingerprint(expected)),
      "cleanup_evidence_source_not_request_only");
      return original;
    };
    verifyRequestOnly(uploadEvidence.recordedReport.access.sourceCommit, "scripts/security/production-retirement-release-request.json",
      uploadEvidence.originalRequest.accessRecovery.originalRequest);
    const report = acceptanceEvidence.healthCheck.report;
    const healthRequest = verifyRequestOnly(report.sourceCommit, HEALTH_REQUEST_PATH);
    check(healthRequest.operation === "verify-healthcheck-on-production" && healthRequest.requestId === HEALTH_REQUEST_ID &&
      healthRequest.expectedProductionVersionId === EXPECTED_PRODUCTION_VERSION && fingerprint(healthRequest) === report.requestFingerprint &&
      ageWithin(healthRequest.requestedAt, now) && Date.parse(healthRequest.requestedAt) <= Date.parse(acceptanceEvidence.acceptedAt) &&
      (healthRequest.notificationRouting ?? STRICT_NOTIFICATION_ROUTING) === report.proof.notificationRouting,
    "cleanup_healthcheck_source_does_not_match_proof");
  } catch { throw new ProductionCleanupRunError("cleanup_reviewed_evidence_history_unverified"); }
}

function safeLibraryEvidence(value) {
  check(object(value) && LIBRARY_STAGES.includes(value.stage), "cleanup_evidence_stage_unrecognized");
  const out = { stage: value.stage };
  for (const name of ["previousProductionVersion", "qaVersion", "cleanupVersion", "productionDeploymentId"]) {
    if (value[name] === undefined) continue;
    check(UUID.test(value[name]), "cleanup_evidence_identity_invalid"); out[name] = value[name];
  }
  if (value.removedBindings !== undefined) {
    check(Array.isArray(value.removedBindings) && value.removedBindings.length <= 3 &&
      value.removedBindings.every(name => LEGACY_SUPABASE_BINDINGS.includes(name)), "cleanup_evidence_binding_names_invalid");
    out.removedBindings = [...value.removedBindings];
  }
  for (const name of ["previousVersionUsesSupabaseAuth", "rollbackSecretDifferenceRequiresReview", "rollbackNeverForcedAutomatically",
    "productionTrafficUnchanged", "nonTargetBindingsPreserved", "runtimeCodeAssetsSettingsPreserved", "qaUnchanged", "healthD1Connected", "healthSupabaseNotRequired"]) {
    if (value[name] === undefined) continue;
    check(typeof value[name] === "boolean", "cleanup_evidence_flag_invalid"); out[name] = value[name];
  }
  if (value.assetPreservation !== undefined) out.assetPreservation = {
    basis: "provider-env-only-merge-inheritance-and-readable-metadata-equality", independentAssetContentDigestsVerified: false,
  };
  return out;
}

export async function runProductionCleanup(options) {
  // Snapshot all data before the first async callback. Only explicit test/code
  // callbacks may be injected; files cannot supply execution options.
  const { request, env, git, acceptanceEvidence, uploadEvidence, uiRecord } = structuredClone({
    request: options.request, env: options.env, git: options.git, acceptanceEvidence: options.acceptanceEvidence,
    uploadEvidence: options.uploadEvidence, uiRecord: options.uiRecord,
  });
  const now = options.now ?? Date.now(), accepted = validateProductionCleanupInputs({ request, env, git, acceptanceEvidence, uploadEvidence, uiRecord, now });
  verifyCleanupSourceHistory({ request, acceptanceEvidence, uploadEvidence, uiRecord }, options.gitCommand ?? gitCommand, now);
  check(typeof options.onEvidence === "function", "cleanup_durable_evidence_writer_required");
  const fetchImpl = options.fetchImpl ?? fetch;
  const inputs = { env, accepted, now, fetchImpl, inspectAccess: () => (options.inspectAccessImpl ?? inspectProductionAccess)({
    request: uploadEvidence.originalRequest.accessRecovery.originalRequest, env, checkpoint: uploadEvidence.recordedReport.access, fetchImpl,
  }) };
  let report = { kind: "production-retirement-binding-cleanup-run", requestId: CLEANUP_REQUEST_ID, sourceCommit: git.head,
    acceptanceFingerprint: request.acceptanceFingerprint, productionVersion: EXPECTED_PRODUCTION_VERSION, qaVersion: EXPECTED_QA_VERSION,
    accessCheckpointFingerprint: EXPECTED_ACCESS_CHECKPOINT_FINGERPRINT, stage: "acceptance_and_source_verified", evidence: [],
    healthCheckProvenance: "reviewed-completed-workflow-artifact-receipt", independentGithubExecutionVerified: false,
    automaticMutationRetryAllowed: false, databaseWrites: false, emailsSent: false, codeUploaded: false, accessChanges: false, supabaseShutdownPerformed: false };
  const persist = async update => {
    report = { ...report, ...update };
    try { await options.onEvidence(structuredClone(report)); }
    catch { throw new ProductionCleanupRunError("cleanup_evidence_persistence_failed"); }
  };
  const onEvidence = async value => {
    const safe = safeLibraryEvidence(value);
    await persist({ ...safe, evidence: [...report.evidence, safe] });
  };
  try {
    await persist({});
    const checkpoint = await (options.prepareImpl ?? prepareProductionBindingCleanup)(inputs);
    await persist({ stage: "cleanup_prepared", checkpointFingerprint: fingerprint(checkpoint) });
    const staged = await (options.stageImpl ?? createProductionBindingCleanupVersion)({ ...inputs, checkpoint, onEvidence });
    await persist({ stagedFingerprint: fingerprint(staged) });
    await (options.activateImpl ?? activateProductionBindingCleanup)({ ...inputs, checkpoint, staged, onEvidence });
    check(report.stage === "cleanup_verified", "cleanup_completion_evidence_missing");
    return report;
  } catch (error) {
    const stopped = { stopped: true, readOnlyReconciliationRequired: true,
      failure: { code: error instanceof ProductionCleanupRunError ? error.code : "cleanup_stopped_inspect_last_recorded_stage" } };
    try { await persist(stopped); } catch { /* Last durable stage remains the recovery boundary; never retry. */ }
    throw new ProductionCleanupRunError(stopped.failure.code);
  }
}

const jsonFile = async path => JSON.parse(await readFile(path, "utf8"));
async function saveReport(report) {
  const temporary = `${CLEANUP_REPORT_PATH}.tmp`, handle = await open(temporary, "w", 0o600);
  try { await handle.writeFile(JSON.stringify(report, null, 2) + "\n"); await handle.sync(); }
  finally { await handle.close(); }
  await rename(temporary, CLEANUP_REPORT_PATH);
}
async function main() {
  check(process.argv.length === 3 && ["validate", "execute"].includes(process.argv[2]), "cleanup_cli_stage_invalid");
  const inputs = { request: await jsonFile(CLEANUP_REQUEST_PATH), acceptanceEvidence: await jsonFile(CLEANUP_ACCEPTANCE_PATH),
    uploadEvidence: await jsonFile(UPLOAD_EVIDENCE_PATH), uiRecord: await readFile(CLEANUP_UI_RECORD_PATH, "utf8"),
    env: process.env, git: readProductionCleanupGit() };
  validateProductionCleanupInputs(inputs);
  verifyCleanupSourceHistory(inputs);
  if (process.argv[2] === "validate") {
    console.log("Reviewed cleanup source and completed production acceptance verified; no cloud request made."); return;
  }
  const report = await runProductionCleanup({ ...inputs, onEvidence: saveReport });
  console.log(JSON.stringify(report, null, 2));
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch(() => { console.error("Production binding cleanup stopped; inspect its sanitized evidence and reconcile before any new request."); process.exitCode = 1; });

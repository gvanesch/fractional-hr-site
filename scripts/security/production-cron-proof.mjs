// Inert unless a fresh request-only commit enables the separate workflow.
// Both fixed production handlers return from dryRun=true before constructing
// Resend or writing data. No scheduler, binding, deployment or mail is changed.
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ACCOUNT, PRODUCTION, fingerprint } from "./qa-retirement-release.mjs";
import { CANDIDATE_REF } from "./supabase-retirement-readonly.mjs";

export const REQUEST_PATH = "scripts/security/production-cron-proof-request.json";
export const REPORT_PATH = "production-cron-proof-report.json";
export const PRODUCTION_VERSION = "9bd890ab-41e1-4845-867c-f6d4eb85196f";
export const PROOF_REQUEST_ID = "retirement-20261120-production-cron-proof-01";
const ORIGIN = "https://www.vanesch.uk";
const DEPLOYMENTS = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers/scripts/${PRODUCTION.worker}/deployments`;
const SHA = /^[a-f0-9]{40}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const FIELDS = ["operation", "requestId", "requestedAt", "reviewedCommit", "expectedProductionVersionId"];
const ENDPOINTS = Object.freeze([
  { name: "advisorDigest", path: "/api/advisor-daily-action-digest?dryRun=true",
    counts: ["overdueProspects", "dueTodayProspects", "nextSevenDaysProspects", "noNextActionProspects", "contactFormDiagnostics", "activeProjects"] },
  { name: "clientDiagnosticSummary", path: "/api/client-diagnostic-daily-summary?dryRun=true", counts: ["projectCount"] },
]);
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);

export class ProductionCronProofError extends Error {
  constructor(code, httpStatus = null, postOutcomeUnknown = false) {
    super(code); this.code = code; this.httpStatus = httpStatus; this.postOutcomeUnknown = postOutcomeUnknown;
  }
}
const check = (condition, code) => { if (!condition) throw new ProductionCronProofError(code); };

export function validateProductionCronProofRequest(request, env, git, now = Date.now()) {
  check(env?.GITHUB_ACTIONS === "true" && env.GITHUB_EVENT_NAME === "push" && env.GITHUB_RUN_ATTEMPT === "1" &&
    env.GITHUB_REPOSITORY === "gvanesch/fractional-hr-site" && env.GITHUB_REF === CANDIDATE_REF &&
    env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT, "production_cron_execution_not_authorized");
  const age = now - Date.parse(request?.requestedAt);
  check(object(request) && Object.keys(request).length === FIELDS.length && Object.keys(request).every(key => FIELDS.includes(key)) &&
    request.operation === "verify-production-cron-dry-runs" && request.requestId === PROOF_REQUEST_ID &&
    request.expectedProductionVersionId === PRODUCTION_VERSION && SHA.test(request.reviewedCommit ?? "") &&
    typeof request.requestedAt === "string" && /Z$/.test(request.requestedAt) &&
    Number.isFinite(age) && age >= 0 && age <= 24 * 60 * 60 * 1000,
  "production_cron_request_invalid_or_stale");
  check(SHA.test(git?.head ?? "") && git.head === env.GITHUB_SHA && git.clean === true && git.parents?.length === 1 &&
    git.parents[0] === request.reviewedCommit && git.changedPaths?.length === 1 && git.changedPaths[0] === REQUEST_PATH,
  "production_cron_requires_request_only_reviewed_parent");
}

function sanitizedReply(endpoint, value) {
  const verified = (condition, code) => { if (!condition) throw new ProductionCronProofError(code, null, true); };
  const allowed = ["success", "dryRun", "emailGenerated", ...endpoint.counts,
    ...(endpoint.name === "clientDiagnosticSummary" ? ["message"] : [])];
  verified(object(value) && Object.keys(value).every(key => allowed.includes(key)) && value.success === true && value.dryRun === true &&
    typeof value.emailGenerated === "boolean" && endpoint.counts.every(key => Number.isSafeInteger(value[key]) && value[key] >= 0),
  "production_cron_dry_run_response_unverified");
  verified(endpoint.name === "advisorDigest" ? value.emailGenerated === true : value.emailGenerated === (value.projectCount > 0),
    "production_cron_email_generation_unverified");
  return { success: true, dryRun: true, emailGenerated: value.emailGenerated,
    counts: Object.fromEntries(endpoint.counts.map(key => [key, value[key]])) };
}

export async function runProductionCronProof(options) {
  let captured;
  try { captured = structuredClone({ request: options.request, env: options.env, git: options.git }); }
  catch { throw new ProductionCronProofError("production_cron_inputs_invalid"); }
  const { request, env, git } = captured;
  const { fetchImpl = fetch, onEvidence, now = Date.now() } = options;
  validateProductionCronProofRequest(request, env, git, now);
  check(typeof fetchImpl === "function" && typeof onEvidence === "function", "production_cron_evidence_writer_required");
  check([env.CLOUDFLARE_API_TOKEN, env.DAILY_SUMMARY_ENDPOINT_SECRET].every(value =>
    typeof value === "string" && value.trim().length > 0 && !/[\r\n]/.test(value)), "production_cron_credentials_missing");
  const apiCredential = env.CLOUDFLARE_API_TOKEN.trim(), cronCredential = env.DAILY_SUMMARY_ENDPOINT_SECRET;
  const results = {};
  const base = { requestId: request.requestId, sourceCommit: git.head, requestFingerprint: fingerprint(request),
    productionVersion: PRODUCTION_VERSION, automaticRetryAllowed: false };
  async function emit(value) {
    try { await onEvidence(structuredClone({ ...base, ...value, results })); }
    catch { throw new ProductionCronProofError("production_cron_evidence_persistence_failed"); }
  }
  async function json(url, { method = "GET", credential } = {}) {
    const cronPost = method === "POST";
    check(method === "GET" && [DEPLOYMENTS, `${ORIGIN}/api/health`].includes(url) ||
      cronPost && ENDPOINTS.some(endpoint => url === ORIGIN + endpoint.path), "production_cron_endpoint_forbidden");
    let response;
    try { response = await fetchImpl(url, { method, redirect: "error", signal: AbortSignal.timeout(30000),
      ...(credential ? { headers: { Authorization: `Bearer ${credential}` } } : {}) }); }
    catch { throw new ProductionCronProofError("production_cron_transport_failed_no_retry", null, cronPost); }
    if (response.status !== 200) throw new ProductionCronProofError("production_cron_http_failed_no_retry", response.status, cronPost);
    try { return await response.json(); }
    catch { throw new ProductionCronProofError("production_cron_json_invalid_no_retry", response.status, cronPost); }
  }
  async function lease() {
    const [metadata, health] = await Promise.all([
      json(DEPLOYMENTS, { credential: apiCredential }), json(`${ORIGIN}/api/health`),
    ]);
    const deployment = metadata?.result?.deployments?.[0];
    check(metadata?.success === true && UUID.test(deployment?.id ?? "") && deployment.versions?.length === 1 &&
      deployment.versions[0].version_id === PRODUCTION_VERSION && deployment.versions[0].percentage === 100,
    "production_cron_active_version_unverified");
    check(health?.status === "ok" && health.d1 === "connected" && health.supabase === "not_required",
      "production_cron_independent_d1_health_unverified");
    return fingerprint({ deploymentId: deployment.id, versionId: PRODUCTION_VERSION });
  }
  await emit({ stage: "checking_production_before_dry_runs", cronPostsAttempted: 0 });
  let originalLease, attempts = 0;
  for (const endpoint of ENDPOINTS) {
    // A fresh exact deployment and health check precede every authenticated POST.
    const currentLease = await lease();
    if (originalLease) check(currentLease === originalLease, "production_cron_deployment_changed");
    else originalLease = currentLease;
    await emit({ stage: "dry_run_requested_outcome_unknown", currentCheck: endpoint.name, cronPostsAttempted: attempts + 1 });
    attempts++;
    const value = await json(ORIGIN + endpoint.path, { method: "POST", credential: cronCredential });
    results[endpoint.name] = sanitizedReply(endpoint, value);
    await emit({ stage: "dry_run_verified", currentCheck: endpoint.name, cronPostsAttempted: attempts });
  }
  check(await lease() === originalLease, "production_cron_deployment_changed");
  const report = { ...base, stage: "production_cron_proof_verified", success: true, dryRun: true, results,
    cronPostsAttempted: attempts, productionVersionUnchanged: true, healthD1Connected: true, healthSupabaseNotRequired: true,
    databaseWrites: false, emailsSent: false, deploymentsChanged: false, schedulerConfigurationChanged: false };
  await emit(report);
  return report;
}

export function productionCronProofFailure(error) {
  return error instanceof ProductionCronProofError && /^production_cron_[a-z_]{1,100}$/.test(error.code)
    ? { code: error.code, httpStatus: Number.isInteger(error.httpStatus) && error.httpStatus >= 100 && error.httpStatus <= 599 ? error.httpStatus : null,
      postOutcomeUnknown: error.postOutcomeUnknown === true }
    : { code: "production_cron_unexpected_failure", httpStatus: null, postOutcomeUnknown: null };
}

const gitCommand = args => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
export function readProductionCronProofGit(command = gitCommand) {
  try {
    const lineage = command(["rev-list", "--parents", "-n", "1", "HEAD"]).split(/\s+/);
    return { head: lineage[0], parents: lineage.slice(1), clean: command(["status", "--porcelain", "--untracked-files=no"]) === "",
      changedPaths: command(["diff", "--name-only", "HEAD^", "HEAD"]).split("\n").filter(Boolean) };
  } catch { throw new ProductionCronProofError("production_cron_git_history_unavailable"); }
}

async function main() {
  const stage = process.argv[2];
  check(process.argv.length === 3 && ["validate", "prove"].includes(stage), "production_cron_stage_invalid");
  const request = JSON.parse(await readFile(REQUEST_PATH, "utf8")), git = readProductionCronProofGit();
  validateProductionCronProofRequest(request, process.env, git);
  if (stage === "validate") {
    console.log("Exact production cron dry-run request and reviewed source verified. No provider request made.");
    return;
  }
  let report = { stage: "starting", requestId: PROOF_REQUEST_ID, sourceCommit: git.head, productionVersion: PRODUCTION_VERSION,
    automaticRetryAllowed: false, cronPostsAttempted: 0 };
  const onEvidence = async update => { report = { ...report, ...update };
    await writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 }); };
  try {
    await runProductionCronProof({ request, env: process.env, git, onEvidence });
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    await onEvidence({ stopped: true, automaticRetryAllowed: false, failure: productionCronProofFailure(error) });
    console.log(JSON.stringify(report, null, 2)); process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch(() => { console.error("Production cron dry-run proof stopped. Inspect sanitized evidence; no automatic retry."); process.exitCode = 1; });

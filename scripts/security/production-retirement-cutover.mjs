// Request-gated production cutover. Build first without credentials; then
// create the exact reviewed Access configuration and activate a verified Worker.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, readlink, realpath, writeFile } from "node:fs/promises";
import { resolve, join, relative, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { fingerprint } from "./qa-retirement-release.mjs";
import {
  REQUEST_PATH, CONFIG_PATH, ProductionReleaseError, validateProductionRequest,
  readProductionEligibility, prepareProductionRelease, deployProductionRelease, uploadProductionCandidate,
} from "./production-retirement-release.mjs";
import { createProductionAccess, inspectProductionAccess, AccessApplyError, accessApplyFailure } from "./production-retirement-access-apply.mjs";

export const PREFLIGHT_PATH = "production-retirement-preflight-checkpoint.json";
export const BUILD_PATH = "production-retirement-build-checkpoint.json";
export const ACCESS_PATH = "production-retirement-access-checkpoint.private.json";
export const REPORT_PATH = "production-retirement-cutover-report.json";
const HASH = /^[a-f\d]{64}$/;
const check = (condition, code) => { if (!condition) throw new ProductionReleaseError(code); };

export async function fingerprintBuiltWorker(root = resolve(".open-next")) {
  root = await realpath(root);
  const files = [];
  async function walk(directory, relativePrefix = "") {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(join(directory, entry.name), name);
      else if (entry.isFile()) files.push({ name, type: "file" });
      else if (entry.isSymbolicLink()) {
        const target = await readlink(join(directory, entry.name));
        const resolved = relative(root, await realpath(join(directory, entry.name)));
        check(resolved !== ".." && !resolved.startsWith("../") && !isAbsolute(resolved),
          "Built Worker contains a symlink outside its output directory.");
        files.push({ name, type: "symlink", target, resolved });
      }
      else throw new ProductionReleaseError("Built Worker contains an unsupported filesystem entry.");
      check(files.length <= 50000, "Built Worker exceeds the reviewed file count bound.");
    }
  }
  await walk(root);
  const regularFiles = files.filter(file => file.type === "file").map(file => file.name);
  check(regularFiles.includes("worker.js") && regularFiles.includes("server-functions/default/handler.mjs") &&
    regularFiles.some(name => name.startsWith("assets/")),
  "The complete built Worker and assets are required before Access changes.");
  const hash = createHash("sha256");
  let bytes = 0;
  for (const file of files.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    hash.update(file.type).update("\0").update(file.name).update("\0");
    if (file.type === "symlink") {
      hash.update(file.target).update("\0").update(file.resolved).update("\0");
      continue;
    }
    const body = await readFile(join(root, file.name)); bytes += body.length;
    check(bytes <= 1024 * 1024 * 1024, "Built Worker exceeds the reviewed size bound.");
    hash.update(body).update("\0");
  }
  const server = await readFile(join(root, "server-functions/default/handler.mjs"), "utf8");
  check(["CLOUDFLARE_ACCESS_AUD", "CLOUDFLARE_ACCESS_TEAM_DOMAIN", "ADVISOR_AUTH_MODE"].every(name => server.includes(`process.env.${name}`)),
    "Built advisor authentication must read the production configuration at runtime.");
  return { fingerprint: hash.digest("hex"), fileCount: files.length, bytes };
}

export async function runProductionCutover({ request, env, git, repositoryConfig, preflight, built,
  getBuiltFingerprint = fingerprintBuiltWorker, fetchImpl = fetch, now = Date.now(),
  onEvidence = async () => {}, saveAccessCheckpoint = async () => {}, writeConfig,
  eligibilityImpl = readProductionEligibility, createAccessImpl = createProductionAccess,
  inspectAccessImpl = inspectProductionAccess, prepareImpl = prepareProductionRelease,
  deployImpl = deployProductionRelease, uploadImpl = uploadProductionCandidate }) {
  validateProductionRequest(request, env, git, now);
  const age = now - Date.parse(preflight?.observedAt);
  check(preflight?.sourceCommit === git.head && preflight.requestFingerprint === fingerprint(request) &&
    preflight.eligibility?.eligibleForReviewedAuthChange === true && Number.isFinite(age) && age >= 0 && age <= 60 * 60 * 1000,
  "The read-only production checkpoint is missing, stale or changed.");
  check(built?.sourceCommit === git.head && built.requestFingerprint === fingerprint(request) && HASH.test(built.build?.fingerprint ?? ""),
    "The built Worker does not belong to this reviewed production request.");
  check(fingerprint(await getBuiltFingerprint()) === fingerprint(built.build), "The built Worker changed before the production cutover.");
  check(typeof writeConfig === "function", "The fixed production config writer is required.");
  const verifyWorkerLease = async () => {
    const value = await eligibilityImpl({ env, repositoryConfig,
      expectedProductionVersionId: request.expectedProductionVersionId, expectedQaVersionId: request.expectedQaVersionId, fetchImpl });
    check(fingerprint(value) === fingerprint(preflight.eligibility), "Production or QA changed after the tokenless build preflight.");
    return value;
  };
  await verifyWorkerLease();
  await onEvidence({ stage: "verified_build_and_preflight", requestId: request.requestId, sourceCommit: git.head,
    buildFingerprint: built.build.fingerprint, priorProductionVersion: request.expectedProductionVersionId, qaVersion: request.expectedQaVersionId });
  const accessResult = await createAccessImpl({ request, env, git, verifyWorkerLease, fetchImpl, now,
    onEvidence: report => onEvidence({ stage: "access", access: report }) });
  const access = accessResult?.checkpoint;
  check(access && typeof access === "object", "Access creation did not return its verified reconciliation checkpoint.");
  await saveAccessCheckpoint(access);
  const inspectAccess = () => inspectAccessImpl({ request, env, checkpoint: access, fetchImpl });
  const prepared = await prepareImpl({ request, env, git, repositoryConfig, inspectAccess, fetchImpl, now });
  await writeConfig(prepared.config);
  check(fingerprint(await getBuiltFingerprint()) === fingerprint(built.build), "The built Worker changed after Access creation; activation stopped.");
  return deployImpl({ request, env, git, config: prepared.config, checkpoint: prepared.checkpoint, inspectAccess, fetchImpl,
    uploadImpl, now, onEvidence: report => onEvidence({ stage: "worker", worker: report }) });
}

function readGit() {
  const command = args => execFileSync("git", args, { encoding: "utf8" }).trim();
  check(command(["status", "--porcelain", "--untracked-files=no"]) === "", "Tracked source changed in the production release workspace.");
  return { head: command(["rev-parse", "HEAD"]), parent: command(["rev-parse", "HEAD^"]),
    changedPaths: command(["diff", "--name-only", "HEAD^", "HEAD"]).split("\n").filter(Boolean) };
}
const jsonFile = async path => JSON.parse(await readFile(path, "utf8"));
const saveJson = async (path, value) => writeFile(path, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });

async function main() {
  const stage = process.argv[2];
  check(["preflight", "capture-build", "apply"].includes(stage), "Unknown production cutover stage.");
  const request = await jsonFile(REQUEST_PATH), git = readGit();
  const repositoryConfig = await jsonFile("wrangler.jsonc");
  if (stage === "preflight") {
    validateProductionRequest(request, process.env, git);
    const eligibility = await readProductionEligibility({ env: process.env, repositoryConfig,
      expectedProductionVersionId: request.expectedProductionVersionId, expectedQaVersionId: request.expectedQaVersionId });
    await saveJson(PREFLIGHT_PATH, { observedAt: new Date().toISOString(), sourceCommit: git.head, requestFingerprint: fingerprint(request), eligibility });
    console.log("Production request and runtime preflight passed using GET-only metadata. No cloud changes.");
    return;
  }
  const preflight = await jsonFile(PREFLIGHT_PATH);
  if (stage === "capture-build") {
    check(!process.env.CLOUDFLARE_API_TOKEN && !process.env.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN &&
      !Object.entries(process.env).some(([name, value]) => /SUPABASE/i.test(name) && Boolean(value)),
    "The application build checkpoint must have no Cloudflare token or Supabase environment value.");
    check(preflight.sourceCommit === git.head && git.head === process.env.GITHUB_SHA && preflight.requestFingerprint === fingerprint(request),
      "The tokenless build differs from the source checked by preflight.");
    await saveJson(BUILD_PATH, { sourceCommit: git.head, requestFingerprint: fingerprint(request), build: await fingerprintBuiltWorker() });
    console.log("Production Worker built without provider credentials; runtime auth and complete output fingerprint verified.");
    return;
  }
  let evidence = { requestId: request.requestId, sourceCommit: git.head, stage: "starting", emailSent: false, dataWrites: false };
  const onEvidence = async update => { evidence = { ...evidence, ...update }; await saveJson(REPORT_PATH, evidence); };
  try {
    const report = await runProductionCutover({ request, env: process.env, git, repositoryConfig, preflight,
      built: await jsonFile(BUILD_PATH), onEvidence,
      saveAccessCheckpoint: checkpoint => saveJson(ACCESS_PATH, checkpoint),
      writeConfig: config => saveJson(CONFIG_PATH, config) });
    await onEvidence({ stage: "production_cutover_verified_anonymously", worker: report, authenticatedAcceptanceRequired: true });
    console.log(JSON.stringify(evidence, null, 2));
  } catch (error) {
    await onEvidence({ stopped: true, uncertainMutationsMustBeReconciledBeforeRetry: true,
      ...(error instanceof AccessApplyError ? { accessFailure: accessApplyFailure(error) } : {}),
      failure: error instanceof ProductionReleaseError ? error.message :
        typeof error?.code === "string" && /^[a-z][a-z0-9_]{2,100}$/.test(error.code) ? error.code : "production_cutover_stopped" });
    console.log(JSON.stringify(evidence, null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch(() => { console.error("Production cutover stopped; inspect sanitized evidence before retrying."); process.exitCode = 1; });

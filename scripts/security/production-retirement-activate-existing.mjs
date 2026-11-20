// Activate only the immutable candidate recorded by the stopped upload. This
// runner cannot create Access resources, upload code, send mail or write D1.
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readRecordedProductionCandidate, activateRecordedProductionCandidate, ProductionReleaseError } from "./production-retirement-release.mjs";
import { inspectProductionAccess, AccessApplyError, accessApplyFailure } from "./production-retirement-access-apply.mjs";
import { fingerprint } from "./qa-retirement-release.mjs";

export const ACTIVATION_REQUEST_PATH = "scripts/security/production-retirement-activation-request.json";
export const UPLOAD_EVIDENCE_PATH = "scripts/security/production-retirement-upload-evidence.json";
export const ACTIVATION_CHECKPOINT_PATH = "production-retirement-activation-checkpoint.json";
export const ACTIVATION_REPORT_PATH = "production-retirement-activation-report.json";

export function recordedActivationInputs({ request, env, git, evidence, repositoryConfig, fetchImpl = fetch,
  inspectAccessImpl = inspectProductionAccess }) {
  return { request, env, git, originalRequest: evidence.originalRequest, originalSourceCommit: evidence.originalSourceCommit,
    recordedReport: evidence.recordedReport, originalEligibility: evidence.originalEligibility, repositoryConfig, fetchImpl,
    inspectAccess: () => inspectAccessImpl({ request: evidence.originalRequest.accessRecovery?.originalRequest ?? evidence.originalRequest,
      env, checkpoint: evidence.recordedReport.access, fetchImpl }) };
}

const jsonFile = async path => JSON.parse(await readFile(path, "utf8"));
const saveJson = async (path, value) => writeFile(path, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
const gitCommand = args => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
export function verifyOriginalSourceHistory(evidence, command = gitCommand) {
  try {
    const source = evidence.originalSourceCommit;
    if (!/^[a-f0-9]{40}$/.test(source)) throw new Error();
    command(["merge-base", "--is-ancestor", source, "HEAD"]);
    const original = JSON.parse(command(["show", `${source}:scripts/security/production-retirement-release-request.json`]));
    const paths = command(["diff", "--name-only", `${source}^`, source]).split("\n").filter(Boolean);
    if (fingerprint(original) !== fingerprint(evidence.originalRequest) ||
      command(["rev-parse", `${source}^`]) !== original.reviewedCommit ||
      paths.length !== 1 || paths[0] !== "scripts/security/production-retirement-release-request.json") throw new Error();
  } catch { throw new ProductionReleaseError("The recorded upload does not match the original request-only ancestor commit."); }
}
function readGit() {
  const command = gitCommand;
  if (command(["status", "--porcelain", "--untracked-files=no"]) !== "") throw new ProductionReleaseError("Tracked activation source changed.");
  return { head: command(["rev-parse", "HEAD"]), parent: command(["rev-parse", "HEAD^"]),
    changedPaths: command(["diff", "--name-only", "HEAD^", "HEAD"]).split("\n").filter(Boolean) };
}

async function main() {
  if (process.env.GITHUB_RUN_ATTEMPT !== "1") throw new ProductionReleaseError("A previously attempted activation workflow cannot be rerun; reconcile its outcome first.");
  const stage = process.argv[2];
  if (!["preflight", "activate"].includes(stage)) throw new ProductionReleaseError("Unknown recorded-activation stage.");
  const request = await jsonFile(ACTIVATION_REQUEST_PATH), git = readGit();
  const evidence = await jsonFile(UPLOAD_EVIDENCE_PATH);
  verifyOriginalSourceHistory(evidence);
  const inputs = recordedActivationInputs({ request, env: process.env, git, evidence, repositoryConfig: await jsonFile("wrangler.jsonc") });
  let report = { requestId: request.requestId, sourceCommit: git.head, stage: "starting", access: evidence.recordedReport.access,
    dataWrites: false, emailsSent: false, codeUploaded: false, accessResourcesCreated: false };
  const onEvidence = async update => { report = { ...report, ...update }; await saveJson(ACTIVATION_REPORT_PATH, report); };
  try {
    if (stage === "preflight") {
      const checkpoint = await readRecordedProductionCandidate(inputs);
      await saveJson(ACTIVATION_CHECKPOINT_PATH, checkpoint);
      await onEvidence({ stage: "recorded_candidate_reconciled", checkpoint });
    } else {
      const result = await activateRecordedProductionCandidate({ ...inputs, checkpoint: await jsonFile(ACTIVATION_CHECKPOINT_PATH), onEvidence });
      await onEvidence({ stage: "production_activation_verified_anonymously", worker: result, authenticatedAcceptanceRequired: true });
    }
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    await onEvidence({ stopped: true, automaticMutationRetryAllowed: false,
      ...(error instanceof AccessApplyError ? { accessFailure: accessApplyFailure(error) } : {}),
      failure: error instanceof ProductionReleaseError ? error.message : "recorded_activation_stopped" });
    console.log(JSON.stringify(report, null, 2)); process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch(() => { console.error("Recorded activation stopped; inspect sanitized evidence before any retry."); process.exitCode = 1; });

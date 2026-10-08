// GET/SELECT-only guard. Deployment is a separate, approval-gated workflow step.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { validateReleaseConfig } from "./prepare-approved-production-release.mjs";

const account = "73221f18acc676e4992c89fcbf2b2a8f";
const database = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc";
const worker = "fractional-hr-site";
export const activationFlags = ["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"].map(name => `D1_${name}_MODE`);
const source = "qxddddhhpfrrxbaunwfw";
const markerPath = "scripts/d1/production-activation-approval.json";
const snapshotPaths = ["scripts/d1/production-source-manifest.json", "scripts/d1/production-client-source-manifest.json"];
const emptyTables = ["client_projects", "client_participants", "client_responses", "client_dimension_scores", "client_fact_packs", "client_functional_signal_requests", "client_service_access_context", "client_participant_otp_challenges", "client_participant_verified_sessions"];
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function validateActivationApproval(approval, env, now = Date.now()) {
  const age = now - Date.parse(approval?.confirmedAt);
  if (env.GITHUB_REPOSITORY !== "gvanesch/fractional-hr-site" || env.GITHUB_REF !== "refs/heads/migration/d1" || env.CLOUDFLARE_ACCOUNT_ID !== account ||
      approval?.approvedBy !== "Greg van Esch" || approval.scope !== "production-d1-activation-retain-password-auth-only" ||
      approval.accountId !== account || approval.databaseId !== database || approval.worker !== worker ||
      approval.reviewedCommit !== env.ACTIVATION_PREVIOUS_SHA || !/^[a-f0-9]{40}$/.test(approval.reviewedCommit ?? "") ||
      !/^[a-f0-9-]{36}$/.test(approval.expectedDeploymentId ?? "") ||
      !Number.isSafeInteger(approval.bundleRunId) || approval.bundleRunId < 1 ||
      !Number.isSafeInteger(approval.bundleArtifactId) || approval.bundleArtifactId < 1 ||
      !/^sha256:[a-f0-9]{64}$/.test(approval.bundleDigest ?? "") ||
      approval.sourceVerification !== "fresh-connector-snapshot" || approval.excludeExpiredRateLimits !== true ||
      !Number.isFinite(age) || age < 0 || age > 24 * 60 * 60 * 1000)
    throw new Error("Exact, current D1 activation approval is unavailable.");
}

export function validateActivationDiff(parent, changed, approval) {
  const allowed = new Set([markerPath, ...snapshotPaths]);
  if (parent !== approval.reviewedCommit || !changed.includes(markerPath) || changed.some(path => !allowed.has(path)))
    throw new Error("Activation commit changes code or differs from the reviewed parent.");
}

export function validateSourceSnapshots(historical, client, now = Date.now(), maxAge = 15 * 60 * 1000) {
  for (const snapshot of [historical, client]) {
    const age = now - Date.parse(snapshot?.generatedAt);
    if (snapshot?.source !== source || !Number.isFinite(age) || age < 0 || age > maxAge)
      throw new Error("Fresh production source snapshots are required.");
  }
  if (Object.keys(historical.tables ?? {}).sort().join() !== ["system_events", "diagnostic_submissions", "advisor_prospects", "health_check_prospects", "advisor_prospect_activity", "health_check_prospect_activity"].sort().join() ||
      Object.values(historical.tables).some(table => !Number.isInteger(table.count) || table.count < 0 || !/^[a-f0-9]{64}$/.test(table.hash ?? "")))
    throw new Error("Historical source snapshot is incomplete.");
  if (emptyTables.some(table => client.tables?.[table] !== 0) ||
      !Number.isInteger(client.expiredRateLimits?.count) || client.expiredRateLimits.count < 0 ||
      client.expiredRateLimits.activeBlocks !== 0 || client.expiredRateLimits.recentWindows !== 0)
    throw new Error("Client source data or active security state requires a separately reviewed transfer.");
}

export function bindingFingerprint(bindings) {
  return digest([...bindings.values()].filter(binding => !activationFlags.includes(binding.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(binding => Object.fromEntries(Object.entries(binding).sort(([a], [b]) => a.localeCompare(b)))));
}

export async function verifyActivationBundle(approval, token, fetchImpl = fetch) {
  if (!token) throw new Error("GitHub artifact inspection credential is unavailable.");
  const base = "https://api.github.com/repos/gvanesch/fractional-hr-site/actions/runs/" + approval.bundleRunId;
  async function get(url) {
    const response = await fetchImpl(url, {headers: {Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json"}, signal: AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error("Reviewed bundle metadata is unavailable.");
    return response.json();
  }
  const run = await get(base);
  const artifacts = await get(base + "/artifacts");
  const artifact = artifacts.artifacts?.find(item => item.id === approval.bundleArtifactId);
  if (run.head_sha !== approval.reviewedCommit || run.head_branch !== "migration/d1" || run.event !== "push" ||
      run.path !== ".github/workflows/d1-prod-activation-readiness.yml" || run.repository?.full_name !== "gvanesch/fractional-hr-site" ||
      run.status !== "completed" || run.conclusion !== "success" ||
      artifact?.name !== "approved-d1-production-bundle" || artifact.expired !== false || artifact.digest !== approval.bundleDigest)
    throw new Error("Bundle is not the successful, exact reviewed production build.");
}

export function validateActivationSettings(config, bindings, env, deployed = false) {
  const expected = deployed ? "d1" : "off";
  if (activationFlags.some(name => bindings.get(name)?.type !== "plain_text" || bindings.get(name)?.text !== expected))
    throw new Error("Live D1 flags differ from the required activation checkpoint.");
  if (activationFlags.some(name => !["off", "d1"].includes(config.vars?.[name])) ||
      new Set(activationFlags.map(name => config.vars[name])).size !== 1)
    throw new Error("Local activation flags are mixed or invalid.");
  const offBindings = new Map(bindings);
  for (const name of activationFlags) offBindings.set(name, { name, type: "plain_text", text: "off" });
  validateReleaseConfig({ ...config, vars: { ...config.vars, ...Object.fromEntries(activationFlags.map(name => [name, "off"])) } }, offBindings, env);
  if ((bindings.get("DB")?.id ?? bindings.get("DB")?.database_id) !== database ||
      bindings.get("NEXT_PUBLIC_APP_ENV")?.text !== "production" ||
      bindings.get("NEXT_PUBLIC_SUPABASE_URL")?.text !== `https://${source}.supabase.co` ||
      bindings.get("NEXT_PUBLIC_SITE_URL")?.text !== "https://vanesch.uk")
    throw new Error("Production identity or public configuration differs.");
}

export async function inspectActivation({ env, config, fetchImpl = fetch, deployed = false }) {
  if (env.GITHUB_REF !== "refs/heads/migration/d1" || env.GITHUB_REPOSITORY !== "gvanesch/fractional-hr-site" ||
      env.CLOUDFLARE_ACCOUNT_ID !== account || !env.CLOUDFLARE_API_TOKEN?.trim())
    throw new Error("Configured production inspection target is unavailable.");
  async function get(path) {
    const response = await fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${worker}/${path}`, {
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN.trim()}` }, signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Production metadata read failed.");
    const body = await response.json();
    if (!body.success) throw new Error("Production metadata read failed.");
    return body.result;
  }
  const settings = await get("settings");
  const secrets = await get("secrets");
  const schedules = await get("schedules");
  const deployment = (await get("deployments"))?.deployments?.[0];
  if (!Array.isArray(settings?.bindings) || !Array.isArray(secrets) ||
      !Array.isArray(schedules?.schedules) || schedules.schedules.length ||
      !/^[a-f0-9-]{36}$/.test(deployment?.id ?? "") || deployment.versions?.length !== 1 ||
      deployment.versions[0].percentage !== 100 || !/^[a-f0-9-]{36}$/.test(deployment.versions[0].version_id ?? ""))
    throw new Error("Production deployment or schedule inventory is unexpected.");
  const bindings = new Map(settings.bindings.map(binding => [binding.name, binding]));
  for (const secret of secrets) if (!bindings.has(secret.name)) bindings.set(secret.name, { name: secret.name, type: "secret_text" });
  validateActivationSettings(config, bindings, env, deployed);
  return { deploymentId: deployment.id, versions: deployment.versions, bindingFingerprint: bindingFingerprint(bindings) };
}

async function main() {
  const checkOnly = process.argv.includes("--check-only");
  const verifyOnly = process.argv.includes("--verify-only");
  const recheck = process.argv.includes("--recheck");
  if ([checkOnly, verifyOnly, recheck].filter(Boolean).length > 1) throw new Error("Invalid guard mode.");
  const configUrl = new URL("../../wrangler.jsonc", import.meta.url);
  const config = JSON.parse(await readFile(configUrl, "utf8"));
  const snapshot = JSON.parse(await readFile(new URL("./production-source-manifest.json", import.meta.url)));
  const client = JSON.parse(await readFile(new URL("./production-client-source-manifest.json", import.meta.url)));
  let approval;
  if (!checkOnly) {
    approval = JSON.parse(await readFile(new URL("./production-activation-approval.json", import.meta.url)));
    validateActivationApproval(approval, process.env);
    const parent = execFileSync("git", ["rev-parse", "HEAD^"], { encoding: "utf8" }).trim();
    const changed = execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], { encoding: "utf8" }).trim().split("\n");
    validateActivationDiff(parent, changed, approval);
  }
  if (!checkOnly) await verifyActivationBundle(approval, process.env.GH_TOKEN);
  if (!verifyOnly) validateSourceSnapshots(snapshot, client, Date.now(), checkOnly ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000);
  const current = await inspectActivation({ env: process.env, config, deployed: verifyOnly });
  const recoveryUrl = new URL("../../production-activation-recovery.json", import.meta.url);
  if (verifyOnly) {
    const recovery = JSON.parse(await readFile(recoveryUrl, "utf8"));
    if (current.deploymentId === recovery.deploymentId || current.bindingFingerprint !== recovery.bindingFingerprint)
      throw new Error("Activation deployment did not change or unrelated bindings changed.");
    console.log("Production activation verified: all five flags d1; password auth and other bindings preserved.");
    return;
  }
  if (!checkOnly && current.deploymentId !== approval.expectedDeploymentId)
    throw new Error("Production deployment changed since approval.");
  if (recheck) {
    const recovery = JSON.parse(await readFile(recoveryUrl, "utf8"));
    if (current.bindingFingerprint !== recovery.bindingFingerprint)
      throw new Error("Production bindings changed during activation preparation.");
  }
  // Includes two-pass historical row hashes, all new-table schemas and emptiness,
  // foreign-key consistency, disabled live flags, and a recovery-bookmark read.
  execFileSync(process.execPath, [new URL("./prod-readonly-preflight.mjs", import.meta.url).pathname, "--after-schema"], { stdio: "inherit" });
  validateSourceSnapshots(snapshot, client, Date.now(), checkOnly ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000);
  const afterReads = await inspectActivation({ env: process.env, config });
  if (afterReads.deploymentId !== current.deploymentId || afterReads.bindingFingerprint !== current.bindingFingerprint)
    throw new Error("Production changed during the read-only data comparison.");
  if (checkOnly) {
    console.log(`Activation readiness passed; current deployment ${current.deploymentId}. No production mutations performed.`);
    return;
  }
  if (recheck) {
    console.log("Activation prerequisites rechecked immediately before deployment. No production mutations performed.");
    return;
  }
  const bookmarkResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/time_travel/bookmark`, {
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN.trim()}` }, signal: AbortSignal.timeout(15000),
  });
  if (!bookmarkResponse.ok) throw new Error("Recovery bookmark read failed.");
  const bookmark = await bookmarkResponse.json();
  if (!bookmark.success || typeof bookmark.result?.bookmark !== "string" || !bookmark.result.bookmark)
    throw new Error("Recovery bookmark is unavailable.");
  await writeFile(recoveryUrl, JSON.stringify({ worker, accountId: account, databaseId: database, ...current, recoveryBookmark: bookmark.result.bookmark }, null, 2) + "\n", { mode: 0o600 });
  config.account_id = account;
  config.vars = { ...config.vars, NEXT_PUBLIC_APP_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: `https://${source}.supabase.co`, NEXT_PUBLIC_SITE_URL: "https://vanesch.uk", ...Object.fromEntries(activationFlags.map(name => [name, "d1"])) };
  await writeFile(configUrl, JSON.stringify(config, null, 2) + "\n");
  if (process.env.GITHUB_OUTPUT) await writeFile(process.env.GITHUB_OUTPUT, `bundle_run_id=${approval.bundleRunId}\n`, {flag: "a"});
  console.log("Approved activation bundle configuration prepared; existing password auth retained. No production mutations performed.");
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  main().catch(error => {
    const safe = /^(Exact, current|Activation commit|Fresh production|Historical source|Client source|Configured production|GitHub artifact|Reviewed bundle|Bundle is|Live D1|Local activation|Production identity|Production metadata|Production deployment|Production bindings|Production changed|Recovery bookmark|Flags-off release|Required production|Production public|Existing production)/;
    console.error(error instanceof Error && safe.test(error.message) ? error.message : "Production activation guard stopped; inspect prerequisites.");
    console.error("No automatic rollback is permitted after live D1 writes.");
    process.exitCode = 1;
  });

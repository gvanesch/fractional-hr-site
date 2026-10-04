// Prepare a flags-off release only after separate, explicit production approval.
// This script uses GET requests and writes only the CI checkout configuration.
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const account = "73221f18acc676e4992c89fcbf2b2a8f";
const database = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc";
const flags = ["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"].map(name => `D1_${name}_MODE`);
export function validateReleaseApproval(approval, env, now = Date.now()) {
  const age = now - Date.parse(approval?.confirmedAt);
  if (env.GITHUB_REF !== "refs/heads/migration/d1" || env.GITHUB_REPOSITORY !== "gvanesch/fractional-hr-site" ||
      env.CLOUDFLARE_ACCOUNT_ID !== account || approval?.approvedBy !== "Greg van Esch" ||
      approval.scope !== "production-worker-release-flags-off-only" || approval.accountId !== account ||
      approval.worker !== "fractional-hr-site" || approval.databaseId !== database ||
      !/^[a-f0-9-]{36}$/.test(approval.expectedDeploymentId ?? "") ||
      !/^[a-f0-9]{40}$/.test(approval.reviewedCommit ?? "") || approval.reviewedCommit !== env.RELEASE_PREVIOUS_SHA ||
      !Number.isFinite(age) || age < 0 || age > 24 * 60 * 60 * 1000)
    throw new Error("Current, exact flags-off production release approval is unavailable.");
}
export function validateReleaseConfig(config, bindings, env) {
  if (config.name !== "fractional-hr-site" || config.main !== ".open-next/worker.js" || config.keep_vars !== true ||
      config.assets?.binding !== "ASSETS" || config.assets?.directory !== ".open-next/assets" ||
      config.services?.find(item => item.binding === "WORKER_SELF_REFERENCE")?.service !== config.name ||
      config.d1_databases?.find(item => item.binding === "DB")?.database_id !== database ||
      config.env?.qa?.d1_databases?.some(item => item.database_id === database) ||
      (config.vars?.ADVISOR_AUTH_MODE ?? "supabase") !== "supabase" ||
      config.triggers?.crons?.length || config.routes || config.route || config.custom_domains ||
      flags.some(name => config.vars?.[name] !== "off" || (bindings.get(name)?.text ?? "off") !== "off") ||
      (bindings.get("ADVISOR_AUTH_MODE")?.text ?? "supabase") !== "supabase")
    throw new Error("Flags-off release configuration or existing production auth differs.");
  const boundDb = bindings.get("DB");
  if (boundDb && (boundDb.id ?? boundDb.database_id) !== database)
    throw new Error("Existing production DB binding is unexpected.");
  for (const name of ["RESEND_API_KEY", "CLIENT_DIAGNOSTIC_OTP_SECRET", "INVITE_RATE_LIMIT_SALT", "CRON_SECRET", "SUPABASE_SERVICE_ROLE_KEY"])
    if (bindings.get(name)?.type !== "secret_text") throw new Error(`Required production secret binding unavailable: ${name}.`);
  for (const name of ["CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL", "DAILY_SUMMARY_RECIPIENT"])
    if (!bindings.has(name)) throw new Error(`Required production mail configuration unavailable: ${name}.`);
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key || key.length < 30 || /placeholder|example|qa-test/i.test(key))
    throw new Error("Production public Supabase build credential is unavailable; no CI placeholder may be deployed.");
  if (key.startsWith("eyJ")) {
    let claims;
    try { claims = JSON.parse(Buffer.from(key.split(".")[1], "base64url")); } catch { /* fail below */ }
    if (claims?.role !== "anon" || claims?.ref !== "qxddddhhpfrrxbaunwfw")
      throw new Error("Production public Supabase build credential has the wrong role or project.");
  } else if (!key.startsWith("sb_publishable_"))
    throw new Error("Production public Supabase build credential has an unexpected format.");
  const source = bindings.get("NEXT_PUBLIC_SUPABASE_URL");
  if (source?.text && source.text !== "https://qxddddhhpfrrxbaunwfw.supabase.co")
    throw new Error("Existing production source URL differs.");
}
async function main() {
  const approval = JSON.parse(await readFile(new URL("./production-release-approval.json", import.meta.url)));
  validateReleaseApproval(approval, process.env);
  const parent = execFileSync("git", ["rev-parse", "HEAD^"], { encoding: "utf8" }).trim();
  const changed = execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], { encoding: "utf8" }).trim();
  if (parent !== approval.reviewedCommit || changed !== "scripts/d1/production-release-approval.json")
    throw new Error("Approval must be the only change on top of the exact reviewed release.");
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!token) throw new Error("Configured Cloudflare credential is unavailable.");
  async function get(path) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/fractional-hr-site/${path}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Production metadata read failed (HTTP ${response.status}).`);
    const body = await response.json();
    if (!body.success) throw new Error("Production metadata read was unsuccessful.");
    return body.result;
  }
  const settings = await get("settings");
  if (!Array.isArray(settings?.bindings)) throw new Error("Invalid production settings inventory.");
  const schedules = await get("schedules");
  if (!Array.isArray(schedules?.schedules) || schedules.schedules.length)
    throw new Error("Existing production schedules differ; release must not replace them.");
  const bindings = new Map(settings.bindings.map(binding => [binding.name, binding]));
  const secrets = await get("secrets");
  if (!Array.isArray(secrets)) throw new Error("Invalid production secret-name inventory.");
  for (const secret of secrets) if (!bindings.has(secret.name)) bindings.set(secret.name, { name: secret.name, type: "secret_text" });
  const configUrl = new URL("../../wrangler.jsonc", import.meta.url);
  const config = JSON.parse(await readFile(configUrl, "utf8"));
  validateReleaseConfig(config, bindings, process.env);
  if (process.argv.includes("--verify-only")) {
    if ((bindings.get("DB")?.id ?? bindings.get("DB")?.database_id) !== database ||
        bindings.get("NEXT_PUBLIC_APP_ENV")?.text !== "production" ||
        bindings.get("NEXT_PUBLIC_SUPABASE_URL")?.text !== "https://qxddddhhpfrrxbaunwfw.supabase.co" ||
        bindings.get("NEXT_PUBLIC_SITE_URL")?.text !== "https://vanesch.uk")
      throw new Error("Existing production release metadata does not match the approved deployment.");
    console.log("Approved production release bindings verified; all five D1 flags remain off.");
    return;
  }
  const current = (await get("deployments"))?.deployments?.[0];
  if (current?.id !== approval.expectedDeploymentId || !Array.isArray(current?.versions) || !current.versions.length)
    throw new Error("Existing production deployment changed or recovery metadata is unavailable.");
  const recovery = { worker: "fractional-hr-site", accountId: account, deploymentId: current.id,
    versions: current.versions.map(({version_id, percentage}) => ({version_id, percentage})) };
  if (recovery.versions.some(item => !/^[a-f0-9-]{36}$/.test(item.version_id ?? "") || typeof item.percentage !== "number"))
    throw new Error("Existing production recovery version metadata is invalid.");
  await writeFile(new URL("../../production-release-recovery.json", import.meta.url), JSON.stringify(recovery, null, 2) + "\n", {mode: 0o600});
  config.account_id = account;
  config.vars.NEXT_PUBLIC_APP_ENV = "production";
  config.vars.NEXT_PUBLIC_SUPABASE_URL = "https://qxddddhhpfrrxbaunwfw.supabase.co";
  config.vars.NEXT_PUBLIC_SITE_URL = "https://vanesch.uk";
  await writeFile(configUrl, JSON.stringify(config, null, 2) + "\n");
  console.log("Approved flags-off release prepared. Existing production secrets and advisor auth must be preserved. No API writes performed.");
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  main().catch(error => { console.error(error instanceof Error && /^(Current,|Flags-off|Existing production|Required production|Production public|Approval must|Configured Cloudflare|Production metadata|Invalid production)/.test(error.message) ? error.message : "Production release preparation stopped; no deployment permitted."); process.exitCode = 1; });

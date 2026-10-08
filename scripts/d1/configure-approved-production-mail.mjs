// Greg's approval covers only these three production mail settings.
// Use individual secret-binding writes so unrelated bindings are not replaced.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const account = "73221f18acc676e4992c89fcbf2b2a8f";
const worker = "fractional-hr-site";
export const approvedMail = {
  CONTACT_FROM_EMAIL: "notifications@vanesch.uk",
  CONTACT_TO_EMAIL: "info@vanesch.uk",
  DAILY_SUMMARY_RECIPIENT: "greg@vanesch.uk",
};
const flags = ["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"].map(name => `D1_${name}_MODE`);
export function validateMailApproval(approval, env, now = Date.now()) {
  const age = now - Date.parse(approval?.confirmedAt);
  if (env.GITHUB_REF !== "refs/heads/migration/d1" || env.GITHUB_REPOSITORY !== "gvanesch/fractional-hr-site" ||
      env.CLOUDFLARE_ACCOUNT_ID !== account || approval?.approvedBy !== "Greg van Esch" ||
      approval.scope !== "production-three-mail-settings-only" || approval.accountId !== account ||
      approval.worker !== worker || JSON.stringify(approval.values) !== JSON.stringify(approvedMail) ||
      !Number.isFinite(age) || age < 0 || age > 24 * 60 * 60 * 1000)
    throw new Error("Current approval for the exact three production mail settings is unavailable.");
}
export function inspectBindings(settings) {
  if (!Array.isArray(settings?.bindings)) throw new Error("Invalid production binding inventory.");
  const bindings = new Map(settings.bindings.map(item => [item.name, item]));
  if (flags.some(name => (bindings.get(name)?.text ?? "off") !== "off"))
    throw new Error("Production D1 flags changed; stop before further mail configuration.");
  if (!bindings.has("RESEND_API_KEY")) throw new Error("Production email transport binding is missing.");
  const db = bindings.get("DB");
  if (db && (db.id ?? db.database_id) !== "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc")
    throw new Error("Unexpected production DB binding.");
  return bindings;
}
async function main() {
  const approval = JSON.parse(await readFile(new URL("./production-mail-approval.json", import.meta.url)));
  validateMailApproval(approval, process.env);
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!token) throw new Error("Configured Cloudflare credential is unavailable.");
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${worker}`;
  async function request(path, options = {}) {
    const response = await fetch(endpoint + path, {
      ...options, headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Production mail settings request failed (HTTP ${response.status}).`);
    const body = await response.json();
    if (!body.success) throw new Error("Production mail settings request was rejected.");
    return body.result;
  }
  const initial = inspectBindings(await request("/settings"));
  const preservedNames = [...initial.keys()].filter(name => !Object.hasOwn(approvedMail, name));
  for (const [name, text] of Object.entries(approvedMail)) {
    // Recheck on every mutation; no credential values are read or printed.
    inspectBindings(await request("/settings"));
    const result = await request("/secrets", {
      method: "PUT", body: JSON.stringify({name, text, type: "secret_text"}),
    });
    if (result?.name !== name || result?.type !== "secret_text")
      throw new Error("Production mail binding update was not acknowledged.");
    console.log(`${name}: approved value configured`);
  }
  const final = inspectBindings(await request("/settings"));
  for (const name of Object.keys(approvedMail))
    if (final.get(name)?.type !== "secret_text") throw new Error("Configured mail binding is missing after update.");
  for (const name of preservedNames)
    if (JSON.stringify(final.get(name)) !== JSON.stringify(initial.get(name)))
      throw new Error("An unrelated production binding changed; inspect before proceeding.");
  console.log("Only the three approved mail settings were written. Other bindings preserved; all five D1 flags remain off. No application code upload, Access change, data import or email test performed.");
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  main().catch(() => { console.error("Production mail configuration stopped. Inspect acknowledged setting names before retrying; do not retry blindly."); process.exitCode = 1; });

// GET-only production configuration audit. Never print binding values or API bodies.
const account = "73221f18acc676e4992c89fcbf2b2a8f";
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (process.env.GITHUB_REF !== "refs/heads/migration/d1" ||
    process.env.CLOUDFLARE_ACCOUNT_ID !== account || !token)
  throw new Error("Read-only production audit target is not verified.");
async function get(path, optional = false) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`, {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    if (optional) { console.log(`Optional read ${path.split('/')[0]}: unavailable (HTTP ${response.status})`); return null; }
    throw new Error(`Required configuration read failed (HTTP ${response.status}).`);
  }
  const body = await response.json();
  if (!body.success) throw new Error("Configuration read returned an unsuccessful result.");
  return body;
}
const settings = (await get("workers/scripts/fractional-hr-site/settings")).result;
if (!Array.isArray(settings?.bindings)) throw new Error("Invalid Worker settings response.");
const bindings = new Map(settings.bindings.map(binding => [binding.name, binding]));
const secretNames = (await get("workers/scripts/fractional-hr-site/secrets")).result;
if (!Array.isArray(secretNames)) throw new Error("Invalid secret-name inventory response.");
for (const secret of secretNames) if (!bindings.has(secret.name)) bindings.set(secret.name, { name: secret.name, type: "secret_text" });

for (const name of ["ASSETS", "WORKER_SELF_REFERENCE", "DB", "RESEND_API_KEY", "CLIENT_DIAGNOSTIC_OTP_SECRET",
  "INVITE_RATE_LIMIT_SALT", "CRON_SECRET", "ADVISOR_ALLOWED_EMAILS", "CLOUDFLARE_ACCESS_AUD",
  "CLOUDFLARE_ACCESS_TEAM_DOMAIN", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL", "DAILY_SUMMARY_RECIPIENT"])
  console.log(`Binding ${name}: ${bindings.has(name) ? "present" : "MISSING"}`);
for (const name of ["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"]) {
  const mode = bindings.get(`D1_${name}_MODE`)?.text ?? "off";
  if (mode !== "off") throw new Error("Production flags changed; review before release preparation.");
}
const db = bindings.get("DB");
if (db && (db.id ?? db.database_id) !== "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc")
  throw new Error("Unexpected production DB binding.");
console.log("All five production D1 flags are off.");
console.log(`Source URL verified: ${bindings.get("NEXT_PUBLIC_SUPABASE_URL")?.text === "https://qxddddhhpfrrxbaunwfw.supabase.co"}`);
console.log(`Canonical site URL verified: ${bindings.get("NEXT_PUBLIC_SITE_URL")?.text?.replace(/\/$/, "") === "https://vanesch.uk"}`);
console.log(`Production Access auth enabled: ${bindings.get("ADVISOR_AUTH_MODE")?.text === "cloudflare_access"}`);
for (const name of ["RESEND_API_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "DAILY_SUMMARY_URL"])
  console.log(`GitHub release credential/config ${name}: ${Boolean(process.env[name]?.trim()) ? "configured" : "missing"}`);
console.log(`GitHub scheduler credential configured: ${Boolean(process.env.DAILY_SUMMARY_ENDPOINT_SECRET?.trim())}`);
const cron = bindings.get("CRON_SECRET");
console.log(`Worker cron credential type: ${cron?.type === "secret_text" ? "secret; equality cannot be read" : cron ? "non-secret binding; review storage" : "missing"}`);
// Access inventory is optional because the existing deployment token may not grant Access read.
let page = 1, productionApps = [], complete = true;
while (page <= 20) {
  const result = await get(`access/apps?page=${page}&per_page=100`, true);
  if (!result) { complete = false; break; }
  if (!Array.isArray(result.result)) throw new Error("Invalid Access inventory response.");
  productionApps.push(...result.result.filter(app => [app.domain, ...(app.destinations ?? []).map(item => item.uri)]
    .some(domain => typeof domain === "string" && /^(www\.)?vanesch\.uk(?:\/|$)/.test(domain))));
  if (page >= (result.result_info?.total_pages ?? 1)) break;
  page++;
  if (page > 20) complete = false;
}
console.log(`Production Access inventory complete: ${complete}`);
if (complete) {
  console.log(`Production Access applications matching site: ${productionApps.length}`);
  for (const app of productionApps) {
    // Audience is compared in memory; no JWT or secret values are emitted.
    console.log(`Production Access audience matches Worker: ${Boolean(app.aud && app.aud === bindings.get("CLOUDFLARE_ACCESS_AUD")?.text)}`);
    const policies = await get(`access/apps/${encodeURIComponent(app.id)}/policies`, true);
    console.log(`Production Access policies readable: ${Boolean(policies)}`);
    if (policies) console.log(`Production Access allow policy count: ${policies.result.filter(policy => policy.decision === "allow").length}`);
  }
}
const deployments = await get("workers/scripts/fractional-hr-site/deployments", true);
console.log(`Production deployment metadata readable: ${Boolean(deployments)}`);
console.log("Read-only configuration audit complete. No deployment, policy, secret or data was changed.");

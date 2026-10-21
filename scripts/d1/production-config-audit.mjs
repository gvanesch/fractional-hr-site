// GET-only production configuration audit. Never print binding values or API bodies.
import { verifyProductionPublicKey } from "./verify-production-public-key.mjs";
import { readFile } from "node:fs/promises";
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
const rootConfig = JSON.parse(await readFile(new URL("../../wrangler.jsonc", import.meta.url)));
const expectedMode = process.env.PRODUCTION_EXPECTED_D1_MODE ?? rootConfig.vars?.D1_SYSTEM_EVENTS_MODE;
if (!["off", "d1"].includes(expectedMode)) throw new Error("Invalid expected production D1 mode.");
for (const name of ["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"]) {
  const mode = bindings.get(`D1_${name}_MODE`)?.text ?? "off";
  if (mode !== expectedMode) throw new Error("Production flags changed; review before release preparation.");
}
const db = bindings.get("DB");
if (db && (db.id ?? db.database_id) !== "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc")
  throw new Error("Unexpected production DB binding.");
console.log(`All five production D1 flags are ${expectedMode}.`);
console.log(`Source URL verified: ${bindings.get("NEXT_PUBLIC_SUPABASE_URL")?.text === "https://qxddddhhpfrrxbaunwfw.supabase.co"}`);
console.log(`Canonical site URL verified: ${bindings.get("NEXT_PUBLIC_SITE_URL")?.text?.replace(/\/$/, "") === "https://vanesch.uk"}`);
console.log(`Production Access auth enabled: ${bindings.get("ADVISOR_AUTH_MODE")?.text === "cloudflare_access"}`);
for (const name of ["RESEND_API_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "DAILY_SUMMARY_URL"])
  console.log(`GitHub release credential/config ${name}: ${Boolean(process.env[name]?.trim()) ? "configured" : "missing"}`);
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
  await verifyProductionPublicKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log("Production public build credential verified against the production Auth endpoint.");
}
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
const domains = await get("workers/domains", true);
if (domains && Array.isArray(domains.result)) {
  for (const host of ["vanesch.uk", "www.vanesch.uk"])
    console.log(`Production custom domain ${host}: ${domains.result.find(item => item.hostname === host)?.service === "fractional-hr-site" ? "production Worker" : "not matched to production Worker"}`);
}
const deployments = await get("workers/scripts/fractional-hr-site/deployments", true);
console.log(`Production deployment metadata readable: ${Boolean(deployments)}`);
const currentDeployment = deployments?.result?.deployments?.[0];
if (currentDeployment && /^[a-f0-9-]{36}$/.test(currentDeployment.id ?? "")) {
  console.log(`Current production deployment identifier: ${currentDeployment.id}`);
  for (const version of currentDeployment.versions ?? [])
    if (/^[a-f0-9-]{36}$/.test(version.version_id ?? "") && typeof version.percentage === "number")
      console.log(`Current production version identifier: ${version.version_id}; traffic ${version.percentage}%`);
}
const inventory = await get("workers/scripts", true);
const worker = inventory?.result?.find(script => script.id === "fractional-hr-site");
if (worker?.tag) {
  const triggers = await get(`builds/workers/${encodeURIComponent(worker.tag)}/triggers`, true);
  console.log(`Production build integration readable: ${Boolean(triggers)}`);
  if (triggers) {
    if (!Array.isArray(triggers.result)) throw new Error("Invalid build trigger inventory.");
    console.log(`Production build trigger count: ${triggers.result.length}`);
    for (const trigger of triggers.result) {
      console.log(`Build trigger includes main explicitly: ${trigger.branch_includes?.includes("main") === true}`);
      console.log(`Build trigger has deployment command: ${Boolean(trigger.deploy_command)}`);
      // Values may contain secrets. Only report known environment-variable names and presence.
      for (const name of ["RESEND_API_KEY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL", "CRON_SECRET", "DAILY_SUMMARY_RECIPIENT"])
        console.log(`Build environment ${name}: ${Object.hasOwn(trigger.environment_variables ?? {}, name) ? "present" : "absent"}`);
    }
  }
} else console.log("Production build integration: Worker tag unavailable; not verified.");
if (process.env.PRODUCTION_PAGE_SMOKE === "true") {
  for (const path of ["/", "/advisor/login", "/advisor"]) {
    let url = new URL(path, "https://vanesch.uk"), response, advisorRedirect = false;
    for (let hop = 0; hop < 6; hop++) {
      response = await fetch(url, {redirect: "manual", signal: AbortSignal.timeout(15000)});
      console.log(`Production page response ${path}: HTTP ${response.status}; host ${url.hostname}; challenge ${response.headers.get("cf-mitigated") === "challenge"}`);
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const destination = new URL(response.headers.get("location") ?? "", url);
      if (!["vanesch.uk", "www.vanesch.uk"].includes(destination.hostname) || destination.protocol !== "https:")
        throw new Error("Production page redirected outside the approved site hostnames.");
      if (path === "/advisor" && destination.pathname === "/advisor/login") advisorRedirect = true;
      await response.body?.cancel();
      url = destination;
    }
    if (response.status !== 200 || !response.headers.get("content-type")?.includes("text/html"))
      throw new Error("Production public page did not return HTML successfully.");
    if (path === "/advisor" && (!advisorRedirect || url.pathname !== "/advisor/login"))
      throw new Error("Unauthenticated advisor page did not redirect to the production login page.");
    const body = await response.text();
    if (/Application error: a server-side exception|Internal Server Error/.test(body))
      throw new Error("Production public page reported a server error.");
    if (path === "/advisor/login") {
      const scriptPaths = [...new Set([...body.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]))];
      let loaded = 0, failed = 0, productionSource = false, qaSource = false, passwordHandler = false;
      for (const scriptPath of scriptPaths) {
        const assetUrl = new URL(scriptPath.replaceAll("&amp;", "&"), url);
        if (!["vanesch.uk", "www.vanesch.uk"].includes(assetUrl.hostname)) continue;
        const asset = await fetch(assetUrl, {signal: AbortSignal.timeout(15000)});
        const javascript = asset.status === 200 && /javascript/.test(asset.headers.get("content-type") ?? "");
        if (!javascript) { failed++; console.log(`Production login script failed: HTTP ${asset.status}; path ${assetUrl.pathname}`); await asset.body?.cancel(); continue; }
        loaded++;
        const code = await asset.text();
        productionSource ||= code.includes("qxddddhhpfrrxbaunwfw.supabase.co");
        qaSource ||= code.includes("lrlapaiyejvbckqpbrwa.supabase.co");
        passwordHandler ||= code.includes("signInWithPassword");
      }
      console.log(`Production login JavaScript: ${loaded} loaded; ${failed} failed; password handler present ${passwordHandler}; production source present ${productionSource}; QA source present ${qaSource}`);
      if (!loaded || failed || !passwordHandler || !productionSource || qaSource)
        throw new Error("Production login JavaScript checks failed.");
    }
    console.log(`Production read-only page check ${path}: passed`);
  }
}
console.log("Read-only configuration audit complete. No deployment, policy, secret or data was changed.");

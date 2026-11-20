// Read-only retirement evidence. GET metadata/pages and one fixed SELECT of
// schema names; never export records, print credentials, send mail or deploy.
import { pathToFileURL } from "node:url";

export const ACCOUNT = "73221f18acc676e4992c89fcbf2b2a8f";
export const CANDIDATE_REF = "refs/heads/chore/supabase-retirement-2026-11";
export const TARGETS = Object.freeze({
  production: {
    worker: "fractional-hr-site", database: "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc",
    origin: "https://vanesch.uk", hosts: ["vanesch.uk", "www.vanesch.uk"],
  },
  qa: {
    worker: "fractional-hr-site-qa", database: "b25d59da-5f93-4301-9996-7be0c9708789",
    origin: "https://fractional-hr-site-qa.greg-732.workers.dev",
    hosts: ["fractional-hr-site-qa.greg-732.workers.dev"],
  },
});
export const MODES = ["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"].map(name => `D1_${name}_MODE`);
export const REQUIRED_BINDINGS = [
  "ADVISOR_ALLOWED_EMAILS", "CLOUDFLARE_ACCESS_AUD", "CLOUDFLARE_ACCESS_TEAM_DOMAIN",
  "CLIENT_DIAGNOSTIC_OTP_SECRET", "INVITE_RATE_LIMIT_SALT", "CRON_SECRET", "RESEND_API_KEY",
  "CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL", "DAILY_SUMMARY_RECIPIENT",
];
export const REQUIRED_TABLES = [
  "system_events", "diagnostic_submissions", "advisor_prospects", "advisor_prospect_activity",
  "health_check_prospects", "health_check_prospect_activity", "client_projects", "client_participants",
  "client_responses", "client_dimension_scores", "client_fact_packs", "client_functional_signal_requests",
  "client_service_access_context", "client_diagnostic_invite_rate_limits",
  "client_participant_otp_challenges", "client_participant_verified_sessions",
  "tb_baseline_versions", "tb_baseline_campaigns", "tb_baseline_participants", "tb_baseline_invites",
  "tb_baseline_sessions", "tb_baseline_responses", "tb_baseline_work", "tb_baseline_rate_limits",
  "tb_baseline_audit", "tb_baseline_roster_details", "tb_baseline_broad_work",
  "tb_baseline_verifications", "tb_baseline_answer_copies", "tb_baseline_collection_context",
];
export const SCHEMA_SELECT = "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name";
export const PROTECTED_PATHS = [
  "/advisor", "/advisor/login", "/advisor/health-checks", "/advisor/prospects",
  "/advisor/baseline/api/campaigns", "/api/advisor-project-participants", "/api/advisor-logout",
  "/api/prospect-update", "/api/client-diagnostic-create-project", "/api/client-diagnostic-project-status",
  "/api/client-diagnostic-project-summary", "/api/client-diagnostic-project-update",
  "/api/client-diagnostic-projects", "/api/client-diagnostic-report",
];
// These handlers are POST-only. GET must reject the method at the application
// rather than ask a participant, a prospective client, or cron to sign into Access.
export const PUBLIC_POST_ONLY_PATHS = [
  "/api/contact", "/api/diagnostic-complete", "/api/public-diagnostic-email",
  "/api/client-diagnostic-otp-request", "/api/client-diagnostic-otp-verify", "/api/client-diagnostic-submit",
  "/api/advisor-daily-action-digest", "/api/cron/advisor-daily-action-digest", "/api/client-diagnostic-daily-summary",
];

export function validateContext(env, targetName) {
  if (!Object.hasOwn(TARGETS, targetName) || env.GITHUB_REPOSITORY !== "gvanesch/fractional-hr-site" ||
      env.GITHUB_REF !== CANDIDATE_REF || env.CLOUDFLARE_ACCOUNT_ID !== ACCOUNT ||
      !env.CLOUDFLARE_API_TOKEN?.trim()) throw Error("Retirement read-only context is not verified.");
  return TARGETS[targetName];
}

function bindingMap(settings, secrets) {
  if (!Array.isArray(settings?.bindings) || !Array.isArray(secrets)) throw Error("Invalid binding inventory.");
  const bindings = new Map(settings.bindings.map(b => [b.name, b]));
  for (const s of secrets) if (!bindings.has(s.name)) bindings.set(s.name, { name: s.name, type: "secret_text" });
  return bindings;
}

export function inspectSettings(settings, secrets, target) {
  const bindings = bindingMap(settings, secrets);
  const hasValue = name => bindings.get(name)?.type === "secret_text" || Boolean(bindings.get(name)?.text?.trim());
  const db = bindings.get("DB");
  const report = {
    databaseMatches: (db?.id ?? db?.database_id) === target.database,
    d1Modes: Object.fromEntries(MODES.map(name => [name, bindings.get(name)?.text === "d1"])),
    accessAuthEnabled: bindings.get("ADVISOR_AUTH_MODE")?.text === "cloudflare_access",
    requiredBindings: Object.fromEntries(REQUIRED_BINDINGS.map(name => [name, hasValue(name)])),
    // Presence is reported for cleanup only; retained unused credentials do not prove runtime dependency.
    legacySupabaseBindings: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]
      .filter(name => bindings.has(name)),
    secretValuesInspected: false,
  };
  return { bindings, report };
}

// Conservative inventory matching, not a replacement for Cloudflare's policy
// evaluation. More-specific overlapping apps and policy selectors need review.
// https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
export function matchesDestination(destination, url) {
  if (typeof destination !== "string") return false;
  const raw = destination.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const slash = raw.indexOf("/");
  const hostname = slash < 0 ? raw : raw.slice(0, slash);
  const pathname = slash < 0 ? "" : raw.slice(slash);
  if (hostname.includes("*") || hostname.toLowerCase() !== url.hostname.toLowerCase()) return false;
  if (!pathname || pathname === "/*") return true;
  const escaped = pathname.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*");
  return new RegExp(`^${escaped}${pathname.includes("*") ? "$" : "(?:/|$)"}`).test(url.pathname);
}

function appDestinations(app) {
  return [app.domain, ...(app.self_hosted_domains ?? []), ...(app.destinations ?? []).map(item => item.uri)]
    .filter(value => typeof value === "string");
}

export async function runAudit({ env = process.env, targetName = "production", fetchImpl = fetch } = {}) {
  const target = validateContext(env, targetName);
  const token = env.CLOUDFLARE_API_TOKEN.trim();
  const base = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/`;
  async function api(path, { optional = false, schema = false } = {}) {
    const response = await fetchImpl(base + path, {
      method: schema ? "POST" : "GET", redirect: "error",
      headers: { Authorization: `Bearer ${token}`, ...(schema ? { "Content-Type": "application/json" } : {}) },
      ...(schema ? { body: JSON.stringify({ sql: SCHEMA_SELECT }) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      if (optional) return { unavailable: true, status: response.status };
      throw Error(`Required metadata read failed (HTTP ${response.status}).`);
    }
    const data = await response.json();
    if (!data.success) {
      if (optional) return { unavailable: true, status: response.status };
      throw Error("Required metadata read was rejected.");
    }
    return data;
  }
  const settings = await api(`workers/scripts/${target.worker}/settings`);
  const secrets = await api(`workers/scripts/${target.worker}/secrets`);
  const { bindings, report: config } = inspectSettings(settings.result, secrets.result, target);
  // Target ID is fixed, never taken from a supplied URL or an unverified binding.
  const schema = await api(`d1/database/${target.database}/query`, { schema: true });
  if (schema.result?.[0]?.success !== true || !Array.isArray(schema.result[0].results)) throw Error("Invalid D1 schema read.");
  const tableNames = new Set(schema.result[0].results.map(row => row.name));
  const schemaReport = Object.fromEntries(REQUIRED_TABLES.map(name => [name, tableNames.has(name)]));

  const apps = [];
  let accessReadable = true;
  for (let page = 1; page <= 20; page++) {
    const result = await api(`access/apps?page=${page}&per_page=100`, { optional: true });
    if (result.unavailable) { accessReadable = false; break; }
    if (!Array.isArray(result.result)) throw Error("Invalid Access inventory.");
    apps.push(...result.result.filter(app => appDestinations(app).some(destination =>
      target.hosts.some(host => destination.replace(/^https?:\/\//, "").split("/")[0] === host))));
    if (page >= (result.result_info?.total_pages ?? 1)) break;
    if (page === 20) accessReadable = false;
  }
  const access = { inventoryComplete: accessReadable, matchingApplicationCount: apps.length, applications: [], routes: [] };
  for (const app of apps) {
    if (!/^[a-f\d-]{36}$/i.test(app.id ?? "")) throw Error("Invalid Access application identifier.");
    const policies = await api(`access/apps/${app.id}/policies`, { optional: true });
    const visibleAudience = bindings.get("CLOUDFLARE_ACCESS_AUD")?.type === "plain_text"
      ? bindings.get("CLOUDFLARE_ACCESS_AUD")?.text : undefined;
    access.applications.push({
      // No app ID, audience, identity, include/exclude selector, or secret is emitted.
      index: access.applications.length, audienceMatch: visibleAudience ? app.aud === visibleAudience : "unverifiable_secret",
      policiesReadable: !policies.unavailable,
      allowPolicyCount: Array.isArray(policies.result) ? policies.result.filter(p => p.decision === "allow").length : null,
      bypassPolicyCount: Array.isArray(policies.result) ? policies.result.filter(p => p.decision === "bypass").length : null,
    });
  }
  for (const hostname of target.hosts) {
    for (const path of PROTECTED_PATHS) {
      const matching = apps.map((app, index) => ({ app, index })).filter(({ app }) =>
        appDestinations(app).some(destination => matchesDestination(destination, new URL(`https://${hostname}${path}`))));
      access.routes.push({ hostname, path, candidateApplicationIndexes: matching.map(({ index }) => index) });
    }
  }

  async function getPage(path) {
    let url = new URL(path, target.origin);
    for (let hop = 0; hop < 5; hop++) {
      const response = await fetchImpl(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(15000) });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const next = new URL(response.headers.get("location") ?? "", url);
        await response.body?.cancel();
        if (next.protocol !== "https:" || !target.hosts.includes(next.hostname) ||
            next.pathname.startsWith("/cdn-cgi/access/") || next.pathname === "/advisor/login") {
          return { response: null, status: response.status, externalRedirect: true };
        }
        url = next;
      } else return { response, status: response.status, externalRedirect: false };
    }
    return { response: null, status: null, redirectLimit: true };
  }
  const healthResponse = await getPage("/api/health");
  let health = { httpStatus: healthResponse.status, d1Connected: false, supabaseNotRequired: false };
  if (healthResponse.response?.headers.get("content-type")?.includes("application/json")) {
    const body = await healthResponse.response.json();
    health = { httpStatus: healthResponse.status, d1Connected: body.d1 === "connected", supabaseNotRequired: body.supabase === "not_required" };
  } else await healthResponse.response?.body?.cancel();
  const publicPages = [];
  for (const path of ["/", "/diagnostic", "/diagnostic-assessment"]) {
    const result = await getPage(path);
    const html = result.response?.headers.get("content-type")?.includes("text/html") ?? false;
    const body = html ? await result.response.text() : "";
    if (!html) await result.response?.body?.cancel();
    publicPages.push({ path, httpStatus: result.status, available: result.status === 200 && html &&
      !/Application error: a server-side exception|Internal Server Error/.test(body) });
  }
  const publicApiBoundaries = [];
  for (const path of PUBLIC_POST_ONLY_PATHS) {
    const result = await getPage(path);
    await result.response?.body?.cancel();
    publicApiBoundaries.push({ path, httpStatus: result.status, applicationMethodRejected: result.status === 405 });
  }
  const deployment = await api(`workers/scripts/${target.worker}/deployments`, { optional: true });
  const latest = deployment.result?.deployments?.[0];
  const deployedVersions = (latest?.versions ?? []).filter(v => /^[a-f\d-]{36}$/i.test(v.version_id ?? "") && Number.isFinite(v.percentage))
    .map(v => ({ version: v.version_id, percentage: v.percentage }));
  const blockers = [];
  if (!config.databaseMatches) blockers.push("Worker is not bound to the expected D1 database.");
  if (Object.values(config.d1Modes).some(v => !v)) blockers.push("At least one runtime data mode is not D1.");
  if (!config.accessAuthEnabled) blockers.push("Advisor authentication still requires a non-Access path.");
  if (Object.values(config.requiredBindings).some(v => !v)) blockers.push("One or more required service/auth bindings are missing.");
  if (Object.values(schemaReport).some(v => !v)) blockers.push("One or more required D1 tables are missing.");
  if (!access.inventoryComplete) blockers.push("Access application inventory is not readable with this credential.");
  if (access.routes.some(route => !route.candidateApplicationIndexes.length)) blockers.push("Access application coverage is missing for at least one advisor URL.");
  if (access.applications.some(app => app.audienceMatch === false || !app.policiesReadable || !app.allowPolicyCount || app.bypassPolicyCount))
    blockers.push("Access audience or application policy needs review.");
  if (health.httpStatus !== 200 || !health.d1Connected || !health.supabaseNotRequired) blockers.push("Hosted health does not prove D1 operation without Supabase.");
  if (publicPages.some(page => !page.available)) blockers.push("A public website/Health Check page failed its read-only check.");
  if (publicApiBoundaries.some(route => !route.applicationMethodRejected)) blockers.push("A public participant/Health Check or cron API has an unexpected unauthenticated GET boundary.");
  return {
    target: targetName, observedAt: new Date().toISOString(), config, schema: schemaReport,
    access, health, publicPages, publicApiBoundaries, deployedVersions, blockers,
    readOnlyChecksPassed: blockers.length === 0,
    scope: {
      dataWrites: false, emailSent: false, deploymentsChanged: false, clientRecordsRead: false,
      supabaseDataParityRequired: false,
      authenticatedAdvisorFlowTested: false, healthCheckSubmissionTested: false,
      note: "Configuration evidence only. Complete signed-in advisor and hosted synthetic D1 write/read acceptance before shutdown; secret presence is not value validation.",
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = await runAudit({ targetName: process.argv[2] ?? "production" });
    console.log(JSON.stringify(report, null, 2));
    if (!report.readOnlyChecksPassed) process.exitCode = 1;
  } catch {
    // A thrown transport/API error can include sensitive URLs/bodies. Do not emit it.
    console.error("Retirement audit could not complete its required read-only checks. No mutation was attempted.");
    process.exitCode = 1;
  }
}

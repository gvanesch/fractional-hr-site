// Read-only retirement evidence. GET metadata/pages and one fixed SELECT of
// schema names; never export records, print credentials, send mail or deploy.
import { pathToFileURL } from "node:url";

export const ACCOUNT = "73221f18acc676e4992c89fcbf2b2a8f";
export const EXPECTED_ACCESS_AUTH_DOMAIN = "gregvanesch.cloudflareaccess.com";
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
  "/api/advisor-archive-participant", "/api/advisor-withdraw-participant", "/api/advisor-extend-invite",
  "/api/advisor-reinstate-participant", "/api/advisor-update-participant", "/api/advisor-submission",
  "/api/advisor-create-prospect", "/api/advisor-update-prospect", "/api/advisor-add-prospect-note",
  "/api/advisor-link-health-check-prospect", "/api/advisor-unlink-health-check-prospect",
  "/api/prospect-update", "/api/client-diagnostic-create-project", "/api/client-diagnostic-project-status",
  "/api/client-diagnostic-project-summary", "/api/client-diagnostic-project-update",
  "/api/client-diagnostic-projects", "/api/client-diagnostic-report",
];

// Only our own fixed operation/code labels are exposed when a request fails.
// Transport exceptions and provider error bodies may include credentials.
export class AuditError extends Error {
  constructor(operation, code, httpStatus = null) {
    super(`${operation}: ${code}`);
    this.operation = operation;
    this.code = code;
    this.httpStatus = Number.isInteger(httpStatus) ? httpStatus : null;
  }
}
export function failureReport(error) {
  return {
    readOnlyChecksPassed: false, auditCompleted: false, mutationAttempted: false,
    failure: error instanceof AuditError
      ? { operation: error.operation, code: error.code, httpStatus: error.httpStatus }
      : { operation: "audit", code: "unexpected_failure", httpStatus: null },
  };
}
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
      !env.CLOUDFLARE_API_TOKEN?.trim()) throw new AuditError("context", "context is not verified");
  return TARGETS[targetName];
}

function bindingMap(settings, secrets) {
  if (!Array.isArray(settings?.bindings) || !Array.isArray(secrets)) throw new AuditError("worker_settings", "invalid_binding_inventory");
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

function accessOrganizationFailure(code, httpStatus = null) {
  return {
    readable: false, authDomain: null, expectedAuthDomainMatch: null,
    failure: { code, httpStatus: Number.isInteger(httpStatus) ? httpStatus : null },
  };
}

export function inspectAccessOrganization(organization) {
  // Emit only a normalized Cloudflare team hostname. Never return the rest of
  // the organization response, a malformed URL, query, or identity-provider data.
  const value = typeof organization?.auth_domain === "string" ? organization.auth_domain.trim().toLowerCase() : "";
  const match = /^(?:https:\/\/)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloudflareaccess\.com)\/?$/.exec(value);
  if (!match) return accessOrganizationFailure("invalid_auth_domain");
  return {
    readable: true, authDomain: match[1],
    expectedAuthDomainMatch: match[1] === EXPECTED_ACCESS_AUTH_DOMAIN,
    failure: null,
  };
}

function workerBuildFailure(code, httpStatus = null, workerMatched = null) {
  return {
    checked: true, workerMatched, readable: false, configurationFound: null,
    repositoryMatches: null, productionBranch: null, previewsEnabled: null,
    mainPushMayTriggerBuild: null,
    failure: { code, httpStatus: Number.isInteger(httpStatus) ? httpStatus : null },
  };
}

export function inspectWorkerBuildSettings(configuration, workerId) {
  // Never emit build commands, environment variables, repository/account IDs,
  // build tokens or the immutable Worker tag. Only the connected branch and
  // booleans relevant to a narrow main-branch workflow update are reported.
  if (!configuration || typeof configuration !== "object" || Array.isArray(configuration))
    return workerBuildFailure("invalid_build_configuration", null, true);
  if (configuration.script_tag != null && configuration.script_tag !== workerId)
    return workerBuildFailure("build_worker_mismatch", null, false);
  const repository = configuration.git_repository;
  const branch = repository?.branch;
  if (!repository || typeof repository !== "object" || Array.isArray(repository) ||
      typeof branch !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,254}$/.test(branch) ||
      typeof configuration.previews_enabled !== "boolean" ||
      !configuration.production_settings || typeof configuration.production_settings !== "object" || Array.isArray(configuration.production_settings))
    return workerBuildFailure("invalid_build_configuration", null, true);
  const repositoryIdentified = typeof repository.provider_type === "string" &&
    typeof repository.provider_account_name === "string" && typeof repository.repo_name === "string";
  const repositoryMatches = repositoryIdentified
    ? repository.provider_type === "github" && repository.provider_account_name.toLowerCase() === "gvanesch" && repository.repo_name.toLowerCase() === "fractional-hr-site"
    : null;
  return {
    checked: true, workerMatched: true, readable: true, configurationFound: true,
    repositoryMatches, productionBranch: branch, previewsEnabled: configuration.previews_enabled,
    // Conservatively ignore watch-path exclusions: they can narrow a trigger,
    // but a connected main or enabled preview branch may still execute code.
    mainPushMayTriggerBuild: repositoryMatches === null ? null : repositoryMatches && (branch === "main" || configuration.previews_enabled),
    failure: null,
  };
}

// Conservative inventory matching, not a replacement for Cloudflare's policy
// evaluation. More-specific overlapping apps and policy selectors need review.
// https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
function publicDestinationParts(destination) {
  if (typeof destination !== "string") return null;
  const raw = destination.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const slash = raw.indexOf("/");
  const hostname = (slash < 0 ? raw : raw.slice(0, slash)).toLowerCase();
  const pathname = slash < 0 ? "" : raw.slice(slash);
  if (!/^[a-z0-9*.-]+$/.test(hostname) || /[?#\\\s]/.test(pathname)) return null;
  return { hostname, pathname };
}
const escapeRegex = value => value.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
export function matchesHostname(pattern, hostname) {
  const expression = pattern.split(".").map(label => label === "*" ? "[^.]+" : escapeRegex(label).replaceAll("*", "[^.]*")).join("\\.");
  return new RegExp(`^${expression}$`, "i").test(hostname);
}
function matchesPath(pathname, path, inherit = true) {
  if (!pathname || pathname === "/*") return true;
  const escaped = escapeRegex(pathname).replaceAll("*", ".*");
  return new RegExp(`^${escaped}${!inherit || pathname.includes("*") ? "$" : "(?:/|$)"}`).test(path);
}
export function matchesDestination(destination, url) {
  const parts = publicDestinationParts(destination);
  return Boolean(parts && matchesHostname(parts.hostname, url.hostname) && matchesPath(parts.pathname, url.pathname));
}

// The current API has public, Worker and private destinations. Modern
// destinations take precedence over the legacy self_hosted_domains field.
// https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/applications/methods/list/
export function appDestinations(app) {
  if (Array.isArray(app.destinations) && app.destinations.length) return app.destinations.map(item => ({
    ...item, type: item?.type ?? (typeof item?.uri === "string" ? "public" : "unknown"), source: "destinations",
  }));
  return [...new Set([app.domain, ...(Array.isArray(app.self_hosted_domains) ? app.self_hosted_domains : [])]
    .filter(value => typeof value === "string"))].map(uri => ({ type: "public", uri, source: "legacy" }));
}
function destinationTargetsHost(destination, target, hostname, workerId) {
  if (destination.type === "all_workers") return true;
  if (destination.type === "worker") return Boolean(workerId && destination.worker_id === workerId);
  if (destination.type !== "public") return false;
  const parts = publicDestinationParts(destination.uri);
  return Boolean(parts && matchesHostname(parts.hostname, hostname));
}
function destinationProtectsPath(destination, target, url, workerId) {
  if (!destinationTargetsHost(destination, target, url.hostname, workerId)) return false;
  if (destination.type === "public" && !matchesDestination(destination.uri, url)) return false;
  const bypass = Array.isArray(destination.overrides) && destination.overrides.some(rule =>
    rule?.behavior === "public" && typeof rule.path_pattern === "string" && matchesPath(rule.path_pattern, url.pathname, false));
  return !bypass;
}

export async function runAudit({ env = process.env, targetName = "production", fetchImpl = fetch } = {}) {
  const target = validateContext(env, targetName);
  const token = env.CLOUDFLARE_API_TOKEN.trim();
  const base = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/`;
  async function api(path, { optional = false, schema = false, operation = "metadata" } = {}) {
    let response;
    try { response = await fetchImpl(base + path, {
      method: schema ? "POST" : "GET", redirect: "error",
      headers: { Authorization: `Bearer ${token}`, ...(schema ? { "Content-Type": "application/json" } : {}) },
      ...(schema ? { body: JSON.stringify({ sql: SCHEMA_SELECT }) } : {}),
      signal: AbortSignal.timeout(15000),
    }); } catch {
      if (optional) return { unavailable: true, status: null, operation, code: "transport_failure" };
      throw new AuditError(operation, "transport_failure");
    }
    if (!response.ok) {
      if (optional) return { unavailable: true, status: response.status, operation, code: "http_failure" };
      throw new AuditError(operation, "http_failure", response.status);
    }
    let data;
    try { data = await response.json(); } catch { throw new AuditError(operation, "invalid_json", response.status); }
    if (!data.success) {
      if (optional) return { unavailable: true, status: response.status, operation, code: "provider_rejected" };
      throw new AuditError(operation, "provider_rejected", response.status);
    }
    return data;
  }
  const settings = await api(`workers/scripts/${target.worker}/settings`, { operation: "worker_settings" });
  const secrets = await api(`workers/scripts/${target.worker}/secrets`, { operation: "secret_name_inventory" });
  const { bindings, report: config } = inspectSettings(settings.result, secrets.result, target);
  // Target ID is fixed, never taken from a supplied URL or an unverified binding.
  const schema = await api(`d1/database/${target.database}/query`, { schema: true, operation: "d1_schema" });
  if (schema.result?.[0]?.success !== true || !Array.isArray(schema.result[0].results)) throw new AuditError("d1_schema", "invalid_schema_response");
  const tableNames = new Set(schema.result[0].results.map(row => row.name));
  const schemaReport = Object.fromEntries(REQUIRED_TABLES.map(name => [name, tableNames.has(name)]));

  // A successful but empty Access app list can result from scoped visibility.
  // Check which Zero Trust team this account exposes without printing its wider
  // configuration. This independent optional read must not hide other evidence.
  let accessOrganization;
  try {
    const organization = await api("access/organizations", { optional: true, operation: "access_organization" });
    accessOrganization = organization.unavailable
      ? accessOrganizationFailure(organization.code, organization.status)
      : inspectAccessOrganization(organization.result);
  } catch (error) {
    accessOrganization = accessOrganizationFailure(
      error instanceof AuditError ? error.code : "unexpected_failure",
      error instanceof AuditError ? error.httpStatus : null,
    );
  }

  const allApps = [];
  let accessReadable = true, accessFailure = null, pagesFetched = 0, reportedTotal = null;
  for (let page = 1; page <= 20; page++) {
    const result = await api(`access/apps?page=${page}&per_page=100`, { optional: true, operation: "access_application_inventory" });
    if (result.unavailable) { accessReadable = false; accessFailure = { code: result.code, httpStatus: result.status }; break; }
    if (!Array.isArray(result.result)) throw new AuditError("access_application_inventory", "invalid_inventory_response");
    pagesFetched++;
    allApps.push(...result.result);
    const info = result.result_info ?? {};
    if (Number.isInteger(info.total_count)) reportedTotal = info.total_count;
    if (Number.isInteger(info.total_pages) ? page >= info.total_pages :
      reportedTotal !== null ? allApps.length >= reportedTotal : result.result.length < 100) break;
    if (page === 20) accessReadable = false;
  }
  // Worker Access destinations and Workers Builds use an immutable Worker tag,
  // obtained from the documented Scripts API. Never emit the wider inventory.
  // https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/
  let workerId = null, workerIdentityReadable = true;
  let workerIdentityFailure = null;
  if (targetName === "production" || allApps.some(app => appDestinations(app).some(destination => destination.type === "worker"))) {
    try {
      const workers = await api("workers/scripts", { optional: true, operation: "worker_identity_inventory" });
      const matches = Array.isArray(workers.result) ? workers.result.filter(item => item.id === target.worker) : [];
      const worker = matches.length === 1 ? matches[0] : null;
      if (!workers.unavailable && typeof worker?.tag === "string" && /^[a-f\d]{32}$/i.test(worker.tag)) workerId = worker.tag;
      else {
        workerIdentityReadable = false;
        workerIdentityFailure = { code: workers.unavailable ? workers.code : "worker_identity_unverified", httpStatus: workers.status ?? null };
      }
    } catch (error) {
      workerIdentityReadable = false;
      workerIdentityFailure = { code: error instanceof AuditError ? error.code : "unexpected_failure", httpStatus: error instanceof AuditError ? error.httpStatus : null };
    }
  }
  let externalBuilds = { checked: false };
  if (targetName === "production") {
    if (!workerId) externalBuilds = workerBuildFailure(workerIdentityFailure?.code ?? "worker_identity_unverified", workerIdentityFailure?.httpStatus);
    else {
      try {
        const builds = await api(`builds/workers/${workerId}`, { optional: true, operation: "worker_build_configuration" });
        externalBuilds = builds.unavailable
          ? workerBuildFailure(builds.code, builds.status, true)
          : inspectWorkerBuildSettings(builds.result, workerId);
      } catch (error) {
        externalBuilds = workerBuildFailure(
          error instanceof AuditError ? error.code : "unexpected_failure",
          error instanceof AuditError ? error.httpStatus : null, true,
        );
      }
    }
  }
  const knownDestinationTypes = ["public", "private", "worker", "preview_worker", "all_workers", "all_preview_workers", "via_mcp_server_portal"];
  const diagnostics = {
    totalApplicationsRead: allApps.length, reportedTotalApplications: reportedTotal, pagesFetched,
    sourceCounts: { legacyDomainApplications: 0, legacyDomainListApplications: 0, modernDestinationApplications: 0 },
    destinationTypeCounts: Object.fromEntries([...knownDestinationTypes, "unknown"].map(type => [type, 0])),
    matchingLegacyPublicDestinations: 0, matchingModernPublicDestinations: 0,
    matchingWildcardPublicDestinations: 0, matchingWorkerDestinations: 0, matchingAllWorkerDestinations: 0,
    invalidPublicDestinationCount: 0, unknownDestinationTypeCount: 0, unresolvedWorkerDestinationCount: 0,
    unparsedApplicationCount: 0, malformedDestinationListCount: 0,
    publicOverrideCount: 0, malformedOverrideCount: 0, workerIdentityReadable,
  };
  for (const app of allApps) {
    if ((app.type === "self_hosted" || app.type == null) && !appDestinations(app).length) diagnostics.unparsedApplicationCount++;
    if ((app.destinations != null && !Array.isArray(app.destinations)) ||
        (app.self_hosted_domains != null && !Array.isArray(app.self_hosted_domains))) diagnostics.malformedDestinationListCount++;
    if (typeof app.domain === "string") diagnostics.sourceCounts.legacyDomainApplications++;
    if (Array.isArray(app.self_hosted_domains) && app.self_hosted_domains.length) diagnostics.sourceCounts.legacyDomainListApplications++;
    if (Array.isArray(app.destinations) && app.destinations.length) diagnostics.sourceCounts.modernDestinationApplications++;
    for (const destination of appDestinations(app)) {
      diagnostics.destinationTypeCounts[knownDestinationTypes.includes(destination.type) ? destination.type : "unknown"]++;
      if (!knownDestinationTypes.includes(destination.type)) diagnostics.unknownDestinationTypeCount++;
      if (destination.type === "public" && !publicDestinationParts(destination.uri)) diagnostics.invalidPublicDestinationCount++;
      if (destination.type === "worker" && !workerId) diagnostics.unresolvedWorkerDestinationCount++;
      if (Array.isArray(destination.overrides)) for (const rule of destination.overrides) {
        if (rule?.behavior === "public" && typeof rule.path_pattern === "string") diagnostics.publicOverrideCount++;
        else diagnostics.malformedOverrideCount++;
      }
      if (!target.hosts.some(host => destinationTargetsHost(destination, target, host, workerId))) continue;
      if (destination.type === "public") {
        diagnostics[destination.source === "legacy" ? "matchingLegacyPublicDestinations" : "matchingModernPublicDestinations"]++;
        if (publicDestinationParts(destination.uri).hostname.includes("*")) diagnostics.matchingWildcardPublicDestinations++;
      } else if (destination.type === "worker") diagnostics.matchingWorkerDestinations++;
      else if (destination.type === "all_workers") diagnostics.matchingAllWorkerDestinations++;
    }
  }
  const parsingComplete = !diagnostics.unknownDestinationTypeCount && !diagnostics.invalidPublicDestinationCount &&
    !diagnostics.unresolvedWorkerDestinationCount && !diagnostics.malformedOverrideCount &&
    !diagnostics.unparsedApplicationCount && !diagnostics.malformedDestinationListCount;
  const apps = allApps.filter(app => appDestinations(app).some(destination =>
    target.hosts.some(host => destinationTargetsHost(destination, target, host, workerId))));
  const access = {
    organization: accessOrganization,
    inventoryComplete: accessReadable, inventoryFailure: accessFailure, parsingComplete,
    coverageStatus: accessReadable && parsingComplete ? "evaluated_candidate_coverage" : "unknown",
    matchingApplicationCount: apps.length, diagnostics, applications: [], routes: [],
  };
  for (const app of apps) {
    if (!/^[a-f\d-]{36}$/i.test(app.id ?? "")) throw new AuditError("access_policies", "invalid_application_identifier");
    const policies = await api(`access/apps/${app.id}/policies`, { optional: true, operation: "access_policies" });
    const visibleAudience = bindings.get("CLOUDFLARE_ACCESS_AUD")?.type === "plain_text"
      ? bindings.get("CLOUDFLARE_ACCESS_AUD")?.text : undefined;
    access.applications.push({
      // No app ID, audience, identity, include/exclude selector, or secret is emitted.
      index: access.applications.length, audienceMatch: visibleAudience ? app.aud === visibleAudience : "unverifiable_secret",
      policiesReadable: !policies.unavailable,
      policiesFailure: policies.unavailable ? { code: policies.code, httpStatus: policies.status } : null,
      allowPolicyCount: Array.isArray(policies.result) ? policies.result.filter(p => p.decision === "allow").length : null,
      bypassPolicyCount: Array.isArray(policies.result) ? policies.result.filter(p => p.decision === "bypass").length : null,
    });
  }
  for (const hostname of target.hosts) {
    for (const path of PROTECTED_PATHS) {
      const matching = apps.map((app, index) => ({ app, index })).filter(({ app }) =>
        appDestinations(app).some(destination => destinationProtectsPath(destination, target, new URL(`https://${hostname}${path}`), workerId)));
      access.routes.push({ hostname, path, candidateApplicationIndexes: matching.map(({ index }) => index),
        coverage: access.coverageStatus === "unknown" ? "unknown" : matching.length ? "candidate_match" : "no_candidate_match" });
    }
  }

  async function getPage(path) {
    let url = new URL(path, target.origin);
    for (let hop = 0; hop < 5; hop++) {
      let response;
      try { response = await fetchImpl(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(15000) }); }
      catch { throw new AuditError("public_http", "transport_failure"); }
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
  const deployment = await api(`workers/scripts/${target.worker}/deployments`, { optional: true, operation: "worker_deployment" });
  const latest = deployment.result?.deployments?.[0];
  const deployedVersions = (latest?.versions ?? []).filter(v => /^[a-f\d-]{36}$/i.test(v.version_id ?? "") && Number.isFinite(v.percentage))
    .map(v => ({ version: v.version_id, percentage: v.percentage }));
  const blockers = [];
  if (!config.databaseMatches) blockers.push("Worker is not bound to the expected D1 database.");
  if (Object.values(config.d1Modes).some(v => !v)) blockers.push("At least one runtime data mode is not D1.");
  if (!config.accessAuthEnabled) blockers.push("Advisor authentication still requires a non-Access path.");
  if (Object.values(config.requiredBindings).some(v => !v)) blockers.push("One or more required service/auth bindings are missing.");
  if (Object.values(schemaReport).some(v => !v)) blockers.push("One or more required D1 tables are missing.");
  if (!access.organization.readable) blockers.push("Zero Trust organization identity is not readable with this credential.");
  else if (!access.organization.expectedAuthDomainMatch) blockers.push("Zero Trust organization does not match the observed QA sign-in team.");
  if (!access.inventoryComplete) blockers.push("Access application inventory is not readable with this credential.");
  if (!access.parsingComplete) blockers.push("Some Access destinations could not be interpreted; route coverage remains unknown.");
  if (access.coverageStatus !== "unknown" && access.routes.some(route => !route.candidateApplicationIndexes.length))
    blockers.push("No candidate Access application matched at least one advisor URL in the parsed inventory.");
  if (access.applications.some(app => app.audienceMatch === false || !app.policiesReadable || !app.allowPolicyCount || app.bypassPolicyCount))
    blockers.push("Access audience or application policy needs review.");
  if (health.httpStatus !== 200 || !health.d1Connected || !health.supabaseNotRequired) blockers.push("Hosted health does not prove D1 operation without Supabase.");
  if (publicPages.some(page => !page.available)) blockers.push("A public website/Health Check page failed its read-only check.");
  if (publicApiBoundaries.some(route => !route.applicationMethodRejected)) blockers.push("A public participant/Health Check or cron API has an unexpected unauthenticated GET boundary.");
  return {
    target: targetName, observedAt: new Date().toISOString(), config, schema: schemaReport,
    access, externalBuilds, health, publicPages, publicApiBoundaries, deployedVersions, blockers,
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
  } catch (error) {
    // A thrown transport/API error can include sensitive URLs/bodies. Do not emit it.
    console.log(JSON.stringify(failureReport(error), null, 2));
    process.exitCode = 1;
  }
}

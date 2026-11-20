// Read-only production Access planning. Credentials stay in this process; only
// fixed-site configuration and sanitized identity/settings evidence are emitted.
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import {
  ACCOUNT, CANDIDATE_REF, EXPECTED_ACCESS_AUTH_DOMAIN, TARGETS,
  PROTECTED_PATHS, PUBLIC_POST_ONLY_PATHS, appDestinations, matchesDestination, matchesHostname,
} from "./supabase-retirement-readonly.mjs";

export const ADVISOR_EMAIL = "greg@vanesch.uk";
export const PRODUCTION_APP_NAME = "Van Esch production advisor";
export const PRODUCTION_POLICY_NAME = "Van Esch production advisor - Greg";
export const PRODUCTION_PATHS = Object.freeze(PROTECTED_PATHS.filter(path => path === "/advisor" || !path.startsWith("/advisor/")));
export const PRODUCTION_DESTINATIONS = Object.freeze(TARGETS.production.hosts.flatMap(host =>
  PRODUCTION_PATHS.map(path => Object.freeze({ type: "public", uri: host + path }))));
const UUID = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/`;
const fixed = value => Array.isArray(value) ? value.map(fixed) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, fixed(value[key])])) : value;
export const accessFingerprint = value => createHash("sha256").update(JSON.stringify(fixed(value))).digest("hex");

export class AccessPlanError extends Error {
  constructor(code, httpStatus = null) { super(code); this.code = code; this.httpStatus = Number.isInteger(httpStatus) ? httpStatus : null; }
}
const requireCondition = (condition, code) => { if (!condition) throw new AccessPlanError(code); };

export function validatePlanContext(env) {
  requireCondition(env.GITHUB_REPOSITORY === "gvanesch/fractional-hr-site" && env.GITHUB_REF === CANDIDATE_REF &&
    env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT && typeof env.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN === "string" &&
    env.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN.trim(), "invalid_plan_context");
}

export function createAccessReader(env, fetchImpl = fetch) {
  validatePlanContext(env);
  return async function get(path) {
    requireCondition(/^(?:access\/organizations|access\/(?:apps|identity_providers)\?page=[1-5]&per_page=100|access\/apps\/[a-f\d-]{36}\/policies\?page=[1-5]&per_page=100)$/.test(path) ||
      path === "access/policies/f0f42710-0b34-4dd8-b44a-c63c308fa6de", "unsupported_read_endpoint");
    let response;
    try { response = await fetchImpl(API + path, {
      method: "GET", redirect: "error", signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN.trim()}` },
    }); } catch { throw new AccessPlanError("read_transport_failure"); }
    if (!response.ok) throw new AccessPlanError("read_http_failure", response.status);
    let data;
    try { data = await response.json(); } catch { throw new AccessPlanError("read_invalid_json", response.status); }
    requireCondition(data && typeof data === "object" && !Array.isArray(data) && data.success === true, "read_provider_rejected");
    return data;
  };
}

export async function readCompleteList(get, path) {
  const rows = [], ids = new Set();
  let expectedTotal = null, expectedPages = null, expectedPageSize = null;
  for (let page = 1; page <= 5; page++) {
    const data = await get(`${path}?page=${page}&per_page=100`);
    requireCondition(Array.isArray(data.result) && data.result.length <= 100, "invalid_list");
    const info = data.result_info;
    if (info !== undefined) {
      requireCondition(info && typeof info === "object" && !Array.isArray(info) &&
        Object.keys(info).every(key => ["page", "per_page", "count", "total_count", "total_pages"].includes(key)) &&
        Object.values(info).every(value => Number.isSafeInteger(value) && value >= 0) &&
        (info.page === undefined || info.page === page) && (info.count === undefined || info.count === data.result.length) &&
        (info.per_page === undefined || (info.per_page > 0 && info.per_page <= 100 && data.result.length <= info.per_page)), "invalid_list_pagination");
      if (info.total_count !== undefined) {
        requireCondition(expectedTotal === null || expectedTotal === info.total_count, "changing_list_pagination");
        expectedTotal = info.total_count;
      }
      if (info.total_pages !== undefined) {
        requireCondition(expectedPages === null || expectedPages === info.total_pages, "changing_list_pagination");
        expectedPages = info.total_pages;
      }
      if (info.per_page !== undefined) {
        requireCondition(expectedPageSize === null || expectedPageSize === info.per_page, "changing_list_pagination");
        expectedPageSize = info.per_page;
      }
      requireCondition(expectedPages !== 0 || data.result.length === 0, "invalid_list_pagination");
      if (expectedPages !== null && expectedTotal !== null && expectedPageSize !== null)
        requireCondition(expectedPages === Math.ceil(expectedTotal / expectedPageSize) ||
          (expectedTotal === 0 && expectedPages === 1), "inconsistent_list_pagination");
    }
    for (const row of data.result) {
      requireCondition(row && typeof row === "object" && !Array.isArray(row) && UUID.test(row.id ?? "") && !ids.has(row.id), "invalid_or_duplicate_list_identity");
      ids.add(row.id); rows.push(row);
    }
    requireCondition(expectedTotal === null || rows.length <= expectedTotal, "inconsistent_list_total");
    const finalPage = expectedPages !== null ? page >= expectedPages : expectedTotal !== null ? rows.length >= expectedTotal : data.result.length < (info?.per_page ?? 100);
    if (finalPage) {
      requireCondition((expectedTotal === null || rows.length === expectedTotal) && (expectedPages === null || page === Math.max(1, expectedPages)), "incomplete_list");
      return rows;
    }
    requireCondition(data.result.length > 0, "incomplete_list");
  }
  throw new AccessPlanError("list_limit_exceeded");
}

function publicDestinations(app) {
  requireCondition(app && typeof app === "object" && ["self_hosted", undefined].includes(app.type), "unreviewed_application_type");
  requireCondition((app.destinations == null || Array.isArray(app.destinations)) &&
    (app.self_hosted_domains == null || Array.isArray(app.self_hosted_domains)), "malformed_application_destinations");
  const destinations = appDestinations(app);
  requireCondition(destinations.length > 0 && destinations.every(item => item.type === "public" &&
    typeof item.uri === "string" && /^[a-z0-9*.-]+(?:\/[^?#\\\s]*)?$/i.test(item.uri) &&
    (!item.overrides || (Array.isArray(item.overrides) && item.overrides.length === 0))), "unreviewed_application_destination");
  return destinations;
}

export function selectQaTemplate(apps) {
  requireCondition(Array.isArray(apps), "invalid_application_inventory");
  const qa = [];
  for (const app of apps) {
    const destinations = publicDestinations(app);
    requireCondition(!destinations.some(d => TARGETS.production.hosts.some(host =>
      matchesHostname(d.uri.split("/")[0], host))), "production_access_application_already_present");
    if (destinations.some(d => matchesDestination(d.uri, new URL(`${TARGETS.qa.origin}/advisor`)))) qa.push(app);
  }
  requireCondition(qa.length === 1, "qa_template_not_unique");
  const destinations = publicDestinations(qa[0]);
  requireCondition(destinations.every(d => d.uri.split("/")[0] === TARGETS.qa.hosts[0]), "qa_template_has_other_hosts");
  requireCondition(PROTECTED_PATHS.every(path => destinations.some(d => matchesDestination(d.uri, new URL(TARGETS.qa.origin + path)))), "qa_route_coverage_incomplete");
  return qa[0];
}

function supportedMfaConfiguration(value) {
  return value == null || (typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).every(key => ["allowed_authenticators", "mfa_disabled", "session_duration"].includes(key)) &&
    (value.mfa_disabled == null || typeof value.mfa_disabled === "boolean") &&
    (value.allowed_authenticators == null || (Array.isArray(value.allowed_authenticators) &&
      value.allowed_authenticators.every(method => ["totp", "biometrics", "security_key"].includes(method)))) &&
    (value.session_duration == null || (typeof value.session_duration === "string" && /^\d+(?:h|m|s)$/.test(value.session_duration) && Number.parseInt(value.session_duration, 10) > 0)));
}

export function inspectConnectionRules(value) {
  const object = item => item != null && typeof item === "object" && !Array.isArray(item);
  const report = { present: value != null, sshPresent: false, rdpPresent: false, unknownProtocolCount: 0,
    inactiveSshDefaults: false, supported: false };
  if (value == null) return { report: { ...report, supported: true }, payload: undefined };
  if (!object(value)) return { report, payload: undefined };
  report.sshPresent = Object.hasOwn(value, "ssh"); report.rdpPresent = Object.hasOwn(value, "rdp");
  report.unknownProtocolCount = Object.keys(value).filter(key => !["ssh", "rdp"].includes(key)).length;
  if (report.unknownProtocolCount) return { report, payload: undefined };
  // HTTP applications have no SSH target. Only recognize an absent or inert
  // SSH structure, never discard usernames or an enabled email-alias rule.
  const ssh = value.ssh;
  const inactiveSsh = ssh == null || (object(ssh) && Object.keys(ssh).every(key => ["usernames", "allow_email_alias"].includes(key)) &&
    (ssh.usernames == null || (Array.isArray(ssh.usernames) && ssh.usernames.length === 0)) &&
    (ssh.allow_email_alias == null || ssh.allow_email_alias === false));
  report.inactiveSshDefaults = report.sshPresent && inactiveSsh;
  if (!inactiveSsh) return { report, payload: undefined };
  const rdp = value.rdp;
  const rdpKeys = ["allowed_clipboard_local_to_remote_formats", "allowed_clipboard_remote_to_local_formats"];
  const supportedRdp = rdp == null || (object(rdp) && Object.keys(rdp).every(key => rdpKeys.includes(key)) &&
    Object.values(rdp).every(formats => Array.isArray(formats) && formats.length <= 2 &&
      new Set(formats).size === formats.length && formats.every(format => ["text", "file"].includes(format))));
  if (!supportedRdp) return { report, payload: undefined };
  // The reusable-policy API documents RDP rules. Preserve those exactly; an
  // inert legacy SSH default is not a criterion for this HTTP application.
  return { report: { ...report, supported: true }, payload: rdp == null ? undefined : { rdp: structuredClone(rdp) } };
}

export function inspectIdentityPolicy(policies, allowedIdps = []) {
  const report = {
    policyCount: Array.isArray(policies) ? policies.length : null,
    allowPolicyCount: Array.isArray(policies) ? policies.filter(p => p.decision === "allow").length : null,
    bypassPolicyCount: Array.isArray(policies) ? policies.filter(p => p.decision === "bypass").length : null,
    gregOnly: false, additionalIdentityOrRulePresent: null, supported: false,
  };
  if (!Array.isArray(policies) || policies.length !== 1 || policies[0]?.decision !== "allow") return report;
  const policy = policies[0];
  const empty = value => value == null || (Array.isArray(value) && value.length === 0);
  const emptyObject = value => value == null || (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0);
  const onlyGreg = Array.isArray(policy.include) && policy.include.length === 1 &&
    policy.include[0] && Object.keys(policy.include[0]).length === 1 &&
    policy.include[0].email && Object.keys(policy.include[0].email).length === 1 &&
    typeof policy.include[0].email.email === "string" && policy.include[0].email.email.trim().toLowerCase() === ADVISOR_EMAIL;
  const requiredLoginMethods = empty(policy.require) || (Array.isArray(policy.require) && policy.require.length === 1 &&
    policy.require.every(rule => rule && Object.keys(rule).length === 1 && rule.login_method &&
      Object.keys(rule.login_method).length === 1 && allowedIdps.includes(rule.login_method.id)));
  const mfaSupported = supportedMfaConfiguration(policy.mfa_config);
  const connectionRules = inspectConnectionRules(policy.connection_rules);
  const simple = empty(policy.exclude) && requiredLoginMethods && empty(policy.approval_groups) &&
    !policy.approval_required && !policy.purpose_justification_required &&
    !policy.isolation_required && connectionRules.report.supported && mfaSupported &&
    (policy.session_duration == null || (typeof policy.session_duration === "string" && /^\d+(?:h|m|s)$/.test(policy.session_duration) && Number.parseInt(policy.session_duration, 10) > 0));
  return { ...report, gregOnly: onlyGreg, additionalIdentityOrRulePresent: !onlyGreg || !simple, supported: onlyGreg && simple,
    restrictions: {
      excludeRuleCount: Array.isArray(policy.exclude) ? policy.exclude.length : policy.exclude == null ? 0 : null,
      requireRuleCount: Array.isArray(policy.require) ? policy.require.length : policy.require == null ? 0 : null,
      requiredLoginMethodsSupported: requiredLoginMethods, approvalRequired: policy.approval_required === true,
      approvalGroupsEmpty: empty(policy.approval_groups), purposeJustificationRequired: policy.purpose_justification_required === true,
      isolationRequired: policy.isolation_required === true, connectionRulesEmpty: emptyObject(policy.connection_rules),
      connectionRules: connectionRules.report,
      mfaConfigurationPresent: policy.mfa_config != null, mfaConfigurationSupported: mfaSupported,
      policySessionDurationPresent: policy.session_duration != null,
    },
  };
}

export function inspectQaLogin(app, identityProviders) {
  const providerMap = new Map(identityProviders.map(provider => [provider.id, provider]));
  const allowed = app.allowed_idps;
  const providerSettingsValid = (app.allow_all_identity_providers == null || typeof app.allow_all_identity_providers === "boolean") &&
    (allowed == null || (Array.isArray(allowed) && allowed.every(id => UUID.test(id))));
  const allAllowed = app.allow_all_identity_providers === true || (app.allow_all_identity_providers == null && (!Array.isArray(allowed) || allowed.length === 0));
  const ids = allAllowed ? identityProviders.map(provider => provider.id) : allowed;
  const providers = Array.isArray(ids) ? ids.map(id => providerMap.get(id)) : [];
  const resolved = providerSettingsValid && providers.length > 0 && providers.every(Boolean) && new Set(ids).size === ids.length;
  const otpOnly = resolved && providers.every(provider => provider.type === "onetimepin");
  const duration = app.session_duration;
  const sessionSupported = typeof duration === "string" && /^\d+(?:h|m|s)$/.test(duration) && Number.parseInt(duration, 10) > 0;
  const unsupportedSecuritySettings = ["allow_authenticate_via_warp", "options_preflight_bypass", "read_service_tokens_from_header",
    "cors_headers", "custom_deny_url", "custom_non_identity_deny_url", "mfa_config"].filter(key => Boolean(app[key]));
  const sameSite = app.same_site_cookie_attribute == null ? "none" : app.same_site_cookie_attribute;
  const cookieSettingsSupported = ["none", "lax", "strict"].includes(sameSite) &&
    ["http_only_cookie_attribute", "enable_binding_cookie", "auto_redirect_to_identity", "skip_interstitial",
      "allow_authenticate_via_warp", "options_preflight_bypass"].every(key =>
      app[key] == null || typeof app[key] === "boolean");
  const securitySettingsSupported = unsupportedSecuritySettings.length === 0 && cookieSettingsSupported &&
    (app.auto_redirect_to_identity !== true || providers.length === 1);
  return {
    report: { providerCount: providers.length, providersResolved: resolved, oneTimePinOnly: otpOnly,
      sessionDuration: sessionSupported ? duration : null, securitySettingsSupported, unsupportedSecuritySettings,
      cookieSettingsSupported,
      pathCookieCurrentlyEnabled: app.path_cookie_attribute === true,
      supported: otpOnly && sessionSupported && securitySettingsSupported },
    allowedIdps: resolved ? ids : [], sameSite,
  };
}

export function buildAccessPlan({ organization, apps, policies, identityProviders }) {
  requireCondition(organization?.auth_domain?.replace(/^https:\/\//, "").replace(/\/$/, "").toLowerCase() === EXPECTED_ACCESS_AUTH_DOMAIN, "zero_trust_team_mismatch");
  const qa = selectQaTemplate(apps);
  const login = inspectQaLogin(qa, identityProviders), identity = inspectIdentityPolicy(policies, login.allowedIdps);
  const routesCovered = TARGETS.production.hosts.every(host => PROTECTED_PATHS.every(path =>
    PRODUCTION_DESTINATIONS.some(d => matchesDestination(d.uri, new URL(`https://${host}${path}`)))));
  const publicPaths = ["/", "/diagnostic", "/diagnostic-assessment", "/api/health", ...PUBLIC_POST_ONLY_PATHS];
  const publicPathsExcluded = TARGETS.production.hosts.every(host => publicPaths.every(path =>
    !PRODUCTION_DESTINATIONS.some(d => matchesDestination(d.uri, new URL(`https://${host}${path}`)))));
  requireCondition(PRODUCTION_DESTINATIONS.length === 42 && PRODUCTION_DESTINATIONS.every(d => d.uri.length <= 63) &&
    routesCovered && publicPathsExcluded, "production_destination_plan_invalid");
  const ready = identity.supported && login.report.supported;
  const policy = { name: PRODUCTION_POLICY_NAME, decision: "allow", include: [{ email: { email: ADVISOR_EMAIL } }], exclude: [],
    require: identity.supported ? structuredClone(policies[0].require ?? []) : [],
    ...(identity.supported && policies[0].session_duration ? { session_duration: policies[0].session_duration } : {}),
    ...(identity.supported && policies[0].mfa_config != null ? { mfa_config: structuredClone(policies[0].mfa_config) } : {}),
    ...(identity.supported && inspectConnectionRules(policies[0].connection_rules).payload ?
      { connection_rules: inspectConnectionRules(policies[0].connection_rules).payload } : {}),
  };
  const application = {
    name: PRODUCTION_APP_NAME, type: "self_hosted", domain: "www.vanesch.uk/advisor",
    destinations: PRODUCTION_DESTINATIONS.map(d => ({ ...d })),
    session_duration: login.report.sessionDuration, allow_all_identity_providers: false,
    allowed_idps: login.allowedIdps, auto_redirect_to_identity: qa.auto_redirect_to_identity === true,
    allow_authenticate_via_warp: false, options_preflight_bypass: false,
    http_only_cookie_attribute: qa.http_only_cookie_attribute === true,
    same_site_cookie_attribute: login.sameSite, enable_binding_cookie: qa.enable_binding_cookie === true,
    path_cookie_attribute: false, app_launcher_visible: false, skip_interstitial: qa.skip_interstitial === true,
  };
  const sourceFingerprint = accessFingerprint({ organization, apps, policies, identityProviders });
  const planFingerprint = accessFingerprint({ sourceFingerprint, policy, application });
  return {
    report: {
      observedAt: new Date().toISOString(), readOnly: true, mutationAttempted: false,
      organizationMatches: true, totalApplicationsRead: apps.length, existingProductionApplications: 0,
      qaIdentity: identity, qaLogin: login.report, planReady: ready, sourceFingerprint, planFingerprint,
      production: { name: PRODUCTION_APP_NAME, hosts: TARGETS.production.hosts, protectedPaths: PRODUCTION_PATHS,
        destinationCount: PRODUCTION_DESTINATIONS.length, requiredRoutesCovered: routesCovered, publicPathsExcluded,
        legacyDigestExcluded: true, pathCookieAttribute: false, identityMatchesQa: identity.supported,
        loginMatchesQa: login.report.supported, separateApplicationAndPolicy: true },
      neededPermission: "Access: Apps and Policies - Edit",
      blockers: [...(!identity.supported ? ["QA identity policy needs review before copying to production."] : []),
        ...(!login.report.supported ? ["QA identity-provider/session settings need review before copying to production."] : [])],
    },
    // Kept in process only. The CLI never serializes provider IDs or app/policy data.
    policy, application, qaApplicationId: qa.id, sourceFingerprint, planFingerprint,
  };
}

export async function readProductionAccessPlan({ env = process.env, fetchImpl = fetch } = {}) {
  const get = createAccessReader(env, fetchImpl);
  const [org, apps, identityProviders] = await Promise.all([
    get("access/organizations"), readCompleteList(get, "access/apps"), readCompleteList(get, "access/identity_providers"),
  ]);
  const qa = selectQaTemplate(apps);
  const policies = await readCompleteList(get, `access/apps/${qa.id}/policies`);
  return buildAccessPlan({ organization: org.result, apps, policies, identityProviders });
}

// GET-only diagnosis of the policy returned by the recorded first cutover
// attempt. Emit field names/types and equality assertions, never field strings,
// selectors or provider configuration. This does not resume the mutation.
export async function inspectRecordedPolicyMetadata({ env = process.env, fetchImpl = fetch } = {}) {
  const id = "f0f42710-0b34-4dd8-b44a-c63c308fa6de";
  const body = await createAccessReader(env, fetchImpl)(`access/policies/${id}`);
  const policy = body.result;
  requireCondition(policy && typeof policy === "object" && !Array.isArray(policy) && policy.id === id &&
    policy.name === `${PRODUCTION_POLICY_NAME} [retirement-20261120-production-01]`, "recorded_policy_identity_mismatch");
  const fields = {};
  for (const [name, value] of Object.entries(policy)) {
    requireCondition(/^[a-z_]{1,64}$/.test(name), "unsupported_policy_metadata_field_name");
    fields[name] = value == null ? { kind: "null" } : Array.isArray(value) ? { kind: "array", count: value.length } :
      typeof value === "string" ? { kind: "string", length: value.length, uuidAliasMatchesId: UUID.test(value) ? value === id : null } :
      typeof value === "boolean" ? { kind: "boolean", value } : { kind: typeof value };
  }
  return { readOnly: true, mutationAttempted: false, policyId: id, recordedRequestIdentityMatches: true,
    appCount: Number.isSafeInteger(policy.app_count) ? policy.app_count : null, fields };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const plan = await readProductionAccessPlan();
    if (process.argv.includes("--inspect-owned-policy")) plan.report.recordedPolicyMetadata = await inspectRecordedPolicyMetadata();
    console.log(JSON.stringify(plan.report, null, 2));
    if (!plan.report.planReady) process.exitCode = 1;
  } catch (error) {
    console.log(JSON.stringify({ readOnly: true, mutationAttempted: false, planReady: false,
      failure: { code: error instanceof AccessPlanError ? error.code : "unexpected_plan_failure",
        httpStatus: error instanceof AccessPlanError ? error.httpStatus : null } }, null, 2));
    process.exitCode = 1;
  }
}

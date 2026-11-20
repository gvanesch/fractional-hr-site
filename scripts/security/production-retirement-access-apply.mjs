// Scoped Access creation for the already reviewed production auth cutover.
// No Worker/D1/email/Supabase mutations, delete path, mutation retries or CLI.
// API references: Cloudflare Zero Trust Access reusable policies and applications.
import {
  accessFingerprint, buildAccessPlan, readCompleteList, selectQaTemplate,
  validatePlanContext, inspectIdentityPolicy, inspectQaLogin, inspectConnectionRules,
  PRODUCTION_APP_NAME, PRODUCTION_POLICY_NAME,
} from "./production-retirement-access-plan.mjs";
import { validateProductionRequest } from "./production-retirement-release.mjs";
import { ACCOUNT, EXPECTED_ACCESS_AUTH_DOMAIN, TARGETS, appDestinations, matchesDestination,
  PROTECTED_PATHS, PUBLIC_POST_ONLY_PATHS } from "./supabase-retirement-readonly.mjs";

const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/`;
const TEAM = `https://${EXPECTED_ACCESS_AUTH_DOMAIN}`;
const UUID = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const HASH = /^[a-f\d]{64}$/;
const SHA = /^[a-f\d]{40}$/;
const CHECKPOINT_KIND = "production-retirement-access-checkpoint";
const STAGES = ["prepared", "policy_create_requested_outcome_unknown", "policy_created_verification_pending",
  "policy_verified", "application_create_requested_outcome_unknown", "application_created_verification_pending", "verified"];

export class AccessApplyError extends Error {
  constructor(operation, code, httpStatus = null, mutationOutcomeUnknown = false) {
    super(`${operation}: ${code}`);
    this.operation = operation; this.code = code;
    this.httpStatus = Number.isInteger(httpStatus) ? httpStatus : null;
    this.mutationOutcomeUnknown = mutationOutcomeUnknown;
  }
}
const check = (condition, code, operation = "access_validation") => { if (!condition) throw new AccessApplyError(operation, code); };
const object = value => value != null && typeof value === "object" && !Array.isArray(value);
const sorted = array => [...array].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
const equal = (a, b) => accessFingerprint(a) === accessFingerprint(b);
const emptyArray = value => value == null ? [] : value;
const inactive = value => value == null || value === false || value === "" ||
  Array.isArray(value) && value.length === 0 || object(value) && Object.keys(value).length === 0;
const POLICY_FIELDS = new Set(["id", "uid", "name", "decision", "include", "exclude", "require", "session_duration", "mfa_config",
  "connection_rules", "approval_required", "approval_groups", "purpose_justification_required", "purpose_justification_prompt",
  "isolation_required", "account_id", "policy_resolution_account_id", "reusable", "disabled", "precedence", "app_count",
  "created_at", "updated_at", "created_on", "updated_on"]);
const APPLICATION_FIELDS = new Set(["id", "uid", "name", "type", "domain", "destinations", "self_hosted_domains", "policies", "aud",
  "account_id", "created_at", "updated_at", "created_on", "updated_on", "allow_all_identity_providers", "allowed_idps",
  "session_duration", "auto_redirect_to_identity", "allow_authenticate_via_warp", "options_preflight_bypass",
  "http_only_cookie_attribute", "same_site_cookie_attribute", "enable_binding_cookie", "path_cookie_attribute",
  "app_launcher_visible", "skip_interstitial", "allow_iframe", "eager_redirect_cookie_setting", "read_service_tokens_from_header", "cors_headers",
  "custom_deny_url", "custom_non_identity_deny_url", "custom_deny_message", "custom_pages", "mfa_config", "scim_config",
  "service_auth_401_redirect", "logo_url", "tags"]);

export function accessApplyFailure(error) {
  return error instanceof AccessApplyError
    ? { operation: error.operation, code: error.code, httpStatus: error.httpStatus, mutationOutcomeUnknown: error.mutationOutcomeUnknown }
    : { operation: "access_apply", code: "unexpected_failure", httpStatus: null, mutationOutcomeUnknown: null };
}

function client(env, fetchImpl, writePaths = ["access/policies", "access/apps"]) {
  validatePlanContext(env);
  const posted = new Set();
  return async (path, { method = "GET", body } = {}) => {
    const read = /^(?:access\/organizations|access\/(?:apps|identity_providers|policies)\?page=[1-5]&per_page=100|access\/apps\/[a-f\d-]{36}(?:\/policies\?page=[1-5]&per_page=100)?|access\/policies\/[a-f\d-]{36})$/i;
    const write = method === "POST" && writePaths.includes(path);
    check(method === "GET" && read.test(path) && body === undefined || write && object(body), "endpoint_or_method_forbidden", "access_request");
    if (write) {
      check(!posted.has(path), "mutation_already_attempted", "access_request");
      posted.add(path);
    }
    let response;
    try { response = await fetchImpl(API + path, {
      method, redirect: "error", signal: AbortSignal.timeout(30000),
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN.trim()}`,
        ...(write ? { "Content-Type": "application/json" } : {}) },
      ...(write ? { body: JSON.stringify(body) } : {}),
    }); } catch { throw new AccessApplyError(write ? "access_create" : "access_read", "transport_failure", null, write); }
    if (!response.ok) throw new AccessApplyError(write ? "access_create" : "access_read", "http_failure", response.status,
      write && (response.status >= 500 || response.status < 400));
    let data;
    try { data = await response.json(); }
    catch { throw new AccessApplyError(write ? "access_create" : "access_read", "invalid_json", response.status, write); }
    if (!object(data) || data.success !== true)
      throw new AccessApplyError(write ? "access_create" : "access_read", "provider_rejected", response.status, write);
    return data;
  };
}

async function inventory(api, excludedApplicationId = null) {
  const [organization, applications, identityProviders, reusablePolicies] = await Promise.all([
    api("access/organizations"), readCompleteList(api, "access/apps"),
    readCompleteList(api, "access/identity_providers"), readCompleteList(api, "access/policies"),
  ]);
  const excluded = excludedApplicationId ? applications.filter(app => app.id === excludedApplicationId) : [];
  check(!excludedApplicationId || excluded.length === 1, "owned_application_missing_from_inventory");
  const remaining = applications.filter(app => app.id !== excludedApplicationId);
  const qa = selectQaTemplate(remaining);
  const policies = await readCompleteList(api, `access/apps/${qa.id}/policies`);
  const plan = buildAccessPlan({ organization: organization.result, apps: remaining, policies, identityProviders });
  return { plan, applications, identityProviders, reusablePolicies, ownedApplication: excluded[0] };
}

function validatePlan(plan, request) {
  check(plan?.report?.planReady === true && plan.planFingerprint === request.expectedAccessPlanFingerprint &&
    plan.report.planFingerprint === plan.planFingerprint && HASH.test(plan.sourceFingerprint ?? "") &&
    plan.report.sourceFingerprint === plan.sourceFingerprint && UUID.test(plan.qaApplicationId ?? ""), "reviewed_plan_mismatch");
  check(plan.report.production.requiredRoutesCovered === true && plan.report.production.publicPathsExcluded === true &&
    plan.report.production.destinationCount === 42 && plan.report.production.identityMatchesQa === true &&
    plan.report.production.loginMatchesQa === true, "reviewed_plan_incomplete");
}

export function createAccessIntent(plan, request) {
  validatePlan(plan, request);
  check(/^[a-z0-9][a-z0-9-]{7,63}$/.test(request.requestId ?? ""), "invalid_request_identity");
  const policy = structuredClone(plan.policy), application = structuredClone(plan.application);
  check(policy.name === PRODUCTION_POLICY_NAME && application.name === PRODUCTION_APP_NAME &&
    application.type === "self_hosted" && application.allow_all_identity_providers === false &&
    Array.isArray(application.allowed_idps) && application.allowed_idps.length > 0 && application.allowed_idps.every(id => UUID.test(id)),
  "unrecognized_intent_shape");
  policy.name += ` [${request.requestId}]`; application.name += ` [${request.requestId}]`;
  // The documented API uses an explicit allowed_idps list. The UI-only
  // allow_all_identity_providers=false is verified semantically on readback.
  delete application.allow_all_identity_providers;
  const fingerprint = accessFingerprint({ requestFingerprint: accessFingerprint(request), planFingerprint: plan.planFingerprint, policy, application });
  return { policy, application, fingerprint };
}

function policyShape(value, expected, allowedIdps) {
  check(object(value) && (!value.account_id || value.account_id === ACCOUNT) &&
    (!value.policy_resolution_account_id || value.policy_resolution_account_id === ACCOUNT) && (value.reusable == null || value.reusable === true) &&
    (value.disabled == null || value.disabled === false) && inspectIdentityPolicy([value], allowedIdps).supported, "created_policy_security_mismatch");
  // The live GET response also returns uid as an id alias. Accept only the
  // observed exact identity relationship, never an independently valued field.
  check(value.uid == null || UUID.test(value.uid) && value.uid === value.id, "created_policy_identity_alias_mismatch");
  check(Object.entries(value).every(([key, item]) => POLICY_FIELDS.has(key) || item == null), "unreviewed_policy_field");
  const connection = inspectConnectionRules(value.connection_rules);
  check(connection.report.supported, "created_policy_connection_rules_mismatch");
  const shape = {
    name: value.name, decision: value.decision,
    include: sorted(value.include.map(rule => rule.email ? { email: { email: rule.email.email.trim().toLowerCase() } } : rule)),
    exclude: sorted(emptyArray(value.exclude)), require: sorted(emptyArray(value.require)),
    session_duration: value.session_duration ?? null, mfa_config: value.mfa_config ?? null,
    connection_rules: connection.payload ?? null,
    approval_required: value.approval_required ?? false, approval_groups: emptyArray(value.approval_groups),
    purpose_justification_required: value.purpose_justification_required ?? false,
    isolation_required: value.isolation_required ?? false,
  };
  if (expected) check(equal(shape, policyShape(expected, null, allowedIdps)), "created_policy_payload_mismatch");
  return shape;
}

function applicationShape(value, expected, policyId, identityProviders) {
  check(object(value) && value.type === "self_hosted" && (!value.account_id || value.account_id === ACCOUNT) &&
    value.allow_all_identity_providers !== true && value.path_cookie_attribute !== true && (value.allow_iframe == null || value.allow_iframe === false) &&
    (value.destinations == null || Array.isArray(value.destinations)) &&
    (value.self_hosted_domains == null || Array.isArray(value.self_hosted_domains)), "created_application_security_mismatch");
  check(value.uid == null || UUID.test(value.uid) && value.uid === value.id, "created_application_identity_alias_mismatch");
  check(value.eager_redirect_cookie_setting === undefined || typeof value.eager_redirect_cookie_setting === "boolean",
    "created_application_eager_cookie_setting_invalid");
  check(Object.entries(value).every(([key, item]) => APPLICATION_FIELDS.has(key) || item == null) &&
    ["scim_config", "service_auth_401_redirect", "custom_pages", "custom_deny_message", "logo_url", "tags"].every(key => inactive(value[key])),
  "unreviewed_application_setting");
  const login = inspectQaLogin(value, identityProviders);
  check(login.report.supported && Array.isArray(value.allowed_idps) && value.allowed_idps.length > 0, "created_application_login_mismatch");
  const destinations = appDestinations(value).map(item => {
    check(item.type === "public" && typeof item.uri === "string" &&
      (!item.overrides || Array.isArray(item.overrides) && item.overrides.length === 0) &&
      Object.keys(item).every(key => ["type", "uri", "source", "overrides"].includes(key)), "created_application_destination_mismatch");
    return { type: "public", uri: item.uri };
  });
  check(destinations.length === 42 && new Set(destinations.map(item => item.uri)).size === 42, "created_application_destination_count");
  if (value.policies != null) {
    check(Array.isArray(value.policies) && value.policies.length === 1 && value.policies[0]?.id === policyId &&
      value.policies[0].disabled !== true && (value.policies[0].precedence == null || value.policies[0].precedence === 1),
    "created_application_policy_reference_mismatch");
  }
  const shape = {
    name: value.name, type: value.type, domain: value.domain,
    destinations: sorted(destinations), allowed_idps: [...value.allowed_idps].sort(),
    session_duration: value.session_duration, auto_redirect_to_identity: value.auto_redirect_to_identity ?? false,
    allow_authenticate_via_warp: value.allow_authenticate_via_warp ?? false,
    options_preflight_bypass: value.options_preflight_bypass ?? false,
    http_only_cookie_attribute: value.http_only_cookie_attribute ?? false,
    same_site_cookie_attribute: value.same_site_cookie_attribute ?? "none",
    enable_binding_cookie: value.enable_binding_cookie ?? false, path_cookie_attribute: value.path_cookie_attribute ?? false,
    app_launcher_visible: value.app_launcher_visible ?? true, skip_interstitial: value.skip_interstitial ?? false,
    // Cloudflare documents true as the default; the reviewed QA source returns
    // true. Keep the original POST intent unchanged while verifying that default.
    eager_redirect_cookie_setting: value.eager_redirect_cookie_setting ?? true,
  };
  if (expected) check(equal(shape, applicationShape({ ...expected, policies: [{ id: policyId, precedence: 1 }] }, null, policyId, identityProviders)),
    "created_application_payload_mismatch");
  return shape;
}

function otherPoliciesFingerprint(policies, excludedId) {
  return accessFingerprint(policies.filter(policy => policy.id !== excludedId));
}

function validateCheckpoint(checkpoint, request) {
  check(checkpoint?.kind === CHECKPOINT_KIND && checkpoint.requestId === request.requestId &&
    checkpoint.requestFingerprint === accessFingerprint(request) && checkpoint.planFingerprint === request.expectedAccessPlanFingerprint &&
    HASH.test(checkpoint.sourceFingerprint ?? "") && HASH.test(checkpoint.intentFingerprint ?? "") &&
    HASH.test(checkpoint.otherPoliciesFingerprint ?? "") && STAGES.includes(checkpoint.stage) &&
    Number.isFinite(Date.parse(checkpoint.preparedAt)), "checkpoint_unverified");
  if (checkpoint.policyId != null) check(UUID.test(checkpoint.policyId), "checkpoint_policy_identity_invalid");
  if (checkpoint.applicationId != null) check(UUID.test(checkpoint.applicationId), "checkpoint_application_identity_invalid");
}

async function workerLease(verifyWorkerLease, request) {
  check(typeof verifyWorkerLease === "function", "worker_lease_reader_required");
  let lease;
  try { lease = await verifyWorkerLease(); } catch { throw new AccessApplyError("worker_lease", "eligibility_read_failed"); }
  check(lease?.eligibleForReviewedAuthChange === true && lease.productionVersionId === request.expectedProductionVersionId &&
    lease.qaVersionId === request.expectedQaVersionId && lease.productionEnvironmentVerified === true &&
    lease.productionD1IdentityVerified === true && lease.productionD1ModesVerified === true &&
    lease.productionExistingSecretsVerifiedByName === true && lease.productionRuntimeAndGroupingVerified === true &&
    lease.priorProductionAuthConfigurationVerified === true && lease.qaIsolationVerified === true &&
    lease.dataWrites === false && lease.emailSent === false && lease.deploymentsChanged === false,
  "worker_eligibility_not_verified", "worker_lease");
  return accessFingerprint(lease);
}

async function verifyOwnedState(api, request, checkpoint, { sealed = true } = {}) {
  validateCheckpoint(checkpoint, request);
  check(UUID.test(checkpoint.applicationId ?? "") && UUID.test(checkpoint.policyId ?? ""), "owned_resource_identifiers_required");
  const state = await inventory(api, checkpoint.applicationId);
  validatePlan(state.plan, request);
  const intent = createAccessIntent(state.plan, request);
  check(state.plan.sourceFingerprint === checkpoint.sourceFingerprint && intent.fingerprint === checkpoint.intentFingerprint &&
    otherPoliciesFingerprint(state.reusablePolicies, checkpoint.policyId) === checkpoint.otherPoliciesFingerprint,
  "source_or_other_policy_inventory_drift");
  const [appRead, policyRead, appPolicies] = await Promise.all([
    api(`access/apps/${checkpoint.applicationId}`), api(`access/policies/${checkpoint.policyId}`),
    readCompleteList(api, `access/apps/${checkpoint.applicationId}/policies`),
  ]);
  const app = appRead.result, policy = policyRead.result;
  check(app?.id === checkpoint.applicationId && policy?.id === checkpoint.policyId && HASH.test(app.aud ?? ""), "owned_resource_identity_mismatch");
  check(appPolicies.length === 1 && appPolicies[0].id === checkpoint.policyId &&
    (appPolicies[0].precedence == null || appPolicies[0].precedence === 1), "owned_application_policy_count_or_order_mismatch");
  check(policy.app_count == null || policy.app_count === 1, "owned_policy_attached_elsewhere");
  const canonicalPolicy = policyShape(policy, intent.policy, intent.application.allowed_idps);
  check(equal(canonicalPolicy, policyShape(appPolicies[0], intent.policy, intent.application.allowed_idps)), "application_policy_readback_mismatch");
  const canonicalApp = applicationShape(app, intent.application, checkpoint.policyId, state.identityProviders);
  check(equal(canonicalApp, applicationShape(state.ownedApplication, intent.application, checkpoint.policyId, state.identityProviders)), "application_inventory_readback_mismatch");
  for (const record of [app, state.ownedApplication]) {
    const reference = record.policies?.[0];
    // The app response can contain the id/precedence reference or a full
    // expanded policy. Expanded rules must agree with the policy endpoints.
    if (reference && Object.keys(reference).some(key => !["id", "precedence"].includes(key)))
      check(equal(canonicalPolicy, policyShape(reference, intent.policy, intent.application.allowed_idps)), "expanded_application_policy_mismatch");
  }
  const listedPolicy = state.reusablePolicies.filter(item => item.id === checkpoint.policyId);
  check(listedPolicy.length === 1 && equal(canonicalPolicy, policyShape(listedPolicy[0], intent.policy, intent.application.allowed_idps)), "policy_inventory_readback_mismatch");
  const policyFingerprint = accessFingerprint({ id: checkpoint.policyId, policy: canonicalPolicy });
  const applicationFingerprint = accessFingerprint({ id: checkpoint.applicationId, audience: app.aud, application: canonicalApp,
    policyId: checkpoint.policyId, policy: canonicalPolicy });
  if (sealed) check(policyFingerprint === checkpoint.policyFingerprint && applicationFingerprint === checkpoint.applicationFingerprint,
    "owned_access_configuration_drift");
  const publicPaths = ["/", "/diagnostic", "/diagnostic-assessment", "/api/health", ...PUBLIC_POST_ONLY_PATHS];
  const protectedRoutesVerified = TARGETS.production.hosts.every(host => PROTECTED_PATHS.every(path =>
    canonicalApp.destinations.some(d => matchesDestination(d.uri, new URL(`https://${host}${path}`)))));
  const publicBoundariesVerified = TARGETS.production.hosts.every(host => publicPaths.every(path =>
    !canonicalApp.destinations.some(d => matchesDestination(d.uri, new URL(`https://${host}${path}`)))));
  check(protectedRoutesVerified && publicBoundariesVerified, "created_application_route_coverage_mismatch");
  return { policyFingerprint, proof: {
    kind: "verified-production-advisor-access", accountId: ACCOUNT, applicationId: checkpoint.applicationId,
    audience: app.aud, teamDomain: TEAM, planFingerprint: checkpoint.planFingerprint, applicationFingerprint,
    protectedRoutesVerified, publicBoundariesVerified, identityPolicyVerified: true, cookiePathAttribute: false,
  } };
}

export async function inspectProductionAccess({ request, env, checkpoint, fetchImpl = fetch }) {
  const api = client(env, fetchImpl);
  validateCheckpoint(checkpoint, request);
  check(checkpoint.stage === "verified" && HASH.test(checkpoint.policyFingerprint ?? "") && HASH.test(checkpoint.applicationFingerprint ?? ""),
    "verified_checkpoint_required");
  return (await verifyOwnedState(api, request, checkpoint)).proof;
}

export async function createProductionAccess({ request, env, git, verifyWorkerLease, fetchImpl = fetch, onEvidence, now = Date.now() }) {
  validateProductionRequest(request, env, git, now);
  validatePlanContext(env);
  check(typeof onEvidence === "function", "durable_evidence_callback_required");
  const api = client(env, fetchImpl), initial = await inventory(api);
  validatePlan(initial.plan, request);
  const intent = createAccessIntent(initial.plan, request);
  check(!initial.reusablePolicies.some(policy => typeof policy.name === "string" && policy.name.startsWith(PRODUCTION_POLICY_NAME)),
    "preexisting_production_policy_requires_reconciliation");
  const lease = await workerLease(verifyWorkerLease, request);
  const checkpoint = {
    kind: CHECKPOINT_KIND, stage: "prepared", preparedAt: new Date(now).toISOString(), sourceCommit: git.head,
    requestId: request.requestId, requestFingerprint: accessFingerprint(request),
    sourceFingerprint: initial.plan.sourceFingerprint, planFingerprint: initial.plan.planFingerprint,
    intentFingerprint: intent.fingerprint, otherPoliciesFingerprint: otherPoliciesFingerprint(initial.reusablePolicies, null),
    workerEligibilityFingerprint: lease,
  };
  const emit = async stage => {
    checkpoint.stage = stage;
    checkpoint.manualReviewRequired = stage !== "verified";
    checkpoint.automaticMutationRetryAllowed = false;
    // All checkpoint fields are fixed labels, timestamps, IDs and hashes. Never
    // emit intended payloads, selectors, provider configuration or the audience.
    await onEvidence(structuredClone(checkpoint));
  };
  await emit("policy_create_requested_outcome_unknown");
  const policyCreated = await api("access/policies", { method: "POST", body: intent.policy });
  if (!UUID.test(policyCreated.result?.id ?? ""))
    throw new AccessApplyError("access_create", "created_policy_identity_unavailable", null, true);
  checkpoint.policyId = policyCreated.result.id;
  await emit("policy_created_verification_pending");
  const policyRead = await api(`access/policies/${checkpoint.policyId}`);
  check(policyRead.result?.id === checkpoint.policyId && (policyRead.result.app_count == null || policyRead.result.app_count === 0), "new_policy_identity_or_attachment_mismatch");
  const canonicalPolicy = policyShape(policyRead.result, intent.policy, intent.application.allowed_idps);
  checkpoint.policyFingerprint = accessFingerprint({ id: checkpoint.policyId, policy: canonicalPolicy });
  await emit("policy_verified");
  const beforeApp = await inventory(api);
  validatePlan(beforeApp.plan, request);
  check(beforeApp.plan.sourceFingerprint === checkpoint.sourceFingerprint &&
    createAccessIntent(beforeApp.plan, request).fingerprint === checkpoint.intentFingerprint &&
    otherPoliciesFingerprint(beforeApp.reusablePolicies, checkpoint.policyId) === checkpoint.otherPoliciesFingerprint,
  "source_changed_before_application_create");
  const foundPolicy = beforeApp.reusablePolicies.filter(policy => policy.id === checkpoint.policyId);
  check(foundPolicy.length === 1 && equal(policyShape(foundPolicy[0], intent.policy, intent.application.allowed_idps), canonicalPolicy),
    "new_policy_changed_before_application_create");
  check(await workerLease(verifyWorkerLease, request) === lease, "worker_changed_before_application_create");
  await emit("application_create_requested_outcome_unknown");
  const appCreated = await api("access/apps", { method: "POST", body: { ...intent.application, policies: [{ id: checkpoint.policyId, precedence: 1 }] } });
  if (!UUID.test(appCreated.result?.id ?? ""))
    throw new AccessApplyError("access_create", "created_application_identity_unavailable", null, true);
  checkpoint.applicationId = appCreated.result.id;
  await emit("application_created_verification_pending");
  const verified = await verifyOwnedState(api, request, checkpoint, { sealed: false });
  checkpoint.policyFingerprint = verified.policyFingerprint;
  checkpoint.applicationFingerprint = verified.proof.applicationFingerprint;
  await emit("verified");
  return { checkpoint, proof: verified.proof };
}

const ORIGINAL_REQUEST_FIELDS = new Set(["operation", "requestId", "requestedAt", "reviewedCommit", "expectedProductionVersionId",
  "expectedQaVersionId", "expectedAccessPlanFingerprint"]);
const POLICY_ONLY_EVIDENCE_FIELDS = new Set(["kind", "stage", "preparedAt", "sourceCommit", "requestId", "requestFingerprint",
  "sourceFingerprint", "planFingerprint", "intentFingerprint", "otherPoliciesFingerprint", "workerEligibilityFingerprint",
  "policyId", "policyFingerprint", "manualReviewRequired", "automaticMutationRetryAllowed"]);

function validatePolicyOnlyRecovery(request, now) {
  const recovery = request.accessRecovery;
  check(object(recovery) && Object.keys(recovery).length === 2 && Object.hasOwn(recovery, "originalRequest") &&
    Object.hasOwn(recovery, "evidence"), "policy_only_recovery_required");
  const { originalRequest, evidence } = recovery;
  check(object(originalRequest) && Object.keys(originalRequest).every(key => ORIGINAL_REQUEST_FIELDS.has(key)) &&
    originalRequest.operation === request.operation && /^[a-z0-9][a-z0-9-]{7,63}$/.test(originalRequest.requestId ?? "") &&
    SHA.test(originalRequest.reviewedCommit ?? "") && Number.isFinite(Date.parse(originalRequest.requestedAt)) &&
    ["expectedProductionVersionId", "expectedQaVersionId", "expectedAccessPlanFingerprint"].every(key => originalRequest[key] === request[key]),
  "original_recovery_request_mismatch");
  validateCheckpoint(evidence, originalRequest);
  check(object(evidence) && Object.keys(evidence).every(key => POLICY_ONLY_EVIDENCE_FIELDS.has(key)) &&
    ["policy_created_verification_pending", "policy_verified"].includes(evidence.stage) &&
    UUID.test(evidence.policyId ?? "") && SHA.test(evidence.sourceCommit ?? "") &&
    HASH.test(evidence.workerEligibilityFingerprint ?? "") && evidence.manualReviewRequired === true &&
    evidence.automaticMutationRetryAllowed === false && Date.parse(originalRequest.requestedAt) <= Date.parse(evidence.preparedAt) &&
    Date.parse(evidence.preparedAt) <= now &&
    (evidence.policyFingerprint == null || HASH.test(evidence.policyFingerprint)) &&
    (evidence.stage !== "policy_verified" || HASH.test(evidence.policyFingerprint ?? "")), "recovery_not_verified_policy_only");
  return { originalRequest, evidence };
}

async function verifyUnusedOwnedPolicy(api, originalRequest, evidence) {
  const [state, read] = await Promise.all([inventory(api), api(`access/policies/${evidence.policyId}`)]);
  validatePlan(state.plan, originalRequest);
  const intent = createAccessIntent(state.plan, originalRequest);
  check(state.plan.sourceFingerprint === evidence.sourceFingerprint && intent.fingerprint === evidence.intentFingerprint &&
    otherPoliciesFingerprint(state.reusablePolicies, evidence.policyId) === evidence.otherPoliciesFingerprint,
  "recovery_source_or_other_policy_inventory_drift");
  const listed = state.reusablePolicies.filter(policy => policy.id === evidence.policyId || policy.name === intent.policy.name);
  check(listed.length === 1 && listed[0].id === evidence.policyId && read.result?.id === evidence.policyId &&
    [listed[0], read.result].every(policy => policy.name === intent.policy.name && policy.reusable === true && policy.app_count === 0),
  "recovery_owned_policy_missing_changed_or_attached");
  const canonical = policyShape(read.result, intent.policy, intent.application.allowed_idps);
  check(equal(canonical, policyShape(listed[0], intent.policy, intent.application.allowed_idps)), "recovery_policy_readback_mismatch");
  const policyFingerprint = accessFingerprint({ id: evidence.policyId, policy: canonical });
  check(evidence.policyFingerprint == null || evidence.policyFingerprint === policyFingerprint, "recovery_policy_fingerprint_mismatch");
  return { intent, policyFingerprint };
}

// This is a continuation of a positively recorded policy-only outcome, not a
// retry. The new execution is source-gated separately; original ownership and
// payload fingerprints remain immutable. The scoped client permits app POST only.
export async function resumeProductionAccess({ request, env, git, verifyWorkerLease, fetchImpl = fetch, onEvidence, now = Date.now() }) {
  validateProductionRequest(request, env, git, now);
  validatePlanContext(env);
  check(typeof onEvidence === "function", "durable_evidence_callback_required");
  const { originalRequest, evidence } = validatePolicyOnlyRecovery(request, now);
  const api = client(env, fetchImpl, ["access/apps"]);
  const verifiedPolicy = await verifyUnusedOwnedPolicy(api, originalRequest, evidence);
  check(await workerLease(verifyWorkerLease, request) === evidence.workerEligibilityFingerprint, "recovery_worker_lease_changed");
  const checkpoint = { ...structuredClone(evidence), policyFingerprint: verifiedPolicy.policyFingerprint,
    resumeExecutionFingerprint: accessFingerprint(request), resumeExecutionSourceCommit: git.head,
    resumeEvidenceFingerprint: accessFingerprint(evidence) };
  const emit = async stage => {
    checkpoint.stage = stage;
    checkpoint.manualReviewRequired = stage !== "verified";
    checkpoint.automaticMutationRetryAllowed = false;
    await onEvidence(structuredClone(checkpoint));
  };
  await emit("policy_verified");
  const beforeApp = await verifyUnusedOwnedPolicy(api, originalRequest, evidence);
  check(beforeApp.policyFingerprint === checkpoint.policyFingerprint && beforeApp.intent.fingerprint === checkpoint.intentFingerprint,
    "recovery_policy_changed_before_application_create");
  check(await workerLease(verifyWorkerLease, request) === evidence.workerEligibilityFingerprint, "recovery_worker_lease_changed");
  await emit("application_create_requested_outcome_unknown");
  const created = await api("access/apps", { method: "POST",
    body: { ...beforeApp.intent.application, policies: [{ id: checkpoint.policyId, precedence: 1 }] } });
  if (!UUID.test(created.result?.id ?? ""))
    throw new AccessApplyError("access_create", "created_application_identity_unavailable", null, true);
  checkpoint.applicationId = created.result.id;
  await emit("application_created_verification_pending");
  const verified = await verifyOwnedState(api, originalRequest, checkpoint, { sealed: false });
  checkpoint.policyFingerprint = verified.policyFingerprint;
  checkpoint.applicationFingerprint = verified.proof.applicationFingerprint;
  await emit("verified");
  return { checkpoint, proof: verified.proof };
}

// Reconcile a recorded attempt with GETs only. It never resumes a POST, deletes
// resources, or adopts an older same-name resource. The caller decides whether
// to proceed with an independently verified result after an uncertain outcome.
export async function reconcileProductionAccess({ request, env, evidence, fetchImpl = fetch, now = Date.now() }) {
  validateCheckpoint(evidence, request);
  check(STAGES.indexOf(evidence.stage) >= STAGES.indexOf("policy_create_requested_outcome_unknown"), "recorded_create_attempt_required");
  const api = client(env, fetchImpl);
  const apps = await readCompleteList(api, "access/apps");
  const expectedAppName = `${PRODUCTION_APP_NAME} [${request.requestId}]`;
  const candidates = apps.filter(app => app.name === expectedAppName);
  check(candidates.length <= 1, "ambiguous_recorded_application");
  check(!candidates.length || STAGES.indexOf(evidence.stage) >= STAGES.indexOf("application_create_requested_outcome_unknown"), "application_not_requested_by_recorded_attempt");
  const candidate = candidates[0];
  if (evidence.applicationId) check(candidate?.id === evidence.applicationId, "recorded_application_identity_missing");
  const state = await inventory(api, candidate?.id ?? null);
  validatePlan(state.plan, request);
  const intent = createAccessIntent(state.plan, request);
  check(state.plan.sourceFingerprint === evidence.sourceFingerprint && intent.fingerprint === evidence.intentFingerprint, "recorded_source_or_intent_mismatch");
  const policies = state.reusablePolicies.filter(policy => policy.name === intent.policy.name);
  check(policies.length <= 1, "ambiguous_recorded_policy");
  const policy = policies[0];
  if (evidence.policyId) check(policy?.id === evidence.policyId, "recorded_policy_identity_missing");
  check(!candidate || policy, "recorded_application_without_policy");
  check(otherPoliciesFingerprint(state.reusablePolicies, policy?.id ?? null) === evidence.otherPoliciesFingerprint, "recorded_other_policy_inventory_drift");
  const createdForAttempt = (resource, knownId) => {
    if (!resource || resource.id === knownId) return;
    const created = Date.parse(resource.created_at ?? resource.created_on);
    check(Number.isFinite(created) && created >= Date.parse(evidence.preparedAt) - 120000 && created <= now + 120000,
      "resource_creation_time_not_owned_by_attempt");
  };
  createdForAttempt(policy, evidence.policyId); createdForAttempt(candidate, evidence.applicationId);
  if (!policy) return { status: "no_matching_resources", mutationAttempted: false, requestId: request.requestId };
  policyShape(policy, intent.policy, intent.application.allowed_idps);
  if (!candidate) return { status: "policy_only_requires_review", mutationAttempted: false, requestId: request.requestId, policyId: policy.id };
  const checkpoint = { ...evidence, policyId: policy.id, applicationId: candidate.id };
  const verified = await verifyOwnedState(api, request, checkpoint, { sealed: false });
  checkpoint.policyFingerprint = verified.policyFingerprint;
  checkpoint.applicationFingerprint = verified.proof.applicationFingerprint;
  checkpoint.stage = "verified";
  checkpoint.manualReviewRequired = false;
  checkpoint.automaticMutationRetryAllowed = false;
  return { status: "verified_existing_attempt", mutationAttempted: false, checkpoint, proof: verified.proof };
}

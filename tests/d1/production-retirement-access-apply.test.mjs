import test from "node:test";
import assert from "node:assert/strict";
import {
  AccessApplyError, accessApplyFailure, createAccessIntent, createProductionAccess,
  inspectProductionAccess, reconcileProductionAccess, resumeProductionAccess,
} from "../../scripts/security/production-retirement-access-apply.mjs";
import { accessFingerprint, buildAccessPlan, PRODUCTION_APP_NAME, PRODUCTION_POLICY_NAME }
  from "../../scripts/security/production-retirement-access-plan.mjs";
import { REQUEST_PATH } from "../../scripts/security/production-retirement-release.mjs";
import { ACCOUNT, CANDIDATE_REF, EXPECTED_ACCESS_AUTH_DOMAIN, MODES, TARGETS }
  from "../../scripts/security/supabase-retirement-readonly.mjs";

const NOW = Date.parse("2026-11-20T20:00:00Z");
const QA_APP = "11111111-1111-4111-8111-111111111111";
const QA_POLICY = "22222222-2222-4222-8222-222222222222";
const OTP = "33333333-3333-4333-8333-333333333333";
const NEW_POLICY = "44444444-4444-4444-8444-444444444444";
const NEW_APP = "55555555-5555-4555-8555-555555555555";
const PROD_VERSION = "66666666-6666-4666-8666-666666666666";
const QA_VERSION = "77777777-7777-4777-8777-777777777777";
const OTHER_ID = "88888888-8888-4888-8888-888888888888";
const HEAD = "a".repeat(40), PARENT = "b".repeat(40), AUD = "c".repeat(64);
const clone = value => structuredClone(value);
const ok = result => Response.json({ success: true, result: clone(result) });

function fixture() {
  const qaPolicy = { id: QA_POLICY, name: "Reviewed QA Greg", decision: "allow",
    include: [{ email: { email: "greg@vanesch.uk" } }], exclude: [], require: [],
    connection_rules: { rdp: { allowed_clipboard_local_to_remote_formats: [], allowed_clipboard_remote_to_local_formats: ["text"] } },
    reusable: true, created_at: "2026-11-19T12:00:00Z" };
  const state = {
    organization: { auth_domain: EXPECTED_ACCESS_AUTH_DOMAIN, privateConfiguration: "private-organization-configuration" },
    applications: [{ id: QA_APP, name: "Existing QA", type: "self_hosted", session_duration: "24h",
      allowed_idps: [OTP], allow_all_identity_providers: false, http_only_cookie_attribute: true,
      same_site_cookie_attribute: "lax", enable_binding_cookie: true, path_cookie_attribute: true,
      destinations: ["/advisor", "/api/advisor-*", "/api/prospect-update", "/api/client-diagnostic-project*",
        "/api/client-diagnostic-create-project", "/api/client-diagnostic-report"]
        .map(path => ({ type: "public", uri: TARGETS.qa.hosts[0] + path })) }],
    identityProviders: [{ id: OTP, type: "onetimepin", config: { privateProviderConfiguration: "private-idp-configuration" } }],
    qaPolicies: [clone(qaPolicy)], reusablePolicies: [{ ...clone(qaPolicy), app_count: 1 }],
    calls: [], events: [], evidence: [], leaseReads: 0, beforeCall: null, afterPost: null, evidenceHook: null,
    leaseHook: null, appPolicyHook: null,
  };
  const plan = buildAccessPlan({ organization: state.organization, apps: state.applications,
    policies: state.qaPolicies, identityProviders: state.identityProviders });
  const request = { operation: "deploy-reviewed-retirement-candidate-to-production", requestId: "retirement-20261120-production-01",
    requestedAt: new Date(NOW - 1000).toISOString(), reviewedCommit: PARENT, expectedProductionVersionId: PROD_VERSION,
    expectedQaVersionId: QA_VERSION, expectedAccessPlanFingerprint: plan.planFingerprint };
  const env = { GITHUB_REPOSITORY: "gvanesch/fractional-hr-site", GITHUB_REF: CANDIDATE_REF, GITHUB_SHA: HEAD,
    CLOUDFLARE_ACCOUNT_ID: ACCOUNT, CLOUDFLARE_API_TOKEN: "synthetic-worker-token", CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: "synthetic-access-token",
    NEXT_PUBLIC_APP_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://vanesch.uk", ADVISOR_AUTH_MODE: "cloudflare_access",
    ...Object.fromEntries(MODES.map(mode => [mode, "d1"])) };
  const git = { head: HEAD, parent: PARENT, changedPaths: [REQUEST_PATH] };
  const lease = {
    eligibleForReviewedAuthChange: true, productionVersionId: PROD_VERSION, qaVersionId: QA_VERSION,
    productionBindingFingerprint: "d".repeat(64), productionSettingsFingerprint: "e".repeat(64),
    productionRoutingFingerprint: "f".repeat(64), qaBindingFingerprint: "0".repeat(64), qaSettingsFingerprint: "1".repeat(64),
    qaRoutingFingerprint: "2".repeat(64), configurationShapeFingerprint: "3".repeat(64),
    productionEnvironmentVerified: true, productionD1IdentityVerified: true, productionD1ModesVerified: true,
    productionExistingSecretsVerifiedByName: true, productionRuntimeAndGroupingVerified: true,
    priorProductionAuthConfigurationVerified: true, qaIsolationVerified: true, accessApplicationVerified: false,
    dataWrites: false, emailSent: false, deploymentsChanged: false,
  };
  const app = () => state.applications.find(item => item.id === NEW_APP);
  const policy = () => state.reusablePolicies.find(item => item.id === NEW_POLICY);
  async function fetchImpl(input, options) {
    const url = new URL(input), prefix = `/client/v4/accounts/${ACCOUNT}/`;
    assert.equal(url.origin, "https://api.cloudflare.com");
    assert.ok(url.pathname.startsWith(prefix));
    assert.equal(options.redirect, "error");
    assert.equal(options.headers.Authorization, "Bearer synthetic-access-token");
    assert.ok(options.signal instanceof AbortSignal);
    const path = url.pathname.slice(prefix.length), method = options.method;
    const call = { path, query: url.search, method, ...(options.body ? { body: JSON.parse(options.body) } : {}) };
    state.calls.push(call); state.events.push({ type: "request", path, method });
    const override = await state.beforeCall?.(call);
    if (override) return override;
    if (method === "POST") {
      assert.equal(url.search, "");
      assert.equal(options.headers["Content-Type"], "application/json");
      let created;
      if (path === "access/policies") {
        assert.equal(state.evidence.at(-1)?.stage, "policy_create_requested_outcome_unknown");
        assert.equal(policy(), undefined);
        created = { ...clone(call.body), id: NEW_POLICY, uid: NEW_POLICY, reusable: true, app_count: 0, created_at: new Date(NOW).toISOString() };
        state.reusablePolicies.push(created);
      } else if (path === "access/apps") {
        assert.equal(state.evidence.at(-1)?.stage, "application_create_requested_outcome_unknown");
        assert.equal(app(), undefined);
        created = { ...clone(call.body), id: NEW_APP, uid: NEW_APP, aud: AUD, created_at: new Date(NOW).toISOString() };
        state.applications.push(created); policy().app_count = 1;
      } else assert.fail("An unapproved mutation endpoint was called");
      return await state.afterPost?.({ path, created }) ?? ok(created);
    }
    assert.equal(method, "GET");
    assert.equal(options.body, undefined);
    if (["access/apps", "access/identity_providers", "access/policies", `access/apps/${QA_APP}/policies`, `access/apps/${NEW_APP}/policies`].includes(path))
      assert.equal(url.search, "?page=1&per_page=100");
    if (path === "access/organizations") return ok(state.organization);
    if (path === "access/apps") return ok(state.applications);
    if (path === "access/identity_providers") return ok(state.identityProviders);
    if (path === "access/policies") return ok(state.reusablePolicies);
    if (path === `access/apps/${QA_APP}/policies`) return ok(state.qaPolicies);
    if (path === `access/apps/${NEW_APP}`) return ok(app());
    if (path === `access/policies/${NEW_POLICY}`) return ok(policy());
    if (path === `access/apps/${NEW_APP}/policies`)
      return ok(state.appPolicyHook?.() ?? [{ ...clone(policy()), precedence: 1 }]);
    assert.fail(`An unapproved read endpoint was called: ${path}`);
  }
  const onEvidence = async value => {
    await state.evidenceHook?.(value);
    state.evidence.push(clone(value)); state.events.push({ type: "evidence", stage: value.stage });
  };
  const verifyWorkerLease = async () => {
    state.leaseReads++;
    return state.leaseHook?.(state.leaseReads, clone(lease)) ?? clone(lease);
  };
  const inputs = { request, env, git, verifyWorkerLease, fetchImpl, onEvidence, now: NOW };
  return { state, plan, request, env, git, inputs, app, policy,
    create: () => createProductionAccess(inputs),
    inspect: checkpoint => inspectProductionAccess({ request, env, checkpoint, fetchImpl }),
    reconcile: evidence => reconcileProductionAccess({ request, env, evidence, fetchImpl, now: NOW }),
    posts: () => state.calls.filter(call => call.method === "POST") };
}

test("creates one separate Greg policy and exact 42-route app, then supplies a fresh production Access proof", async () => {
  const f = fixture(), originalQa = clone(f.state.applications[0]), originalPolicy = clone(f.state.qaPolicies[0]);
  const result = await f.create();
  assert.equal(f.state.leaseReads, 2);
  assert.deepEqual(f.posts().map(call => call.path), ["access/policies", "access/apps"]);
  assert.equal(f.posts()[0].body.name, `${PRODUCTION_POLICY_NAME} [${f.request.requestId}]`);
  assert.deepEqual(f.posts()[0].body.connection_rules, originalPolicy.connection_rules);
  assert.equal(f.posts()[1].body.name, `${PRODUCTION_APP_NAME} [${f.request.requestId}]`);
  assert.deepEqual(f.posts()[1].body.policies, [{ id: NEW_POLICY, precedence: 1 }]);
  assert.equal(f.posts()[1].body.allow_all_identity_providers, undefined);
  assert.deepEqual(f.posts()[1].body.allowed_idps, [OTP]);
  assert.equal(f.posts()[1].body.destinations.length, 42);
  assert.equal(f.posts()[1].body.domain, "www.vanesch.uk/advisor");
  assert.equal(f.posts()[1].body.path_cookie_attribute, false);
  assert.deepEqual(f.state.applications[0], originalQa);
  assert.deepEqual(f.state.qaPolicies[0], originalPolicy);
  assert.equal(result.checkpoint.stage, "verified");
  assert.equal(result.checkpoint.manualReviewRequired, false);
  assert.equal(result.checkpoint.automaticMutationRetryAllowed, false);
  assert.equal(result.checkpoint.policyId, NEW_POLICY);
  assert.equal(result.checkpoint.applicationId, NEW_APP);
  assert.deepEqual(result.proof, await f.inspect(result.checkpoint));
  assert.equal(result.proof.kind, "verified-production-advisor-access");
  assert.equal(result.proof.accountId, ACCOUNT);
  assert.equal(result.proof.audience, AUD);
  assert.equal(result.proof.teamDomain, `https://${EXPECTED_ACCESS_AUTH_DOMAIN}`);
  assert.equal(result.proof.planFingerprint, f.plan.planFingerprint);
  for (const key of ["protectedRoutesVerified", "publicBoundariesVerified", "identityPolicyVerified"]) assert.equal(result.proof[key], true);
  assert.equal(result.proof.cookiePathAttribute, false);
  assert.equal(f.posts().length, 2);
});

test("awaited evidence precedes both writes and IDs survive strict readback failure without exposing private values", async () => {
  const f = fixture();
  f.state.afterPost = ({ path, created }) => { if (path === "access/apps") created.path_cookie_attribute = true; };
  await assert.rejects(f.create(), /created_application_security_mismatch/);
  const last = f.state.evidence.at(-1);
  assert.equal(last.stage, "application_created_verification_pending");
  assert.equal(last.policyId, NEW_POLICY); assert.equal(last.applicationId, NEW_APP);
  assert.equal(last.manualReviewRequired, true); assert.equal(last.automaticMutationRetryAllowed, false);
  for (const [path, stage] of [["access/policies", "policy_create_requested_outcome_unknown"], ["access/apps", "application_create_requested_outcome_unknown"]]) {
    const write = f.state.events.findIndex(event => event.type === "request" && event.method === "POST" && event.path === path);
    assert.deepEqual(f.state.events[write - 1], { type: "evidence", stage });
  }
  const serialized = JSON.stringify(f.state.evidence);
  for (const secret of ["greg@vanesch.uk", OTP, QA_APP, "private-organization-configuration", "private-idp-configuration",
    "synthetic-worker-token", "synthetic-access-token", AUD]) assert.equal(serialized.includes(secret), false);
});

test("failed durable evidence blocks its pending write", async () => {
  for (const stage of ["policy_create_requested_outcome_unknown", "application_create_requested_outcome_unknown"]) {
    const f = fixture();
    f.state.evidenceHook = value => { if (value.stage === stage) throw new Error("Synthetic durable storage failure"); };
    await assert.rejects(f.create(), /durable storage failure/);
    assert.equal(f.posts().length, stage.startsWith("policy_") ? 0 : 1);
  }
});

test("request, commit, plan, account and credential guards reject before the first mutation", async () => {
  for (const change of [f => { f.request.expectedAccessPlanFingerprint = "0".repeat(64); },
    f => { f.request.reviewedCommit = "f".repeat(40); }, f => { f.git.changedPaths.push("app/page.tsx"); },
    f => { f.request.requestedAt = new Date(NOW - 86400001).toISOString(); },
    f => { f.env.CLOUDFLARE_ACCOUNT_ID = "wrong-account"; }, f => { f.env.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN = ""; },
    f => { f.env.CLOUDFLARE_API_TOKEN = ""; }, f => { f.env.SUPABASE_SERVICE_ROLE_KEY = "forbidden-build-value"; }]) {
    const f = fixture(); change(f); await assert.rejects(f.create()); assert.equal(f.posts().length, 0);
  }
  const f = fixture(); f.inputs.onEvidence = undefined;
  await assert.rejects(f.create(), /durable_evidence_callback_required/);
  assert.equal(f.posts().length, 0);
});

test("existing production coverage and same-purpose reusable policies require reconciliation before any write", async () => {
  for (const change of [
    f => f.state.applications.push({ id: OTHER_ID, type: "self_hosted", destinations: [{ type: "public", uri: "*.vanesch.uk/advisor" }] }),
    f => f.state.reusablePolicies.push({ id: OTHER_ID, name: PRODUCTION_POLICY_NAME }),
    f => f.state.reusablePolicies.push({ id: OTHER_ID, name: `${PRODUCTION_POLICY_NAME} [older-request]` }),
  ]) {
    const f = fixture(); change(f); await assert.rejects(f.create(), /production_access_application_already_present|preexisting_production_policy/);
    assert.equal(f.posts().length, 0);
  }
});

test("every source input, including private IdP configuration, is pinned by the reviewed plan", async () => {
  for (const change of [f => { f.state.identityProviders[0].config.privateProviderConfiguration = "changed"; },
    f => { f.state.organization.privateConfiguration = "changed"; },
    f => { f.state.applications[0].name = "Changed QA"; },
    f => { f.state.qaPolicies[0].connection_rules.rdp.allowed_clipboard_remote_to_local_formats = []; }]) {
    const f = fixture(); change(f); await assert.rejects(f.create(), /reviewed_plan_mismatch/);
    assert.equal(f.posts().length, 0);
  }
});

test("new source or existing reusable policy changes between writes leave only the separately recorded new policy", async () => {
  for (const change of [f => { f.state.applications[0].name = "Concurrent QA edit"; },
    f => { f.state.reusablePolicies[0].name = "Concurrent policy edit"; },
    f => { f.state.qaPolicies[0].include.push({ email: { email: "other@example.invalid" } }); }]) {
    const f = fixture(); f.state.afterPost = ({ path }) => { if (path === "access/policies") change(f); };
    await assert.rejects(f.create());
    assert.equal(f.posts().length, 1); assert.equal(f.state.evidence.at(-1).policyId, NEW_POLICY);
    assert.equal(f.app(), undefined);
  }
});

test("Worker and QA eligibility/current-version changes block the next mutation", async () => {
  for (const at of [1, 2]) {
    const f = fixture();
    f.state.leaseHook = (count, lease) => count === at ? { ...lease, productionVersionId: OTHER_ID } : lease;
    await assert.rejects(f.create(), /worker_eligibility_not_verified/); assert.equal(f.posts().length, at - 1);
  }
  const f = fixture();
  f.state.leaseHook = (count, lease) => count === 2 ? { ...lease, productionSettingsFingerprint: "8".repeat(64) } : lease;
  await assert.rejects(f.create(), /worker_changed_before_application_create/); assert.equal(f.posts().length, 1);
});

test("a policy response with broader identity or changed connection requirements never permits app creation", async () => {
  for (const change of [p => { p.include.push({ email: { email: "other@example.invalid" } }); },
    p => { p.decision = "bypass"; }, p => { p.connection_rules.rdp.allowed_clipboard_local_to_remote_formats = ["file"]; },
    p => { p.approval_required = true; }, p => { p.reusable = false; }, p => { p.new_security_feature = true; },
    p => { p.app_count = 1; }]) {
    const f = fixture(); f.state.afterPost = ({ path, created }) => { if (path === "access/policies") change(created); };
    await assert.rejects(f.create()); assert.equal(f.posts().length, 1);
    assert.equal(f.state.evidence.at(-1).policyId, NEW_POLICY);
  }
});

test("app verification rejects route bypasses, broadened identity, altered cookies and unreviewed active settings", async () => {
  for (const change of [a => { a.destinations[0].overrides = [{ behavior: "public", path_pattern: "*" }]; },
    a => { a.destinations[0].unreviewed = true; }, a => { a.destinations[0].uri = "vanesch.uk"; },
    a => { a.destinations.push({ type: "public", uri: "www.vanesch.uk/" }); },
    a => { a.allow_all_identity_providers = true; }, a => { a.allowed_idps = []; }, a => { a.allowed_idps = [OTHER_ID]; },
    a => { a.path_cookie_attribute = true; }, a => { a.http_only_cookie_attribute = false; },
    a => { a.options_preflight_bypass = true; }, a => { a.read_service_tokens_from_header = "X-Token"; },
    a => { a.scim_config = { enabled: true }; }, a => { a.service_auth_401_redirect = true; },
    a => { a.new_security_feature = true; }, a => { a.policies[0].precedence = 2; },
    a => { a.aud = "not-a-valid-audience"; }]) {
    const f = fixture(); f.state.afterPost = ({ path, created }) => { if (path === "access/apps") change(created); };
    await assert.rejects(f.create()); assert.equal(f.posts().length, 2);
    assert.equal(f.state.evidence.at(-1).applicationId, NEW_APP);
    assert.notEqual(f.state.evidence.at(-1).stage, "verified");
  }
});

test("documented metadata, inert defaults and expanded identical policy readbacks are accepted", async () => {
  const f = fixture();
  f.state.afterPost = ({ path, created }) => {
    if (path === "access/apps") Object.assign(created, { allow_all_identity_providers: false, allow_iframe: false,
      service_auth_401_redirect: false, tags: [], custom_pages: [], scim_config: null,
      updated_at: new Date(NOW).toISOString(), policies: [{ ...clone(f.policy()), precedence: 1 }] });
    else Object.assign(created, { approval_required: false, approval_groups: [], purpose_justification_required: false,
      isolation_required: false, connection_rules: { ...created.connection_rules, ssh: { usernames: [], allow_email_alias: false } } });
  };
  const result = await f.create(); assert.equal(result.checkpoint.stage, "verified");
});

test("expanded application policies cannot contradict separately read policy rules", async () => {
  const f = fixture();
  f.state.afterPost = ({ path, created }) => {
    if (path === "access/apps") created.policies = [{ ...clone(f.policy()), decision: "bypass", precedence: 1 }];
  };
  await assert.rejects(f.create(), /created_policy_security_mismatch/);
  assert.equal(f.state.evidence.at(-1).applicationId, NEW_APP);
});

test("fresh inspector rejects changed QA, other apps/policies, owned policy or owned app state", async () => {
  for (const change of [f => { f.state.qaPolicies[0].name = "Changed"; },
    f => { f.state.applications.push({ id: OTHER_ID, type: "self_hosted", destinations: [{ type: "public", uri: "unrelated.example/private" }] }); },
    f => { f.state.applications.push({ id: OTHER_ID, type: "self_hosted", destinations: [{ type: "public", uri: "vanesch.uk/advisor/crm" }] }); },
    f => { f.state.reusablePolicies[0].name = "Changed other policy"; },
    f => { f.policy().include[0].email.email = "someone@example.invalid"; }, f => { f.policy().app_count = 2; },
    f => { f.app().session_duration = "48h"; }, f => { f.app().aud = "9".repeat(64); },
    f => { f.state.appPolicyHook = () => [{ ...f.policy(), precedence: 2 }]; },
    f => { f.state.appPolicyHook = () => [{ ...f.policy(), precedence: 1 }, { id: OTHER_ID, decision: "bypass" }]; }]) {
    const f = fixture(), { checkpoint } = await f.create(); change(f);
    await assert.rejects(f.inspect(checkpoint)); assert.equal(f.posts().length, 2);
  }
});

test("source changes after app creation cannot produce a verified checkpoint", async () => {
  for (const change of [f => { f.state.applications[0].session_duration = "48h"; },
    f => { f.state.reusablePolicies[0].name = "Changed after app POST"; }]) {
    const f = fixture(); f.state.afterPost = ({ path }) => { if (path === "access/apps") change(f); };
    await assert.rejects(f.create()); assert.equal(f.posts().length, 2);
    assert.equal(f.state.evidence.at(-1).stage, "application_created_verification_pending");
  }
});

test("HTTP rejection and ambiguous transport/provider results do not retry or print provider details", async () => {
  for (const behavior of [
    () => new Response("private provider rejection", { status: 403 }),
    () => new Response("private provider failure", { status: 503 }),
    () => new Response("not-json-private-secret", { status: 200 }),
    () => { throw new Error("private network diagnostic with token"); },
    () => ok({ id: "malformed-sensitive-result" }),
  ]) {
    const f = fixture(); f.state.afterPost = behavior;
    await assert.rejects(f.create(), error => {
      assert.ok(error instanceof AccessApplyError);
      const failure = accessApplyFailure(error);
      assert.equal(failure.mutationOutcomeUnknown, failure.httpStatus !== 403);
      assert.equal(/private|secret|token|sensitive/.test(JSON.stringify(failure)), false);
      assert.equal(/private|secret|token|sensitive/.test(error.message), false);
      return true;
    });
    assert.equal(f.posts().length, 1);
    assert.equal(f.state.evidence.at(-1).stage, "policy_create_requested_outcome_unknown");
  }
});

test("no reusable policy is created if organization reads fail or Worker eligibility is unavailable", async () => {
  const f = fixture(); f.state.beforeCall = call => call.path === "access/organizations" ? new Response("private", { status: 403 }) : null;
  await assert.rejects(f.create(), error => error instanceof AccessApplyError && error.httpStatus === 403 && !error.mutationOutcomeUnknown);
  assert.equal(f.posts().length, 0);
  const unavailable = fixture(); unavailable.inputs.verifyWorkerLease = async () => { throw new Error("private credential error"); };
  await assert.rejects(unavailable.create(), /eligibility_read_failed/); assert.equal(unavailable.posts().length, 0);
});

test("GET-only reconciliation recovers owned app after an ambiguous POST without retrying a mutation", async () => {
  const f = fixture();
  f.state.afterPost = ({ path }) => { if (path === "access/apps") throw new Error("synthetic lost successful response"); };
  await assert.rejects(f.create(), /transport_failure/);
  const evidence = f.state.evidence.at(-1);
  assert.equal(evidence.stage, "application_create_requested_outcome_unknown");
  assert.equal(evidence.applicationId, undefined);
  f.state.afterPost = null;
  const before = f.state.calls.length, recovered = await f.reconcile(evidence);
  assert.equal(recovered.status, "verified_existing_attempt");
  assert.equal(recovered.mutationAttempted, false);
  assert.equal(recovered.checkpoint.applicationId, NEW_APP);
  assert.equal(recovered.checkpoint.stage, "verified");
  assert.equal(recovered.checkpoint.manualReviewRequired, false);
  assert.deepEqual(await f.inspect(recovered.checkpoint), recovered.proof);
  assert.ok(f.state.calls.slice(before).every(call => call.method === "GET"));
  assert.equal(f.posts().length, 2);
});

test("reconciliation reports policy-only and no-resource outcomes for review without resuming creation", async () => {
  const f = fixture(); f.state.afterPost = () => { throw new Error("synthetic unknown policy outcome"); };
  await assert.rejects(f.create(), /transport_failure/);
  const before = f.state.calls.length;
  const recovered = await f.reconcile(f.state.evidence.at(-1));
  assert.deepEqual(recovered, { status: "policy_only_requires_review", mutationAttempted: false, requestId: f.request.requestId, policyId: NEW_POLICY });
  assert.ok(f.state.calls.slice(before).every(call => call.method === "GET"));
  assert.equal(f.posts().length, 1);
  const empty = fixture();
  empty.state.beforeCall = call => { if (call.method === "POST") throw new Error("synthetic request not sent"); };
  await assert.rejects(empty.create(), /transport_failure/);
  empty.state.beforeCall = null;
  assert.equal((await empty.reconcile(empty.state.evidence.at(-1))).status, "no_matching_resources");
  assert.equal(empty.posts().length, 1);
});

test("reconciliation rejects stale same-name resources, changed request evidence and duplicates", async () => {
  for (const change of [f => { f.policy().created_at = "2026-11-18T00:00:00Z"; },
    f => { f.policy().include[0].email.email = "other@example.invalid"; },
    f => { f.state.reusablePolicies.push({ ...clone(f.policy()), id: OTHER_ID }); },
    f => { f.state.evidence.at(-1).intentFingerprint = "0".repeat(64); }]) {
    const f = fixture(); f.state.afterPost = () => { throw new Error("synthetic ambiguous outcome"); };
    await assert.rejects(f.create()); change(f);
    await assert.rejects(f.reconcile(f.state.evidence.at(-1)));
    assert.equal(f.posts().length, 1);
  }
});

test("checkpoints cannot be swapped between requests and unverified checkpoints cannot become release proofs", async () => {
  const f = fixture(), { checkpoint } = await f.create();
  await assert.rejects(f.inspect({ ...checkpoint, stage: "application_created_verification_pending" }), /verified_checkpoint_required/);
  await assert.rejects(f.inspect({ ...checkpoint, requestId: "different-request-001" }), /checkpoint_unverified/);
  await assert.rejects(f.inspect({ ...checkpoint, applicationFingerprint: "0".repeat(64) }), /owned_access_configuration_drift/);
  const changed = clone(f.request); changed.requestId = "different-request-001";
  assert.notEqual(createAccessIntent(f.plan, changed).fingerprint, createAccessIntent(f.plan, f.request).fingerprint);
  assert.equal(checkpoint.requestFingerprint, accessFingerprint(f.request));
});

test("only exact matching policy/application UID aliases are accepted as response metadata", async () => {
  const absent = fixture(); absent.state.afterPost = ({ created }) => { delete created.uid; };
  assert.equal((await absent.create()).checkpoint.stage, "verified");
  for (const path of ["access/policies", "access/apps"]) {
    for (const uid of [OTHER_ID, "not-a-uuid", 42, {}]) {
      const f = fixture(); f.state.afterPost = item => { if (item.path === path) item.created.uid = uid; };
      await assert.rejects(f.create(), /identity_alias_mismatch/);
      assert.equal(f.posts().length, path === "access/policies" ? 1 : 2);
    }
  }
});

test("eager cookie setting preserves the documented true default without changing the create payload", async () => {
  for (const setting of [undefined, true, false, "true", null]) {
    const f = fixture(); f.state.afterPost = ({ path, created }) => {
      if (path === "access/apps" && setting !== undefined) created.eager_redirect_cookie_setting = setting;
    };
    if (setting === undefined || setting === true) assert.equal((await f.create()).checkpoint.stage, "verified");
    else await assert.rejects(f.create(), /created_application_payload_mismatch|created_application_eager_cookie_setting_invalid/);
    assert.equal(Object.hasOwn(f.posts().at(-1).body, "eager_redirect_cookie_setting"), false);
  }
});

async function recoveryFixture() {
  const f = fixture();
  // Reproduce a known successful policy POST whose subsequent verification did
  // not finish, leaving the durable recorded ID and no application attempt.
  f.state.beforeCall = call => call.path === `access/policies/${NEW_POLICY}` ? new Response("synthetic read interruption", { status: 503 }) : null;
  await assert.rejects(f.create(), /http_failure/);
  const originalRequest = clone(f.request), evidence = clone(f.state.evidence.at(-1));
  assert.equal(evidence.stage, "policy_created_verification_pending");
  assert.equal(evidence.policyId, NEW_POLICY);
  f.state.beforeCall = null;
  f.state.calls.length = 0; f.state.events.length = 0; f.state.evidence.length = 0; f.state.leaseReads = 0;
  const recoveryRequest = { ...clone(originalRequest), requestId: "retirement-20261120-recovery-01",
    requestedAt: new Date(NOW).toISOString(), reviewedCommit: "d".repeat(40), accessRecovery: { originalRequest, evidence } };
  const recoveryGit = { head: "e".repeat(40), parent: recoveryRequest.reviewedCommit, changedPaths: [REQUEST_PATH] };
  const recoveryInputs = { ...f.inputs, request: recoveryRequest, git: recoveryGit, env: { ...f.env, GITHUB_SHA: recoveryGit.head } };
  return { ...f, recoveryRequest, recoveryInputs, originalRequest, evidence,
    resume: () => resumeProductionAccess(recoveryInputs) };
}

test("policy-only resume creates only the app and preserves original ownership plus separate execution provenance", async () => {
  const f = await recoveryFixture(), original = clone(f.recoveryRequest.accessRecovery);
  const policyBefore = clone(f.policy());
  const result = await f.resume();
  assert.deepEqual(f.posts().map(call => call.path), ["access/apps"]);
  assert.equal(f.posts()[0].body.name, `${PRODUCTION_APP_NAME} [${f.originalRequest.requestId}]`);
  assert.deepEqual(f.posts()[0].body.policies, [{ id: NEW_POLICY, precedence: 1 }]);
  assert.deepEqual(f.policy(), { ...policyBefore, app_count: 1 });
  assert.equal(f.state.leaseReads, 2);
  assert.deepEqual(f.recoveryRequest.accessRecovery, original);
  assert.equal(result.checkpoint.sourceCommit, HEAD);
  assert.equal(result.checkpoint.requestFingerprint, accessFingerprint(f.originalRequest));
  assert.equal(result.checkpoint.intentFingerprint, f.evidence.intentFingerprint);
  assert.equal(result.checkpoint.resumeExecutionFingerprint, accessFingerprint(f.recoveryRequest));
  assert.equal(result.checkpoint.resumeExecutionSourceCommit, f.recoveryInputs.git.head);
  assert.equal(result.checkpoint.resumeEvidenceFingerprint, accessFingerprint(f.evidence));
  assert.equal(result.checkpoint.stage, "verified");
  assert.deepEqual(result.proof, await f.inspect(result.checkpoint));
  assert.equal(f.posts().length, 1);
  const serialized = JSON.stringify(f.state.evidence);
  for (const secret of ["greg@vanesch.uk", OTP, AUD, "synthetic-access-token", "private-idp-configuration"])
    assert.equal(serialized.includes(secret), false);
});

test("resume refuses unverified or application-attempt evidence, injected fields and mismatched ownership", async () => {
  for (const change of [
    f => { f.evidence.stage = "policy_create_requested_outcome_unknown"; },
    f => { f.evidence.stage = "application_create_requested_outcome_unknown"; },
    f => { f.evidence.stage = "application_created_verification_pending"; },
    f => { f.evidence.applicationId = NEW_APP; },
    f => { f.evidence.applicationFingerprint = "0".repeat(64); },
    f => { f.evidence.secret = "unreviewed-sensitive-value"; },
    f => { f.evidence.policyId = OTHER_ID; },
    f => { f.evidence.requestFingerprint = "0".repeat(64); },
    f => { f.evidence.intentFingerprint = "0".repeat(64); },
    f => { f.evidence.workerEligibilityFingerprint = "0".repeat(64); },
    f => { f.evidence.policyFingerprint = "0".repeat(64); },
    f => { f.evidence.automaticMutationRetryAllowed = true; },
    f => { f.originalRequest.requestId = "different-original-request"; },
    f => { f.originalRequest.accessRecovery = {}; },
    f => { f.originalRequest.expectedProductionVersionId = OTHER_ID; },
    f => { f.recoveryRequest.expectedQaVersionId = OTHER_ID; },
    f => { f.recoveryInputs.git.parent = "f".repeat(40); },
  ]) {
    const f = await recoveryFixture(); change(f);
    await assert.rejects(f.resume()); assert.equal(f.posts().length, 0);
  }
});

test("resume verifies the known unused policy, unchanged source inventory and exact original Worker lease", async () => {
  for (const change of [
    f => { f.state.reusablePolicies = f.state.reusablePolicies.filter(p => p.id !== NEW_POLICY); },
    f => { f.policy().app_count = 1; }, f => { delete f.policy().app_count; },
    f => { f.policy().reusable = false; }, f => { f.policy().name = "Different policy"; },
    f => { f.policy().include[0].email.email = "other@example.invalid"; },
    f => { f.policy().uid = OTHER_ID; },
    f => { f.state.reusablePolicies.push({ ...clone(f.policy()), id: OTHER_ID, uid: OTHER_ID }); },
    f => { f.state.reusablePolicies[0].name = "Changed existing policy"; },
    f => { f.state.identityProviders[0].config.privateProviderConfiguration = "Changed provider"; },
    f => { f.state.applications[0].session_duration = "48h"; },
    f => { f.state.applications.push({ id: OTHER_ID, type: "self_hosted", destinations: [{ type: "public", uri: "vanesch.uk/advisor" }] }); },
    f => { f.state.leaseHook = (_count, lease) => ({ ...lease, productionBindingFingerprint: "9".repeat(64) }); },
  ]) {
    const f = await recoveryFixture(); change(f);
    await assert.rejects(f.resume()); assert.equal(f.posts().length, 0);
  }
});

test("resume rechecks policy and Worker state after its first durable checkpoint", async () => {
  for (const change of [
    f => { f.policy().app_count = 1; },
    f => { f.state.applications[0].name = "Concurrent QA change"; },
    f => { f.state.leaseHook = (_count, lease) => ({ ...lease, productionSettingsFingerprint: "9".repeat(64) }); },
  ]) {
    const f = await recoveryFixture(); f.state.evidenceHook = value => { if (value.stage === "policy_verified") change(f); };
    await assert.rejects(f.resume()); assert.equal(f.posts().length, 0);
  }
});

test("resume requires durable evidence, records app identity before validation and never retries uncertain app writes", async () => {
  const failedEvidence = await recoveryFixture();
  failedEvidence.state.evidenceHook = value => { if (value.stage === "application_create_requested_outcome_unknown") throw new Error("Synthetic durable write failure"); };
  await assert.rejects(failedEvidence.resume(), /durable write failure/); assert.equal(failedEvidence.posts().length, 0);
  const mismatch = await recoveryFixture();
  mismatch.state.afterPost = ({ created }) => { created.uid = OTHER_ID; };
  await assert.rejects(mismatch.resume(), /created_application_identity_alias_mismatch/);
  assert.equal(mismatch.state.evidence.at(-1).applicationId, NEW_APP);
  assert.equal(mismatch.posts().length, 1);
  const uncertain = await recoveryFixture();
  uncertain.state.afterPost = () => { throw new Error("Private lost response"); };
  await assert.rejects(uncertain.resume(), error => error instanceof AccessApplyError && error.mutationOutcomeUnknown === true);
  const evidence = uncertain.state.evidence.at(-1);
  assert.equal(evidence.stage, "application_create_requested_outcome_unknown");
  assert.equal(evidence.applicationId, undefined);
  assert.equal(uncertain.posts().length, 1);
  const recovered = await uncertain.reconcile(evidence);
  assert.equal(recovered.status, "verified_existing_attempt");
  assert.equal(uncertain.posts().length, 1);
});

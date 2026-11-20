import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  AccessPlanError, PRODUCTION_DESTINATIONS, buildAccessPlan, createAccessReader,
  inspectIdentityPolicy, inspectConnectionRules, readCompleteList, readProductionAccessPlan,
} from "../../scripts/security/production-retirement-access-plan.mjs";
import { ACCOUNT, CANDIDATE_REF, EXPECTED_ACCESS_AUTH_DOMAIN, TARGETS } from "../../scripts/security/supabase-retirement-readonly.mjs";

const appId = "11111111-1111-4111-8111-111111111111", policyId = "22222222-2222-4222-8222-222222222222", idpId = "33333333-3333-4333-8333-333333333333";
const env = { GITHUB_REPOSITORY: "gvanesch/fractional-hr-site", GITHUB_REF: CANDIDATE_REF,
  CLOUDFLARE_ACCOUNT_ID: ACCOUNT, CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: "synthetic-audit-secret" };
function fixture() {
  return { organization: { auth_domain: EXPECTED_ACCESS_AUTH_DOMAIN }, apps: [{
    id: appId, type: "self_hosted", session_duration: "24h", allowed_idps: [idpId], allow_all_identity_providers: false,
    http_only_cookie_attribute: true, same_site_cookie_attribute: "lax", enable_binding_cookie: true,
    destinations: ["/advisor", "/api/advisor-*", "/api/prospect-update", "/api/client-diagnostic-project*",
      "/api/client-diagnostic-create-project", "/api/client-diagnostic-report"].map(path => ({ type: "public", uri: TARGETS.qa.hosts[0] + path })),
  }], policies: [{ id: policyId, decision: "allow", include: [{ email: { email: "greg@vanesch.uk" } }], exclude: [], require: [], session_duration: "12h" }],
  identityProviders: [{ id: idpId, type: "onetimepin", config: { syntheticPrivateConfiguration: "not-for-output" } }] };
}
const response = body => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

test("exact production routes cover advisor pages/APIs and leave public/cron routes outside Access", () => {
  const plan = buildAccessPlan(fixture());
  assert.equal(plan.report.planReady, true);
  assert.equal(PRODUCTION_DESTINATIONS.length, 42);
  assert.equal(plan.report.production.requiredRoutesCovered, true);
  assert.equal(plan.report.production.publicPathsExcluded, true);
  assert.equal(plan.application.path_cookie_attribute, false);
  assert.equal(plan.application.enable_binding_cookie, true);
  assert.equal(plan.application.http_only_cookie_attribute, true);
  assert.equal(plan.application.same_site_cookie_attribute, "lax");
  assert.equal(plan.policy.session_duration, "12h");
  assert.deepEqual(plan.application.allowed_idps, [idpId]);
  const report = JSON.stringify(plan.report);
  for (const value of [appId, policyId, idpId, "not-for-output", "synthetic-audit-secret"])
    assert.equal(report.includes(value), false);
});

test("unsupported additional identities, bypass, OR login methods and security requirements do not produce an actionable plan", () => {
  const mutations = [
    f => f.policies[0].include.push({ email: { email: "someone@example.invalid" } }),
    f => f.policies.push({ id: "44444444-4444-4444-8444-444444444444", decision: "bypass" }),
    f => f.policies[0].include.push({ login_method: { id: idpId } }),
    f => f.policies[0].require.push({ auth_method: { auth_method: "mfa" } }),
    f => { f.policies[0].approval_required = true; },
    f => { f.policies[0].mfa_config = { mode: "required" }; },
  ];
  for (const mutate of mutations) {
    const f = fixture(); mutate(f);
    assert.equal(buildAccessPlan(f).report.planReady, false);
  }
  assert.equal(inspectIdentityPolicy(null).supported, false);
});

test("unresolved/non-OTP provider and unsupported login settings remain unready", () => {
  for (const mutate of [f => { f.identityProviders[0].type = "oidc"; }, f => { f.apps[0].allowed_idps = [policyId]; },
    f => { f.apps[0].options_preflight_bypass = true; }, f => { f.apps[0].same_site_cookie_attribute = "unexpected"; },
    f => { f.apps[0].mfa_config = {mode:"required"}; }]) {
    const f = fixture(); mutate(f); assert.equal(buildAccessPlan(f).report.planReady, false);
  }
});

test("reviewed OTP requirements and supported MFA/session restrictions are preserved exactly", () => {
  const f = fixture();
  f.policies[0].require = [{login_method:{id:idpId}}];
  f.policies[0].mfa_config = {mfa_disabled:false,allowed_authenticators:["security_key"],session_duration:"1h"};
  f.policies[0].connection_rules = {};
  const plan = buildAccessPlan(f);
  assert.equal(plan.report.planReady, true);
  assert.deepEqual(plan.policy.require, f.policies[0].require);
  assert.deepEqual(plan.policy.mfa_config, f.policies[0].mfa_config);
  assert.equal(JSON.stringify(plan.report).includes(idpId), false);
  f.policies[0].require[0].login_method.id = policyId;
  assert.equal(buildAccessPlan(f).report.planReady, false);
});

test("documented connection rules preserve RDP restrictions and normalize only inert SSH defaults", () => {
  const f = fixture();
  f.policies[0].connection_rules = {ssh:{usernames:[],allow_email_alias:false},rdp:{allowed_clipboard_local_to_remote_formats:[]}};
  const plan = buildAccessPlan(f);
  assert.equal(plan.report.planReady, true);
  assert.deepEqual(plan.policy.connection_rules, {rdp:{allowed_clipboard_local_to_remote_formats:[]}});
  assert.equal(plan.report.qaIdentity.restrictions.connectionRules.inactiveSshDefaults, true);
  for (const value of [{ssh:{usernames:["private-user"]}}, {ssh:{allow_email_alias:true}},
    {ssh:{unrecognized:"private"}}, {rdp:{allowed_clipboard_local_to_remote_formats:["unknown"]}}, {unknown:{}}]) {
    const inspected = inspectConnectionRules(value);
    assert.equal(inspected.report.supported, false);
    assert.equal(JSON.stringify(inspected.report).includes("private-user"), false);
  }
});

test("existing exact/wildcard production coverage or a mixed-host QA template blocks the plan", () => {
  for (const uri of ["www.vanesch.uk/advisor", "vanesch.uk/api/anything", "*.vanesch.uk/advisor"] ) {
    const f = fixture(); f.apps.push({ id: policyId, type: "self_hosted", destinations: [{ type: "public", uri }] });
    assert.throws(() => buildAccessPlan(f), /production_access_application_already_present/);
  }
  const f = fixture(); f.apps[0].destinations.push({ type: "public", uri: "unrelated.example/advisor" });
  assert.throws(() => buildAccessPlan(f), /qa_template_has_other_hosts/);
});

test("unknown destination types and wrong team are not absence proof", () => {
  const f = fixture(); f.apps[0].destinations.push({ type: "all_workers" });
  assert.throws(() => buildAccessPlan(f), /unreviewed_application_destination/);
  const other = fixture(); other.organization.auth_domain = "different.cloudflareaccess.com";
  assert.throws(() => buildAccessPlan(other), /zero_trust_team_mismatch/);
  const malformed = fixture(); malformed.apps[0].self_hosted_domains = "invalid";
  assert.throws(() => buildAccessPlan(malformed), /malformed_application_destinations/);
});

test("read-only client confines audit credential to fixed-account GET allowlist and rejects redirects/HTTP errors", async () => {
  const requests = [];
  const get = createAccessReader(env, async (url, options) => { requests.push({url, options}); return response({success: true, result: []}); });
  await get("access/identity_providers?page=1&per_page=100");
  assert.equal(requests[0].options.method, "GET");
  assert.equal(requests[0].options.redirect, "error");
  assert.equal(requests[0].options.body, undefined);
  assert.equal(requests[0].options.headers.Authorization, "Bearer synthetic-audit-secret");
  assert.ok(requests[0].url.startsWith(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/`));
  for (const path of ["access/apps", "access/policies", "../accounts/other/access/apps", "workers/scripts/fractional-hr-site/settings", "https://example.invalid"])
    await assert.rejects(get(path), /unsupported_read_endpoint/);
  const denied = createAccessReader(env, async () => new Response("secret-provider-message", {status: 403}));
  await assert.rejects(denied("access/organizations"), e => e instanceof AccessPlanError && e.code === "read_http_failure" && e.httpStatus === 403 && !e.message.includes("secret-provider-message"));
  const malformed = createAccessReader(env, async () => response({result: []}));
  await assert.rejects(malformed("access/organizations"), /read_provider_rejected/);
});

test("complete pagination rejects duplicate, changing and partial lists", async () => {
  const row = {id: appId};
  for (const pages of [
    [{success:true,result:[row],result_info:{page:1,per_page:1,total_count:2,total_pages:2}}, {success:true,result:[row],result_info:{page:2,per_page:1,total_count:2,total_pages:2}}],
    [{success:true,result:[row],result_info:{page:1,per_page:1,total_count:2,total_pages:2}}, {success:true,result:[],result_info:{page:2,per_page:1,total_count:3,total_pages:3}}],
    [{success:true,result:[row],result_info:{page:1,per_page:100,total_count:2,total_pages:1}}],
    [{success:true,result:[row],result_info:{page:1,per_page:1,total_count:2,total_pages:2}}, {success:true,result:[{id:policyId}],result_info:{page:2,per_page:2,total_count:2,total_pages:2}}],
    [{success:true,result:[row],result_info:{page:1,per_page:100,total_pages:0}}],
  ]) {
    let index=0; await assert.rejects(readCompleteList(async () => pages[index++], "access/apps"), AccessPlanError);
  }
});

test("live planner uses only bounded GET calls and emits no provider details", async () => {
  const f = fixture(), paths = [];
  const plan = await readProductionAccessPlan({env, fetchImpl: async (url, options) => {
    assert.equal(options.method, "GET"); paths.push(new URL(url).pathname);
    const path = new URL(url).pathname;
    return response({success: true, result: path.endsWith("/organizations") ? f.organization : path.endsWith("/identity_providers") ? f.identityProviders : path.endsWith("/policies") ? f.policies : f.apps});
  }});
  assert.equal(paths.length, 4);
  assert.equal(plan.report.planReady, true);
  assert.equal(JSON.stringify(plan.report).includes("not-for-output"), false);
});

test("source fingerprints change on QA and application inventory drift", () => {
  const f = fixture(), first = buildAccessPlan(f).sourceFingerprint;
  f.apps.push({id: policyId,type:"self_hosted",destinations:[{type:"public",uri:"separate.example/private"}]});
  assert.notEqual(buildAccessPlan(f).sourceFingerprint, first);
  const provider = fixture(); provider.identityProviders[0].config.syntheticPrivateConfiguration = "changed";
  assert.notEqual(buildAccessPlan(provider).sourceFingerprint, first);
});

test("planner workflow supplies token only to the read step and includes no deployment or mutation command", async () => {
  const workflow = await readFile(new URL("../../.github/workflows/production-retirement-access-plan.yml", import.meta.url), "utf8");
  assert.equal((workflow.match(/secrets\.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN/g) ?? []).length, 1);
  assert.equal(/wrangler|deploy|SUPABASE_SERVICE_ROLE_KEY/.test(workflow), false);
  const preflightStep = workflow.split("      - name: Read actual production runtime and release eligibility\n")[1].split("      - name:")[0];
  assert.equal((preflightStep.match(/secrets\.CLOUDFLARE_API_TOKEN/g) ?? []).length, 1);
  assert.equal(preflightStep.includes("CLOUDFLARE_RETIREMENT_AUDIT_TOKEN"), false);
});

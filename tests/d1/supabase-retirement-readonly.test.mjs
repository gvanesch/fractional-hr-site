import test from "node:test";
import assert from "node:assert/strict";
import {
  ACCOUNT, CANDIDATE_REF, TARGETS, MODES, REQUIRED_BINDINGS, REQUIRED_TABLES,
  SCHEMA_SELECT, inspectSettings, matchesDestination, runAudit, validateContext,
} from "../../scripts/security/supabase-retirement-readonly.mjs";

const privateValue = "private-value-must-not-be-logged";
const env = {
  GITHUB_REPOSITORY: "gvanesch/fractional-hr-site", GITHUB_REF: CANDIDATE_REF,
  CLOUDFLARE_ACCOUNT_ID: ACCOUNT, CLOUDFLARE_API_TOKEN: privateValue,
};
function fixtureBindings(target = TARGETS.production) {
  return [
    { name: "DB", type: "d1", id: target.database },
    ...MODES.map(name => ({ name, type: "plain_text", text: "d1" })),
    { name: "ADVISOR_AUTH_MODE", type: "plain_text", text: "cloudflare_access" },
    ...REQUIRED_BINDINGS.map(name => ({ name, type: "secret_text", text: privateValue })),
    { name: "SUPABASE_SERVICE_ROLE_KEY", type: "secret_text", text: privateValue },
  ];
}
function fixture({ targetName = "production", missingMode, accessUnavailable = false, supabaseRequired = false, missingTable } = {}) {
  const target = TARGETS[targetName];
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    url = String(url);
    requests.push({ url, options });
    if (url.startsWith("https://api.cloudflare.com/")) {
      assert.equal(options.redirect, "error", "never forward API credentials across a redirect");
      assert.equal(options.headers.Authorization, `Bearer ${privateValue}`);
      let result;
      if (url.endsWith("/query")) {
        assert.equal(options.method, "POST");
        assert.equal(url, `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${target.database}/query`);
        assert.deepEqual(JSON.parse(options.body), { sql: SCHEMA_SELECT });
        result = [{ success: true, results: REQUIRED_TABLES.filter(name => name !== missingTable).map(name => ({ name })) }];
      } else {
        assert.equal(options.method, "GET", "only the fixed schema SELECT may POST");
        assert.equal(options.body, undefined);
        if (url.endsWith("/settings")) result = { bindings: fixtureBindings(target).filter(b => b.name !== missingMode) };
        else if (url.endsWith("/secrets")) result = [];
        else if (url.includes("/access/apps?")) {
          if (accessUnavailable) return new Response("forbidden", { status: 403 });
          result = target.hosts.map((host, index) => ({
            id: `${index}0000000-0000-4000-8000-000000000000`, domain: host, aud: privateValue,
          }));
        } else if (url.endsWith("/policies")) result = [{ decision: "allow", include: [{ email: { email: "private-person@example.invalid" } }] }];
        else if (url.endsWith("/deployments")) result = { deployments: [{ versions: [{ version_id: "00000000-0000-4000-8000-000000000000", percentage: 100 }] }] };
        else assert.fail(`Unexpected API path: ${url}`);
      }
      return Response.json({ success: true, result });
    }
    assert.ok(target.hosts.includes(new URL(url).hostname), "only audited website hosts are allowed");
    assert.equal(options.method, "GET", "no synthetic production submission in this audit");
    assert.equal(options.headers, undefined, "Cloudflare API token must not reach the website");
    if (url.endsWith("/api/health")) return Response.json({ d1: "connected", supabase: supabaseRequired ? "connected" : "not_required" });
    if (new URL(url).pathname.startsWith("/api/")) return new Response(null, { status: 405 });
    return new Response("<html>Public website fixture</html>", { headers: { "Content-Type": "text/html" } });
  };
  return { fetchImpl, requests };
}

test("retirement read-only audit refuses the wrong repository, branch, account or target before making requests", async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; assert.fail("no requests allowed"); };
  for (const changed of [
    { GITHUB_REF: "refs/heads/main" }, { GITHUB_REPOSITORY: "other/repository" },
    { CLOUDFLARE_ACCOUNT_ID: "other" }, { CLOUDFLARE_API_TOKEN: "" },
  ]) await assert.rejects(runAudit({ env: { ...env, ...changed }, fetchImpl }), /context is not verified/);
  await assert.rejects(runAudit({ env, targetName: "anything", fetchImpl }), /context is not verified/);
  assert.equal(calls, 0);
  assert.equal(validateContext(env, "qa"), TARGETS.qa);
});

test("retirement audit reads only schema and metadata and never emits secrets or personal records", async () => {
  for (const targetName of ["production", "qa"]) {
    const f = fixture({ targetName });
    const result = await runAudit({ env, targetName, fetchImpl: f.fetchImpl });
    assert.equal(result.readOnlyChecksPassed, true, JSON.stringify(result.blockers));
    assert.equal(result.scope.supabaseDataParityRequired, false);
    assert.equal(result.scope.authenticatedAdvisorFlowTested, false);
    assert.equal(result.scope.healthCheckSubmissionTested, false);
    assert.equal(result.scope.clientRecordsRead, false);
    assert.equal(result.scope.dataWrites, false);
    assert.equal(result.scope.emailSent, false);
    assert.equal(result.scope.deploymentsChanged, false);
    assert.equal(result.access.applications[0].audienceMatch, "unverifiable_secret");
    assert.ok(result.publicApiBoundaries.every(route => route.applicationMethodRejected));
    const output = JSON.stringify(result);
    assert.ok(!output.includes(privateValue));
    assert.ok(!output.includes("private-person"));
    assert.equal(f.requests.filter(r => r.options.method === "POST").length, 1);
    assert.ok(!f.requests.some(r => /supabase\.co|resend\.com/.test(r.url)));
  }
});

test("D1 fallbacks, missing schema and Supabase-dependent live health are retirement blockers", async () => {
  const f = fixture({ missingMode: "D1_CRM_PROSPECTS_MODE", missingTable: "client_participant_otp_challenges", supabaseRequired: true });
  const result = await runAudit({ env, fetchImpl: f.fetchImpl });
  assert.equal(result.readOnlyChecksPassed, false);
  assert.equal(result.config.d1Modes.D1_CRM_PROSPECTS_MODE, false);
  assert.equal(result.schema.client_participant_otp_challenges, false);
  assert.equal(result.health.supabaseNotRequired, false);
  assert.equal(result.blockers.length, 3);
});

test("unreadable Access configuration is an unknown blocker, never a success", async () => {
  const f = fixture({ accessUnavailable: true });
  const result = await runAudit({ env, fetchImpl: f.fetchImpl });
  assert.equal(result.readOnlyChecksPassed, false);
  assert.equal(result.access.inventoryComplete, false);
  assert.ok(result.blockers.some(message => message.includes("not readable")));
});

test("empty configuration values do not qualify as configured", () => {
  const values = fixtureBindings().map(binding => binding.name === "ADVISOR_ALLOWED_EMAILS" ? { ...binding, type: "plain_text", text: "  " } : binding);
  const { report } = inspectSettings({ bindings: values }, [], TARGETS.production);
  assert.equal(report.requiredBindings.ADVISOR_ALLOWED_EMAILS, false);
  assert.ok(!JSON.stringify(report).includes(privateValue));
});

test("Access destination inventory respects path boundaries and documented wildcard behavior", () => {
  const match = (destination, path, host = "vanesch.uk") => matchesDestination(destination, new URL(`https://${host}${path}`));
  assert.equal(match("vanesch.uk/advisor", "/advisor"), true);
  assert.equal(match("vanesch.uk/advisor", "/advisor/baseline/api/campaigns"), true);
  assert.equal(match("vanesch.uk/advisor", "/advisor-public"), false);
  assert.equal(match("vanesch.uk/advisor/*", "/advisor"), false);
  assert.equal(match("vanesch.uk/advisor/*", "/advisor/login"), true);
  assert.equal(match("vanesch.uk/api/advisor-*", "/api/advisor-logout"), true);
  assert.equal(match("vanesch.uk/api/advisor-*", "/api/contact"), false);
  assert.equal(match("vanesch.uk", "/advisor", "www.vanesch.uk"), false);
  assert.equal(match("evil.example/advisor", "/advisor"), false);
});

test("website redirects never leak the Cloudflare API credential or follow an unapproved host", async () => {
  const f = fixture();
  let external = false;
  const fetchImpl = async (url, options) => {
    if (String(url).startsWith("https://vanesch.uk")) return new Response(null, { status: 302, headers: { Location: "https://unapproved.example/login" } });
    if (String(url).includes("unapproved.example")) external = true;
    return f.fetchImpl(url, options);
  };
  const result = await runAudit({ env, fetchImpl });
  assert.equal(external, false);
  assert.equal(result.readOnlyChecksPassed, false);
  assert.equal(result.health.supabaseNotRequired, false);
  assert.ok(result.publicPages.every(page => !page.available));
});

test("a public API redirected to same-host Access login is a blocker, even when a login page could return 200", async () => {
  const f = fixture();
  let followedLogin = false;
  const fetchImpl = async (url, options) => {
    if (String(url).endsWith("/api/diagnostic-complete")) return new Response(null, { status: 302, headers: { Location: "/cdn-cgi/access/login" } });
    if (String(url).includes("/cdn-cgi/access/login")) followedLogin = true;
    return f.fetchImpl(url, options);
  };
  const result = await runAudit({ env, fetchImpl });
  assert.equal(followedLogin, false);
  assert.equal(result.readOnlyChecksPassed, false);
  assert.equal(result.publicApiBoundaries.find(route => route.path === "/api/diagnostic-complete").applicationMethodRejected, false);
});

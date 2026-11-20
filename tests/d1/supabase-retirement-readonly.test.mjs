import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import {
  ACCOUNT, CANDIDATE_REF, TARGETS, MODES, REQUIRED_BINDINGS, REQUIRED_TABLES,
  SCHEMA_SELECT, PROTECTED_PATHS, inspectSettings, matchesDestination, runAudit, validateContext, failureReport,
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
function fixture({ targetName = "production", missingMode, accessUnavailable = false, supabaseRequired = false, missingTable, applications } = {}) {
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
          result = applications ?? target.hosts.map((host, index) => ({
            id: `${index}0000000-0000-4000-8000-000000000000`, domain: host, aud: privateValue,
          }));
        } else if (url.endsWith("/policies")) result = [{ decision: "allow", include: [{ email: { email: "private-person@example.invalid" } }] }];
        else if (url.endsWith("/workers/scripts")) result = [{ id: target.worker, tag: "12345678901234567890123456789012" }];
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
  assert.equal(result.access.coverageStatus, "unknown");
  assert.ok(!result.blockers.some(message => message.includes("No candidate")));
  assert.ok(result.access.routes.every(route => route.coverage === "unknown"));
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
  assert.equal(match("*.vanesch.uk/advisor*", "/advisor", "www.vanesch.uk"), true);
  assert.equal(match("*.vanesch.uk/advisor*", "/advisor", "vanesch.uk"), false);
  assert.equal(match("*.vanesch.uk/advisor*", "/advisor", "one.two.vanesch.uk"), false);
  assert.equal(match("https://VANESCH.UK/advisor*", "/advisor"), true);
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

test("the audit covers every existing advisor API except the explicitly independent cron endpoint", () => {
  const expected = readdirSync(new URL("../../app/api/", import.meta.url)).filter(name => name.startsWith("advisor-") && name !== "advisor-daily-action-digest");
  for (const name of expected) assert.ok(PROTECTED_PATHS.includes(`/api/${name}`), `Missing advisor coverage: ${name}`);
});

test("modern public wildcard destinations are detected without disclosing any other app domains", async () => {
  const f = fixture({ targetName: "qa", applications: [
    { id: "00000000-0000-4000-8000-000000000000", domain: "unrelated-private.example", destinations: [{ type: "public", uri: "*.greg-732.workers.dev/advisor*" }] },
    { id: "10000000-0000-4000-8000-000000000000", domain: "another-private.example" },
  ] });
  const result = await runAudit({ env, targetName: "qa", fetchImpl: f.fetchImpl });
  assert.equal(result.access.diagnostics.totalApplicationsRead, 2);
  assert.equal(result.access.matchingApplicationCount, 1);
  assert.equal(result.access.diagnostics.matchingWildcardPublicDestinations, 1);
  assert.equal(result.access.diagnostics.matchingModernPublicDestinations, 1);
  assert.equal(result.access.routes.find(route => route.path === "/advisor").coverage, "candidate_match");
  assert.ok(!JSON.stringify(result).includes("private.example"));
});

test("Worker destinations resolve immutable IDs and respect public path overrides", async () => {
  const f = fixture({ applications: [{
    id: "00000000-0000-4000-8000-000000000000",
    destinations: [{ type: "worker", worker_id: "12345678901234567890123456789012", overrides: [{ behavior: "public", path_pattern: "/api/advisor-logout" }] }],
  }] });
  const result = await runAudit({ env, fetchImpl: f.fetchImpl });
  assert.equal(result.access.diagnostics.matchingWorkerDestinations, 1);
  assert.equal(result.access.matchingApplicationCount, 1);
  assert.equal(result.access.diagnostics.workerIdentityReadable, true);
  assert.equal(result.access.routes.find(route => route.path === "/advisor").coverage, "candidate_match");
  assert.equal(result.access.routes.find(route => route.path === "/api/advisor-logout").coverage, "no_candidate_match");
  assert.ok(!JSON.stringify(result).includes("12345678901234567890123456789012"));
});

test("modern destinations supersede legacy domains and unknown shapes cannot produce an absence claim", async () => {
  const f = fixture({ applications: [{
    id: "00000000-0000-4000-8000-000000000000", domain: "vanesch.uk", self_hosted_domains: ["vanesch.uk"],
    destinations: [{ type: "public", uri: "private-other-app.example" }, { type: "new-unhandled-type", secret: privateValue }],
  }] });
  const result = await runAudit({ env, fetchImpl: f.fetchImpl });
  assert.equal(result.access.matchingApplicationCount, 0);
  assert.equal(result.access.parsingComplete, false);
  assert.equal(result.access.coverageStatus, "unknown");
  assert.equal(result.access.diagnostics.unknownDestinationTypeCount, 1);
  assert.ok(!JSON.stringify(result).includes("private-other-app"));
  assert.ok(!JSON.stringify(result).includes("new-unhandled-type"));
  assert.ok(!JSON.stringify(result).includes(privateValue));
  assert.ok(!result.blockers.some(message => message.includes("No candidate")));
});

test("failed required reads report a fixed operation and HTTP status while suppressing provider and transport details", async () => {
  const f = fixture();
  const fetchImpl = async (url, options) => String(url).endsWith("/query")
    ? new Response(privateValue, { status: 403 }) : f.fetchImpl(url, options);
  let output;
  try { await runAudit({ env, fetchImpl }); assert.fail("expected read denial"); }
  catch (error) { output = failureReport(error); }
  assert.deepEqual(output.failure, { operation: "d1_schema", code: "http_failure", httpStatus: 403 });
  assert.ok(!JSON.stringify(output).includes(privateValue));
  assert.ok(!JSON.stringify(failureReport(new Error(privateValue))).includes(privateValue));
});

test("unrecognized self-hosted application destination structure keeps coverage unknown", async () => {
  const f = fixture({ applications: [{ type: "self_hosted", destinations: { unexpected: privateValue } }] });
  const result = await runAudit({ env, fetchImpl: f.fetchImpl });
  assert.equal(result.access.diagnostics.unparsedApplicationCount, 1);
  assert.equal(result.access.diagnostics.malformedDestinationListCount, 1);
  assert.equal(result.access.coverageStatus, "unknown");
  assert.ok(!result.blockers.some(message => message.includes("No candidate")));
  assert.ok(!JSON.stringify(result).includes(privateValue));
});

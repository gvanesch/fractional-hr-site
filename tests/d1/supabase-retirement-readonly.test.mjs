import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  ACCOUNT, CANDIDATE_REF, TARGETS, MODES, REQUIRED_BINDINGS, REQUIRED_TABLES,
  SCHEMA_SELECT, PROTECTED_PATHS, EXPECTED_ACCESS_AUTH_DOMAIN, inspectSettings, inspectAccessOrganization, inspectWorkerBuildSettings, inspectWorkerBuildTriggers, matchesDestination, runAudit, validateContext, failureReport,
} from "../../scripts/security/supabase-retirement-readonly.mjs";

const privateValue = "private-value-must-not-be-logged";
const auditPrivateValue = "audit-token-must-not-be-logged";
const workerTag = "12345678901234567890123456789012";
function fixtureBuildTrigger({ index = 0, includes = ["migration/d1"], excludes = [] } = {}) {
  return {
    trigger_uuid: `${String(index).padStart(8, "0")}-0000-4000-8000-000000000000`, external_script_id: workerTag,
    branch_includes: includes, branch_excludes: excludes, deleted_on: null,
    repo_connection: { provider_type: "github", provider_account_name: "gvanesch", repo_name: "fractional-hr-site", repo_id: privateValue, deleted_on: null },
    trigger_name: privateValue, build_command: privateValue, deploy_command: privateValue,
    build_token_uuid: privateValue, environment_variables: { PRIVATE: auditPrivateValue },
  };
}
function fixtureBuildSettings({ branch = "migration/d1", previewsEnabled = false } = {}) {
  return {
    script_tag: workerTag,
    git_repository: { provider_type: "github", provider_account_name: "gvanesch", repo_name: "fractional-hr-site", branch, repo_id: privateValue },
    production_settings: { build_command: privateValue, deploy_command: privateValue, build_token_uuid: privateValue, environment_variables: { SECRET: { value: privateValue, is_secret: true } } },
    previews_enabled: previewsEnabled,
    previews_base_config: { environment_variables: { PRIVATE: privateValue } },
  };
}
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
function fixture({ targetName = "production", missingMode, accessUnavailable = false, supabaseRequired = false, missingTable, applications, auditToken, buildTriggers } = {}) {
  const target = TARGETS[targetName];
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    url = String(url);
    requests.push({ url, options });
    if (url.startsWith("https://api.cloudflare.com/")) {
      assert.equal(options.redirect, "error", "never forward API credentials across a redirect");
      const dedicatedRead = auditToken && (/\/access\//.test(url) || /\/builds\/workers\/[a-f\d]{32}\/triggers\?/.test(url));
      assert.equal(options.headers.Authorization, `Bearer ${dedicatedRead ? auditToken : privateValue}`);
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
        else if (url.endsWith("/access/organizations")) result = { auth_domain: EXPECTED_ACCESS_AUTH_DOMAIN, private_configuration: privateValue };
        else if (url.includes("/access/apps?")) {
          if (accessUnavailable) return new Response("forbidden", { status: 403 });
          result = applications ?? target.hosts.map((host, index) => ({
            id: `${index}0000000-0000-4000-8000-000000000000`, domain: host, aud: privateValue,
          }));
        } else if (url.endsWith("/policies")) result = [{ decision: "allow", include: [{ email: { email: "private-person@example.invalid" } }] }];
        else if (url.endsWith("/workers/scripts")) result = [{ id: target.worker, tag: "12345678901234567890123456789012" }];
        else if (url.includes(`/builds/workers/${workerTag}/triggers?`)) result = buildTriggers ?? [fixtureBuildTrigger()];
        else if (url.endsWith(`/builds/workers/${workerTag}`)) result = fixtureBuildSettings();
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
    assert.deepEqual(result.access.organization, { readable: true, authDomain: EXPECTED_ACCESS_AUTH_DOMAIN, expectedAuthDomainMatch: true, failure: null });
    assert.ok(result.publicApiBoundaries.every(route => route.applicationMethodRejected));
    const output = JSON.stringify(result);
    assert.ok(!output.includes(privateValue));
    assert.ok(!output.includes("private-person"));
    assert.ok(!output.includes(workerTag));
    assert.equal(result.externalBuilds.checked, targetName === "production");
    if (targetName === "production") {
      assert.equal(result.externalBuilds.workerMatched, true);
      assert.equal(result.externalBuilds.productionBranch, "migration/d1");
      assert.equal(result.externalBuilds.mainPushMayTriggerBuild, false);
      assert.ok(f.requests.some(r => r.url.endsWith(`/builds/workers/${workerTag}`)));
    } else assert.ok(!f.requests.some(r => r.url.includes("/builds/")));
    assert.equal(f.requests.filter(r => r.options.method === "POST").length, 1);
    assert.ok(!f.requests.some(r => /supabase\.co|resend\.com/.test(r.url)));
  }
});

test("external build settings report branch risk without leaking commands, variables, tokens or Worker IDs", () => {
  for (const [branch, previewsEnabled, mainPushMayTriggerBuild] of [["main", false, true], ["migration/d1", true, true], ["migration/d1", false, false]]) {
    const report = inspectWorkerBuildSettings(fixtureBuildSettings({ branch, previewsEnabled }), workerTag);
    assert.equal(report.readable, true);
    assert.equal(report.repositoryMatches, true);
    assert.equal(report.workerMatched, true);
    assert.equal(report.productionBranch, branch);
    assert.equal(report.mainPushMayTriggerBuild, mainPushMayTriggerBuild);
    assert.ok(!JSON.stringify(report).includes(privateValue));
    assert.ok(!JSON.stringify(report).includes(workerTag));
  }
  const unknownRepository = fixtureBuildSettings();
  delete unknownRepository.git_repository.provider_account_name;
  assert.equal(inspectWorkerBuildSettings(unknownRepository, workerTag).mainPushMayTriggerBuild, null);
  const wrongWorker = { ...fixtureBuildSettings(), script_tag: "00000000000000000000000000000000" };
  assert.equal(inspectWorkerBuildSettings(wrongWorker, workerTag).workerMatched, false);
  assert.equal(inspectWorkerBuildSettings(wrongWorker, workerTag).mainPushMayTriggerBuild, null);
});

test("unavailable or unrecognized external build configuration stays unknown and does not hide the rest of the audit", async () => {
  const cases = [
    { response: () => new Response(privateValue, { status: 403 }), code: "http_failure", httpStatus: 403 },
    { response: () => new Response(privateValue, { status: 404 }), code: "http_failure", httpStatus: 404 },
    { response: () => { throw new Error(privateValue); }, code: "transport_failure", httpStatus: null },
    { response: () => new Response(privateValue, { status: 200 }), code: "invalid_json", httpStatus: 200 },
    { response: () => Response.json({ success: true, result: { environment_variables: privateValue } }), code: "invalid_build_configuration", httpStatus: null },
  ];
  for (const item of cases) {
    const f = fixture();
    const fetchImpl = async (url, options) => String(url).includes("/builds/workers/") ? item.response() : f.fetchImpl(url, options);
    const result = await runAudit({ env, fetchImpl });
    assert.equal(result.externalBuilds.readable, false);
    assert.equal(result.externalBuilds.configurationFound, null, "a denied or unsupported read is not proof that no build integration exists");
    assert.equal(result.externalBuilds.mainPushMayTriggerBuild, null);
    assert.deepEqual(result.externalBuilds.failure, { code: item.code, httpStatus: item.httpStatus });
    assert.equal(result.health.d1Connected, true);
    assert.equal(result.deployedVersions.length, 1);
    assert.ok(!JSON.stringify(result).includes(privateValue));
  }
});

test("build inspection never guesses a Worker tag or queries build configuration after an identity failure", async () => {
  const f = fixture();
  let buildRequested = false;
  const fetchImpl = async (url, options) => {
    if (String(url).endsWith("/workers/scripts")) return Response.json({ success: true, result: [{ id: TARGETS.production.worker, tag: "not-a-worker-tag" }] });
    if (String(url).includes("/builds/workers/")) buildRequested = true;
    return f.fetchImpl(url, options);
  };
  const result = await runAudit({ env, fetchImpl });
  assert.equal(buildRequested, false);
  assert.equal(result.externalBuilds.workerMatched, null);
  assert.equal(result.externalBuilds.mainPushMayTriggerBuild, null);
  assert.equal(result.externalBuilds.failure.code, "worker_identity_unverified");
});

test("Zero Trust team parser normalizes only safe hostnames and never echoes other configuration", () => {
  for (const auth_domain of [EXPECTED_ACCESS_AUTH_DOMAIN, `  HTTPS://${EXPECTED_ACCESS_AUTH_DOMAIN.toUpperCase()}/  `]) {
    assert.deepEqual(inspectAccessOrganization({ auth_domain, identity_provider: privateValue }), {
      readable: true, authDomain: EXPECTED_ACCESS_AUTH_DOMAIN, expectedAuthDomainMatch: true, failure: null,
    });
  }
  for (const auth_domain of [null, {}, "", `http://${EXPECTED_ACCESS_AUTH_DOMAIN}`, `${EXPECTED_ACCESS_AUTH_DOMAIN}?token=${privateValue}`,
    `${privateValue}@${EXPECTED_ACCESS_AUTH_DOMAIN}`, `${EXPECTED_ACCESS_AUTH_DOMAIN}/private`, `${EXPECTED_ACCESS_AUTH_DOMAIN}.evil.invalid`]) {
    const result = inspectAccessOrganization({ auth_domain, private_configuration: privateValue });
    assert.equal(result.readable, false);
    assert.equal(result.authDomain, null);
    assert.equal(result.expectedAuthDomainMatch, null);
    assert.equal(result.failure.code, "invalid_auth_domain");
    assert.ok(!JSON.stringify(result).includes(privateValue));
  }
});

test("a different Zero Trust team is distinguished from an empty app inventory", async () => {
  const f = fixture({ applications: [] });
  const fetchImpl = async (url, options) => String(url).endsWith("/access/organizations")
    ? Response.json({ success: true, result: { auth_domain: "different-team.cloudflareaccess.com", secret: privateValue } })
    : f.fetchImpl(url, options);
  const result = await runAudit({ env, fetchImpl });
  assert.equal(result.access.organization.readable, true);
  assert.equal(result.access.organization.authDomain, "different-team.cloudflareaccess.com");
  assert.equal(result.access.organization.expectedAuthDomainMatch, false);
  assert.equal(result.access.diagnostics.totalApplicationsRead, 0);
  assert.equal(result.readOnlyChecksPassed, false);
  assert.ok(result.blockers.some(message => message.includes("does not match")));
  assert.ok(!JSON.stringify(result).includes(privateValue));
});

test("Zero Trust identity read failures remain explicit and sanitized while other audit evidence completes", async () => {
  const cases = [
    { response: () => new Response(privateValue, { status: 403 }), code: "http_failure", httpStatus: 403 },
    { response: () => { throw new Error(privateValue); }, code: "transport_failure", httpStatus: null },
    { response: () => new Response(privateValue, { status: 200 }), code: "invalid_json", httpStatus: 200 },
    { response: () => Response.json({ success: false, errors: [privateValue] }), code: "provider_rejected", httpStatus: 200 },
    { response: () => Response.json({ success: true, result: { auth_domain: privateValue } }), code: "invalid_auth_domain", httpStatus: null },
  ];
  for (const item of cases) {
    const f = fixture();
    const fetchImpl = async (url, options) => String(url).endsWith("/access/organizations") ? item.response() : f.fetchImpl(url, options);
    const result = await runAudit({ env, fetchImpl });
    assert.deepEqual(result.access.organization, {
      readable: false, authDomain: null, expectedAuthDomainMatch: null,
      failure: { code: item.code, httpStatus: item.httpStatus },
    });
    assert.equal(result.readOnlyChecksPassed, false);
    assert.equal(result.health.d1Connected, true);
    assert.equal(result.deployedVersions.length, 1);
    assert.equal(result.access.inventoryComplete, true);
    assert.ok(result.blockers.some(message => message.includes("organization identity is not readable")));
    assert.ok(!JSON.stringify(result).includes(privateValue));
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

test("optional audit credential reaches only Access metadata and read-only Worker trigger inventory", async () => {
  for (const targetName of ["production", "qa"]) {
    const f = fixture({ targetName, auditToken: auditPrivateValue });
    const result = await runAudit({ env: { ...env, CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: auditPrivateValue }, targetName, fetchImpl: f.fetchImpl });
    assert.equal(result.readOnlyChecksPassed, true);
    for (const { url, options } of f.requests) {
      const dedicated = /\/access\//.test(url) || /\/builds\/workers\/[a-f\d]{32}\/triggers\?/.test(url);
      if (dedicated) {
        assert.equal(options.method, "GET");
        assert.equal(options.body, undefined);
        assert.equal(options.redirect, "error");
        assert.equal(options.headers.Authorization, `Bearer ${auditPrivateValue}`);
      } else if (url.startsWith("https://api.cloudflare.com/")) assert.equal(options.headers.Authorization, `Bearer ${privateValue}`);
      else assert.equal(options.headers, undefined);
    }
    assert.equal(f.requests.filter(r => r.options.method === "POST").length, 1, "Only the existing fixed schema SELECT may POST");
    assert.ok(!f.requests.some(r => /environment_variables|\/logs|\/tokens/.test(r.url)));
    assert.ok(!f.requests.some(r => r.url.endsWith(`/builds/workers/${workerTag}`)), "The dedicated path must not use the broader legacy build-configuration endpoint");
    assert.ok(f.requests.some(r => r.url.endsWith("/settings") && r.options.headers.Authorization === `Bearer ${privateValue}`));
    if (targetName === "production") {
      assert.equal(result.externalBuilds.source, "worker_triggers");
      assert.equal(result.externalBuilds.inventoryComplete, true);
      assert.equal(result.externalBuilds.productionBranch, "migration/d1");
      assert.equal(result.externalBuilds.mainPushMatchesListedTrigger, false);
      assert.equal(result.externalBuilds.mainPushMayTriggerBuild, null, "A negative trigger projection is not proof that every build integration is disabled");
    } else assert.ok(!f.requests.some(r => r.url.includes("/builds/")));
    assert.ok(!JSON.stringify(result).includes(privateValue));
    assert.ok(!JSON.stringify(result).includes(auditPrivateValue));
    assert.ok(!JSON.stringify(result).includes(workerTag));
  }
});

test("missing or blank optional audit token preserves the established credential and legacy build inspection", async () => {
  for (const token of [undefined, "", "   "]) {
    const f = fixture();
    const result = await runAudit({ env: { ...env, CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: token }, fetchImpl: f.fetchImpl });
    assert.equal(result.externalBuilds.productionBranch, "migration/d1");
    assert.equal(result.externalBuilds.mainPushMayTriggerBuild, false);
    assert.ok(f.requests.some(r => r.url.endsWith(`/builds/workers/${workerTag}`)));
    assert.ok(!f.requests.some(r => r.url.includes("/triggers?")));
  }
});

test("documented trigger projection reports main eligibility without echoing private trigger configuration", () => {
  const cases = [
    { triggers: [fixtureBuildTrigger({ includes: ["main"] })], main: true },
    { triggers: [fixtureBuildTrigger()], main: false },
    { triggers: [fixtureBuildTrigger(), fixtureBuildTrigger({ index: 1, includes: ["*"], excludes: ["migration/d1"] })], main: true },
    { triggers: [fixtureBuildTrigger({ includes: ["*"], excludes: ["main"] })], main: false },
    { triggers: [fixtureBuildTrigger({ includes: [privateValue] })], main: false },
    { triggers: [], main: false },
  ];
  for (const { triggers, main } of cases) {
    const result = inspectWorkerBuildTriggers(triggers, workerTag);
    assert.equal(result.readable, true);
    assert.equal(result.inventoryComplete, true);
    assert.equal(result.mainPushMatchesListedTrigger, main);
    assert.equal(result.mainPushMayTriggerBuild, main ? true : null);
    assert.equal(result.previewsEnabled, null, "Do not infer modern Preview settings from a legacy trigger projection");
    assert.ok(!JSON.stringify(result).includes(privateValue));
    assert.ok(!JSON.stringify(result).includes(auditPrivateValue));
    assert.ok(!JSON.stringify(result).includes(workerTag));
  }
  const deleted = fixtureBuildTrigger({ includes: ["main"] });
  deleted.deleted_on = "2026-01-01T00:00:00Z";
  assert.equal(inspectWorkerBuildTriggers([deleted], workerTag).mainPushMatchesListedTrigger, false);
});

test("unrecognized trigger data or rules remain unknown instead of proving no automatic builds", () => {
  const valid = fixtureBuildTrigger();
  for (const triggers of [
    {}, [privateValue], [{ ...valid, trigger_uuid: undefined }], [valid, valid],
    [{ ...valid, external_script_id: "different" }], [{ ...valid, repo_connection: undefined }],
    [{ ...valid, branch_includes: undefined }], [{ ...valid, branch_excludes: undefined }],
    [{ ...valid, branch_includes: ["feature/*"] }], [{ ...valid, branch_includes: ["*"], branch_excludes: [] }],
    [{ ...valid, deleted_on: privateValue }],
  ]) {
    const result = inspectWorkerBuildTriggers(triggers, workerTag);
    assert.equal(result.readable, false);
    assert.equal(result.mainPushMatchesListedTrigger, null);
    assert.equal(result.mainPushMayTriggerBuild, null);
    assert.ok(result.failure.code);
    assert.ok(!JSON.stringify(result).includes(privateValue));
  }
});

test("dedicated trigger pagination uses only bounded GETs and completes before reporting branch eligibility", async () => {
  const f = fixture({ auditToken: auditPrivateValue });
  const pages = [];
  const fetchImpl = async (url, options) => {
    if (String(url).includes("/triggers?")) {
      assert.equal(options.method, "GET");
      assert.equal(options.body, undefined);
      assert.equal(options.headers.Authorization, `Bearer ${auditPrivateValue}`);
      assert.equal(options.redirect, "error");
      const page = Number(new URL(url).searchParams.get("page"));
      pages.push(page);
      return Response.json({ success: true, result: [fixtureBuildTrigger({ index: page, includes: [page === 2 ? "main" : "migration/d1"] })],
        result_info: { page, per_page: 1, count: 1, total_pages: 2, total_count: 2 } });
    }
    return f.fetchImpl(url, options);
  };
  const result = await runAudit({ env: { ...env, CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: auditPrivateValue }, fetchImpl });
  assert.deepEqual(pages, [1, 2]);
  assert.equal(result.externalBuilds.inventoryComplete, true);
  assert.equal(result.externalBuilds.triggerCount, 2);
  assert.equal(result.externalBuilds.pagesFetched, 2);
  assert.equal(result.externalBuilds.mainPushMayTriggerBuild, true);
});

test("partial, repeated, changing or unrecognized pagination cannot produce a completed trigger inventory", async () => {
  const cases = [
    { response: page => page === 2 ? new Response(privateValue, { status: 403 }) : Response.json({ success: true, result: [fixtureBuildTrigger()], result_info: { page, per_page: 1, count: 1, total_pages: 2, total_count: 2 } }), code: "http_failure" },
    { response: page => Response.json({ success: true, result: [fixtureBuildTrigger()], result_info: { page, per_page: 1, count: 1, total_pages: 2, total_count: 2 } }), code: "invalid_or_duplicate_trigger" },
    { response: page => Response.json({ success: true, result: [fixtureBuildTrigger({ index: page })], result_info: { page: 1, per_page: 1, count: 1, total_pages: 2, total_count: 2 } }), code: "invalid_trigger_pagination" },
    { response: page => Response.json({ success: true, result: [fixtureBuildTrigger({ index: page })], result_info: { page, per_page: 1, count: 1, total_pages: 3, total_count: page === 1 ? 3 : 4 } }), code: "changing_trigger_pagination" },
    { response: page => Response.json({ success: true, result: [fixtureBuildTrigger({ index: page })], result_info: { page, per_page: page, count: 1, total_pages: 2, total_count: 2 } }), code: "changing_trigger_pagination" },
    { response: () => Response.json({ success: true, result: [], result_info: { page: 1, count: 0, total_pages: 1, total_count: 2 } }), code: "inconsistent_trigger_pagination" },
    { response: () => Response.json({ success: true, result: [fixtureBuildTrigger()], result_info: { page: 1, total_pages: 0 } }), code: "inconsistent_trigger_pagination" },
    { response: () => Response.json({ success: true, result: [], result_info: { per_page: 1000 } }), code: "invalid_trigger_pagination" },
    { response: () => Response.json({ success: true, result: [], result_info: { cursor: privateValue } }), code: "invalid_trigger_pagination" },
  ];
  for (const item of cases) {
    const f = fixture({ auditToken: auditPrivateValue });
    const fetchImpl = (url, options) => String(url).includes("/triggers?") ? item.response(Number(new URL(url).searchParams.get("page"))) : f.fetchImpl(url, options);
    const result = await runAudit({ env: { ...env, CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: auditPrivateValue }, fetchImpl });
    assert.equal(result.externalBuilds.inventoryComplete, false);
    assert.equal(result.externalBuilds.mainPushMayTriggerBuild, null);
    assert.equal(result.externalBuilds.configurationFound, null);
    assert.equal(result.externalBuilds.failure.code, item.code);
    assert.ok(!JSON.stringify(result).includes(privateValue));
    assert.ok(!JSON.stringify(result).includes(auditPrivateValue));
    assert.equal(result.health.d1Connected, true, "Optional trigger failure must preserve other audit evidence");
  }
});

test("trigger inventory stops after five pages and never follows provider URLs or asks for build logs", async () => {
  const f = fixture({ auditToken: auditPrivateValue });
  let requests = 0;
  const fetchImpl = (url, options) => {
    if (String(url).includes("/triggers?")) {
      requests++;
      const page = Number(new URL(url).searchParams.get("page"));
      return Response.json({ success: true, result: [fixtureBuildTrigger({ index: page })],
        result_info: { page, per_page: 1, count: 1, total_pages: 1000, total_count: 1000 } });
    }
    return f.fetchImpl(url, options);
  };
  const result = await runAudit({ env: { ...env, CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: auditPrivateValue }, fetchImpl });
  assert.equal(requests, 5);
  assert.equal(result.externalBuilds.failure.code, "trigger_pagination_limit");
  assert.equal(result.externalBuilds.triggerCount, 5);
  assert.equal(result.externalBuilds.inventoryComplete, false);
  assert.equal(result.externalBuilds.mainPushMayTriggerBuild, null);
});

test("audit-token denials and unsafe provider responses stay sanitized with no credential fallback", async () => {
  for (const response of [
    () => new Response(auditPrivateValue, { status: 403 }),
    () => { throw new Error(`${privateValue} ${auditPrivateValue}`); },
    () => new Response(auditPrivateValue, { status: 200 }),
    () => Response.json({ success: true, result: { environment_variables: auditPrivateValue } }),
    () => Response.json({ success: "false", result: [] }),
    () => Response.json(null),
  ]) {
    const f = fixture({ auditToken: auditPrivateValue });
    let attempts = 0;
    const fetchImpl = (url, options) => {
      if (String(url).includes("/triggers?")) {
        attempts++;
        assert.equal(options.headers.Authorization, `Bearer ${auditPrivateValue}`);
        return response();
      }
      return f.fetchImpl(url, options);
    };
    const result = await runAudit({ env: { ...env, CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: auditPrivateValue }, fetchImpl });
    assert.equal(attempts, 1);
    assert.equal(result.externalBuilds.readable, false);
    assert.equal(result.externalBuilds.mainPushMayTriggerBuild, null);
    assert.ok(!f.requests.some(r => r.url.endsWith(`/builds/workers/${workerTag}`)));
    assert.ok(!JSON.stringify(result).includes(privateValue));
    assert.ok(!JSON.stringify(result).includes(auditPrivateValue));
  }
});

test("dedicated Access read failures never retry with the deployment credential", async () => {
  for (const deniedEndpoint of ["/access/organizations", "/access/apps?", "/policies"]) {
    const f = fixture({ auditToken: auditPrivateValue });
    let attempts = 0;
    const fetchImpl = (url, options) => {
      if (String(url).includes(deniedEndpoint)) {
        attempts++;
        assert.equal(options.method, "GET");
        assert.equal(options.body, undefined);
        assert.equal(options.headers.Authorization, `Bearer ${auditPrivateValue}`);
        return new Response(`${privateValue} ${auditPrivateValue}`, { status: 403 });
      }
      return f.fetchImpl(url, options);
    };
    const result = await runAudit({ env: { ...env, CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: auditPrivateValue }, fetchImpl });
    assert.equal(attempts, deniedEndpoint === "/policies" ? TARGETS.production.hosts.length : 1);
    assert.equal(result.readOnlyChecksPassed, false);
    assert.equal(result.health.d1Connected, true);
    assert.ok(!JSON.stringify(result).includes(privateValue));
    assert.ok(!JSON.stringify(result).includes(auditPrivateValue));
  }
});

test("Access credential is confined to reviewed reads and the request-gated Access cutover, absent from builds and runtime", () => {
  const workflows = new URL("../../.github/workflows/", import.meta.url);
  const tokenName = "CLOUDFLARE_RETIREMENT_AUDIT_TOKEN";
  const source = readFileSync(new URL("supabase-retirement-verification.yml", workflows), "utf8");
  const [buildJob, readJob] = source.split("  live-readonly:");
  assert.ok(!buildJob.includes(tokenName));
  assert.equal(readJob.match(new RegExp(`${tokenName}:`, "g")).length, 1);
  const readStep = readJob.split("      - name: Read Worker configuration, D1 schema, Access policies and public pages\n")[1].split("      - name:")[0];
  assert.ok(readStep.includes("CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: ${{ secrets.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN }}"));
  const plan = readFileSync(new URL("production-retirement-access-plan.yml", workflows), "utf8");
  const [beforePlan, planAndLater] = plan.split("      - name: Read existing Access policy and prepare bounded production configuration\n");
  assert.ok(!beforePlan.includes(tokenName));
  const [planStep, ...laterSteps] = planAndLater.split("      - name:");
  assert.equal(planStep.match(new RegExp(`${tokenName}:`, "g")).length, 1);
  assert.ok(planStep.includes("run: node scripts/security/production-retirement-access-plan.mjs > production-retirement-access-plan-report.json"));
  assert.ok(!laterSteps.join("\n").includes(tokenName));
  assert.ok(!/wrangler|npm (?:run )?(?:build|deploy)|run:.*production-retirement-release\.mjs/.test(plan));
  const cutover = readFileSync(new URL("production-retirement-cutover.yml", workflows), "utf8");
  const [beforeApply, applyAndLater] = cutover.split("      - name: Apply the exact Access plan and activate the verified production Worker once\n");
  assert.ok(!beforeApply.includes(tokenName));
  const [applyStep, ...afterApply] = applyAndLater.split("      - name:");
  assert.equal(applyStep.match(new RegExp(`${tokenName}:`, "g")).length, 1);
  assert.ok(applyStep.includes("CLOUDFLARE_RETIREMENT_AUDIT_TOKEN: ${{ secrets.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN }}"));
  assert.ok(applyStep.includes("run: node scripts/security/production-retirement-cutover.mjs apply"));
  assert.ok(!afterApply.join("\n").includes(tokenName));
  assert.ok(cutover.includes("      - scripts/security/production-retirement-release-request.json"));
  assert.ok(!cutover.includes("workflow_dispatch"));
  for (const file of readdirSync(workflows).filter(file => file.endsWith(".yml") && !["supabase-retirement-verification.yml", "production-retirement-access-plan.yml", "production-retirement-cutover.yml"].includes(file)))
    assert.ok(!readFileSync(new URL(file, workflows), "utf8").includes(tokenName), `Audit token must not enter ${file}`);
  assert.ok(!readFileSync(new URL("../../wrangler.jsonc", import.meta.url), "utf8").includes(tokenName));
});

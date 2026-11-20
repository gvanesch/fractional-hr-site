import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  PRODUCTION_HEALTHCHECK_ORIGIN as SITE, ProductionHealthCheckError,
  productionHealthCheckFailure, prepareProductionHealthCheckSmoke,
  reserveProductionHealthCheckAttempt, verifyProductionHealthCheckSmoke,
  runProductionHealthCheckSmoke,
} from "../../scripts/security/production-healthcheck-smoke.mjs";

const ACCOUNT = "73221f18acc676e4992c89fcbf2b2a8f";
const DATABASE = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc";
const WORKER = "fractional-hr-site";
const VERSION = "11111111-2222-4333-8444-555555555555";
const DEPLOYMENT = "77777777-2222-4333-8444-555555555555";
const SUBMISSION = "22222222-2222-4333-8444-555555555555";
const PUBLIC_TOKEN = "33333333-2222-4333-8444-555555555555";
const EXISTING = "44444444-2222-4333-8444-555555555555";
const OTHER_VERSION = "55555555-2222-4333-8444-555555555555";
const PROVIDER_ID = "synthetic-private-provider-id";
const PRIVATE_SENDER = "synthetic-private-sender@example.invalid";
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;
const env = Object.freeze({
  GITHUB_REPOSITORY: "gvanesch/fractional-hr-site",
  GITHUB_REF: "refs/heads/chore/supabase-retirement-2026-11",
  CLOUDFLARE_ACCOUNT_ID: ACCOUNT,
  CLOUDFLARE_API_TOKEN: "synthetic-production-token-do-not-log",
});
const request = Object.freeze({ operation: "verify-healthcheck-on-production",
  requestId: "retirement-20261120-production-test", expectedProductionVersionId: VERSION });
const ATTEMPT_ID = `production-healthcheck-smoke:${request.requestId}`;
const MARKER = `SYNTHETIC PRODUCTION TEST - ${request.requestId}`;
const ANSWERS = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [index + 1, 3]));
const failure = code => error => error instanceof ProductionHealthCheckError && error.code === code;

function harness(t) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  for (const migration of ["0001_create_system_events.sql", "0002_create_diagnostic_submissions.sql"])
    sqlite.exec(readFileSync(new URL(`../../migrations/${migration}`, import.meta.url), "utf8"));
  sqlite.prepare("INSERT INTO diagnostic_submissions (id,submission_id,email,country_region,notes) VALUES (?,?,?,?,?)")
    .run(EXISTING, EXISTING, "existing@example.invalid", "Existing region", "Preserve this existing record");
  sqlite.prepare("INSERT INTO system_events (event_id,event_type,metadata) VALUES (?,?,?)")
    .run("existing-event", "existing-system-event", JSON.stringify({ preserve: true }));
  const existingSnapshot = () => JSON.stringify({
    row: sqlite.prepare("SELECT * FROM diagnostic_submissions WHERE id = ?").get(EXISTING),
    event: sqlite.prepare("SELECT * FROM system_events WHERE event_id = 'existing-event'").get(),
  });
  const preserved = existingSnapshot();
  const bindings = [
    { name: "DB", type: "d1", id: DATABASE }, { name: "ASSETS", type: "assets" },
    { name: "WORKER_SELF_REFERENCE", type: "service", service: WORKER },
    { name: "RESEND_API_KEY", type: "secret_text" },
    ...Object.entries({ NEXT_PUBLIC_APP_ENV: "production", ADVISOR_AUTH_MODE: "cloudflare_access",
      NEXT_PUBLIC_SITE_URL: SITE, CONTACT_TO_EMAIL: "greg@vanesch.uk", CONTACT_FROM_EMAIL: PRIVATE_SENDER,
      ...Object.fromEntries(["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"]
        .map(name => [`D1_${name}_MODE`, "d1"])),
    }).map(([name, text]) => ({ name, type: "plain_text", text })),
  ];
  const state = { bindings, versionBindings: structuredClone(bindings), activeVersion: VERSION,
    deploymentId: DEPLOYMENT, versionId: VERSION, databaseId: DATABASE, databaseName: "vanesch-prod",
    health: { status: "ok", d1: "connected", supabase: "not_required" },
    calls: [], queries: 0, reservationWrites: 0, posts: 0, notifications: 0, browserSubmissions: 0,
    splitTraffic: false, dropPost: false, loseResponse: false, redirectPost: false, badJSON: false,
    emailFails: false, omitNotification: false, badResult: false, afterReserve: null, afterSubmit: null, beforeQuery: null };
  function cf(result) { return Response.json({ success: true, result }); }
  function insertEvent(type, status = "success", metadata = {}, id = type) {
    sqlite.prepare("INSERT INTO system_events (event_id,event_type,status,submission_id,metadata) VALUES (?,?,?,?,?)")
      .run(id, type, status, SUBMISSION, JSON.stringify(metadata));
  }
  function submit(body, method) {
    const keys = ["answers", "companySize", "countryRegion", "industry", "role"];
    if (method === "browser") keys.push("email");
    assert.deepEqual(Object.keys(body).sort(), keys.sort());
    assert.deepEqual(body.answers, ANSWERS);
    assert.equal(body.companySize, "1–25 employees");
    assert.equal(body.industry, "Other");
    assert.equal(body.role, "Other");
    assert.equal(body.countryRegion, MARKER);
    if (method === "browser") assert.equal(body.email, "", "The real browser form submits a blank optional email");
    else assert.equal(Object.hasOwn(body, "email"), false);
    assert.equal(Object.hasOwn(body, "website"), false);
    if (method === "browser") state.browserSubmissions++;
    sqlite.prepare(`INSERT INTO diagnostic_submissions
      (id,submission_id,public_token,answers,score,band,email,company_size,industry,role,country_region,completed_at,submission_source)
      VALUES (?,?,?,?,50,'Structured but Improving',NULL,?,?,?,?,?,'health-check')`)
      .run(SUBMISSION, SUBMISSION, PUBLIC_TOKEN, JSON.stringify(body.answers), body.companySize, body.industry,
        body.role, body.countryRegion, "2026-11-20T20:00:00.000Z");
    insertEvent("health_check_db_insert");
    state.notifications++;
    if (!state.omitNotification) insertEvent("health_check_internal_email", state.emailFails ? "error" : "success",
      state.emailFails ? { message: "Private provider rejection" } : { resendId: PROVIDER_ID });
    state.afterSubmit?.();
    return { ok: true, submissionId: SUBMISSION, publicToken: PUBLIC_TOKEN, score: 50, band: "Structured but Improving",
      resendId: state.emailFails ? null : PROVIDER_ID, internalEmailStatus: state.emailFails ? "failed" : "sent" };
  }
  async function fetchImpl(url, options) {
    state.calls.push({ url, method: options.method });
    assert.equal(options.redirect, "error");
    assert.ok(options.signal);
    if (url.startsWith(API + "/")) {
      assert.equal(options.headers.Authorization, `Bearer ${env.CLOUDFLARE_API_TOKEN}`);
      const path = url.slice(API.length);
      if (path !== `/d1/database/${DATABASE}/query`) assert.equal(options.method, "GET");
      if (path === `/workers/scripts/${WORKER}/settings`) return cf({ bindings: state.bindings });
      if (path === `/workers/scripts/${WORKER}/deployments`) return cf({ deployments: [{ id: state.deploymentId,
        versions: state.splitTraffic ? [{ version_id: state.activeVersion, percentage: 50 }, { version_id: OTHER_VERSION, percentage: 50 }]
          : [{ version_id: state.activeVersion, percentage: 100 }] }] });
      if (path === `/workers/scripts/${WORKER}/versions/${VERSION}`)
        return cf({ id: state.versionId, resources: { bindings: state.versionBindings } });
      if (path === `/d1/database/${DATABASE}`) return cf({ uuid: state.databaseId, name: state.databaseName });
      assert.equal(path, `/d1/database/${DATABASE}/query`, "Only fixed production metadata and D1 paths are allowed");
      assert.equal(options.method, "POST");
      const { sql, params } = JSON.parse(options.body);
      state.queries++;
      assert.doesNotMatch(sql, /\b(?:DELETE|UPDATE|DROP|CREATE|ALTER)\b/i);
      assert.ok(params.every(value => typeof value === "string"));
      state.beforeQuery?.(sql, params);
      if (/^SELECT/.test(sql)) {
        assert.match(sql, /WHERE (?:country_region|event_id|submission_id) = \?/);
        assert.equal(params.length, 1);
        assert.ok([MARKER, ATTEMPT_ID, SUBMISSION].includes(params[0]), "Every SQL read is scoped to the owned test identity");
        return cf([{ success: true, results: sqlite.prepare(sql).all(...params), meta: { changes: 0 } }]);
      }
      assert.match(sql, /^INSERT OR IGNORE INTO system_events/);
      assert.equal(params.length, 2);
      assert.equal(params[0], ATTEMPT_ID);
      const result = sqlite.prepare(sql).run(...params);
      state.reservationWrites += Number(result.changes);
      state.afterReserve?.();
      return cf([{ success: true, results: [], meta: { changes: Number(result.changes) } }]);
    }
    assert.equal(new URL(url).origin, SITE, "Hosted requests target the fixed production website only");
    assert.equal(options.headers?.Authorization, undefined, "Provider credentials never reach the website");
    const parsed = new URL(url);
    if (parsed.pathname === "/api/health") {
      assert.equal(options.method, "GET");
      return Response.json(state.health);
    }
    if (parsed.pathname === "/api/public-diagnostic-result") {
      assert.equal(options.method, "GET");
      assert.equal(parsed.searchParams.get("token"), PUBLIC_TOKEN);
      const row = sqlite.prepare("SELECT * FROM diagnostic_submissions WHERE public_token = ?").get(PUBLIC_TOKEN);
      return Response.json({ ok: true, result: { rawScore: 30, score: state.badResult ? 99 : row.score, band: { label: row.band } },
        context: { companySize: row.company_size, industry: row.industry, role: row.role, emailPresent: false } });
    }
    assert.equal(parsed.pathname, "/api/diagnostic-complete");
    assert.equal(options.method, "POST");
    state.posts++;
    if (state.dropPost) throw new Error(`Private transport message ${env.CLOUDFLARE_API_TOKEN} ${PUBLIC_TOKEN}`);
    if (state.redirectPost) return new Response(null, { status: 307, headers: { location: "https://other.invalid/private" } });
    const result = submit(JSON.parse(options.body), "api");
    if (state.loseResponse) throw new Error(`Private lost response ${PUBLIC_TOKEN} ${PROVIDER_ID}`);
    if (state.badJSON) return new Response(`Private provider response ${PROVIDER_ID}`, { status: 200 });
    return Response.json(result);
  }
  const options = overrides => ({ request, env, fetchImpl, ...overrides });
  return { sqlite, state, insertEvent, unchanged: () => assert.equal(existingSnapshot(), preserved),
    prepare: overrides => prepareProductionHealthCheckSmoke(options(overrides)),
    reserve: (checkpoint, method = "browser", overrides) => reserveProductionHealthCheckAttempt({ ...options(overrides), checkpoint, method }),
    verify: overrides => verifyProductionHealthCheckSmoke(options(overrides)),
    run: overrides => runProductionHealthCheckSmoke(options(overrides)),
    browserSubmit: payload => submit({ ...payload, email: "" }, "browser") };
}

test("Preparation performs bounded reads and returns a UI-compatible synthetic payload without email", async t => {
  const h = harness(t), prepared = await h.prepare();
  assert.equal(prepared.state, "ready");
  assert.equal(prepared.readOnly, true);
  assert.equal(prepared.databaseWrites, false);
  assert.equal(prepared.formUrl, `${SITE}/diagnostic`);
  assert.deepEqual(prepared.payload, { answers: ANSWERS, companySize: "1–25 employees", industry: "Other", role: "Other", countryRegion: MARKER });
  assert.equal(h.state.reservationWrites, 0);
  assert.equal(h.state.posts, 0);
  assert.equal(h.state.notifications, 0);
  h.unchanged();
});

test("One hosted submission proves production D1 and public result; rerun is read-only and preserves existing data", async t => {
  const h = harness(t), first = await h.run(), second = await h.run();
  assert.equal(first.createdSubmission, true);
  assert.equal(first.applicationSubmissionAttempted, true);
  assert.equal(first.d1WriteVerified, true);
  assert.equal(first.publicResultVerified, true);
  assert.equal(first.internalNotificationStatus, "provider_accepted");
  assert.equal(first.advisorEmailProviderAccepted, true);
  assert.equal(first.participantEmails, 0);
  assert.equal(first.submissionMethod, "api");
  assert.equal(first.automaticResubmissionAllowed, false);
  assert.equal(second.reusedSubmission, true);
  assert.equal(second.applicationSubmissionAttempted, false);
  assert.equal(h.state.posts, 1);
  assert.equal(h.state.reservationWrites, 1);
  assert.equal(h.state.notifications, 1);
  assert.equal(h.sqlite.prepare("SELECT count(*) n FROM diagnostic_submissions").get().n, 2);
  assert.doesNotMatch(JSON.stringify([first, second]), new RegExp([PUBLIC_TOKEN, SUBMISSION, PROVIDER_ID, PRIVATE_SENDER, env.CLOUDFLARE_API_TOKEN, "greg@vanesch.uk"].join("|")));
  h.unchanged();
});

test("Browser reservation excludes the API writer and read-only verification accepts the one browser submission", async t => {
  const h = harness(t), prepared = await h.prepare(), reservation = await h.reserve(prepared.checkpoint);
  assert.equal(reservation.method, "browser");
  assert.equal(reservation.applicationSubmissionAttempted, false);
  assert.equal(h.state.posts, 0);
  assert.equal(h.state.notifications, 0);
  await assert.rejects(h.run(), failure("production_existing_attempt_requires_verification_do_not_resubmit"));
  await assert.rejects(h.reserve(prepared.checkpoint), failure("production_attempt_already_exists_do_not_resubmit"));
  h.browserSubmit(reservation.payload);
  const verified = await h.verify(), reused = await h.run();
  assert.equal(verified.submissionMethod, "browser");
  assert.equal(reused.reusedSubmission, true);
  assert.equal(h.state.browserSubmissions, 1);
  assert.equal(h.state.posts, 0);
  assert.equal(h.state.notifications, 1);
  assert.equal(h.state.reservationWrites, 1);
  h.unchanged();
});

test("Wrong execution context and malformed request fail before network access", async t => {
  const h = harness(t);
  for (const changed of [ { ...env, GITHUB_REPOSITORY: "other/repo" }, { ...env, GITHUB_REF: "refs/heads/main" },
    { ...env, CLOUDFLARE_ACCOUNT_ID: "other" }, { ...env, CLOUDFLARE_API_TOKEN: " " } ])
    await assert.rejects(h.run({ env: changed }), failure("production_healthcheck_context_unverified"));
  for (const changed of [ { ...request, operation: "verify-healthcheck-on-qa" }, { ...request, expectedProductionVersionId: "unknown" },
    { ...request, requestId: "unsafe' marker" }, { ...request, email: "participant@example.invalid" }, null ])
    await assert.rejects(h.run({ request: changed }), failure("production_healthcheck_request_invalid"));
  assert.equal(h.state.calls.length, 0);
});

test("Both settings and active version must prove exact Greg-only delivery and production resource modes", async t => {
  for (const source of ["bindings", "versionBindings"]) for (const [name, property, value, code] of [
    ["DB", "id", OTHER_VERSION, "production_resources_unverified"],
    ["WORKER_SELF_REFERENCE", "service", "fractional-hr-site-qa", "production_resources_unverified"],
    ["CONTACT_TO_EMAIL", "text", "other@example.invalid", "production_internal_recipient_unverified"],
    ["CONTACT_TO_EMAIL", "text", "greg@vanesch.uk,other@example.invalid", "production_internal_recipient_unverified"],
    ["CONTACT_TO_EMAIL", "type", "secret_text", "production_internal_recipient_unverified"],
    ["CONTACT_FROM_EMAIL", "text", "", "production_mail_transport_unverified"],
    ["D1_SYSTEM_EVENTS_MODE", "text", "shadow", "production_d1_modes_unverified"],
    ["D1_DIAGNOSTIC_SUBMISSIONS_MODE", "text", "off", "production_d1_modes_unverified"],
    ["D1_CRM_PROSPECTS_MODE", "text", "shadow", "production_d1_modes_unverified"],
    ["D1_CLIENT_DIAGNOSTIC_MODE", "text", "off", "production_d1_modes_unverified"],
    ["D1_CLIENT_DIAGNOSTIC_SECURITY_MODE", "text", "off", "production_d1_modes_unverified"],
    ["NEXT_PUBLIC_APP_ENV", "text", "qa", "production_runtime_environment_unverified"],
    ["ADVISOR_AUTH_MODE", "text", "supabase", "production_runtime_environment_unverified"],
    ["NEXT_PUBLIC_SITE_URL", "text", "https://other.invalid", "production_runtime_environment_unverified"],
  ]) {
    const h = harness(t);
    h.state[source].find(binding => binding.name === name)[property] = value;
    await assert.rejects(h.run(), failure(code), `${source}:${name}:${value}`);
    assert.equal(h.state.reservationWrites, 0);
    assert.equal(h.state.posts, 0);
    assert.equal(h.state.queries, 0);
  }
});

test("Complete settings/version agreement, unique bindings and a single D1 binding are required", async t => {
  for (const kind of ["disagreement", "duplicate", "second-database", "missing-mail-key", "missing-assets"]) {
    const h = harness(t);
    if (kind === "disagreement") h.state.versionBindings.push({ name: "EXTRA_FLAG", type: "plain_text", text: "different" });
    if (kind === "duplicate") h.state.bindings.push({ ...h.state.bindings.find(item => item.name === "DB") });
    if (kind === "second-database") h.state.bindings.push({ name: "OTHER_DB", type: "d1", id: OTHER_VERSION });
    if (kind === "missing-mail-key") h.state.bindings = h.state.bindings.filter(item => item.name !== "RESEND_API_KEY");
    if (kind === "missing-assets") h.state.bindings = h.state.bindings.filter(item => item.name !== "ASSETS");
    await assert.rejects(h.run(), ProductionHealthCheckError, kind);
    assert.equal(h.state.reservationWrites, 0);
    assert.equal(h.state.posts, 0);
  }
});

test("Version, deployment identity, database identity and Supabase-free health are pinned before writes", async t => {
  for (const change of [ h => { h.state.activeVersion = OTHER_VERSION; }, h => { h.state.versionId = OTHER_VERSION; },
    h => { h.state.splitTraffic = true; }, h => { h.state.deploymentId = "missing"; },
    h => { h.state.databaseId = OTHER_VERSION; }, h => { h.state.databaseName = "vanesch-qa"; },
    h => { h.state.health.supabase = "connected"; }, h => { h.state.health.d1 = "error"; }, h => { h.state.health.status = "degraded"; } ]) {
    const h = harness(t); change(h);
    await assert.rejects(h.run(), ProductionHealthCheckError);
    assert.equal(h.state.reservationWrites, 0);
    assert.equal(h.state.posts, 0);
  }
});

test("Changed lease between prepare and reservation blocks the write", async t => {
  const h = harness(t), prepared = await h.prepare();
  h.state.deploymentId = OTHER_VERSION;
  await assert.rejects(h.reserve(prepared.checkpoint), failure("production_healthcheck_checkpoint_changed"));
  assert.equal(h.state.reservationWrites, 0);
  assert.equal(h.state.posts, 0);
});

test("Lease drift immediately after durable reservation prevents submission and leaves a no-replay marker", async t => {
  const h = harness(t);
  h.state.afterReserve = () => { h.state.deploymentId = OTHER_VERSION; };
  await assert.rejects(h.run(), failure("production_healthcheck_checkpoint_changed"));
  assert.equal(h.state.reservationWrites, 1);
  assert.equal(h.state.posts, 0);
  h.state.deploymentId = DEPLOYMENT;
  await assert.rejects(h.run(), failure("production_existing_attempt_requires_verification_do_not_resubmit"));
  assert.equal(h.state.reservationWrites, 1);
});

test("Two contenders can reserve at most one attempt and only the winner submits", async t => {
  const h = harness(t);
  const results = await Promise.allSettled([h.run(), h.run()]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(results.filter(result => result.status === "rejected").length, 1);
  assert.equal(h.state.reservationWrites, 1);
  assert.equal(h.state.posts, 1);
  assert.equal(h.state.notifications, 1);
});

test("Uncertain transport before a row exists cannot cause a second submission", async t => {
  const h = harness(t); h.state.dropPost = true;
  await assert.rejects(h.run(), error => {
    assert.deepEqual(productionHealthCheckFailure(error), { code: "production_hosted_transport_failure_no_retry", mutationOutcomeUnknown: true, httpStatus: null });
    assert.doesNotMatch(String(error), new RegExp(`${PUBLIC_TOKEN}|${env.CLOUDFLARE_API_TOKEN}`));
    return true;
  });
  h.state.dropPost = false;
  await assert.rejects(h.run(), failure("production_existing_attempt_requires_verification_do_not_resubmit"));
  await assert.rejects(h.verify(), failure("production_reserved_submission_not_found_do_not_resubmit"));
  assert.equal(h.state.posts, 1);
  assert.equal(h.state.notifications, 0);
  assert.equal(h.state.reservationWrites, 1);
});

test("Lost successful response and invalid JSON are recovered by reads without a repeat notification", async t => {
  for (const mode of ["loseResponse", "badJSON"]) {
    const h = harness(t); h.state[mode] = true;
    await assert.rejects(h.run(), error => error instanceof ProductionHealthCheckError && error.mutationOutcomeUnknown === true);
    assert.equal((await h.verify()).d1WriteVerified, true);
    assert.equal((await h.run()).reusedSubmission, true);
    assert.equal(h.state.posts, 1);
    assert.equal(h.state.notifications, 1);
    h.unchanged();
  }
});

test("Failed or unconfirmed internal notification is reported separately from D1 proof without resending", async t => {
  for (const [flag, expected] of [["emailFails", "failed"], ["omitNotification", "unknown"]]) {
    const h = harness(t); h.state[flag] = true;
    const first = await h.run(), second = await h.run();
    assert.equal(first.d1WriteVerified, true);
    assert.equal(first.publicResultVerified, true);
    assert.equal(first.internalNotificationStatus, expected);
    assert.equal(first.advisorEmailProviderAccepted, false);
    assert.equal(second.internalNotificationStatus, expected);
    assert.equal(h.state.posts, 1);
    assert.equal(h.state.notifications, 1);
  }
});

test("Redirects are not followed, remain uncertain, and cannot replay the reserved submission", async t => {
  const h = harness(t); h.state.redirectPost = true;
  await assert.rejects(h.run(), error => {
    assert.deepEqual(productionHealthCheckFailure(error), { code: "production_hosted_http_failure_no_retry", mutationOutcomeUnknown: true, httpStatus: 307 });
    return true;
  });
  await assert.rejects(h.run(), failure("production_existing_attempt_requires_verification_do_not_resubmit"));
  assert.equal(h.state.posts, 1);
  assert.equal(h.state.notifications, 0);
  assert.ok(h.state.calls.every(call => !call.url.includes("other.invalid")));
});

test("Reservation response loss leaves durable evidence and never initiates the application POST", async t => {
  const h = harness(t); h.state.afterReserve = () => { throw new Error("Private reservation response containing a token"); };
  await assert.rejects(h.run(), error => error instanceof ProductionHealthCheckError && error.mutationOutcomeUnknown === true);
  h.state.afterReserve = null;
  await assert.rejects(h.run(), failure("production_existing_attempt_requires_verification_do_not_resubmit"));
  assert.equal(h.state.reservationWrites, 1);
  assert.equal(h.state.posts, 0);
  assert.equal(h.state.notifications, 0);
});

test("Owned marker collisions, unreserved submissions and altered reservation metadata fail closed", async t => {
  for (const mode of ["collision", "unreserved", "metadata"]) {
    const h = harness(t), prepared = await h.prepare();
    if (mode !== "unreserved") await h.reserve(prepared.checkpoint);
    if (mode === "metadata") {
      const row = h.sqlite.prepare("SELECT metadata FROM system_events WHERE event_id = ?").get(ATTEMPT_ID);
      const metadata = JSON.parse(row.metadata); metadata.method = "another";
      h.sqlite.prepare("UPDATE system_events SET metadata = ? WHERE event_id = ?").run(JSON.stringify(metadata), ATTEMPT_ID);
    } else {
      h.browserSubmit(prepared.payload);
      if (mode === "collision") h.sqlite.prepare("INSERT INTO diagnostic_submissions (id,submission_id,country_region,submission_source) VALUES (?,?,?,'health-check')")
        .run(OTHER_VERSION, OTHER_VERSION, MARKER);
    }
    await assert.rejects(h.run(), ProductionHealthCheckError);
    assert.equal(h.state.posts, 0);
  }
});

test("D1, public result and system-event tampering never passes verification or triggers resubmission", async t => {
  const changes = [
    ["answers", h => h.sqlite.prepare("UPDATE diagnostic_submissions SET answers = '{}' WHERE submission_id = ?").run(SUBMISSION)],
    ["score", h => h.sqlite.prepare("UPDATE diagnostic_submissions SET score = 60 WHERE submission_id = ?").run(SUBMISSION)],
    ["email", h => h.sqlite.prepare("UPDATE diagnostic_submissions SET email = 'unexpected@example.invalid' WHERE submission_id = ?").run(SUBMISSION)],
    ["result", h => { h.state.badResult = true; }],
    ["client-email", h => h.insertEvent("health_check_client_email")],
    ["duplicate-internal", h => h.insertEvent("health_check_internal_email", "success", { resendId: PROVIDER_ID }, "duplicate-internal")],
    ["missing-insert", h => h.sqlite.prepare("DELETE FROM system_events WHERE event_id = 'health_check_db_insert'").run()],
    ["missing-provider-id", h => h.sqlite.prepare("UPDATE system_events SET metadata = '{}' WHERE event_id = 'health_check_internal_email'").run()],
  ];
  for (const [name, change] of changes) {
    const h = harness(t); await h.run(); change(h);
    await assert.rejects(h.verify(), ProductionHealthCheckError, name);
    await assert.rejects(h.run(), ProductionHealthCheckError, name);
    assert.equal(h.state.posts, 1);
    assert.equal(h.state.notifications, 1);
    assert.equal(h.state.reservationWrites, 1);
    h.unchanged();
  }
});

test("Import is inert and unexpected failures have no provider or credential content", () => {
  const moduleUrl = new URL("../../scripts/security/production-healthcheck-smoke.mjs", import.meta.url).href;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e",
    `globalThis.fetch = () => { throw new Error('import attempted network'); }; await import(${JSON.stringify(moduleUrl)});`],
  { encoding: "utf8", env: { PATH: process.env.PATH } });
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout, "");
  assert.deepEqual(productionHealthCheckFailure(new Error(`Private response ${PUBLIC_TOKEN} ${env.CLOUDFLARE_API_TOKEN}`)),
    { code: "unexpected_production_healthcheck_failure", mutationOutcomeUnknown: null, httpStatus: null });
});

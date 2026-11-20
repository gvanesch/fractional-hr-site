import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { runQaHealthCheckSmoke } from "../../scripts/security/qa-healthcheck-smoke.mjs";

const ACCOUNT = "73221f18acc676e4992c89fcbf2b2a8f";
const DATABASE = "b25d59da-5f93-4301-9996-7be0c9708789";
const WORKER = "fractional-hr-site-qa";
const VERSION = "11111111-2222-4333-8444-555555555555";
const SUBMISSION = "22222222-2222-4333-8444-555555555555";
const PUBLIC_TOKEN = "33333333-2222-4333-8444-555555555555";
const SITE = "https://fractional-hr-site-qa.greg-732.workers.dev";
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;
const env = {
  GITHUB_REPOSITORY: "gvanesch/fractional-hr-site",
  GITHUB_REF: "refs/heads/chore/supabase-retirement-2026-11",
  CLOUDFLARE_ACCOUNT_ID: ACCOUNT,
  CLOUDFLARE_API_TOKEN: "synthetic-api-token-do-not-log",
};
const request = { operation: "verify-healthcheck-on-qa", requestId: "retirement-20261120-test", expectedQaVersionId: VERSION };

function harness() {
  const sqlite = new DatabaseSync(":memory:");
  for (const migration of ["0001_create_system_events.sql", "0002_create_diagnostic_submissions.sql"]) {
    sqlite.exec(readFileSync(new URL(`../../migrations/${migration}`, import.meta.url), "utf8"));
  }
  const bindings = [
    { name: "DB", type: "d1", id: DATABASE },
    { name: "WORKER_SELF_REFERENCE", type: "service", service: WORKER },
    { name: "RESEND_API_KEY", type: "secret_text" },
    ...Object.entries({
      NEXT_PUBLIC_APP_ENV: "qa", ADVISOR_AUTH_MODE: "cloudflare_access",
      CONTACT_TO_EMAIL: "greg@vanesch.uk", CONTACT_FROM_EMAIL: "qa@vanesch.uk",
      ...Object.fromEntries(["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"].map(name => [`D1_${name}_MODE`, "d1"])),
    }).map(([name, text]) => ({ name, type: "plain_text", text })),
  ];
  const state = { bindings, versionBindings: structuredClone(bindings), version: VERSION,
    posts: 0, queries: 0, calls: 0, logs: [], dropPost: false, loseResponse: false,
    emailFails: false, badResult: false, redirectPost: false };
  function cf(result) { return Response.json({ success: true, result }); }
  async function fetchImpl(url, options) {
    state.calls++;
    assert.equal(options.redirect, "manual");
    assert.ok(options.signal);
    if (url.startsWith(API)) {
      assert.equal(options.headers.Authorization, `Bearer ${env.CLOUDFLARE_API_TOKEN}`);
      const path = url.slice(API.length);
      if (path === `/workers/scripts/${WORKER}/settings`) return cf({ bindings: state.bindings });
      if (path === `/workers/scripts/${WORKER}/deployments`) return cf({ deployments: [{ versions: [{ version_id: state.version, percentage: 100 }] }] });
      if (path === `/workers/scripts/${WORKER}/versions/${VERSION}`) return cf({ id: VERSION, resources: { bindings: state.versionBindings } });
      if (path === `/d1/database/${DATABASE}`) return cf({ uuid: DATABASE, name: "vanesch-qa" });
      assert.equal(path, `/d1/database/${DATABASE}/query`, "Only the fixed QA database may be queried");
      assert.equal(options.method, "POST");
      const { sql, params } = JSON.parse(options.body);
      state.queries++;
      assert.doesNotMatch(sql, /\b(?:DELETE|UPDATE|DROP|CREATE|ALTER)\b/i);
      assert.ok(params.every(value => typeof value === "string"));
      if (/^SELECT/.test(sql)) {
        assert.match(sql, /WHERE (?:industry = \?|submission_id = \?)/);
        return cf([{ success: true, results: sqlite.prepare(sql).all(...params), meta: { changes: 0 } }]);
      }
      assert.match(sql, /^INSERT OR IGNORE INTO system_events/);
      assert.equal(params[0], `qa-healthcheck-smoke:${request.requestId}`);
      const result = sqlite.prepare(sql).run(...params);
      return cf([{ success: true, results: [], meta: { changes: Number(result.changes) } }]);
    }
    assert.ok(url.startsWith(SITE), "No hosted requests may target production or a third party");
    assert.equal(options.headers?.Authorization, undefined, "Cloudflare token must never reach the public Worker");
    const parsed = new URL(url);
    if (parsed.pathname === "/api/health") return Response.json({ status: "ok", d1: "connected", supabase: "not_required" });
    if (parsed.pathname === "/api/public-diagnostic-result") {
      assert.equal(parsed.searchParams.get("token"), PUBLIC_TOKEN);
      const row = sqlite.prepare("SELECT * FROM diagnostic_submissions WHERE public_token = ?").get(PUBLIC_TOKEN);
      return Response.json({ ok: true, result: { rawScore: 30, score: state.badResult ? 99 : row.score, band: { label: row.band } },
        context: { companySize: row.company_size, industry: row.industry, role: row.role, emailPresent: false } });
    }
    assert.equal(parsed.pathname, "/api/diagnostic-complete");
    assert.equal(options.method, "POST");
    state.posts++;
    if (state.dropPost) throw new Error(`synthetic transport error containing ${PUBLIC_TOKEN}`);
    if (state.redirectPost) return new Response(null, { status: 307, headers: { location: "https://vanesch.uk/api/diagnostic-complete" } });
    const body = JSON.parse(options.body);
    assert.equal(Object.hasOwn(body, "email"), false, "Participant email must be omitted");
    assert.deepEqual(body.answers, Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, 3])));
    assert.equal(body.industry, `QA SYNTHETIC HEALTH CHECK ${request.requestId}`);
    sqlite.prepare(`INSERT INTO diagnostic_submissions
      (id, submission_id, public_token, answers, score, band, email, company_size, industry, role, country_region, completed_at, submission_source)
      VALUES (?, ?, ?, ?, 50, 'Structured but Improving', NULL, ?, ?, ?, ?, ?, 'health-check')`)
      .run(SUBMISSION, SUBMISSION, PUBLIC_TOKEN, JSON.stringify(body.answers), body.companySize, body.industry, body.role, body.countryRegion, new Date().toISOString());
    for (const [type, status, metadata] of [
      ["health_check_db_insert", "success", {}],
      ["health_check_internal_email", state.emailFails ? "error" : "success", { resendId: "synthetic-provider-id" }],
    ]) sqlite.prepare("INSERT INTO system_events (event_id, event_type, status, submission_id, metadata) VALUES (?, ?, ?, ?, ?)")
      .run(type, type, status, SUBMISSION, JSON.stringify(metadata));
    if (state.loseResponse) throw new Error(`synthetic lost response containing ${PUBLIC_TOKEN}`);
    return Response.json({ ok: true, submissionId: SUBMISSION, publicToken: PUBLIC_TOKEN, score: 50, band: "Structured but Improving", resendId: "synthetic-provider-id" });
  }
  const run = (overrides = {}) => runQaHealthCheckSmoke({ request, env, fetchImpl, log: message => state.logs.push(message), ...overrides });
  return { sqlite, state, run };
}

test("Hosted proof creates one synthetic QA submission and reruns without another email", async () => {
  const h = harness();
  try {
    const first = await h.run();
    assert.equal(first.createdSubmission, true);
    assert.equal(first.advisorEmailProviderAccepted, true);
    assert.equal(first.participantEmails, 0);
    const second = await h.run();
    assert.equal(second.createdSubmission, false);
    assert.equal(second.reusedSubmission, true);
    assert.equal(h.state.posts, 1);
    assert.equal(h.sqlite.prepare("SELECT count(*) n FROM diagnostic_submissions").get().n, 1);
    assert.equal(h.sqlite.prepare("SELECT count(*) n FROM system_events WHERE event_type='qa_healthcheck_smoke_attempt'").get().n, 1);
    assert.doesNotMatch(JSON.stringify([first, second, h.state.logs]), new RegExp(`${PUBLIC_TOKEN}|${SUBMISSION}|${env.CLOUDFLARE_API_TOKEN}|synthetic-provider-id`));
  } finally { h.sqlite.close(); }
});

test("Hosted proof rejects unverified execution context and malformed requests before network access", async () => {
  const h = harness();
  try {
    for (const replacement of [{ ...env, CLOUDFLARE_ACCOUNT_ID: "other" }, { ...env, GITHUB_REF: "refs/heads/main" }, { ...env, GITHUB_REPOSITORY: "other/repo" }, { ...env, CLOUDFLARE_API_TOKEN: "" }]) {
      await assert.rejects(h.run({ env: replacement }), /execution context/);
    }
    for (const replacement of [{ ...request, expectedQaVersionId: "unknown" }, { ...request, requestId: "unsafe' marker" }, { ...request, operation: "production" }]) {
      await assert.rejects(h.run({ request: replacement }), /valid QA smoke request/);
    }
    assert.equal(h.state.calls, 0);
  } finally { h.sqlite.close(); }
});

test("Live settings AND deployed-version bindings must be isolated and Greg-only before any write", async () => {
  for (const source of ["bindings", "versionBindings"]) {
    for (const [name, property, value] of [
      ["DB", "id", "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc"],
      ["CONTACT_TO_EMAIL", "text", "other@example.invalid"],
      ["CONTACT_TO_EMAIL", "type", "secret_text"],
      ["D1_DIAGNOSTIC_SUBMISSIONS_MODE", "text", "off"],
      ["D1_CRM_PROSPECTS_MODE", "text", "shadow"],
      ["NEXT_PUBLIC_APP_ENV", "text", "production"],
      ["WORKER_SELF_REFERENCE", "service", "fractional-hr-site"],
    ]) {
      const h = harness();
      try {
        h.state[source].find(binding => binding.name === name)[property] = value;
        await assert.rejects(h.run(), /QA|five QA/);
        assert.equal(h.state.posts, 0, `${source}:${name}`);
        assert.equal(h.state.queries, 0, `${source}:${name}`);
      } finally { h.sqlite.close(); }
    }
  }
});

test("A different active deployment blocks the hosted write", async () => {
  const h = harness();
  try {
    h.state.version = "44444444-2222-4333-8444-555555555555";
    await assert.rejects(h.run(), /QA deployment differs/);
    assert.equal(h.state.posts, 0);
    assert.equal(h.state.queries, 0);
  } finally { h.sqlite.close(); }
});

test("An uncertain timeout cannot cause a duplicate attempt on rerun", async () => {
  const h = harness();
  try {
    h.state.dropPost = true;
    await assert.rejects(h.run(), error => /no automatic retry/.test(error.message) && !error.message.includes(PUBLIC_TOKEN));
    h.state.dropPost = false;
    await assert.rejects(h.run(), /earlier synthetic attempt/);
    assert.equal(h.state.posts, 1);
    assert.equal(h.sqlite.prepare("SELECT count(*) n FROM diagnostic_submissions").get().n, 0);
  } finally { h.sqlite.close(); }
});

test("A lost successful response is recovered through the D1 marker without resubmission", async () => {
  const h = harness();
  try {
    h.state.loseResponse = true;
    await assert.rejects(h.run(), /no automatic retry/);
    const result = await h.run();
    assert.equal(result.reusedSubmission, true);
    assert.equal(h.state.posts, 1);
  } finally { h.sqlite.close(); }
});

test("Provider rejection is reported without a second submission or email attempt", async () => {
  const h = harness();
  try {
    h.state.emailFails = true;
    await assert.rejects(h.run(), /advisor email handoff/);
    await assert.rejects(h.run(), /advisor email handoff/);
    assert.equal(h.state.posts, 1);
  } finally { h.sqlite.close(); }
});

test("Hosted redirects are not followed and reserve the attempt against replay", async () => {
  const h = harness();
  try {
    h.state.redirectPost = true;
    await assert.rejects(h.run(), /HTTP 307/);
    await assert.rejects(h.run(), /earlier synthetic attempt/);
    assert.equal(h.state.posts, 1);
  } finally { h.sqlite.close(); }
});

test("Public result mismatch and altered D1 answers cannot pass a reused proof", async () => {
  const h = harness();
  try {
    await h.run();
    h.state.badResult = true;
    await assert.rejects(h.run(), /public result does not match/);
    h.state.badResult = false;
    h.sqlite.prepare("UPDATE diagnostic_submissions SET answers = '{}' WHERE submission_id = ?").run(SUBMISSION);
    await assert.rejects(h.run(), /row does not match/);
    assert.equal(h.state.posts, 1);
  } finally { h.sqlite.close(); }
});

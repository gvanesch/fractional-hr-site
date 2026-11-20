// One synthetic hosted QA submission, at most one advisor email to Greg.
// No production target, participant email, configuration changes or deletion.
// A durable attempt marker prevents a timeout or rerun from sending twice.
import { readFile, appendFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const ACCOUNT = "73221f18acc676e4992c89fcbf2b2a8f";
const WORKER = "fractional-hr-site-qa";
const DATABASE = "b25d59da-5f93-4301-9996-7be0c9708789";
const SITE = "https://fractional-hr-site-qa.greg-732.workers.dev";
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;
const MODES = ["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ANSWERS = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, 3]));
const SCORE = 50;
const BAND = "Structured but Improving";
const ROLE = "Automated synthetic QA check";
const COMPANY_SIZE = "TEST DATA - QA ONLY";
const COUNTRY = "Synthetic QA; not client data";

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function verifyBindings(entries) {
  requireCondition(Array.isArray(entries), "QA binding inventory is unavailable.");
  const bindings = new Map(entries.map(binding => [binding.name, binding]));
  requireCondition(bindings.size === entries.length, "QA binding names are duplicated.");
  const db = bindings.get("DB");
  requireCondition(db?.type === "d1" && (db.id ?? db.database_id) === DATABASE, "QA Worker does not use the isolated QA database.");
  for (const name of MODES) {
    const binding = bindings.get(`D1_${name}_MODE`);
    requireCondition(binding?.type === "plain_text" && binding.text === "d1", "All five QA data modes must use D1.");
  }
  for (const [name, value] of [
    ["NEXT_PUBLIC_APP_ENV", "qa"],
    ["ADVISOR_AUTH_MODE", "cloudflare_access"],
    ["CONTACT_TO_EMAIL", "greg@vanesch.uk"],
    ["CONTACT_FROM_EMAIL", "qa@vanesch.uk"],
  ]) {
    requireCondition(bindings.get(name)?.type === "plain_text" && bindings.get(name).text === value,
      `QA ${name} is missing or differs from the smoke-test target.`);
  }
  requireCondition(bindings.has("RESEND_API_KEY"), "QA email transport is not configured.");
  requireCondition(bindings.get("WORKER_SELF_REFERENCE")?.service === WORKER,
    "QA self-reference does not point to the QA Worker.");
}

export async function runQaHealthCheckSmoke({ request, env = process.env, fetchImpl = fetch, log = console.log }) {
  requireCondition(env.GITHUB_REPOSITORY === "gvanesch/fractional-hr-site" &&
    ["refs/heads/chore/supabase-retirement-2026-11", "refs/heads/migration/d1"].includes(env.GITHUB_REF) &&
    env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT && Boolean(env.CLOUDFLARE_API_TOKEN?.trim()),
  "QA Health Check execution context is not verified.");
  requireCondition(request?.operation === "verify-healthcheck-on-qa" &&
    /^[a-z0-9][a-z0-9-]{7,63}$/.test(request.requestId ?? "") && UUID.test(request.expectedQaVersionId ?? ""),
  "A valid QA smoke request ID and expected QA version are required.");
  const marker = `QA SYNTHETIC HEALTH CHECK ${request.requestId}`;
  const attemptId = `qa-healthcheck-smoke:${request.requestId}`;

  // Every error below is authored locally. Never print response bodies, tokens,
  // bindings, query results or the URL containing the synthetic public token.
  async function jsonRequest(url, options, label) {
    let response;
    try {
      response = await fetchImpl(url, { ...options, redirect: "manual", signal: AbortSignal.timeout(30000) });
    } catch {
      throw new Error(`${label}: request failed or timed out; no automatic retry.`);
    }
    requireCondition(response.status === 200, `${label}: HTTP ${response.status}; no automatic retry.`);
    try { return await response.json(); }
    catch { throw new Error(`${label}: response was not valid JSON.`); }
  }
  async function cloudflare(path, options = {}) {
    const data = await jsonRequest(API + path, {
      ...options,
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN.trim()}`, "Content-Type": "application/json" },
    }, "QA Cloudflare API");
    requireCondition(data.success === true, "QA Cloudflare API did not confirm success.");
    return data.result;
  }
  async function query(sql, params) {
    const result = await cloudflare(`/d1/database/${DATABASE}/query`, {
      method: "POST", body: JSON.stringify({ sql, params }),
    });
    requireCondition(Array.isArray(result) && result.length === 1 && result[0]?.success === true && Array.isArray(result[0].results),
      "QA D1 did not return one successful query result.");
    return result[0];
  }
  async function activeVersion() {
    const result = await cloudflare(`/workers/scripts/${WORKER}/deployments`);
    const versions = result?.deployments?.[0]?.versions;
    requireCondition(Array.isArray(versions) && versions.length === 1 && versions[0].percentage === 100 &&
      versions[0].version_id === request.expectedQaVersionId,
    "QA deployment differs from the expected single version; no new submission sent.");
  }
  async function findSubmission() {
    const result = await query(`SELECT submission_id, public_token, answers, score, band, email,
      company_size, industry, role, country_region, completed_at, submission_source
      FROM diagnostic_submissions
      WHERE industry = ? AND role = ? AND submission_source = 'health-check'
      LIMIT 2`, [marker, ROLE]);
    requireCondition(result.results.length <= 1, "More than one synthetic result exists for this request; no new submission sent.");
    return result.results[0] ?? null;
  }

  const settings = await cloudflare(`/workers/scripts/${WORKER}/settings`);
  verifyBindings(settings?.bindings);
  await activeVersion();
  const version = await cloudflare(`/workers/scripts/${WORKER}/versions/${request.expectedQaVersionId}`);
  requireCondition(version?.id === request.expectedQaVersionId, "Unexpected QA Worker version response.");
  verifyBindings(version.resources?.bindings);
  const database = await cloudflare(`/d1/database/${DATABASE}`);
  requireCondition((database?.uuid ?? database?.id) === DATABASE && database.name === "vanesch-qa", "QA database identity is not verified.");
  const health = await jsonRequest(`${SITE}/api/health`, {}, "QA health");
  requireCondition(health.status === "ok" && health.d1 === "connected" && health.supabase === "not_required",
    "QA health must report D1 connected and Supabase not required.");
  log("Verified QA version, isolated D1 binding, all five data modes and Greg-only email destination.");

  let row = await findSubmission();
  let posted = false;
  let completion;
  if (!row) {
    const reserved = await query(`INSERT OR IGNORE INTO system_events
      (event_id, event_type, status, source, metadata)
      VALUES (?, 'qa_healthcheck_smoke_attempt', 'success', 'supabase-retirement-qa', '{"state":"attempt_reserved"}')`, [attemptId]);
    requireCondition(reserved.meta?.changes === 1,
      "An earlier synthetic attempt has no verified result. No new submission sent; inspect that attempt first.");
    await activeVersion();
    completion = await jsonRequest(`${SITE}/api/diagnostic-complete`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      // Deliberately omit email: only the configured internal recipient can receive mail.
      body: JSON.stringify({ answers: ANSWERS, companySize: COMPANY_SIZE, industry: marker, role: ROLE, countryRegion: COUNTRY }),
    }, "QA Health Check submission");
    posted = true;
    requireCondition(completion?.ok === true && UUID.test(completion.submissionId ?? "") && UUID.test(completion.publicToken ?? ""),
      "QA submission did not return valid completion identifiers.");
    row = await findSubmission();
  }
  requireCondition(row && UUID.test(row.submission_id ?? "") && UUID.test(row.public_token ?? ""),
    "The synthetic submission was not found in the QA D1 database.");
  let answers;
  try { answers = JSON.parse(row.answers); }
  catch { throw new Error("The synthetic D1 answers are not valid JSON."); }
  requireCondition(Object.keys(answers ?? {}).length === 10 && Object.entries(ANSWERS).every(([key, value]) => answers[key] === value) &&
    row.score === SCORE && row.band === BAND && row.email === null && row.company_size === COMPANY_SIZE &&
    row.industry === marker && row.role === ROLE && row.country_region === COUNTRY &&
    row.submission_source === "health-check" && Number.isFinite(Date.parse(row.completed_at)),
  "The synthetic D1 row does not match the submitted answers and context.");
  if (posted) {
    requireCondition(completion.submissionId === row.submission_id && completion.publicToken === row.public_token &&
      completion.score === SCORE && completion.band === BAND,
    "Hosted completion identifiers or score do not match the QA D1 row.");
  }

  const result = await jsonRequest(`${SITE}/api/public-diagnostic-result?token=${encodeURIComponent(row.public_token)}`, {}, "QA public result");
  requireCondition(result.ok === true && result.result?.rawScore === 30 && result.result?.score === SCORE &&
    result.result?.band?.label === BAND && result.context?.companySize === COMPANY_SIZE &&
    result.context?.industry === marker && result.context?.role === ROLE && result.context?.emailPresent === false,
  "Hosted public result does not match the synthetic QA D1 submission.");
  const events = (await query(`SELECT event_type, status, metadata FROM system_events
    WHERE submission_id = ? AND event_type IN ('health_check_db_insert', 'health_check_internal_email', 'health_check_client_email')
    LIMIT 10`, [row.submission_id])).results;
  const saved = events.filter(event => event.event_type === "health_check_db_insert");
  const notifications = events.filter(event => event.event_type === "health_check_internal_email");
  requireCondition(saved.length === 1 && saved[0].status === "success", "Synthetic D1 insert event was not recorded successfully.");
  requireCondition(notifications.length === 1 && notifications[0].status === "success", "Synthetic advisor email handoff was not recorded successfully; do not resubmit.");
  let mailMetadata;
  try { mailMetadata = JSON.parse(notifications[0].metadata); }
  catch { throw new Error("Synthetic notification event metadata was invalid."); }
  requireCondition(typeof mailMetadata.resendId === "string" && mailMetadata.resendId.length > 0,
    "Synthetic advisor email has no provider acceptance identifier.");
  requireCondition(!events.some(event => event.event_type === "health_check_client_email"), "Unexpected participant email event in the synthetic test.");
  await activeVersion();
  const summary = { requestId: request.requestId, qaVersion: request.expectedQaVersionId,
    createdSubmission: posted, reusedSubmission: !posted, d1WriteVerified: true,
    publicResultVerified: true, advisorEmailProviderAccepted: true, participantEmails: 0 };
  log(posted ? "QA Health Check write/read and advisor email handoff verified." : "Existing QA Health Check proof verified; no new submission or email.");
  log("The clearly labelled synthetic QA record and attempt marker are retained for rerun safety. No production action performed.");
  return summary;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const request = JSON.parse(await readFile(new URL("./qa-healthcheck-smoke-request.json", import.meta.url), "utf8"));
    const summary = await runQaHealthCheckSmoke({ request });
    console.log(JSON.stringify(summary));
    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Hosted QA Health Check proof\n\nRequest: ${summary.requestId}\n\nD1 write and public result verified. Advisor email accepted by provider; inbox delivery is not inferred. Participant emails: 0. ${summary.reusedSubmission ? "Existing proof reused; no new email." : "One new synthetic QA submission."}\n`);
    }
  } catch (error) {
    // Filesystem/JSON errors may include file content; only script-authored errors
    // from the runner are surfaced. The CLI request is validated separately above.
    console.error(error instanceof SyntaxError || error?.code ? "QA smoke request could not be read." : error.message);
    process.exitCode = 1;
  }
}

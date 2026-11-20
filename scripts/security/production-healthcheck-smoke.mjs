// Inert library: no CLI, workflow, import-time requests, logging or credentials
// in output. Default mode verifies Greg-only internal notification. An explicit
// request may instead use unchanged production secret routing without claiming
// the recipient value is known. Neither mode sends a participant email.
// Existing records are never updated/deleted; only one synthetic attempt is reserved.
import { fingerprint, normalizeBindings, PRODUCTION } from "./qa-retirement-release.mjs";
import { ACCOUNT, CANDIDATE_REF, MODES } from "./supabase-retirement-readonly.mjs";

export const PRODUCTION_HEALTHCHECK_ORIGIN = "https://www.vanesch.uk";
export const STRICT_NOTIFICATION_ROUTING = "verified-greg-only";
export const EXISTING_NOTIFICATION_ROUTING = "existing-production-configuration";
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;
const UUID = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const HASH = /^[a-f\d]{64}$/;
const EVENT = "production_healthcheck_smoke_attempt", SOURCE = "supabase-retirement-production";
const CHECKPOINT = "production-healthcheck-smoke-checkpoint";
const ANSWERS = Object.freeze(Object.fromEntries(Array.from({ length: 10 }, (_, index) => [index + 1, 3])));
const SCORE = 50, BAND = "Structured but Improving", COMPANY_SIZE = "1–25 employees";
const SQL = Object.freeze({
  submission: `SELECT submission_id, public_token, answers, score, band, email,
    company_size, industry, role, country_region, completed_at, submission_source
    FROM diagnostic_submissions WHERE country_region = ? AND submission_source = 'health-check' LIMIT 2`,
  attempt: "SELECT event_id, event_type, status, source, metadata FROM system_events WHERE event_id = ? LIMIT 2",
  reserve: `INSERT OR IGNORE INTO system_events (event_id, event_type, status, source, metadata)
    VALUES (?, '${EVENT}', 'success', '${SOURCE}', ?)`,
  events: `SELECT event_type, status, metadata FROM system_events WHERE submission_id = ?
    AND event_type IN ('health_check_db_insert', 'health_check_internal_email', 'health_check_client_email') LIMIT 10`,
});
const object = value => value != null && typeof value === "object" && !Array.isArray(value);

export class ProductionHealthCheckError extends Error {
  constructor(code, mutationOutcomeUnknown = false, httpStatus = null) {
    super(code); this.code = code; this.mutationOutcomeUnknown = mutationOutcomeUnknown; this.httpStatus = httpStatus;
  }
}
const check = (condition, code) => { if (!condition) throw new ProductionHealthCheckError(code); };

export function productionHealthCheckFailure(error) {
  return error instanceof ProductionHealthCheckError
    ? { code: error.code, mutationOutcomeUnknown: error.mutationOutcomeUnknown, httpStatus: error.httpStatus }
    : { code: "unexpected_production_healthcheck_failure", mutationOutcomeUnknown: null, httpStatus: null };
}

function context({ request, env = process.env, fetchImpl = fetch }) {
  check(env.GITHUB_REPOSITORY === "gvanesch/fractional-hr-site" && env.GITHUB_REF === CANDIDATE_REF &&
    env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT && typeof env.CLOUDFLARE_API_TOKEN === "string" && env.CLOUDFLARE_API_TOKEN.trim(),
  "production_healthcheck_context_unverified");
  check(object(request) && Object.keys(request).every(key => ["operation", "requestId", "expectedProductionVersionId", "notificationRouting"].includes(key)) &&
    request.operation === "verify-healthcheck-on-production" && /^[a-z0-9][a-z0-9-]{7,63}$/.test(request.requestId ?? "") &&
    UUID.test(request.expectedProductionVersionId ?? "") &&
    (!Object.hasOwn(request, "notificationRouting") || request.notificationRouting === EXISTING_NOTIFICATION_ROUTING),
  "production_healthcheck_request_invalid");
  request = structuredClone(request);
  const credential = env.CLOUDFLARE_API_TOKEN.trim();
  const notificationRouting = request.notificationRouting ?? STRICT_NOTIFICATION_ROUTING;
  const countryRegion = `SYNTHETIC PRODUCTION TEST - ${request.requestId}`;
  check(countryRegion.length <= 120, "production_healthcheck_marker_invalid");
  const payload = { answers: { ...ANSWERS }, companySize: COMPANY_SIZE, industry: "Other", role: "Other", countryRegion };
  const attemptId = `production-healthcheck-smoke:${request.requestId}`;
  const requestFingerprint = fingerprint(request), payloadFingerprint = fingerprint(payload);
  let submissionAttempted = false, reservationAttempted = false;
  async function json(url, options, label, mutation = false) {
    let response;
    try { response = await fetchImpl(url, { ...options, redirect: "error", signal: AbortSignal.timeout(30000) }); }
    catch { throw new ProductionHealthCheckError(`${label}_transport_failure_no_retry`, mutation); }
    if (response.status !== 200) throw new ProductionHealthCheckError(`${label}_http_failure_no_retry`, mutation, response.status);
    try { return await response.json(); }
    catch { throw new ProductionHealthCheckError(`${label}_invalid_json_no_retry`, mutation, response.status); }
  }
  async function api(path, body, mutation = false) {
    const reads = [`/workers/scripts/${PRODUCTION.worker}/settings`, `/workers/scripts/${PRODUCTION.worker}/deployments`,
      `/workers/scripts/${PRODUCTION.worker}/versions/${request.expectedProductionVersionId}`, `/d1/database/${PRODUCTION.database}`];
    check(body === undefined && reads.includes(path) || body !== undefined && path === `/d1/database/${PRODUCTION.database}/query`,
      "production_healthcheck_endpoint_forbidden");
    const result = await json(API + path, { method: body === undefined ? "GET" : "POST",
      headers: { Authorization: `Bearer ${credential}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, "production_metadata", mutation);
    if (!object(result) || result.success !== true)
      throw new ProductionHealthCheckError("production_metadata_rejected_no_retry", mutation);
    return result.result;
  }
  async function query(kind, params) {
    check(Object.hasOwn(SQL, kind) && Array.isArray(params) && params.every(value => typeof value === "string"), "production_query_forbidden");
    if (kind === "reserve") {
      check(!reservationAttempted, "production_attempt_reservation_already_attempted");
      reservationAttempted = true;
    }
    const result = await api(`/d1/database/${PRODUCTION.database}/query`, { sql: SQL[kind], params }, kind === "reserve");
    if (!Array.isArray(result) || result.length !== 1 || result[0]?.success !== true || !Array.isArray(result[0].results))
      throw new ProductionHealthCheckError("production_query_result_invalid", kind === "reserve");
    return result[0];
  }
  async function hosted(path, body) {
    check(body === undefined && (path === "/api/health" || /^\/api\/public-diagnostic-result\?token=[a-f\d-]{36}$/i.test(path)) ||
      body !== undefined && path === "/api/diagnostic-complete" && fingerprint(body) === payloadFingerprint,
    "production_hosted_endpoint_or_payload_forbidden");
    if (body !== undefined) {
      check(!submissionAttempted, "production_submission_already_attempted");
      submissionAttempted = true;
    }
    return json(PRODUCTION_HEALTHCHECK_ORIGIN + path, { method: body === undefined ? "GET" : "POST",
      ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) },
    "production_hosted", body !== undefined);
  }
  return { request, payload, attemptId, requestFingerprint, payloadFingerprint, notificationRouting, api, query, hosted };
}

function bindingsFingerprint(entries, notificationRouting) {
  let bindings;
  try { bindings = normalizeBindings(entries); }
  catch { throw new ProductionHealthCheckError("production_binding_inventory_invalid"); }
  const map = new Map(bindings.map(item => [item.name, item]));
  check(map.get("DB")?.type === "d1" && map.get("DB").id === PRODUCTION.database && bindings.filter(b => b.type === "d1").length === 1 &&
    map.get("WORKER_SELF_REFERENCE")?.type === "service" && map.get("WORKER_SELF_REFERENCE").service === PRODUCTION.worker &&
    map.get("WORKER_SELF_REFERENCE").environment === "production" && map.get("WORKER_SELF_REFERENCE").entrypoint === null &&
    map.get("ASSETS")?.type === "assets", "production_resources_unverified");
  check(MODES.every(name => map.get(name)?.type === "plain_text" && map.get(name).text === "d1"), "production_d1_modes_unverified");
  check(map.get("NEXT_PUBLIC_APP_ENV")?.type === "plain_text" && map.get("NEXT_PUBLIC_APP_ENV").text === "production" &&
    map.get("ADVISOR_AUTH_MODE")?.type === "plain_text" && map.get("ADVISOR_AUTH_MODE").text === "cloudflare_access" &&
    map.get("NEXT_PUBLIC_SITE_URL")?.type === "plain_text" && ["https://vanesch.uk", PRODUCTION_HEALTHCHECK_ORIGIN].includes(map.get("NEXT_PUBLIC_SITE_URL").text),
  "production_runtime_environment_unverified");
  if (notificationRouting === EXISTING_NOTIFICATION_ROUTING) {
    // This narrowly declared mode preserves the observed production secret
    // bindings. It cannot establish, expose, choose or replace their values.
    check(map.get("CONTACT_TO_EMAIL")?.type === "secret_text" && map.get("CONTACT_FROM_EMAIL")?.type === "secret_text",
      "production_existing_notification_secret_bindings_unverified");
  } else {
    // Default strict mode still requires exact readable Greg-only delivery.
    check(map.get("CONTACT_TO_EMAIL")?.type === "plain_text" && map.get("CONTACT_TO_EMAIL").text === "greg@vanesch.uk",
      "production_internal_recipient_unverified");
    check(map.get("CONTACT_FROM_EMAIL")?.type === "plain_text" && Boolean(map.get("CONTACT_FROM_EMAIL").text.trim()),
      "production_mail_transport_unverified");
  }
  check(
    (map.get("RESEND_API_KEY")?.type === "secret_text" || map.get("RESEND_API_KEY")?.type === "plain_text" && Boolean(map.get("RESEND_API_KEY").text.trim())),
  "production_mail_transport_unverified");
  return fingerprint(bindings);
}

async function runtimeLease(ctx) {
  const [settings, deployments, version, database, health] = await Promise.all([
    ctx.api(`/workers/scripts/${PRODUCTION.worker}/settings`), ctx.api(`/workers/scripts/${PRODUCTION.worker}/deployments`),
    ctx.api(`/workers/scripts/${PRODUCTION.worker}/versions/${ctx.request.expectedProductionVersionId}`),
    ctx.api(`/d1/database/${PRODUCTION.database}`), ctx.hosted("/api/health"),
  ]);
  const deployment = deployments?.deployments?.[0];
  check(UUID.test(deployment?.id ?? "") && deployment.versions?.length === 1 && deployment.versions[0].percentage === 100 &&
    deployment.versions[0].version_id === ctx.request.expectedProductionVersionId && version?.id === ctx.request.expectedProductionVersionId,
  "production_active_version_changed");
  check((database?.uuid ?? database?.id) === PRODUCTION.database && database.name === "vanesch-prod", "production_database_identity_unverified");
  check(health?.status === "ok" && health.d1 === "connected" && health.supabase === "not_required", "production_d1_health_unverified");
  const bindingFingerprint = bindingsFingerprint(settings?.bindings, ctx.notificationRouting);
  check(bindingFingerprint === bindingsFingerprint(version.resources?.bindings, ctx.notificationRouting), "production_settings_and_active_bindings_disagree");
  return fingerprint({ deploymentId: deployment.id, versionId: version.id, bindingFingerprint, databaseId: PRODUCTION.database });
}

function checkpoint(ctx, leaseFingerprint) {
  return { kind: CHECKPOINT, requestFingerprint: ctx.requestFingerprint, productionVersionId: ctx.request.expectedProductionVersionId,
    payloadFingerprint: ctx.payloadFingerprint, leaseFingerprint };
}

function checkCheckpoint(ctx, value, leaseFingerprint) {
  check(value?.kind === CHECKPOINT && value.requestFingerprint === ctx.requestFingerprint &&
    value.productionVersionId === ctx.request.expectedProductionVersionId && value.payloadFingerprint === ctx.payloadFingerprint &&
    HASH.test(value.leaseFingerprint ?? "") && value.leaseFingerprint === leaseFingerprint, "production_healthcheck_checkpoint_changed");
}

async function syntheticState(ctx, leaseFingerprint) {
  const [submission, attempt] = await Promise.all([
    ctx.query("submission", [ctx.payload.countryRegion]), ctx.query("attempt", [ctx.attemptId]),
  ]);
  check(submission.results.length <= 1 && attempt.results.length <= 1, "production_synthetic_identity_not_unique");
  const row = submission.results[0] ?? null, recorded = attempt.results[0] ?? null;
  let metadata = null;
  if (recorded) {
    try { metadata = JSON.parse(recorded.metadata); }
    catch { throw new ProductionHealthCheckError("production_attempt_metadata_invalid"); }
    check(recorded.event_id === ctx.attemptId && recorded.event_type === EVENT && recorded.status === "success" && recorded.source === SOURCE &&
      object(metadata) && Object.keys(metadata).length === 6 && metadata.state === "attempt_reserved" &&
      metadata.requestFingerprint === ctx.requestFingerprint && metadata.productionVersionId === ctx.request.expectedProductionVersionId &&
      metadata.payloadFingerprint === ctx.payloadFingerprint && metadata.leaseFingerprint === leaseFingerprint &&
      ["api", "browser"].includes(metadata.method), "production_attempt_ownership_unverified");
  }
  check(!row || recorded, "production_unreserved_submission_requires_review");
  return { row, attempt: metadata };
}

async function prepare(ctx) {
  const lease = await runtimeLease(ctx), state = await syntheticState(ctx, lease);
  return { checkpoint: checkpoint(ctx, lease), state: state.row ? "existing_submission" : state.attempt ? "reserved_attempt_requires_verification" : "ready",
    formUrl: `${PRODUCTION_HEALTHCHECK_ORIGIN}/diagnostic`, payload: structuredClone(ctx.payload),
    readOnly: true, databaseWrites: false, applicationSubmissionAttempted: false, participantEmails: 0,
    notificationRouting: ctx.notificationRouting, internalRecipientBindingPresent: true,
    recipientValueVerified: ctx.notificationRouting === STRICT_NOTIFICATION_ROUTING };
}

// Read-only at the SQL level: D1's query transport uses POST for SELECT statements.
export async function prepareProductionHealthCheckSmoke(options) { return prepare(context(options)); }

async function reserve(ctx, preparedCheckpoint, method) {
  check(["api", "browser"].includes(method), "production_submission_method_invalid");
  const lease = await runtimeLease(ctx);
  checkCheckpoint(ctx, preparedCheckpoint, lease);
  const state = await syntheticState(ctx, lease);
  check(!state.attempt && !state.row, "production_attempt_already_exists_do_not_resubmit");
  const metadata = { state: "attempt_reserved", requestFingerprint: ctx.requestFingerprint,
    productionVersionId: ctx.request.expectedProductionVersionId, payloadFingerprint: ctx.payloadFingerprint,
    leaseFingerprint: lease, method };
  const reserved = await ctx.query("reserve", [ctx.attemptId, JSON.stringify(metadata)]);
  check(reserved.meta?.changes === 1, "production_attempt_not_new_do_not_resubmit");
  const freshLease = await runtimeLease(ctx);
  checkCheckpoint(ctx, preparedCheckpoint, freshLease);
  const fresh = await syntheticState(ctx, freshLease);
  check(fresh.attempt?.method === method && !fresh.row, "production_reserved_attempt_needs_verification");
  return { checkpoint: checkpoint(ctx, freshLease), attemptReserved: true, method,
    formUrl: `${PRODUCTION_HEALTHCHECK_ORIGIN}/diagnostic`, payload: structuredClone(ctx.payload),
    applicationSubmissionAttempted: false, participantEmails: 0 };
}

// For a real browser submission: prepare, reserve with method=browser, submit the
// displayed payload once, then call verify. Never run the API submitter afterward.
// Reset the restored browser draft and verify the optional email field is blank;
// the unchanged form sends email:"", which the endpoint normalizes to null.
export async function reserveProductionHealthCheckAttempt({ checkpoint: preparedCheckpoint, method = "browser", ...options }) {
  return reserve(context(options), preparedCheckpoint, method);
}

async function verify(ctx, completion) {
  const lease = await runtimeLease(ctx), { row, attempt } = await syntheticState(ctx, lease);
  check(attempt && row && UUID.test(row.submission_id ?? "") && UUID.test(row.public_token ?? ""),
    "production_reserved_submission_not_found_do_not_resubmit");
  let answers;
  try { answers = JSON.parse(row.answers); }
  catch { throw new ProductionHealthCheckError("production_synthetic_answers_invalid"); }
  check(object(answers) && fingerprint(answers) === fingerprint(ANSWERS) && row.score === SCORE && row.band === BAND && row.email === null &&
    row.company_size === COMPANY_SIZE && row.industry === "Other" && row.role === "Other" && row.country_region === ctx.payload.countryRegion &&
    row.submission_source === "health-check" && Number.isFinite(Date.parse(row.completed_at)), "production_synthetic_row_mismatch");
  if (completion) check(completion.ok === true && completion.submissionId === row.submission_id && completion.publicToken === row.public_token &&
    completion.score === SCORE && completion.band === BAND, "production_submission_response_mismatch_do_not_resubmit");
  const result = await ctx.hosted(`/api/public-diagnostic-result?token=${row.public_token}`);
  check(result?.ok === true && result.result?.rawScore === 30 && result.result?.score === SCORE && result.result?.band?.label === BAND &&
    result.context?.companySize === COMPANY_SIZE && result.context?.industry === "Other" && result.context?.role === "Other" &&
    result.context?.emailPresent === false, "production_public_result_mismatch");
  const events = (await ctx.query("events", [row.submission_id])).results;
  const inserts = events.filter(event => event.event_type === "health_check_db_insert");
  const notifications = events.filter(event => event.event_type === "health_check_internal_email");
  check(inserts.length === 1 && inserts[0].status === "success", "production_insert_event_unverified");
  check(!events.some(event => event.event_type === "health_check_client_email"), "production_unexpected_participant_email_event");
  check(notifications.length <= 1, "production_notification_event_not_unique");
  let notificationStatus = "unknown";
  if (notifications.length === 1) {
    const event = notifications[0];
    check(["success", "error"].includes(event.status), "production_notification_status_unrecognized");
    if (event.status === "error") notificationStatus = "failed";
    else {
      let metadata;
      try { metadata = JSON.parse(event.metadata); }
      catch { throw new ProductionHealthCheckError("production_notification_metadata_invalid"); }
      check(typeof metadata?.resendId === "string" && metadata.resendId.length > 0, "production_notification_acceptance_unverified");
      notificationStatus = "provider_accepted";
    }
  }
  check(lease === await runtimeLease(ctx), "production_runtime_changed_during_verification");
  return { requestId: ctx.request.requestId, productionVersion: ctx.request.expectedProductionVersionId,
    d1WriteVerified: true, publicResultVerified: true, insertEventVerified: true,
    notificationRouting: ctx.notificationRouting, internalRecipientBindingPresent: true,
    recipientValueVerified: ctx.notificationRouting === STRICT_NOTIFICATION_ROUTING,
    internalNotificationStatus: notificationStatus, advisorEmailProviderAccepted: notificationStatus === "provider_accepted",
    participantEmails: 0, submissionMethod: attempt.method, automaticResubmissionAllowed: false, existingDataChanged: false };
}

export async function verifyProductionHealthCheckSmoke(options) { return verify(context(options)); }

// Only a new durable reservation won in this invocation permits the hosted POST.
// A prior browser reservation or unknown outcome is never replayed by this runner.
export async function runProductionHealthCheckSmoke(options) {
  const ctx = context(options), prepared = await prepare(ctx);
  if (prepared.state === "existing_submission")
    return { ...await verify(ctx), createdSubmission: false, reusedSubmission: true, applicationSubmissionAttempted: false };
  check(prepared.state === "ready", "production_existing_attempt_requires_verification_do_not_resubmit");
  await reserve(ctx, prepared.checkpoint, "api");
  const completion = await ctx.hosted("/api/diagnostic-complete", ctx.payload);
  check(completion?.ok === true && UUID.test(completion.submissionId ?? "") && UUID.test(completion.publicToken ?? ""),
    "production_submission_response_unverified_do_not_resubmit");
  return { ...await verify(ctx, completion), createdSubmission: true, reusedSubmission: false, applicationSubmissionAttempted: true };
}

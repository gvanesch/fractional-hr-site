// INERT LIBRARY ONLY: no CLI, workflow, request file, or import-time network call.
// A reviewed caller must supply production acceptance evidence, fresh Access
// inspection, and a fetch implementation. Preparation is GET-only; staging and
// activation are separate calls. The caller must hold the existing shared
// production-release concurrency lock; the provider has no conditional lease.
// No database, mail, secret-value, route, QA,
// Supabase, billing, deletion, or forced-rollback mutation is available here.
//
// Provider mapping checked against Wrangler 4.152.0 and Cloudflare's references:
// https://developers.cloudflare.com/workers/wrangler/commands/workers/#versions-secret-bulk
// https://developers.cloudflare.com/api/resources/workers/subresources/beta/subresources/workers/subresources/versions/methods/get/
// https://developers.cloudflare.com/api/resources/workers/subresources/beta/subresources/workers/subresources/versions/
// https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/versions/methods/get/
// Wrangler src/versions/secrets/index.ts PATCHes /versions/latest with an env
// merge patch, application/merge-patch+json, and no deploy query. This creates
// an inactive version. Do not substitute a UUID in that PATCH path.
//
// Beta GET ?include=modules,sourcemaps returns result.{id,number,bindings,
// env?,modules:[{name,content_type,content_base64}],assets:{config?,jwt?},...}.
// assets.jwt is documented as an asset-upload completion token. This verifier
// requires exact equality alongside the env-only merge contract; it is not an
// independently documented content digest. Its availability/stability for this
// real Worker has NOT been established and must be reviewed before wiring.
// Missing identity, unknown fields, or unequal fingerprints stop the operation;
// missing metadata is never treated as proof that resources were preserved.
// Secret values are never readable: preservation of non-target secrets follows
// from the unchanged latest-version base and untouched env merge entries, with
// exact name/type inventories checked before and after.
import { createHash } from "node:crypto";
import { ACCOUNT, QA, PRODUCTION, fingerprint, normalizeBindings } from "./qa-retirement-release.mjs";
import { validateVerifiedAccess } from "./production-retirement-release.mjs";
import { MODES } from "./supabase-retirement-readonly.mjs";

export const LEGACY_SUPABASE_BINDINGS = Object.freeze([
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
]);
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;
const PATCH_PATH = `/workers/workers/${PRODUCTION.worker}/versions/latest`;
const DEPLOY_PATH = `/workers/scripts/${PRODUCTION.worker}/deployments`;
const REF = "refs/heads/chore/supabase-retirement-2026-11";
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const HASH = /^[a-f0-9]{64}$/i;
const ACCEPTANCE_CHECKS = ["healthD1Connected", "healthSupabaseNotRequired", "healthCheckD1WriteReadVerified",
  "advisorFlowVerified", "crmFlowVerified", "projectSpacesVerified", "baselineFlowVerified", "logoutVerified"];
const REQUIRED = ["ADVISOR_ALLOWED_EMAILS", "CLIENT_DIAGNOSTIC_OTP_SECRET", "INVITE_RATE_LIMIT_SALT", "CRON_SECRET",
  "RESEND_API_KEY", "CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL", "DAILY_SUMMARY_RECIPIENT"];
const CHANGING_ANNOTATIONS = ["workers/message", "workers/tag", "workers/triggered_by"];
const BETA_VOLATILE = ["id", "number", "created_on", "urls", "author_email", "author_id", "source", "startup_time_ms"];
const BETA_FIELDS = [...BETA_VOLATILE, "annotations", "assets", "bindings", "env", "cache_options", "compatibility_date",
  "compatibility_flags", "containers", "exports", "exports_reconciliation", "limits", "main_module", "migration_tag",
  "migrations", "modules", "package_dependencies", "placement", "usage_model"];

export class BindingCleanupError extends Error {
  constructor(message) { super(message); this.name = "BindingCleanupError"; }
}
const check = (condition, message) => { if (!condition) throw new BindingCleanupError(message); };
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const hash = value => fingerprint({ value });
// Repeated base64 groups exhaust V8's regexp stack for valid multi-MB modules.
const base64Valid = value => typeof value === "string" && value.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(value);
const without = (value, keys) => Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
function fields(value, allowed, label) {
  check(object(value) && Object.keys(value).every(key => allowed.includes(key)),
    `Unsupported ${label} metadata; review the provider schema before cleanup.`);
}
function ageWithin(value, now, limit) {
  const age = now - Date.parse(value);
  return Number.isFinite(age) && age >= 0 && age <= limit;
}
function annotations(value) {
  check(value == null || object(value) && Object.values(value).every(item => typeof item === "string"), "Worker annotations are unavailable.");
  return without(value ?? {}, CHANGING_ANNOTATIONS);
}
function snapshotInputs(options) {
  // Async callbacks must not be able to alter an already validated lease or
  // expand the removal set by mutating the caller's original objects.
  try {
    return { ...options, ...structuredClone({ env: options.env, accepted: options.accepted,
      checkpoint: options.checkpoint, staged: options.staged }) };
  } catch { throw new BindingCleanupError("Cleanup inputs could not be safely snapshotted."); }
}

export function validateCleanupContext({ env, accepted, fetchImpl, inspectAccess, now = Date.now() }) {
  check(env?.GITHUB_REPOSITORY === "gvanesch/fractional-hr-site" && env.GITHUB_REF === REF &&
    /^[a-f0-9]{40}$/.test(env.GITHUB_SHA ?? "") && env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT &&
    Boolean(env.CLOUDFLARE_API_TOKEN?.trim()) && !env.CLOUDFLARE_ENV && !env.NEXT_DEV_WRANGLER_ENV,
  "The fixed production cleanup context is not verified.");
  check(!Object.entries(env).some(([name, value]) => /SUPABASE/i.test(name) && Boolean(value)),
    "Cleanup must run without Supabase environment values.");
  check(accepted?.kind === "accepted-production-d1-access" && UUID.test(accepted.productionVersionId ?? "") &&
    UUID.test(accepted.qaVersionId ?? "") && accepted.productionVersionId !== accepted.qaVersionId &&
    HASH.test(accepted.accessPlanFingerprint ?? "") && HASH.test(accepted.accessApplicationFingerprint ?? "") &&
    ageWithin(accepted.acceptedAt, now, 24 * 60 * 60 * 1000) && ACCEPTANCE_CHECKS.every(key => accepted[key] === true),
  "Current acceptance of the exact production D1/Access version is required before binding cleanup.");
  check(typeof fetchImpl === "function" && typeof inspectAccess === "function", "Reviewed read/verification callbacks are required; this module has no automatic runner.");
}

function apiClient(env, fetchImpl, phase = "read") {
  return async (path, options = {}) => {
    const method = options.method ?? "GET";
    const regular = /^\/workers\/scripts\/(fractional-hr-site(?:-qa)?)\/(settings|secrets|schedules|subdomain|deployments|versions(?:\/[a-f0-9-]{36})?)$/;
    const detailed = /^\/workers\/workers\/(fractional-hr-site(?:-qa)?)\/versions\/[a-f0-9-]{36}\?include=modules,sourcemaps$/;
    check(method === "GET" && (regular.test(path) || detailed.test(path)) ||
      phase === "stage" && method === "PATCH" && path === PATCH_PATH ||
      phase === "activate" && method === "POST" && path === DEPLOY_PATH,
    "That Cloudflare endpoint or mutation is forbidden by binding cleanup.");
    let response;
    try {
      response = await fetchImpl(API + path, { method, ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
        redirect: "error", signal: AbortSignal.timeout(30000), headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN.trim()}`,
          "Content-Type": method === "PATCH" ? "application/merge-patch+json" : "application/json",
        } });
    } catch { throw new BindingCleanupError("Cloudflare cleanup request failed or timed out; inspect state before any retry."); }
    check(response.ok, `Cloudflare cleanup request returned HTTP ${response.status}; no automatic retry.`);
    let body;
    try { body = await response.json(); } catch { throw new BindingCleanupError("Cloudflare cleanup response was not valid JSON; inspect state before any retry."); }
    check(object(body) && body.success === true && Object.hasOwn(body, "result"), "Cloudflare did not confirm the cleanup request; raw response withheld.");
    return body.result;
  };
}

async function reads(tasks) {
  const results = await Promise.allSettled(tasks);
  const failed = results.find(result => result.status === "rejected");
  if (failed) throw failed.reason instanceof BindingCleanupError ? failed.reason : new BindingCleanupError("Cleanup verification failed; raw error withheld.");
  return results.map(result => result.value);
}

function bindings(entries) {
  check(Array.isArray(entries), "Worker binding inventory is unavailable.");
  const allowed = {
    plain_text: ["name", "type", "text"], json: ["name", "type", "json"],
    secret_text: ["name", "type"], secret_key: ["name", "type"], assets: ["name", "type"],
    d1: ["name", "type", "id", "database_id"], service: ["name", "type", "service", "environment", "entrypoint"],
  };
  for (const entry of entries) {
    check(object(entry) && Object.hasOwn(allowed, entry.type), "Unsupported Worker binding type; review before cleanup.");
    fields(entry, allowed[entry.type], "Worker binding");
    if (entry.type === "d1" && entry.id !== undefined && entry.database_id !== undefined)
      check(entry.id === entry.database_id, "D1 binding aliases disagree.");
  }
  try { return normalizeBindings(entries); }
  catch { throw new BindingCleanupError("Worker binding metadata is invalid; raw values withheld."); }
}

function moduleFingerprint(modules, main) {
  check(Array.isArray(modules) && modules.length > 0 && typeof main === "string" && main,
    "Complete Worker module content is unavailable; cleanup cannot prove code preservation.");
  const seen = new Set();
  const result = modules.map(item => {
    fields(item, ["name", "content_type", "content_base64"], "Worker module");
    check(typeof item.name === "string" && item.name && !seen.has(item.name) && typeof item.content_type === "string" &&
      base64Valid(item.content_base64),
    "Worker module content is invalid; cleanup cannot prove code preservation.");
    seen.add(item.name);
    return { name: item.name, contentType: item.content_type, sha256: createHash("sha256").update(Buffer.from(item.content_base64, "base64")).digest("hex") };
  });
  check(seen.has(main), "Worker main module is absent from the complete module inventory.");
  return hash({ main, modules: result.sort((a, b) => a.name.localeCompare(b.name)) });
}

function version(value, legacy, expectedId) {
  fields(value, BETA_FIELDS, "beta Worker version");
  check(value.id === expectedId && Number.isInteger(value.number) && value.number > 0 && Array.isArray(value.urls) &&
    value.urls.every(url => typeof url === "string") && Number.isFinite(Date.parse(value.created_on)), "Worker version identity/sequence metadata is unavailable.");
  fields(legacy, ["id", "number", "metadata", "annotations", "resources", "cache_options"], "script Worker version");
  check(legacy.id === expectedId && legacy.number === value.number, "Worker version APIs disagree on identity or sequence.");
  if (legacy.metadata !== undefined) {
    fields(legacy.metadata, ["author_email", "author_id", "created_on", "hasPreview", "modified_on", "source"], "script version publication");
    check(Object.entries(legacy.metadata).every(([key, item]) => key === "hasPreview" ? typeof item === "boolean" : typeof item === "string"),
      "Worker publication metadata has an unsupported shape.");
  }
  fields(legacy.resources, ["bindings", "script", "script_runtime"], "script version resources");
  fields(legacy.resources.script, ["etag", "handlers", "named_handlers", "placement_mode", "placement", "last_deployed_from"], "script code");
  const script = legacy.resources.script;
  check(typeof script.etag === "string" && script.etag && Array.isArray(script.handlers), "Worker code etag/handler metadata is unavailable.");
  fields(legacy.resources.script_runtime, ["compatibility_date", "compatibility_flags", "usage_model", "limits", "exports", "migration_tag"], "script runtime");
  const runtime = legacy.resources.script_runtime;
  check(typeof value.compatibility_date === "string" && value.compatibility_date === runtime.compatibility_date &&
    hash(value.compatibility_flags ?? []) === hash(runtime.compatibility_flags ?? []) &&
    hash(value.limits) === hash(runtime.limits) && hash(value.usage_model) === hash(runtime.usage_model) &&
    hash(value.exports) === hash(runtime.exports) && hash(value.migration_tag) === hash(runtime.migration_tag),
  "Worker runtime metadata is incomplete or differs between provider APIs.");
  const normalized = bindings(value.bindings);
  check(hash(normalized) === hash(bindings(legacy.resources.bindings)), "Worker version APIs disagree on bindings.");
  if (value.env !== undefined) {
    check(object(value.env), "Beta Worker env metadata is invalid.");
    const entries = Object.entries(value.env).map(([name, item]) => {
      check(object(item) && !Object.hasOwn(item, "name"), "Beta Worker env entries have unsupported names.");
      return { ...item, name };
    });
    check(hash(bindings(entries)) === hash(normalized), "Beta Worker env and binding metadata disagree.");
  }
  fields(value.assets, ["config", "jwt"], "Worker assets");
  check(typeof value.assets.jwt === "string" && value.assets.jwt.length > 0,
    "Stable asset identity (assets.jwt) is unavailable; review the provider response before cleanup.");
  if (value.assets.config !== undefined) fields(value.assets.config,
    ["base_path", "html_handling", "not_found_handling", "run_worker_first"], "Worker asset configuration");
  const rest = without(value, [...BETA_VOLATILE, "bindings", "env", "modules", "assets", "annotations"]);
  return { id: value.id, number: value.number, bindings: normalized,
    bindingFingerprint: hash(normalized), codeFingerprint: moduleFingerprint(value.modules, value.main_module),
    assetFingerprint: hash(value.assets), versionSettingsFingerprint: hash(rest),
    runtimeFingerprint: hash(runtime), scriptFingerprint: hash(without(script, ["last_deployed_from"])),
    annotationFingerprint: hash(annotations(value.annotations)), legacyAnnotationFingerprint: hash(annotations(legacy.annotations)),
    previewFingerprint: hash(legacy.metadata?.hasPreview),
    annotationTag: value.annotations?.["workers/tag"], annotationMessage: value.annotations?.["workers/message"],
    legacyCacheFingerprint: hash(legacy.cache_options) };
}

function validateTarget(state, target, access) {
  const map = new Map(state.bindings.map(item => [item.name, item]));
  check(map.get("DB")?.type === "d1" && map.get("DB").id === target.database && state.bindings.filter(item => item.type === "d1").length === 1 &&
    map.get("ASSETS")?.type === "assets" && state.bindings.filter(item => item.type === "assets").length === 1 &&
    map.get("WORKER_SELF_REFERENCE")?.type === "service" && map.get("WORKER_SELF_REFERENCE").service === target.worker &&
    map.get("WORKER_SELF_REFERENCE").environment === "production" && map.get("WORKER_SELF_REFERENCE").entrypoint === null,
  "Worker resource bindings do not match the fixed production/QA targets.");
  check(MODES.every(name => map.get(name)?.type === "plain_text" && map.get(name).text === "d1") &&
    map.get("ADVISOR_AUTH_MODE")?.type === "plain_text" && map.get("ADVISOR_AUTH_MODE").text === "cloudflare_access",
  "Worker data/auth modes are not the accepted D1/Access modes.");
  const present = name => map.get(name)?.type === "secret_text" || map.get(name)?.type === "plain_text" && map.get(name).text.trim();
  check(REQUIRED.every(present) && ["CLOUDFLARE_ACCESS_AUD", "CLOUDFLARE_ACCESS_TEAM_DOMAIN"].every(present), "Required non-Supabase Worker bindings are missing.");
  check(map.get("NEXT_PUBLIC_APP_ENV")?.text === (target === PRODUCTION ? "production" : "qa") &&
    (target === PRODUCTION ? ["https://vanesch.uk", "https://www.vanesch.uk"].includes(map.get("NEXT_PUBLIC_SITE_URL")?.text) : map.get("NEXT_PUBLIC_SITE_URL")?.text === QA.site),
  "Worker environment identity does not match the fixed target.");
  if (target === PRODUCTION) check(map.get("CLOUDFLARE_ACCESS_AUD")?.text === access.audience &&
    map.get("CLOUDFLARE_ACCESS_TEAM_DOMAIN")?.text === access.teamDomain, "Production Access bindings differ from the verified application.");
}

async function inspectWorker(api, target, expectedVersion, latestVersion = expectedVersion, previousVersion) {
  const prefix = `/workers/scripts/${target.worker}`;
  const [settings, secrets, schedules, subdomain, deployments, versions, legacy, detail] = await reads([
    api(`${prefix}/settings`), api(`${prefix}/secrets`), api(`${prefix}/schedules`), api(`${prefix}/subdomain`),
    api(`${prefix}/deployments`), api(`${prefix}/versions`), api(`${prefix}/versions/${expectedVersion}`),
    api(`/workers/workers/${target.worker}/versions/${expectedVersion}?include=modules,sourcemaps`),
  ]);
  const deployment = deployments?.deployments?.[0];
  check(UUID.test(deployment?.id ?? "") && deployment.versions?.length === 1 &&
    deployment.versions[0].version_id === expectedVersion && deployment.versions[0].percentage === 100,
  "The active Worker deployment differs from the accepted version lease.");
  check(Array.isArray(versions?.items) && versions.items[0]?.id === latestVersion &&
    versions.items.every(item => UUID.test(item?.id ?? "")) && new Set(versions.items.map(item => item.id)).size === versions.items.length &&
    (!previousVersion || versions.items[1]?.id === previousVersion), "An unknown or intervening Worker upload prevents cleanup.");
  check(object(settings) && Array.isArray(secrets) && Array.isArray(schedules?.schedules) && typeof subdomain?.enabled === "boolean",
    "Worker settings, secret inventory, schedule or subdomain metadata is unavailable.");
  const active = version(detail, legacy, expectedVersion);
  check(hash(bindings(settings.bindings)) === active.bindingFingerprint, "Active version and Worker settings bindings disagree.");
  const secretNames = secrets.map(item => {
    fields(item, ["name", "type"], "secret-name inventory");
    check(typeof item.name === "string" && ["secret_text", "secret_key"].includes(item.type), "Secret-name inventory is invalid.");
    return { name: item.name, type: item.type };
  }).sort((a, b) => a.name.localeCompare(b.name));
  check(hash(secretNames) === hash(active.bindings.filter(item => ["secret_text", "secret_key"].includes(item.type))), "Secret-name and active binding inventories disagree.");
  return { ...active, worker: target.worker, deploymentId: deployment.id, latestVersionId: versions.items[0].id,
    settingsFingerprint: hash({ ...without(settings, ["bindings", "annotations"]), annotations: annotations(settings.annotations) }),
    routingFingerprint: hash({ schedules, subdomain }) };
}

const SNAPSHOT = ["worker", "id", "number", "deploymentId", "latestVersionId", "bindingFingerprint", "codeFingerprint", "assetFingerprint",
  "versionSettingsFingerprint", "runtimeFingerprint", "scriptFingerprint", "annotationFingerprint", "legacyAnnotationFingerprint",
  "previewFingerprint", "legacyCacheFingerprint", "settingsFingerprint", "routingFingerprint"];
const IMMUTABLE = SNAPSHOT.filter(key => !["id", "number", "deploymentId", "latestVersionId", "bindingFingerprint"].includes(key));
const snapshot = state => Object.fromEntries(SNAPSHOT.map(key => [key, state[key]]));
function sameState(actual, expected, overrides = {}) {
  check(hash(snapshot(actual)) === hash({ ...expected, ...overrides }), "Worker code, bindings, settings, assets, sequence, routing or deployment changed outside this cleanup.");
}
function removalNames(state) {
  check(!state.bindings.some(item => /SUPABASE/i.test(item.name) && !LEGACY_SUPABASE_BINDINGS.includes(item.name)),
    "An unreviewed Supabase binding requires inspection before cleanup.");
  check(state.bindings.filter(item => LEGACY_SUPABASE_BINDINGS.includes(item.name))
    .every(item => ["plain_text", "secret_text"].includes(item.type)),
  "A known Supabase name has an unexpected binding type; review before cleanup.");
  return LEGACY_SUPABASE_BINDINGS.filter(name => state.bindings.some(item => item.name === name));
}
const expectedBindings = (state, names) => hash(state.bindings.filter(item => !names.includes(item.name)));
async function accessProof(inspectAccess, accepted) {
  let proof;
  try { proof = await inspectAccess(); } catch { throw new BindingCleanupError("Fresh production Access verification failed; raw details withheld."); }
  try { proof = validateVerifiedAccess(proof, { expectedAccessPlanFingerprint: accepted.accessPlanFingerprint }); }
  catch { throw new BindingCleanupError("Production Access proof does not match the accepted application."); }
  check(proof.applicationFingerprint === accepted.accessApplicationFingerprint, "Production Access changed after acceptance.");
  return proof;
}
async function health(fetchImpl) {
  for (const host of ["vanesch.uk", "www.vanesch.uk"]) {
    let response, value, url = new URL(`https://${host}/api/health`);
    for (let hop = 0; hop < 5; hop++) {
      try { response = await fetchImpl(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(30000) }); }
      catch { throw new BindingCleanupError("Fresh independent production health verification failed."); }
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      let next;
      try { next = new URL(response.headers.get("location") ?? "", url); } catch { /* reject below */ }
      await response.body?.cancel();
      check(next?.protocol === "https:" && ["vanesch.uk", "www.vanesch.uk"].includes(next.hostname) &&
        next.pathname === "/api/health" && !next.username && !next.password && !next.search && !next.hash && hop < 4,
      "Production health redirected outside its fixed public endpoint or exceeded its redirect limit.");
      url = next;
    }
    try { value = await response.json(); }
    catch { throw new BindingCleanupError("Fresh independent production health verification failed."); }
    check(response.ok && value?.status === "ok" && value.d1 === "connected" && value.supabase === "not_required",
      "Production health does not confirm D1 operation without Supabase.");
  }
}
async function observe(api, accepted, inspectAccess, { latestVersion, activeVersion, previousVersion } = {}) {
  const [production, qa, access] = await reads([
    inspectWorker(api, PRODUCTION, activeVersion ?? accepted.productionVersionId, latestVersion ?? activeVersion ?? accepted.productionVersionId, previousVersion),
    inspectWorker(api, QA, accepted.qaVersionId), accessProof(inspectAccess, accepted),
  ]);
  validateTarget(production, PRODUCTION, access); validateTarget(qa, QA, access);
  return { production, qa, accessFingerprint: hash(access) };
}
function validateCheckpoint(checkpoint, accepted, now) {
  check(checkpoint?.kind === "prepared-production-binding-cleanup" && checkpoint.acceptanceFingerprint === hash(accepted) &&
    ageWithin(checkpoint.preparedAt, now, 60 * 60 * 1000) && checkpoint.production?.id === accepted.productionVersionId &&
    checkpoint.qa?.id === accepted.qaVersionId && HASH.test(checkpoint.expectedBindingFingerprint ?? "") && HASH.test(checkpoint.accessFingerprint ?? "") &&
    Array.isArray(checkpoint.removeBindings) && checkpoint.removeBindings.length > 0 &&
    checkpoint.removeBindings.every(name => LEGACY_SUPABASE_BINDINGS.includes(name)),
  "Prepared cleanup evidence is stale, invalid, or for a different accepted version.");
}
function checkObserved(observed, checkpoint, overrides = {}) {
  sameState(observed.production, checkpoint.production, overrides);
  sameState(observed.qa, checkpoint.qa);
  check(observed.accessFingerprint === checkpoint.accessFingerprint, "Production Access changed during binding cleanup.");
}
async function evidence(callback, report) {
  check(typeof callback === "function", "A durable sanitized recovery-evidence callback is required before mutation.");
  try { await callback(structuredClone(report)); } catch { throw new BindingCleanupError("Recovery evidence could not be recorded; cleanup stopped before its next action."); }
}
function recovery(accepted, checkpoint) {
  return { previousProductionVersion: accepted.productionVersionId, qaVersion: accepted.qaVersionId,
    removedBindings: [...checkpoint.removeBindings], previousVersionUsesSupabaseAuth: false,
    rollbackSecretDifferenceRequiresReview: true, rollbackNeverForcedAutomatically: true };
}
function identity(checkpoint) {
  return { tag: `binding-cleanup-${hash(checkpoint).slice(0, 24)}`, message: `supabase-binding-cleanup-${checkpoint.production.id}` };
}
async function inspectCandidate(api, candidateId, checkpoint, base) {
  const [legacy, detail] = await reads([
    api(`/workers/scripts/${PRODUCTION.worker}/versions/${candidateId}`),
    api(`/workers/workers/${PRODUCTION.worker}/versions/${candidateId}?include=modules,sourcemaps`),
  ]);
  const candidate = version(detail, legacy, candidateId), tag = identity(checkpoint);
  check(candidate.number === base.number + 1 && candidate.bindingFingerprint === checkpoint.expectedBindingFingerprint &&
    candidate.annotationTag === tag.tag && candidate.annotationMessage === tag.message &&
    IMMUTABLE.filter(key => !["worker", "settingsFingerprint", "routingFingerprint"].includes(key)).every(key => candidate[key] === base[key]),
  "Inactive cleanup candidate changed code, assets, runtime, non-target bindings or sequence; activation stopped.");
  return candidate;
}

export async function prepareProductionBindingCleanup(options) {
  const { env, accepted, fetchImpl, inspectAccess, now = Date.now() } = snapshotInputs(options);
  validateCleanupContext({ env, accepted, fetchImpl, inspectAccess, now });
  const observed = await observe(apiClient(env, fetchImpl), accepted, inspectAccess);
  await health(fetchImpl);
  const removeBindings = removalNames(observed.production);
  check(removeBindings.length > 0, "No known Supabase bindings remain; no cleanup version is needed.");
  return { kind: "prepared-production-binding-cleanup", preparedAt: new Date(now).toISOString(), acceptanceFingerprint: hash(accepted),
    production: snapshot(observed.production), qa: snapshot(observed.qa), removeBindings,
    expectedBindingFingerprint: expectedBindings(observed.production, removeBindings), accessFingerprint: observed.accessFingerprint };
}

export async function createProductionBindingCleanupVersion(options) {
  const { env, accepted, checkpoint, fetchImpl, inspectAccess, onEvidence, now = Date.now() } = snapshotInputs(options);
  validateCleanupContext({ env, accepted, fetchImpl, inspectAccess, now }); validateCheckpoint(checkpoint, accepted, now);
  const api = apiClient(env, fetchImpl, "stage");
  const before = await observe(api, accepted, inspectAccess);
  checkObserved(before, checkpoint);
  check(hash(removalNames(before.production)) === hash(checkpoint.removeBindings) &&
    expectedBindings(before.production, checkpoint.removeBindings) === checkpoint.expectedBindingFingerprint,
  "The exact known binding removal set changed after preparation.");
  await health(fetchImpl);
  const retained = recovery(accepted, checkpoint), tag = identity(checkpoint);
  await evidence(onEvidence, { stage: "cleanup_patch_requested_outcome_unknown", ...retained });
  const result = await api(PATCH_PATH, { method: "PATCH", body: {
    env: Object.fromEntries(checkpoint.removeBindings.map(name => [name, null])),
    annotations: { "workers/tag": tag.tag, "workers/message": tag.message },
  } });
  check(UUID.test(result?.id ?? "") && ![accepted.productionVersionId, accepted.qaVersionId].includes(result.id),
    "Cleanup PATCH did not return one new version UUID; inspect state without retrying.");
  await evidence(onEvidence, { stage: "cleanup_uploaded_not_verified", ...retained, cleanupVersion: result.id });
  const candidate = await inspectCandidate(api, result.id, checkpoint, before.production);
  const after = await observe(api, accepted, inspectAccess, { latestVersion: result.id, previousVersion: accepted.productionVersionId });
  checkObserved(after, checkpoint, { latestVersionId: result.id });
  const staged = { kind: "verified-inactive-production-binding-cleanup", preparedFingerprint: hash(checkpoint), stagedAt: new Date(now).toISOString(),
    candidateVersionId: candidate.id, candidateNumber: candidate.number, candidateBindingFingerprint: candidate.bindingFingerprint };
  await evidence(onEvidence, { stage: "cleanup_verified_not_activated", ...retained, cleanupVersion: result.id, productionTrafficUnchanged: true });
  return staged;
}

export async function activateProductionBindingCleanup(options) {
  const { env, accepted, checkpoint, staged, fetchImpl, inspectAccess, onEvidence, now = Date.now() } = snapshotInputs(options);
  validateCleanupContext({ env, accepted, fetchImpl, inspectAccess, now }); validateCheckpoint(checkpoint, accepted, now);
  check(staged?.kind === "verified-inactive-production-binding-cleanup" && staged.preparedFingerprint === hash(checkpoint) &&
    UUID.test(staged.candidateVersionId ?? "") && staged.candidateNumber === checkpoint.production.number + 1 &&
    staged.candidateBindingFingerprint === checkpoint.expectedBindingFingerprint && ageWithin(staged.stagedAt, now, 60 * 60 * 1000),
  "A current verified inactive cleanup candidate is required for activation.");
  const api = apiClient(env, fetchImpl, "activate"), candidateId = staged.candidateVersionId;
  const before = await observe(api, accepted, inspectAccess, { latestVersion: candidateId, previousVersion: accepted.productionVersionId });
  checkObserved(before, checkpoint, { latestVersionId: candidateId });
  await inspectCandidate(api, candidateId, checkpoint, before.production);
  await health(fetchImpl);
  // Recheck the latest pointer and deployment after candidate/module reads.
  const lease = await observe(api, accepted, inspectAccess, { latestVersion: candidateId, previousVersion: accepted.productionVersionId });
  checkObserved(lease, checkpoint, { latestVersionId: candidateId });
  const retained = { ...recovery(accepted, checkpoint), cleanupVersion: candidateId };
  await evidence(onEvidence, { stage: "cleanup_activation_requested_outcome_unknown", ...retained });
  await api(DEPLOY_PATH, { method: "POST", body: { strategy: "percentage",
    versions: [{ version_id: candidateId, percentage: 100 }], annotations: { "workers/message": identity(checkpoint).message } } });
  await evidence(onEvidence, { stage: "cleanup_activated_verification_pending", ...retained });
  const after = await observe(api, accepted, inspectAccess, { activeVersion: candidateId, previousVersion: accepted.productionVersionId });
  check(after.production.deploymentId !== checkpoint.production.deploymentId, "Cleanup activation did not produce a new deployment.");
  checkObserved(after, checkpoint, { id: candidateId, number: staged.candidateNumber, deploymentId: after.production.deploymentId,
    latestVersionId: candidateId, bindingFingerprint: checkpoint.expectedBindingFingerprint });
  check(removalNames(after.production).length === 0, "Supabase bindings remain after cleanup activation.");
  await health(fetchImpl);
  const report = { stage: "cleanup_verified", ...retained, productionDeploymentId: after.production.deploymentId,
    nonTargetBindingsPreserved: true, runtimeCodeAssetsSettingsPreserved: true, qaUnchanged: true,
    healthD1Connected: true, healthSupabaseNotRequired: true, secretValuesInspected: false,
    databaseWrites: false, emailsSent: false, accessPolicyChanges: false, supabaseShutdownPerformed: false };
  await evidence(onEvidence, report);
  return report;
}

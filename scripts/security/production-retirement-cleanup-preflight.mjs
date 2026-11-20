// GET-only provider-shape probe. This does not accept the application, remove
// bindings, read client records, query D1, send mail, or change any cloud state.
// The two complete version reads exercise the exact metadata required by the
// inert production-retirement-binding-cleanup.mjs verifier before it is wired.
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { ACCOUNT, PRODUCTION, fingerprint, normalizeBindings } from "./qa-retirement-release.mjs";

const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;
export const CLEANUP_PROBE_REQUEST_PATH = "scripts/security/production-retirement-cleanup-probe-request.json";
const PREFIX = `/workers/scripts/${PRODUCTION.worker}`;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const NAME = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;
const MAX_BODY_BYTES = 64 * 1024 * 1024;
// These field sets intentionally mirror the inert cleanup verifier. Unknown
// fields are reported as unsupported rather than silently called compatible.
const BETA = "id number created_on urls annotations assets author_email author_id bindings env cache_options compatibility_date compatibility_flags containers exports exports_reconciliation limits main_module migration_tag migrations modules package_dependencies placement source startup_time_ms usage_model".split(" ");
const LEGACY = "id number metadata annotations resources cache_options".split(" ");
const PUBLICATION = "author_email author_id created_on hasPreview modified_on source".split(" ");
const SCRIPT = "etag handlers named_handlers placement_mode placement last_deployed_from".split(" ");
const RUNTIME = "compatibility_date compatibility_flags usage_model limits exports migration_tag".split(" ");
const BINDINGS = {
  plain_text: ["name", "type", "text"], json: ["name", "type", "json"],
  secret_text: ["name", "type"], secret_key: ["name", "type"], assets: ["name", "type"],
  d1: ["name", "type", "id", "database_id"], service: ["name", "type", "service", "environment", "entrypoint"],
};
const type = value => value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
const object = value => type(value) === "object";
const hash = value => fingerprint({ value });
const bytesHash = value => createHash("sha256").update(value).digest("hex");
const safeName = value => typeof value === "string" && NAME.test(value) ? value : "[redacted-name]";
// Avoid a repeated capture/group: V8 exhausts its regexp stack on multi-MB
// valid modules. A character-class scan plus length/padding checks is linear.
const base64Valid = value => typeof value === "string" && value.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(value);

function errorClass(error) {
  if (error instanceof PreflightError) return error.sourceClass;
  for (const [Class, name] of [[RangeError, "RangeError"], [TypeError, "TypeError"], [SyntaxError, "SyntaxError"], [ReferenceError, "ReferenceError"]])
    if (error instanceof Class) return name;
  return error instanceof Error ? "Error" : "UnknownError";
}

class PreflightError extends Error {
  constructor(code, httpStatus = null, source) {
    super(code); this.code = code; this.httpStatus = Number.isInteger(httpStatus) ? httpStatus : null;
    this.sourceClass = source === undefined ? "PreflightError" : errorClass(source);
  }
}
const check = (condition, code) => { if (!condition) throw new PreflightError(code); };
const SCOPE = Object.freeze({ metadataOnly: true, acceptanceVerified: false, mutationAttempted: false,
  clientRecordsRead: false, databaseRequests: false, emailsSent: false, secretValuesPrinted: false,
  bindingValuesPrinted: false, moduleContentsPrinted: false, assetTokensPrinted: false });

export function validateCleanupProbeRequest({ request, env, git, now = Date.now() }) {
  check(env?.GITHUB_REPOSITORY === "gvanesch/fractional-hr-site" && env.GITHUB_REF === "refs/heads/chore/supabase-retirement-2026-11" &&
    env.GITHUB_EVENT_NAME === "push" && String(env.GITHUB_RUN_ATTEMPT) === "1", "probe_request_context_unverified");
  const fields = ["operation", "requestId", "requestedAt", "reviewedCommit"], age = now - Date.parse(request?.requestedAt);
  check(object(request) && Object.keys(request).every(name => fields.includes(name)) &&
    request.operation === "read-production-cleanup-metadata" && /^[a-z0-9][a-z0-9-]{7,63}$/.test(request.requestId ?? "") &&
    /^[a-f0-9]{40}$/.test(request.reviewedCommit ?? "") && Number.isFinite(age) && age >= 0 && age <= 86400000,
  "probe_request_invalid_or_stale");
  check(/^[a-f0-9]{40}$/.test(git?.head ?? "") && git.head === env.GITHUB_SHA && git.parent === request.reviewedCommit &&
    git.changedPaths?.length === 1 && git.changedPaths[0] === CLEANUP_PROBE_REQUEST_PATH, "probe_request_only_source_unverified");
  return { validated: true, metadataOnly: true, mutationAttempted: false, requestId: request.requestId, reviewedCommit: request.reviewedCommit };
}

export function cleanupPreflightFailure(error) {
  return { kind: "production-cleanup-metadata-preflight", metadataReadCompleted: false, metadataReady: false,
    ...SCOPE, failure: { code: error instanceof PreflightError ? error.code : "unexpected_metadata_failure",
      httpStatus: error instanceof PreflightError ? error.httpStatus : null,
      errorClass: errorClass(error), stage: error instanceof PreflightError ? error.diagnostics?.stage ?? "unclassified" : "unclassified" },
    ...(error instanceof PreflightError && error.diagnostics ? { diagnostics: error.diagnostics } : {}) };
}

async function readJson(response) {
  check(response.body?.getReader, "metadata_body_unavailable");
  const reader = response.body.getReader(), chunks = [];
  let size = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new PreflightError("metadata_body_limit_exceeded"); }
      chunks.push(Buffer.from(next.value));
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    throw error instanceof PreflightError ? error : new PreflightError("metadata_body_unreadable", null, error);
  }
}

async function together(tasks) {
  const results = await Promise.allSettled(tasks);
  const failed = results.find(result => result.status === "rejected");
  if (failed) throw failed.reason;
  return results.map(result => result.value);
}

function describeVersion(legacy, beta, diagnostic) {
  const fieldTypes = Object.create(null), unsupported = new Set();
  Object.assign(diagnostic, { stage: "provider_field_shapes", fieldTypes, unsupportedFields: unsupported });
  function shape(value, allowed, path, optional = false) {
    if (optional && value === undefined) return;
    if (!object(value)) { fieldTypes[path] = { value: [type(value)] }; unsupported.add(`${path}:expected_object`); return; }
    const group = fieldTypes[path] ??= Object.create(null), entries = Object.entries(value);
    if (entries.length > 128) unsupported.add(`${path}:field_count_limit`);
    for (const [key, item] of entries.slice(0, 128)) {
      const name = safeName(key), types = group[name] ??= [];
      if (!types.includes(type(item))) types.push(type(item));
      if (!allowed.includes(key)) unsupported.add(`${path}.${name}`);
    }
  }
  shape(legacy, LEGACY, "legacy");
  shape(legacy?.metadata, PUBLICATION, "legacy.metadata", true);
  shape(legacy?.resources, ["bindings", "script", "script_runtime"], "legacy.resources");
  shape(legacy?.resources?.script, SCRIPT, "legacy.script");
  shape(legacy?.resources?.script_runtime, RUNTIME, "legacy.runtime");
  shape(beta, BETA, "beta");
  shape(beta?.assets, ["config", "jwt"], "beta.assets");
  shape(beta?.assets?.config, ["base_path", "html_handling", "not_found_handling", "run_worker_first"], "beta.assets.config", true);
  diagnostic.arrayElementTypes = Object.fromEntries([
    ["beta.modules", beta?.modules], ["beta.bindings", beta?.bindings], ["beta.urls", beta?.urls],
    ["legacy.bindings", legacy?.resources?.bindings],
  ].map(([path, items]) => [path, Array.isArray(items) ? [...new Set(items.slice(0, 2048).map(type))].sort() : [type(items)]]));
  function bindingInventory(entries, path) {
    const nonSecretBindings = [], names = new Set();
    let valid = Array.isArray(entries) && entries.length <= 1000, secretBindingCount = 0;
    for (const entry of valid ? entries : []) {
      const known = Object.hasOwn(BINDINGS, entry?.type ?? ""), kind = known ? entry.type : "unsupported";
      shape(entry, known ? BINDINGS[kind] : ["name", "type"], `${path}.${kind}`);
      if (!known || !NAME.test(entry?.name ?? "") || names.has(entry.name)) valid = false;
      if (!known) unsupported.add(`${path}:unsupported_binding_type`);
      names.add(entry?.name);
      if (/secret/i.test(String(entry?.type))) secretBindingCount++;
      else nonSecretBindings.push({ name: safeName(entry?.name), type: safeName(entry?.type) });
      if (entry?.type === "d1" && entry.id !== undefined && entry.database_id !== undefined && entry.id !== entry.database_id) valid = false;
    }
    let normalized;
    try { if (valid) normalized = normalizeBindings(entries); } catch { valid = false; }
    return { normalized, report: { valid, secretBindingCount,
      nonSecretBindings: nonSecretBindings.sort((a, b) => a.name.localeCompare(b.name)) } };
  }
  diagnostic.stage = "legacy_binding_inventory";
  const oldBindings = bindingInventory(legacy?.resources?.bindings, "legacy.bindings");
  diagnostic.stage = "beta_binding_inventory";
  const newBindings = bindingInventory(beta?.bindings, "beta.bindings");
  diagnostic.stage = "beta_env_comparison";
  let envConsistent = beta?.env === undefined;
  if (object(beta?.env) && Object.keys(beta.env).length <= 1000) {
    const entries = Object.entries(beta.env).map(([name, item]) => ({ ...item, name }));
    const env = bindingInventory(entries, "beta.env");
    envConsistent = env.report.valid && newBindings.report.valid && hash(env.normalized) === hash(newBindings.normalized) &&
      Object.values(beta.env).every(item => object(item) && !Object.hasOwn(item, "name"));
  }
  const modules = beta?.modules, seen = new Set(), moduleHashes = [];
  diagnostic.stage = "module_fingerprints";
  diagnostic.moduleCount = Array.isArray(modules) ? modules.length : null;
  diagnostic.modulesVisited = 0;
  diagnostic.largestEncodedModuleCharacters = 0;
  let modulesValid = Array.isArray(modules) && modules.length > 0 && modules.length <= 2048;
  for (const item of modulesValid ? modules : []) {
    shape(item, ["name", "content_type", "content_base64"], "beta.modules[]");
    diagnostic.modulesVisited++;
    if (typeof item?.content_base64 === "string")
      diagnostic.largestEncodedModuleCharacters = Math.max(diagnostic.largestEncodedModuleCharacters, item.content_base64.length);
    const valid = typeof item?.name === "string" && item.name.length > 0 && !seen.has(item.name) &&
      typeof item.content_type === "string" && item.content_type.length > 0 && typeof item.content_base64 === "string" &&
      base64Valid(item.content_base64);
    modulesValid &&= valid;
    if (valid) { seen.add(item.name); moduleHashes.push({ nameHash: hash(item.name), typeHash: hash(item.content_type),
      contentHash: bytesHash(Buffer.from(item.content_base64, "base64")) }); }
  }
  modulesValid &&= typeof beta?.main_module === "string" && seen.has(beta.main_module);
  diagnostic.stage = "runtime_and_schema_comparison";
  const runtime = legacy?.resources?.script_runtime, etag = legacy?.resources?.script?.etag, jwt = beta?.assets?.jwt;
  const runtimeConsistent = object(runtime) && typeof beta?.compatibility_date === "string" &&
    beta.compatibility_date === runtime.compatibility_date && RUNTIME.filter(key => key !== "compatibility_date")
      .every(key => hash(key === "compatibility_flags" ? beta[key] ?? [] : beta[key]) ===
        hash(key === "compatibility_flags" ? runtime[key] ?? [] : runtime[key]));
  const jwtPresent = typeof jwt === "string" && jwt.length > 0;
  const annotationsValid = value => value == null || object(value) && Object.values(value).every(item => typeof item === "string");
  const schemaCompatible = Array.isArray(beta?.urls) && beta.urls.every(url => typeof url === "string") &&
    Number.isFinite(Date.parse(beta?.created_on)) && Array.isArray(legacy?.resources?.script?.handlers) &&
    annotationsValid(beta?.annotations) && annotationsValid(legacy?.annotations) &&
    (legacy?.metadata === undefined || object(legacy.metadata) && Object.entries(legacy.metadata)
      .every(([key, value]) => key === "hasPreview" ? typeof value === "boolean" : typeof value === "string"));
  diagnostic.stage = "version_report_fingerprints";
  return { report: {
    fieldTypes, unsupportedFields: [...unsupported].sort(), schemaCompatible,
    bindings: { legacy: oldBindings.report, beta: newBindings.report },
    bindingsConsistent: oldBindings.report.valid && newBindings.report.valid && hash(oldBindings.normalized) === hash(newBindings.normalized),
    envConsistent, runtimeConsistent,
    modules: { count: Array.isArray(modules) ? modules.length : null, valid: modulesValid,
      inventoryFingerprint: modulesValid ? hash({ main: hash(beta.main_module), modules: moduleHashes.sort((a, b) => a.nameHash.localeCompare(b.nameHash)) }) : null },
    assets: { jwtPresent, jwtFingerprint: jwtPresent ? hash(jwt) : null, configFingerprint: object(beta?.assets?.config) ? hash(beta.assets.config) : null },
    etag: { present: typeof etag === "string" && etag.length > 0, fingerprint: typeof etag === "string" && etag.length > 0 ? hash(etag) : null },
  }, legacy, beta };
}

export async function runCleanupMetadataPreflight({ env = process.env, fetchImpl = fetch, now = Date.now(),
  reconcileOnly = false, expectedAnnotations } = {}) {
  const diagnostics = { stage: "context_validation", cloudflareGetRequests: 0, completedVersionRounds: 0, versionReads: [] };
  try {
  check(env?.GITHUB_REPOSITORY === "gvanesch/fractional-hr-site" && env.GITHUB_REF === "refs/heads/chore/supabase-retirement-2026-11" &&
    env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT && typeof env.CLOUDFLARE_API_TOKEN === "string" && env.CLOUDFLARE_API_TOKEN.trim() &&
    !env.CLOUDFLARE_ENV && !env.NEXT_DEV_WRANGLER_ENV && typeof fetchImpl === "function", "fixed_context_unverified");
  const token = env.CLOUDFLARE_API_TOKEN.trim();
  async function get(path) {
    check(/^\/workers\/scripts\/fractional-hr-site\/(settings|secrets|deployments|versions(?:\/[a-f0-9-]{36})?)$/.test(path) ||
      /^\/workers\/workers\/fractional-hr-site\/versions\/[a-f0-9-]{36}\?include=modules,sourcemaps$/.test(path), "metadata_endpoint_forbidden");
    let response;
    diagnostics.cloudflareGetRequests++;
    try { response = await fetchImpl(API + path, { method: "GET", redirect: "error", cache: "no-store",
      signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Cache-Control": "no-cache" } }); }
    catch (error) { throw new PreflightError("metadata_request_failed", null, error); }
    if (!response.ok) { await response.body?.cancel(); throw new PreflightError("metadata_http_failure", response.status); }
    const body = await readJson(response);
    check(body?.success === true && Object.hasOwn(body, "result"), "metadata_provider_failure");
    return body.result;
  }
  async function lease() {
    const [deployments, versions] = await together([get(`${PREFIX}/deployments`), get(`${PREFIX}/versions`)]);
    const active = deployments?.deployments?.[0];
    check(UUID.test(active?.id ?? "") && active?.versions?.length === 1 && active.versions[0].percentage === 100 &&
      UUID.test(active.versions[0].version_id ?? "") && UUID.test(versions?.items?.[0]?.id ?? ""),
    "active_latest_lease_unverified");
    return { deploymentId: active.id, versionId: active.versions[0].version_id, latestVersionId: versions.items[0].id };
  }
  diagnostics.stage = "initial_active_latest_lease";
  const before = await lease();
  diagnostics.lease = { activeVersionId: before.versionId, latestVersionId: before.latestVersionId,
    activeEqualsLatest: before.versionId === before.latestVersionId, activePercentage: 100 };
  if (reconcileOnly || before.versionId !== before.latestVersionId) {
    diagnostics.stage = "binding_reconciliation_reads";
    const tag = expectedAnnotations?.tag ?? env.RETIREMENT_EXPECTED_TAG;
    const message = expectedAnnotations?.message ?? env.RETIREMENT_EXPECTED_MESSAGE;
    check((tag === undefined || /^retirement-[a-f0-9]{24}$/.test(tag)) &&
      (message === undefined || /^production-retirement-[a-f0-9]{40}$/.test(message)), "annotation_expectation_invalid");
    const activeRead = get(`${PREFIX}/versions/${before.versionId}`);
    const [settings, secrets, active, latest] = await together([get(`${PREFIX}/settings`), get(`${PREFIX}/secrets`), activeRead,
      before.latestVersionId === before.versionId ? activeRead : get(`${PREFIX}/versions/${before.latestVersionId}`)]);
    const fields = value => object(value) ? Object.fromEntries(Object.entries(value).slice(0, 128).map(([name, item]) =>
      [safeName(name), type(item)])) : { value: type(value) };
    diagnostics.reconciliationFieldTypes = { settings: fields(settings), active: fields(active), latest: fields(latest),
      activeRuntime: fields(active?.resources?.script_runtime), latestRuntime: fields(latest?.resources?.script_runtime) };
    check(active?.id === before.versionId && latest?.id === before.latestVersionId, "reconciliation_version_identity_unverified");
    diagnostics.stage = "binding_reconciliation_fingerprints";
    const inventory = (entries, secretNames = []) => {
      try { const normalized = normalizeBindings(entries, secretNames); return { normalized, fingerprint: fingerprint(normalized), valid: true }; }
      catch { return { normalized: null, fingerprint: null, valid: false }; }
    };
    const merged = inventory(settings?.bindings, secrets), raw = inventory(settings?.bindings);
    const deployed = inventory(active?.resources?.bindings), uploaded = inventory(latest?.resources?.bindings);
    const equal = (a, b) => a.valid && b.valid ? a.fingerprint === b.fingerprint : null;
    const changed = (a, b) => {
      if (!a.valid || !b.valid) return null;
      const left = new Map(a.normalized.map(item => [item.name, item])), right = new Map(b.normalized.map(item => [item.name, item]));
      return [...new Set([...left.keys(), ...right.keys()])].filter(name => hash(left.get(name)) !== hash(right.get(name)))
        .map(safeName).sort();
    };
    const runtimeFingerprint = value => object(value?.resources?.script_runtime) ? fingerprint(value.resources.script_runtime) : null;
    const expected = value => ({ tagMatches: tag === undefined ? null : value?.annotations?.["workers/tag"] === tag,
      messageMatches: message === undefined ? null : value?.annotations?.["workers/message"] === message });
    const activeRuntime = runtimeFingerprint(active), latestRuntime = runtimeFingerprint(latest);
    const reconciliation = {
      bindingComparisonsComplete: [merged, raw, deployed, uploaded].every(item => item.valid),
      bindingFingerprints: { settings: merged.fingerprint, settingsWithoutSecretInventory: raw.fingerprint,
        active: deployed.fingerprint, latest: uploaded.fingerprint },
      equalities: { settingsMatchesActive: equal(merged, deployed), settingsMatchesLatest: equal(merged, uploaded),
        activeMatchesLatest: equal(deployed, uploaded), rawSettingsMatchActive: equal(raw, deployed), rawSettingsMatchLatest: equal(raw, uploaded) },
      changedBindingNames: { settingsVsActive: changed(merged, deployed), settingsVsLatest: changed(merged, uploaded), activeVsLatest: changed(deployed, uploaded) },
      nonBindingSettingsFingerprint: object(settings) ? fingerprint(Object.fromEntries(Object.entries(settings)
        .filter(([name]) => !["bindings", "assets", "annotations"].includes(name)))) : null,
      settingsAssetsFingerprint: settings?.assets === undefined ? null : fingerprint(settings.assets),
      runtimeFingerprints: { active: activeRuntime, latest: latestRuntime },
      runtimesEqual: activeRuntime !== null && latestRuntime !== null ? activeRuntime === latestRuntime : null,
      annotations: { expectedTagProvided: tag !== undefined, expectedMessageProvided: message !== undefined,
        settings: expected(settings), active: expected(active), latest: expected(latest) },
    };
    diagnostics.stage = "binding_reconciliation_final_lease";
    const after = await lease();
    check(hash(before) === hash(after), "active_latest_lease_changed");
    return { kind: "production-worker-binding-reconciliation", observedAt: new Date(now).toISOString(), ...SCOPE,
      metadataReadCompleted: true, metadataReady: false, reconciliationCompleted: true,
      worker: PRODUCTION.worker, activeVersionId: before.versionId, latestVersionId: before.latestVersionId,
      activeEqualsLatest: before.versionId === before.latestVersionId, activePercentage: 100, leaseStable: true,
      cloudflareGetRequests: diagnostics.cloudflareGetRequests, ...reconciliation,
      fieldTypes: diagnostics.reconciliationFieldTypes,
      note: "Read-only comparison of settings, deployed version and latest upload. This does not establish activation or cleanup readiness.",
    };
  }
  async function readVersion(round) {
    diagnostics.stage = `version_round_${round}_requests`;
    const [legacy, beta] = await together([get(`${PREFIX}/versions/${before.versionId}`),
      get(`/workers/workers/${PRODUCTION.worker}/versions/${before.versionId}?include=modules,sourcemaps`)]);
    const observation = { round, stage: "version_identity", fieldTypes: Object.fromEntries([["legacy", legacy], ["beta", beta]].map(([path, value]) =>
      [path, object(value) ? Object.fromEntries(Object.entries(value).slice(0, 128).map(([name, item]) => [safeName(name), [type(item)]])) : { value: [type(value)] }])) };
    diagnostics.versionReads.push(observation);
    diagnostics.stage = `version_round_${round}_identity`;
    observation.identity = { legacyMatches: legacy?.id === before.versionId, betaMatches: beta?.id === before.versionId,
      sequenceValid: Number.isInteger(beta?.number) && beta.number > 0, sequencesAgree: legacy?.number === beta?.number };
    check(Object.values(observation.identity).every(Boolean), "version_identity_unverified");
    diagnostics.stage = `version_round_${round}_description`;
    const described = describeVersion(legacy, beta, observation);
    observation.stage = "version_description_completed";
    diagnostics.completedVersionRounds++;
    return described;
  }
  const first = await readVersion(1);
  const second = await readVersion(2); // Deliberate fresh read; never a retry.
  diagnostics.stage = "final_active_latest_lease";
  const after = await lease();
  check(hash(before) === hash(after), "active_latest_lease_changed");
  diagnostics.stage = "repeat_read_fingerprints";
  const a = first.report, b = second.report;
  const stability = {
    assetsJwtEqual: a.assets.jwtPresent && b.assets.jwtPresent && a.assets.jwtFingerprint === b.assets.jwtFingerprint,
    assetsConfigEqual: a.assets.configFingerprint === b.assets.configFingerprint,
    modulesEqual: a.modules.valid && b.modules.valid && a.modules.inventoryFingerprint === b.modules.inventoryFingerprint,
    etagEqual: a.etag.present && b.etag.present && a.etag.fingerprint === b.etag.fingerprint,
    legacyEqual: hash(first.legacy) === hash(second.legacy), betaEqual: hash(first.beta) === hash(second.beta),
  };
  const unsupportedFields = [...new Set([...a.unsupportedFields, ...b.unsupportedFields])].sort();
  const supported = report => report.bindingsConsistent && report.envConsistent && report.runtimeConsistent &&
    report.schemaCompatible && report.modules.valid && report.assets.jwtPresent && report.etag.present;
  diagnostics.stage = "completed";
  return { kind: "production-cleanup-metadata-preflight", observedAt: new Date(now).toISOString(), ...SCOPE,
    metadataReadCompleted: true, metadataReady: unsupportedFields.length === 0 && supported(a) && supported(b) && Object.values(stability).every(Boolean),
    worker: PRODUCTION.worker, activeVersionId: before.versionId, versionNumber: first.beta.number,
    latestVersionId: before.latestVersionId, activeEqualsLatest: true, leaseStable: true, versionReadRounds: 2, cloudflareGetRequests: diagnostics.cloudflareGetRequests,
    first: a, second: b, stability, unsupportedFields,
    note: "Metadata readiness only. Asset JWT equality is repeat-read evidence for an upload completion token, not a documented content digest or application acceptance.",
  };
  } catch (error) {
    const failure = error instanceof PreflightError ? error : new PreflightError("unexpected_metadata_failure", null, error);
    // Only locally generated labels, counts, field names/types and unsupported
    // paths are attached. Never attach the provider payload, message or stack.
    failure.diagnostics = { ...diagnostics, versionReads: diagnostics.versionReads.map(read => ({ ...read,
      unsupportedFields: [...(read.unsupportedFields ?? [])].sort() })) };
    throw failure;
  }
}

export function runProductionBindingReconciliation(options = {}) {
  return runCleanupMetadataPreflight({ ...options, reconcileOnly: true });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    check(process.argv.slice(2).every(arg => arg === "--reconcile-bindings"), "unsupported_cli_argument");
    const report = await runCleanupMetadataPreflight({ reconcileOnly: process.argv.includes("--reconcile-bindings") });
    console.log(JSON.stringify(report, null, 2));
    if (!report.metadataReady) process.exitCode = 1;
  } catch (error) {
    console.log(JSON.stringify(cleanupPreflightFailure(error), null, 2));
    process.exitCode = 1;
  }
}

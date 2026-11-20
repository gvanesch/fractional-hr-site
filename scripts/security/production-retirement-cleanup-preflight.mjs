// GET-only provider-shape probe. This does not accept the application, remove
// bindings, read client records, query D1, send mail, or change any cloud state.
// The two complete version reads exercise the exact metadata required by the
// inert production-retirement-binding-cleanup.mjs verifier before it is wired.
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { ACCOUNT, PRODUCTION, fingerprint, normalizeBindings } from "./qa-retirement-release.mjs";

const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;
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

class PreflightError extends Error {
  constructor(code, httpStatus = null) { super(code); this.code = code; this.httpStatus = Number.isInteger(httpStatus) ? httpStatus : null; }
}
const check = (condition, code) => { if (!condition) throw new PreflightError(code); };
const SCOPE = Object.freeze({ metadataOnly: true, acceptanceVerified: false, mutationAttempted: false,
  clientRecordsRead: false, databaseRequests: false, emailsSent: false, secretValuesPrinted: false,
  bindingValuesPrinted: false, moduleContentsPrinted: false, assetTokensPrinted: false });

export function cleanupPreflightFailure(error) {
  return { kind: "production-cleanup-metadata-preflight", metadataReadCompleted: false, metadataReady: false,
    ...SCOPE, failure: error instanceof PreflightError ? { code: error.code, httpStatus: error.httpStatus } :
      { code: "unexpected_metadata_failure", httpStatus: null } };
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
    throw error instanceof PreflightError ? error : new PreflightError("metadata_body_unreadable");
  }
}

async function together(tasks) {
  const results = await Promise.allSettled(tasks);
  const failed = results.find(result => result.status === "rejected");
  if (failed) throw failed.reason;
  return results.map(result => result.value);
}

function describeVersion(legacy, beta) {
  const fieldTypes = Object.create(null), unsupported = new Set();
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
  const oldBindings = bindingInventory(legacy?.resources?.bindings, "legacy.bindings");
  const newBindings = bindingInventory(beta?.bindings, "beta.bindings");
  let envConsistent = beta?.env === undefined;
  if (object(beta?.env) && Object.keys(beta.env).length <= 1000) {
    const entries = Object.entries(beta.env).map(([name, item]) => ({ ...item, name }));
    const env = bindingInventory(entries, "beta.env");
    envConsistent = env.report.valid && newBindings.report.valid && hash(env.normalized) === hash(newBindings.normalized) &&
      Object.values(beta.env).every(item => object(item) && !Object.hasOwn(item, "name"));
  }
  const modules = beta?.modules, seen = new Set(), moduleHashes = [];
  let modulesValid = Array.isArray(modules) && modules.length > 0 && modules.length <= 2048;
  for (const item of modulesValid ? modules : []) {
    shape(item, ["name", "content_type", "content_base64"], "beta.modules[]");
    const valid = typeof item?.name === "string" && item.name.length > 0 && !seen.has(item.name) &&
      typeof item.content_type === "string" && item.content_type.length > 0 && typeof item.content_base64 === "string" &&
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(item.content_base64);
    modulesValid &&= valid;
    if (valid) { seen.add(item.name); moduleHashes.push({ nameHash: hash(item.name), typeHash: hash(item.content_type),
      contentHash: bytesHash(Buffer.from(item.content_base64, "base64")) }); }
  }
  modulesValid &&= typeof beta?.main_module === "string" && seen.has(beta.main_module);
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

export async function runCleanupMetadataPreflight({ env = process.env, fetchImpl = fetch, now = Date.now() } = {}) {
  check(env?.GITHUB_REPOSITORY === "gvanesch/fractional-hr-site" && env.GITHUB_REF === "refs/heads/chore/supabase-retirement-2026-11" &&
    env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT && typeof env.CLOUDFLARE_API_TOKEN === "string" && env.CLOUDFLARE_API_TOKEN.trim() &&
    !env.CLOUDFLARE_ENV && !env.NEXT_DEV_WRANGLER_ENV && typeof fetchImpl === "function", "fixed_context_unverified");
  const token = env.CLOUDFLARE_API_TOKEN.trim();
  async function get(path) {
    check(/^\/workers\/scripts\/fractional-hr-site\/(deployments|versions(?:\/[a-f0-9-]{36})?)$/.test(path) ||
      /^\/workers\/workers\/fractional-hr-site\/versions\/[a-f0-9-]{36}\?include=modules,sourcemaps$/.test(path), "metadata_endpoint_forbidden");
    let response;
    try { response = await fetchImpl(API + path, { method: "GET", redirect: "error", cache: "no-store",
      signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Cache-Control": "no-cache" } }); }
    catch { throw new PreflightError("metadata_request_failed"); }
    if (!response.ok) { await response.body?.cancel(); throw new PreflightError("metadata_http_failure", response.status); }
    const body = await readJson(response);
    check(body?.success === true && Object.hasOwn(body, "result"), "metadata_provider_failure");
    return body.result;
  }
  async function lease() {
    const [deployments, versions] = await together([get(`${PREFIX}/deployments`), get(`${PREFIX}/versions`)]);
    const active = deployments?.deployments?.[0];
    check(UUID.test(active?.id ?? "") && active?.versions?.length === 1 && active.versions[0].percentage === 100 &&
      UUID.test(active.versions[0].version_id ?? "") && versions?.items?.[0]?.id === active.versions[0].version_id,
    "active_latest_lease_unverified");
    return { deploymentId: active.id, versionId: active.versions[0].version_id };
  }
  const before = await lease();
  async function readVersion() {
    const [legacy, beta] = await together([get(`${PREFIX}/versions/${before.versionId}`),
      get(`/workers/workers/${PRODUCTION.worker}/versions/${before.versionId}?include=modules,sourcemaps`)]);
    check(legacy?.id === before.versionId && beta?.id === before.versionId && Number.isInteger(beta.number) && beta.number > 0 &&
      legacy.number === beta.number, "version_identity_unverified");
    return describeVersion(legacy, beta);
  }
  const first = await readVersion();
  const second = await readVersion(); // Deliberate fresh read; never a retry.
  const after = await lease();
  check(hash(before) === hash(after), "active_latest_lease_changed");
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
  return { kind: "production-cleanup-metadata-preflight", observedAt: new Date(now).toISOString(), ...SCOPE,
    metadataReadCompleted: true, metadataReady: unsupportedFields.length === 0 && supported(a) && supported(b) && Object.values(stability).every(Boolean),
    worker: PRODUCTION.worker, activeVersionId: before.versionId, versionNumber: first.beta.number,
    activeEqualsLatest: true, leaseStable: true, versionReadRounds: 2, cloudflareGetRequests: 8,
    first: a, second: b, stability, unsupportedFields,
    note: "Metadata readiness only. Asset JWT equality is repeat-read evidence for an upload completion token, not a documented content digest or application acceptance.",
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = await runCleanupMetadataPreflight();
    console.log(JSON.stringify(report, null, 2));
    if (!report.metadataReady) process.exitCode = 1;
  } catch (error) {
    console.log(JSON.stringify(cleanupPreflightFailure(error), null, 2));
    process.exitCode = 1;
  }
}

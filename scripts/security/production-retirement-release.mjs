// Production code/auth cutover only. Access policy creation is a separate,
// reviewed operation. This module never migrates D1, sends mail, changes routes,
// rotates secrets, modifies QA, or pauses Supabase. There is deliberately no CLI
// or workflow trigger: the caller must supply a freshly verified Access reader.
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { ACCOUNT, QA, PRODUCTION, fingerprint, normalizeBindings } from "./qa-retirement-release.mjs";
import { MODES, PUBLIC_POST_ONLY_PATHS } from "./supabase-retirement-readonly.mjs";

export const REQUEST_PATH = "scripts/security/production-retirement-release-request.json";
export const CONFIG_PATH = "wrangler.production-retirement.generated.json";
const REF = "refs/heads/chore/supabase-retirement-2026-11";
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;
const TEAM = "https://gregvanesch.cloudflareaccess.com";
const HOSTS = ["vanesch.uk", "www.vanesch.uk"];
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const SHA = /^[a-f0-9]{40}$/;
const HASH = /^[a-f0-9]{64}$/i;
const REQUIRED = ["ADVISOR_ALLOWED_EMAILS", "CLIENT_DIAGNOSTIC_OTP_SECRET", "INVITE_RATE_LIMIT_SALT", "CRON_SECRET", "RESEND_API_KEY", "CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL", "DAILY_SUMMARY_RECIPIENT"];
const AUTH_NAMES = ["ADVISOR_AUTH_MODE", "CLOUDFLARE_ACCESS_AUD", "CLOUDFLARE_ACCESS_TEAM_DOMAIN"];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateProductionRequest(request, env, git, now = Date.now()) {
  check(env.GITHUB_REPOSITORY === "gvanesch/fractional-hr-site" && env.GITHUB_REF === REF &&
    env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT && Boolean(env.CLOUDFLARE_API_TOKEN?.trim()), "Production release context is not verified.");
  const age = now - Date.parse(request?.requestedAt);
  check(request?.operation === "deploy-reviewed-retirement-candidate-to-production" &&
    /^[a-z0-9][a-z0-9-]{7,63}$/.test(request.requestId ?? "") && SHA.test(request.reviewedCommit ?? "") &&
    UUID.test(request.expectedProductionVersionId ?? "") && UUID.test(request.expectedQaVersionId ?? "") &&
    HASH.test(request.expectedAccessPlanFingerprint ?? "") && Number.isFinite(age) && age >= 0 && age <= 24 * 60 * 60 * 1000,
  "A current exact production release request and Access plan are required.");
  check(SHA.test(git?.head ?? "") && git.head === env.GITHUB_SHA && git.parent === request.reviewedCommit &&
    git.changedPaths?.length === 1 && git.changedPaths[0] === REQUEST_PATH,
  "The production request must be the only change on top of the reviewed candidate.");
  check(env.NEXT_PUBLIC_APP_ENV === "production" && HOSTS.some(host => env.NEXT_PUBLIC_SITE_URL === `https://${host}`) &&
    env.ADVISOR_AUTH_MODE === "cloudflare_access" && MODES.every(name => env[name] === "d1") &&
    !env.CLOUDFLARE_ENV && !env.NEXT_DEV_WRANGLER_ENV,
  "Production build/runtime environment differs from the reviewed D1/Access target.");
  check(!Object.entries(env).some(([name, value]) => /SUPABASE/i.test(name) && Boolean(value)),
    "Production must build and release without Supabase environment values.");
}

// inspectAccess is owned by the Access-plan module. It must perform new reads,
// verify exact application destinations and identity policy against the plan,
// and return this small proof. It is called again around upload/activation.
export function validateVerifiedAccess(value, request) {
  check(value?.kind === "verified-production-advisor-access" && value.accountId === ACCOUNT &&
    UUID.test(value.applicationId ?? "") && HASH.test(value.audience ?? "") && value.teamDomain === TEAM &&
    value.planFingerprint === request.expectedAccessPlanFingerprint && HASH.test(value.applicationFingerprint ?? "") &&
    value.protectedRoutesVerified === true && value.publicBoundariesVerified === true &&
    value.identityPolicyVerified === true && value.cookiePathAttribute === false,
  "The production Access application and identity policy are not verified against the reviewed plan.");
  return Object.fromEntries(["kind", "accountId", "applicationId", "audience", "teamDomain", "planFingerprint", "applicationFingerprint",
    "protectedRoutesVerified", "publicBoundariesVerified", "identityPolicyVerified", "cookiePathAttribute"].map(key => [key, value[key]]));
}

async function readAccess(inspectAccess, request) {
  check(typeof inspectAccess === "function", "A fresh production Access verification callback is required.");
  let result;
  try { result = await inspectAccess(); }
  catch { throw new Error("Production Access verification failed; inspect the separately sanitized Access evidence."); }
  return validateVerifiedAccess(result, request);
}

function client(env, fetchImpl) {
  async function api(path, options = {}) {
    const method = options.method ?? "GET";
    const reads = new RegExp(`^/workers/scripts/(?:${PRODUCTION.worker}|${QA.worker})/(?:settings|secrets|schedules|subdomain|deployments|versions(?:/[a-f0-9-]{36})?)$`);
    check(method === "GET" && (reads.test(path) || path === `/d1/database/${PRODUCTION.database}`) ||
      method === "POST" && path === `/workers/scripts/${PRODUCTION.worker}/deployments`,
    "This release forbids that Cloudflare endpoint or mutation.");
    let response;
    try { response = await fetchImpl(API + path, { ...options, method, redirect: "error", signal: AbortSignal.timeout(30000),
      headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN.trim()}`, "Content-Type": "application/json" } }); }
    catch { throw new Error("Production release request failed or timed out; no automatic mutation retry."); }
    check(response.ok, `Production release request returned HTTP ${response.status}.`);
    let body;
    try { body = await response.json(); } catch { throw new Error("Production release response was not valid JSON."); }
    check(body && typeof body === "object" && !Array.isArray(body) && body.success === true,
      "Cloudflare did not confirm the production release request.");
    return body.result;
  }
  return api;
}

function nonBindingSettings(settings) {
  return Object.fromEntries(Object.entries(settings).filter(([key]) => !["bindings", "assets", "annotations"].includes(key)));
}

async function inspectWorker(api, worker, expectedVersion, { latestMayDiffer = false } = {}) {
  const prefix = `/workers/scripts/${worker}`;
  const [settings, secrets, deployments, schedules, subdomain, versions] = await Promise.all([
    api(`${prefix}/settings`), api(`${prefix}/secrets`), api(`${prefix}/deployments`),
    api(`${prefix}/schedules`), api(`${prefix}/subdomain`), api(`${prefix}/versions`),
  ]);
  const deployment = deployments?.deployments?.[0];
  check(UUID.test(deployment?.id ?? "") && deployment.versions?.length === 1 &&
    deployment.versions[0].version_id === expectedVersion && deployment.versions[0].percentage === 100,
  "The current Worker deployment differs from the production release lease.");
  check(Array.isArray(versions?.items) && UUID.test(versions.items[0]?.id ?? "") &&
    (latestMayDiffer || versions.items[0].id === expectedVersion),
  "An unknown or undeployed Worker version prevents safe binding inheritance.");
  check(Array.isArray(schedules?.schedules) && typeof subdomain?.enabled === "boolean",
    "Worker schedule/routing metadata is unavailable.");
  const bindings = normalizeBindings(settings?.bindings, secrets);
  const active = await api(`${prefix}/versions/${expectedVersion}`);
  check(active?.id === expectedVersion && active.resources?.script_runtime &&
    fingerprint(normalizeBindings(active.resources.bindings)) === fingerprint(bindings),
  "Active Worker version and settings do not agree.");
  return { worker, versionId: expectedVersion, deploymentId: deployment.id, latestVersionId: versions.items[0].id,
    bindings, settings, runtime: active.resources.script_runtime,
    bindingFingerprint: fingerprint(bindings), settingsFingerprint: fingerprint(nonBindingSettings(settings)),
    routingFingerprint: fingerprint({ schedules, subdomain }) };
}

function snapshot(value) {
  return Object.fromEntries(["worker", "versionId", "deploymentId", "latestVersionId", "bindingFingerprint", "settingsFingerprint", "routingFingerprint"].map(key => [key, value[key]]));
}

function compareLease(actual, expected, { candidateVersion, activated = false, expectedBindings = expected.bindingFingerprint } = {}) {
  for (const name of ["worker", "settingsFingerprint", "routingFingerprint"])
    check(actual[name] === expected[name], "Worker settings, grouping, routes or schedules changed during the production release.");
  check(actual.bindingFingerprint === expectedBindings, "Worker bindings changed outside the reviewed production auth change.");
  check(actual.latestVersionId === (candidateVersion ?? expected.latestVersionId), "The latest uploaded Worker version changed during the production release.");
  check(activated ? actual.versionId === candidateVersion : actual.versionId === expected.versionId && actual.deploymentId === expected.deploymentId,
    "The active Worker deployment changed during the production release.");
}

function validateProductionBindings(bindings) {
  const map = new Map(bindings.map(binding => [binding.name, binding]));
  check(map.get("DB")?.type === "d1" && map.get("DB").id === PRODUCTION.database && bindings.filter(b => b.type === "d1").length === 1 &&
    map.get("WORKER_SELF_REFERENCE")?.type === "service" && map.get("WORKER_SELF_REFERENCE").service === PRODUCTION.worker &&
    map.get("WORKER_SELF_REFERENCE").environment === "production" && map.get("WORKER_SELF_REFERENCE").entrypoint === null &&
    bindings.filter(b => b.type === "service").length === 1 && map.get("ASSETS")?.type === "assets" && bindings.filter(b => b.type === "assets").length === 1,
  "Production resource bindings do not match the existing D1 Worker.");
  for (const name of MODES) check(map.get(name)?.type === "plain_text" && map.get(name).text === "d1", "All production data modes must remain D1.");
  for (const name of REQUIRED) check(map.get(name)?.type === "secret_text" || map.get(name)?.type === "plain_text" && map.get(name).text.trim(),
    `Required production binding is missing: ${name}.`);
  check(map.get("NEXT_PUBLIC_APP_ENV")?.text === "production" && HOSTS.some(host => map.get("NEXT_PUBLIC_SITE_URL")?.text === `https://${host}`),
    "The existing Worker does not identify the production website.");
}

function validateQaIsolation(qa, repositoryConfig) {
  const map = new Map(qa.bindings.map(binding => [binding.name, binding]));
  check(map.get("DB")?.type === "d1" && map.get("DB").id === QA.database && qa.bindings.filter(b => b.type === "d1").length === 1 &&
    map.get("WORKER_SELF_REFERENCE")?.type === "service" && map.get("WORKER_SELF_REFERENCE").service === QA.worker &&
    map.get("WORKER_SELF_REFERENCE").environment === "production" && map.get("WORKER_SELF_REFERENCE").entrypoint === null &&
    qa.bindings.filter(b => b.type === "service").length === 1 && map.get("ASSETS")?.type === "assets" &&
    map.get("NEXT_PUBLIC_APP_ENV")?.text === "qa" && map.get("NEXT_PUBLIC_SITE_URL")?.text === QA.site &&
    MODES.every(name => map.get(name)?.type === "plain_text" && map.get(name).text === "d1") &&
    map.get("ADVISOR_AUTH_MODE")?.text === "cloudflare_access" &&
    ["CLOUDFLARE_ACCESS_AUD", "CLOUDFLARE_ACCESS_TEAM_DOMAIN"].every(name => map.get(name)?.type === "secret_text" || map.get(name)?.type === "plain_text" && map.get(name).text.trim()),
  "The QA Worker is not the expected isolated D1/Access environment.");
  check(qa.runtime.compatibility_date === repositoryConfig.compatibility_date &&
    fingerprint([...(qa.runtime.compatibility_flags ?? [])].sort()) === fingerprint([...(repositoryConfig.compatibility_flags ?? [])].sort()),
  "QA runtime compatibility differs from the reviewed candidate.");
  const tags = qa.settings.tags ?? [];
  check(Array.isArray(tags) && tags.every(tag => typeof tag === "string") && fingerprint(tags) === fingerprint([
    ...tags.filter(tag => !tag.startsWith("cf:service=") && !tag.startsWith("cf:environment=")),
    `cf:service=${PRODUCTION.worker}`, "cf:environment=qa",
  ]), "QA grouping differs from the reviewed environment.");
}

function expectedAuthBindings(bindings, access) {
  validateProductionBindings(bindings);
  const map = new Map(bindings.map(binding => [binding.name, binding]));
  check(!map.has("CLOUDFLARE_ACCESS_AUD") && !map.has("CLOUDFLARE_ACCESS_TEAM_DOMAIN") &&
    (!map.has("ADVISOR_AUTH_MODE") || map.get("ADVISOR_AUTH_MODE").type === "plain_text" && map.get("ADVISOR_AUTH_MODE").text === "supabase"),
  "Unexpected prior Access bindings or advisor auth mode require review before cutover.");
  const vars = { ADVISOR_AUTH_MODE: "cloudflare_access", CLOUDFLARE_ACCESS_AUD: access.audience, CLOUDFLARE_ACCESS_TEAM_DOMAIN: access.teamDomain };
  for (const [name, text] of Object.entries(vars)) map.set(name, { name, type: "plain_text", text });
  return { vars, bindings: normalizeBindings([...map.values()]) };
}

function supportedVersionedConfiguration(production) {
  const plainObject = value => value && typeof value === "object" && !Array.isArray(value);
  const empty = value => value == null || plainObject(value) && Object.keys(value).length === 0;
  const { placement, tail_consumers: tails, cache, cache_options: cacheOptions } = production.settings;
  // These versioned options are not all returned in script_runtime. Do not
  // silently reset an existing nondefault feature during an auth-only cutover.
  check(empty(placement) || plainObject(placement) && Object.keys(placement).every(key => key === "mode") && placement.mode === "off",
    "Nondefault or unrecognized production placement requires explicit preservation before upload.");
  check(tails == null || Array.isArray(tails) && tails.length === 0,
    "Existing production tail-consumer configuration requires review before upload.");
  for (const value of [cache, cacheOptions]) check(empty(value) || plainObject(value) &&
    Object.keys(value).every(key => ["enabled", "cross_version_cache"].includes(key)) &&
    value.enabled === false && (value.cross_version_cache == null || value.cross_version_cache === false),
  "Nondefault or unrecognized production cache settings require explicit preservation before upload.");
  const limits = production.runtime.limits ?? production.settings.limits;
  check(limits == null || plainObject(limits) && Object.entries(limits).every(([key, value]) =>
    ["cpu_ms", "subrequests"].includes(key) && Number.isInteger(value) && value > 0),
  "Production runtime limits cannot be preserved by this uploader.");
  if (production.runtime.limits != null && production.settings.limits != null)
    check(plainObject(production.settings.limits) && Object.entries(production.settings.limits).every(([key, value]) => production.runtime.limits[key] === value),
      "Production runtime and settings limits disagree.");
  return {
    ...(placement?.mode === "off" ? { placement: { mode: "off" } } : {}),
    ...(!empty(cache ?? cacheOptions) ? { cache: { ...(cache ?? cacheOptions) } } : {}),
    ...(limits != null && Object.keys(limits).length ? { limits: { ...limits } } : {}),
  };
}

export function createProductionConfig(repositoryConfig, production, access) {
  check(repositoryConfig?.name === PRODUCTION.worker && repositoryConfig.main === ".open-next/worker.js" && repositoryConfig.keep_vars === true &&
    !repositoryConfig.route && !repositoryConfig.routes && !repositoryConfig.custom_domains && !repositoryConfig.triggers && !repositoryConfig.migrations &&
    repositoryConfig.d1_databases?.length === 1 && repositoryConfig.d1_databases[0].binding === "DB" && repositoryConfig.d1_databases[0].database_id === PRODUCTION.database &&
    repositoryConfig.services?.length === 1 && repositoryConfig.services[0].binding === "WORKER_SELF_REFERENCE" && repositoryConfig.services[0].service === PRODUCTION.worker &&
    repositoryConfig.assets?.binding === "ASSETS" && repositoryConfig.assets.directory === ".open-next/assets" &&
    MODES.every(name => repositoryConfig.vars?.[name] === "d1") &&
    Object.keys(repositoryConfig.vars ?? {}).every(name => MODES.includes(name)),
  "Repository production configuration differs from the reviewed code-only D1 target.");
  check(repositoryConfig.compatibility_date === production.runtime.compatibility_date &&
    fingerprint([...(repositoryConfig.compatibility_flags ?? [])].sort()) === fingerprint([...(production.runtime.compatibility_flags ?? [])].sort()),
  "Production runtime compatibility changed and requires review.");
  const { vars, bindings } = expectedAuthBindings(production.bindings, access);
  const versioned = supportedVersionedConfiguration(production);
  const tags = production.settings.tags ?? [];
  check(Array.isArray(tags) && tags.every(tag => typeof tag === "string"), "Production grouping metadata is unavailable.");
  const nongrouping = tags.filter(tag => !tag.startsWith("cf:service=") && !tag.startsWith("cf:environment="));
  const grouped = tags.includes(`cf:service=${PRODUCTION.worker}`);
  check(fingerprint(tags) === fingerprint([...nongrouping, ...(grouped ? [`cf:service=${PRODUCTION.worker}`] : [])]),
    "Production grouping tags would be changed by the uploader.");
  const config = {
    $schema: "node_modules/wrangler/config-schema.json", name: PRODUCTION.worker, main: repositoryConfig.main,
    account_id: ACCOUNT, keep_vars: true, compatibility_date: production.runtime.compatibility_date,
    compatibility_flags: production.runtime.compatibility_flags,
    ...versioned,
    vars: { ...Object.fromEntries(MODES.map(name => [name, "d1"])), ...vars },
    assets: { directory: ".open-next/assets", binding: "ASSETS" },
    services: [{ binding: "WORKER_SELF_REFERENCE", service: PRODUCTION.worker }],
    d1_databases: [{ binding: "DB", database_name: "vanesch-prod", database_id: PRODUCTION.database }],
  };
  // Wrangler keeps a root cf:service tag only when a named environment exists.
  // This isolated inert QA entry preserves grouping; upload never selects it.
  if (grouped) config.env = { qa: { name: QA.worker, vars: {},
    assets: { directory: ".open-next/assets", binding: "ASSETS" },
    services: [{ binding: "WORKER_SELF_REFERENCE", service: QA.worker }],
    d1_databases: [{ binding: "DB", database_name: "vanesch-qa", database_id: QA.database }] } };
  return { config, expectedBindingFingerprint: fingerprint(bindings) };
}

async function publicGet(fetchImpl, host, path, { advisor = false } = {}) {
  let url = new URL(`https://${host}${path}`);
  for (let hop = 0; hop < 5; hop++) {
    let response;
    try { response = await fetchImpl(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(30000) }); }
    catch { throw new Error("Production public verification request failed."); }
    if (![301, 302, 303, 307, 308].includes(response.status)) return { response, accessRedirect: false };
    let next;
    try { next = new URL(response.headers.get("location") ?? "", url); } catch { /* reject below */ }
    await response.body?.cancel();
    if (advisor && next?.origin === TEAM && next.pathname.startsWith("/cdn-cgi/access/login")) return { accessRedirect: true };
    check(next?.protocol === "https:" && HOSTS.includes(next.hostname) && !next.pathname.startsWith("/cdn-cgi/access/"),
      "A production public endpoint redirected outside the expected website.");
    url = next;
  }
  throw new Error("Production public verification exceeded its redirect limit.");
}

async function verifyPublicProduction(fetchImpl, { requireIndependent = false } = {}) {
  for (const host of HOSTS) {
    const healthResponse = (await publicGet(fetchImpl, host, "/api/health")).response;
    check(healthResponse?.status === 200, "Production health endpoint is unavailable.");
    let health;
    try { health = await healthResponse.json(); } catch { throw new Error("Production health response is invalid."); }
    check(health?.status === "ok" && health.d1 === "connected" && (!requireIndependent || health.supabase === "not_required"),
      "Production health did not confirm the required D1/auth state.");
    for (const path of ["/", "/diagnostic", "/diagnostic-assessment"]) {
      const { response } = await publicGet(fetchImpl, host, path);
      check(response?.status === 200 && /text\/html/i.test(response.headers.get("content-type") ?? ""), "A production public page did not load.");
      const body = await response.text();
      check(!/Application error: a server-side exception|Internal Server Error/.test(body), "A production public page rendered an error.");
    }
    for (const path of PUBLIC_POST_ONLY_PATHS) {
      const { response } = await publicGet(fetchImpl, host, path);
      await response?.body?.cancel();
      check(response?.status === 405, "A public participant, Health Check or cron API has an unexpected GET boundary.");
    }
    const advisor = await publicGet(fetchImpl, host, "/advisor", { advisor: true });
    await advisor.response?.body?.cancel();
    check(advisor.accessRedirect, "Anonymous production advisor access is not protected by the verified Access team.");
  }
}

// This preflight runs before creating an Access app. The synthetic audience is
// used only to validate the shape of an in-memory future config, never written,
// uploaded, activated, or returned. No advisor redirect is required at this stage.
export async function readProductionEligibility({ env, repositoryConfig, expectedProductionVersionId, expectedQaVersionId, fetchImpl = fetch }) {
  check(env?.GITHUB_REPOSITORY === "gvanesch/fractional-hr-site" && env.GITHUB_REF === REF &&
    env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT && Boolean(env.CLOUDFLARE_API_TOKEN?.trim()) &&
    UUID.test(expectedProductionVersionId ?? "") && UUID.test(expectedQaVersionId ?? "") && expectedProductionVersionId !== expectedQaVersionId,
  "Read-only production eligibility context or exact version lease is not verified.");
  const api = client(env, fetchImpl);
  const [production, qa, database] = await Promise.all([
    inspectWorker(api, PRODUCTION.worker, expectedProductionVersionId),
    inspectWorker(api, QA.worker, expectedQaVersionId), api(`/d1/database/${PRODUCTION.database}`),
  ]);
  check((database?.uuid ?? database?.id) === PRODUCTION.database && database?.name === "vanesch-prod", "Production D1 identity is not verified.");
  validateQaIsolation(qa, repositoryConfig);
  const generated = createProductionConfig(repositoryConfig, production, { audience: "0".repeat(64), teamDomain: TEAM });
  return {
    eligibleForReviewedAuthChange: true, productionVersionId: production.versionId, qaVersionId: qa.versionId,
    productionBindingFingerprint: production.bindingFingerprint, productionSettingsFingerprint: production.settingsFingerprint,
    productionRoutingFingerprint: production.routingFingerprint, qaBindingFingerprint: qa.bindingFingerprint,
    qaSettingsFingerprint: qa.settingsFingerprint, qaRoutingFingerprint: qa.routingFingerprint,
    configurationShapeFingerprint: fingerprint(generated.config), productionEnvironmentVerified: true,
    productionD1IdentityVerified: true, productionD1ModesVerified: true, productionExistingSecretsVerifiedByName: true,
    productionRuntimeAndGroupingVerified: true, priorProductionAuthConfigurationVerified: true, qaIsolationVerified: true,
    accessApplicationVerified: false, dataWrites: false, emailSent: false, deploymentsChanged: false,
  };
}

export async function prepareProductionRelease({ request, env, git, repositoryConfig, inspectAccess, fetchImpl = fetch, now = Date.now() }) {
  validateProductionRequest(request, env, git, now);
  const api = client(env, fetchImpl);
  const [production, qa, database, access] = await Promise.all([
    inspectWorker(api, PRODUCTION.worker, request.expectedProductionVersionId),
    inspectWorker(api, QA.worker, request.expectedQaVersionId), api(`/d1/database/${PRODUCTION.database}`), readAccess(inspectAccess, request),
  ]);
  check((database?.uuid ?? database?.id) === PRODUCTION.database && database?.name === "vanesch-prod", "Production D1 identity is not verified.");
  validateQaIsolation(qa, repositoryConfig);
  const generated = createProductionConfig(repositoryConfig, production, access);
  await verifyPublicProduction(fetchImpl);
  return { config: generated.config, checkpoint: {
    requestFingerprint: fingerprint(request), sourceCommit: git.head, configFingerprint: fingerprint(generated.config),
    preparedAt: new Date(now).toISOString(), production: snapshot(production), qa: snapshot(qa),
    expectedBindingFingerprint: generated.expectedBindingFingerprint, accessFingerprint: fingerprint(access),
  } };
}

export async function deployProductionRelease({ request, env, git, config, checkpoint, inspectAccess, fetchImpl = fetch, uploadImpl, onEvidence = async () => {}, now = Date.now() }) {
  validateProductionRequest(request, env, git, now);
  const age = now - Date.parse(checkpoint?.preparedAt);
  check(checkpoint?.requestFingerprint === fingerprint(request) && checkpoint.sourceCommit === git.head &&
    checkpoint.configFingerprint === fingerprint(config) && HASH.test(checkpoint.expectedBindingFingerprint ?? "") &&
    HASH.test(checkpoint.accessFingerprint ?? "") && Number.isFinite(age) && age >= 0 && age <= 60 * 60 * 1000,
  "The prepared production checkpoint is stale or differs from this reviewed request.");
  check(typeof uploadImpl === "function", "The controlled production upload operation is unavailable.");
  const api = client(env, fetchImpl);
  const [before, qaBefore, accessBefore] = await Promise.all([
    inspectWorker(api, PRODUCTION.worker, request.expectedProductionVersionId),
    inspectWorker(api, QA.worker, request.expectedQaVersionId), readAccess(inspectAccess, request),
  ]);
  compareLease(before, checkpoint.production);
  compareLease(qaBefore, checkpoint.qa);
  check(fingerprint(accessBefore) === checkpoint.accessFingerprint, "Production Access changed after preparation.");
  check(fingerprint(expectedAuthBindings(before.bindings, accessBefore).bindings) === checkpoint.expectedBindingFingerprint,
    "Expected auth binding changes do not match the reviewed checkpoint.");
  const tag = `retirement-${fingerprint(request).slice(0, 24)}`;
  const message = `production-retirement-${git.head}`;
  const recovery = { previousProductionVersion: request.expectedProductionVersionId, qaVersion: request.expectedQaVersionId,
    previousVersionUsesSupabaseAuth: true, accessRollbackIsSeparate: true };
  await onEvidence({ stage: "upload_requested_outcome_unknown", ...recovery });
  let uploadedVersion;
  try { uploadedVersion = await uploadImpl({ configPath: CONFIG_PATH, tag, message, expectedConfigFingerprint: checkpoint.configFingerprint }); }
  catch { throw new Error("Production upload failed or timed out; inspect uploaded versions before any retry. No activation was requested by this module."); }
  check(UUID.test(uploadedVersion ?? "") && ![request.expectedProductionVersionId, request.expectedQaVersionId].includes(uploadedVersion),
    "Production upload did not identify one new valid version; activation stopped.");
  await onEvidence({ stage: "uploaded_not_activated", ...recovery, uploadedProductionVersion: uploadedVersion });
  const candidate = await api(`/workers/scripts/${PRODUCTION.worker}/versions/${uploadedVersion}`);
  check(candidate?.id === uploadedVersion && candidate.annotations?.["workers/tag"] === tag && candidate.annotations?.["workers/message"] === message &&
    fingerprint(normalizeBindings(candidate.resources?.bindings)) === checkpoint.expectedBindingFingerprint &&
    fingerprint(candidate.resources?.script_runtime) === fingerprint(before.runtime),
  "Uploaded production version does not match the reviewed code, auth bindings and runtime.");
  const [lease, qaLease, accessLease] = await Promise.all([
    inspectWorker(api, PRODUCTION.worker, request.expectedProductionVersionId, { latestMayDiffer: true }),
    inspectWorker(api, QA.worker, request.expectedQaVersionId), readAccess(inspectAccess, request),
  ]);
  compareLease(lease, checkpoint.production, { candidateVersion: uploadedVersion });
  compareLease(qaLease, checkpoint.qa);
  check(fingerprint(accessLease) === checkpoint.accessFingerprint, "Production Access changed before activation.");
  await onEvidence({ stage: "activation_requested_outcome_unknown", ...recovery, uploadedProductionVersion: uploadedVersion });
  await api(`/workers/scripts/${PRODUCTION.worker}/deployments`, { method: "POST", body: JSON.stringify({
    strategy: "percentage", versions: [{ version_id: uploadedVersion, percentage: 100 }], annotations: { "workers/message": message },
  }) });
  await onEvidence({ stage: "activated_verification_pending", ...recovery, deployedProductionVersion: uploadedVersion });
  const [after, qaAfter, accessAfter] = await Promise.all([
    inspectWorker(api, PRODUCTION.worker, uploadedVersion), inspectWorker(api, QA.worker, request.expectedQaVersionId), readAccess(inspectAccess, request),
  ]);
  compareLease(after, checkpoint.production, { candidateVersion: uploadedVersion, activated: true, expectedBindings: checkpoint.expectedBindingFingerprint });
  compareLease(qaAfter, checkpoint.qa);
  check(fingerprint(accessAfter) === checkpoint.accessFingerprint, "Production Access changed after activation.");
  await verifyPublicProduction(fetchImpl, { requireIndependent: true });
  const report = { stage: "verified", requestId: request.requestId, candidateCommit: git.head, ...recovery,
    deployedProductionVersion: uploadedVersion, onlyAuthBindingsChanged: AUTH_NAMES,
    productionResourcesSecretsSettingsRoutesSchedulesPreserved: true, qaUnchanged: true, healthD1Connected: true,
    healthSupabaseNotRequired: true, publicPagesPassed: true, publicApiBoundariesPassed: true, anonymousAdvisorAccessProtected: true,
    authenticatedAdvisorFlowTested: false, databaseWrites: false, emailsSent: false, secretChanges: false,
    accessPolicyChanges: false, supabaseShutdownPerformed: false };
  await onEvidence(report);
  return report;
}

export function productionUploadArguments({ configPath, tag, message }) {
  check(configPath === CONFIG_PATH && /^retirement-[a-f0-9]{24}$/.test(tag) && /^production-retirement-[a-f0-9]{40}$/.test(message), "Production upload arguments are invalid.");
  return [resolve("node_modules/@opennextjs/cloudflare/dist/cli/index.js"), "upload", "--config", CONFIG_PATH,
    "--name", PRODUCTION.worker, "--tag", tag, "--message", message];
}

export async function uploadProductionCandidate(args) {
  const commandArgs = productionUploadArguments(args);
  check(HASH.test(args.expectedConfigFingerprint ?? "") && !process.env.CLOUDFLARE_ENV && !process.env.NEXT_DEV_WRANGLER_ENV,
    "Production upload configuration fingerprint or process environment is invalid.");
  let configured;
  try { configured = JSON.parse(await readFile(CONFIG_PATH, "utf8")); }
  catch { throw new Error("The generated production upload configuration could not be read."); }
  check(fingerprint(configured) === args.expectedConfigFingerprint, "The generated production upload file differs from the prepared configuration.");
  let output;
  try {
    // Wrangler may internally retry an inactive upload. Traffic activation is
    // separate, issued once above, and never automatically retried here.
    output = await promisify(execFile)(process.execPath, commandArgs, {
      cwd: process.cwd(), env: { ...process.env, WRANGLER_SEND_METRICS: "false", CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false" },
      timeout: 5 * 60 * 1000, maxBuffer: 16 * 1024 * 1024,
    });
  } catch { throw new Error("Production inactive upload failed; raw uploader output is withheld because it may contain binding values."); }
  const ids = [...output.stdout.matchAll(/Worker Version ID:\s*([a-f0-9-]{36})/gi)].map(match => match[1]);
  check(ids.length === 1 && UUID.test(ids[0]), "Production upload returned an ambiguous version identifier.");
  return ids[0];
}

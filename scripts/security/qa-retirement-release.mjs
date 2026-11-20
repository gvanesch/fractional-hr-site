// A code-only QA release. No migrations, record writes, mail, secret changes,
// Access-policy changes, route changes or production writes are performed.
import { readFile, writeFile } from "node:fs/promises";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const ACCOUNT = "73221f18acc676e4992c89fcbf2b2a8f";
export const QA = Object.freeze({ worker: "fractional-hr-site-qa", database: "b25d59da-5f93-4301-9996-7be0c9708789", site: "https://fractional-hr-site-qa.greg-732.workers.dev" });
export const PRODUCTION = Object.freeze({ worker: "fractional-hr-site", database: "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc" });
export const REQUEST_PATH = "scripts/security/qa-retirement-release-request.json";
export const CONFIG_PATH = "wrangler.qa-retirement.generated.json";
const CHECKPOINT_PATH = "qa-retirement-release-checkpoint.json";
const REPORT_PATH = "qa-retirement-release-report.json";
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}`;
const REF = "refs/heads/chore/supabase-retirement-2026-11";
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const SHA = /^[a-f0-9]{40}$/;
const MODES = ["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"].map(name => `D1_${name}_MODE`);
const REQUIRED_SECRETS = ["ADVISOR_ALLOWED_EMAILS", "CLOUDFLARE_ACCESS_AUD", "CLOUDFLARE_ACCESS_TEAM_DOMAIN", "CLIENT_DIAGNOSTIC_OTP_SECRET", "INVITE_RATE_LIMIT_SALT", "CRON_SECRET", "RESEND_API_KEY"];
const EXPECTED_VARS = Object.freeze({
  ...Object.fromEntries(MODES.map(name => [name, "d1"])),
  ADVISOR_AUTH_MODE: "cloudflare_access", NEXT_PUBLIC_APP_ENV: "qa",
  NEXT_PUBLIC_SITE_URL: QA.site, BASELINE_ENABLED: "true", BASELINE_MAIL_MODE: "preview",
  BASELINE_QA_EMAIL_TESTS: "greg-only", CONTACT_FROM_EMAIL: "qa@vanesch.uk",
  CONTACT_TO_EMAIL: "greg@vanesch.uk", DAILY_SUMMARY_RECIPIENT: "greg@vanesch.uk",
});

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}

export function fingerprint(value) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

export function validateRequest(request, env, git, now = Date.now()) {
  requireCondition(env.GITHUB_REPOSITORY === "gvanesch/fractional-hr-site" && env.GITHUB_REF === REF &&
    env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT && Boolean(env.CLOUDFLARE_API_TOKEN?.trim()),
  "QA release execution context is not verified.");
  const age = now - Date.parse(request?.requestedAt);
  requireCondition(request?.operation === "deploy-reviewed-retirement-candidate-to-qa" &&
    /^[a-z0-9][a-z0-9-]{7,63}$/.test(request.requestId ?? "") &&
    UUID.test(request.expectedQaVersionId ?? "") && UUID.test(request.expectedProductionVersionId ?? "") &&
    SHA.test(request.reviewedCommit ?? "") && Number.isFinite(age) && age >= 0 && age <= 24 * 60 * 60 * 1000,
  "A current, exact QA-only release request is required.");
  requireCondition(SHA.test(git?.head ?? "") && git.head === env.GITHUB_SHA &&
    git.parent === request.reviewedCommit && git.changedPaths?.length === 1 && git.changedPaths[0] === REQUEST_PATH,
  "The request must be the only change on top of the reviewed candidate.");
  for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY"])
    requireCondition(!env[name], "This candidate must build and release without Supabase credentials.");
}

// Secret values are never available or serialized. Preserve every secret name;
// compare non-secret binding configuration, normalizing API representation only.
export function normalizeBindings(entries, secrets = []) {
  requireCondition(Array.isArray(entries) && Array.isArray(secrets), "Worker binding inventory is unavailable.");
  const map = new Map();
  for (const item of entries) {
    requireCondition(typeof item?.name === "string" && item.name && !map.has(item.name), "Worker binding names are invalid or duplicated.");
    let binding;
    switch (item.type) {
      case "plain_text":
        requireCondition(typeof item.text === "string", "Plain-text binding metadata is unavailable.");
        binding = { name: item.name, type: item.type, text: item.text };
        break;
      case "json":
        requireCondition(item.json !== undefined, "JSON binding metadata is unavailable.");
        binding = { name: item.name, type: item.type, json: item.json };
        break;
      case "secret_text": case "secret_key": case "assets":
        binding = { name: item.name, type: item.type };
        break;
      case "d1":
        requireCondition(UUID.test(item.id ?? item.database_id ?? ""), "D1 binding metadata is unavailable.");
        binding = { name: item.name, type: item.type, id: item.id ?? item.database_id };
        break;
      case "service":
        requireCondition(typeof item.service === "string" && item.service, "Service binding metadata is unavailable.");
        binding = { name: item.name, type: item.type, service: item.service,
          environment: item.environment ?? "production", entrypoint: item.entrypoint ?? null };
        break;
      default:
        throw new Error("An unhandled Worker resource binding requires review before release.");
    }
    map.set(item.name, binding);
  }
  for (const secret of secrets) {
    requireCondition(typeof secret?.name === "string" && ["secret_text", "secret_key"].includes(secret.type ?? "secret_text"), "Secret-name inventory is unavailable.");
    const existing = map.get(secret.name);
    requireCondition(!existing || existing.type === (secret.type ?? "secret_text"), "Secret-name and binding inventories disagree.");
    map.set(secret.name, { name: secret.name, type: secret.type ?? "secret_text" });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function validateQaBindings(bindings) {
  const map = new Map(bindings.map(binding => [binding.name, binding]));
  requireCondition(map.get("DB")?.type === "d1" && map.get("DB").id === QA.database &&
    bindings.filter(binding => binding.type === "d1").length === 1 &&
    map.get("WORKER_SELF_REFERENCE")?.type === "service" && map.get("WORKER_SELF_REFERENCE").service === QA.worker &&
    map.get("WORKER_SELF_REFERENCE").environment === "production" && map.get("WORKER_SELF_REFERENCE").entrypoint === null &&
    bindings.filter(binding => binding.type === "service").length === 1 &&
    map.get("ASSETS")?.type === "assets" && bindings.filter(binding => binding.type === "assets").length === 1,
  "QA resource bindings are not the isolated existing target.");
  for (const [name, value] of Object.entries(EXPECTED_VARS))
    requireCondition(map.get(name)?.type === "plain_text" && map.get(name).text === value, `QA ${name} differs from the reviewed configuration.`);
  for (const name of REQUIRED_SECRETS)
    requireCondition(["secret_text", "plain_text"].includes(map.get(name)?.type) && (map.get(name).type !== "plain_text" || map.get(name).text.trim()),
      `QA required binding is missing: ${name}.`);
}

function currentDeployment(result, expectedVersion) {
  const deployment = result?.deployments?.[0];
  requireCondition(UUID.test(deployment?.id ?? "") && deployment?.versions?.length === 1 &&
    deployment.versions[0].percentage === 100 && deployment.versions[0].version_id === expectedVersion,
  "The current Worker deployment differs from the release lease.");
  return deployment;
}

function apiClient(env, fetchImpl) {
  async function json(url, options = {}) {
    let response;
    try { response = await fetchImpl(url, { ...options, redirect: "manual", signal: AbortSignal.timeout(30000) }); }
    catch { throw new Error("QA release request failed or timed out; no automatic mutation retry."); }
    requireCondition(response.status === 200, `QA release metadata request returned HTTP ${response.status}.`);
    try { return await response.json(); }
    catch { throw new Error("QA release metadata response was invalid."); }
  }
  async function api(path, options = {}) {
    const allowedGet = new RegExp(`^/workers/scripts/(?:${QA.worker}|${PRODUCTION.worker})/(?:settings|secrets|schedules|subdomain|deployments|versions(?:/[a-f0-9-]{36})?)$`);
    const isGet = !options.method || options.method === "GET";
    requireCondition((isGet && (allowedGet.test(path) || path === `/d1/database/${QA.database}`)) ||
      (options.method === "POST" && path === `/workers/scripts/${QA.worker}/deployments`),
    "This release forbids that Cloudflare endpoint or mutation.");
    const body = await json(API + path, { ...options, headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN.trim()}`, "Content-Type": "application/json",
    } });
    requireCondition(body.success === true, "Cloudflare did not confirm the QA release request.");
    return body.result;
  }
  return { api, json };
}

function settingsConfiguration(settings) {
  // Code/static-asset contents and version annotations change with the version.
  // All other settings remain; the new annotations are checked independently.
  return Object.fromEntries(Object.entries(settings).filter(([key]) => !["bindings", "assets", "annotations"].includes(key)));
}

async function inspectWorker(api, worker, expectedVersion, { latestMustMatch = true } = {}) {
  const prefix = `/workers/scripts/${worker}`;
  const [settings, secrets, deployments, schedules, subdomain, versions] = await Promise.all([
    api(`${prefix}/settings`), api(`${prefix}/secrets`), api(`${prefix}/deployments`),
    api(`${prefix}/schedules`), api(`${prefix}/subdomain`), api(`${prefix}/versions`),
  ]);
  const deployment = currentDeployment(deployments, expectedVersion);
  requireCondition(Array.isArray(schedules?.schedules) && typeof subdomain?.enabled === "boolean", "Worker route/schedule metadata is unavailable.");
  requireCondition(Array.isArray(versions?.items) && versions.items.length > 0 && UUID.test(versions.items[0]?.id ?? ""), "Worker uploaded-version inventory is unavailable.");
  if (latestMustMatch) requireCondition(versions.items[0].id === expectedVersion, "An undeployed Worker version requires review before inheriting bindings.");
  const bindings = normalizeBindings(settings?.bindings, secrets);
  const activeVersion = await api(`${prefix}/versions/${expectedVersion}`);
  requireCondition(activeVersion?.id === expectedVersion && activeVersion.resources?.script_runtime, "Deployed Worker version metadata is unavailable.");
  requireCondition(fingerprint(normalizeBindings(activeVersion.resources.bindings)) === fingerprint(bindings), "Worker settings and active-version bindings disagree.");
  return {
    worker, deploymentId: deployment.id, versionId: expectedVersion, latestVersionId: versions.items[0].id,
    bindings, runtime: activeVersion.resources.script_runtime,
    bindingFingerprint: fingerprint(bindings), settingsFingerprint: fingerprint(settingsConfiguration(settings)),
    routingFingerprint: fingerprint({ schedules, subdomain }),
    settings, schedules, subdomain,
  };
}

function sanitizedSnapshot(snapshot) {
  return Object.fromEntries(["worker", "deploymentId", "versionId", "latestVersionId", "bindingFingerprint", "settingsFingerprint", "routingFingerprint"].map(key => [key, snapshot[key]]));
}

function sameLease(actual, expected, { versionMayChange = false, uploadedVersion } = {}) {
  for (const name of ["worker", "bindingFingerprint", "settingsFingerprint", "routingFingerprint"])
    requireCondition(actual[name] === expected[name], "Worker bindings, settings or routes changed during the release lease.");
  if (!versionMayChange) {
    requireCondition(actual.deploymentId === expected.deploymentId && actual.versionId === expected.versionId,
      "The Worker deployment changed during the release lease.");
  }
  requireCondition(actual.latestVersionId === (uploadedVersion ?? expected.latestVersionId), "The newest Worker version changed during the release lease.");
}

export function createQaConfig(repositoryConfig, qaSnapshot) {
  const configured = repositoryConfig?.env?.qa;
  requireCondition(repositoryConfig?.name === PRODUCTION.worker && repositoryConfig.keep_vars === true &&
    repositoryConfig.main === ".open-next/worker.js" && configured && !configured.route && !configured.routes && !configured.custom_domains &&
    configured.d1_databases?.length === 1 && configured.d1_databases[0].binding === "DB" && configured.d1_databases[0].database_id === QA.database &&
    configured.services?.length === 1 && configured.services[0].binding === "WORKER_SELF_REFERENCE" && configured.services[0].service === QA.worker &&
    configured.assets?.binding === "ASSETS" && configured.assets.directory === ".open-next/assets",
  "Repository QA configuration is not the reviewed isolated target.");
  requireCondition(repositoryConfig.compatibility_date === qaSnapshot.runtime.compatibility_date &&
    fingerprint([...(repositoryConfig.compatibility_flags ?? [])].sort()) === fingerprint([...(qaSnapshot.runtime.compatibility_flags ?? [])].sort()),
  "The QA runtime compatibility configuration changed and requires review.");
  // Wrangler versions-upload maintains grouping tags with a settings PATCH
  // when they differ. Refuse before upload unless its derived tags are already
  // exactly present, including order, so this code-only release causes no PATCH.
  const tags = qaSnapshot.settings.tags ?? [];
  requireCondition(Array.isArray(tags) && tags.every(tag => typeof tag === "string"), "QA grouping metadata is unavailable.");
  const uploaderTags = [
    ...tags.filter(tag => !tag.startsWith("cf:service=") && !tag.startsWith("cf:environment=")),
    `cf:service=${PRODUCTION.worker}`, "cf:environment=qa",
  ];
  requireCondition(fingerprint(tags) === fingerprint(uploaderTags), "QA grouping metadata would be changed by the uploader; review before release.");
  validateQaBindings(qaSnapshot.bindings);
  // Keep the original service/environment grouping. There are no production
  // resource bindings in this generated file. Both upload args and API target
  // independently pin the QA Worker; normal deploy/triggers deploy are unused.
  return {
    $schema: "node_modules/wrangler/config-schema.json", name: PRODUCTION.worker,
    main: repositoryConfig.main, account_id: ACCOUNT, keep_vars: true,
    compatibility_date: qaSnapshot.runtime.compatibility_date,
    compatibility_flags: qaSnapshot.runtime.compatibility_flags,
    env: { qa: {
      name: QA.worker, vars: { ...EXPECTED_VARS },
      assets: { directory: ".open-next/assets", binding: "ASSETS" },
      services: [{ binding: "WORKER_SELF_REFERENCE", service: QA.worker }],
      d1_databases: [{ binding: "DB", database_name: "vanesch-qa", database_id: QA.database }],
    } },
  };
}

async function verifyPublicQa(json, fetchImpl) {
  const health = await json(`${QA.site}/api/health`);
  requireCondition(health?.status === "ok" && health.d1 === "connected" && health.supabase === "not_required", "QA health did not confirm D1 with Supabase unnecessary.");
  for (const path of ["/", "/diagnostic", "/diagnostic-assessment"]) {
    let response;
    try { response = await fetchImpl(QA.site + path, { redirect: "manual", signal: AbortSignal.timeout(30000) }); }
    catch { throw new Error("QA public page request failed."); }
    requireCondition(response.status === 200 && /text\/html/i.test(response.headers.get("content-type") ?? ""), "A QA public page did not load after release.");
  }
  const advisor = await fetchImpl(`${QA.site}/advisor`, { redirect: "manual", signal: AbortSignal.timeout(30000) });
  const location = advisor.headers.get("location");
  let login;
  try { login = location && new URL(location); } catch { /* reject below */ }
  requireCondition([302, 303, 307].includes(advisor.status) && login?.origin === "https://gregvanesch.cloudflareaccess.com", "QA advisor no longer redirects anonymous users to the established Access login.");
}

export async function prepareQaRelease({ request, env, git, repositoryConfig, fetchImpl = fetch, now = Date.now() }) {
  validateRequest(request, env, git, now);
  const { api, json } = apiClient(env, fetchImpl);
  const [qa, production, database] = await Promise.all([
    inspectWorker(api, QA.worker, request.expectedQaVersionId),
    inspectWorker(api, PRODUCTION.worker, request.expectedProductionVersionId, { latestMustMatch: false }),
    api(`/d1/database/${QA.database}`),
  ]);
  requireCondition((database?.uuid ?? database?.id) === QA.database && database?.name === "vanesch-qa", "QA database identity is not verified.");
  requireCondition(qa.subdomain.enabled === true, "QA workers.dev routing is disabled.");
  const prodDb = production.bindings.find(binding => binding.name === "DB");
  requireCondition(prodDb?.type === "d1" && prodDb.id === PRODUCTION.database, "Existing production D1 binding is unexpected.");
  const config = createQaConfig(repositoryConfig, qa);
  await verifyPublicQa(json, fetchImpl);
  const checkpoint = {
    requestFingerprint: fingerprint(request), sourceCommit: git.head, configFingerprint: fingerprint(config),
    preparedAt: new Date(now).toISOString(), qa: sanitizedSnapshot(qa), production: sanitizedSnapshot(production),
  };
  return { config, checkpoint };
}

export async function deployQaRelease({ request, env, git, config, checkpoint, fetchImpl = fetch, uploadImpl, now = Date.now(), onEvidence = async () => {} }) {
  validateRequest(request, env, git, now);
  requireCondition(checkpoint?.requestFingerprint === fingerprint(request) && checkpoint.sourceCommit === git.head &&
    checkpoint.configFingerprint === fingerprint(config) && now - Date.parse(checkpoint.preparedAt) >= 0 && now - Date.parse(checkpoint.preparedAt) <= 60 * 60 * 1000,
  "The prepared QA release checkpoint is stale or does not match this candidate.");
  requireCondition(typeof uploadImpl === "function", "The controlled QA upload operation is unavailable.");
  const { api, json } = apiClient(env, fetchImpl);
  const [qaBefore, prodBefore] = await Promise.all([
    inspectWorker(api, QA.worker, request.expectedQaVersionId),
    inspectWorker(api, PRODUCTION.worker, request.expectedProductionVersionId, { latestMustMatch: false }),
  ]);
  sameLease(qaBefore, checkpoint.qa);
  sameLease(prodBefore, checkpoint.production);
  const tag = `retirement-${fingerprint(request).slice(0, 24)}`;
  // OpenNext passes unknown arguments through its package-manager shell. Keep
  // these generated metadata values to a restricted alphabet without spaces.
  const message = `qa-retirement-${git.head}`;
  let uploadedVersion;
  try { uploadedVersion = await uploadImpl({ configPath: CONFIG_PATH, tag, message }); }
  catch { throw new Error("QA upload failed or timed out; this script will not repeat the upload or activate a guessed version."); }
  requireCondition(UUID.test(uploadedVersion ?? "") && uploadedVersion !== request.expectedQaVersionId, "QA upload did not return one new valid version; activation stopped.");
  await onEvidence({ stage: "uploaded_not_activated", previousQaVersion: request.expectedQaVersionId, uploadedQaVersion: uploadedVersion, productionVersion: request.expectedProductionVersionId });
  const candidate = await api(`/workers/scripts/${QA.worker}/versions/${uploadedVersion}`);
  requireCondition(candidate?.id === uploadedVersion && candidate.annotations?.["workers/tag"] === tag && candidate.annotations?.["workers/message"] === message,
    "Uploaded QA version does not match this candidate request.");
  const candidateBindings = normalizeBindings(candidate.resources?.bindings);
  validateQaBindings(candidateBindings);
  requireCondition(fingerprint(candidateBindings) === checkpoint.qa.bindingFingerprint &&
    fingerprint(candidate.resources?.script_runtime) === fingerprint(qaBefore.runtime),
  "Uploaded QA version would change existing bindings or runtime settings.");
  // Re-read after upload, immediately before changing QA traffic. No remote
  // database/secret/policy/route mutation is part of this lease or activation.
  const [qaLease, prodLease] = await Promise.all([
    inspectWorker(api, QA.worker, request.expectedQaVersionId, { latestMustMatch: false }),
    inspectWorker(api, PRODUCTION.worker, request.expectedProductionVersionId, { latestMustMatch: false }),
  ]);
  sameLease(qaLease, checkpoint.qa, { uploadedVersion });
  sameLease(prodLease, checkpoint.production);
  await onEvidence({ stage: "activation_requested_outcome_unknown", previousQaVersion: request.expectedQaVersionId, uploadedQaVersion: uploadedVersion, productionVersion: request.expectedProductionVersionId });
  await api(`/workers/scripts/${QA.worker}/deployments`, {
    method: "POST", body: JSON.stringify({ strategy: "percentage", versions: [{ version_id: uploadedVersion, percentage: 100 }], annotations: { "workers/message": message } }),
  });
  await onEvidence({ stage: "activated_verification_pending", previousQaVersion: request.expectedQaVersionId, deployedQaVersion: uploadedVersion, productionVersion: request.expectedProductionVersionId });
  const [qaAfter, prodAfter] = await Promise.all([
    inspectWorker(api, QA.worker, uploadedVersion),
    inspectWorker(api, PRODUCTION.worker, request.expectedProductionVersionId, { latestMustMatch: false }),
  ]);
  sameLease(qaAfter, checkpoint.qa, { versionMayChange: true, uploadedVersion });
  sameLease(prodAfter, checkpoint.production);
  await verifyPublicQa(json, fetchImpl);
  const report = {
    stage: "verified", requestId: request.requestId, candidateCommit: git.head,
    previousQaVersion: request.expectedQaVersionId, deployedQaVersion: uploadedVersion,
    productionVersion: request.expectedProductionVersionId, qaBindingsPreserved: true, qaRoutesAndSchedulesPreserved: true,
    productionUnchanged: true, healthD1Connected: true, healthSupabaseNotRequired: true,
    publicPagesPassed: true, anonymousAdvisorAccessProtected: true,
    databaseWrites: false, emailsSent: false, secretChanges: false, accessPolicyChanges: false,
  };
  await onEvidence(report);
  return report;
}

export function uploadArguments({ configPath, tag, message }) {
  requireCondition(configPath === CONFIG_PATH && /^retirement-[a-f0-9]{24}$/.test(tag) && /^qa-retirement-[a-f0-9]{40}$/.test(message), "QA upload arguments are invalid.");
  return [resolve("node_modules/@opennextjs/cloudflare/dist/cli/index.js"), "upload", "--config", CONFIG_PATH,
    "--env", "qa", "--name", QA.worker, "--tag", tag, "--message", message];
}

async function uploadCandidate(args) {
  let output;
  try {
    // The installed Wrangler uploader can internally retry inactive uploads
    // (up to three attempts). None routes traffic. This script launches it
    // once, and the separate activation POST below has no automatic retry.
    output = await promisify(execFile)(process.execPath, uploadArguments(args), {
      cwd: process.cwd(), env: { ...process.env, WRANGLER_SEND_METRICS: "false", CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false" },
      timeout: 5 * 60 * 1000, maxBuffer: 16 * 1024 * 1024,
    });
  } catch {
    // Wrangler output can contain binding values. Do not emit it, retry an
    // uncertain upload, or activate an unverified version found by guesswork.
    throw new Error("QA version upload failed or timed out; active traffic was not changed by this script. Inspect the uploaded-version inventory before retrying.");
  }
  const ids = [...output.stdout.matchAll(/Worker Version ID:\s*([a-f0-9-]{36})/gi)].map(match => match[1]);
  requireCondition(ids.length === 1 && UUID.test(ids[0]), "QA upload version identifier was not unambiguous; activation stopped.");
  return ids[0];
}

async function main() {
  const stage = process.argv[2];
  requireCondition(["prepare", "deploy"].includes(stage), "Use prepare or deploy for the QA-only release.");
  const git = {
    head: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    parent: execFileSync("git", ["rev-parse", "HEAD^"], { encoding: "utf8" }).trim(),
    changedPaths: execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], { encoding: "utf8" }).trim().split("\n").filter(Boolean),
  };
  const request = JSON.parse(await readFile(REQUEST_PATH, "utf8"));
  if (stage === "prepare") {
    const repositoryConfig = JSON.parse(await readFile("wrangler.jsonc", "utf8"));
    const result = await prepareQaRelease({ request, env: process.env, git, repositoryConfig });
    await writeFile(CONFIG_PATH, JSON.stringify(result.config, null, 2) + "\n", { mode: 0o600 });
    await writeFile(CHECKPOINT_PATH, JSON.stringify(result.checkpoint, null, 2) + "\n", { mode: 0o600 });
    console.log("QA-only version release prepared. Bindings, routes, schedules and production lease verified; no remote writes.");
    return;
  }
  const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
  const checkpoint = JSON.parse(await readFile(CHECKPOINT_PATH, "utf8"));
  const onEvidence = report => writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  const report = await deployQaRelease({ request, env: process.env, git, config, checkpoint, uploadImpl: uploadCandidate, onEvidence });
  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch(error => {
    // Only locally authored errors above are returned; avoid printing nested
    // process/API bodies, configuration, credentials or signed login URLs.
    console.error(error instanceof SyntaxError || error?.code ? "QA retirement release stopped; inspect sanitized evidence and current deployment before retrying." : error.message);
    process.exitCode = 1;
  });

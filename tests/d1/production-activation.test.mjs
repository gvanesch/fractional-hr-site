import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { activationFlags, validateActivationApproval, validateActivationDiff, validateSourceSnapshots, bindingFingerprint, inspectActivation, verifyActivationBundle } from "../../scripts/d1/prepare-approved-production-activation.mjs";

const account = "73221f18acc676e4992c89fcbf2b2a8f";
const database = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc";
const deploymentId = "341b4c25-b1e8-46e3-950f-eb33faaf1d89";
const sha = "a".repeat(40);
const env = { GITHUB_REPOSITORY: "gvanesch/fractional-hr-site", GITHUB_REF: "refs/heads/migration/d1", CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: "fixture-only-not-a-real-token", NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_" + "x".repeat(40), ACTIVATION_PREVIOUS_SHA: sha };
const approval = now => ({ approvedBy: "Greg van Esch", scope: "production-d1-activation-retain-password-auth-only", accountId: account, databaseId: database, worker: "fractional-hr-site", reviewedCommit: sha, expectedDeploymentId: deploymentId, confirmedAt: new Date(now).toISOString(), sourceVerification: "fresh-connector-snapshot", excludeExpiredRateLimits: true, bundleRunId: 100, bundleArtifactId: 200, bundleDigest: "sha256:" + "a".repeat(64) });
const config = JSON.parse(await readFile(new URL("../../wrangler.jsonc", import.meta.url)));
function bindings(mode = "off") {
  return [...activationFlags.map(name => ({name, type: "plain_text", text: mode})),
    {name: "DB", type: "d1", id: database}, {name: "NEXT_PUBLIC_APP_ENV", type: "plain_text", text: "production"},
    {name: "NEXT_PUBLIC_SUPABASE_URL", type: "plain_text", text: "https://qxddddhhpfrrxbaunwfw.supabase.co"},
    {name: "NEXT_PUBLIC_SITE_URL", type: "plain_text", text: "https://vanesch.uk"},
    ...["RESEND_API_KEY", "CLIENT_DIAGNOSTIC_OTP_SECRET", "INVITE_RATE_LIMIT_SALT", "CRON_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "ADVISOR_ALLOWED_EMAILS", "CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL", "DAILY_SUMMARY_RECIPIENT"].map(name => ({name, type: "secret_text"}))];
}
function fixtureFetch(rows, schedules = []) {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({url, options});
    const path = url.split("/").at(-1);
    const result = { settings: {bindings: rows}, secrets: rows.filter(row => row.type === "secret_text").map(({name, type}) => ({name, type})), schedules: {schedules}, deployments: {deployments: [{id: deploymentId, versions: [{version_id: "55fca225-7c0f-47ca-80c8-de4ece3d6d81", percentage: 100}]}]} }[path];
    assert.ok(result);
    return {ok: true, json: async () => ({success: true, result})};
  };
  return {fetchImpl, requests};
}

test("Activation rejects unapproved scope, wrong parent, stale approval, extra code and missing exclusions", () => {
  const now = Date.now(); const good = approval(now);
  validateActivationApproval(good, env, now);
  for (const changed of [null, {...good, scope: "production-worker-release-flags-off-only"}, {...good, reviewedCommit: "b".repeat(40)}, {...good, excludeExpiredRateLimits: false}, {...good, confirmedAt: new Date(now - 25 * 60 * 60 * 1000).toISOString()}, {...good, confirmedAt: new Date(now + 1000).toISOString()}, {...good, worker: "fractional-hr-site-qa"}])
    assert.throws(() => validateActivationApproval(changed, env, now));
  const files = ["scripts/d1/production-activation-approval.json", "scripts/d1/production-source-manifest.json", "scripts/d1/production-client-source-manifest.json"];
  validateActivationDiff(sha, files, good);
  assert.throws(() => validateActivationDiff(sha, [...files, "lib/advisor-auth.ts"], good));
  assert.throws(() => validateActivationDiff("b".repeat(40), files, good));
  assert.throws(() => validateActivationDiff(sha, files.slice(1), good));
});

test("Activation bundle must come from the reviewed successful build with the exact immutable artifact digest", async () => {
  const good = approval(Date.now());
  const run = {head_sha: sha, head_branch: "migration/d1", event: "push", path: ".github/workflows/d1-prod-activation-readiness.yml", repository: {full_name: "gvanesch/fractional-hr-site"}, status: "completed", conclusion: "success"};
  const artifact = {id: 200, name: "approved-d1-production-bundle", expired: false, digest: good.bundleDigest};
  const fetchFixture = (r, a) => async (url, options) => {
    assert.equal(options.method, undefined);
    return {ok: true, json: async () => url.endsWith("/artifacts") ? {artifacts: [a]} : r};
  };
  await verifyActivationBundle(good, "fixture", fetchFixture(run, artifact));
  for (const changed of [{head_sha: "b".repeat(40)}, {conclusion: "failure"}, {head_branch: "main"}, {path: "qa.yml"}])
    await assert.rejects(verifyActivationBundle(good, "fixture", fetchFixture({...run, ...changed}, artifact)));
  for (const changed of [{expired: true}, {digest: "sha256:" + "b".repeat(64)}, {id: 201}])
    await assert.rejects(verifyActivationBundle(good, "fixture", fetchFixture(run, {...artifact, ...changed})));
});

test("Activation blocks stale source, new client data and active rate limits", async () => {
  const now = Date.now();
  const historical = JSON.parse(await readFile(new URL("../../scripts/d1/production-source-manifest.json", import.meta.url)));
  const client = JSON.parse(await readFile(new URL("../../scripts/d1/production-client-source-manifest.json", import.meta.url)));
  historical.generatedAt = client.generatedAt = new Date(now).toISOString();
  validateSourceSnapshots(historical, client, now);
  assert.throws(() => validateSourceSnapshots({...historical, generatedAt: new Date(now - 16 * 60 * 1000).toISOString()}, client, now));
  assert.throws(() => validateSourceSnapshots({...historical, source: "qa"}, client, now));
  assert.throws(() => validateSourceSnapshots(historical, {...client, tables: {...client.tables, client_projects: 1}}, now));
  for (const changed of [{activeBlocks: 1}, {recentWindows: 1}, {count: -1}])
    assert.throws(() => validateSourceSnapshots(historical, {...client, expiredRateLimits: {...client.expiredRateLimits, ...changed}}, now));
});

test("Activation inspection is read-only, preserves password auth and detects unrelated configuration changes", async () => {
  const beforeRows = bindings(); const before = fixtureFetch(beforeRows);
  const state = await inspectActivation({env, config, fetchImpl: before.fetchImpl});
  assert.equal(state.deploymentId, deploymentId);
  assert.ok(before.requests.every(({options, url}) => !options.method && url.includes("/workers/scripts/fractional-hr-site/")));
  const after = fixtureFetch(bindings("d1"));
  const deployed = await inspectActivation({env, config, deployed: true, fetchImpl: after.fetchImpl});
  assert.equal(deployed.bindingFingerprint, state.bindingFingerprint);
  const authChanged = [...beforeRows, {name: "ADVISOR_AUTH_MODE", type: "plain_text", text: "cloudflare_access"}];
  await assert.rejects(inspectActivation({env, config, fetchImpl: fixtureFetch(authChanged).fetchImpl}));
  await assert.rejects(inspectActivation({env, config, fetchImpl: fixtureFetch(beforeRows, [{cron: "0 7 * * *"}]).fetchImpl}));
  const wrongDb = beforeRows.map(row => row.name === "DB" ? {...row, id: "b25d59da-5f93-4301-9996-7be0c9708789"} : row);
  await assert.rejects(inspectActivation({env, config, fetchImpl: fixtureFetch(wrongDb).fetchImpl}));
  await assert.rejects(inspectActivation({env, config, fetchImpl: fixtureFetch(bindings("d1")).fetchImpl}));
  const missing = beforeRows.filter(row => row.name !== "D1_SYSTEM_EVENTS_MODE");
  await assert.rejects(inspectActivation({env, config, fetchImpl: fixtureFetch(missing).fetchImpl}));
  assert.notEqual(bindingFingerprint(new Map(beforeRows.map(row => [row.name, row]))), bindingFingerprint(new Map([...beforeRows, {name: "extra", type: "plain_text", text: "changed"}].map(row => [row.name, row]))));
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateReleaseApproval, validateReleaseConfig } from "../../scripts/d1/prepare-approved-production-release.mjs";

test("Production release refuses unapproved commits, cutover scope, stale approval and missing real settings", async () => {
  const now = Date.now();
  const sha = "a".repeat(40);
  const env = { GITHUB_REF: "refs/heads/migration/d1", GITHUB_REPOSITORY: "gvanesch/fractional-hr-site", CLOUDFLARE_ACCOUNT_ID: "73221f18acc676e4992c89fcbf2b2a8f", RELEASE_PREVIOUS_SHA: sha, NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_" + "x".repeat(40) };
  const approval = { approvedBy: "Greg van Esch", scope: "production-worker-release-flags-off-only", accountId: env.CLOUDFLARE_ACCOUNT_ID, worker: "fractional-hr-site", databaseId: "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc", reviewedCommit: sha, expectedDeploymentId: "182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e", confirmedAt: new Date(now).toISOString() };
  validateReleaseApproval(approval, env, now);
  for (const changed of [null, {...approval, scope: "cutover"}, {...approval, reviewedCommit: "b".repeat(40)}, {...approval, confirmedAt: new Date(now - 25 * 60 * 60 * 1000).toISOString()}, {...approval, worker: "fractional-hr-site-qa"}])
    assert.throws(() => validateReleaseApproval(changed, env, now));
  const config = JSON.parse(await readFile(new URL("../../wrangler.jsonc", import.meta.url)));
  const names = ["RESEND_API_KEY", "CLIENT_DIAGNOSTIC_OTP_SECRET", "INVITE_RATE_LIMIT_SALT", "CRON_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "ADVISOR_ALLOWED_EMAILS"];
  const bindings = new Map(names.map(name => [name, {name, type: "secret_text"}]));
  for (const name of ["CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL", "DAILY_SUMMARY_RECIPIENT"]) bindings.set(name, {name, type: "plain_text", text: "fixture@example.com"});
  validateReleaseConfig(config, bindings, env);
  assert.throws(() => validateReleaseConfig(config, bindings, {...env, NEXT_PUBLIC_SUPABASE_ANON_KEY: "ci-placeholder-anon-key"}));
  const wrongRoleKey = "eyJhbGciOiJIUzI1NiJ9." + Buffer.from(JSON.stringify({role: "service_role", ref: "qxddddhhpfrrxbaunwfw"})).toString("base64url") + ".fixture";
  assert.throws(() => validateReleaseConfig(config, bindings, {...env, NEXT_PUBLIC_SUPABASE_ANON_KEY: wrongRoleKey}));
  for (const name of names) {
    const missing = new Map(bindings); missing.delete(name);
    assert.throws(() => validateReleaseConfig(config, missing, env));
  }
  assert.throws(() => validateReleaseConfig({...config, vars: {...config.vars, D1_CLIENT_DIAGNOSTIC_MODE: "d1"}}, bindings, env));
  const enabled = new Map(bindings); enabled.set("D1_SYSTEM_EVENTS_MODE", {text: "d1"});
  assert.throws(() => validateReleaseConfig(config, enabled, env));
  const qaDb = new Map(bindings); qaDb.set("DB", {id: "b25d59da-5f93-4301-9996-7be0c9708789"});
  assert.throws(() => validateReleaseConfig(config, qaDb, env));
  const access = new Map(bindings); access.set("ADVISOR_AUTH_MODE", {text: "cloudflare_access"});
  assert.throws(() => validateReleaseConfig(config, access, env));
  assert.throws(() => validateReleaseConfig({...config, vars: {...config.vars, ADVISOR_AUTH_MODE: "cloudflare_access"}}, bindings, env));
});

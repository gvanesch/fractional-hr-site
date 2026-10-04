import test from "node:test";
import assert from "node:assert/strict";
import { approvedMail, inspectBindings, validateMailApproval } from "../../scripts/d1/configure-approved-production-mail.mjs";
test("Production mail configuration pins exact approved values, target and flags-off boundary", () => {
  const now = Date.now();
  const env = { GITHUB_REF: "refs/heads/migration/d1", GITHUB_REPOSITORY: "gvanesch/fractional-hr-site", CLOUDFLARE_ACCOUNT_ID: "73221f18acc676e4992c89fcbf2b2a8f" };
  const approval = { approvedBy: "Greg van Esch", scope: "production-three-mail-settings-only", accountId: env.CLOUDFLARE_ACCOUNT_ID, worker: "fractional-hr-site", confirmedAt: new Date(now).toISOString(), values: approvedMail };
  validateMailApproval(approval, env, now);
  for (const changed of [null, {...approval, worker: "fractional-hr-site-qa"}, {...approval, scope: "production-release"}, {...approval, values: {...approvedMail, CRON_SECRET: "unapproved"}}, {...approval, confirmedAt: new Date(now - 25 * 60 * 60 * 1000).toISOString()}])
    assert.throws(() => validateMailApproval(changed, env, now));
  assert.throws(() => validateMailApproval(approval, {...env, GITHUB_REF: "refs/heads/main"}, now));
  inspectBindings({bindings: [{name: "RESEND_API_KEY", type: "secret_text"}]});
  assert.throws(() => inspectBindings({bindings: []}));
  assert.throws(() => inspectBindings({bindings: [{name: "RESEND_API_KEY"}, {name: "D1_SYSTEM_EVENTS_MODE", text: "d1"}]}));
  assert.throws(() => inspectBindings({bindings: [{name: "RESEND_API_KEY"}, {name: "DB", id: "b25d59da-5f93-4301-9996-7be0c9708789"}]}));
});

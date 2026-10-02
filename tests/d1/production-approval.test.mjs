import test from "node:test";
import assert from "node:assert/strict";
import { approvedSql, validateApproval } from "../../scripts/d1/apply-approved-production-schema.mjs";
test("Production schema executor requires current exact approval and reviewed SQL", () => {
  const now = Date.now();
  const env = { GITHUB_REF: "refs/heads/migration/d1", CLOUDFLARE_ACCOUNT_ID: "73221f18acc676e4992c89fcbf2b2a8f" };
  const approval = { approvedBy: "Greg van Esch", scope: "production-schema-0004-0005-only", databaseId: "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc", accountId: env.CLOUDFLARE_ACCOUNT_ID, confirmedAt: new Date(now).toISOString(), sqlHashes: approvedSql };
  validateApproval(approval, env, now);
  for (const changed of [null, { ...approval, scope: "cutover" }, { ...approval, databaseId: "b25d59da-5f93-4301-9996-7be0c9708789" }, { ...approval, sqlHashes: {} }, { ...approval, confirmedAt: new Date(now - 25 * 60 * 60 * 1000).toISOString() }])
    assert.throws(() => validateApproval(changed, env, now), /approval is absent or mismatched/);
  assert.throws(() => validateApproval(approval, { ...env, GITHUB_REF: "refs/heads/main" }, now));
});

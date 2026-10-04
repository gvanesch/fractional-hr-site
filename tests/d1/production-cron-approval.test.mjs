import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCronApproval, inspectCronBindings } from '../../scripts/d1/configure-approved-production-cron.mjs';
const approval = { approvedBy: 'Greg van Esch', scope: 'production-cron-credential-only', accountId: '73221f18acc676e4992c89fcbf2b2a8f', worker: 'fractional-hr-site', binding: 'CRON_SECRET', source: 'DAILY_SUMMARY_ENDPOINT_SECRET', confirmedAt: '2026-10-04T11:23:38Z' };
const env = { GITHUB_REF: 'refs/heads/migration/d1', GITHUB_REPOSITORY: 'gvanesch/fractional-hr-site', CLOUDFLARE_ACCOUNT_ID: approval.accountId, DAILY_SUMMARY_ENDPOINT_SECRET: 'test-only' };
const now = Date.parse(approval.confirmedAt);
test('cron approval rejects wrong targets, stale approval and unavailable credentials', () => {
  assert.doesNotThrow(() => validateCronApproval(approval, env, now));
  for (const field of ['scope', 'accountId', 'worker', 'binding', 'source', 'approvedBy'])
    assert.throws(() => validateCronApproval({ ...approval, [field]: 'wrong' }, env, now));
  for (const field of ['GITHUB_REF', 'GITHUB_REPOSITORY', 'CLOUDFLARE_ACCOUNT_ID', 'DAILY_SUMMARY_ENDPOINT_SECRET'])
    assert.throws(() => validateCronApproval(approval, { ...env, [field]: '' }, now));
  assert.throws(() => validateCronApproval(approval, env, now + 86400001));
  assert.throws(() => validateCronApproval(approval, env, now - 1));
});
test('cron configuration refuses existing credentials and active D1', () => {
  const bindings = [{ name: 'RESEND_API_KEY', type: 'secret_text' }];
  assert.equal(inspectCronBindings({ bindings }).size, 1);
  assert.throws(() => inspectCronBindings({ bindings: [...bindings, { name: 'CRON_SECRET', type: 'secret_text' }] }));
  assert.throws(() => inspectCronBindings({ bindings: [...bindings, { name: 'D1_CLIENT_DIAGNOSTIC_MODE', text: 'd1' }] }));
  assert.throws(() => inspectCronBindings({ bindings: [...bindings, { name: 'DB', id: 'qa' }] }));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyProductionPublicKey } from '../../scripts/d1/verify-production-public-key.mjs';
test('public build credential rejects server keys and wrong projects before any request', async () => {
  let calls = 0;
  const request = async () => { calls++; throw new Error('Unexpected request'); };
  const jwt = claims => 'eyJ.' + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.signature';
  for (const key of ['', 'ci-placeholder-anon-key', 'sb_secret_' + 'a'.repeat(40), jwt({role:'service_role',ref:'qxddddhhpfrrxbaunwfw'}),jwt({role:'anon',ref:'qa-project'})])
    await assert.rejects(verifyProductionPublicKey(key, request));
  assert.equal(calls, 0);
});
test('public build credential is verified by GET against only the production Auth endpoint', async () => {
  const key = 'sb_publishable_' + 'a'.repeat(40);
  let cancelled = false;
  await verifyProductionPublicKey(key, async (url, options) => {
    assert.equal(url, 'https://qxddddhhpfrrxbaunwfw.supabase.co/auth/v1/settings');
    assert.equal(options.method, 'GET');
    assert.equal(options.headers.apikey, key);
    return {status:200,body:{cancel:async()=>{cancelled=true;}}};
  });
  assert.equal(cancelled,true);
  await assert.rejects(verifyProductionPublicKey(key, async()=>({status:401})), /verification failed/);
});

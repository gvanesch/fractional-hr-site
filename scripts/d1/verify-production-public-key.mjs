// Validate the configured browser credential with a read-only Auth settings request.
// Never emit the key, authorization headers, response body or user data.
export async function verifyProductionPublicKey(key, request = fetch) {
  key = key?.trim();
  if (!key || key.length < 30 || /placeholder|example|qa-test/i.test(key))
    throw new Error('Production public build credential is unavailable.');
  if (key.startsWith('eyJ')) {
    let claims;
    try { claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url')); } catch {}
    if (claims?.role !== 'anon' || claims?.ref !== 'qxddddhhpfrrxbaunwfw')
      throw new Error('Production public build credential has the wrong role or project.');
  } else if (!key.startsWith('sb_publishable_')) {
    throw new Error('Production public build credential has an unexpected format.');
  }
  const response = await request('https://qxddddhhpfrrxbaunwfw.supabase.co/auth/v1/settings', {
    method: 'GET', headers: { apikey: key }, signal: AbortSignal.timeout(15000),
  });
  if (response.status !== 200) throw new Error('Production public build credential verification failed.');
  // Settings are public configuration; discard the body rather than log it.
  await response.body?.cancel();
}

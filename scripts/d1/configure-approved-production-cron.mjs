import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { inspectBindings } from './configure-approved-production-mail.mjs';
const account = '73221f18acc676e4992c89fcbf2b2a8f';
const worker = 'fractional-hr-site';
export function validateCronApproval(approval, env, now = Date.now()) {
  const age = now - Date.parse(approval?.confirmedAt);
  if (env.GITHUB_REF !== 'refs/heads/migration/d1' || env.GITHUB_REPOSITORY !== 'gvanesch/fractional-hr-site' ||
      env.CLOUDFLARE_ACCOUNT_ID !== account || approval?.approvedBy !== 'Greg van Esch' ||
      approval.scope !== 'production-cron-credential-only' || approval.accountId !== account ||
      approval.worker !== worker || approval.binding !== 'CRON_SECRET' ||
      approval.source !== 'DAILY_SUMMARY_ENDPOINT_SECRET' || !Number.isFinite(age) || age < 0 || age > 86400000)
    throw new Error('Current approval for the exact production cron credential is unavailable.');
  if (!env.DAILY_SUMMARY_ENDPOINT_SECRET?.trim()) throw new Error('Configured scheduler credential is unavailable.');
}
export function inspectCronBindings(settings) {
  const bindings = inspectBindings(settings);
  if (bindings.has('CRON_SECRET')) throw new Error('Production cron credential already exists; do not overwrite it.');
  return bindings;
}
async function main() {
  const approval = JSON.parse(await readFile(new URL('./production-cron-approval.json', import.meta.url)));
  validateCronApproval(approval, process.env);
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!token) throw new Error('Configured Cloudflare credential is unavailable.');
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${worker}`;
  async function request(path, options = {}) {
    const response = await fetch(endpoint + path, {
      ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Production cron request failed (HTTP ${response.status}).`);
    const body = await response.json();
    if (!body.success) throw new Error('Production cron request was rejected.');
    return body.result;
  }
  const initial = inspectCronBindings(await request('/settings'));
  const result = await request('/secrets', {
    method: 'PUT', body: JSON.stringify({ name: 'CRON_SECRET', text: process.env.DAILY_SUMMARY_ENDPOINT_SECRET.trim(), type: 'secret_text' }),
  });
  if (result?.name !== 'CRON_SECRET' || result?.type !== 'secret_text') throw new Error('Cron update was not acknowledged.');
  console.log('CRON_SECRET: configured from the existing GitHub scheduler credential');
  const final = inspectBindings(await request('/settings'));
  if (final.get('CRON_SECRET')?.type !== 'secret_text') throw new Error('Cron binding is missing after update.');
  if (final.size !== initial.size + 1) throw new Error('Unexpected production binding inventory change.');
  for (const [name, binding] of initial)
    if (JSON.stringify(final.get(name)) !== JSON.stringify(binding)) throw new Error('An unrelated production binding changed.');
  console.log('Other bindings preserved; all five D1 flags remain off. No schedule change, application code upload or email test performed.');
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  main().catch(() => { console.error('Production cron configuration stopped. Inspect the job and binding inventory before retrying; do not retry blindly.'); process.exitCode = 1; });

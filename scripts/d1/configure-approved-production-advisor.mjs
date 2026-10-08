import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { inspectBindings } from './configure-approved-production-mail.mjs';
const account = '73221f18acc676e4992c89fcbf2b2a8f';
const worker = 'fractional-hr-site';
export function validateAdvisorApproval(approval, env, now = Date.now()) {
  const age = now - Date.parse(approval?.confirmedAt);
  if (env.GITHUB_REF !== 'refs/heads/migration/d1' || env.GITHUB_REPOSITORY !== 'gvanesch/fractional-hr-site' ||
      env.CLOUDFLARE_ACCOUNT_ID !== account || approval?.approvedBy !== 'Greg van Esch' ||
      approval.scope !== 'production-advisor-allowlist-only' || approval.accountId !== account ||
      approval.worker !== worker || approval.binding !== 'ADVISOR_ALLOWED_EMAILS' ||
      approval.value !== 'greg@vanesch.uk' || !Number.isFinite(age) || age < 0 || age > 86400000)
    throw new Error('Current approval for the exact production advisor allowlist is unavailable.');
}
export function inspectAdvisorBindings(settings) {
  const bindings = inspectBindings(settings);
  if ((bindings.get('ADVISOR_AUTH_MODE')?.text ?? 'supabase') !== 'supabase') throw new Error('Production advisor login method changed.');
  if (bindings.has('ADVISOR_ALLOWED_EMAILS')) throw new Error('Production advisor allowlist already exists; do not overwrite it.');
  return bindings;
}
async function main() {
  const approval = JSON.parse(await readFile(new URL('./production-advisor-approval.json', import.meta.url)));
  validateAdvisorApproval(approval, process.env);
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!token) throw new Error('Configured Cloudflare credential is unavailable.');
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${worker}`;
  async function request(path, options = {}) {
    const response = await fetch(endpoint + path, {
      ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Production advisor request failed (HTTP ${response.status}).`);
    const body = await response.json();
    if (!body.success) throw new Error('Production advisor request was rejected.');
    return body.result;
  }
  const initial = inspectAdvisorBindings(await request('/settings'));
  const result = await request('/secrets', {
    method: 'PUT', body: JSON.stringify({ name: 'ADVISOR_ALLOWED_EMAILS', text: 'greg@vanesch.uk', type: 'secret_text' }),
  });
  if (result?.name !== 'ADVISOR_ALLOWED_EMAILS' || result?.type !== 'secret_text') throw new Error('Advisor update was not acknowledged.');
  console.log('ADVISOR_ALLOWED_EMAILS: configured as greg@vanesch.uk only');
  const final = inspectBindings(await request('/settings'));
  if ((final.get('ADVISOR_AUTH_MODE')?.text ?? 'supabase') !== 'supabase') throw new Error('Production advisor login method changed.');
  if (final.get('ADVISOR_ALLOWED_EMAILS')?.type !== 'secret_text') throw new Error('Advisor binding is missing after update.');
  if (final.size !== initial.size + 1) throw new Error('Unexpected production binding inventory change.');
  for (const [name, binding] of initial)
    if (JSON.stringify(final.get(name)) !== JSON.stringify(binding)) throw new Error('An unrelated production binding changed.');
  console.log('Other bindings and Supabase login method preserved; all five D1 flags remain off. No Access policy change, application code upload or email test performed.');
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  main().catch(() => { console.error('Production advisor configuration stopped. Inspect the job and binding inventory before retrying; do not retry blindly.'); process.exitCode = 1; });

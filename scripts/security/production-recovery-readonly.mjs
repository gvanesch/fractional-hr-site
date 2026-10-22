// GET-only metadata inspection: no query, export, restore, settings or deployment writes.
const account = "73221f18acc676e4992c89fcbf2b2a8f";
const database = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc";
const worker = "fractional-hr-site";
if (
  process.env.GITHUB_REPOSITORY !== "gvanesch/fractional-hr-site" ||
  process.env.GITHUB_REF !== "refs/heads/feature/team-blue-baseline" ||
  process.env.CLOUDFLARE_ACCOUNT_ID !== account ||
  !process.env.CLOUDFLARE_API_TOKEN
) throw Error("Read-only recovery context differs");
async function get(path, optional = false) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/${path}`, {
    method: "GET", headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    if (optional) return { available: false, status: response.status };
    throw Error(`Production metadata read failed: HTTP ${response.status}`);
  }
  const body = await response.json();
  if (!body.success) {
    if (optional) return { available: false, status: response.status };
    throw Error("Production metadata read rejected");
  }
  return { available: true, result: body.result };
}
const settings = (await get(`workers/scripts/${worker}/settings`)).result;
const bindings = new Map(settings.bindings.map((b) => [b.name,b]));
if (
  (bindings.get("DB")?.id ?? bindings.get("DB")?.database_id) !== database ||
  bindings.get("BASELINE_MAIL_MODE")?.text !== "send" ||
  (bindings.get("ADVISOR_AUTH_MODE")?.text ?? "supabase") !== "supabase"
) throw Error("Production baseline storage/auth/mail checkpoint differs");
const deployment = (await get(`workers/scripts/${worker}/deployments`)).result.deployments?.[0];
const version = deployment?.versions?.[0];
if (deployment?.versions?.length !== 1 || version.percentage !== 100 || version.version_id !== "3570dea7-eecc-43a1-a9d7-257120822a92")
  throw Error("Production version changed; review checkpoint before proceeding");
const current = await get(`d1/database/${database}/time_travel/bookmark`, true);
const previous = await get(`d1/database/${database}/time_travel/bookmark?timestamp=${encodeURIComponent(new Date(Date.now()-86400000).toISOString())}`, true);
console.log(JSON.stringify({
  productionVersionUnchanged: true, storageAuthMailUnchanged: true,
  currentRecoveryBookmarkAvailable: Boolean(current.available && current.result?.bookmark),
  recoveryBookmark24HoursAgoAvailable: Boolean(previous.available && previous.result?.bookmark),
  restoreRehearsalPerformed: false, backupWindowVerified: false,
  productionWrites: false, emailSent: false,
},null,2));

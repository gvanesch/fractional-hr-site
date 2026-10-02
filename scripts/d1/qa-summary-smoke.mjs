// QA-only authenticated dry runs. No email sends, schedules, or production writes.
// QA has no scheduled callers; rotate its cron secret for the test and again after.
import { randomBytes } from "node:crypto";
const account = "73221f18acc676e4992c89fcbf2b2a8f";
const worker = "fractional-hr-site-qa";
const database = "b25d59da-5f93-4301-9996-7be0c9708789";
const site = "https://fractional-hr-site-qa.greg-732.workers.dev";
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (process.env.GITHUB_REF !== "refs/heads/migration/d1" ||
    process.env.CLOUDFLARE_ACCOUNT_ID !== account || !token)
  throw new Error("QA summary target is not verified.");
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${worker}`;
async function cloudflare(path, options = {}) {
  const response = await fetch(endpoint + path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`QA settings/secret request failed: HTTP ${response.status}.`);
  const body = await response.json();
  if (!body.success) throw new Error("QA settings/secret request was rejected.");
  return body.result;
}
const settings = await cloudflare("/settings");
const bindings = new Map((settings.bindings ?? []).map(row => [row.name, row]));
if ((bindings.get("DB")?.database_id ?? bindings.get("DB")?.id) !== database ||
    bindings.get("DAILY_SUMMARY_RECIPIENT")?.text !== "greg@vanesch.uk" ||
    ["SYSTEM_EVENTS", "DIAGNOSTIC_SUBMISSIONS", "CRM_PROSPECTS", "CLIENT_DIAGNOSTIC", "CLIENT_DIAGNOSTIC_SECURITY"]
      .some(name => bindings.get(`D1_${name}_MODE`)?.text !== "d1"))
  throw new Error("QA summary bindings are not isolated and ready.");
const schedules = await cloudflare("/schedules");
if (!Array.isArray(schedules.schedules) || schedules.schedules.length !== 0)
  throw new Error("QA has scheduled callers; refuse to rotate its cron secret.");
const paths = ["/api/cron/advisor-daily-action-digest", "/api/client-diagnostic-daily-summary"];
for (const path of paths) {
  for (const authorization of [null, "Bearer deliberately-invalid"]) {
    const response = await fetch(site + path + "?dryRun=true", {
      method: "POST", redirect: "manual",
      headers: authorization ? { Authorization: authorization } : {},
      signal: AbortSignal.timeout(15000),
    });
    if (response.status !== 403) throw new Error(`QA summary unauthorized boundary: HTTP ${response.status}.`);
  }
}
const secret = randomBytes(32).toString("base64url");
const rotate = text => cloudflare("/secrets", {
  method: "PUT", body: JSON.stringify({ name: "CRON_SECRET", text, type: "secret_text" }),
});
try {
  await rotate(secret);
  for (const path of paths) {
    let passed = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await fetch(site + path + "?dryRun=true", {
        method: "POST", redirect: "manual",
        headers: { Authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(15000),
      });
      if (response.status === 200) {
        const body = await response.json();
        if (body.success !== true || body.dryRun !== true || typeof body.emailGenerated !== "boolean")
          throw new Error("QA summary did not confirm a dry run.");
        passed = true;
        break;
      }
      if (response.status !== 403) throw new Error(`QA summary dry run failed: HTTP ${response.status}.`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    if (!passed) throw new Error("QA cron-secret propagation did not complete.");
    console.log(`${path}: unauthorized rejected; authenticated dry run passed`);
  }
} finally {
  await rotate(randomBytes(32).toString("base64url"));
  console.log("QA cron secret rotated after test. No email sent or schedule enabled.");
}

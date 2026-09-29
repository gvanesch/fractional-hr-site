// Create only missing, random QA security bindings. Never print values or API bodies.
import { randomBytes } from "node:crypto";

const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const worker = "fractional-hr-site-qa";
const database = "b25d59da-5f93-4301-9996-7be0c9708789";
const qaAccess = {
  CLOUDFLARE_ACCESS_AUD:
    "19bef4d23cdda972d6c46c5b3bf85f1758b9efdbf87758cc798ffbcd766af4e9",
  CLOUDFLARE_ACCESS_TEAM_DOMAIN: "https://gregvanesch.cloudflareaccess.com",
};
if (
  account !== "73221f18acc676e4992c89fcbf2b2a8f" ||
  process.env.GITHUB_REF !== "refs/heads/migration/d1" ||
  !token
)
  throw new Error("QA security target or credential is unavailable.");
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${worker}`;
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};
const response = await fetch(`${endpoint}/settings`, { headers });
if (!response.ok)
  throw new Error(`Unable to verify QA Worker settings (HTTP ${response.status}).`);
const settings = await response.json();
if (!settings.success || !Array.isArray(settings.result?.bindings))
  throw new Error("Invalid QA Worker settings response.");
const bindings = new Map(settings.result.bindings.map((entry) => [entry.name, entry]));
if ((bindings.get("DB")?.database_id ?? bindings.get("DB")?.id) !== database)
  throw new Error("QA Worker D1 binding does not match vanesch-qa.");
for (const name of [
  "CLIENT_DIAGNOSTIC_OTP_SECRET",
  "INVITE_RATE_LIMIT_SALT",
  "ADVISOR_ALLOWED_EMAILS",
  "CLOUDFLARE_ACCESS_AUD",
  "CLOUDFLARE_ACCESS_TEAM_DOMAIN",
]) {
  if (bindings.has(name)) {
    console.log(`${name}: already configured`);
    continue;
  }
  const result = await fetch(`${endpoint}/secrets`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      name,
      text: name === "ADVISOR_ALLOWED_EMAILS"
        ? "greg@vanesch.uk"
        : qaAccess[name] ?? randomBytes(32).toString("base64url"),
      type: "secret_text",
    }),
  });
  if (!result.ok)
    throw new Error(`Unable to configure ${name} (HTTP ${result.status}).`);
  const body = await result.json();
  if (!body.success || body.result?.name !== name)
    throw new Error(`Unable to verify ${name} creation.`);
  console.log(`${name}: configured`);
}

// Read-only, sanitized audit of the deployed QA Worker bindings.
// Never print a Cloudflare API response: bindings can contain secret material.
import { readFile } from "node:fs/promises";

const config = JSON.parse(
  await readFile(new URL("../../wrangler.jsonc", import.meta.url)),
);
const qa = config.env.qa;
const production = config.d1_databases.find(
  (binding) => binding.binding === "DB",
);
const expectedDb = qa.d1_databases.find((binding) => binding.binding === "DB");
if (
  !expectedDb ||
  expectedDb.database_name !== "vanesch-qa" ||
  expectedDb.database_id === production.database_id
) {
  throw new Error("The QA D1 target is missing or points to production.");
}

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
if (!token || !account)
  throw new Error("Cloudflare read credentials are unavailable.");
const worker = qa.services.find(
  (binding) => binding.binding === "WORKER_SELF_REFERENCE",
)?.service;
if (worker !== "fractional-hr-site-qa")
  throw new Error("Unexpected QA Worker name.");
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${worker}/settings`,
  {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  },
);
if (response.status === 404) {
  // Confirm whether the QA script exists without printing account inventory or bindings.
  const listing = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
  );
  if (!listing.ok)
    throw new Error(`QA Worker settings returned HTTP 404; Worker inventory returned HTTP ${listing.status}.`);
  const inventory = await listing.json();
  if (!inventory.success || !Array.isArray(inventory.result))
    throw new Error("QA Worker settings returned HTTP 404; Worker inventory was invalid.");
  const deployed = inventory.result.some((script) => script.id === worker);
  throw new Error(
    deployed
      ? "QA Worker is listed, but its settings returned HTTP 404."
      : "QA Worker is not deployed in the configured Cloudflare account.",
  );
}
if (!response.ok)
  throw new Error(
    `Unable to inspect QA Worker settings (HTTP ${response.status}).`,
  );
const body = await response.json();
if (!body.success || !Array.isArray(body.result?.bindings))
  throw new Error("QA Worker binding response is invalid.");
const bindings = new Map(
  body.result.bindings.map((entry) => [entry.name, entry]),
);
const checks = {
  qaD1Target:
    (bindings.get("DB")?.database_id ?? bindings.get("DB")?.id) ===
    expectedDb.database_id,
  ...Object.fromEntries(
    Object.entries(qa.vars).map(([name, expected]) => [
      name,
      bindings.get(name)?.type === "plain_text" &&
        bindings.get(name)?.text === expected,
    ]),
  ),
  advisorAllowlistConfigured: bindings.has("ADVISOR_ALLOWED_EMAILS"),
  accessAudienceConfigured: bindings.has("CLOUDFLARE_ACCESS_AUD"),
  accessTeamDomainConfigured: bindings.has("CLOUDFLARE_ACCESS_TEAM_DOMAIN"),
  otpSecretConfigured: bindings.has("CLIENT_DIAGNOSTIC_OTP_SECRET"),
  inviteRateLimitSaltConfigured: bindings.has("INVITE_RATE_LIMIT_SALT"),
  emailTransportConfigured:
    bindings.has("RESEND_API_KEY") &&
    bindings.has("CONTACT_FROM_EMAIL") &&
    bindings.has("CONTACT_TO_EMAIL"),
};
// Output names and booleans only; this cannot leak secret values or respondent data.
for (const [name, passed] of Object.entries(checks))
  console.log(`${name}: ${passed ? "ready" : "missing_or_mismatched"}`);
if (Object.values(checks).some((value) => !value)) process.exitCode = 1;

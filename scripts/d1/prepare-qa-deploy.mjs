// QA-only deployment guard. The prepared config is written to the CI checkout,
// never to production Cloudflare settings or the repository.
import { readFile, writeFile } from "node:fs/promises";

const configUrl = new URL("../../wrangler.jsonc", import.meta.url);
const config = JSON.parse(await readFile(configUrl, "utf8"));
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (account !== "73221f18acc676e4992c89fcbf2b2a8f" || !token)
  throw new Error("QA deploy account or credential is unavailable.");
if (process.env.GITHUB_REF !== "refs/heads/migration/d1")
  throw new Error("QA deployment requires migration/d1.");
const production = config.d1_databases?.find((item) => item.binding === "DB");
const qa = config.env?.qa;
const database = qa?.d1_databases?.find((item) => item.binding === "DB");
if (
  config.name !== "fractional-hr-site" ||
  production?.database_id !== "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc" ||
  database?.database_name !== "vanesch-qa" ||
  database?.database_id !== "b25d59da-5f93-4301-9996-7be0c9708789" ||
  qa?.services?.find((item) => item.binding === "WORKER_SELF_REFERENCE")
    ?.service !== "fractional-hr-site-qa" ||
  qa.routes ||
  qa.route ||
  qa.custom_domains
)
  throw new Error("QA deploy target is not isolated from production.");
const flags = [
  "D1_SYSTEM_EVENTS_MODE",
  "D1_DIAGNOSTIC_SUBMISSIONS_MODE",
  "D1_CRM_PROSPECTS_MODE",
  "D1_CLIENT_DIAGNOSTIC_MODE",
  "D1_CLIENT_DIAGNOSTIC_SECURITY_MODE",
];
if (
  flags.some((name) => config.vars?.[name] !== "off" || qa.vars?.[name] !== "d1") ||
  qa.vars?.ADVISOR_AUTH_MODE !== "cloudflare_access"
)
  throw new Error("QA D1/Access flags or production-off flags are unexpected.");

const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${account}/workers/subdomain`,
  { headers: { Authorization: `Bearer ${token}` } },
);
if (!response.ok)
  throw new Error(`Unable to resolve the QA Workers subdomain (HTTP ${response.status}).`);
const body = await response.json();
const subdomain = body.success && body.result?.subdomain;
if (typeof subdomain !== "string" || !/^[a-z0-9-]+$/.test(subdomain))
  throw new Error("The account has no valid Workers subdomain.");
const siteUrl = `https://fractional-hr-site-qa.${subdomain}.workers.dev`;
qa.vars.NEXT_PUBLIC_APP_ENV = "qa";
qa.vars.NEXT_PUBLIC_SUPABASE_URL =
  "https://lrlapaiyejvbckqpbrwa.supabase.co";
qa.vars.NEXT_PUBLIC_SITE_URL = siteUrl;
await writeFile(configUrl, JSON.stringify(config, null, 2) + "\n");
await writeFile(
  process.env.GITHUB_ENV,
  `NEXT_PUBLIC_APP_ENV=qa\nNEXT_PUBLIC_SUPABASE_URL=${qa.vars.NEXT_PUBLIC_SUPABASE_URL}\nNEXT_PUBLIC_SITE_URL=${siteUrl}\n`,
  { flag: "a" },
);
console.log("QA deployment target verified; production flags remain off.");

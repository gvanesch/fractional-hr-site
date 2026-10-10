import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
export function validate(config, ref) {
  const qa = config.env?.qa;
  const database = qa?.d1_databases?.find((d) => d.binding === "DB");
  if (
    ref !== "refs/heads/feature/team-blue-baseline" ||
    config.name !== "fractional-hr-site" ||
    config.d1_databases?.find((d) => d.binding === "DB")?.database_id !==
      "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc" ||
    database?.database_id !== "b25d59da-5f93-4301-9996-7be0c9708789" ||
    database.database_name !== "vanesch-qa" ||
    qa.services?.find((s) => s.binding === "WORKER_SELF_REFERENCE")?.service !==
      "fractional-hr-site-qa" ||
    qa.route ||
    qa.routes ||
    qa.custom_domains ||
    qa.vars?.ADVISOR_AUTH_MODE !== "cloudflare_access" ||
    qa.vars?.BASELINE_ENABLED !== "true" ||
    qa.vars?.BASELINE_MAIL_MODE !== "preview" ||
    config.vars?.BASELINE_ENABLED
  )
    throw new Error(
      "Baseline deployment must use the isolated, preview-only QA target.",
    );
  const flags = [
    "D1_SYSTEM_EVENTS_MODE",
    "D1_DIAGNOSTIC_SUBMISSIONS_MODE",
    "D1_CRM_PROSPECTS_MODE",
    "D1_CLIENT_DIAGNOSTIC_MODE",
    "D1_CLIENT_DIAGNOSTIC_SECURITY_MODE",
  ];
  if (flags.some((f) => config.vars[f] !== "off" || qa.vars[f] !== "d1"))
    throw new Error("Production flags must remain off; QA flags must use D1.");
  return qa;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === new URL(import.meta.url).pathname
) {
  const url = new URL("../../wrangler.jsonc", import.meta.url);
  const config = JSON.parse(await readFile(url, "utf8"));
  const qa = validate(config, process.env.GITHUB_REF);
  const account = process.env.CLOUDFLARE_ACCOUNT_ID,
    token = process.env.CLOUDFLARE_API_TOKEN;
  if (
    account !== "73221f18acc676e4992c89fcbf2b2a8f" ||
    !token ||
    !process.env.GITHUB_ENV
  )
    throw new Error("QA credential or CI environment unavailable.");
  const result = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/workers/subdomain`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!result.ok)
    throw new Error(`QA target lookup failed: HTTP ${result.status}`);
  const body = await result.json(),
    subdomain = body.success && body.result?.subdomain;
  if (typeof subdomain !== "string" || !/^[a-z0-9-]+$/.test(subdomain))
    throw new Error("Invalid QA subdomain.");
  qa.vars.NEXT_PUBLIC_APP_ENV = "qa";
  qa.vars.NEXT_PUBLIC_SITE_URL = `https://fractional-hr-site-qa.${subdomain}.workers.dev`;
  qa.vars.NEXT_PUBLIC_SUPABASE_URL = "https://lrlapaiyejvbckqpbrwa.supabase.co";
  // Only this command's QA DB migration history is replaced; the production binding is untouched.
  qa.d1_databases.find((d) => d.binding === "DB").migrations_dir =
    "baseline-migrations";
  qa.d1_databases.find((d) => d.binding === "DB").migrations_table =
    "tb_baseline_migrations";
  await writeFile(url, JSON.stringify(config, null, 2) + "\n");
  await writeFile(
    process.env.GITHUB_ENV,
    Object.entries(qa.vars)
      .filter(([key]) => key.startsWith("NEXT_PUBLIC_"))
      .map(([k, v]) => `${k}=${v}\n`)
      .join(""),
    { flag: "a" },
  );
  console.log(
    "QA-only baseline target verified. Production configuration preserved; email preview only.",
  );
}

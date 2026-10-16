// Read-only production checkpoint. Never print binding values, credentials or data rows.
const account = "73221f18acc676e4992c89fcbf2b2a8f",
  database = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc";
if (
  process.env.GITHUB_REF !== "refs/heads/feature/team-blue-baseline" ||
  process.env.CLOUDFLARE_ACCOUNT_ID !== account ||
  !process.env.CLOUDFLARE_API_TOKEN
)
  throw Error("Read-only audit target unavailable");
const headers = { Authorization: "Bearer " + process.env.CLOUDFLARE_API_TOKEN };
const r = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/fractional-hr-site/settings`,
  { headers },
);
if (!r.ok) throw Error("Production settings read failed: HTTP " + r.status);
const b = await r.json();
if (!b.success || !Array.isArray(b.result?.bindings))
  throw Error("Invalid settings");
const map = new Map(b.result.bindings.map((x) => [x.name, x]));
for (const n of [
  "D1_SYSTEM_EVENTS_MODE",
  "D1_DIAGNOSTIC_SUBMISSIONS_MODE",
  "D1_CRM_PROSPECTS_MODE",
  "D1_CLIENT_DIAGNOSTIC_MODE",
  "D1_CLIENT_DIAGNOSTIC_SECURITY_MODE",
]) {
  const value = map.get(n)?.text ?? "off";
  if (!["off", "d1"].includes(value)) throw Error("Unknown production mode");
  console.log(n + ": " + value);
}
console.log(
  "Production D1 binding matches expected database: " +
    ((map.get("DB")?.id ?? map.get("DB")?.database_id) === database),
);
console.log(
  "Production advisor authentication: " +
    (map.get("ADVISOR_AUTH_MODE")?.text === "cloudflare_access"
      ? "Cloudflare Access"
      : "Supabase / existing login"),
);
const sql = "SELECT name FROM d1_migrations ORDER BY id";
const q = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,
  {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params: [] }),
  },
);
if (!q.ok)
  throw Error("Production migration history read failed: HTTP " + q.status);
const history = await q.json();
if (!history.success || history.result?.some((x) => !x.success))
  throw Error("Migration history unavailable");
for (const row of history.result[0].results)
  if (/^\d{4}[_a-z0-9.-]+\.sql$/i.test(row.name))
    console.log("Applied production migration: " + row.name);
console.log(
  "Read-only checkpoint complete. No production writes or deployment performed.",
);
